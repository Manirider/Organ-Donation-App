from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentUser, ActiveUser, require_roles
from app.core.audit import AuditService
from app.models import OrganDonor, DonorOrgan, Location, ConsentLog, AuditAction, ConsentType
from app.schemas import (
    OrganDonorCreate, OrganDonorUpdate, OrganDonorResponse,
    ConsentRequest, ConsentResponse, MessageResponse
)
from app.utils.geo import haversine_distance

router = APIRouter(prefix="/organ-donors", tags=["Organ Donors"])


@router.post("", response_model=OrganDonorResponse, status_code=status.HTTP_201_CREATED)
async def register_as_organ_donor(
    donor_data: OrganDonorCreate,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    existing = await db.execute(
        select(OrganDonor).where(OrganDonor.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already registered as an organ donor"
        )

    donor = OrganDonor(
        user_id=current_user.id,
        blood_group=donor_data.blood_group,
        rh_factor=donor_data.rh_factor,
        donor_type=donor_data.donor_type,
        emergency_contact_name=donor_data.emergency_contact_name,
        emergency_contact_phone=donor_data.emergency_contact_phone,
        emergency_contact_relation=donor_data.emergency_contact_relation,
        medical_info=donor_data.medical_info or {},
    )

    for organ in donor_data.organs:
        donor_organ = DonorOrgan(
            organ_name=organ.organ_name,
            hla_type=organ.hla_type
        )
        donor.pledged_organs.append(donor_organ)

    db.add(donor)
    await db.flush()

    if donor_data.location:
        location = Location(
            entity_id=donor.id,
            entity_type="organ_donor",
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
        resource_type="organ_donor",
        resource_id=str(donor.id),
        description="Registered as organ donor",
        user_id=current_user.id,
        request=request
    )

    await db.refresh(donor)
    return donor


@router.get("/{donor_id}", response_model=OrganDonorResponse)
async def get_organ_donor(
    donor_id: UUID,
    db: DB,
    current_user: ActiveUser
):
    result = await db.execute(
        select(OrganDonor)
        .options(selectinload(OrganDonor.pledged_organs))
        .where(OrganDonor.id == donor_id)
    )
    donor = result.scalar_one_or_none()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organ donor not found"
        )

    user_roles = [role.name for role in current_user.roles]
    if donor.user_id != current_user.id and "admin" not in user_roles and "hospital" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this donor"
        )

    return donor


@router.put("/{donor_id}", response_model=OrganDonorResponse)
async def update_organ_donor(
    donor_id: UUID,
    update_data: OrganDonorUpdate,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    result = await db.execute(
        select(OrganDonor).where(OrganDonor.id == donor_id)
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

    await AuditService.log(
        db=db,
        action=AuditAction.UPDATE,
        resource_type="organ_donor",
        resource_id=str(donor.id),
        description="Updated organ donor profile",
        user_id=current_user.id,
        request=request,
        new_value=update_dict
    )

    await db.refresh(donor)
    return donor


@router.post("/{donor_id}/consent", response_model=ConsentResponse)
async def give_consent(
    donor_id: UUID,
    consent_data: ConsentRequest,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    from datetime import datetime

    result = await db.execute(
        select(OrganDonor).where(OrganDonor.id == donor_id)
    )
    donor = result.scalar_one_or_none()

    if not donor or donor.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    consent = ConsentLog(
        user_id=current_user.id,
        consent_type=ConsentType.ORGAN_DONATION,
        is_granted=consent_data.is_granted,
        ip_address=request.client.host if request.client else None,
        notes=consent_data.notes
    )
    db.add(consent)

    donor.consent_given = consent_data.is_granted
    donor.consent_timestamp = datetime.utcnow()

    await AuditService.log_consent(
        db=db,
        user_id=current_user.id,
        consent_type="organ_donation",
        is_granted=consent_data.is_granted,
        request=request
    )

    await db.flush()
    await db.refresh(consent)
    return consent


@router.delete("/{donor_id}/consent", response_model=MessageResponse)
async def revoke_consent(
    donor_id: UUID,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    from datetime import datetime

    result = await db.execute(
        select(OrganDonor).where(OrganDonor.id == donor_id)
    )
    donor = result.scalar_one_or_none()

    if not donor or donor.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    consent = ConsentLog(
        user_id=current_user.id,
        consent_type=ConsentType.ORGAN_DONATION,
        is_granted=False,
        ip_address=request.client.host if request.client else None,
        notes="Consent revoked by user"
    )
    db.add(consent)

    donor.consent_given = False
    donor.consent_timestamp = datetime.utcnow()

    await AuditService.log_consent(
        db=db,
        user_id=current_user.id,
        consent_type="organ_donation",
        is_granted=False,
        request=request
    )

    return MessageResponse(message="Consent revoked successfully")


@router.get("/nearby", response_model=List[OrganDonorResponse])
async def get_nearby_donors(
    latitude: float,
    longitude: float,
    radius_km: float = 50,
    blood_group: str = None,
    db: DB = None,
    current_user: ActiveUser = None
):
    user_roles = [role.name for role in current_user.roles]
    if "admin" not in user_roles and "hospital" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hospitals and admins can search nearby donors"
        )

    query = (
        select(OrganDonor)
        .options(selectinload(OrganDonor.pledged_organs))
        .where(OrganDonor.is_active == True)
        .where(OrganDonor.consent_given == True)
    )

    if blood_group:
        query = query.where(OrganDonor.blood_group == blood_group)

    result = await db.execute(query)
    donors = result.scalars().all()

    nearby_donors = []
    for donor in donors:
        loc_result = await db.execute(
            select(Location).where(
                Location.entity_id == donor.id,
                Location.entity_type == "organ_donor"
            )
        )
        location = loc_result.scalar_one_or_none()

        if location:
            distance = haversine_distance(
                latitude, longitude, location.latitude, location.longitude)
            if distance <= radius_km:
                nearby_donors.append((donor, distance))

    nearby_donors.sort(key=lambda x: x[1])
    return [d[0] for d in nearby_donors[:20]]
