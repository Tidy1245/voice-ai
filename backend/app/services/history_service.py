from typing import List, Optional, Tuple

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.database import TranscriptionRecord


class HistoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_record(
        self,
        filename: str,
        model_used: str,
        transcription: str,
        duration: float,
        reference_text: Optional[str] = None,
        diff: Optional[List[dict]] = None,
    ) -> TranscriptionRecord:
        """Create a new transcription record."""
        record = TranscriptionRecord(
            filename=filename,
            model_used=model_used,
            transcription=transcription,
            duration=duration,
            reference_text=reference_text,
            diff=diff,
        )
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def get_records(
        self,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[TranscriptionRecord], int]:
        """Get paginated list of transcription records."""
        # Get total count
        count_query = select(func.count(TranscriptionRecord.id))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get records
        query = (
            select(TranscriptionRecord)
            .order_by(TranscriptionRecord.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        records = result.scalars().all()

        return list(records), total

    async def get_record_by_id(self, record_id: int) -> Optional[TranscriptionRecord]:
        """Get a single record by ID."""
        query = select(TranscriptionRecord).where(TranscriptionRecord.id == record_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def delete_record(self, record_id: int) -> bool:
        """Delete a record by ID."""
        query = delete(TranscriptionRecord).where(TranscriptionRecord.id == record_id)
        result = await self.db.execute(query)
        return result.rowcount > 0
