from typing import Optional, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.models import AuditLog, AuditAction


class AuditService:

    @staticmethod
    async def log(
        db: AsyncSession,
        action: AuditAction,
        resource_type: str,
        description: str,
        user_id: Optional[UUID] = None,
        resource_id: Optional[str] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        request: Optional[Request] = None,
        status: str = "success",
        error_message: Optional[str] = None
    ) -> AuditLog:
        ip_address = None
        user_agent = None
        endpoint = None

        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent", "")[:500]
            endpoint = str(request.url.path)

        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            status=status,
            error_message=error_message
        )

        db.add(audit_log)
        return audit_log

    @staticmethod
    async def log_login(
        db: AsyncSession,
        user_id: UUID,
        request: Request,
        success: bool = True,
        error: Optional[str] = None
    ) -> AuditLog:
        return await AuditService.log(
            db=db,
            action=AuditAction.LOGIN,
            resource_type="user",
            resource_id=str(user_id),
            description=f"User login {'successful' if success else 'failed'}",
            user_id=user_id,
            request=request,
            status="success" if success else "failure",
            error_message=error
        )

    @staticmethod
    async def log_consent(
        db: AsyncSession,
        user_id: UUID,
        consent_type: str,
        is_granted: bool,
        request: Optional[Request] = None
    ) -> AuditLog:
        action_desc = "granted" if is_granted else "revoked"
        return await AuditService.log(
            db=db,
            action=AuditAction.CONSENT,
            resource_type="consent",
            description=f"User {action_desc} consent for {consent_type}",
            user_id=user_id,
            request=request,
            new_value={"consent_type": consent_type, "is_granted": is_granted}
        )

    @staticmethod
    async def log_match(
        db: AsyncSession,
        user_id: UUID,
        match_id: str,
        donor_id: str,
        recipient_id: str,
        action_type: str,
        request: Optional[Request] = None
    ) -> AuditLog:
        return await AuditService.log(
            db=db,
            action=AuditAction.MATCH,
            resource_type="match",
            resource_id=match_id,
            description=f"Match {action_type}: donor {donor_id} to recipient {recipient_id}",
            user_id=user_id,
            request=request,
            new_value={
                "match_id": match_id,
                "donor_id": donor_id,
                "recipient_id": recipient_id,
                "action": action_type
            }
        )

    @staticmethod
    async def log_emergency(
        db: AsyncSession,
        user_id: UUID,
        request_id: str,
        request_type: str,
        action_type: str,
        request: Optional[Request] = None
    ) -> AuditLog:
        return await AuditService.log(
            db=db,
            action=AuditAction.EMERGENCY,
            resource_type="emergency_request",
            resource_id=request_id,
            description=f"Emergency {request_type} request: {action_type}",
            user_id=user_id,
            request=request
        )

    @staticmethod
    async def log_verification(
        db: AsyncSession,
        verifier_id: UUID,
        entity_type: str,
        entity_id: str,
        is_approved: bool,
        notes: Optional[str] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        status_text = "approved" if is_approved else "rejected"
        return await AuditService.log(
            db=db,
            action=AuditAction.VERIFY,
            resource_type=entity_type,
            resource_id=entity_id,
            description=f"{entity_type.title()} verification: {status_text}",
            user_id=verifier_id,
            request=request,
            new_value={
                "entity_type": entity_type,
                "entity_id": entity_id,
                "is_approved": is_approved,
                "notes": notes
            }
        )
