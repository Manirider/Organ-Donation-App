from typing import Optional
import logging
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class SMSService:

    def __init__(self):
        self.provider = settings.SMS_PROVIDER
        self.api_key = settings.SMS_API_KEY
        self.sender_id = settings.SMS_SENDER_ID

    async def send(self, to: str, message: str) -> bool:
        if not to:
            logger.warning("No recipient phone provided")
            return False

        phone = self._normalize_phone(to)

        if settings.APP_ENV == "development":
            logger.info(
                f"SMS [DEV MODE]: To={phone}, Message={message[:100]}...")
            return True

        try:
            if self.provider == "twilio":
                return await self._send_twilio(phone, message)
            elif self.provider == "msg91":
                return await self._send_msg91(phone, message)
            elif self.provider == "textlocal":
                return await self._send_textlocal(phone, message)
            else:
                logger.warning(f"Unknown SMS provider: {self.provider}")
                return False

        except Exception as e:
            logger.error(f"Failed to send SMS to {phone}: {e}")
            return False

    def _normalize_phone(self, phone: str) -> str:
        phone = "".join(c for c in phone if c.isdigit() or c == "+")
        if not phone.startswith("+"):
            if phone.startswith("0"):
                phone = "+91" + phone[1:]
            elif len(phone) == 10:
                phone = "+91" + phone
        return phone

    async def _send_twilio(self, to: str, message: str) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json",
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                data={
                    "To": to,
                    "From": self.sender_id,
                    "Body": message
                }
            )
            return response.status_code == 201

    async def _send_msg91(self, to: str, message: str) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.msg91.com/api/v5/flow/",
                headers={"authkey": self.api_key},
                json={
                    "sender": self.sender_id,
                    "route": "4",
                    "country": "91",
                    "sms": [{"message": message, "to": [to.replace("+91", "")]}]
                }
            )
            return response.status_code == 200

    async def _send_textlocal(self, to: str, message: str) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.textlocal.in/send/",
                data={
                    "apikey": self.api_key,
                    "numbers": to.replace("+", ""),
                    "message": message,
                    "sender": self.sender_id
                }
            )
            return response.status_code == 200

    async def send_otp(self, to: str, otp: str) -> bool:
        message = f"Your {settings.APP_NAME} verification code is {otp}. Valid for 10 minutes. Do not share."
        return await self.send(to, message)

    async def send_emergency_alert(
        self,
        to: str,
        alert_type: str,
        blood_type: Optional[str],
        hospital: str
    ) -> bool:
        message = f"URGENT {alert_type} needed"
        if blood_type:
            message += f" ({blood_type})"
        message += f" at {hospital}. Reply YES to respond."
        return await self.send(to, message)


sms_service = SMSService()
