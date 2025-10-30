"""Main FastAPI application (lightweight metadata POC)."""
import os
from typing import Optional

from fastapi import FastAPI, Form, HTTPException, UploadFile, File
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

# Feature flags (Deep is default)
DEEP_ANALYSIS_ENABLED = os.getenv("DEEP_ANALYSIS_ENABLED", "true").lower() == "true"

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
    """Return method card highlighting algorithms and roadmap (tool-agnostic)."""
    card = {
        "title": "InfoVerif — Méthode & Feuille de route",
        "goal": "Décortiquer la propagande et les techniques de communication via des scores explicables.",
        "current_capabilities": {
            "overview": "Analyse avancée par défaut (transcription + analyse sémantique)",
            "formulas": {
                "propaganda_score": "P = w₁·émotion + w₂·cadre_{eux/nous} + w₃·charge_lexicale + w₄·sélection_partielle",
                "overall_risk": "R = f(P, C, M) ∈ [0,100]",
                "variables": {
                    "P": "score de propagande (0–100)",
                    "C": "score de conspiration (0–100)",
                    "M": "score de désinformation (0–100)"
                }
            },
            "explainability": [
                "techniques détectées avec preuves (extraits)",
                "déclarations évaluées avec niveau de confiance"
            ],
            "fallback_lite": {
                "overview": "Mode léger de secours (métadonnées uniquement)",
                "risk_score": "S = min(100, 5·T + 3·N + 10·D)",
                "variables": {
                    "T": "termes sensationnalistes",
                    "N": "mentions chiffrées/statistiques",
                    "D": "domaines inconnus/suspects"
                }
            }
        },
        "near_term_roadmap": [
            "Segmentation de contenu (phrases/slogans/chiffres) à partir de transcriptions et texte à l’écran",
            "Représentations sémantiques pour regrouper et rapprocher les idées (similarité cosine)",
            "Appariement sémantique avec vérifications/archives pour relier à des narratifs connus",
            "Score de propagande P = w₁·émotion + w₂·cadre_{eux/nous} + w₃·charge_lexicale + w₄·sélection_partielle (poids expliqués)",
        ],
        "mid_term_enhancements": [
            "Structure rhétorique (accumulation, faux dilemme, glissement sémantique, appels d’autorité)",
            "Trajectoires narratives (épisodes récurrents, dérive narrative dans le temps)",
            "Contexte des sources (réputation, réseaux de citation et domaines)",
            "Outils d’analyse (extraits clés, justifications, annotations collaboratives)",
        ],
        "principles": [
            "Minimisation des données et rétention courte",
            "Transparence par scores/formules et justifications",
            "Pas de pistage ni de profilage non nécessaire",
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


@app.post("/analyze-text")
async def analyze_text_endpoint(text: str = Form(...), platform: Optional[str] = Form("text")):
    if not DEEP_ANALYSIS_ENABLED:
        raise HTTPException(status_code=404, detail="Deep analysis is disabled by configuration")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    try:
        from deep import analyze_text
        result = analyze_text(text, platform or "text")
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"analyze-text failed: {str(e)[:300]}")


@app.post("/analyze-video")
async def analyze_video_endpoint(file: UploadFile = File(...), platform: Optional[str] = Form("video")):
    if not DEEP_ANALYSIS_ENABLED:
        raise HTTPException(status_code=404, detail="Deep analysis is disabled by configuration")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    try:
        from deep import analyze_file
        import tempfile
        from pathlib import Path
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            result = analyze_file(tmp_path, platform or "video")
            return JSONResponse(content=result)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"analyze-video failed: {str(e)[:300]}")


@app.post("/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...), platform: Optional[str] = Form("image")):
    if not DEEP_ANALYSIS_ENABLED:
        raise HTTPException(status_code=404, detail="Deep analysis is disabled by configuration")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    try:
        from deep import analyze_image
        content = await file.read()
        result = analyze_image(content, platform or "image")
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"analyze-image failed: {str(e)[:300]}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))

