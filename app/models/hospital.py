import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.recipient import Recipient
    from app.models.location import Location
    from app.models.match import Match


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    admin_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
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
    emergency_phone: Mapped[Optional[str]] = mapped_column(String(20))

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    is_transplant_center: Mapped[bool] = mapped_column(Boolean, default=False)
    transplant_capabilities: Mapped[Optional[dict]
                                    ] = mapped_column(JSONB, default=dict)

    bed_capacity: Mapped[Optional[int]] = mapped_column()
    icu_beds: Mapped[Optional[int]] = mapped_column()

    operating_hours: Mapped[Optional[dict]
                            ] = mapped_column(JSONB, default=dict)
    readiness_score: Mapped[float] = mapped_column(default=0.8)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    recipients: Mapped[List["Recipient"]] = relationship(
        back_populates="hospital")
    location: Mapped[Optional["Location"]] = relationship(
        back_populates="hospital",
        uselist=False,
        primaryjoin="Hospital.id == foreign(Location.entity_id)",
        cascade="all, delete-orphan"
    )
    matches: Mapped[List["Match"]] = relationship(
        back_populates="hospital",
        foreign_keys="Match.hospital_id"
    )
    emergency_requests: Mapped[List["EmergencyRequest"]] = relationship(
        back_populates="hospital"
    )


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hospital_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False
    )
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    request_type: Mapped[str] = mapped_column(String(20), nullable=False)
    blood_group: Mapped[Optional[str]] = mapped_column(String(5))
    rh_factor: Mapped[Optional[str]] = mapped_column(String(10))
    organ_type: Mapped[Optional[str]] = mapped_column(String(50))

    urgency_level: Mapped[int] = mapped_column(default=5)
    units_needed: Mapped[int] = mapped_column(default=1)
    radius_km: Mapped[float] = mapped_column(default=100.0)

    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active")

    responses_count: Mapped[int] = mapped_column(default=0)
    fulfilled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    hospital: Mapped["Hospital"] = relationship(
        back_populates="emergency_requests")
