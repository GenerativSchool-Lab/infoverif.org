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

# Edit api/.env if needed (Lite mode requires minimal config)
```

### 2. Start with Docker (Recommended)

```bash
# Start all services
make dev

# Or manually run backend and frontend separately (Lite):
# Backend
cd api && uvicorn main:app --reload
# Frontend
cd ../web && npm install && npm run dev
```

This starts:
- FastAPI backend: http://localhost:8000
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
pip install -r requirements-lite.txt

# Run API (Lite)
uvicorn main:app --reload
```

### Frontend

```bash
cd web

# Install dependencies
npm install

# Run dev server
npm run dev
```

## Architecture (Lite)

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│                       http://localhost:5173                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                     │
│                      http://localhost:8000                   │
│                                                             │
│  Endpoints (Lite):                                          │
│  - POST /analyze-lite → Run metadata heuristics (sync)      │
│  - GET  /health       → Health check                        │
│  - GET  /method-card  → Ethics & limitations                │
└─────────────────────────────────────────────────────────────┘
```

## Deployment

### Railway (Backend, Lite)

1. Create Railway account
2. Connect to this repository
3. Create service:
   - **API Service**: Connect to repo, set root directory to `/api`
4. Set environment variables (minimal for Lite):
   ```
   APP_ENV=production
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

## Key Features (Lite)

1. Input: URL (YouTube or page)
2. Fetch page metadata (title, description)
3. Extract potential statements from metadata
4. Compute heuristic risk score (0-100) from simple features

### Risk Scoring (0-100)

- **Cut density** (up to 20 pts): High scene count per minute
- **Sensational terms** (up to 20 pts): Alarmist language
- **Fullscreen text** (up to 20 pts): Heavy text overlay
- **Unsourced numbers** (up to 20 pts): Statistics without citations
- **Unknown domains** (up to 10 pts): Suspicious URLs
- **Recognized sources** (up to -15 pts): Negative weight for credible sources

### Legal & Ethics

- ✅ **No automated scraping** beyond fetching provided URL metadata
- ✅ **Data minimization**: Only minimal metadata processed
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

