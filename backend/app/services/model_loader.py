import os
import logging
from typing import Dict, Any, Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

# Check if GPU should be used - default to CPU for stability
USE_GPU = os.getenv("USE_GPU", "false").lower() == "true"

# Only check CUDA availability if USE_GPU is explicitly enabled
if USE_GPU:
    import torch
    USE_GPU = USE_GPU and torch.cuda.is_available()
    if USE_GPU:
        logger.info("GPU mode enabled - using CUDA")
    else:
        logger.info("GPU mode requested but CUDA not available - falling back to CPU")
else:
    logger.info("CPU mode enabled (default)")

DEVICE = "cuda" if USE_GPU else "cpu"
COMPUTE_TYPE = "float16" if USE_GPU else "int8"

# Force CPU mode by disabling CUDA visibility if not using GPU
if not USE_GPU:
    os.environ["CUDA_VISIBLE_DEVICES"] = ""

logger.info(f"Using device: {DEVICE}, compute_type: {COMPUTE_TYPE}")

# Model configurations
MODELS_CONFIG = {
    "faster-whisper": {
        "type": "faster-whisper",
        "model_size": "large-v3",
        "device": DEVICE,
        "compute_type": COMPUTE_TYPE,
    },
    "whisper-taiwanese": {
        "type": "transformers",
        "model_name": "JacobLinCool/whisper-large-v3-turbo-common_voice_19_0-zh-TW",
        "device": DEVICE,
    },
    "formospeech": {
        "type": "transformers",
        "model_name": "formospeech/whisper-large-v3-taiwanese-hakka",
        "device": DEVICE,
    },
}

MODEL_INFO = {
    "faster-whisper": {
        "id": "faster-whisper",
        "name": "Faster Whisper",
        "description": "General multilingual speech recognition (Large V3)",
    },
    "whisper-taiwanese": {
        "id": "whisper-taiwanese",
        "name": "Whisper Taiwanese",
        "description": "Optimized for Traditional Chinese (Taiwan)",
    },
    "formospeech": {
        "id": "formospeech",
        "name": "FormoSpeech Hakka",
        "description": "Specialized for Hakka language",
    },
}


class ModelLoader:
    def __init__(self):
        self._models: Dict[str, Any] = {}
        self._processors: Dict[str, Any] = {}
        self._cache_dir = os.getenv("MODEL_CACHE_DIR", "./model_cache")
        os.makedirs(self._cache_dir, exist_ok=True)

    def get_available_models(self):
        return list(MODEL_INFO.values())

    def is_loaded(self, model_id: str) -> bool:
        return model_id in self._models

    def load_model(self, model_id: str) -> Any:
        if model_id in self._models:
            return self._models[model_id]

        if model_id not in MODELS_CONFIG:
            raise ValueError(f"Unknown model: {model_id}")

        config = MODELS_CONFIG[model_id]
        logger.info(f"Loading model: {model_id}")

        if config["type"] == "faster-whisper":
            model = self._load_faster_whisper(config)
        elif config["type"] == "transformers":
            model, processor = self._load_transformers(config)
            self._processors[model_id] = processor
        else:
            raise ValueError(f"Unknown model type: {config['type']}")

        self._models[model_id] = model
        logger.info(f"Model {model_id} loaded successfully")
        return model

    def _load_faster_whisper(self, config: Dict[str, Any]):
        from faster_whisper import WhisperModel

        model = WhisperModel(
            config["model_size"],
            device=config["device"],
            compute_type=config["compute_type"],
            download_root=self._cache_dir,
        )
        return model

    def _load_transformers(self, config: Dict[str, Any]):
        from transformers import WhisperProcessor, WhisperForConditionalGeneration

        processor = WhisperProcessor.from_pretrained(
            config["model_name"],
            cache_dir=self._cache_dir,
        )
        model = WhisperForConditionalGeneration.from_pretrained(
            config["model_name"],
            cache_dir=self._cache_dir,
        )

        if config["device"] == "cuda":
            model = model.cuda()

        return model, processor

    def get_processor(self, model_id: str) -> Optional[Any]:
        return self._processors.get(model_id)

    def get_config(self, model_id: str) -> Dict[str, Any]:
        return MODELS_CONFIG.get(model_id, {})

    def unload_model(self, model_id: str):
        if model_id in self._models:
            del self._models[model_id]
            if model_id in self._processors:
                del self._processors[model_id]
            if USE_GPU:
                import torch
                torch.cuda.empty_cache()
            logger.info(f"Model {model_id} unloaded")


@lru_cache()
def get_model_loader() -> ModelLoader:
    return ModelLoader()
