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
    """Return method card with capabilities, roadmap, and principles."""
    card = {
        "title": "InfoVerif — Method & Roadmap",
        "current_capabilities": {
            "overview": "Lightweight, metadata‑based analysis for fast triage",
            "items": [
                "Fetch page metadata (title, description)",
                "Extract potential statements from metadata",
                "Compute interpretable heuristic risk score"
            ],
        },
        "near_term_roadmap": [
            "Transcript extraction (ASR) and on‑screen text (OCR)",
            "Text embeddings for semantic retrieval and clustering",
            "Similarity matching against curated fact‑checks and sources",
            "Richer feature‑based scoring with transparent reasons",
        ],
        "mid_term_enhancements": [
            "Multimodal cues from frames and thumbnails",
            "Source/domain context and provenance hints",
            "Temporal awareness for claim recency and narratives",
            "Analyst workflows: highlights, notes, collaboration",
        ],
        "principles": [
            "Data minimization and short retention for user‑submitted content",
            "Transparency via explainable features and rationales",
            "No tracking or profiling beyond service delivery",
        ],
        "contact": "Github: github.com/infoverif",
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

