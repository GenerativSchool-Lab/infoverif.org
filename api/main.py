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


@app.get("/test-openai")
async def test_openai():
    """Test OpenAI API connection."""
    import json
    from openai import OpenAI
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"status": "error", "message": "OPENAI_API_KEY not configured"}
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Simple JSON test
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You respond only in JSON."},
                {"role": "user", "content": "Return JSON with: test_score (integer 42), message (string 'working')"}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        return {
            "status": "ok",
            "openai_api": "connected",
            "raw_response": content,
            "parsed_response": parsed
        }
        
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error_type": type(e).__name__,
            "error_message": str(e),
            "traceback": traceback.format_exc()
        }


# Remove old heavy job/queue endpoints for this POC


# (status/report endpoints removed in lightweight POC)


@app.get("/method-card")
async def method_card():
    """Return method card highlighting algorithms and roadmap."""
    card = {
        "title": "InfoVerif.org — Méthode & Feuille de Route",
        "subtitle": "Projet Open Source du Civic Tech AI Lab — GenerativSchool.com",
        "goal": "Démocratiser l'analyse de propagande, désinformation et manipulation médiatique via l'IA",
        
        "current_capabilities": {
            "overview": "MVP Fonctionnel — Analyse GPT-4 multi-formats avec explications détaillées",
            "formats": {
                "text": "Analyse directe de texte (posts, articles, messages)",
                "video": "Upload + transcription Whisper + analyse sémantique",
                "image": "Screenshot + extraction Vision API + analyse"
            },
            "detection": {
                "propaganda_techniques": "9+ catégories (manipulation émotionnelle, cadrage, langage chargé, etc.)",
                "conspiracy_markers": "7+ indicateurs (vérité cachée, défiance institutions, rhétorique complotiste)",
                "misinfo_patterns": "7+ types (sophismes, stats trompeuses, affirmations non sourcées)"
            },
            "output": {
                "scores": "propaganda_score, conspiracy_score, misinfo_score, overall_risk (0-100)",
                "techniques": "Nom, citation exacte, sévérité, explication détaillée (2-3 phrases)",
                "claims": "Affirmation, niveau de confiance, problèmes identifiés, raisonnement",
                "summary": "Analyse en 3-4 phrases de l'impact sur l'audience"
            },
            "language": "Français (avec explications pédagogiques)"
        },
        
        "roadmap": {
            "phase_2_q2_2026": {
                "title": "Fine-tuning & Modèles Spécialisés",
                "objectives": [
                    "Fine-tuning BERT/RoBERTa sur corpus de propagande annoté",
                    "Classifier de théories du complot (dataset 10K+ exemples)",
                    "Détecteur de sophismes logiques (fallacy detection)",
                    "Vector database pour patterns de manipulation connus",
                    "Embeddings sémantiques pour clustering de narratives",
                    "Taxonomie de 100+ variantes de techniques"
                ]
            },
            "phase_3_q3_2026": {
                "title": "Agent Autonome & Monitoring",
                "objectives": [
                    "Scan automatisé YouTube/TikTok/Twitter via APIs",
                    "Détection proactive de contenus suspects",
                    "Analyse de réseaux (Graph DB pour comptes liés)",
                    "Détection de coordinated inauthentic behavior",
                    "Dashboard analytics avec visualisation de tendances",
                    "Alertes en temps réel pour chercheurs/fact-checkers",
                    "API publique pour intégrations tierces"
                ]
            },
            "phase_4_q4_2026": {
                "title": "Détection Multimodale Avancée",
                "objectives": [
                    "Détection de deepfakes (Vision Transformers)",
                    "Analyse temporelle de cohérence audio-vidéo",
                    "Détection de montage manipulatoire (cuts, transitions)",
                    "Détecteur d'ingérence étrangère (timing, provenance)",
                    "Identification de fermes de trolls",
                    "Analyse de logos, symboles, QR codes"
                ]
            },
            "phase_5_2026": {
                "title": "Plateforme Communautaire",
                "objectives": [
                    "Annotations collaboratives de contenus",
                    "Taxonomie ouverte de techniques de manipulation",
                    "Bibliothèque de cas d'étude annotés",
                    "Formation à la littératie médiatique",
                    "Partenariats fact-checkers (AFP, Reuters, Snopes)",
                    "Collaborations universitaires (datasets, recherche)",
                    "Outils pour journalistes et éducateurs"
                ]
            }
        },
        
        "open_source": {
            "license": "MIT",
            "repository": "github.com/GenerativSchool-Lab/infoverif.org",
            "contributions": {
                "code": "Pull requests bienvenues (features, bug fixes, optimizations)",
                "data": "Datasets annotés, taxonomies, corpus multilingues",
                "research": "Collaborations académiques, papers, méthodologies",
                "translation": "Interface multilingue (anglais, arabe, etc.)",
                "education": "Tutoriels, guides, ressources pédagogiques"
            },
            "contact": {
                "organization": "Civic Tech AI Lab — GenerativSchool.com",
                "email": "contact@generativschool.com",
                "github": "github.com/GenerativSchool-Lab/infoverif.org",
                "twitter": "@GenerativSchool"
            }
        },
        
        "principles": {
            "transparency": "Code open source, méthodologie documentée, explications détaillées",
            "privacy": "Pas de stockage permanent, pas de profilage utilisateur",
            "education": "Outil pédagogique pour comprendre la manipulation médiatique",
            "collaboration": "Communauté ouverte, contributions bienvenues",
            "ethics": "Pas d'utilisation pour censure ou surveillance"
        },
        
        "limitations": [
            "⚠️ Outil d'aide à l'analyse, pas un verdict absolu",
            "⚠️ Les scores sont des indicateurs, pas des preuves définitives",
            "⚠️ Contexte culturel, humour et satire peuvent créer des faux positifs",
            "⚠️ Ne remplace pas le jugement critique humain",
            "⚠️ Explications générées par IA peuvent contenir des erreurs"
        ],
        
        "tech_stack": {
            "backend": "FastAPI + OpenAI GPT-4o-mini/Whisper/Vision + FFmpeg",
            "frontend": "React + Vite + Tailwind CSS",
            "deployment": "Railway (backend) + Vercel (frontend)",
            "future": "Fine-tuned models, Vector DB, Graph DB, GPU clusters"
        }
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
        import traceback
        full_error = traceback.format_exc()
        raise HTTPException(status_code=400, detail=f"analyze-text failed: {str(e)}\n\nFull traceback:\n{full_error}")


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

