from typing import Optional, List
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAIL_FROM

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        if not to:
            logger.warning("No recipient email provided")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to

            if cc:
                msg["Cc"] = ", ".join(cc)

            text_part = MIMEText(body, "plain")
            msg.attach(text_part)

            if html_body:
                html_part = MIMEText(html_body, "html")
                msg.attach(html_part)

            if settings.APP_ENV == "development":
                logger.info(
                    f"EMAIL [DEV MODE]: To={to}, Subject={subject}, Body={body[:100]}...")
                return True

            all_recipients = [to]
            if cc:
                all_recipients.extend(cc)
            if bcc:
                all_recipients.extend(bcc)

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email,
                                all_recipients, msg.as_string())

            logger.info(f"Email sent successfully to {to}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False

    async def send_otp(self, to: str, otp: str) -> bool:
        subject = f"{settings.APP_NAME} - Verification Code"
        body = f"""
Your verification code is: {otp}

This code is valid for 10 minutes.
Do not share this code with anyone.

If you did not request this code, please ignore this email.

---
{settings.APP_NAME}
        """
        return await self.send(to=to, subject=subject, body=body)

    async def send_welcome(self, to: str, name: str, role: str) -> bool:
        subject = f"Welcome to {settings.APP_NAME}"
        body = f"""
Dear {name},

Welcome to {settings.APP_NAME}!

You have successfully registered as a {role}. Thank you for joining our mission to save lives through organ and blood donation.

Your next steps:
1. Complete your profile
2. Verify your identity
3. Start making a difference

If you have any questions, please don't hesitate to contact us.

Best regards,
The {settings.APP_NAME} Team
        """
        return await self.send(to=to, subject=subject, body=body)

    async def send_emergency_alert(
        self,
        to: str,
        alert_type: str,
        blood_type: Optional[str],
        location: str,
        hospital: str,
        contact: str
    ) -> bool:
        subject = f"🚨 URGENT: {alert_type} Request"
        body = f"""
EMERGENCY ALERT

Type: {alert_type}
{"Blood Type Needed: " + blood_type if blood_type else ""}
Location: {location}
Hospital: {hospital}
Contact: {contact}

Please respond immediately if you can help.

---
This is an automated emergency alert from {settings.APP_NAME}
        """
        return await self.send(to=to, subject=subject, body=body)


email_service = EmailService()
