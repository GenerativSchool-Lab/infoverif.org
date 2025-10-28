# InfoVerif — Deployment Guide

Step-by-step deployment instructions for production.

## Pre-deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] Environment variables configured
- [ ] Fact-checks seed data ready (`/data/factchecks.json`)
- [ ] YouTube API key obtained (optional)
- [ ] Domain/URL planning complete

## Railway Deployment (Backend)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project

### Step 2: Connect Repository

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `infoverif.org` repository

### Step 3: Create Services

Railway needs 3 services:

#### Service 1: API
1. Click "New Service" → "GitHub Repo"
2. Select the same repo
3. Set environment variables:
   ```bash
   REDIS_URL=${{Redis.REDIS_URL}}
   STORAGE_DIR=/tmp/video_integrity
   APP_ENV=production
   PURGE_AFTER_HOURS=48
   ALLOW_DEV_BROWSERLESS=false
   ```
4. Set build command: `cd api && pip install -r requirements.txt`
5. Set start command: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Service 2: Worker
1. Click "New Service" → "GitHub Repo"
2. Select the same repo
3. Set environment variables (same as API)
4. Set start command: `cd api && python worker.py`

#### Service 3: Redis
1. Click "New" → "Database" → "Redis"
2. Railway auto-provisions
3. Note the `REDIS_URL` for other services

### Step 4: Configure Environment

1. Go to API service → Variables
2. Set all variables from checklist
3. Add `YOUTUBE_API_KEY` if using YouTube
4. Deploy

### Step 5: Verify

```bash
# Get Railway URL
curl https://your-app.railway.app/health

# Should return: {"status": "ok"}
```

## Vercel Deployment (Frontend)

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 2: Import Project

1. Click "Add New Project"
2. Import `infoverif.org` repo
3. **Important**: Set "Root Directory" to `/web`

### Step 3: Configure Build

1. Framework: Vite (auto-detected)
2. Build Command: `npm run build`
3. Output Directory: `dist`

### Step 4: Set Environment Variables

In Vercel project settings:

```
VITE_API_URL=https://your-railway-url.railway.app
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Get your frontend URL

## Post-Deployment

### 1. Verify Endpoints

```bash
# API health
curl https://api.your-domain.com/health

# Frontend
open https://your-frontend.vercel.app
```

### 2. Test Full Flow

1. Go to frontend URL
2. Upload a test video or paste YouTube URL
3. Wait for processing
4. Verify report displays correctly

### 3. Monitor Logs

**Railway:**
```bash
railway logs
```

**Vercel:**
- Dashboard → Deployment → Logs

### 4. Set Up Auto-purge

The worker should automatically purge old assets. Verify:
```bash
# SSH into worker
docker exec -it worker bash

# Check cron job
crontab -l
```

## Environment Variables Reference

### API Service

```bash
# Required
REDIS_URL=redis://...          # From Railway Redis
STORAGE_DIR=/tmp/video_integrity
PURGE_AFTER_HOURS=48
APP_ENV=production
ALLOW_DEV_BROWSERLESS=false

# Optional
YOUTUBE_API_KEY=...             # For YouTube support
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

### Worker Service

```bash
# Same as API service
REDIS_URL=redis://...
STORAGE_DIR=/tmp/video_integrity
APP_ENV=production
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://your-railway-url.railway.app
```

## Scaling

### Backend Scaling

Railway auto-scales based on load. Manual scaling:

1. Go to service → Settings → Scale
2. Increase instances

### Worker Scaling

Multiple workers can run in parallel:

1. Duplicate Worker service in Railway
2. Share same Redis instance
3. Automatic load balancing

### Storage

Current: Local filesystem (`/tmp`)
Future: S3-compatible (MinIO)
- Update `storage.py` to use S3 client
- Set `S3_ENDPOINT`, `S3_KEY`, `S3_SECRET`

## Monitoring

### Railway Metrics

- CPU usage
- Memory usage
- Network I/O
- Logs

### Custom Monitoring

Add health checks to:
- `/health` endpoint
- Worker heartbeat
- Disk space monitoring

## Troubleshooting

### Jobs stuck in "running"

```bash
# Check worker logs
railway logs worker

# Restart worker
railway restart worker
```

### Out of memory

1. Increase Railway service memory
2. Or reduce `PURGE_AFTER_HOURS`

### Slow processing

1. Scale worker horizontally (more instances)
2. Optimize model size (use `small` instead of `base` for Whisper)
3. Reduce frame extraction rate

## Maintenance

### Weekly Tasks

- Review error logs
- Check disk usage
- Verify auto-purge working

### Monthly Tasks

- Update dependencies
- Review fact-check database
- Backup configuration

## Security

### Production Checklist

- [ ] Set `ALLOW_DEV_BROWSERLESS=false`
- [ ] Enable CORS restrictions
- [ ] Set rate limiting
- [ ] Monitor for abuse
- [ ] Review data retention

### Rate Limiting

Add to `main.py`:

```python
from slowapi import Limiter
limiter = Limiter(key_func=lambda: request.client.host)

@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze(...):
    ...
```

## Cost Estimation

### Railway

- API: $5-20/month (depends on traffic)
- Worker: $5-20/month
- Redis: $5-15/month
- **Total: $15-55/month**

### Vercel

- Free tier: 100GB bandwidth
- Pro: $20/month if exceeded

## Rollback

If something breaks:

```bash
# Railway
railway rollback

# Vercel
vercel rollback
```

## Support

- Documentation: `/README.md`, `/SETUP.md`, `/API.md`
- Issues: GitHub Issues
- Railway: [docs.railway.app](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

