# Voice AI - Speech Recognition System

Multi-model speech recognition web application with dark theme UI.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS
- **Backend**: Python FastAPI + Uvicorn
- **Database**: SQLite
- **Speech Models**:
  - Faster-Whisper (large-v3) - General multilingual
  - Whisper-Taiwanese - Taiwanese/Mandarin optimized
  - FormoSpeech Hakka - Hakka language specialized

## Project Structure

```
voice-ai/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API services
│   │   └── types/      # TypeScript types
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── routers/    # API routes
│   │   ├── services/   # Business logic
│   │   ├── models/     # Database & Pydantic models
│   │   └── utils/      # Utilities
├── COMMANDS.md         # Common commands reference
└── CLAUDE.md           # This file
```

## Server Deployment (192.168.0.28)

### Prerequisites

- Python 3.11+
- Node.js 20+
- NVIDIA GPU with CUDA (optional, for faster inference)

### Backend Setup

```bash
cd /MODULE/tidy/voice-ai/backend

# Activate virtual environment
source ~/miniconda3/envs/voice/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd /MODULE/tidy/voice-ai/frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://192.168.0.28:8000/api" > .env

# Start frontend
npx vite --host --port 9010
```

### Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://192.168.0.28:9010 |
| Backend API | http://192.168.0.28:8000 |
| API Docs | http://192.168.0.28:8000/docs |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transcribe` | POST | Transcribe audio file |
| `/api/models` | GET | List available models |
| `/api/history` | GET | Get transcription history |
| `/api/history/{id}` | GET | Get single record |
| `/api/history/{id}` | DELETE | Delete record |
| `/api/health` | GET | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_CACHE_DIR` | `./model_cache` | Model cache directory |
| `DATABASE_URL` | `sqlite+aiosqlite:///./voice_ai.db` | Database URL |
| `CUDA_VISIBLE_DEVICES` | `0` | GPU device index |
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API URL (frontend) |

## Code Conventions

- Follow TDD+DDD principles
- Use TypeScript for frontend
- Use Pydantic for backend validation
- All API responses use standard schema
