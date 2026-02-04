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
│   └── Dockerfile
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── routers/    # API routes
│   │   ├── services/   # Business logic
│   │   ├── models/     # Database & Pydantic models
│   │   └── utils/      # Utilities
│   └── Dockerfile
└── docker-compose.yml
```

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at http://localhost:8000
API docs at http://localhost:8000/docs

## Server Deployment (192.168.0.28)

### Prerequisites

1. **Docker & Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo apt install docker-compose-plugin
   ```

2. **NVIDIA Container Toolkit** (for GPU support)
   ```bash
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

   sudo apt update
   sudo apt install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

### Deployment Steps

1. **Transfer files to server**
   ```bash
   # From your local machine
   scp -r voice-ai/ user@192.168.0.28:/home/user/
   ```

2. **SSH into server**
   ```bash
   ssh user@192.168.0.28
   cd /home/user/voice-ai
   ```

3. **Build and run**
   ```bash
   docker compose up -d --build
   ```

4. **Verify deployment**
   ```bash
   # Check containers
   docker compose ps

   # Check logs
   docker compose logs -f

   # Test API
   curl http://localhost:9010/api/health
   ```

5. **Access the application**
   - Web UI: http://192.168.0.28:9010
   - API Docs: http://192.168.0.28:9010/api/health

### Management Commands

```bash
# Stop services
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart

# Rebuild specific service
docker compose up -d --build backend

# Check GPU usage
nvidia-smi
```

### Data Persistence

Data is stored in Docker volumes:
- `model-cache`: Downloaded model files
- `db-data`: SQLite database (history records)

To backup:
```bash
docker cp voice-ai-backend-1:/app/data ./backup/
```

### Troubleshooting

1. **GPU not detected**
   ```bash
   # Verify NVIDIA driver
   nvidia-smi

   # Check Docker GPU access
   docker run --rm --gpus all nvidia/cuda:12.1-base-ubuntu22.04 nvidia-smi
   ```

2. **Model loading slow**
   - First request downloads models (~3-6GB per model)
   - Subsequent requests use cached models

3. **Out of memory**
   - Only one model is loaded at a time
   - Unload model by restarting backend container

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

## Code Conventions

- Follow TDD+DDD principles
- Use TypeScript for frontend
- Use Pydantic for backend validation
- All API responses use standard schema
