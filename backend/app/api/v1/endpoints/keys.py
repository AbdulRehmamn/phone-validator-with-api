import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_api_key, generate_api_key
from app.models.models import ApiKey
from app.schemas.validation import ApiKeyCreateRequest, ApiKeyResponse

router = APIRouter()

@router.get("", response_model=List[ApiKeyResponse], summary="List all API keys")
async def list_api_keys(
    admin: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ApiKey).order_by(ApiKey.created_at.desc()))
    keys = result.scalars().all()
    return [
        ApiKeyResponse(
            id=k.id,
            name=k.name,
            key=None,
            prefix=k.prefix,
            rate_limit_per_min=k.rate_limit_per_min,
            total_requests=k.total_requests or 0,
            is_active=k.is_active,
            created_at=k.created_at.isoformat() if k.created_at else "",
            last_used_at=k.last_used_at.isoformat() if k.last_used_at else None
        )
        for k in keys
    ]


@router.post("", response_model=ApiKeyResponse, summary="Generate a new API key")
async def create_new_api_key(
    payload: ApiKeyCreateRequest,
    admin: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    full_key, key_hash, prefix = generate_api_key()
    new_key = ApiKey(
        name=payload.name,
        key_hash=key_hash,
        prefix=prefix,
        rate_limit_per_min=payload.rate_limit_per_min,
        is_active=True
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return ApiKeyResponse(
        id=new_key.id,
        name=new_key.name,
        key=full_key,
        prefix=new_key.prefix,
        rate_limit_per_min=new_key.rate_limit_per_min,
        total_requests=0,
        is_active=True,
        created_at=new_key.created_at.isoformat(),
        last_used_at=None
    )


@router.patch("/{key_id}/toggle", summary="Toggle API key active status")
async def toggle_api_key(
    key_id: str,
    admin: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    k = result.scalar_one_or_none()
    if not k:
        raise HTTPException(status_code=404, detail="API key not found")
    
    k.is_active = not k.is_active
    await db.commit()
    return {"id": k.id, "is_active": k.is_active, "message": f"API key {'activated' if k.is_active else 'revoked'}."}


@router.patch("/{key_id}/rate-limit", summary="Update API key rate limit")
async def update_rate_limit(
    key_id: str,
    rate_limit: int,
    admin: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    k = result.scalar_one_or_none()
    if not k:
        raise HTTPException(status_code=404, detail="API key not found")

    k.rate_limit_per_min = max(0, rate_limit)
    await db.commit()
    return {"id": k.id, "rate_limit_per_min": k.rate_limit_per_min, "message": "Rate limit updated."}


@router.delete("/{key_id}", summary="Delete an API key")
async def delete_api_key(
    key_id: str,
    admin: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    k = result.scalar_one_or_none()
    if not k:
        raise HTTPException(status_code=404, detail="API key not found")

    await db.delete(k)
    await db.commit()
    return {"message": "API key successfully deleted."}
