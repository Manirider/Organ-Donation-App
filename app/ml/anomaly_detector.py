from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict
import statistics


@dataclass
class UserActivity:
    user_id: str
    action_type: str
    timestamp: datetime
    ip_address: str
    details: Dict[str, Any]


class AnomalyDetector:

    THRESHOLDS = {
        "max_registrations_per_ip_per_day": 3,
        "max_profile_updates_per_hour": 10,
        "max_consent_changes_per_day": 5,
        "max_match_requests_per_hour": 20,
        "suspicious_location_change_km": 500,
        "suspicious_time_window_hours": 1,
    }

    HIGH_RISK_PATTERNS = [
        "multiple_registrations_same_ip",
        "rapid_consent_toggling",
        "impossible_location_changes",
        "after_hours_admin_activity",
        "bulk_data_access",
        "multiple_failed_verifications",
    ]

    def __init__(self):
        self.activity_cache: Dict[str, List[UserActivity]] = defaultdict(list)
        self.ip_cache: Dict[str, List[datetime]] = defaultdict(list)

    def analyze_activity(
        self,
        activities: List[UserActivity]
    ) -> Tuple[float, List[Dict[str, Any]]]:
        anomalies = []

        by_user = defaultdict(list)
        by_ip = defaultdict(list)

        for activity in activities:
            by_user[activity.user_id].append(activity)
            by_ip[activity.ip_address].append(activity)

        for user_id, user_activities in by_user.items():
            user_anomalies = self._analyze_user_behavior(
                user_id, user_activities)
            anomalies.extend(user_anomalies)

        for ip, ip_activities in by_ip.items():
            ip_anomalies = self._analyze_ip_behavior(ip, ip_activities)
            anomalies.extend(ip_anomalies)

        temporal_anomalies = self._analyze_temporal_patterns(activities)
        anomalies.extend(temporal_anomalies)

        risk_score = self._calculate_risk_score(anomalies)

        return risk_score, anomalies

    def _analyze_user_behavior(
        self,
        user_id: str,
        activities: List[UserActivity]
    ) -> List[Dict[str, Any]]:
        anomalies = []

        sorted_activities = sorted(activities, key=lambda a: a.timestamp)

        consent_changes = [
            a for a in sorted_activities if a.action_type == "consent_change"]
        if len(consent_changes) > self.THRESHOLDS["max_consent_changes_per_day"]:
            anomalies.append({
                "type": "rapid_consent_toggling",
                "severity": "HIGH",
                "user_id": user_id,
                "details": f"{len(consent_changes)} consent changes detected",
                "recommendation": "Require manual verification for further consent changes"
            })

        locations = []
        for activity in sorted_activities:
            if "latitude" in activity.details and "longitude" in activity.details:
                locations.append({
                    "lat": activity.details["latitude"],
                    "lon": activity.details["longitude"],
                    "time": activity.timestamp
                })

        if len(locations) >= 2:
            for i in range(1, len(locations)):
                prev = locations[i-1]
                curr = locations[i]
                time_diff = (curr["time"] - prev["time"]
                             ).total_seconds() / 3600

                if time_diff > 0 and time_diff < self.THRESHOLDS["suspicious_time_window_hours"]:
                    from app.utils.geo import haversine_distance
                    distance = haversine_distance(
                        prev["lat"], prev["lon"],
                        curr["lat"], curr["lon"]
                    )

                    if distance > self.THRESHOLDS["suspicious_location_change_km"]:
                        anomalies.append({
                            "type": "impossible_location_changes",
                            "severity": "CRITICAL",
                            "user_id": user_id,
                            "details": f"Location changed {distance:.0f}km in {time_diff:.1f}h",
                            "recommendation": "Freeze account and investigate"
                        })

        update_times = [
            a.timestamp for a in sorted_activities if a.action_type == "profile_update"]
        if len(update_times) > 1:
            hourly_updates = defaultdict(int)
            for ts in update_times:
                hour_key = ts.strftime("%Y-%m-%d %H")
                hourly_updates[hour_key] += 1

            max_hourly = max(hourly_updates.values())
            if max_hourly > self.THRESHOLDS["max_profile_updates_per_hour"]:
                anomalies.append({
                    "type": "excessive_updates",
                    "severity": "MEDIUM",
                    "user_id": user_id,
                    "details": f"{max_hourly} profile updates in single hour",
                    "recommendation": "Rate limit user activity"
                })

        return anomalies

    def _analyze_ip_behavior(
        self,
        ip: str,
        activities: List[UserActivity]
    ) -> List[Dict[str, Any]]:
        anomalies = []

        registrations = [
            a for a in activities if a.action_type == "registration"]
        daily_regs = defaultdict(int)
        for reg in registrations:
            day_key = reg.timestamp.strftime("%Y-%m-%d")
            daily_regs[day_key] += 1

        for day, count in daily_regs.items():
            if count > self.THRESHOLDS["max_registrations_per_ip_per_day"]:
                anomalies.append({
                    "type": "multiple_registrations_same_ip",
                    "severity": "HIGH",
                    "ip_address": ip,
                    "details": f"{count} registrations from same IP on {day}",
                    "recommendation": "Block IP and investigate accounts"
                })

        unique_users = set(a.user_id for a in activities)
        if len(unique_users) > 10:
            anomalies.append({
                "type": "shared_ip_many_users",
                "severity": "MEDIUM",
                "ip_address": ip,
                "details": f"{len(unique_users)} different users from same IP",
                "recommendation": "Flag for review - possible VPN or bot network"
            })

        return anomalies

    def _analyze_temporal_patterns(
        self,
        activities: List[UserActivity]
    ) -> List[Dict[str, Any]]:
        anomalies = []

        admin_activities = [
            a for a in activities
            if a.action_type in ["admin_action", "bulk_export", "user_deletion"]
        ]

        for activity in admin_activities:
            hour = activity.timestamp.hour
            if hour < 6 or hour > 22:
                anomalies.append({
                    "type": "after_hours_admin_activity",
                    "severity": "MEDIUM",
                    "user_id": activity.user_id,
                    "details": f"Admin action at {activity.timestamp}",
                    "recommendation": "Verify admin identity"
                })

        return anomalies

    def _calculate_risk_score(self, anomalies: List[Dict[str, Any]]) -> float:
        if not anomalies:
            return 0.0

        severity_weights = {
            "CRITICAL": 1.0,
            "HIGH": 0.7,
            "MEDIUM": 0.4,
            "LOW": 0.2
        }

        weighted_sum = sum(
            severity_weights.get(a["severity"], 0.3) for a in anomalies
        )

        return min(1.0, weighted_sum / 3)

    def get_fraud_report(
        self,
        activities: List[UserActivity]
    ) -> Dict[str, Any]:
        risk_score, anomalies = self.analyze_activity(activities)

        return {
            "overall_risk_score": round(risk_score, 2),
            "risk_level": "CRITICAL" if risk_score > 0.7 else "HIGH" if risk_score > 0.4 else "MEDIUM" if risk_score > 0.2 else "LOW",
            "total_anomalies": len(anomalies),
            "anomalies_by_severity": {
                "critical": len([a for a in anomalies if a["severity"] == "CRITICAL"]),
                "high": len([a for a in anomalies if a["severity"] == "HIGH"]),
                "medium": len([a for a in anomalies if a["severity"] == "MEDIUM"]),
                "low": len([a for a in anomalies if a["severity"] == "LOW"]),
            },
            "anomalies": anomalies,
            "recommended_actions": list(set(a["recommendation"] for a in anomalies))
        }


anomaly_detector = AnomalyDetector()
