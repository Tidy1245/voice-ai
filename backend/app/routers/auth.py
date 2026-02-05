import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.database import get_db
from ..services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[dict] = None
    message: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[int]:
    """Extract user ID from authorization header."""
    if not authorization:
        logger.debug("No authorization header")
        return None
    if not authorization.startswith("Bearer "):
        logger.debug(f"Invalid authorization header format: {authorization[:20]}...")
        return None
    token = authorization[7:]
    service = AuthService(db)
    user_id = await service.validate_token(token)
    logger.debug(f"Token validation result - user_id: {user_id}")
    return user_id


async def require_auth(
    user_id: Optional[int] = Depends(get_current_user_id),
) -> int:
    """Require authentication."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with username and password."""
    service = AuthService(db)
    user = await service.authenticate(request.username, request.password)

    if user is None:
        return LoginResponse(
            success=False,
            message="Invalid username or password",
        )

    token = await service.create_token(user.id)
    return LoginResponse(
        success=True,
        token=token,
        user=user.to_dict(),
    )


@router.post("/logout")
async def logout(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Logout and invalidate token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        service = AuthService(db)
        await service.invalidate_token(token)
    return {"success": True}


@router.get("/me", response_model=Optional[UserResponse])
async def get_current_user(
    user_id: Optional[int] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get current logged-in user info."""
    if user_id is None:
        return None

    service = AuthService(db)
    user = await service.get_user_by_id(user_id)
    if user is None:
        return None

    return UserResponse(id=user.id, username=user.username)
