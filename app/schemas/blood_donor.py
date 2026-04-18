from typing import Optional
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.organ_donor import LocationCreate, LocationResponse


class BloodDonorCreate(BaseModel):
    blood_group: str = Field(..., pattern="^(A|B|AB|O)$")
    rh_factor: str = Field(..., pattern="^(positive|negative)$")

    weight_kg: Optional[float] = Field(None, ge=45)
    hemoglobin_level: Optional[float] = Field(None, ge=0)

    health_info: Optional[dict] = None
    medical_conditions: Optional[str] = None
    preferred_donation_center: Optional[str] = None

    location: Optional[LocationCreate] = None


class BloodDonorUpdate(BaseModel):
    is_available: Optional[bool] = None
    is_eligible: Optional[bool] = None
    weight_kg: Optional[float] = Field(None, ge=45)
    hemoglobin_level: Optional[float] = None
    health_info: Optional[dict] = None
    medical_conditions: Optional[str] = None
    preferred_donation_center: Optional[str] = None


class BloodDonorResponse(BaseModel):
    id: UUID
    user_id: UUID
    blood_group: str
    rh_factor: str
    last_donation_date: Optional[date] = None
    total_donations: int
    is_available: bool
    is_eligible: bool
    can_donate: bool
    days_until_eligible: int
    created_at: datetime

    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class BloodDonationCreate(BaseModel):
    blood_bank_id: Optional[UUID] = None
    donation_date: date
    units_donated: int = Field(default=1, ge=1, le=2)
    hemoglobin_reading: Optional[float] = None
    notes: Optional[str] = None


class BloodDonationResponse(BaseModel):
    id: int
    donor_id: UUID
    blood_bank_id: Optional[UUID] = None
    donation_date: date
    units_donated: int
    created_at: datetime

    class Config:
        from_attributes = True


class BloodDonorSearchRequest(BaseModel):
    blood_group: str = Field(..., pattern="^(A|B|AB|O)$")
    rh_factor: str = Field(..., pattern="^(positive|negative)$")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=50, ge=1, le=500)
    available_only: bool = True
    limit: int = Field(default=20, ge=1, le=100)
