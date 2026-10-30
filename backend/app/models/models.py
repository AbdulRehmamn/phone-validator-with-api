import datetime
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
)
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class ValidationJob(Base):
    __tablename__ = "validation_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="Uploaded", index=True) 
    # Statuses: Uploaded, Queued, Processing, Paused, Completed, Failed, Cancelled
    
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    valid_count = Column(Integer, default=0)
    invalid_count = Column(Integer, default=0)
    
    mobile_count = Column(Integer, default=0)
    landline_count = Column(Integer, default=0)
    voip_count = Column(Integer, default=0)
    fixed_voip_count = Column(Integer, default=0)
    non_fixed_voip_count = Column(Integer, default=0)
    toll_free_count = Column(Integer, default=0)
    unknown_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    
    speed_per_second = Column(Float, default=0.0)
    estimated_remaining_seconds = Column(Float, default=0.0)
    
    remove_duplicates = Column(Boolean, default=False)
    selected_column = Column(String(100), nullable=True)
    file_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    @property
    def remaining_records(self) -> int:
        return max(0, (self.total_records or 0) - (self.processed_records or 0))

    @property
    def percentage(self) -> float:
        if not self.total_records or self.total_records == 0:
            return 0.0
        return round(min(100.0, (self.processed_records / self.total_records) * 100), 2)


class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), nullable=False, index=True)
    
    original_number = Column(String(100), nullable=False)
    normalized_number = Column(String(50), nullable=False, index=True)
    formatted_national = Column(String(50), nullable=True)
    is_valid = Column(Boolean, nullable=False, default=False, index=True)
    
    country = Column(String(50), default="United States")
    country_code = Column(String(10), default="+1")
    area_code = Column(String(10), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    carrier = Column(String(150), nullable=True)
    
    line_type = Column(String(50), nullable=False, default="UNKNOWN", index=True)
    # Line Types: MOBILE, LANDLINE, VOIP, FIXED_VOIP, NON_FIXED_VOIP, TOLL_FREE, UNKNOWN, INVALID
    
    is_mobile = Column(Boolean, default=False, index=True)
    is_landline = Column(Boolean, default=False)
    is_voip = Column(Boolean, default=False, index=True)
    is_fixed_voip = Column(Boolean, default=False)
    is_non_fixed_voip = Column(Boolean, default=False)
    is_toll_free = Column(Boolean, default=False, index=True)
    
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("ix_job_linetype", "job_id", "line_type"),
        Index("ix_job_isvalid", "job_id", "is_valid"),
    )


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key_hash = Column(String(64), unique=True, index=True, nullable=False)
    prefix = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    rate_limit_per_min = Column(Integer, default=0) # 0 means unlimited
    total_requests = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)


class ApiUsage(Base):
    __tablename__ = "api_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), default="GET")
    status_code = Column(Integer, default=200)
    response_time_ms = Column(Float, default=0.0)
    api_key_id = Column(String(36), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
