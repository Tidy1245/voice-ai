import secrets
from typing import Optional
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.database import User, hash_password, verify_password


# Simple token storage (in production, use Redis or database)
active_tokens: dict[str, dict] = {}


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, username: str, password: str) -> User:
        """Create a new user."""
        password_hash, password_salt = hash_password(password)
        user = User(
            username=username,
            password_hash=password_hash,
            password_salt=password_salt,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        query = select(User).where(User.username == username)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def authenticate(self, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password."""
        user = await self.get_user_by_username(username)
        if user is None:
            return None
        if not verify_password(password, user.password_hash, user.password_salt):
            return None
        return user

    def create_token(self, user_id: int) -> str:
        """Create a session token for user."""
        token = secrets.token_urlsafe(32)
        active_tokens[token] = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7),
        }
        return token

    @staticmethod
    def validate_token(token: str) -> Optional[int]:
        """Validate token and return user_id if valid."""
        if token not in active_tokens:
            return None
        token_data = active_tokens[token]
        if datetime.utcnow() > token_data["expires_at"]:
            del active_tokens[token]
            return None
        return token_data["user_id"]

    @staticmethod
    def invalidate_token(token: str) -> bool:
        """Invalidate (logout) a token."""
        if token in active_tokens:
            del active_tokens[token]
            return True
        return False


async def init_default_user(db: AsyncSession):
    """Create default user if not exists."""
    service = AuthService(db)
    user = await service.get_user_by_username("sightour")
    if user is None:
        await service.create_user("sightour", "25916247")
        await db.commit()
