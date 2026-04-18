from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
import asyncio
import logging

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBSOCKET = "websocket"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class Notification:
    recipient_id: str
    recipient_email: Optional[str]
    recipient_phone: Optional[str]
    title: str
    message: str
    notification_type: NotificationType
    priority: NotificationPriority
    data: Optional[Dict[str, Any]] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()


class NotificationService:

    TEMPLATES = {
        "match_found": {
            "title": "New Match Found",
            "message": "A potential {match_type} match has been found for recipient {recipient_name}. Confidence: {confidence}%"
        },
        "emergency_blood_request": {
            "title": "🚨 EMERGENCY Blood Request",
            "message": "Urgent blood request: {blood_type} needed at {hospital_name}. Location: {city}. Contact: {contact}"
        },
        "emergency_organ_request": {
            "title": "🚨 EMERGENCY Organ Request",
            "message": "Critical organ request: {organ_type} needed. Urgency: {urgency}/10. Hospital: {hospital_name}"
        },
        "donor_registered": {
            "title": "Registration Successful",
            "message": "Thank you for registering as a {donor_type} donor. Your contribution can save lives."
        },
        "consent_recorded": {
            "title": "Consent Recorded",
            "message": "Your {consent_type} consent has been recorded at {timestamp}. You can revoke this at any time."
        },
        "match_accepted": {
            "title": "Match Confirmed",
            "message": "Match #{match_id} has been accepted. Hospital: {hospital_name}. Preparation required."
        },
        "donation_reminder": {
            "title": "Donation Reminder",
            "message": "You are now eligible to donate blood again. Your last donation was {days_ago} days ago."
        },
        "verification_complete": {
            "title": "Verification Complete",
            "message": "Your profile has been verified. You are now an active {role} on the platform."
        },
        "otp_code": {
            "title": "Verification Code",
            "message": "Your OTP code is: {otp}. Valid for 10 minutes. Do not share this code."
        }
    }

    def __init__(self):
        self.pending_notifications: List[Notification] = []
        self.delivery_log: List[Dict[str, Any]] = []

    def create_notification(
        self,
        template_name: str,
        recipient_id: str,
        variables: Dict[str, Any],
        notification_type: NotificationType = NotificationType.EMAIL,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        recipient_email: Optional[str] = None,
        recipient_phone: Optional[str] = None
    ) -> Notification:
        template = self.TEMPLATES.get(template_name, {
            "title": "Notification",
            "message": str(variables)
        })

        title = template["title"]
        message = template["message"].format(**variables)

        notification = Notification(
            recipient_id=recipient_id,
            recipient_email=recipient_email,
            recipient_phone=recipient_phone,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            data=variables
        )

        self.pending_notifications.append(notification)
        return notification

    async def send_notification(self, notification: Notification) -> bool:
        try:
            if notification.notification_type == NotificationType.EMAIL:
                from app.services.email import email_service
                success = await email_service.send(
                    to=notification.recipient_email,
                    subject=notification.title,
                    body=notification.message
                )
            elif notification.notification_type == NotificationType.SMS:
                from app.services.sms import sms_service
                success = await sms_service.send(
                    to=notification.recipient_phone,
                    message=f"{notification.title}: {notification.message}"
                )
            elif notification.notification_type == NotificationType.PUSH:
                success = await self._send_push(notification)
            elif notification.notification_type == NotificationType.WEBSOCKET:
                success = await self._send_websocket(notification)
            else:
                success = False

            self._log_delivery(notification, success)
            return success

        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            self._log_delivery(notification, False, str(e))
            return False

    async def send_emergency_broadcast(
        self,
        message: str,
        recipients: List[Dict[str, Any]],
        radius_km: float = 50
    ) -> Dict[str, int]:
        results = {"sent": 0, "failed": 0}

        tasks = []
        for recipient in recipients:
            notification = Notification(
                recipient_id=recipient.get("id", ""),
                recipient_email=recipient.get("email"),
                recipient_phone=recipient.get("phone"),
                title="🚨 EMERGENCY Alert",
                message=message,
                notification_type=NotificationType.SMS if recipient.get(
                    "phone") else NotificationType.EMAIL,
                priority=NotificationPriority.URGENT,
                data={"radius_km": radius_km}
            )
            tasks.append(self.send_notification(notification))

        if tasks:
            outcomes = await asyncio.gather(*tasks, return_exceptions=True)
            for outcome in outcomes:
                if outcome is True:
                    results["sent"] += 1
                else:
                    results["failed"] += 1

        return results

    async def _send_push(self, notification: Notification) -> bool:
        logger.info(f"PUSH: [{notification.title}] {notification.message}")
        return True

    async def _send_websocket(self, notification: Notification) -> bool:
        from app.api.v1.websocket import broadcast_notification
        await broadcast_notification(notification.recipient_id, {
            "type": "notification",
            "title": notification.title,
            "message": notification.message,
            "priority": notification.priority.value,
            "data": notification.data
        })
        return True

    def _log_delivery(
        self,
        notification: Notification,
        success: bool,
        error: Optional[str] = None
    ):
        self.delivery_log.append({
            "recipient_id": notification.recipient_id,
            "type": notification.notification_type.value,
            "priority": notification.priority.value,
            "success": success,
            "error": error,
            "timestamp": datetime.utcnow().isoformat()
        })

    def get_delivery_stats(self) -> Dict[str, Any]:
        total = len(self.delivery_log)
        successful = sum(1 for d in self.delivery_log if d["success"])

        by_type = {}
        for log in self.delivery_log:
            t = log["type"]
            if t not in by_type:
                by_type[t] = {"sent": 0, "failed": 0}
            if log["success"]:
                by_type[t]["sent"] += 1
            else:
                by_type[t]["failed"] += 1

        return {
            "total": total,
            "successful": successful,
            "failed": total - successful,
            "success_rate": successful / total if total > 0 else 0,
            "by_type": by_type
        }


notification_service = NotificationService()
