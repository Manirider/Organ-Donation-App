import uuid
from datetime import datetime, date
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Date, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.location import Location
    from app.models.blood_donor import BloodDonation


class BloodBank(Base):
    __tablename__ = "blood_banks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    admin_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    license_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False)

    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="India")
    postal_code: Mapped[Optional[str]] = mapped_column(String(20))

    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    operating_hours: Mapped[Optional[dict]
                            ] = mapped_column(JSONB, default=dict)
    services: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    location: Mapped[Optional["Location"]] = relationship(
        back_populates="blood_bank",
        uselist=False,
        primaryjoin="BloodBank.id == foreign(Location.entity_id)",
        cascade="all, delete-orphan"
    )
    inventory: Mapped[List["BloodInventory"]] = relationship(
        back_populates="blood_bank", cascade="all, delete-orphan"
    )
    blood_requests: Mapped[List["BloodRequest"]] = relationship(
        back_populates="blood_bank"
    )


class BloodInventory(Base):
    __tablename__ = "blood_inventory"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    blood_bank_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False
    )

    blood_group: Mapped[str] = mapped_column(String(5), nullable=False)
    rh_factor: Mapped[str] = mapped_column(String(10), nullable=False)
    component_type: Mapped[str] = mapped_column(
        String(50), default="whole_blood")

    units_available: Mapped[int] = mapped_column(Integer, default=0)
    units_reserved: Mapped[int] = mapped_column(Integer, default=0)

    collection_date: Mapped[Optional[date]] = mapped_column(Date)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    blood_bank: Mapped["BloodBank"] = relationship(back_populates="inventory")

    @property
    def is_expired(self) -> bool:
        if self.expiry_date:
            return date.today() > self.expiry_date
        return False

    @property
    def available_units(self) -> int:
        return max(0, self.units_available - self.units_reserved)


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    blood_bank_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False
    )
    requester_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospitals.id", ondelete="SET NULL")
    )

    blood_group: Mapped[str] = mapped_column(String(5), nullable=False)
    rh_factor: Mapped[str] = mapped_column(String(10), nullable=False)
    component_type: Mapped[str] = mapped_column(
        String(50), default="whole_blood")
    units_requested: Mapped[int] = mapped_column(Integer, nullable=False)

    urgency_level: Mapped[int] = mapped_column(Integer, default=5)
    patient_name: Mapped[Optional[str]] = mapped_column(String(200))
    purpose: Mapped[Optional[str]] = mapped_column(Text)

    status: Mapped[str] = mapped_column(String(20), default="pending")
    units_fulfilled: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    fulfilled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    blood_bank: Mapped["BloodBank"] = relationship(
        back_populates="blood_requests")


BLOOD_COMPONENTS = [
    "whole_blood", "packed_rbc", "platelets", "plasma", "cryoprecipitate"
]
