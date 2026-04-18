from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

from app.schemas.organ_donor import LocationCreate, LocationResponse


class BloodBankCreate(BaseModel):
    name: str = Field(..., max_length=255)
    license_number: str = Field(..., max_length=100)

    address: str
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    country: str = Field(default="India", max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)

    phone: str = Field(..., max_length=20)
    email: EmailStr

    operating_hours: Optional[dict] = None
    services: Optional[dict] = None

    location: Optional[LocationCreate] = None


class BloodBankUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    operating_hours: Optional[dict] = None
    services: Optional[dict] = None
    is_active: Optional[bool] = None


class BloodBankResponse(BaseModel):
    id: UUID
    name: str
    license_number: str
    address: str
    city: str
    state: str
    phone: str
    email: str
    is_verified: bool
    is_active: bool
    created_at: datetime

    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class BloodInventoryCreate(BaseModel):
    blood_group: str = Field(..., pattern="^(A|B|AB|O)$")
    rh_factor: str = Field(..., pattern="^(positive|negative)$")
    component_type: str = Field(default="whole_blood")
    units_available: int = Field(..., ge=0)
    collection_date: Optional[date] = None
    expiry_date: Optional[date] = None


class BloodInventoryUpdate(BaseModel):
    units_available: Optional[int] = Field(None, ge=0)
    units_reserved: Optional[int] = Field(None, ge=0)


class BloodInventoryResponse(BaseModel):
    id: int
    blood_bank_id: UUID
    blood_group: str
    rh_factor: str
    component_type: str
    units_available: int
    units_reserved: int
    available_units: int
    is_expired: bool
    expiry_date: Optional[date] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class BloodRequestCreate(BaseModel):
    blood_group: str = Field(..., pattern="^(A|B|AB|O)$")
    rh_factor: str = Field(..., pattern="^(positive|negative)$")
    component_type: str = Field(default="whole_blood")
    units_requested: int = Field(..., ge=1)
    urgency_level: int = Field(default=5, ge=1, le=10)
    patient_name: Optional[str] = None
    purpose: Optional[str] = None


class BloodRequestResponse(BaseModel):
    id: UUID
    blood_bank_id: UUID
    blood_group: str
    rh_factor: str
    units_requested: int
    units_fulfilled: int
    urgency_level: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
