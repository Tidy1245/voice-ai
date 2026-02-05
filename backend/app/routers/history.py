from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import HistoryResponse, HistoryListResponse, get_db
from ..services import HistoryService
from .auth import get_current_user_id

router = APIRouter()


@router.get("/history", response_model=HistoryListResponse)
async def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """
    Get paginated list of transcription history for current user.
    """
    service = HistoryService(db)
    records, total = await service.get_records(limit=limit, offset=offset, user_id=user_id)

    return HistoryListResponse(
        total=total,
        records=[
            HistoryResponse(
                id=r.id,
                filename=r.filename,
                model_used=r.model_used,
                transcription=r.transcription,
                reference_text=r.reference_text,
                duration=r.duration,
                diff=r.diff,
                created_at=r.created_at,
            )
            for r in records
        ],
    )


@router.get("/history/{record_id}", response_model=HistoryResponse)
async def get_history_by_id(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """
    Get a single transcription record by ID.
    """
    service = HistoryService(db)
    record = await service.get_record_by_id(record_id, user_id=user_id)

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    return HistoryResponse(
        id=record.id,
        filename=record.filename,
        model_used=record.model_used,
        transcription=record.transcription,
        reference_text=record.reference_text,
        duration=record.duration,
        diff=record.diff,
        created_at=record.created_at,
    )


@router.delete("/history/{record_id}")
async def delete_history(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """
    Delete a transcription record.
    """
    service = HistoryService(db)
    deleted = await service.delete_record(record_id, user_id=user_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found")

    return {"success": True, "message": "Record deleted"}


@router.delete("/history")
async def clear_all_history(
    db: AsyncSession = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id),
):
    """
    Delete all transcription records for current user.
    """
    service = HistoryService(db)
    count = await service.delete_all_records(user_id=user_id)
    return {"success": True, "message": f"Deleted {count} records", "count": count}
