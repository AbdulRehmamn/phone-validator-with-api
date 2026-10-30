import hashlib
import secrets
import time
from typing import Optional, Tuple
from fastapi import Header, HTTPException, Security, status
from sqlalchemy.future import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.models import ApiKey

_RATE_LIMIT_CACHE: dict[str, list[float]] = {}

def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

def generate_api_key() -> Tuple[str, str, str]:
    token = secrets.token_hex(20)
    full_key = f"val_live_{token}"
    key_hash = hash_api_key(full_key)
    prefix = full_key[:14] + "..."
    return full_key, key_hash, prefix

def check_rate_limit(key_id: str, limit_per_min: int) -> bool:
    if limit_per_min <= 0:
        return True
    now = time.time()
    window_start = now - 60.0
    
    timestamps = _RATE_LIMIT_CACHE.setdefault(key_id, [])
    _RATE_LIMIT_CACHE[key_id] = [t for t in timestamps if t > window_start]
    
    if len(_RATE_LIMIT_CACHE[key_id]) >= limit_per_min:
        return False
        
    _RATE_LIMIT_CACHE[key_id].append(now)
    return True

async def verify_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None)
) -> Optional[ApiKey]:
    key_to_check = x_api_key
    if not key_to_check and authorization:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            key_to_check = parts[1]

    # Authorized Primary / Master / Configured keys
    if key_to_check in settings.ADDITIONAL_AUTHORIZED_KEYS or key_to_check == settings.PRIMARY_API_KEY:
        return ApiKey(
            id="val-primary-live-key",
            name="Production Live API Key",
            prefix=key_to_check[:14] + "...",
            rate_limit_per_min=0,
            is_active=True
        )

    # Local dashboard bypass when no key header is sent
    if not key_to_check:
        return None

    # Check DB
    key_hash = hash_api_key(key_to_check)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
        )
        api_key = result.scalar_one_or_none()
        
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or deactivated API Key"
        )
        
    if not check_rate_limit(api_key.id, api_key.rate_limit_per_min):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {api_key.rate_limit_per_min} requests/minute allowed"
        )
        
    return api_key
