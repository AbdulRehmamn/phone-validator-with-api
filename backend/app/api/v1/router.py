from fastapi import APIRouter
from app.api.v1.endpoints import validation, bulk, keys, admin

api_router = APIRouter()

api_router.include_router(validation.router, tags=["Single & Direct Validation"])
api_router.include_router(bulk.router, prefix="/bulk", tags=["Bulk Validation Engine"])
api_router.include_router(keys.router, prefix="/keys", tags=["API Key Management"])
api_router.include_router(admin.router, tags=["Admin & System Status"])
