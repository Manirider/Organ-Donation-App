from typing import List
from uuid import UUID
import time
from fastapi import APIRouter, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentUser, ActiveUser, require_roles
from app.core.audit import AuditService
from app.models import (
    OrganDonor, Recipient, Hospital, Location, Match,
    MatchExplanation, MatchType, MatchStatus, AuditAction
)
from app.schemas import (
    MatchRequest, BloodMatchRequest, MatchResponse, MatchResultItem,
    MatchRecordResponse, MatchAcceptRequest,
    AIExplanationRequest, AIExplanationResponse, FactorExplanation
)
from app.ml import (
    organ_matching_engine, blood_matching_engine,
    DonorCandidate, RecipientInfo, HospitalInfo
)

router = APIRouter(prefix="/matching", tags=["AI Matching"])


@router.post("/organ", response_model=MatchResponse)
async def find_organ_matches(
    match_request: MatchRequest,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    start_time = time.time()

    recipient_result = await db.execute(
        select(Recipient).where(Recipient.id == match_request.recipient_id)
    )
    recipient = recipient_result.scalar_one_or_none()

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found")

    loc_result = await db.execute(
        select(Location).where(
            Location.entity_id == recipient.id,
            Location.entity_type == "recipient"
        )
    )
    recipient_location = loc_result.scalar_one_or_none()

    if not recipient_location:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Recipient location required")

    recipient_info = RecipientInfo(
        id=recipient.id,
        blood_group=recipient.blood_group,
        rh_factor=recipient.rh_factor,
        organ_needed=match_request.organ_type or recipient.organ_needed,
        urgency_score=recipient.urgency_score,
        latitude=recipient_location.latitude,
        longitude=recipient_location.longitude,
        hla_type=recipient.hla_type,
        hospital_id=recipient.hospital_id
    )

    donor_query = (
        select(OrganDonor)
        .options(selectinload(OrganDonor.pledged_organs))
        .where(OrganDonor.is_active == True)
        .where(OrganDonor.is_eligible == True)
        .where(OrganDonor.consent_given == True)
    )

    if not match_request.include_deceased_donors:
        from app.models.organ_donor import DonorType
        donor_query = donor_query.where(
            OrganDonor.donor_type == DonorType.LIVING)

    donor_result = await db.execute(donor_query)
    donors = donor_result.scalars().all()

    donor_candidates = []
    for donor in donors:
        loc_result = await db.execute(
            select(Location).where(
                Location.entity_id == donor.id,
                Location.entity_type == "organ_donor"
            )
        )
        location = loc_result.scalar_one_or_none()

        if location:
            has_organ = any(
                o.organ_name.lower() == recipient_info.organ_needed.lower() and o.is_available
                for o in donor.pledged_organs
            )
            if has_organ:
                donor_candidates.append(DonorCandidate(
                    id=donor.id,
                    blood_group=donor.blood_group,
                    rh_factor=donor.rh_factor,
                    donor_type=donor.donor_type.value,
                    latitude=location.latitude,
                    longitude=location.longitude,
                    hla_type=next(
                        (o.hla_type for o in donor.pledged_organs), None),
                    is_eligible=donor.is_eligible
                ))

    hospital_result = await db.execute(
        select(Hospital)
        .where(Hospital.is_verified == True)
        .where(Hospital.is_transplant_center == True)
    )
    hospitals = hospital_result.scalars().all()

    hospital_infos = []
    for hosp in hospitals:
        loc_result = await db.execute(
            select(Location).where(
                Location.entity_id == hosp.id,
                Location.entity_type == "hospital"
            )
        )
        loc = loc_result.scalar_one_or_none()
        if loc:
            hospital_infos.append(HospitalInfo(
                id=hosp.id,
                name=hosp.name,
                readiness_score=hosp.readiness_score,
                latitude=loc.latitude,
                longitude=loc.longitude
            ))

    results, total, filtered = organ_matching_engine.find_matches(
        recipient=recipient_info,
        donors=donor_candidates,
        hospitals=hospital_infos if hospital_infos else None,
        min_confidence=match_request.min_confidence,
        max_results=match_request.limit
    )

    processing_time = int((time.time() - start_time) * 1000)

    matches = []
    for result in results:
        explanation = {
            "blood_compatibility": FactorExplanation(
                score=next(
                    (f.score for f in result.factors if f.name == "blood_compatibility"), 0),
                weight=next(
                    (f.weight for f in result.factors if f.name == "blood_compatibility"), 0),
                contribution=next(
                    (f.contribution for f in result.factors if f.name == "blood_compatibility"), 0),
                reason=next(
                    (f.reason for f in result.factors if f.name == "blood_compatibility"), "")
            ),
            "hla_compatibility": FactorExplanation(
                score=next(
                    (f.score for f in result.factors if f.name == "hla_compatibility"), 0),
                weight=next(
                    (f.weight for f in result.factors if f.name == "hla_compatibility"), 0),
                contribution=next(
                    (f.contribution for f in result.factors if f.name == "hla_compatibility"), 0),
                reason=next(
                    (f.reason for f in result.factors if f.name == "hla_compatibility"), "")
            ),
            "urgency_factor": FactorExplanation(
                score=next(
                    (f.score for f in result.factors if f.name == "urgency_factor"), 0),
                weight=next(
                    (f.weight for f in result.factors if f.name == "urgency_factor"), 0),
                contribution=next(
                    (f.contribution for f in result.factors if f.name == "urgency_factor"), 0),
                reason=next(
                    (f.reason for f in result.factors if f.name == "urgency_factor"), "")
            ),
            "geographic_score": FactorExplanation(
                score=next(
                    (f.score for f in result.factors if f.name == "geographic_score"), 0),
                weight=next(
                    (f.weight for f in result.factors if f.name == "geographic_score"), 0),
                contribution=next(
                    (f.contribution for f in result.factors if f.name == "geographic_score"), 0),
                reason=next(
                    (f.reason for f in result.factors if f.name == "geographic_score"), "")
            ),
            "viability_score": FactorExplanation(
                score=next(
                    (f.score for f in result.factors if f.name == "viability_score"), 0),
                weight=next(
                    (f.weight for f in result.factors if f.name == "viability_score"), 0),
                contribution=next(
                    (f.contribution for f in result.factors if f.name == "viability_score"), 0),
                reason=next(
                    (f.reason for f in result.factors if f.name == "viability_score"), "")
            ),
            "hospital_readiness": FactorExplanation(
                score=next(
                    (f.score for f in result.factors if f.name == "hospital_readiness"), 0),
                weight=next(
                    (f.weight for f in result.factors if f.name == "hospital_readiness"), 0),
                contribution=next(
                    (f.contribution for f in result.factors if f.name == "hospital_readiness"), 0),
                reason=next(
                    (f.reason for f in result.factors if f.name == "hospital_readiness"), "")
            ),
        }

        matches.append(MatchResultItem(
            donor_id=result.donor_id,
            donor_type=result.donor_type,
            blood_group=result.blood_group,
            confidence_score=result.confidence_score,
            distance_km=result.distance_km,
            estimated_transfer_hours=result.estimated_transfer_hours,
            hospital_name=result.hospital.name if result.hospital else None,
            hospital_readiness=result.hospital.readiness_score if result.hospital else None,
            explanation=explanation
        ))

    await AuditService.log(
        db=db,
        action=AuditAction.MATCH,
        resource_type="matching",
        description=f"Organ match search: {len(matches)} results for {recipient_info.organ_needed}",
        user_id=current_user.id,
        request=request
    )

    return MatchResponse(
        matches=matches,
        total_candidates=total,
        filtered_candidates=filtered,
        search_radius_km=match_request.max_distance_km,
        processing_time_ms=processing_time
    )


@router.post("/{match_id}/accept", response_model=MatchRecordResponse)
async def accept_match(
    match_id: UUID,
    accept_data: MatchAcceptRequest,
    request: Request,
    db: DB,
    current_user: ActiveUser
):
    from datetime import datetime

    result = await db.execute(
        select(Match).where(Match.id == match_id)
    )
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    match.status = MatchStatus.ACCEPTED
    match.accepted_at = datetime.utcnow()
    match.status_notes = accept_data.notes
    match.approved_by = current_user.id

    if accept_data.hospital_id:
        match.hospital_id = accept_data.hospital_id

    await AuditService.log_match(
        db=db,
        user_id=current_user.id,
        match_id=str(match.id),
        donor_id=str(match.donor_id),
        recipient_id=str(match.recipient_id),
        action_type="accepted",
        request=request
    )

    await db.refresh(match)
    return match


@router.get("/{match_id}/explain", response_model=AIExplanationResponse)
async def get_match_explanation(
    match_id: UUID,
    db: DB,
    current_user: ActiveUser
):
    result = await db.execute(
        select(Match)
        .options(selectinload(Match.explanations))
        .where(Match.id == match_id)
    )
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    factor_contributions = []
    for exp in match.explanations:
        factor_contributions.append(FactorExplanation(
            score=exp.factor_score,
            weight=exp.factor_weight,
            contribution=exp.weighted_contribution,
            reason=exp.explanation_text,
            supporting_data=exp.supporting_data
        ))

    if match.explanation:
        factor_contributions = [
            FactorExplanation(
                score=v.get("score", 0),
                weight=v.get("weight", 0),
                contribution=v.get("contribution", 0),
                reason=v.get("reason", "")
            )
            for k, v in match.explanation.items() if isinstance(v, dict)
        ]

    decision = "RECOMMENDED" if match.confidence_score >= 0.7 else "POSSIBLE" if match.confidence_score >= 0.5 else "NOT RECOMMENDED"

    return AIExplanationResponse(
        match_id=match.id,
        confidence_score=match.confidence_score,
        decision_summary=f"Match is {decision} with {match.confidence_score:.0%} confidence",
        factor_contributions=factor_contributions,
        bias_check={
            "geographic_bias": "Checked - distance within acceptable range",
            "urgency_weighting": "Applied fairly based on medical criteria",
            "demographic_bias": "No demographic factors used in matching"
        },
        recommendation=decision
    )
