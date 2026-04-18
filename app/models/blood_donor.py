import uuid
from datetime import datetime, date
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.location import Location


class BloodDonor(Base):
    __tablename__ = "blood_donors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    blood_group: Mapped[str] = mapped_column(
        String(5), nullable=False, index=True)
    rh_factor: Mapped[str] = mapped_column(String(10), nullable=False)

    last_donation_date: Mapped[Optional[date]] = mapped_column(Date)
    total_donations: Mapped[int] = mapped_column(Integer, default=0)

    weight_kg: Mapped[Optional[float]] = mapped_column()
    hemoglobin_level: Mapped[Optional[float]] = mapped_column()

    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_eligible: Mapped[bool] = mapped_column(Boolean, default=True)

    health_info: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    medical_conditions: Mapped[Optional[str]] = mapped_column(Text)

    preferred_donation_center: Mapped[Optional[str]] = mapped_column(
        String(255))

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="blood_donor")
    location: Mapped[Optional["Location"]] = relationship(
        back_populates="blood_donor",
        uselist=False,
        primaryjoin="BloodDonor.id == foreign(Location.entity_id)",
        cascade="all, delete-orphan"
    )
    donations: Mapped[List["BloodDonation"]] = relationship(
        back_populates="donor", cascade="all, delete-orphan"
    )

    @property
    def can_donate(self) -> bool:
        if not self.is_eligible or not self.is_available:
            return False
        if self.last_donation_date:
            days_since = (date.today() - self.last_donation_date).days
            return days_since >= 56
        return True

    @property
    def days_until_eligible(self) -> int:
        if not self.last_donation_date:
            return 0
        days_since = (date.today() - self.last_donation_date).days
        return max(0, 56 - days_since)


class BloodDonation(Base):
    __tablename__ = "blood_donations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blood_donors.id", ondelete="CASCADE"), nullable=False
    )
    blood_bank_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blood_banks.id", ondelete="SET NULL")
    )

    donation_date: Mapped[date] = mapped_column(Date, nullable=False)
    units_donated: Mapped[int] = mapped_column(Integer, default=1)

    hemoglobin_reading: Mapped[Optional[float]] = mapped_column()
    notes: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    donor: Mapped["BloodDonor"] = relationship(back_populates="donations")


BLOOD_GROUPS = ["A", "B", "AB", "O"]
RH_FACTORS = ["positive", "negative"]
