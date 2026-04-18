from typing import Dict, List, Tuple, Any, Optional
import numpy as np
from datetime import date, datetime
from dataclasses import dataclass


@dataclass
class DonorFeatures:
    age: int
    weight_kg: float
    hemoglobin: float
    blood_pressure_systolic: int
    blood_pressure_diastolic: int
    has_chronic_disease: bool
    has_infectious_disease: bool
    days_since_last_donation: Optional[int]
    total_previous_donations: int
    is_smoker: bool
    is_heavy_drinker: bool
    bmi: float


class EligibilityClassifier:

    FEATURE_WEIGHTS = {
        "age": 0.15,
        "weight": 0.10,
        "hemoglobin": 0.20,
        "blood_pressure": 0.15,
        "health_conditions": 0.25,
        "donation_history": 0.10,
        "lifestyle": 0.05,
    }

    def __init__(self):
        self.thresholds = {
            "min_age": 18,
            "max_age": 65,
            "min_weight_kg": 50,
            "min_hemoglobin_male": 13.0,
            "min_hemoglobin_female": 12.5,
            "max_systolic": 180,
            "max_diastolic": 100,
            "min_days_between_donations": 56,
            "max_bmi": 40,
            "min_bmi": 18.5,
        }

    def calculate_eligibility(
        self,
        features: DonorFeatures,
        gender: str = "male"
    ) -> Tuple[bool, float, List[Dict[str, Any]]]:
        scores = []
        reasons = []
        is_eligible = True

        age_score, age_reason, age_eligible = self._score_age(features.age)
        scores.append(("age", age_score, self.FEATURE_WEIGHTS["age"]))
        reasons.append(age_reason)
        if not age_eligible:
            is_eligible = False

        weight_score, weight_reason, weight_eligible = self._score_weight(
            features.weight_kg)
        scores.append(("weight", weight_score, self.FEATURE_WEIGHTS["weight"]))
        reasons.append(weight_reason)
        if not weight_eligible:
            is_eligible = False

        min_hb = self.thresholds["min_hemoglobin_male"] if gender == "male" else self.thresholds["min_hemoglobin_female"]
        hb_score, hb_reason, hb_eligible = self._score_hemoglobin(
            features.hemoglobin, min_hb)
        scores.append(
            ("hemoglobin", hb_score, self.FEATURE_WEIGHTS["hemoglobin"]))
        reasons.append(hb_reason)
        if not hb_eligible:
            is_eligible = False

        bp_score, bp_reason, bp_eligible = self._score_blood_pressure(
            features.blood_pressure_systolic, features.blood_pressure_diastolic
        )
        scores.append(("blood_pressure", bp_score,
                      self.FEATURE_WEIGHTS["blood_pressure"]))
        reasons.append(bp_reason)
        if not bp_eligible:
            is_eligible = False

        health_score, health_reason, health_eligible = self._score_health_conditions(
            features.has_chronic_disease, features.has_infectious_disease
        )
        scores.append(("health_conditions", health_score,
                      self.FEATURE_WEIGHTS["health_conditions"]))
        reasons.append(health_reason)
        if not health_eligible:
            is_eligible = False

        donation_score, donation_reason, donation_eligible = self._score_donation_history(
            features.days_since_last_donation, features.total_previous_donations
        )
        scores.append(("donation_history", donation_score,
                      self.FEATURE_WEIGHTS["donation_history"]))
        reasons.append(donation_reason)
        if not donation_eligible:
            is_eligible = False

        lifestyle_score, lifestyle_reason, _ = self._score_lifestyle(
            features.is_smoker, features.is_heavy_drinker, features.bmi
        )
        scores.append(("lifestyle", lifestyle_score,
                      self.FEATURE_WEIGHTS["lifestyle"]))
        reasons.append(lifestyle_reason)

        total_score = sum(score * weight for _, score, weight in scores)

        explanations = []
        for (factor, score, weight), reason in zip(scores, reasons):
            explanations.append({
                "factor": factor,
                "score": round(score, 2),
                "weight": weight,
                "contribution": round(score * weight, 3),
                "explanation": reason["message"],
                "status": reason["status"]
            })

        return is_eligible, round(total_score, 3), explanations

    def _score_age(self, age: int) -> Tuple[float, Dict, bool]:
        if age < self.thresholds["min_age"]:
            return 0.0, {"message": f"Age {age} below minimum {self.thresholds['min_age']}", "status": "FAIL"}, False
        if age > self.thresholds["max_age"]:
            return 0.0, {"message": f"Age {age} above maximum {self.thresholds['max_age']}", "status": "FAIL"}, False

        if 25 <= age <= 50:
            score = 1.0
        elif 18 <= age < 25:
            score = 0.7 + (age - 18) * 0.043
        else:
            score = 1.0 - (age - 50) * 0.067

        return score, {"message": f"Age {age} is acceptable", "status": "PASS"}, True

    def _score_weight(self, weight: float) -> Tuple[float, Dict, bool]:
        if weight < self.thresholds["min_weight_kg"]:
            return 0.0, {"message": f"Weight {weight}kg below minimum {self.thresholds['min_weight_kg']}kg", "status": "FAIL"}, False

        if weight >= 60:
            score = 1.0
        else:
            score = 0.7 + (weight - 50) * 0.03

        return score, {"message": f"Weight {weight}kg is acceptable", "status": "PASS"}, True

    def _score_hemoglobin(self, hb: float, min_hb: float) -> Tuple[float, Dict, bool]:
        if hb < min_hb:
            return 0.0, {"message": f"Hemoglobin {hb} below minimum {min_hb}", "status": "FAIL"}, False

        if hb >= 14.0:
            score = 1.0
        else:
            score = 0.7 + (hb - min_hb) * 0.3

        return min(score, 1.0), {"message": f"Hemoglobin {hb} is acceptable", "status": "PASS"}, True

    def _score_blood_pressure(self, systolic: int, diastolic: int) -> Tuple[float, Dict, bool]:
        if systolic > self.thresholds["max_systolic"] or diastolic > self.thresholds["max_diastolic"]:
            return 0.0, {"message": f"BP {systolic}/{diastolic} exceeds safe limits", "status": "FAIL"}, False

        if 90 <= systolic <= 140 and 60 <= diastolic <= 90:
            score = 1.0
        else:
            score = 0.6

        return score, {"message": f"BP {systolic}/{diastolic} is acceptable", "status": "PASS"}, True

    def _score_health_conditions(self, has_chronic: bool, has_infectious: bool) -> Tuple[float, Dict, bool]:
        if has_infectious:
            return 0.0, {"message": "Infectious disease detected - ineligible", "status": "FAIL"}, False

        if has_chronic:
            return 0.5, {"message": "Chronic condition requires medical review", "status": "WARN"}, True

        return 1.0, {"message": "No health conditions reported", "status": "PASS"}, True

    def _score_donation_history(self, days_since: Optional[int], total: int) -> Tuple[float, Dict, bool]:
        if days_since is not None and days_since < self.thresholds["min_days_between_donations"]:
            return 0.0, {"message": f"Only {days_since} days since last donation (min: {self.thresholds['min_days_between_donations']})", "status": "FAIL"}, False

        if total >= 10:
            score = 1.0
        elif total >= 5:
            score = 0.9
        elif total >= 1:
            score = 0.8
        else:
            score = 0.7

        return score, {"message": f"Donation history: {total} previous donations", "status": "PASS"}, True

    def _score_lifestyle(self, smoker: bool, drinker: bool, bmi: float) -> Tuple[float, Dict, bool]:
        score = 1.0
        issues = []

        if smoker:
            score -= 0.2
            issues.append("smoker")

        if drinker:
            score -= 0.2
            issues.append("heavy drinking")

        if bmi < self.thresholds["min_bmi"] or bmi > self.thresholds["max_bmi"]:
            score -= 0.2
            issues.append(f"BMI {bmi:.1f} outside healthy range")

        if issues:
            return max(0.4, score), {"message": f"Lifestyle factors: {', '.join(issues)}", "status": "WARN"}, True

        return score, {"message": "Healthy lifestyle indicators", "status": "PASS"}, True


eligibility_classifier = EligibilityClassifier()
