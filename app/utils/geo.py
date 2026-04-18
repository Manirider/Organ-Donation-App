import math
from typing import List, Tuple, Optional


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lon = math.radians(lon2 - lon1)

    x = math.sin(delta_lon) * math.cos(lat2_rad)
    y = math.cos(lat1_rad) * math.sin(lat2_rad) - \
        math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(delta_lon)

    bearing = math.atan2(x, y)
    return (math.degrees(bearing) + 360) % 360


def destination_point(lat: float, lon: float, distance_km: float, bearing_deg: float) -> Tuple[float, float]:
    R = 6371.0
    d = distance_km / R

    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    bearing_rad = math.radians(bearing_deg)

    lat2 = math.asin(
        math.sin(lat_rad) * math.cos(d) +
        math.cos(lat_rad) * math.sin(d) * math.cos(bearing_rad)
    )
    lon2 = lon_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(d) * math.cos(lat_rad),
        math.cos(d) - math.sin(lat_rad) * math.sin(lat2)
    )

    return (math.degrees(lat2), math.degrees(lon2))


def bounding_box(lat: float, lon: float, radius_km: float) -> Tuple[float, float, float, float]:
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * math.cos(math.radians(lat)))

    return (
        lat - lat_delta,
        lat + lat_delta,
        lon - lon_delta,
        lon + lon_delta
    )


def estimate_travel_time(distance_km: float, mode: str = "road") -> float:
    speeds = {
        "road": 60,
        "helicopter": 250,
        "ambulance": 50,
        "air": 500
    }

    speed = speeds.get(mode, 60)
    return distance_km / speed


def sort_by_distance(
    center_lat: float,
    center_lon: float,
    locations: List[Tuple[any, float, float]]
) -> List[Tuple[any, float]]:
    result = []
    for item, lat, lon in locations:
        distance = haversine_distance(center_lat, center_lon, lat, lon)
        result.append((item, distance))

    result.sort(key=lambda x: x[1])
    return result


MAJOR_CITIES_INDIA = {
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.7041, 77.1025),
    "Bangalore": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Pune": (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873),
    "Lucknow": (26.8467, 80.9462),
}


def get_nearest_major_city(lat: float, lon: float) -> Tuple[str, float]:
    nearest_city = None
    min_distance = float('inf')

    for city, (city_lat, city_lon) in MAJOR_CITIES_INDIA.items():
        distance = haversine_distance(lat, lon, city_lat, city_lon)
        if distance < min_distance:
            min_distance = distance
            nearest_city = city

    return (nearest_city, min_distance)
