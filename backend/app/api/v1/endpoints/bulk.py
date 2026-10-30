import os
import shutil
import uuid
import math
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.future import select
from sqlalchemy import func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import UPLOADS_DIR, EXPORTS_DIR
from app.core.database import get_db
from app.core.security import verify_api_key
from app.models.models import ValidationJob, ValidationResult, ApiKey
from app.schemas.validation import (
    BulkUploadResponse, BulkJobStatusResponse,
    PaginatedResultsResponse, ValidationResultItem, BulkStartRequest
)
from app.services.bulk_processor import BulkFileInspector, BulkProcessingEngine
from app.services.excel_exporter import BulkExporter

router = APIRouter()

@router.post("/upload", response_model=BulkUploadResponse, summary="Upload file for bulk validation")
async def upload_bulk_file(
    file: UploadFile = File(...),
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a CSV, TXT, XLS, or XLSX file containing up to 1,000,000 phone numbers.
    Streams directly to disk. Inspects column headers and sample data automatically.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".txt", ".csv", ".xls", ".xlsx"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Supported formats: .csv, .txt, .xls, .xlsx"
        )

    job_id = str(uuid.uuid4())
    saved_filename = f"{job_id}{ext}"
    dest_path = os.path.join(UPLOADS_DIR, saved_filename)

    # Stream write to disk without keeping in memory
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Inspect file
    try:
        inspection = BulkFileInspector.inspect(dest_path)
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=400, detail=f"Failed to inspect file: {str(e)}")

    job = ValidationJob(
        id=job_id,
        filename=file.filename,
        status="Uploaded",
        total_records=inspection["total_records"],
        file_path=dest_path,
        selected_column=inspection["best_column"]
    )
    db.add(job)
    await db.commit()

    return BulkUploadResponse(
        job_id=job_id,
        filename=file.filename,
        status="Uploaded",
        detected_columns=inspection["columns"],
        selected_column=inspection["best_column"],
        preview_rows=inspection["preview_rows"],
        total_records=inspection["total_records"],
        message="File uploaded and inspected successfully. Ready to start validation."
    )


@router.post("/{job_id}/start", summary="Start validation processing for an uploaded job")
async def start_bulk_validation(
    job_id: str,
    payload: BulkStartRequest,
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ValidationJob).where(ValidationJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Bulk job not found")

    if job.status in ["Processing", "Completed"]:
        return {"message": f"Job is already in {job.status} state."}

    selected_col = payload.selected_column or job.selected_column
    remove_dups = payload.remove_duplicates

    job.status = "Queued"
    job.selected_column = selected_col
    job.remove_duplicates = remove_dups
    await db.commit()

    BulkProcessingEngine.start_job(
        job_id=job.id,
        selected_column=selected_col,
        remove_duplicates=remove_dups
    )

    return {"status": "Processing", "message": "Bulk validation started in background."}


@router.get("/history", summary="List all bulk validation jobs")
async def get_bulk_history(
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ValidationJob).order_by(ValidationJob.created_at.desc()))
    jobs = result.scalars().all()
    
    return [
        BulkJobStatusResponse(
            job_id=j.id,
            filename=j.filename,
            status=j.status,
            total_records=j.total_records or 0,
            processed_records=j.processed_records or 0,
            remaining_records=j.remaining_records,
            percentage=j.percentage,
            valid_count=j.valid_count or 0,
            invalid_count=j.invalid_count or 0,
            mobile_count=j.mobile_count or 0,
            landline_count=j.landline_count or 0,
            voip_count=j.voip_count or 0,
            fixed_voip_count=j.fixed_voip_count or 0,
            non_fixed_voip_count=j.non_fixed_voip_count or 0,
            toll_free_count=j.toll_free_count or 0,
            unknown_count=j.unknown_count or 0,
            failed_count=j.failed_count or 0,
            speed_per_second=j.speed_per_second or 0.0,
            estimated_remaining_seconds=j.estimated_remaining_seconds or 0.0,
            remove_duplicates=j.remove_duplicates or False,
            created_at=j.created_at.isoformat() if j.created_at else None,
            updated_at=j.updated_at.isoformat() if j.updated_at else None,
            completed_at=j.completed_at.isoformat() if j.completed_at else None,
            error_message=j.error_message
        )
        for j in jobs
    ]


@router.get("/{job_id}", response_model=BulkJobStatusResponse, summary="Get job status and live progress")
async def get_bulk_job_status(
    job_id: str,
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ValidationJob).where(ValidationJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return BulkJobStatusResponse(
        job_id=job.id,
        filename=job.filename,
        status=job.status,
        total_records=job.total_records or 0,
        processed_records=job.processed_records or 0,
        remaining_records=job.remaining_records,
        percentage=job.percentage,
        valid_count=job.valid_count or 0,
        invalid_count=job.invalid_count or 0,
        mobile_count=job.mobile_count or 0,
        landline_count=job.landline_count or 0,
        voip_count=job.voip_count or 0,
        fixed_voip_count=job.fixed_voip_count or 0,
        non_fixed_voip_count=job.non_fixed_voip_count or 0,
        toll_free_count=job.toll_free_count or 0,
        unknown_count=job.unknown_count or 0,
        failed_count=job.failed_count or 0,
        speed_per_second=job.speed_per_second or 0.0,
        estimated_remaining_seconds=job.estimated_remaining_seconds or 0.0,
        remove_duplicates=job.remove_duplicates or False,
        created_at=job.created_at.isoformat() if job.created_at else None,
        updated_at=job.updated_at.isoformat() if job.updated_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        error_message=job.error_message
    )


@router.get("/{job_id}/results", response_model=PaginatedResultsResponse, summary="Retrieve paginated validation results")
async def get_job_results(
    job_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    filter_type: Optional[str] = Query(None, description="valid, invalid, mobile, landline, voip, toll_free, unknown, all"),
    search: Optional[str] = Query(None),
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * page_size
    query = select(ValidationResult).where(ValidationResult.job_id == job_id)
    count_query = select(func.count(ValidationResult.id)).where(ValidationResult.job_id == job_id)

    if filter_type and filter_type.lower() != "all":
        ft = filter_type.lower()
        if ft == "valid":
            query = query.where(ValidationResult.is_valid == True)
            count_query = count_query.where(ValidationResult.is_valid == True)
        elif ft == "invalid":
            query = query.where(ValidationResult.is_valid == False)
            count_query = count_query.where(ValidationResult.is_valid == False)
        elif ft == "mobile":
            query = query.where(ValidationResult.is_mobile == True)
            count_query = count_query.where(ValidationResult.is_mobile == True)
        elif ft == "landline":
            query = query.where(ValidationResult.is_landline == True)
            count_query = count_query.where(ValidationResult.is_landline == True)
        elif ft == "voip":
            query = query.where(ValidationResult.is_voip == True)
            count_query = count_query.where(ValidationResult.is_voip == True)
        elif ft in ["toll_free", "toll-free"]:
            query = query.where(ValidationResult.is_toll_free == True)
            count_query = count_query.where(ValidationResult.is_toll_free == True)
        elif ft == "unknown":
            query = query.where(ValidationResult.line_type == "UNKNOWN")
            count_query = count_query.where(ValidationResult.line_type == "UNKNOWN")

    if search:
        s = f"%{search.strip()}%"
        query = query.where(
            (ValidationResult.original_number.like(s)) |
            (ValidationResult.normalized_number.like(s)) |
            (ValidationResult.carrier.like(s)) |
            (ValidationResult.city.like(s)) |
            (ValidationResult.state.like(s))
        )
        count_query = count_query.where(
            (ValidationResult.original_number.like(s)) |
            (ValidationResult.normalized_number.like(s)) |
            (ValidationResult.carrier.like(s)) |
            (ValidationResult.city.like(s)) |
            (ValidationResult.state.like(s))
        )

    total_count_res = await db.execute(count_query)
    total_count = total_count_res.scalar() or 0

    results_res = await db.execute(query.order_by(ValidationResult.id.asc()).offset(offset).limit(page_size))
    items = results_res.scalars().all()

    total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1

    return PaginatedResultsResponse(
        job_id=job_id,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        filter_type=filter_type,
        results=[
            ValidationResultItem(
                id=item.id,
                original_number=item.original_number,
                normalized_number=item.normalized_number,
                formatted_national=item.formatted_national,
                is_valid=item.is_valid,
                country=item.country,
                country_code=item.country_code,
                area_code=item.area_code,
                state=item.state,
                city=item.city,
                carrier=item.carrier,
                line_type=item.line_type,
                is_mobile=item.is_mobile,
                is_landline=item.is_landline,
                is_voip=item.is_voip,
                is_fixed_voip=item.is_fixed_voip,
                is_non_fixed_voip=item.is_non_fixed_voip,
                is_toll_free=item.is_toll_free,
                error_message=item.error_message,
                created_at=item.created_at.isoformat() if item.created_at else None
            )
            for item in items
        ]
    )


@router.post("/{job_id}/pause", summary="Pause an active bulk job")
async def pause_job(job_id: str, api_key: Optional[ApiKey] = Depends(verify_api_key)):
    BulkProcessingEngine.pause_job(job_id)
    return {"status": "Paused", "message": f"Job {job_id} paused."}


@router.post("/{job_id}/resume", summary="Resume a paused bulk job")
async def resume_job(job_id: str, api_key: Optional[ApiKey] = Depends(verify_api_key)):
    BulkProcessingEngine.resume_job(job_id)
    return {"status": "Processing", "message": f"Job {job_id} resumed."}


@router.post("/{job_id}/cancel", summary="Cancel a bulk job")
async def cancel_job(job_id: str, api_key: Optional[ApiKey] = Depends(verify_api_key)):
    BulkProcessingEngine.cancel_job(job_id)
    return {"status": "Cancelled", "message": f"Job {job_id} cancelled."}


@router.post("/{job_id}/retry", summary="Retry failed or cancelled job")
async def retry_job(job_id: str, api_key: Optional[ApiKey] = Depends(verify_api_key), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ValidationJob).where(ValidationJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = "Queued"
    job.error_message = None
    await db.commit()

    BulkProcessingEngine.resume_job(job_id)
    return {"status": "Processing", "message": f"Job {job_id} retrying from current progress."}


@router.delete("/{job_id}", summary="Delete a bulk job and all its results")
async def delete_job(job_id: str, api_key: Optional[ApiKey] = Depends(verify_api_key), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ValidationJob).where(ValidationJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Stop if running
    BulkProcessingEngine.cancel_job(job_id)

    # Delete results
    await db.execute(delete(ValidationResult).where(ValidationResult.job_id == job_id))
    
    # Delete uploaded file if exists
    if job.file_path and os.path.exists(job.file_path):
        try:
            os.remove(job.file_path)
        except Exception:
            pass

    await db.delete(job)
    await db.commit()

    return {"message": f"Job {job_id} and all validation records successfully deleted."}


@router.get("/{job_id}/export", summary="Export bulk validation results to Excel or CSV")
async def export_job_results(
    job_id: str,
    format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    filter_type: Optional[str] = Query("all", description="all, valid, invalid, mobile, landline, voip, toll_free, unknown"),
    api_key: Optional[ApiKey] = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Downloads validated records in professional formatted Excel (.xlsx) or RFC-4180 CSV (.csv).
    Supports category filtering (Valid only, Invalid only, Mobile, Landline, VoIP, Toll-Free, Unknown).
    """
    result = await db.execute(select(ValidationJob).where(ValidationJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    filter_str = (filter_type or "all").lower()

    if format == "xlsx":
        export_path = BulkExporter.generate_excel(job_id, filter_str)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        download_name = f"{os.path.splitext(job.filename)[0]}_{filter_str}_validation.xlsx"
    else:
        export_path = BulkExporter.generate_csv(job_id, filter_str)
        media_type = "text/csv"
        download_name = f"{os.path.splitext(job.filename)[0]}_{filter_str}_validation.csv"

    return FileResponse(
        path=export_path,
        media_type=media_type,
        filename=download_name
    )
