# Deploy InfoVerif to Railway (No Docker)

Quick deployment guide using Railway CLI without Docker.

## Prerequisites

1. **GitHub Account** (for public repo)
2. **Railway CLI**: `npm i -g @railway/cli`
3. **Git** installed

## Step 1: Initialize Git & Push to GitHub

```bash
# Initialize git
cd /Volumes/LaCie/Dev/infoverif.org
git init
git add .
git commit -m "Initial commit: InfoVerif MVP"

# Create GitHub repo (or push to existing)
gh repo create infoverif-org --public
# Or manually: go to github.com, create repo, then:

git remote add origin https://github.com/YOUR_USERNAME/infoverif-org.git
git branch -M main
git push -u origin main
```

## Step 2: Login to Railway

```bash
railway login
# This will open browser for authentication
```

## Step 3: Create Railway Project

```bash
# Create new project
railway init

# Or link to existing
railway link
```

## Step 4: Create Services

We need **3 services**:

### Service 1: Redis
```bash
# Add Redis database
railway add --plugin redis
```

This creates a Redis instance and sets `REDIS_URL` automatically.

### Service 2: API
```bash
# Create API service
railway service create api

# Set root directory
railway service --service api
railway variables set SERVICE_ROOT=api

# Deploy API
railway up --service api
```

### Service 3: Worker
```bash
# Create worker service
railway service create worker

# Configure worker to run the worker process
railway service --service worker

# The Procfile will handle this automatically
railway up --service worker
```

## Step 5: Set Environment Variables

For each service (API and Worker):

```bash
# Set for API service
railway service --service api
railway variables set APP_ENV=production
railway variables set STORAGE_DIR=/tmp/video_integrity
railway variables set PURGE_AFTER_HOURS=48
railway variables set ALLOW_DEV_BROWSERLESS=false

# Note: REDIS_URL is automatically set by Railway Redis plugin

# Set for Worker service
railway service --service worker
railway variables set APP_ENV=production
railway variables set STORAGE_DIR=/tmp/video_integrity
railway variables set PURGE_AFTER_HOURS=48
```

## Step 6: Deploy

```bash
# Deploy API
railway up --service api

# Deploy Worker (in background)
railway up --service worker --detach

# Check status
railway status
```

## Step 7: Get Your URLs

```bash
# Get API URL
railway domain

# Or check the dashboard: railway.app/project/YOUR_PROJECT_ID
```

## Railway Dashboard Method (Alternative)

If you prefer using the web interface:

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `infoverif-org` repo

### Create Services:

**Service 1: API**
- Name: `api`
- Root Directory: `api`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment:
  - `APP_ENV=production`
  - `STORAGE_DIR=/tmp/video_integrity`
  - `PURGE_AFTER_HOURS=48`
  - `ALLOW_DEV_BROWSERLESS=false`

**Service 2: Worker**
- Name: `worker`
- Root Directory: `api`
- Build Command: `pip install -r requirements.txt`
- Start Command: `python worker.py`
- Environment: (same as API)

**Service 3: Redis**
- Click "New" → "Database" → "Redis"
- Railway auto-provisions
- Auto-sets `REDIS_URL` for other services

## Monorepo Structure

Railway will automatically detect the structure:
- API code: `/api/*`
- Web code: Deploy separately to Vercel

## Frontend Deployment (Vercel)

After Railway is up:

```bash
cd web

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add VITE_API_URL
# Enter your Railway API URL when prompted

# Redeploy
vercel --prod
```

## Verify Deployment

```bash
# Check API health
curl https://your-app.railway.app/health

# Should return: {"status": "ok"}

# Check worker logs
railway logs --service worker

# Test full flow
# Go to your Vercel frontend URL and upload a video
```

## Troubleshooting

### Services not starting

```bash
# Check logs
railway logs --service api
railway logs --service worker

# Restart service
railway restart --service api
```

### Environment variables not set

```bash
# List all variables
railway variables --service api

# Set missing ones
railway variables set KEY=value --service api
```

### Worker not processing jobs

```bash
# Check if Redis is connected
railway logs --service worker | grep redis

# Restart worker
railway restart --service worker
```

## Continuous Deployment

Railway auto-deploys on push to `main`:

```bash
git push origin main
# Railway will automatically redeploy
```

## Cost

- **Free tier**: $5/month credit
- **API + Worker**: ~$10-15/month
- **Redis**: ~$5/month
- **Total**: ~$15-20/month

For development/testing, free tier is usually enough.

## Quick Commands

```bash
# Open Railway dashboard
railway

# View logs
railway logs --service api
railway logs --service worker

# Check status
railway status

# View service URL
railway domain --service api

# Set environment variable
railway variables set KEY=value

# Deploy specific service
railway up --service api

# Restart service
railway restart --service worker
```

## Next Steps

1. ✅ Backend deployed on Railway
2. ✅ Frontend deployed on Vercel
3. ⏭️ Connect frontend to backend URL
4. ⏭️ Test video analysis flow
5. ⏭️ Monitor logs for issues

