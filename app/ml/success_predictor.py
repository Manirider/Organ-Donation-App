from typing import Dict, List, Tuple, Any
from dataclasses import dataclass


@dataclass
class TransplantFeatures:
    donor_age: int
    recipient_age: int
    blood_match_score: float
    hla_match_score: float
    organ_type: str
    cold_ischemia_time_hours: float
    recipient_urgency: int
    donor_type: str
    recipient_health_score: float
    distance_km: float


class SuccessPredictor:

    BASE_SUCCESS_RATES = {
        "kidney": 0.95,
        "liver": 0.90,
        "heart": 0.85,
        "lung": 0.80,
        "pancreas": 0.85,
        "intestine": 0.75,
        "cornea": 0.95,
        "bone_marrow": 0.70,
    }

    FEATURE_IMPACTS = {
        "donor_age": -0.005,
        "recipient_age": -0.003,
        "blood_match": 0.15,
        "hla_match": 0.12,
        "cold_ischemia": -0.02,
        "recipient_health": 0.10,
        "living_donor_bonus": 0.08,
    }

    def predict_success(self, features: TransplantFeatures) -> Tuple[float, Dict[str, Any]]:
        base_rate = self.BASE_SUCCESS_RATES.get(
            features.organ_type.lower(), 0.80)

        adjustments = []

        donor_age_adj = 0
        if features.donor_age < 25:
            donor_age_adj = 0.02
        elif features.donor_age > 50:
            donor_age_adj = (features.donor_age - 50) * \
                self.FEATURE_IMPACTS["donor_age"]
        adjustments.append(("donor_age", donor_age_adj,
                           f"Donor age: {features.donor_age}"))

        recipient_age_adj = 0
        if features.recipient_age > 60:
            recipient_age_adj = (features.recipient_age - 60) * \
                self.FEATURE_IMPACTS["recipient_age"]
        adjustments.append(("recipient_age", recipient_age_adj,
                           f"Recipient age: {features.recipient_age}"))

        blood_adj = (features.blood_match_score - 0.7) * \
            self.FEATURE_IMPACTS["blood_match"]
        adjustments.append(
            ("blood_match", blood_adj, f"Blood match: {features.blood_match_score:.0%}"))

        hla_adj = (features.hla_match_score - 0.5) * \
            self.FEATURE_IMPACTS["hla_match"]
        adjustments.append(
            ("hla_match", hla_adj, f"HLA match: {features.hla_match_score:.0%}"))

        cold_adj = 0
        max_hours = {"kidney": 36, "liver": 12, "heart": 6,
                     "lung": 8}.get(features.organ_type.lower(), 12)
        if features.cold_ischemia_time_hours > max_hours * 0.5:
            cold_adj = (features.cold_ischemia_time_hours -
                        max_hours * 0.5) * self.FEATURE_IMPACTS["cold_ischemia"]
        adjustments.append(("cold_ischemia", cold_adj,
                           f"Cold ischemia: {features.cold_ischemia_time_hours:.1f}h"))

        health_adj = (features.recipient_health_score - 0.5) * \
            self.FEATURE_IMPACTS["recipient_health"]
        adjustments.append(("recipient_health", health_adj,
                           f"Recipient health: {features.recipient_health_score:.0%}"))

        donor_type_adj = self.FEATURE_IMPACTS["living_donor_bonus"] if features.donor_type.lower(
        ) == "living" else 0
        adjustments.append(("donor_type", donor_type_adj,
                           f"Donor type: {features.donor_type}"))

        total_adjustment = sum(adj for _, adj, _ in adjustments)
        final_probability = max(0.1, min(0.99, base_rate + total_adjustment))

        explanation = {
            "base_success_rate": base_rate,
            "organ_type": features.organ_type,
            "adjustments": [
                {"factor": name, "adjustment": round(adj, 4), "reason": reason}
                for name, adj, reason in adjustments
            ],
            "total_adjustment": round(total_adjustment, 4),
            "final_probability": round(final_probability, 4),
            "risk_level": self._get_risk_level(final_probability)
        }

        return final_probability, explanation

    def _get_risk_level(self, probability: float) -> str:
        if probability >= 0.90:
            return "LOW"
        elif probability >= 0.80:
            return "MODERATE"
        elif probability >= 0.70:
            return "ELEVATED"
        else:
            return "HIGH"

    def get_recommendations(self, features: TransplantFeatures, probability: float) -> List[str]:
        recommendations = []

        if features.cold_ischemia_time_hours > 4 and features.organ_type.lower() in ["heart", "lung"]:
            recommendations.append(
                "⚠️ Prioritize rapid transport - critical organ with high ischemia sensitivity")

        if features.hla_match_score < 0.5:
            recommendations.append(
                "📋 Consider enhanced immunosuppression protocol for HLA mismatch")

        if features.recipient_urgency >= 8:
            recommendations.append(
                "🚨 High urgency case - expedite all procedures")

        if probability < 0.75:
            recommendations.append(
                "⚕️ Recommend extended post-operative monitoring")

        return recommendations


success_predictor = SuccessPredictor()
