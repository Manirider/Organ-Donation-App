from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from uuid import UUID
import time

from app.utils.geo import haversine_distance, estimate_travel_time
from app.utils.compatibility import (
    calculate_blood_compatibility_score,
    calculate_hla_compatibility,
    calculate_viability_score,
    get_organ_viability_hours,
    is_blood_compatible
)
from app.config import settings


@dataclass
class DonorCandidate:
    id: UUID
    blood_group: str
    rh_factor: str
    donor_type: str
    latitude: float
    longitude: float
    hla_type: Optional[str] = None
    is_eligible: bool = True
    hospital_id: Optional[UUID] = None


@dataclass
class RecipientInfo:
    id: UUID
    blood_group: str
    rh_factor: str
    organ_needed: str
    urgency_score: int
    latitude: float
    longitude: float
    hla_type: Optional[str] = None
    hospital_id: Optional[UUID] = None


@dataclass
class HospitalInfo:
    id: UUID
    name: str
    readiness_score: float
    latitude: float
    longitude: float


@dataclass
class MatchFactor:
    name: str
    score: float
    weight: float
    contribution: float
    reason: str
    supporting_data: Dict[str, Any] = None


@dataclass
class MatchResult:
    donor_id: UUID
    donor_type: str
    blood_group: str
    confidence_score: float
    distance_km: float
    estimated_transfer_hours: float
    factors: List[MatchFactor]
    hospital: Optional[HospitalInfo] = None


class OrganMatchingEngine:

    WEIGHTS = {
        "blood_compatibility": 0.25,
        "hla_compatibility": 0.20,
        "urgency_factor": 0.20,
        "geographic_score": 0.15,
        "viability_score": 0.10,
        "hospital_readiness": 0.10,
    }

    def __init__(self):
        self.max_distance = settings.MAX_VIABLE_DISTANCE_KM

    def find_matches(
        self,
        recipient: RecipientInfo,
        donors: List[DonorCandidate],
        hospitals: Optional[List[HospitalInfo]] = None,
        min_confidence: float = 0.5,
        max_results: int = 10
    ) -> Tuple[List[MatchResult], int, int]:
        start_time = time.time()
        total_candidates = len(donors)

        compatible_donors = [
            d for d in donors
            if is_blood_compatible(d.blood_group, d.rh_factor, recipient.blood_group, recipient.rh_factor)
            and d.is_eligible
        ]

        results = []
        for donor in compatible_donors:
            distance = haversine_distance(
                recipient.latitude, recipient.longitude,
                donor.latitude, donor.longitude
            )

            if distance > self.max_distance:
                continue

            viability_hours = get_organ_viability_hours(recipient.organ_needed)
            max_distance_for_organ = viability_hours * 100
            if distance > max_distance_for_organ:
                continue

            match_result = self._calculate_match_score(
                donor, recipient, distance, hospitals
            )

            if match_result.confidence_score >= min_confidence:
                results.append(match_result)

        results.sort(key=lambda x: x.confidence_score, reverse=True)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return results[:max_results], total_candidates, len(compatible_donors)

    def _calculate_match_score(
        self,
        donor: DonorCandidate,
        recipient: RecipientInfo,
        distance_km: float,
        hospitals: Optional[List[HospitalInfo]] = None
    ) -> MatchResult:
        factors = []

        blood_score, blood_reason = calculate_blood_compatibility_score(
            donor.blood_group, donor.rh_factor,
            recipient.blood_group, recipient.rh_factor
        )
        factors.append(MatchFactor(
            name="blood_compatibility",
            score=blood_score,
            weight=self.WEIGHTS["blood_compatibility"],
            contribution=blood_score * self.WEIGHTS["blood_compatibility"],
            reason=blood_reason,
            supporting_data={"donor_type": f"{donor.blood_group}{donor.rh_factor}",
                             "recipient_type": f"{recipient.blood_group}{recipient.rh_factor}"}
        ))

        hla_score, hla_reason = calculate_hla_compatibility(
            donor.hla_type, recipient.hla_type
        )
        factors.append(MatchFactor(
            name="hla_compatibility",
            score=hla_score,
            weight=self.WEIGHTS["hla_compatibility"],
            contribution=hla_score * self.WEIGHTS["hla_compatibility"],
            reason=hla_reason,
            supporting_data={"donor_hla": donor.hla_type,
                             "recipient_hla": recipient.hla_type}
        ))

        urgency_score = recipient.urgency_score / 10.0
        urgency_reason = f"Urgency level: {recipient.urgency_score}/10"
        if recipient.urgency_score >= 8:
            urgency_reason = f"CRITICAL: {urgency_reason}"
        elif recipient.urgency_score >= 5:
            urgency_reason = f"High priority: {urgency_reason}"

        factors.append(MatchFactor(
            name="urgency_factor",
            score=urgency_score,
            weight=self.WEIGHTS["urgency_factor"],
            contribution=urgency_score * self.WEIGHTS["urgency_factor"],
            reason=urgency_reason,
            supporting_data={"urgency_score": recipient.urgency_score}
        ))

        max_viable_distance = get_organ_viability_hours(
            recipient.organ_needed) * 100
        geo_score = max(0, 1 - (distance_km / max_viable_distance))
        geo_reason = f"Distance: {distance_km:.1f}km (max viable: {max_viable_distance:.0f}km)"

        factors.append(MatchFactor(
            name="geographic_score",
            score=geo_score,
            weight=self.WEIGHTS["geographic_score"],
            contribution=geo_score * self.WEIGHTS["geographic_score"],
            reason=geo_reason,
            supporting_data={"distance_km": distance_km,
                             "max_viable_km": max_viable_distance}
        ))

        viability_score, viability_reason = calculate_viability_score(
            recipient.organ_needed, distance_km
        )
        factors.append(MatchFactor(
            name="viability_score",
            score=viability_score,
            weight=self.WEIGHTS["viability_score"],
            contribution=viability_score * self.WEIGHTS["viability_score"],
            reason=viability_reason,
            supporting_data={"organ": recipient.organ_needed,
                             "distance_km": distance_km}
        ))

        hospital = None
        hospital_score = 0.8
        hospital_reason = "No hospital data available"

        if hospitals:
            sorted_hospitals = sorted(
                hospitals,
                key=lambda h: haversine_distance(
                    recipient.latitude, recipient.longitude,
                    h.latitude, h.longitude
                )
            )
            if sorted_hospitals:
                hospital = sorted_hospitals[0]
                hospital_score = hospital.readiness_score
                hospital_reason = f"{hospital.name}: readiness {hospital_score:.0%}"

        factors.append(MatchFactor(
            name="hospital_readiness",
            score=hospital_score,
            weight=self.WEIGHTS["hospital_readiness"],
            contribution=hospital_score * self.WEIGHTS["hospital_readiness"],
            reason=hospital_reason,
            supporting_data={"hospital_id": str(
                hospital.id) if hospital else None}
        ))

        confidence_score = sum(f.contribution for f in factors)

        transfer_hours = estimate_travel_time(distance_km, "ambulance")

        return MatchResult(
            donor_id=donor.id,
            donor_type=donor.donor_type,
            blood_group=f"{donor.blood_group}{'+'if donor.rh_factor == 'positive' else '-'}",
            confidence_score=round(confidence_score, 4),
            distance_km=round(distance_km, 2),
            estimated_transfer_hours=round(transfer_hours, 2),
            factors=factors,
            hospital=hospital
        )

    def get_explanation(self, match_result: MatchResult) -> Dict[str, Any]:
        explanation = {
            "match_summary": {
                "donor_id": str(match_result.donor_id),
                "confidence_score": match_result.confidence_score,
                "decision": "RECOMMENDED" if match_result.confidence_score >= 0.7 else
                "POSSIBLE" if match_result.confidence_score >= 0.5 else "NOT RECOMMENDED"
            },
            "factor_breakdown": [],
            "key_considerations": [],
            "potential_risks": []
        }

        sorted_factors = sorted(match_result.factors,
                                key=lambda f: f.contribution, reverse=True)

        for factor in sorted_factors:
            explanation["factor_breakdown"].append({
                "factor": factor.name.replace("_", " ").title(),
                "score": f"{factor.score:.2f}",
                "weight": f"{factor.weight:.0%}",
                "contribution": f"{factor.contribution:.2f}",
                "explanation": factor.reason
            })

            if factor.score >= 0.8:
                explanation["key_considerations"].append(f"✓ {factor.reason}")
            elif factor.score < 0.5:
                explanation["potential_risks"].append(f"⚠ {factor.reason}")

        return explanation


class BloodMatchingEngine:

    def find_donors(
        self,
        blood_group: str,
        rh_factor: str,
        center_lat: float,
        center_lon: float,
        donors: List[DonorCandidate],
        radius_km: float = 100,
        max_results: int = 20
    ) -> List[Dict[str, Any]]:
        compatible = []

        for donor in donors:
            if not is_blood_compatible(donor.blood_group, donor.rh_factor, blood_group, rh_factor):
                continue

            distance = haversine_distance(
                center_lat, center_lon, donor.latitude, donor.longitude)

            if distance > radius_km:
                continue

            score, reason = calculate_blood_compatibility_score(
                donor.blood_group, donor.rh_factor,
                blood_group, rh_factor
            )

            distance_score = 1 - (distance / radius_km)
            combined_score = (score * 0.6) + (distance_score * 0.4)

            compatible.append({
                "donor_id": str(donor.id),
                "blood_type": f"{donor.blood_group}{'+'if donor.rh_factor == 'positive' else '-'}",
                "distance_km": round(distance, 2),
                "compatibility_score": round(score, 2),
                "combined_score": round(combined_score, 2),
                "reason": reason
            })

        compatible.sort(key=lambda x: x["combined_score"], reverse=True)
        return compatible[:max_results]


organ_matching_engine = OrganMatchingEngine()
blood_matching_engine = BloodMatchingEngine()
