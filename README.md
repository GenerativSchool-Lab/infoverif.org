# InfoVerif — Video Integrity Analysis MVP

Production-deployable MVP that analyzes short videos (YouTube, TikTok, Instagram Reels) and returns transcription, on-screen text, risk score, and related fact-checks.

## Architecture

- **Backend**: FastAPI + RQ workers (Python 3.11) on Railway
- **Frontend**: React (Vite) + Tailwind on Vercel
- **Storage**: Local FS or S3-compatible (MinIO) with 48h purge
- **Vector Search**: FAISS (in-memory) for MVP

## Legal & Ethics

- **YouTube**: Public URL analysis via YouTube Data API (optional) or direct download
- **TikTok/Instagram**: User upload only (.mp4); no scraping in production
- **Auto-purge**: All media and derived data deleted after 48 hours
- **No persistent storage**: Only user-submitted content stored
- See `/method-card` for detailed limitations and false positive warnings

## Quick Start (Direct Deployment)

### Prerequisites
- GitHub account (public repo)
- Railway account (railway.app)
- Railway CLI: `npm i -g @railway/cli`

### Deploy to Railway (No Docker)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/infoverif-org.git
git push -u origin main

# 2. Deploy to Railway
railway login
railway init

# 3. Create services
railway add --plugin redis
railway up --service api
railway up --service worker

# 4. Get your URL
railway domain
```

**See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for complete instructions.**

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)
- Redis (or Docker: `docker run -d -p 6379:6379 redis:7-alpine`)

### Start Backend

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Start Worker (separate terminal)

```bash
cd api
python worker.py
```

### Start Frontend

```bash
cd web
npm install
npm run dev
```

## Deployment

### Railway (Backend)
1. Connect Railway to this repo
2. Set environment variables from `.env.example`
3. Deploy automatically

### Vercel (Frontend)
1. Connect Vercel to `/web` directory
2. Set `VITE_API_URL` to Railway backend URL
3. Deploy

## Directory Structure

```
/api            # FastAPI, workers, tasks, scoring
/web            # React (Vite), Tailwind UI
/ops            # Dockerfiles, Railway Procfile, Vercel config, Makefile
/data           # fact-checks seed JSON
/scripts        # local dev helpers
```

## Environment Variables

See `.env.example` for required variables.

## Limitations

- **No automated scraping**: TikTok/Instagram require manual upload
- **Dev browserless**: Only enabled in dev mode (`ALLOW_DEV_BROWSERLESS=true`), disabled in production
- **48h retention**: All data auto-deleted after 48 hours
- **False positives**: Risk score is heuristic-based, not ML-verified
- **Small fact-check index**: MVP uses local seed data, not production database

## License

MIT

