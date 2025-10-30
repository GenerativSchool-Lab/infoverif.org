"""Main FastAPI application (lightweight metadata POC)."""
import os
from typing import Optional

from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
try:
    import redis  # optional
except Exception:
    redis = None

# Avoid importing heavy task/redis code at startup; import inside endpoints when needed

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

# Redis connection (optional)
redis_conn = None
try:
    if redis is not None:
        redis_conn = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
except Exception:
    redis_conn = None


# Request/response models kept minimal for POC
class AnalyzeRequest(BaseModel):
    url: str
    platform: Optional[str] = None  # youtube, tiktok, twitter/x


@app.get("/health")
async def health():
    """Health check endpoint."""
    data = {"status": "ok", "service": "infoverif-api"}
    if redis is not None:
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            test_conn = redis.from_url(redis_url)
            test_conn.ping()
            data["redis"] = "connected"
        except Exception as e:
            data["redis"] = "disconnected"
            data["redis_error"] = str(e)[:80]
    return data


# Remove old heavy job/queue endpoints for this POC


# (status/report endpoints removed in lightweight POC)


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


@app.post("/analyze-lite")
async def analyze_lite(url: str = Form(...), platform: Optional[str] = Form(None)):
    """Lightweight synchronous metadata analysis (no Redis/jobs)."""
    from lite import analyze_metadata
    if not url:
        raise HTTPException(status_code=400, detail="url is required")
    try:
        output = analyze_metadata(url, platform)
        return JSONResponse(content=output)
    except Exception as e:
        # Return structured error for easier debugging
        raise HTTPException(status_code=400, detail=f"analyze-lite failed: {str(e)[:200]}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))

