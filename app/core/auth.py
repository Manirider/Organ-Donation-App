from typing import Optional, List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import User, Role, RefreshToken, OTPVerification
from app.core.security import (
    hash_password, verify_password, create_token_pair,
    decode_token, generate_otp, hash_otp, get_otp_expiry
)
from datetime import datetime


class AuthService:

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_phone(db: AsyncSession, phone: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.phone == phone)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        if not user.is_active:
            return None
        return user

    @staticmethod
    async def create_user(
        db: AsyncSession,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        phone: Optional[str] = None,
        roles: Optional[List[str]] = None
    ) -> User:
        user = User(
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            phone=phone,
        )

        if roles:
            role_result = await db.execute(
                select(Role).where(Role.name.in_(roles))
            )
            user.roles = list(role_result.scalars().all())

        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def create_tokens(db: AsyncSession, user: User) -> dict:
        role_names = [role.name for role in user.roles]
        access_token, refresh_token, expires_at = create_token_pair(
            str(user.id), user.email, role_names
        )

        token_record = RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at
        )
        db.add(token_record)

        user.last_login = datetime.utcnow()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_at.isoformat()
        }

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> Optional[dict]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None

        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token == refresh_token,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.utcnow()
            )
        )
        token_record = result.scalar_one_or_none()
        if not token_record:
            return None

        user = await AuthService.get_user_by_id(db, token_record.user_id)
        if not user or not user.is_active:
            return None

        token_record.revoked = True

        return await AuthService.create_tokens(db, user)

    @staticmethod
    async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> bool:
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token == refresh_token)
        )
        token_record = result.scalar_one_or_none()
        if token_record:
            token_record.revoked = True
            return True
        return False

    @staticmethod
    async def create_otp_verification(
        db: AsyncSession,
        target: str,
        target_type: str,
        user_id: Optional[UUID] = None
    ) -> str:
        otp = generate_otp()
        verification = OTPVerification(
            user_id=user_id,
            target=target,
            target_type=target_type,
            otp_hash=hash_otp(otp),
            expires_at=get_otp_expiry()
        )
        db.add(verification)
        return otp

    @staticmethod
    async def verify_otp_code(
        db: AsyncSession,
        target: str,
        otp: str
    ) -> Optional[OTPVerification]:
        result = await db.execute(
            select(OTPVerification).where(
                OTPVerification.target == target,
                OTPVerification.is_verified == False,
                OTPVerification.expires_at > datetime.utcnow()
            ).order_by(OTPVerification.created_at.desc())
        )
        verification = result.scalar_one_or_none()

        if not verification:
            return None

        verification.attempts += 1

        if hash_otp(otp) == verification.otp_hash:
            verification.is_verified = True
            verification.verified_at = datetime.utcnow()
            return verification

        return None
