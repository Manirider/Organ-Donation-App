from typing import Dict, List, Tuple


BLOOD_COMPATIBILITY_CHART = {
    "O-": {"can_receive": ["O-"], "can_donate_to": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]},
    "O+": {"can_receive": ["O-", "O+"], "can_donate_to": ["O+", "A+", "B+", "AB+"]},
    "A-": {"can_receive": ["O-", "A-"], "can_donate_to": ["A-", "A+", "AB-", "AB+"]},
    "A+": {"can_receive": ["O-", "O+", "A-", "A+"], "can_donate_to": ["A+", "AB+"]},
    "B-": {"can_receive": ["O-", "B-"], "can_donate_to": ["B-", "B+", "AB-", "AB+"]},
    "B+": {"can_receive": ["O-", "O+", "B-", "B+"], "can_donate_to": ["B+", "AB+"]},
    "AB-": {"can_receive": ["O-", "A-", "B-", "AB-"], "can_donate_to": ["AB-", "AB+"]},
    "AB+": {"can_receive": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], "can_donate_to": ["AB+"]},
}


def get_blood_type(blood_group: str, rh_factor: str) -> str:
    rh = "+" if rh_factor.lower() == "positive" else "-"
    return f"{blood_group}{rh}"


def is_blood_compatible(donor_group: str, donor_rh: str, recipient_group: str, recipient_rh: str) -> bool:
    donor_type = get_blood_type(donor_group, donor_rh)
    recipient_type = get_blood_type(recipient_group, recipient_rh)

    recipient_can_receive = BLOOD_COMPATIBILITY_CHART.get(
        recipient_type, {}).get("can_receive", [])
    return donor_type in recipient_can_receive


def calculate_blood_compatibility_score(
    donor_group: str, donor_rh: str,
    recipient_group: str, recipient_rh: str
) -> Tuple[float, str]:
    if not is_blood_compatible(donor_group, donor_rh, recipient_group, recipient_rh):
        return 0.0, "Incompatible blood types"

    donor_type = get_blood_type(donor_group, donor_rh)
    recipient_type = get_blood_type(recipient_group, recipient_rh)

    if donor_type == recipient_type:
        return 1.0, f"Exact match: {donor_type}"

    if donor_group == recipient_group:
        return 0.9, f"Same blood group, different Rh: {donor_type} → {recipient_type}"

    if donor_type == "O-":
        return 0.85, f"Universal donor: {donor_type} → {recipient_type}"

    if donor_type.startswith("O"):
        return 0.8, f"O type donor: {donor_type} → {recipient_type}"

    return 0.75, f"Compatible: {donor_type} → {recipient_type}"


def get_compatible_donors(recipient_group: str, recipient_rh: str) -> List[str]:
    recipient_type = get_blood_type(recipient_group, recipient_rh)
    return BLOOD_COMPATIBILITY_CHART.get(recipient_type, {}).get("can_receive", [])


def get_compatible_recipients(donor_group: str, donor_rh: str) -> List[str]:
    donor_type = get_blood_type(donor_group, donor_rh)
    return BLOOD_COMPATIBILITY_CHART.get(donor_type, {}).get("can_donate_to", [])


ORGAN_COMPATIBILITY_FACTORS = {
    "kidney": {"max_viability_hours": 36, "blood_match_required": True, "hla_importance": 0.3},
    "liver": {"max_viability_hours": 12, "blood_match_required": True, "hla_importance": 0.15},
    "heart": {"max_viability_hours": 6, "blood_match_required": True, "hla_importance": 0.1},
    "lung": {"max_viability_hours": 8, "blood_match_required": True, "hla_importance": 0.1},
    "pancreas": {"max_viability_hours": 18, "blood_match_required": True, "hla_importance": 0.2},
    "intestine": {"max_viability_hours": 12, "blood_match_required": True, "hla_importance": 0.25},
    "cornea": {"max_viability_hours": 168, "blood_match_required": False, "hla_importance": 0.0},
    "bone_marrow": {"max_viability_hours": 48, "blood_match_required": False, "hla_importance": 0.9},
}


def calculate_hla_compatibility(donor_hla: str, recipient_hla: str) -> Tuple[float, str]:
    if not donor_hla or not recipient_hla:
        return 0.5, "HLA data unavailable - estimated compatibility"

    donor_alleles = set(donor_hla.upper().replace(" ", "").split(","))
    recipient_alleles = set(recipient_hla.upper().replace(" ", "").split(","))

    if not donor_alleles or not recipient_alleles:
        return 0.5, "HLA data incomplete"

    matches = len(donor_alleles.intersection(recipient_alleles))
    total = len(recipient_alleles)

    if total == 0:
        return 0.5, "No HLA data to compare"

    match_ratio = matches / total

    if match_ratio >= 0.83:
        return 1.0, f"Excellent HLA match: {matches}/{total} alleles"
    elif match_ratio >= 0.67:
        return 0.85, f"Good HLA match: {matches}/{total} alleles"
    elif match_ratio >= 0.5:
        return 0.7, f"Acceptable HLA match: {matches}/{total} alleles"
    elif match_ratio >= 0.33:
        return 0.5, f"Moderate HLA match: {matches}/{total} alleles"
    else:
        return 0.3, f"Poor HLA match: {matches}/{total} alleles"


def get_organ_viability_hours(organ_type: str) -> int:
    return ORGAN_COMPATIBILITY_FACTORS.get(organ_type.lower(), {}).get("max_viability_hours", 12)


def calculate_viability_score(
    organ_type: str,
    distance_km: float,
    transfer_speed_kmh: float = 100
) -> Tuple[float, str]:
    max_hours = get_organ_viability_hours(organ_type)
    transfer_hours = distance_km / transfer_speed_kmh

    remaining_hours = max_hours - transfer_hours

    if remaining_hours <= 0:
        return 0.0, f"Organ cannot reach in time: {transfer_hours:.1f}h > {max_hours}h viability"

    buffer_ratio = remaining_hours / max_hours

    if buffer_ratio >= 0.7:
        return 1.0, f"Excellent timing: {remaining_hours:.1f}h remaining of {max_hours}h"
    elif buffer_ratio >= 0.5:
        return 0.85, f"Good timing: {remaining_hours:.1f}h remaining of {max_hours}h"
    elif buffer_ratio >= 0.3:
        return 0.6, f"Acceptable timing: {remaining_hours:.1f}h remaining of {max_hours}h"
    else:
        return 0.3, f"Tight timing: only {remaining_hours:.1f}h remaining of {max_hours}h"
