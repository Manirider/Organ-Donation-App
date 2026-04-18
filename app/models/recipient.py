import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.hospital import Hospital
    from app.models.location import Location
    from app.models.match import Match


class RequiredType(str, enum.Enum):
    ORGAN = "organ"
    BLOOD = "blood"


class RecipientStatus(str, enum.Enum):
    ACTIVE = "active"
    MATCHED = "matched"
    TRANSPLANTED = "transplanted"
    INACTIVE = "inactive"


class Recipient(Base):
    __tablename__ = "recipients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    required_type: Mapped[RequiredType] = mapped_column(
        Enum(RequiredType), nullable=False)
    blood_group: Mapped[str] = mapped_column(String(5), nullable=False)
    rh_factor: Mapped[str] = mapped_column(String(10), nullable=False)

    organ_needed: Mapped[Optional[str]] = mapped_column(String(50))
    units_needed: Mapped[int] = mapped_column(Integer, default=1)

    urgency_score: Mapped[int] = mapped_column(Integer, default=5)
    medical_condition: Mapped[Optional[str]] = mapped_column(Text)
    medical_details: Mapped[Optional[dict]
                            ] = mapped_column(JSONB, default=dict)

    hla_type: Mapped[Optional[str]] = mapped_column(String(100))

    hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospitals.id", ondelete="SET NULL")
    )
    doctor_name: Mapped[Optional[str]] = mapped_column(String(200))
    doctor_contact: Mapped[Optional[str]] = mapped_column(String(50))

    verification_document_url: Mapped[Optional[str]] = mapped_column(
        String(500))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[Optional[uuid.UUID]
                        ] = mapped_column(UUID(as_uuid=True))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    status: Mapped[RecipientStatus] = mapped_column(
        Enum(RecipientStatus), default=RecipientStatus.ACTIVE
    )
    waitlist_position: Mapped[Optional[int]] = mapped_column(Integer)
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="recipient")
    hospital: Mapped[Optional["Hospital"]] = relationship(
        back_populates="recipients")
    location: Mapped[Optional["Location"]] = relationship(
        back_populates="recipient",
        uselist=False,
        primaryjoin="Recipient.id == foreign(Location.entity_id)",
        cascade="all, delete-orphan"
    )
    matches: Mapped[list["Match"]] = relationship(
        back_populates="recipient",
        foreign_keys="Match.recipient_id"
    )

    @property
    def priority_index(self) -> float:
        base_score = self.urgency_score * 10
        wait_days = (datetime.utcnow() - self.enrolled_at).days
        wait_bonus = min(wait_days * 0.5, 20)
        return base_score + wait_bonus
