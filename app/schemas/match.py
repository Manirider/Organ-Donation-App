from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.match import MatchType, MatchStatus


class MatchRequest(BaseModel):
    recipient_id: UUID
    organ_type: Optional[str] = None
    max_distance_km: float = Field(default=500, ge=10, le=2000)
    min_confidence: float = Field(default=0.5, ge=0, le=1)
    include_deceased_donors: bool = True
    limit: int = Field(default=10, ge=1, le=50)


class BloodMatchRequest(BaseModel):
    recipient_id: Optional[UUID] = None
    blood_group: str = Field(..., pattern="^(A|B|AB|O)$")
    rh_factor: str = Field(..., pattern="^(positive|negative)$")
    units_needed: int = Field(default=1, ge=1)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    max_distance_km: float = Field(default=100, ge=10, le=500)
    limit: int = Field(default=20, ge=1, le=100)


class FactorExplanation(BaseModel):
    score: float
    weight: float
    contribution: float
    reason: str
    supporting_data: Optional[Dict[str, Any]] = None


class MatchExplanationResponse(BaseModel):
    blood_compatibility: FactorExplanation
    hla_compatibility: Optional[FactorExplanation] = None
    urgency_factor: FactorExplanation
    geographic_score: FactorExplanation
    viability_score: Optional[FactorExplanation] = None
    hospital_readiness: Optional[FactorExplanation] = None


class MatchResultItem(BaseModel):
    donor_id: UUID
    donor_type: str
    blood_group: str
    confidence_score: float
    distance_km: float
    estimated_transfer_hours: Optional[float] = None
    hospital_name: Optional[str] = None
    hospital_readiness: Optional[float] = None
    explanation: MatchExplanationResponse


class MatchResponse(BaseModel):
    matches: List[MatchResultItem]
    total_candidates: int
    filtered_candidates: int
    search_radius_km: float
    processing_time_ms: int


class MatchRecordResponse(BaseModel):
    id: UUID
    donor_id: UUID
    recipient_id: UUID
    hospital_id: Optional[UUID] = None
    match_type: MatchType
    organ_type: Optional[str] = None
    confidence_score: float
    distance_km: Optional[float] = None
    status: MatchStatus
    explanation: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class MatchAcceptRequest(BaseModel):
    notes: Optional[str] = None
    hospital_id: Optional[UUID] = None


class AIExplanationRequest(BaseModel):
    match_id: UUID
    verbose: bool = False


class AIExplanationResponse(BaseModel):
    match_id: UUID
    confidence_score: float
    decision_summary: str
    factor_contributions: List[FactorExplanation]
    bias_check: Dict[str, Any]
    recommendation: str
