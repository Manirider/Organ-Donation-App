import pytest
from uuid import uuid4
from app.ml.matching_engine import (
    OrganMatchingEngine, BloodMatchingEngine,
    DonorCandidate, RecipientInfo, HospitalInfo
)


class TestOrganMatchingEngine:

    def setup_method(self):
        self.engine = OrganMatchingEngine()

    def test_compatible_match_found(self):
        recipient = RecipientInfo(
            id=uuid4(),
            blood_group="O",
            rh_factor="positive",
            organ_needed="kidney",
            urgency_score=7,
            latitude=28.6139,
            longitude=77.2090,
            hla_type="A2,A24,B35,B44,DR4,DR7"
        )

        donors = [
            DonorCandidate(
                id=uuid4(),
                blood_group="O",
                rh_factor="positive",
                donor_type="living",
                latitude=28.5355,
                longitude=77.3910,
                hla_type="A2,A3,B35,B51,DR4,DR11",
                is_eligible=True
            ),
            DonorCandidate(
                id=uuid4(),
                blood_group="O",
                rh_factor="negative",
                donor_type="living",
                latitude=28.4595,
                longitude=77.0266,
                hla_type="A1,A2,B7,B44,DR3,DR4",
                is_eligible=True
            )
        ]

        results, total, filtered = self.engine.find_matches(
            recipient=recipient,
            donors=donors,
            min_confidence=0.3,
            max_results=10
        )

        assert len(results) >= 1
        assert total == 2
        assert all(r.confidence_score > 0 for r in results)

    def test_incompatible_donors_filtered(self):
        recipient = RecipientInfo(
            id=uuid4(),
            blood_group="A",
            rh_factor="negative",
            organ_needed="kidney",
            urgency_score=5,
            latitude=28.6139,
            longitude=77.2090
        )

        donors = [
            DonorCandidate(
                id=uuid4(),
                blood_group="B",
                rh_factor="positive",
                donor_type="living",
                latitude=28.5355,
                longitude=77.3910,
                is_eligible=True
            )
        ]

        results, total, filtered = self.engine.find_matches(
            recipient=recipient,
            donors=donors,
            min_confidence=0.3
        )

        assert len(results) == 0
        assert filtered == 0

    def test_match_explanation_generated(self):
        recipient = RecipientInfo(
            id=uuid4(),
            blood_group="O",
            rh_factor="positive",
            organ_needed="kidney",
            urgency_score=8,
            latitude=28.6139,
            longitude=77.2090
        )

        donors = [
            DonorCandidate(
                id=uuid4(),
                blood_group="O",
                rh_factor="positive",
                donor_type="living",
                latitude=28.5355,
                longitude=77.3910,
                is_eligible=True
            )
        ]

        results, _, _ = self.engine.find_matches(
            recipient=recipient,
            donors=donors,
            min_confidence=0.3
        )

        if results:
            explanation = self.engine.get_explanation(results[0])
            assert "factor_breakdown" in explanation
            assert "match_summary" in explanation
            assert len(explanation["factor_breakdown"]) > 0


class TestBloodMatchingEngine:

    def setup_method(self):
        self.engine = BloodMatchingEngine()

    def test_find_compatible_blood_donors(self):
        donors = [
            DonorCandidate(
                id=uuid4(),
                blood_group="O",
                rh_factor="negative",
                donor_type="blood",
                latitude=28.5355,
                longitude=77.3910,
                is_eligible=True
            ),
            DonorCandidate(
                id=uuid4(),
                blood_group="A",
                rh_factor="positive",
                donor_type="blood",
                latitude=28.4595,
                longitude=77.0266,
                is_eligible=True
            )
        ]

        results = self.engine.find_donors(
            blood_group="A",
            rh_factor="positive",
            center_lat=28.6139,
            center_lon=77.2090,
            donors=donors,
            radius_km=100
        )

        assert len(results) >= 1
        for result in results:
            assert "donor_id" in result
            assert "combined_score" in result
