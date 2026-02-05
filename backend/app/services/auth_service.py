import secrets
import logging
from typing import Optional
from datetime import datetime, timedelta

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.database import User, SessionToken, hash_password, verify_password

logger = logging.getLogger(__name__)


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

    async def create_token(self, user_id: int) -> str:
        """Create a session token for user (stored in database)."""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)

        session_token = SessionToken(
            token=token,
            user_id=user_id,
            expires_at=expires_at,
        )
        self.db.add(session_token)
        await self.db.flush()

        logger.info(f"Created token for user_id: {user_id}")
        return token

    async def validate_token(self, token: str) -> Optional[int]:
        """Validate token and return user_id if valid."""
        query = select(SessionToken).where(SessionToken.token == token)
        result = await self.db.execute(query)
        session_token = result.scalar_one_or_none()

        if session_token is None:
            logger.debug(f"Token not found in database")
            return None

        if datetime.utcnow() > session_token.expires_at:
            # Token expired, delete it
            await self.db.execute(
                delete(SessionToken).where(SessionToken.token == token)
            )
            await self.db.flush()
            logger.debug(f"Token expired for user_id: {session_token.user_id}")
            return None

        logger.debug(f"Token valid for user_id: {session_token.user_id}")
        return session_token.user_id

    async def invalidate_token(self, token: str) -> bool:
        """Invalidate (logout) a token."""
        result = await self.db.execute(
            delete(SessionToken).where(SessionToken.token == token)
        )
        await self.db.flush()
        return result.rowcount > 0


async def init_default_user(db: AsyncSession):
    """Create default user if not exists."""
    service = AuthService(db)
    user = await service.get_user_by_username("sightour")
    if user is None:
        await service.create_user("sightour", "25916247")
        await db.commit()
