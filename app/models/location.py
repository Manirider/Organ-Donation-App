import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.organ_donor import OrganDonor
    from app.models.blood_donor import BloodDonor
    from app.models.recipient import Recipient
    from app.models.hospital import Hospital
    from app.models.blood_bank import BloodBank


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    address: Mapped[Optional[str]] = mapped_column(String(500))
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), default="India")
    postal_code: Mapped[Optional[str]] = mapped_column(String(20))

    organ_donor: Mapped[Optional["OrganDonor"]] = relationship(
        back_populates="location",
        primaryjoin="Location.entity_id == OrganDonor.id",
        foreign_keys=[entity_id],
        uselist=False,
        viewonly=True
    )
    blood_donor: Mapped[Optional["BloodDonor"]] = relationship(
        back_populates="location",
        primaryjoin="Location.entity_id == BloodDonor.id",
        foreign_keys=[entity_id],
        uselist=False,
        viewonly=True
    )
    recipient: Mapped[Optional["Recipient"]] = relationship(
        back_populates="location",
        primaryjoin="Location.entity_id == Recipient.id",
        foreign_keys=[entity_id],
        uselist=False,
        viewonly=True
    )
    hospital: Mapped[Optional["Hospital"]] = relationship(
        back_populates="location",
        primaryjoin="Location.entity_id == Hospital.id",
        foreign_keys=[entity_id],
        uselist=False,
        viewonly=True
    )
    blood_bank: Mapped[Optional["BloodBank"]] = relationship(
        back_populates="location",
        primaryjoin="Location.entity_id == BloodBank.id",
        foreign_keys=[entity_id],
        uselist=False,
        viewonly=True
    )
