"""Main FastAPI application (lightweight metadata POC)."""
import os
import time
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

# DIMA semantic layer
try:
    from dima_detector import get_detector
    DIMA_AVAILABLE = True
except ImportError:
    DIMA_AVAILABLE = False

# Avoid importing heavy task/redis code at startup; import inside endpoints when needed

load_dotenv()

app = FastAPI(title="InfoVerif API", version="1.0.0")

# Include extension routes
try:
    from routes.extension import router as extension_router
    app.include_router(extension_router)
except ImportError:
    print("⚠️  Extension routes not available")

# Global DIMA detector instance (loaded at startup)
dima_detector = None

# Feature flags (Deep is default)
DEEP_ANALYSIS_ENABLED = os.getenv("DEEP_ANALYSIS_ENABLED", "true").lower() == "true"

# Backend version (for extension compatibility tracking)
BACKEND_VERSION = "2025-11-03"  # Deploy date


def create_analysis_response(result: dict, start_time: float) -> JSONResponse:
    """
    Create JSONResponse with custom headers for extension compatibility.
    
    Args:
        result: Analysis result dict
        start_time: Request start timestamp
    
    Returns:
        JSONResponse with custom headers
    """
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Determine taxonomy version from DIMA availability
    taxonomy_version = "DIMA-M2.2-130" if DIMA_AVAILABLE and dima_detector else "legacy"
    
    headers = {
        "x-model-card": "gpt-4o-mini",
        "x-taxonomy-version": taxonomy_version,
        "x-latency-ms": str(latency_ms),
        "x-backend-version": BACKEND_VERSION,
    }
    
    return JSONResponse(content=result, headers=headers)

# CORS - Allow web app + Chrome extension
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Local dev
    "https://infoverif-org.vercel.app",  # Production web app
    "chrome-extension://*",  # Chrome extension (wildcard for unpacked testing)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"chrome-extension://[a-z]+",  # Allow any extension ID
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-model-card", "x-taxonomy-version", "x-latency-ms", "x-backend-version"],  # Expose custom headers for extension
)

# Redis connection (optional)
redis_conn = None
try:
    if redis is not None:
        redis_conn = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
except Exception:
    redis_conn = None


@app.on_event("startup")
async def startup_event():
    """Load DIMA taxonomy at FastAPI startup."""
    global dima_detector
    
    if DIMA_AVAILABLE:
        try:
            print("🔄 Loading DIMA taxonomy...")
            dima_detector = get_detector()
            stats = dima_detector.get_taxonomy_stats()
            print(f"✅ DIMA taxonomy loaded: {stats['total_techniques']} techniques, {stats['total_families']} families")
            
            # M2.2: Check embeddings status
            if dima_detector.is_embeddings_enabled():
                print("✅ DIMA embeddings loaded and ready (FAISS index built)")
            else:
                print("⚠️  DIMA embeddings NOT available (sentence-transformers/faiss missing or failed to load)")
                print("   Continuing with M2.1 (prompts-only, no semantic similarity)")
        except Exception as e:
            print(f"⚠️  Error loading DIMA taxonomy: {e}")
            print("   Continuing with degraded functionality (legacy prompts only)")
    else:
        print("⚠️  DIMA modules not available, using legacy prompts")


# Request/response models kept minimal for POC
class AnalyzeRequest(BaseModel):
    url: str
    platform: Optional[str] = None  # youtube, tiktok, twitter/x


@app.get("/health")
async def health():
    """Health check endpoint."""
    data = {"status": "ok", "service": "infoverif-api"}
    
    # DIMA status
    if DIMA_AVAILABLE and dima_detector:
        stats = dima_detector.get_taxonomy_stats()
        data["dima"] = {
            "status": "loaded",
            "techniques": stats['total_techniques'],
            "families": stats['total_families'],
            "embeddings_enabled": dima_detector.is_embeddings_enabled()
        }
    else:
        data["dima"] = {"status": "unavailable"}
    
    # Redis status
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


@app.get("/dima-taxonomy")
async def dima_taxonomy_endpoint():
    """
    Return DIMA taxonomy information (debug endpoint).
    
    Returns:
        Taxonomy statistics and sample techniques
    """
    if not DIMA_AVAILABLE or not dima_detector:
        raise HTTPException(status_code=503, detail="DIMA taxonomy not loaded")
    
    stats = dima_detector.get_taxonomy_stats()
    families = dima_detector.get_all_families()
    
    # Sample techniques per family (first 3)
    samples = {}
    for family in families:
        codes = dima_detector.get_family_techniques(family)[:3]
        samples[family] = [
            {
                "code": code,
                "name": dima_detector.get_technique(code)['name_fr']
            }
            for code in codes
        ]
    
    return {
        "status": "loaded",
        "stats": stats,
        "families": families,
        "samples": samples
    }


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
        "goal": "Démocratiser l'analyse des techniques de persuasion, propagande, manipulation émotionnelle et désinformation via l'IA",
        
        "current_capabilities": {
            "overview": "MVP Fonctionnel — Analyse GPT-4 multi-formats avec explications détaillées",
            "formats": {
                "text": "Analyse directe de texte (posts, articles, messages)",
                "video": "Upload + transcription Whisper + analyse sémantique",
                "image": "Screenshot + extraction Vision API + analyse"
            },
            "detection": {
                "persuasive_intensity": "9+ catégories (manipulation émotionnelle, cadrage, langage chargé, appel à l'autorité, etc.)",
                "speculative_narrative": "7+ indicateurs (vérité cachée, défiance institutions, rhétorique complotiste, causalité simpliste)",
                "factual_reliability": "7+ types (sophismes, stats trompeuses, affirmations non sourcées, cherry-picking)"
            },
            "output": {
                "scores": "Indice d'influence (overall), Intensité persuasive, Narratif spéculatif, Fiabilité factuelle (0-100)",
                "techniques": "Nom, citation exacte, sévérité, explication détaillée (2-3 phrases)",
                "claims": "Affirmation, niveau de confiance, problèmes identifiés, raisonnement",
                "summary": "Analyse en 3-4 phrases de l'impact sur l'audience",
                "note_terminology": "Frontend affiche des termes académiques nuancés ; backend conserve les variables techniques (propaganda_score, conspiracy_score, misinfo_score, overall_risk)"
            },
            "language": "Français (avec explications pédagogiques)"
        },
        
        "roadmap": {
            "phase_2_q2_2026": {
                "title": "Fine-tuning & Modèles Spécialisés",
                "objectives": [
                    "Fine-tuning BERT/RoBERTa sur corpus annoté (techniques de persuasion, manipulation)",
                    "Classifier de narratifs spéculatifs et complotistes (dataset 10K+ exemples)",
                    "Détecteur de sophismes logiques et biais cognitifs (fallacy detection)",
                    "Vector database pour patterns rhétoriques connus",
                    "Embeddings sémantiques pour clustering de narratives et propagation d'influence",
                    "Taxonomie de 100+ variantes de techniques persuasives"
                ]
            },
            "phase_3_q3_2026": {
                "title": "Agent Autonome & Monitoring des Narratifs",
                "objectives": [
                    "Scan automatisé YouTube/TikTok/Twitter via APIs",
                    "Détection proactive de contenus à haut indice d'influence",
                    "Analyse de réseaux (Graph DB pour comptes liés et propagation de narratifs)",
                    "Détection de comportements coordonnés inautentiques",
                    "Dashboard analytics avec visualisation de tendances persuasives",
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
                "title": "Plateforme Communautaire & Éducation",
                "objectives": [
                    "Annotations collaboratives de contenus",
                    "Taxonomie ouverte de techniques persuasives et manipulatoires",
                    "Bibliothèque de cas d'étude annotés avec explications pédagogiques",
                    "Formation à la littératie médiatique et esprit critique",
                    "Partenariats fact-checkers (AFP, Reuters, Snopes)",
                    "Collaborations universitaires (datasets, méthodologies de recherche)",
                    "Outils pour journalistes, éducateurs et chercheurs"
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
    start_time = time.time()
    if not DEEP_ANALYSIS_ENABLED:
        raise HTTPException(status_code=404, detail="Deep analysis is disabled by configuration")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    try:
        from deep import analyze_text
        result = analyze_text(text, platform or "text")
        
        # Cache for extension chat (if analysis_id present)
        if result.get("analysis_id"):
            from routes.extension import cache_analysis
            cache_analysis(result["analysis_id"], result)
        
        return create_analysis_response(result, start_time)
    except Exception as e:
        import traceback
        full_error = traceback.format_exc()
        raise HTTPException(status_code=400, detail=f"analyze-text failed: {str(e)}\n\nFull traceback:\n{full_error}")


@app.post("/analyze-video")
async def analyze_video_endpoint(file: UploadFile = File(...), platform: Optional[str] = Form("video")):
    """Analyze uploaded video file (multipart/form-data)."""
    start_time = time.time()
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
            
            # Cache for extension chat (if analysis_id present)
            if result.get("analysis_id"):
                from routes.extension import cache_analysis
                cache_analysis(result["analysis_id"], result)
            
            return create_analysis_response(result, start_time)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"analyze-video failed: {str(e)[:300]}")


@app.post("/analyze-video-url")
async def analyze_video_url_endpoint(url: str = Form(...), platform: Optional[str] = Form("video")):
    """
    Analyze video from URL (Twitter, YouTube, TikTok, etc.) using yt-dlp.
    Downloads audio only, transcribes with Whisper, analyzes with GPT-4 + DIMA.
    """
    start_time = time.time()
    if not DEEP_ANALYSIS_ENABLED:
        raise HTTPException(status_code=404, detail="Deep analysis is disabled by configuration")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    try:
        from deep import analyze_url
        
        print(f"🎬 Analyzing video URL: {url}")
        result = analyze_url(url, platform or "video")
        
        # Cache for extension chat (if analysis_id present)
        if result.get("analysis_id"):
            from routes.extension import cache_analysis
            cache_analysis(result["analysis_id"], result)
        
        return create_analysis_response(result, start_time)
    except Exception as e:
        import traceback
        full_error = traceback.format_exc()
        print(f"❌ analyze-video-url failed: {str(e)}\n{full_error}")
        raise HTTPException(status_code=400, detail=f"analyze-video-url failed: {str(e)[:300]}")


@app.post("/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...), platform: Optional[str] = Form("image")):
    start_time = time.time()
    if not DEEP_ANALYSIS_ENABLED:
        raise HTTPException(status_code=404, detail="Deep analysis is disabled by configuration")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    try:
        from deep import analyze_image
        content = await file.read()
        result = analyze_image(content, platform or "image")
        
        # Cache for extension chat (if analysis_id present)
        if result.get("analysis_id"):
            from routes.extension import cache_analysis
            cache_analysis(result["analysis_id"], result)
        
        return create_analysis_response(result, start_time)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"analyze-image failed: {str(e)[:300]}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))

