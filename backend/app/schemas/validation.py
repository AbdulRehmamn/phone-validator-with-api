from typing import Optional, List
from pydantic import BaseModel, Field
import datetime

class SingleLookupRequest(BaseModel):
    phone_number: str = Field(..., description="US phone number in any standard format", json_schema_extra={"example": "(415) 555-2671"})

class SingleLookupResponse(BaseModel):
    original_number: str
    normalized_number: str
    formatted_national: Optional[str] = None
    is_valid: bool
    country: str = "United States"
    country_code: str = "+1"
    area_code: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    carrier: Optional[str] = None
    line_type: str
    is_mobile: bool = False
    is_landline: bool = False
    is_voip: bool = False
    is_fixed_voip: bool = False
    is_non_fixed_voip: bool = False
    is_toll_free: bool = False
    error_message: Optional[str] = None

class BulkSubmitRequest(BaseModel):
    phone_numbers: List[str] = Field(..., description="List of US phone numbers to validate")
    remove_duplicates: bool = Field(default=False, description="Remove duplicate numbers before processing")
    job_name: Optional[str] = Field(default=None, description="Optional custom name for this bulk job")

class BulkUploadResponse(BaseModel):
    job_id: str
    filename: str
    status: str
    detected_columns: List[str] = []
    selected_column: Optional[str] = None
    preview_rows: List[dict] = []
    total_records: int
    message: str

class BulkStartRequest(BaseModel):
    selected_column: Optional[str] = None
    remove_duplicates: bool = False

class BulkJobStatusResponse(BaseModel):
    job_id: str
    filename: str
    status: str
    total_records: int
    processed_records: int
    remaining_records: int
    percentage: float
    valid_count: int
    invalid_count: int
    mobile_count: int
    landline_count: int
    voip_count: int
    fixed_voip_count: int
    non_fixed_voip_count: int
    toll_free_count: int
    unknown_count: int
    failed_count: int
    speed_per_second: float
    estimated_remaining_seconds: float
    remove_duplicates: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None

class ValidationResultItem(BaseModel):
    id: int
    original_number: str
    normalized_number: str
    formatted_national: Optional[str] = None
    is_valid: bool
    country: str
    country_code: str
    area_code: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    carrier: Optional[str] = None
    line_type: str
    is_mobile: bool
    is_landline: bool
    is_voip: bool
    is_fixed_voip: bool
    is_non_fixed_voip: bool
    is_toll_free: bool
    error_message: Optional[str] = None
    created_at: Optional[str] = None

class PaginatedResultsResponse(BaseModel):
    job_id: str
    total_count: int
    page: int
    page_size: int
    total_pages: int
    filter_type: Optional[str] = None
    results: List[ValidationResultItem]

class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Production Integration"})
    rate_limit_per_min: int = Field(default=0, description="0 for unlimited")

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key: Optional[str] = None  # Only returned upon initial creation
    prefix: str
    rate_limit_per_min: int
    total_requests: int
    is_active: bool
    created_at: str
    last_used_at: Optional[str] = None

class ApiUsageStatsResponse(BaseModel):
    total_requests: int
    avg_response_time_ms: float
    total_bulk_jobs: int
    total_validations: int
    total_valid: int
    total_invalid: int
    mobile_count: int
    landline_count: int
    voip_count: int
    toll_free_count: int
    unknown_count: int
