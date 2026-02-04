from datetime import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel


class DiffSegment(BaseModel):
    type: Literal["equal", "insert", "delete"]
    text: str


class TranscriptionRequest(BaseModel):
    model: str = "faster-whisper"
    reference_text: Optional[str] = None


class TranscriptionResponse(BaseModel):
    success: bool
    transcription: str
    duration: float
    model_used: str
    diff: Optional[List[DiffSegment]] = None
    id: Optional[int] = None


class HistoryResponse(BaseModel):
    id: int
    filename: str
    model_used: str
    transcription: str
    reference_text: Optional[str]
    duration: float
    diff: Optional[List[DiffSegment]]
    created_at: datetime


class HistoryListResponse(BaseModel):
    total: int
    records: List[HistoryResponse]


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str


class ModelsResponse(BaseModel):
    models: List[ModelInfo]
