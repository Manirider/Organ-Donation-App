from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.organ_donor import DonorType


class LocationCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    country: str = Field(default="India", max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)


class LocationResponse(LocationCreate):
    id: int

    class Config:
        from_attributes = True


class DonorOrganCreate(BaseModel):
    organ_name: str = Field(..., max_length=50)
    hla_type: Optional[str] = Field(None, max_length=100)


class DonorOrganResponse(DonorOrganCreate):
    id: int
    is_available: bool
    pledged_at: datetime

    class Config:
        from_attributes = True


class OrganDonorCreate(BaseModel):
    blood_group: str = Field(..., pattern="^(A|B|AB|O)$")
    rh_factor: str = Field(..., pattern="^(positive|negative)$")
    donor_type: DonorType = DonorType.LIVING

    organs: List[DonorOrganCreate] = []

    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(
        None, pattern=r"^\+?[1-9]\d{9,14}$")
    emergency_contact_relation: Optional[str] = Field(None, max_length=50)

    medical_info: Optional[dict] = None
    location: Optional[LocationCreate] = None


class OrganDonorUpdate(BaseModel):
    donor_type: Optional[DonorType] = None
    is_eligible: Optional[bool] = None
    eligibility_notes: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    medical_info: Optional[dict] = None
    is_active: Optional[bool] = None


class OrganDonorResponse(BaseModel):
    id: UUID
    user_id: UUID
    blood_group: str
    rh_factor: str
    donor_type: DonorType
    is_eligible: bool
    is_active: bool
    consent_given: bool
    consent_timestamp: Optional[datetime] = None
    created_at: datetime

    pledged_organs: List[DonorOrganResponse] = []
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class ConsentRequest(BaseModel):
    consent_type: str = "organ_donation"
    is_granted: bool = True
    notes: Optional[str] = None


class ConsentResponse(BaseModel):
    id: UUID
    consent_type: str
    is_granted: bool
    granted_at: datetime

    class Config:
        from_attributes = True
