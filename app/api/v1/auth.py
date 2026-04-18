from fastapi import APIRouter, HTTPException, status, Request, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DB, CurrentUser, rate_limit_check
from app.core.auth import AuthService
from app.core.audit import AuditService
from app.models import User, Role, AuditAction
from app.schemas import (
    UserCreate, LoginRequest, TokenResponse, RefreshTokenRequest,
    OTPRequest, OTPVerifyRequest, OTPVerifyResponse, MessageResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: DB,
    _: None = Depends(rate_limit_check)
):
    existing = await AuthService.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    if user_data.phone:
        existing_phone = await AuthService.get_user_by_phone(db, user_data.phone)
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )

    user = await AuthService.create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
    )

    tokens = await AuthService.create_tokens(db, user)

    await AuditService.log(
        db=db,
        action=AuditAction.CREATE,
        resource_type="user",
        resource_id=str(user.id),
        description="User registered",
        user_id=user.id,
        request=request
    )

    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    request: Request,
    db: DB,
    _: None = Depends(rate_limit_check)
):
    user = await AuthService.authenticate_user(db, credentials.email, credentials.password)

    if not user:
        await AuditService.log(
            db=db,
            action=AuditAction.LOGIN,
            resource_type="user",
            description="Failed login attempt",
            request=request,
            status="failure",
            error_message="Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    tokens = await AuthService.create_tokens(db, user)

    await AuditService.log_login(db, user.id, request, success=True)

    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_request: RefreshTokenRequest,
    db: DB
):
    tokens = await AuthService.refresh_access_token(db, token_request.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    return tokens


@router.post("/logout", response_model=MessageResponse)
async def logout(
    token_request: RefreshTokenRequest,
    request: Request,
    db: DB,
    current_user: CurrentUser
):
    await AuthService.revoke_refresh_token(db, token_request.refresh_token)

    await AuditService.log(
        db=db,
        action=AuditAction.LOGOUT,
        resource_type="user",
        description="User logged out",
        user_id=current_user.id,
        request=request
    )

    return MessageResponse(message="Successfully logged out")


@router.post("/otp/request", response_model=MessageResponse)
async def request_otp(
    otp_request: OTPRequest,
    db: DB,
    _: None = Depends(rate_limit_check)
):
    if otp_request.target_type == "email":
        user = await AuthService.get_user_by_email(db, otp_request.target)
    else:
        user = await AuthService.get_user_by_phone(db, otp_request.target)

    otp = await AuthService.create_otp_verification(
        db=db,
        target=otp_request.target,
        target_type=otp_request.target_type,
        user_id=user.id if user else None
    )

    print(f"OTP for {otp_request.target}: {otp}")

    return MessageResponse(message=f"OTP sent to {otp_request.target}")


@router.post("/otp/verify", response_model=OTPVerifyResponse)
async def verify_otp(
    verify_request: OTPVerifyRequest,
    db: DB
):
    verification = await AuthService.verify_otp_code(
        db=db,
        target=verify_request.target,
        otp=verify_request.otp
    )

    if not verification:
        return OTPVerifyResponse(verified=False, message="Invalid or expired OTP")

    if verification.user_id:
        user = await AuthService.get_user_by_id(db, verification.user_id)
        if user:
            user.is_verified = True
            tokens = await AuthService.create_tokens(db, user)
            return OTPVerifyResponse(
                verified=True,
                message="OTP verified successfully",
                access_token=tokens["access_token"],
                refresh_token=tokens["refresh_token"]
            )

    return OTPVerifyResponse(verified=True, message="OTP verified successfully")


@router.get("/me")
async def get_current_user_info(current_user: CurrentUser):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "roles": [role.name for role in current_user.roles],
        "is_verified": current_user.is_verified
    }
