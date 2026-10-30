import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.core.security import verify_api_key
from app.models.models import ApiKey, ApiUsage, ValidationJob, ValidationResult
from app.schemas.validation import (
    SingleLookupRequest, SingleLookupResponse,
    BulkSubmitRequest
)
from app.services.classifier import USPhoneClassifier
from app.services.bulk_processor import BulkProcessingEngine
from app.core.config import UPLOADS_DIR

router = APIRouter()

@router.post("/validate", response_model=SingleLookupResponse, summary="Validate a single US phone number")
async def validate_single_phone(
    payload: SingleLookupRequest,
    request: Request,
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Validates and classifies a single US phone number.
    Returns validity, formatted number, carrier, location (city/state),
    and exact line type (Mobile, Landline, VoIP, Toll-Free, Unknown).
    """
    start_time = datetime.datetime.utcnow()
    classified = USPhoneClassifier.validate_and_classify(payload.phone_number, allow_network_lookup=True)

    # Log usage
    try:
        elapsed_ms = (datetime.datetime.utcnow() - start_time).total_seconds() * 1000
        usage = ApiUsage(
            endpoint="/api/v1/validate",
            method="POST",
            status_code=200,
            response_time_ms=elapsed_ms,
            api_key_id=api_key.id if api_key else None
        )
        db.add(usage)
        if api_key and api_key.id != "master-admin-key":
            res = await db.execute(select(ApiKey).where(ApiKey.id == api_key.id))
            k = res.scalar_one_or_none()
            if k:
                k.total_requests += 1
                k.last_used_at = datetime.datetime.utcnow()
        await db.commit()
    except Exception:
        pass

    return SingleLookupResponse(**classified)


@router.post("/validate/bulk", summary="Submit bulk phone numbers for background validation")
async def validate_bulk_json(
    payload: BulkSubmitRequest,
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts a list of US phone numbers (up to 1,000,000) for high-performance background validation.
    Returns a job_id immediately so callers can track progress or download results.
    """
    if not payload.phone_numbers:
        raise HTTPException(status_code=400, detail="phone_numbers list cannot be empty")

    job_id = str(uuid.uuid4())
    job_name = payload.job_name or f"bulk_api_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt"
    file_path = os.path.join(UPLOADS_DIR, f"{job_id}.txt")

    # Stream write to disk file to preserve low RAM
    with open(file_path, "w", encoding="utf-8") as f:
        for num in payload.phone_numbers:
            f.write(f"{str(num).strip()}\n")

    job = ValidationJob(
        id=job_id,
        filename=job_name,
        status="Queued",
        total_records=len(payload.phone_numbers),
        file_path=file_path,
        remove_duplicates=payload.remove_duplicates,
        selected_column="Phone Number"
    )
    db.add(job)
    await db.commit()

    # Launch background processing
    BulkProcessingEngine.start_job(
        job_id=job_id,
        selected_column="Phone Number",
        remove_duplicates=payload.remove_duplicates
    )

    return {
        "job_id": job_id,
        "filename": job_name,
        "total_records": len(payload.phone_numbers),
        "status": "Processing",
        "message": f"Successfully queued {len(payload.phone_numbers)} phone numbers for validation."
    }
