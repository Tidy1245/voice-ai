import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import TranscriptionResponse, ModelsResponse, ModelInfo, get_db
from ..services import TranscriptionService, HistoryService, get_model_loader
from ..utils import compute_diff

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    model: str = Form(default="faster-whisper"),
    reference_text: Optional[str] = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Transcribe an uploaded audio file.
    """
    # Validate model
    model_loader = get_model_loader()
    available_models = [m["id"] for m in model_loader.get_available_models()]
    if model not in available_models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model. Available models: {', '.join(available_models)}",
        )

    # Read audio content
    audio_content = await audio.read()
    if not audio_content:
        raise HTTPException(status_code=400, detail="Empty audio file")

    service = TranscriptionService()
    audio_path = None

    try:
        # Save to temp file
        audio_path = await service.save_uploaded_audio(audio_content, audio.filename or "audio.wav")

        # Transcribe
        transcription, duration = await service.transcribe(audio_path, model)

        # Compute diff if reference text provided
        diff = None
        if reference_text:
            diff = compute_diff(reference_text, transcription)

        # Save to history
        history_service = HistoryService(db)
        record = await history_service.create_record(
            filename=audio.filename or "audio.wav",
            model_used=model,
            transcription=transcription,
            duration=duration,
            reference_text=reference_text,
            diff=diff,
        )

        return TranscriptionResponse(
            success=True,
            transcription=transcription,
            duration=duration,
            model_used=model,
            diff=diff,
            id=record.id,
        )

    except Exception as e:
        logger.exception(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if audio_path:
            service.cleanup_temp_file(audio_path)


@router.get("/models", response_model=ModelsResponse)
async def get_models():
    """
    Get list of available speech recognition models.
    """
    model_loader = get_model_loader()
    models = model_loader.get_available_models()
    return ModelsResponse(
        models=[ModelInfo(**m) for m in models]
    )


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy"}
