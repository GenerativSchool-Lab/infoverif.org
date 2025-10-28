# Railway Deployment Checklist

## What to Configure in Railway Dashboard

### During Deployment

You should see these services being created:

1. **Main Service** (API)
   - Status: "Building" or "Deploying"
   - Wait for: "Active" status

2. **Worker Service** (needs to be created manually)
   - After main service deploys, create this service
   - Uses the same repo but different start command

3. **Redis Database** (add plugin)
   - Click "New" → "Database" → "Redis"
   - This auto-sets `REDIS_URL`

### After Deployment Succeeds

#### 1. Check Service is Running

- Go to your service
- Status should be **green "Active"**
- Logs should show: `Uvicorn running on http://0.0.0.0:PORT`

#### 2. Get Your API URL

- Click on the service
- Click **"Generate Domain"** or copy existing domain
- URL will look like: `https://your-app.railway.app`

#### 3. Set Environment Variables

Go to service → Settings → Variables:

**Required for ALL services:**
```bash
APP_ENV=production
STORAGE_DIR=/tmp/video_integrity
PURGE_AFTER_HOURS=48
ALLOW_DEV_BROWSERLESS=false
```

**REDIS_URL** - Set automatically when you add Redis plugin

#### 4. Add Redis Plugin

1. In your project dashboard
2. Click **"New"** → **"Database"** → **"Redis"**
3. Railway will auto-provision
4. The `REDIS_URL` is automatically added to your environment

#### 5. Create Worker Service

After Redis and API are up:

1. Click **"New Service"**
2. Choose **"GitHub Repo"** → Select `chyll-ai/infoverif.org`
3. Name it: `worker`
4. In **"Settings"** → **"Deploy"** tab:
   - Root Directory: `api`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python worker.py`
5. Environment variables (same as API)
6. Click **"Deploy"**

#### 6. Verify Deployment

Test your API:

```bash
curl https://your-app.railway.app/health
```

Should return: `{"status": "ok"}`

## What to Watch For

### ✅ Success Signs

- Service status: "Active" (green)
- Logs show: "Uvicorn running"
- No errors in logs
- Health check returns 200

### ⚠️ Warning Signs

- Service stuck on "Building"
- Build failed
- Environment variables missing
- Redis not connected

### 🔧 Quick Fixes

**If build fails:**
- Check logs for Python errors
- Verify `requirements.txt` is correct
- Ensure Redis is added

**If service won't start:**
- Check environment variables are set
- Verify `REDIS_URL` is present
- Check logs for errors

**If worker not running:**
- Create worker service separately
- Use start command: `python worker.py`
- Share same Redis instance

## Next Steps After Deployment

1. ✅ API deployed on Railway
2. ⏭️ Deploy frontend to Vercel:
   ```bash
   cd web
   vercel
   # Set VITE_API_URL to your Railway URL
   ```
3. ⏭️ Test video analysis
4. ⏭️ Monitor logs

## Useful Railway Commands (CLI)

If you want to manage via CLI later:

```bash
# View logs
railway logs

# Check status
railway status

# View domain
railway domain

# Set environment variable
railway variables set KEY=value

# View variables
railway variables
```

## Cost Estimation

- **API Service**: $5-10/month
- **Worker**: $5-10/month  
- **Redis**: $5/month
- **Total**: ~$15-25/month

Railway free tier gives $5 credit, so first month might be free.

## Need Help?

- Railway Docs: https://docs.railway.app
- Your repo: https://github.com/chyll-ai/infoverif.org
- Full guide: [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

