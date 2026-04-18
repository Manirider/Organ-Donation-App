from typing import Dict, List, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class RecipientPriorityFeatures:
    urgency_score: int
    days_on_waitlist: int
    medical_compatibility_score: float
    age: int
    has_previous_transplant: bool
    distance_to_nearest_center_km: float
    organ_needed: str


class PriorityScorer:

    WEIGHTS = {
        "medical_urgency": 0.35,
        "waitlist_time": 0.25,
        "compatibility": 0.20,
        "geographic_access": 0.10,
        "special_factors": 0.10,
    }

    PEDIATRIC_BONUS = 5.0
    PREVIOUS_TRANSPLANT_PENALTY = -3.0

    def calculate_priority(self, features: RecipientPriorityFeatures) -> Tuple[float, Dict[str, Any]]:
        components = []

        urgency_points = self._urgency_points(features.urgency_score)
        components.append(("medical_urgency", urgency_points,
                          self.WEIGHTS["medical_urgency"]))

        waitlist_points = self._waitlist_points(
            features.days_on_waitlist, features.organ_needed)
        components.append(("waitlist_time", waitlist_points,
                          self.WEIGHTS["waitlist_time"]))

        compat_points = features.medical_compatibility_score * 100
        components.append(("compatibility", compat_points,
                          self.WEIGHTS["compatibility"]))

        geo_points = self._geographic_points(
            features.distance_to_nearest_center_km)
        components.append(("geographic_access", geo_points,
                          self.WEIGHTS["geographic_access"]))

        special_points = self._special_factors(
            features.age, features.has_previous_transplant)
        components.append(("special_factors", special_points,
                          self.WEIGHTS["special_factors"]))

        weighted_total = sum(points * weight for _,
                             points, weight in components)

        final_score = max(0, min(100, weighted_total))

        explanation = {
            "priority_score": round(final_score, 2),
            "priority_tier": self._get_tier(final_score),
            "components": [
                {
                    "factor": name,
                    "raw_points": round(points, 2),
                    "weight": weight,
                    "contribution": round(points * weight, 2)
                }
                for name, points, weight in components
            ],
            "recommendation": self._get_recommendation(final_score)
        }

        return final_score, explanation

    def _urgency_points(self, urgency_score: int) -> float:
        if urgency_score >= 9:
            return 100.0
        elif urgency_score >= 7:
            return 80.0 + (urgency_score - 7) * 10
        elif urgency_score >= 5:
            return 50.0 + (urgency_score - 5) * 15
        else:
            return urgency_score * 12.5

    def _waitlist_points(self, days: int, organ: str) -> float:
        avg_wait = {
            "kidney": 1825,
            "liver": 365,
            "heart": 180,
            "lung": 365,
            "pancreas": 730,
        }.get(organ.lower(), 365)

        ratio = days / avg_wait

        if ratio >= 1.5:
            return 100.0
        elif ratio >= 1.0:
            return 70.0 + (ratio - 1.0) * 60
        elif ratio >= 0.5:
            return 40.0 + (ratio - 0.5) * 60
        else:
            return ratio * 80

    def _geographic_points(self, distance_km: float) -> float:
        if distance_km <= 50:
            return 100.0
        elif distance_km <= 200:
            return 100 - (distance_km - 50) * 0.2
        elif distance_km <= 500:
            return 70 - (distance_km - 200) * 0.1
        else:
            return max(30, 40 - (distance_km - 500) * 0.02)

    def _special_factors(self, age: int, has_previous: bool) -> float:
        points = 50.0

        if age < 18:
            points += self.PEDIATRIC_BONUS * 10

        if has_previous:
            points += self.PREVIOUS_TRANSPLANT_PENALTY * 10

        return max(0, min(100, points))

    def _get_tier(self, score: float) -> str:
        if score >= 80:
            return "CRITICAL"
        elif score >= 60:
            return "HIGH"
        elif score >= 40:
            return "MODERATE"
        else:
            return "STANDARD"

    def _get_recommendation(self, score: float) -> str:
        if score >= 80:
            return "Immediate priority for next available match"
        elif score >= 60:
            return "High priority - consider for all compatible matches"
        elif score >= 40:
            return "Active candidate - regular matching consideration"
        else:
            return "Standard waitlist position - monitor for status changes"


priority_scorer = PriorityScorer()
