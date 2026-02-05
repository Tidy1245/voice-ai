import os
import logging
from contextlib import asynccontextmanager

# Disable CUDA by default unless explicitly enabled
# Must be set before importing torch or any ML libraries
if os.getenv("USE_GPU", "false").lower() != "true":
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
    # Force PyTorch to use CPU
    import torch
    torch.set_default_device("cpu")
    # Monkey-patch to prevent any CUDA usage
    torch.cuda.is_available = lambda: False

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models.database import init_db, async_session
from .routers import transcription_router, history_router
from .routers.auth import router as auth_router
from .services.auth_service import init_default_user

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Voice AI server...")
    await init_db()
    logger.info("Database initialized")

    # Create default user
    async with async_session() as db:
        await init_default_user(db)
    logger.info("Default user initialized")

    yield
    # Shutdown
    logger.info("Shutting down Voice AI server...")


app = FastAPI(
    title="Voice AI API",
    description="Speech recognition API supporting multiple models",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(transcription_router, prefix="/api", tags=["transcription"])
app.include_router(history_router, prefix="/api", tags=["history"])


@app.get("/")
async def root():
    return {
        "name": "Voice AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }
