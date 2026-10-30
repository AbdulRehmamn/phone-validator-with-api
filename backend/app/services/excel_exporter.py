import os
import csv
from typing import Optional, Generator
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from sqlalchemy import select
from app.core.config import EXPORTS_DIR
from app.core.database import SyncSessionLocal
from app.models.models import ValidationJob, ValidationResult

EXCEL_COLUMNS = [
    "Original Phone Number",
    "Normalized Phone Number",
    "Valid Status",
    "Country",
    "Country Code",
    "Area Code",
    "State",
    "City",
    "Carrier",
    "Line Type",
    "Is Mobile",
    "Is Landline",
    "Is VOIP",
    "Is Fixed VOIP",
    "Is Non-Fixed VOIP",
    "Is Toll-Free",
    "Error Message"
]

def format_row_data(row: ValidationResult) -> list:
    return [
        row.original_number or "",
        row.normalized_number or "",
        "VALID" if row.is_valid else "INVALID",
        row.country or "United States",
        row.country_code or "+1",
        row.area_code or "",
        row.state or "",
        row.city or "",
        row.carrier or "",
        row.line_type or "UNKNOWN",
        "YES" if row.is_mobile else "NO",
        "YES" if row.is_landline else "NO",
        "YES" if row.is_voip else "NO",
        "YES" if row.is_fixed_voip else "NO",
        "YES" if row.is_non_fixed_voip else "NO",
        "YES" if row.is_toll_free else "NO",
        row.error_message or ""
    ]

def get_filtered_query(session, job_id: str, filter_type: Optional[str] = None):
    query = select(ValidationResult).where(ValidationResult.job_id == job_id)
    if not filter_type or filter_type.lower() == "all":
        return query
    ft = filter_type.lower()
    if ft == "valid":
        return query.where(ValidationResult.is_valid == True)
    elif ft == "invalid":
        return query.where(ValidationResult.is_valid == False)
    elif ft == "mobile":
        return query.where(ValidationResult.is_mobile == True)
    elif ft == "landline":
        return query.where(ValidationResult.is_landline == True)
    elif ft == "voip":
        return query.where(ValidationResult.is_voip == True)
    elif ft == "toll_free" or ft == "toll-free":
        return query.where(ValidationResult.is_toll_free == True)
    elif ft == "unknown":
        return query.where(ValidationResult.line_type == "UNKNOWN")
    return query

class BulkExporter:
    @staticmethod
    def generate_excel(job_id: str, filter_type: Optional[str] = None) -> str:
        """
        Generates a professional multi-sheet Excel workbook.
        Sheet 1: Summary Report
        Sheet 2: Detailed Results
        Includes styling, autofilters, frozen headers, and auto-sized columns.
        """
        filename = f"validation_{job_id}_{filter_type or 'all'}.xlsx"
        output_path = os.path.join(EXPORTS_DIR, filename)

        with SyncSessionLocal() as session:
            job = session.query(ValidationJob).filter(ValidationJob.id == job_id).first()
            if not job:
                raise ValueError(f"Job {job_id} not found")

            wb = openpyxl.Workbook()
            
            # --- Sheet 1: Summary Sheet ---
            ws_summary = wb.active
            ws_summary.title = "Summary"
            ws_summary.views.sheetView[0].showGridLines = True

            # Styling definitions
            header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Dark Slate
            accent_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid") # Indigo
            sub_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
            title_font = Font(name="Calibri", size=16, bold=True, color="1E293B")
            section_font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
            bold_font = Font(name="Calibri", size=11, bold=True)
            regular_font = Font(name="Calibri", size=11)
            thin_border = Border(
                left=Side(style='thin', color='CBD5E1'),
                right=Side(style='thin', color='CBD5E1'),
                top=Side(style='thin', color='CBD5E1'),
                bottom=Side(style='thin', color='CBD5E1')
            )

            # Title
            ws_summary["B2"] = "US Phone Validation Report"
            ws_summary["B2"].font = title_font
            ws_summary["B3"] = f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Filter: {filter_type.upper() if filter_type else 'ALL'}"
            ws_summary["B3"].font = Font(name="Calibri", size=10, italic=True, color="64748B")

            # Job Details Table
            ws_summary["B5"] = "Job Overview"
            ws_summary["B5"].font = section_font
            ws_summary["B5"].fill = accent_fill
            ws_summary["C5"].fill = accent_fill

            overview_data = [
                ("Job ID", job.id),
                ("Filename", job.filename),
                ("Status", job.status),
                ("Total Uploaded", job.total_records),
                ("Processed Records", job.processed_records),
                ("Processing Speed", f"{job.speed_per_second:.1f} numbers/sec" if job.speed_per_second else "N/A"),
                ("Created At", job.created_at.strftime("%Y-%m-%d %H:%M:%S") if job.created_at else ""),
                ("Completed At", job.completed_at.strftime("%Y-%m-%d %H:%M:%S") if job.completed_at else "")
            ]

            curr_row = 6
            for label, val in overview_data:
                ws_summary[f"B{curr_row}"] = label
                ws_summary[f"B{curr_row}"].font = bold_font
                ws_summary[f"B{curr_row}"].fill = sub_fill
                ws_summary[f"B{curr_row}"].border = thin_border
                
                ws_summary[f"C{curr_row}"] = val
                ws_summary[f"C{curr_row}"].font = regular_font
                ws_summary[f"C{curr_row}"].border = thin_border
                curr_row += 1

            # Classification Breakdown Table
            curr_row += 1
            ws_summary[f"B{curr_row}"] = "Classification Metrics"
            ws_summary[f"B{curr_row}"].font = section_font
            ws_summary[f"B{curr_row}"].fill = header_fill
            ws_summary[f"C{curr_row}"] = "Count"
            ws_summary[f"C{curr_row}"].font = section_font
            ws_summary[f"C{curr_row}"].fill = header_fill
            curr_row += 1

            metrics = [
                ("Valid Numbers", job.valid_count),
                ("Invalid Numbers", job.invalid_count),
                ("Mobile / Cellular", job.mobile_count),
                ("Landline / Fixed Line", job.landline_count),
                ("Total VOIP", job.voip_count),
                ("  - Fixed VOIP", job.fixed_voip_count),
                ("  - Non-Fixed VOIP", job.non_fixed_voip_count),
                ("Toll-Free Numbers", job.toll_free_count),
                ("Unknown Line Type", job.unknown_count),
                ("Failed Records", job.failed_count)
            ]

            for label, count in metrics:
                ws_summary[f"B{curr_row}"] = label
                ws_summary[f"B{curr_row}"].font = bold_font
                ws_summary[f"B{curr_row}"].border = thin_border
                
                ws_summary[f"C{curr_row}"] = count
                ws_summary[f"C{curr_row}"].font = regular_font
                ws_summary[f"C{curr_row}"].alignment = Alignment(horizontal="right")
                ws_summary[f"C{curr_row}"].border = thin_border
                curr_row += 1

            ws_summary.column_dimensions["B"].width = 28
            ws_summary.column_dimensions["C"].width = 36

            # --- Sheet 2: Detailed Results ---
            ws_details = wb.create_sheet(title="Validation Results")
            ws_details.views.sheetView[0].showGridLines = True
            
            # Header Row
            ws_details.append(EXCEL_COLUMNS)
            for col_idx in range(1, len(EXCEL_COLUMNS) + 1):
                cell = ws_details.cell(row=1, column=col_idx)
                cell.font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal="center", vertical="center")

            # Fetch records in batches to stream into workbook
            batch_size = 5000
            offset = 0
            query = get_filtered_query(session, job_id, filter_type)

            while True:
                results_batch = session.execute(query.offset(offset).limit(batch_size)).scalars().all()
                if not results_batch:
                    break
                for row in results_batch:
                    ws_details.append(format_row_data(row))
                offset += len(results_batch)
                if len(results_batch) < batch_size:
                    break

            # Freeze header row
            ws_details.freeze_panes = "A2"
            # Enable autofilter
            max_col_letter = get_column_letter(len(EXCEL_COLUMNS))
            ws_details.auto_filter.ref = f"A1:{max_col_letter}{ws_details.max_row}"

            # Auto-adjust column widths
            for col in ws_details.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                # Sample up to first 50 rows for performance on large files
                sample_cells = col[:50]
                for cell in sample_cells:
                    val = str(cell.value or '')
                    if len(val) > max_len:
                        max_len = len(val)
                ws_details.column_dimensions[col_letter].width = max(max_len + 4, 12)

            wb.save(output_path)
            return output_path

    @staticmethod
    def generate_csv(job_id: str, filter_type: Optional[str] = None) -> str:
        """
        Generates a standard RFC-4180 CSV export.
        Streams records from database in chunks.
        """
        filename = f"validation_{job_id}_{filter_type or 'all'}.csv"
        output_path = os.path.join(EXPORTS_DIR, filename)

        with SyncSessionLocal() as session:
            query = get_filtered_query(session, job_id, filter_type)
            with open(output_path, mode="w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f)
                writer.writerow(EXCEL_COLUMNS)

                batch_size = 5000
                offset = 0
                while True:
                    results_batch = session.execute(query.offset(offset).limit(batch_size)).scalars().all()
                    if not results_batch:
                        break
                    for row in results_batch:
                        writer.writerow(format_row_data(row))
                    offset += len(results_batch)
                    if len(results_batch) < batch_size:
                        break

            return output_path
