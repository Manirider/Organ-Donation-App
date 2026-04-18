import pytest
from datetime import date
from app.utils.geo import haversine_distance, bounding_box, estimate_travel_time
from app.utils.compatibility import (
    is_blood_compatible, calculate_blood_compatibility_score,
    calculate_hla_compatibility, calculate_viability_score
)


class TestHaversineDistance:

    def test_same_location_returns_zero(self):
        distance = haversine_distance(28.6139, 77.2090, 28.6139, 77.2090)
        assert distance == 0.0

    def test_delhi_to_mumbai(self):
        delhi = (28.6139, 77.2090)
        mumbai = (19.0760, 72.8777)
        distance = haversine_distance(*delhi, *mumbai)
        assert 1100 < distance < 1200

    def test_bangalore_to_chennai(self):
        bangalore = (12.9716, 77.5946)
        chennai = (13.0827, 80.2707)
        distance = haversine_distance(*bangalore, *chennai)
        assert 280 < distance < 320


class TestBoundingBox:

    def test_bounding_box_delhi(self):
        lat, lon = 28.6139, 77.2090
        radius_km = 50
        min_lat, max_lat, min_lon, max_lon = bounding_box(lat, lon, radius_km)

        assert min_lat < lat < max_lat
        assert min_lon < lon < max_lon
        assert abs(max_lat - min_lat) > 0


class TestBloodCompatibility:

    def test_exact_match_compatible(self):
        assert is_blood_compatible("O", "positive", "O", "positive") is True
        assert is_blood_compatible("A", "negative", "A", "negative") is True

    def test_universal_donor(self):
        assert is_blood_compatible("O", "negative", "A", "positive") is True
        assert is_blood_compatible("O", "negative", "B", "negative") is True
        assert is_blood_compatible("O", "negative", "AB", "positive") is True

    def test_universal_recipient(self):
        assert is_blood_compatible("O", "negative", "AB", "positive") is True
        assert is_blood_compatible("A", "positive", "AB", "positive") is True
        assert is_blood_compatible("B", "negative", "AB", "positive") is True

    def test_incompatible(self):
        assert is_blood_compatible("A", "positive", "B", "positive") is False
        assert is_blood_compatible("B", "positive", "A", "positive") is False
        assert is_blood_compatible("AB", "positive", "O", "positive") is False


class TestBloodCompatibilityScore:

    def test_exact_match_score(self):
        score, reason = calculate_blood_compatibility_score(
            "O", "positive", "O", "positive")
        assert score == 1.0
        assert "Exact match" in reason

    def test_incompatible_score(self):
        score, reason = calculate_blood_compatibility_score(
            "A", "positive", "B", "positive")
        assert score == 0.0
        assert "Incompatible" in reason

    def test_universal_donor_score(self):
        score, reason = calculate_blood_compatibility_score(
            "O", "negative", "A", "positive")
        assert score >= 0.8


class TestHLACompatibility:

    def test_perfect_match(self):
        hla = "A2,A24,B35,B44,DR4,DR7"
        score, reason = calculate_hla_compatibility(hla, hla)
        assert score == 1.0

    def test_partial_match(self):
        donor_hla = "A2,A24,B35,B44,DR4,DR7"
        recipient_hla = "A2,A3,B35,B51,DR4,DR11"
        score, reason = calculate_hla_compatibility(donor_hla, recipient_hla)
        assert 0.3 <= score <= 0.7

    def test_no_hla_data(self):
        score, reason = calculate_hla_compatibility(None, None)
        assert score == 0.5
        assert "unavailable" in reason.lower()


class TestViabilityScore:

    def test_short_distance_kidney(self):
        score, reason = calculate_viability_score("kidney", 100)
        assert score >= 0.85

    def test_long_distance_heart(self):
        score, reason = calculate_viability_score("heart", 500)
        assert score == 0.0

    def test_viable_heart(self):
        score, reason = calculate_viability_score("heart", 200)
        assert score > 0


class TestTravelTime:

    def test_road_travel(self):
        time_hours = estimate_travel_time(120, "road")
        assert time_hours == 2.0

    def test_helicopter_travel(self):
        time_hours = estimate_travel_time(500, "helicopter")
        assert time_hours == 2.0
