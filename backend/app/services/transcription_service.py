import os
import tempfile
import logging
from typing import Optional, Tuple, List, Dict

import numpy as np
import soundfile as sf
import torch

from .model_loader import get_model_loader, MODELS_CONFIG

logger = logging.getLogger(__name__)


class TranscriptionService:
    def __init__(self):
        self.model_loader = get_model_loader()

    async def transcribe(
        self,
        audio_path: str,
        model_id: str = "faster-whisper",
    ) -> Tuple[str, float]:
        """
        Transcribe audio file using specified model.
        Returns (transcription_text, audio_duration).
        """
        model = self.model_loader.load_model(model_id)
        config = self.model_loader.get_config(model_id)

        # Load audio
        audio_data, sample_rate = sf.read(audio_path)
        duration = len(audio_data) / sample_rate

        # Convert to mono if stereo
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=1)

        # Resample to 16kHz if needed (Whisper requires 16kHz)
        if sample_rate != 16000:
            import torchaudio
            # Explicitly use CPU for resampling
            audio_tensor = torch.tensor(audio_data, device="cpu").float().unsqueeze(0)
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            audio_data = resampler(audio_tensor).squeeze().numpy()

        if config["type"] == "faster-whisper":
            transcription = self._transcribe_faster_whisper(model, audio_path)
        elif config["type"] == "transformers":
            processor = self.model_loader.get_processor(model_id)
            transcription = self._transcribe_transformers(model, processor, audio_data, config)
        elif config["type"] == "dolphin":
            transcription = self._transcribe_dolphin(model, audio_path, config)
        else:
            raise ValueError(f"Unknown model type: {config['type']}")

        return transcription, duration

    def _transcribe_faster_whisper(self, model, audio_path: str) -> str:
        """Transcribe using faster-whisper model."""
        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            language=None,  # Auto-detect
            task="transcribe",
        )

        transcription = " ".join(segment.text for segment in segments)
        return transcription.strip()

    def _transcribe_transformers(
        self,
        model,
        processor,
        audio_data: np.ndarray,
        config: Dict,
    ) -> str:
        """Transcribe using HuggingFace transformers model."""
        device = config["device"]

        # Prepare input with attention mask
        inputs = processor(
            audio_data,
            sampling_rate=16000,
            return_tensors="pt",
            return_attention_mask=True,
        )

        input_features = inputs.input_features
        attention_mask = inputs.get("attention_mask", None)

        # Explicitly move tensors to the correct device
        input_features = input_features.to(device)
        if attention_mask is not None:
            attention_mask = attention_mask.to(device)

        # Determine language based on model
        model_name = config.get("model_name", "")
        if "taiwanese" in model_name.lower() or "zh-TW" in model_name:
            language = "zh"
        elif "hakka" in model_name.lower():
            language = "zh"  # Hakka uses Chinese tokens
        else:
            language = None  # Auto-detect

        # Generate transcription
        with torch.no_grad():
            generate_kwargs = {
                "input_features": input_features,
                "task": "transcribe",
            }
            if attention_mask is not None:
                generate_kwargs["attention_mask"] = attention_mask
            if language:
                generate_kwargs["language"] = language

            predicted_ids = model.generate(**generate_kwargs)

        transcription = processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True,
        )[0]

        return transcription.strip()

    def _transcribe_dolphin(self, model, audio_path: str, config: Dict) -> str:
        """Transcribe using Dolphin ASR model."""
        import dolphin

        lang_sym = config.get("lang_sym", "zh")
        region_sym = config.get("region_sym", "MINNAN")

        waveform = dolphin.load_audio(audio_path)
        result = model(waveform, lang_sym=lang_sym, region_sym=region_sym)

        return result.text.strip()

    async def save_uploaded_audio(self, audio_content: bytes, filename: str) -> str:
        """Save uploaded audio to a temporary file and return the path."""
        suffix = os.path.splitext(filename)[1] or ".wav"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(audio_content)
            return tmp_file.name

    def cleanup_temp_file(self, file_path: str):
        """Remove temporary audio file."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.warning(f"Failed to cleanup temp file {file_path}: {e}")
