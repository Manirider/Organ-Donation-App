from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.recipient import RequiredType, RecipientStatus
from app.schemas.organ_donor import LocationCreate, LocationResponse


class RecipientCreate(BaseModel):
    required_type: RequiredType
    blood_group: str = Field(..., pattern="^(A|B|AB|O)$")
    rh_factor: str = Field(..., pattern="^(positive|negative)$")

    organ_needed: Optional[str] = Field(None, max_length=50)
    units_needed: int = Field(default=1, ge=1)

    urgency_score: int = Field(..., ge=1, le=10)
    medical_condition: Optional[str] = None
    medical_details: Optional[dict] = None
    hla_type: Optional[str] = Field(None, max_length=100)

    hospital_id: Optional[UUID] = None
    doctor_name: Optional[str] = Field(None, max_length=200)
    doctor_contact: Optional[str] = Field(None, max_length=50)

    location: Optional[LocationCreate] = None


class RecipientUpdate(BaseModel):
    urgency_score: Optional[int] = Field(None, ge=1, le=10)
    medical_condition: Optional[str] = None
    medical_details: Optional[dict] = None
    doctor_name: Optional[str] = None
    doctor_contact: Optional[str] = None
    hospital_id: Optional[UUID] = None


class RecipientResponse(BaseModel):
    id: UUID
    user_id: UUID
    required_type: RequiredType
    blood_group: str
    rh_factor: str
    organ_needed: Optional[str] = None
    units_needed: int
    urgency_score: int
    priority_index: float
    is_verified: bool
    status: RecipientStatus
    waitlist_position: Optional[int] = None
    enrolled_at: datetime
    created_at: datetime

    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True


class WaitlistResponse(BaseModel):
    position: int
    recipient_id: UUID
    required_type: RequiredType
    organ_needed: Optional[str] = None
    blood_group: str
    urgency_score: int
    priority_index: float
    enrolled_at: datetime
    estimated_wait_days: Optional[int] = None
