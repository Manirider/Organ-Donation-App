from typing import List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentUser, ActiveUser
from app.core.audit import AuditService
from app.models import BloodDonor, BloodDonation, Location, AuditAction
from app.schemas import (
    BloodDonorCreate, BloodDonorUpdate, BloodDonorResponse,
    BloodDonationCreate, BloodDonationResponse,
    BloodDonorSearchRequest, MessageResponse
)
from app.utils.geo import haversine_distance

router = APIRouter(prefix="/blood-donors", tags=["Blood Donors"])


@router.post("", response_model=BloodDonorResponse, status_code=status.HTTP_201_CREATED)
async def register_as_blood_donor(
    donor_data: BloodDonorCreate,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    existing = await db.execute(
        select(BloodDonor).where(BloodDonor.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already registered as a blood donor"
        )

    donor = BloodDonor(
        user_id=current_user.id,
        blood_group=donor_data.blood_group,
        rh_factor=donor_data.rh_factor,
        weight_kg=donor_data.weight_kg,
        hemoglobin_level=donor_data.hemoglobin_level,
        health_info=donor_data.health_info or {},
        medical_conditions=donor_data.medical_conditions,
        preferred_donation_center=donor_data.preferred_donation_center,
    )

    db.add(donor)
    await db.flush()

    if donor_data.location:
        location = Location(
            entity_id=donor.id,
            entity_type="blood_donor",
            latitude=donor_data.location.latitude,
            longitude=donor_data.location.longitude,
            address=donor_data.location.address,
            city=donor_data.location.city,
            state=donor_data.location.state,
            country=donor_data.location.country,
            postal_code=donor_data.location.postal_code
        )
        db.add(location)

    await AuditService.log(
        db=db,
        action=AuditAction.CREATE,
        resource_type="blood_donor",
        resource_id=str(donor.id),
        description="Registered as blood donor",
        user_id=current_user.id,
        request=request
    )

    await db.refresh(donor)
    return donor


@router.get("/{donor_id}", response_model=BloodDonorResponse)
async def get_blood_donor(
    donor_id: UUID,
    db: DB,
    current_user: ActiveUser
):
    result = await db.execute(
        select(BloodDonor)
        .options(selectinload(BloodDonor.donations))
        .where(BloodDonor.id == donor_id)
    )
    donor = result.scalar_one_or_none()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blood donor not found")

    return donor


@router.put("/{donor_id}", response_model=BloodDonorResponse)
async def update_blood_donor(
    donor_id: UUID,
    update_data: BloodDonorUpdate,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    result = await db.execute(
        select(BloodDonor).where(BloodDonor.id == donor_id)
    )
    donor = result.scalar_one_or_none()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    if donor.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(donor, key, value)

    await db.refresh(donor)
    return donor


@router.patch("/{donor_id}/availability", response_model=MessageResponse)
async def update_availability(
    donor_id: UUID,
    is_available: bool,
    db: DB,
    current_user: ActiveUser
):
    result = await db.execute(
        select(BloodDonor).where(BloodDonor.id == donor_id)
    )
    donor = result.scalar_one_or_none()

    if not donor or donor.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    donor.is_available = is_available

    return MessageResponse(message=f"Availability set to {is_available}")


@router.post("/{donor_id}/donations", response_model=BloodDonationResponse)
async def record_donation(
    donor_id: UUID,
    donation_data: BloodDonationCreate,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    result = await db.execute(
        select(BloodDonor).where(BloodDonor.id == donor_id)
    )
    donor = result.scalar_one_or_none()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")

    user_roles = [role.name for role in current_user.roles]
    if donor.user_id != current_user.id and "blood_bank" not in user_roles and "admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    donation = BloodDonation(
        donor_id=donor.id,
        blood_bank_id=donation_data.blood_bank_id,
        donation_date=donation_data.donation_date,
        units_donated=donation_data.units_donated,
        hemoglobin_reading=donation_data.hemoglobin_reading,
        notes=donation_data.notes
    )
    db.add(donation)

    donor.last_donation_date = donation_data.donation_date
    donor.total_donations += donation_data.units_donated

    await db.flush()
    await db.refresh(donation)
    return donation


@router.post("/search", response_model=List[BloodDonorResponse])
async def search_blood_donors(
    search_request: BloodDonorSearchRequest,
    db: DB,
    current_user: ActiveUser
):
    query = (
        select(BloodDonor)
        .where(BloodDonor.blood_group == search_request.blood_group)
        .where(BloodDonor.rh_factor == search_request.rh_factor)
        .where(BloodDonor.is_eligible == True)
    )

    if search_request.available_only:
        query = query.where(BloodDonor.is_available == True)

    result = await db.execute(query)
    donors = result.scalars().all()

    eligible_donors = []
    for donor in donors:
        if not donor.can_donate:
            continue

        loc_result = await db.execute(
            select(Location).where(
                Location.entity_id == donor.id,
                Location.entity_type == "blood_donor"
            )
        )
        location = loc_result.scalar_one_or_none()

        if location:
            distance = haversine_distance(
                search_request.latitude, search_request.longitude,
                location.latitude, location.longitude
            )
            if distance <= search_request.radius_km:
                eligible_donors.append((donor, distance))

    eligible_donors.sort(key=lambda x: x[1])
    return [d[0] for d in eligible_donors[:search_request.limit]]
