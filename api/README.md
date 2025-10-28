# InfoVerif API

FastAPI backend for video integrity analysis.

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key variables:
- `REDIS_URL`: Redis connection URL
- `STORAGE_DIR`: Directory for video storage
- `PURGE_AFTER_HOURS`: Auto-purge after N hours
- `YOUTUBE_API_KEY`: Optional YouTube API key
- `APP_ENV`: dev or production

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run with uvicorn
uvicorn main:app --reload
```

## Deployment

### Railway

1. Connect Railway to repo
2. Set environment variables
3. Deploy

The Dockerfile handles all dependencies.

