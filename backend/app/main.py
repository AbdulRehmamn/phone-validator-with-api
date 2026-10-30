import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.future import select

from app.core.config import settings, STORAGE_DIR, UPLOADS_DIR, EXPORTS_DIR
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import hash_api_key
from app.models.models import ApiKey
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure directories and database tables are initialized
    STORAGE_DIR.mkdir(exist_ok=True)
    UPLOADS_DIR.mkdir(exist_ok=True)
    EXPORTS_DIR.mkdir(exist_ok=True)
    await init_db()

    # Seed primary and authorized keys into DB if not present
    async with AsyncSessionLocal() as session:
        for k in settings.ADDITIONAL_AUTHORIZED_KEYS:
            key_hash = hash_api_key(k)
            existing = await session.execute(select(ApiKey).where(ApiKey.key_hash == key_hash))
            if not existing.scalar_one_or_none():
                primary_key = ApiKey(
                    name=f"Production Key ({k[:12]}...)",
                    key_hash=key_hash,
                    prefix=k[:14] + "...",
                    rate_limit_per_min=0,
                    is_active=True
                )
                session.add(primary_key)
        await session.commit()

    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade US Phone Number Validation API and Bulk Checker Platform. Supports single lookups and up to 1,000,000 bulk validations per job with Excel/CSV export.",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def root_health():
    return {"status": "ok", "service": settings.PROJECT_NAME}

# Mount Frontend static files if built
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
