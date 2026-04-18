from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

from app.schemas.organ_donor import LocationCreate, LocationResponse


class HospitalCreate(BaseModel):
    name: str = Field(..., max_length=255)
    license_number: str = Field(..., max_length=100)

    address: str
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    country: str = Field(default="India", max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)

    phone: str = Field(..., max_length=20)
    email: EmailStr
    emergency_phone: Optional[str] = None

    is_transplant_center: bool = False
    transplant_capabilities: Optional[dict] = None

    bed_capacity: Optional[int] = None
    icu_beds: Optional[int] = None
    operating_hours: Optional[dict] = None

    location: Optional[LocationCreate] = None


class HospitalUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_phone: Optional[str] = None
    transplant_capabilities: Optional[dict] = None
    bed_capacity: Optional[int] = None
    icu_beds: Optional[int] = None
    operating_hours: Optional[dict] = None
    readiness_score: Optional[float] = Field(None, ge=0, le=1)


class HospitalResponse(BaseModel):
    id: UUID
    name: str
    license_number: str
    address: str
    city: str
    state: str
    phone: str
    email: str
    is_verified: bool
    is_transplant_center: bool
    readiness_score: float
    created_at: datetime

    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class EmergencyRequestCreate(BaseModel):
    request_type: str = Field(..., pattern="^(organ|blood)$")
    blood_group: Optional[str] = Field(None, pattern="^(A|B|AB|O)$")
    rh_factor: Optional[str] = Field(None, pattern="^(positive|negative)$")
    organ_type: Optional[str] = None
    urgency_level: int = Field(..., ge=1, le=10)
    units_needed: int = Field(default=1, ge=1)
    radius_km: float = Field(default=100, ge=10, le=500)
    description: Optional[str] = None


class EmergencyRequestResponse(BaseModel):
    id: UUID
    hospital_id: UUID
    request_type: str
    blood_group: Optional[str] = None
    organ_type: Optional[str] = None
    urgency_level: int
    radius_km: float
    status: str
    responses_count: int
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
