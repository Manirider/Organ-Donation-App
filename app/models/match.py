import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organ_donor import OrganDonor
    from app.models.recipient import Recipient
    from app.models.hospital import Hospital


class MatchType(str, enum.Enum):
    ORGAN = "organ"
    BLOOD = "blood"


class MatchStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organ_donors.id", ondelete="CASCADE"), nullable=False
    )
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False
    )
    hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospitals.id", ondelete="SET NULL")
    )

    match_type: Mapped[MatchType] = mapped_column(
        Enum(MatchType), nullable=False)
    organ_type: Mapped[Optional[str]] = mapped_column(String(50))
    blood_group: Mapped[Optional[str]] = mapped_column(String(5))

    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    compatibility_score: Mapped[float] = mapped_column(Float, default=0.0)

    distance_km: Mapped[Optional[float]] = mapped_column(Float)
    estimated_transfer_time: Mapped[Optional[int]] = mapped_column()

    explanation: Mapped[dict] = mapped_column(JSONB, default=dict)
    score_breakdown: Mapped[dict] = mapped_column(JSONB, default=dict)

    status: Mapped[MatchStatus] = mapped_column(
        Enum(MatchStatus), default=MatchStatus.PENDING
    )
    status_notes: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    approved_by: Mapped[Optional[uuid.UUID]
                        ] = mapped_column(UUID(as_uuid=True))

    donor: Mapped["OrganDonor"] = relationship(
        back_populates="matches",
        foreign_keys=[donor_id]
    )
    recipient: Mapped["Recipient"] = relationship(
        back_populates="matches",
        foreign_keys=[recipient_id]
    )
    hospital: Mapped[Optional["Hospital"]] = relationship(
        back_populates="matches",
        foreign_keys=[hospital_id]
    )
    explanations: Mapped[List["MatchExplanation"]] = relationship(
        back_populates="match", cascade="all, delete-orphan"
    )


class MatchExplanation(Base):
    __tablename__ = "match_explanations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    match_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False
    )

    factor_name: Mapped[str] = mapped_column(String(50), nullable=False)
    factor_score: Mapped[float] = mapped_column(Float, nullable=False)
    factor_weight: Mapped[float] = mapped_column(Float, nullable=False)
    weighted_contribution: Mapped[float] = mapped_column(Float, nullable=False)

    explanation_text: Mapped[str] = mapped_column(Text, nullable=False)
    supporting_data: Mapped[Optional[dict]
                            ] = mapped_column(JSONB, default=dict)

    match: Mapped["Match"] = relationship(back_populates="explanations")
