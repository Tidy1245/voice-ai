import os
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./voice_ai.db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


class TranscriptionRecord(Base):
    __tablename__ = "transcription_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    model_used = Column(String(50), nullable=False)
    transcription = Column(Text, nullable=False)
    reference_text = Column(Text, nullable=True)
    duration = Column(Float, nullable=False)
    diff = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "model_used": self.model_used,
            "transcription": self.transcription,
            "reference_text": self.reference_text,
            "duration": self.duration,
            "diff": self.diff,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
