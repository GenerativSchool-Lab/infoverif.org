# Deploy InfoVerif NOW 🚀

Your code is already pushed to GitHub: https://github.com/chyll-ai/infoverif.org

## Quick Deploy Steps

### 1. Login to Railway

```bash
railway login
```

### 2. Initialize Project

```bash
cd /Volumes/LaCie/Dev/infoverif.org
railway init
```

This will:
- Ask you to create a new project or select existing
- Name it: `infoverif`
- This links your current directory to Railway

### 3. Add Redis Database

```bash
railway add --plugin redis
```

This creates a Redis database and automatically sets `REDIS_URL` environment variable.

### 4. Deploy API Service

First, set the service root to `api`:

```bash
railway service create api
railway link
```

Now deploy the API:
```bash
cd api
railway up
```

Set environment variables for API:
```bash
railway variables set APP_ENV=production
railway variables set STORAGE_DIR=/tmp/video_integrity  
railway variables set PURGE_AFTER_HOURS=48
railway variables set ALLOW_DEV_BROWSERLESS=false
```

(Note: `REDIS_URL` is automatically set by Railway)

### 5. Deploy Worker Service

In a new terminal:
```bash
cd /Volumes/LaCie/Dev/infoverif.org
railway service create worker
railway link --service worker

# Deploy worker
cd api
railway up --service worker
```

Worker will use the same environment variables automatically.

### 6. Get Your URLs

```bash
# Get API URL
railway domain

# Open in browser
railway domain --open
```

### 7. Deploy Frontend to Vercel

```bash
cd web

# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# When asked for environment variable:
# VITE_API_URL = <paste your Railway URL here>
```

## One-Liner Deployment (Alternative)

Use the Railway dashboard for easier setup:

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `chyll-ai/infoverif.org`
4. Wait for auto-detection
5. Add Redis plugin
6. Set environment variables in Settings
7. Deploy!

## Verify Everything Works

```bash
# Check API health
curl https://your-app.railway.app/health

# Should return: {"status": "ok"}
```

## What You Get

- **Backend**: FastAPI on Railway
- **Worker**: Background job processing
- **Redis**: Job queue
- **Frontend**: Deploy separately to Vercel

## Troubleshooting

### Can't login to Railway
```bash
railway login --browserless
railway login --email YOUR_EMAIL
```

### Services not starting
Check logs:
```bash
railway logs
```

### Environment variables
```bash
railway variables
```

### Need help?
Read the full guide: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

