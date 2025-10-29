"""Main FastAPI application for InfoVerif video analysis."""
import os
import uuid
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import redis

# Lazy import to avoid loading heavy dependencies on startup
# from tasks import get_job_status, get_job_result

load_dotenv()

app = FastAPI(title="InfoVerif API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_conn = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))


# Request models
class AnalyzeRequest(BaseModel):
    url: Optional[str] = None
    platform: Optional[str] = None  # youtube, tiktok, instagram
    language: str = "fr"


# Response models
class JobResponse(BaseModel):
    job_id: str


class StatusResponse(BaseModel):
    status: str
    progress: int
    message: Optional[str] = None


@app.get("/health")
async def health():
    """Health check endpoint."""
    health_data = {"status": "ok", "service": "infoverif-api"}
    
    # Check Redis connection if available
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        test_conn = redis.from_url(redis_url)
        test_conn.ping()
        health_data["redis"] = "connected"
        health_data["redis_url"] = redis_url.split("@")[-1] if "@" in redis_url else redis_url.split("//")[-1]
    except Exception as e:
        health_data["redis"] = "disconnected"
        health_data["redis_error"] = str(e)[:50]
    
    return health_data


@app.post("/analyze")
async def analyze(
    url: Optional[str] = Form(None),
    platform: Optional[str] = Form(None),
    language: str = Form("fr"),
    file: Optional[UploadFile] = File(None)
):
    """
    Submit a video for analysis.
    
    Either provide:
    - URL for YouTube (public videos only)
    - File upload for TikTok/Instagram
    """
    job_id = str(uuid.uuid4())
    
    # Validate input
    if not url and not file:
        raise HTTPException(status_code=400, detail="Either URL or file must be provided")
    
    # Handle file upload
    uploaded_file_path = None
    if file:
        # Save uploaded file
        storage_dir = Path(os.getenv("STORAGE_DIR", "/tmp/video_integrity")) / job_id
        storage_dir.mkdir(parents=True, exist_ok=True)
        uploaded_file_path = storage_dir / file.filename
        
        with open(uploaded_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    
    # Auto-detect platform from URL
    if url and not platform:
        if "youtube.com" in url or "youtu.be" in url:
            platform = "youtube"
        elif "tiktok.com" in url:
            platform = "tiktok"
        elif "instagram.com" in url:
            platform = "instagram"
        else:
            platform = "unknown"
    
    # Import and enqueue analyze_video
    from tasks import _get_queue, analyze_video
    queue = _get_queue()
    queue.enqueue(
        analyze_video,
        job_id, url, platform, language, str(uploaded_file_path) if uploaded_file_path else None,
        file.filename if file else None
    )
    
    return JobResponse(job_id=job_id)


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get job status."""
    try:
        from tasks import get_job_status
        status = get_job_status(job_id)
        if not status:
            raise HTTPException(status_code=404, detail="Job not found")
        return StatusResponse(**status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving job status: {str(e)}")


@app.get("/report/{job_id}")
async def get_report(job_id: str):
    """Get full analysis report."""
    from tasks import get_job_result
    result = get_job_result(job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found or not completed")
    return JSONResponse(content=result)


@app.get("/method-card")
async def method_card():
    """Return method card explaining ethics, limits, and false positives."""
    card = {
        "title": "InfoVerif — Methode & Limitierungen",
        "method": {
            "overview": "Video-Analyse zur Ermittlung potentieller Falschinformationen",
            "components": [
                "ASR (Automatic Speech Recognition) zur Transkription",
                "OCR zur Erkennung von On-Screen-Text",
                "Heuristische Risikobewertung",
                "Matching mit Faktencheck-Datenbank"
            ]
        },
        "limits": {
            "false_positives": "Hohe Rate falsch positiver Ergebnisse möglich",
            "no_automated_scraping": "TikTok/Instagram erfordern manuelle Uploads",
            "48h_retention": "Alle Daten werden nach 48 Stunden automatisch gelöscht",
            "heuristic_only": "Keine ML-verifizierte Klassifizierung"
        },
        "ethics": {
            "data_minimization": "Nur user-submitted content wird gespeichert",
            "no_tracking": "Keine persistenten User-Profile",
            "transparency": "Offene Quellcode und Methodendokumentation"
        },
        "contact": "Github: github.com/infoverif"
    }
    return card


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))

