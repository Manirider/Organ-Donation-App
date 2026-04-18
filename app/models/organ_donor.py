import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.location import Location
    from app.models.match import Match


class DonorType(str, enum.Enum):
    LIVING = "living"
    DECEASED = "deceased"


class OrganDonor(Base):
    __tablename__ = "organ_donors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    blood_group: Mapped[str] = mapped_column(String(5), nullable=False)
    rh_factor: Mapped[str] = mapped_column(String(10), nullable=False)
    donor_type: Mapped[DonorType] = mapped_column(
        Enum(DonorType), default=DonorType.LIVING
    )

    is_eligible: Mapped[bool] = mapped_column(Boolean, default=True)
    eligibility_notes: Mapped[Optional[str]] = mapped_column(Text)

    medical_info: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)

    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(200))
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20))
    emergency_contact_relation: Mapped[Optional[str]] = mapped_column(
        String(50))

    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="organ_donor")
    pledged_organs: Mapped[List["DonorOrgan"]] = relationship(
        back_populates="donor", cascade="all, delete-orphan"
    )
    location: Mapped[Optional["Location"]] = relationship(
        back_populates="organ_donor",
        uselist=False,
        primaryjoin="OrganDonor.id == foreign(Location.entity_id)",
        cascade="all, delete-orphan"
    )
    matches: Mapped[List["Match"]] = relationship(
        back_populates="donor",
        foreign_keys="Match.donor_id"
    )


class DonorOrgan(Base):
    __tablename__ = "donor_organs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organ_donors.id", ondelete="CASCADE"), nullable=False
    )

    organ_name: Mapped[str] = mapped_column(String(50), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    pledged_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    hla_type: Mapped[Optional[str]] = mapped_column(String(100))
    additional_info: Mapped[Optional[dict]
                            ] = mapped_column(JSONB, default=dict)

    donor: Mapped["OrganDonor"] = relationship(back_populates="pledged_organs")


ORGAN_TYPES = [
    "kidney", "liver", "heart", "lung", "pancreas",
    "intestine", "cornea", "bone_marrow", "skin", "bone"
]
