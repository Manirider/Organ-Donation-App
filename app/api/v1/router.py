from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.organ_donors import router as organ_donors_router
from app.api.v1.blood_donors import router as blood_donors_router
from app.api.v1.matching import router as matching_router
from app.api.v1.websocket import router as websocket_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(organ_donors_router)
api_router.include_router(blood_donors_router)
api_router.include_router(matching_router)
api_router.include_router(websocket_router)


@api_router.get("/")
async def api_root():
    return {
        "name": "Organ & Blood Donation API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "organ_donors": "/api/v1/organ-donors",
            "blood_donors": "/api/v1/blood-donors",
            "matching": "/api/v1/matching",
        }
    }
