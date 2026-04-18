import pytest
from app.ml.eligibility import eligibility_classifier, DonorFeatures
from app.ml.success_predictor import success_predictor, TransplantFeatures
from app.ml.priority_scorer import priority_scorer, RecipientPriorityFeatures


class TestEligibilityClassifier:

    def test_eligible_donor(self):
        features = DonorFeatures(
            age=35,
            weight_kg=70,
            hemoglobin=14.5,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            has_chronic_disease=False,
            has_infectious_disease=False,
            days_since_last_donation=90,
            total_previous_donations=5,
            is_smoker=False,
            is_heavy_drinker=False,
            bmi=24.5
        )

        is_eligible, score, explanation = eligibility_classifier.calculate_eligibility(
            features)

        assert is_eligible is True
        assert score >= 0.8
        assert len(explanation) > 0

    def test_underage_ineligible(self):
        features = DonorFeatures(
            age=16,
            weight_kg=55,
            hemoglobin=13.0,
            blood_pressure_systolic=110,
            blood_pressure_diastolic=70,
            has_chronic_disease=False,
            has_infectious_disease=False,
            days_since_last_donation=None,
            total_previous_donations=0,
            is_smoker=False,
            is_heavy_drinker=False,
            bmi=22.0
        )

        is_eligible, score, explanation = eligibility_classifier.calculate_eligibility(
            features)

        assert is_eligible is False

    def test_infectious_disease_ineligible(self):
        features = DonorFeatures(
            age=30,
            weight_kg=65,
            hemoglobin=14.0,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            has_chronic_disease=False,
            has_infectious_disease=True,
            days_since_last_donation=120,
            total_previous_donations=3,
            is_smoker=False,
            is_heavy_drinker=False,
            bmi=23.0
        )

        is_eligible, score, explanation = eligibility_classifier.calculate_eligibility(
            features)

        assert is_eligible is False


class TestSuccessPredictor:

    def test_ideal_kidney_transplant(self):
        features = TransplantFeatures(
            donor_age=35,
            recipient_age=40,
            blood_match_score=1.0,
            hla_match_score=0.85,
            organ_type="kidney",
            cold_ischemia_time_hours=8,
            recipient_urgency=6,
            donor_type="living",
            recipient_health_score=0.8,
            distance_km=100
        )

        probability, explanation = success_predictor.predict_success(features)

        assert probability >= 0.85
        assert "risk_level" in explanation
        assert explanation["risk_level"] in ["LOW", "MODERATE"]

    def test_high_risk_heart_transplant(self):
        features = TransplantFeatures(
            donor_age=60,
            recipient_age=70,
            blood_match_score=0.8,
            hla_match_score=0.5,
            organ_type="heart",
            cold_ischemia_time_hours=5,
            recipient_urgency=9,
            donor_type="deceased",
            recipient_health_score=0.4,
            distance_km=400
        )

        probability, explanation = success_predictor.predict_success(features)

        assert probability < 0.85


class TestPriorityScorer:

    def test_critical_patient(self):
        features = RecipientPriorityFeatures(
            urgency_score=9,
            days_on_waitlist=365,
            medical_compatibility_score=0.8,
            age=50,
            has_previous_transplant=False,
            distance_to_nearest_center_km=30,
            organ_needed="kidney"
        )

        score, explanation = priority_scorer.calculate_priority(features)

        assert score >= 70
        assert explanation["priority_tier"] in ["CRITICAL", "HIGH"]

    def test_pediatric_bonus(self):
        adult_features = RecipientPriorityFeatures(
            urgency_score=5,
            days_on_waitlist=180,
            medical_compatibility_score=0.7,
            age=40,
            has_previous_transplant=False,
            distance_to_nearest_center_km=50,
            organ_needed="kidney"
        )

        child_features = RecipientPriorityFeatures(
            urgency_score=5,
            days_on_waitlist=180,
            medical_compatibility_score=0.7,
            age=12,
            has_previous_transplant=False,
            distance_to_nearest_center_km=50,
            organ_needed="kidney"
        )

        adult_score, _ = priority_scorer.calculate_priority(adult_features)
        child_score, _ = priority_scorer.calculate_priority(child_features)

        assert child_score > adult_score
