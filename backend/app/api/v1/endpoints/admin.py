import os
import psutil
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_api_key
from app.models.models import ValidationJob, ValidationResult, ApiKey, ApiUsage
from app.schemas.validation import ApiUsageStatsResponse
from app.services.bulk_processor import JOB_CONTROLS, JOB_THREADS

router = APIRouter()

@router.get("/status", summary="System Health & Worker Status")
async def get_system_status():
    """
    Returns system health, active background workers, memory consumption, and uptime.
    """
    process = psutil.Process(os.getpid()) if hasattr(psutil, "Process") else None
    mem_info = process.memory_info() if process else None
    mem_mb = round(mem_info.rss / (1024 * 1024), 2) if mem_info else 0.0

    active_threads_count = sum(1 for t in JOB_THREADS.values() if t.is_alive())

    return {
        "status": "healthy",
        "service": "US Phone Number Validation Platform",
        "version": "1.0.0",
        "active_background_jobs": active_threads_count,
        "engine": "FastAPI + Chunked Streaming Bulk Engine",
        "memory_usage_mb": mem_mb,
        "database": "Operational"
    }


@router.get("/usage", response_model=ApiUsageStatsResponse, summary="API Usage and Analytics")
async def get_api_usage(
    admin: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    # Total API requests
    total_req_res = await db.execute(select(func.count(ApiUsage.id)))
    total_requests = total_req_res.scalar() or 0

    # Avg response time
    avg_res = await db.execute(select(func.avg(ApiUsage.response_time_ms)))
    avg_time = avg_res.scalar() or 0.0

    # Total Bulk Jobs
    jobs_count_res = await db.execute(select(func.count(ValidationJob.id)))
    total_bulk_jobs = jobs_count_res.scalar() or 0

    # Aggregates from ValidationResults
    total_results_res = await db.execute(select(func.count(ValidationResult.id)))
    total_validations = total_results_res.scalar() or 0

    valid_res = await db.execute(select(func.count(ValidationResult.id)).where(ValidationResult.is_valid == True))
    valid_count = valid_res.scalar() or 0

    invalid_res = await db.execute(select(func.count(ValidationResult.id)).where(ValidationResult.is_valid == False))
    invalid_count = invalid_res.scalar() or 0

    mobile_res = await db.execute(select(func.count(ValidationResult.id)).where(ValidationResult.is_mobile == True))
    mobile_count = mobile_res.scalar() or 0

    landline_res = await db.execute(select(func.count(ValidationResult.id)).where(ValidationResult.is_landline == True))
    landline_count = landline_res.scalar() or 0

    voip_res = await db.execute(select(func.count(ValidationResult.id)).where(ValidationResult.is_voip == True))
    voip_count = voip_res.scalar() or 0

    toll_free_res = await db.execute(select(func.count(ValidationResult.id)).where(ValidationResult.is_toll_free == True))
    toll_free_count = toll_free_res.scalar() or 0

    unknown_res = await db.execute(select(func.count(ValidationResult.id)).where(ValidationResult.line_type == "UNKNOWN"))
    unknown_count = unknown_res.scalar() or 0

    return ApiUsageStatsResponse(
        total_requests=total_requests,
        avg_response_time_ms=round(float(avg_time), 2),
        total_bulk_jobs=total_bulk_jobs,
        total_validations=total_validations,
        total_valid=valid_count,
        total_invalid=invalid_count,
        mobile_count=mobile_count,
        landline_count=landline_count,
        voip_count=voip_count,
        toll_free_count=toll_free_count,
        unknown_count=unknown_count
    )


@router.get("/admin/dashboard", summary="Comprehensive Dashboard Stats")
async def get_admin_dashboard(
    admin: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    stats = await get_api_usage(admin=admin, db=db)
    system = await get_system_status()

    # Get recent 5 jobs
    recent_jobs_res = await db.execute(
        select(ValidationJob).order_by(ValidationJob.created_at.desc()).limit(5)
    )
    recent_jobs = [
        {
            "id": j.id,
            "filename": j.filename,
            "status": j.status,
            "total_records": j.total_records,
            "processed_records": j.processed_records,
            "percentage": j.percentage,
            "created_at": j.created_at.isoformat() if j.created_at else None
        }
        for j in recent_jobs_res.scalars().all()
    ]

    return {
        "stats": stats,
        "system": system,
        "recent_jobs": recent_jobs
    }
