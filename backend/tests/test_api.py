import pytest
from httpx import AsyncClient, ASGITransport
import io
from app.main import app
from app.core.database import init_db

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.anyio
async def test_health_and_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/status")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "memory_usage_mb" in data

@pytest.mark.anyio
async def test_single_validate_valid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/validate", json={"phone_number": "4155552671"})
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid"] is True
        assert data["normalized_number"] == "+14155552671"
        assert data["area_code"] == "415"
        assert data["state"] == "California"

@pytest.mark.anyio
async def test_single_validate_toll_free():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/validate", json={"phone_number": "1-800-432-1000"})
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid"] is True
        assert data["is_toll_free"] is True
        assert data["line_type"] == "TOLL_FREE"

@pytest.mark.anyio
async def test_single_validate_invalid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/validate", json={"phone_number": "0123456789"})
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid"] is False
        assert data["line_type"] == "INVALID"
        assert data["error_message"] is not None

@pytest.mark.anyio
async def test_api_keys_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create key
        res = await ac.post("/api/v1/keys", json={"name": "Test Runner Key", "rate_limit_per_min": 100})
        assert res.status_code == 200
        key_data = res.json()
        assert "key" in key_data
        assert key_data["key"].startswith("val_live_")
        key_id = key_data["id"]

        # List keys
        list_res = await ac.get("/api/v1/keys")
        assert list_res.status_code == 200
        keys_list = list_res.json()
        assert any(k["id"] == key_id for k in keys_list)

        # Toggle key
        toggle_res = await ac.patch(f"/api/v1/keys/{key_id}/toggle")
        assert toggle_res.status_code == 200
        assert toggle_res.json()["is_active"] is False

        # Delete key
        del_res = await ac.delete(f"/api/v1/keys/{key_id}")
        assert del_res.status_code == 200

@pytest.mark.anyio
async def test_bulk_csv_upload_and_export():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        csv_content = b"phone_number,customer_name\n4155552671,Alice\n8004321000,Bank\n0000000000,Bad\n"
        files = {"file": ("test_phones.csv", io.BytesIO(csv_content), "text/csv")}
        res = await ac.post("/api/v1/bulk/upload", files=files)
        assert res.status_code == 200
        upload_data = res.json()
        assert upload_data["status"] == "Uploaded"
        assert upload_data["selected_column"] == "phone_number"
        assert upload_data["total_records"] == 3
        job_id = upload_data["job_id"]

        # Start job
        start_res = await ac.post(f"/api/v1/bulk/{job_id}/start", json={"selected_column": "phone_number", "remove_duplicates": False})
        assert start_res.status_code == 200

        # Wait briefly for synchronous flush or check status
        import asyncio
        await asyncio.sleep(1.0)

        status_res = await ac.get(f"/api/v1/bulk/{job_id}")
        assert status_res.status_code == 200
        st = status_res.json()
        assert st["job_id"] == job_id

        # Results endpoint
        results_res = await ac.get(f"/api/v1/bulk/{job_id}/results?page=1&page_size=10")
        assert results_res.status_code == 200
        res_data = results_res.json()
        assert res_data["total_count"] >= 0
