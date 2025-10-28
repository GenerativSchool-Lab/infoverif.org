# InfoVerif — Setup Guide

Complete setup guide for the InfoVerif video integrity analysis MVP.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local dev without Docker)
- Node.js 18+ (for frontend)
- 10GB+ free disk space (for video processing)

### 1. Clone & Setup

```bash
cd infoverif.org

# Copy environment files
cp api/.env.example api/.env
cp web/.env.example web/.env

# Edit api/.env and set:
# - REDIS_URL=redis://localhost:6379/0
# - STORAGE_DIR=/tmp/video_integrity
```

### 2. Start with Docker (Recommended)

```bash
# Start all services
make dev

# Or manually:
cd ops
docker-compose up --build
```

This starts:
- FastAPI backend: http://localhost:8000
- Redis: localhost:6379
- RQ worker (in background)
- Frontend: http://localhost:5173

### 3. Access the Application

Open http://localhost:5173 in your browser.

## Local Development (Without Docker)

### Backend

```bash
cd api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Redis (required)
# Mac: brew install redis && brew services start redis
# Linux: sudo apt-get install redis && sudo systemctl start redis
# Or use Docker: docker run -d -p 6379:6379 redis:7-alpine

# Run API
uvicorn main:app --reload

# In another terminal, run worker
python worker.py
```

### Frontend

```bash
cd web

# Install dependencies
npm install

# Run dev server
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│                       http://localhost:5173                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                   │
│                      http://localhost:8000                  │
│                                                              │
│  Endpoints:                                                 │
│  - POST /analyze    → Enqueue video analysis                │
│  - GET /status/:id  → Check job status                      │
│  - GET /report/:id  → Get full report                       │
│  - GET /health      → Health check                          │
│  - GET /method-card → Ethics & limitations                 │
└──────┬────────────────────────┬────────────────────────────┘
       │                        │
       ▼                        ▼
┌──────────────┐        ┌──────────────┐
│   Redis      │        │ RQ Worker    │
│  (job queue) │        │ (background)  │
└──────────────┘        └──────┬───────┘
                               │
                               ▼
                    ┌───────────────────┐
                    │  Processing       │
                    │  Pipeline:        │
                    │  • Video download │
                    │  • ASR (Whisper)  │
                    │  • OCR (PaddleOCR)│
                    │  • Scene detect   │
                    │  • Risk scoring   │
                    │  • Fact-check     │
                    │    matching (FAISS│
                    └───────────────────┘
```

## Deployment

### Railway (Backend)

1. Create Railway account
2. Connect to this repository
3. Create services:
   - **API Service**: Connect to repo, set root directory to `/api`
   - **Worker Service**: Same repo, set command to `python worker.py`
   - **Redis Service**: Add from Railway marketplace
4. Set environment variables:
   ```
   REDIS_URL=<redis_url_from_railway>
   STORAGE_DIR=/tmp/video_integrity
   PURGE_AFTER_HOURS=48
   APP_ENV=production
   ALLOW_DEV_BROWSERLESS=false
   ```
5. Deploy

### Vercel (Frontend)

1. Create Vercel account
2. Connect to this repository
3. Set root directory to `/web`
4. Configure:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_API_URL=<railway_backend_url>`
5. Deploy

## Key Features

### Video Analysis Pipeline

1. **Input**: YouTube URL or uploaded file
2. **Processing**:
   - Download video (YouTube) or process upload
   - Extract audio (16k mono WAV) for ASR
   - Extract frames (1 fps) for OCR
   - Detect scene boundaries
3. **Analysis**:
   - Transcribe speech (faster-whisper)
   - Extract on-screen text (PaddleOCR)
   - Detect claims and statistics
   - Compute risk score (0-100)
   - Match fact-checks (FAISS + sentence-transformers)
4. **Output**: JSON report with timeline, transcript, risk factors, and sources

### Risk Scoring (0-100)

- **Cut density** (up to 20 pts): High scene count per minute
- **Sensational terms** (up to 20 pts): Alarmist language
- **Fullscreen text** (up to 20 pts): Heavy text overlay
- **Unsourced numbers** (up to 20 pts): Statistics without citations
- **Unknown domains** (up to 10 pts): Suspicious URLs
- **Recognized sources** (up to -15 pts): Negative weight for credible sources

### Legal & Ethics

- ✅ **No automated scraping**: TikTok/Instagram require manual upload
- ✅ **48h auto-purge**: All media and data deleted after 48 hours
- ✅ **Data minimization**: Only user-submitted content stored
- ✅ **Transparency**: `/method-card` endpoint explains limits
- ✅ **False positive warnings**: Heuristic-based, not ML-verified

## Troubleshooting

### Backend won't start

- Check Redis is running: `redis-cli ping`
- Verify environment variables: `cat api/.env`
- Check Docker logs: `docker-compose logs api`

### Worker not processing jobs

- Ensure worker container is running: `docker-compose ps`
- Check worker logs: `docker-compose logs worker`
- Verify Redis connection: `docker-compose exec api redis-cli ping`

### Frontend can't connect

- Check API_URL in `.env`: Should be `http://localhost:8000` for local dev
- Verify backend is running: `curl http://localhost:8000/health`
- Check browser console for errors

### Large file uploads fail

- Increase `client_max_body_size` in nginx/proxy
- Check disk space: `df -h`
- Verify video file is under 500MB (recommended)

## Performance

- **Typical processing time**: 2-5 minutes for 1-minute video
- **Supported formats**: MP4, AVI, MOV (best compatibility)
- **Recommended video length**: Under 5 minutes
- **Storage**: ~100MB per video (auto-purged after 48h)

## Support

- Documentation: See `/README.md` and `/api/README.md`, `/web/README.md`
- Method card: `/method-card` endpoint
- Issues: GitHub Issues

