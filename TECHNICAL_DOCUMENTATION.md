# Documentation Technique — InfoVerif.org

## 📋 Table des Matières

1. [Architecture Système](#architecture-système)
2. [API Backend](#api-backend)
3. [Frontend React](#frontend-react)
4. [Algorithmes d'Analyse](#algorithmes-danalyse)
5. [Déploiement & Infrastructure](#déploiement--infrastructure)
6. [Tests & Qualité](#tests--qualité)
7. [Sécurité](#sécurité)
8. [Performance & Optimisation](#performance--optimisation)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Système

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                   │
│  ┌────────────────────────────────────────────────┐    │
│  │  React SPA (Vite)                              │    │
│  │  • React Router (navigation)                   │    │
│  │  • Axios (HTTP client)                         │    │
│  │  • Tailwind CSS (styling)                      │    │
│  │  • KaTeX (math rendering)                      │    │
│  └────────────┬───────────────────────────────────┘    │
└───────────────┼─────────────────────────────────────────┘
                │
                │ HTTPS (axios)
                │
┌───────────────▼─────────────────────────────────────────┐
│              BACKEND (Railway)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  FastAPI (Python 3.11)                          │   │
│  │  ├─ main.py (routes, middleware)                │   │
│  │  ├─ deep.py (OpenAI logic)                      │   │
│  │  ├─ claims.py (validation utils)                │   │
│  │  └─ FFmpeg (audio extraction)                   │   │
│  └──────────────┬──────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────┘
                  │
                  │ HTTPS (openai SDK)
                  │
┌─────────────────▼──────────────────────────────────────┐
│               OPENAI APIS                               │
│  ├─ GPT-4o-mini (chat.completions)                     │
│  ├─ Whisper (audio.transcriptions)                     │
│  └─ Vision (chat.completions with images)              │
└─────────────────────────────────────────────────────────┘
```

### Flux de Données

#### 1. Analyse de Texte

```python
# Frontend
POST /analyze-text
Body: FormData { text: str, platform?: str }

# Backend (main.py)
@app.post("/analyze-text")
async def analyze_text_endpoint(text: str, platform: str):
    validate_input(text)
    result = analyze_text(text, platform)
    return JSONResponse(result)

# Backend (deep.py)
def analyze_text(text: str, platform: str) -> dict:
    metadata = {"platform": platform, "title": "N/A", "description": "N/A"}
    analysis = analyze_with_gpt4(text, metadata)
    return format_response(analysis, metadata)

# Backend (deep.py)
def analyze_with_gpt4(transcript: str, metadata: dict) -> dict:
    prompt = ANALYSIS_PROMPT.format(
        title=metadata['title'],
        description=metadata['description'],
        platform=metadata['platform'],
        transcript=transcript[:8000]
    )
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Expert en analyse médiatique..."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0
    )
    return parse_json_response(response)
```

#### 2. Analyse de Vidéo

```python
# Frontend
POST /analyze-video
Body: FormData { video: File, platform?: str }

# Backend
@app.post("/analyze-video")
async def analyze_video_endpoint(video: UploadFile, platform: str):
    temp_path = save_upload_file(video)
    try:
        audio_path = extract_audio_from_file(temp_path)  # FFmpeg
        transcript = transcribe_audio(audio_path)         # Whisper
        analysis = analyze_with_gpt4(transcript, metadata)
        return format_response(analysis, metadata, transcript)
    finally:
        cleanup_temp_files([temp_path, audio_path])
```

#### 3. Analyse d'Image

```python
# Frontend
POST /analyze-image
Body: FormData { image: File, platform?: str }

# Backend
@app.post("/analyze-image")
async def analyze_image_endpoint(image: UploadFile, platform: str):
    temp_path = save_upload_file(image)
    try:
        extracted_text = analyze_image(temp_path)  # Vision API
        analysis = analyze_with_gpt4(extracted_text, metadata)
        return format_response(analysis, metadata)
    finally:
        cleanup_temp_files([temp_path])

def analyze_image(image_path: str) -> str:
    base64_image = encode_image_base64(image_path)
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract all text from this image..."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
            ]
        }],
        max_tokens=1000
    )
    return response.choices[0].message.content
```

---

## API Backend

### Endpoints Principaux

#### `GET /health`
**Health check** pour monitoring.

**Response** :
```json
{
  "status": "healthy",
  "timestamp": "2026-01-20T10:30:00Z"
}
```

#### `GET /test-openai`
**Test de connectivité** OpenAI API.

**Response** :
```json
{
  "openai_status": "connected",
  "model": "gpt-4o-mini",
  "test_completion": "..."
}
```

#### `POST /analyze-text`
**Analyse de texte direct**.

**Request** :
```
Content-Type: multipart/form-data

text: string (required) - Texte à analyser
platform: string (optional) - "text", "twitter", "facebook", etc.
```

**Response** :
```json
{
  "success": true,
  "input": {
    "platform": "text",
    "title": "N/A",
    "description": "N/A"
  },
  "report": {
    "propaganda_score": 65,
    "conspiracy_score": 42,
    "misinfo_score": 38,
    "overall_risk": 48,
    "techniques": [
      {
        "name": "Manipulation émotionnelle",
        "evidence": "Citation exacte du texte",
        "severity": "high",
        "explanation": "Explication détaillée de la technique..."
      }
    ],
    "claims": [
      {
        "claim": "Affirmation extraite",
        "confidence": "unsupported",
        "issues": ["Absence de sources", "Généralisation abusive"],
        "reasoning": "Raisonnement du jugement..."
      }
    ],
    "summary": "Résumé de l'analyse en 3-4 phrases..."
  }
}
```

**Erreurs** :
```json
{
  "success": false,
  "error": "analyze-text failed: ...",
  "detail": "Full traceback..."
}
```

#### `POST /analyze-video`
**Analyse de fichier vidéo** (transcription + analyse).

**Request** :
```
Content-Type: multipart/form-data

video: File (required) - Fichier vidéo (MP4, MOV, AVI, < 60 Mo)
platform: string (optional) - "youtube", "tiktok", "instagram", etc.
```

**Response** : Même format que `/analyze-text` + champ `transcript_excerpt`.

**Processus** :
1. Upload temporaire du fichier
2. Extraction audio (FFmpeg → MP3)
3. Transcription (Whisper API → texte)
4. Analyse sémantique (GPT-4o-mini)
5. Cleanup fichiers temporaires

#### `POST /analyze-image`
**Analyse de capture/screenshot** (extraction texte + analyse).

**Request** :
```
Content-Type: multipart/form-data

image: File (required) - Image PNG/JPG/WEBP
platform: string (optional) - "twitter", "tiktok", "instagram", etc.
```

**Response** : Même format que `/analyze-text`.

**Processus** :
1. Upload temporaire de l'image
2. Extraction texte (Vision API)
3. Analyse sémantique (GPT-4o-mini)
4. Cleanup fichier temporaire

#### `GET /method-card`
**Méthode & roadmap** (données structurées).

**Response** :
```json
{
  "title": "InfoVerif.org — Méthode & Feuille de Route",
  "goal": "...",
  "current_capabilities": { ... },
  "roadmap": { ... },
  "open_source": { ... },
  "principles": { ... },
  "limitations": [ ... ],
  "tech_stack": { ... }
}
```

### Modèles de Données

#### `AnalysisResult`
```python
{
    "success": bool,
    "input": {
        "url": Optional[str],
        "platform": Optional[str],
        "title": Optional[str],
        "description": Optional[str]
    },
    "report": {
        "propaganda_score": int,      # 0-100
        "conspiracy_score": int,      # 0-100
        "misinfo_score": int,         # 0-100
        "overall_risk": int,          # 0-100
        "techniques": List[Technique],
        "claims": List[Claim],
        "summary": str,
        "transcript_excerpt": Optional[str]  # First 500 chars for video
    },
    "error": Optional[str]  # If success=false
}
```

#### `Technique`
```python
{
    "name": str,           # Nom de la technique en français
    "evidence": str,       # Citation exacte du contenu
    "severity": str,       # "high", "medium", "low"
    "explanation": str     # Explication détaillée (2-3 phrases)
}
```

#### `Claim`
```python
{
    "claim": str,                # Affirmation extraite
    "confidence": str,           # "supported", "unsupported", "misleading"
    "issues": List[str],         # Liste des problèmes identifiés
    "reasoning": str             # Raisonnement du jugement
}
```

---

## Frontend React

### Structure des Composants

```
web/src/
├── App.jsx                 # Router principal
├── main.jsx                # Entry point (ReactDOM.createRoot)
├── components/
│   └── Equation.jsx        # Rendu formules LaTeX (KaTeX)
└── pages/
    ├── Home.jsx            # Landing page avec 3 tabs
    ├── ReportDeep.jsx      # Affichage résultats d'analyse
    └── MethodCard.jsx      # Documentation méthodologie
```

### Composants Clés

#### `Home.jsx` — Landing Page

**State** :
```javascript
const [activeTab, setActiveTab] = useState('text')  // 'text' | 'video' | 'image'
const [text, setText] = useState('')
const [file, setFile] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
```

**Logique de soumission** :
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    const formData = new FormData()
    
    if (activeTab === 'text') {
      if (!text.trim()) throw new Error('Veuillez entrer du texte')
      formData.append('text', text)
      formData.append('platform', 'text')
      endpoint = `${API_URL}/analyze-text`
    } else if (activeTab === 'video') {
      if (!file) throw new Error('Veuillez sélectionner une vidéo')
      formData.append('video', file)
      formData.append('platform', 'youtube')
      endpoint = `${API_URL}/analyze-video`
    } else if (activeTab === 'image') {
      if (!file) throw new Error('Veuillez sélectionner une image')
      formData.append('image', file)
      formData.append('platform', 'twitter')
      endpoint = `${API_URL}/analyze-image`
    }

    const response = await axios.post(endpoint, formData)
    
    if (response.data.success) {
      navigate('/report', { state: { report: response.data } })
    } else {
      throw new Error(response.data.error || 'Erreur lors de l\'analyse')
    }
  } catch (err) {
    setError(err.response?.data?.error || err.message)
  } finally {
    setLoading(false)
  }
}
```

**Upload Drag & Drop** :
```jsx
<div className="relative border-2 border-dashed border-gray-700 rounded-lg p-8 
                hover:border-white transition-colors cursor-pointer bg-black">
  <input
    type="file"
    accept="video/*"  // ou "image/*"
    onChange={(e) => setFile(e.target.files?.[0])}
    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
  />
  <div className="text-center">
    {/* SVG icon */}
    {file ? (
      <p className="text-white">{file.name}</p>
    ) : (
      <p className="text-gray-300">Cliquez ou glissez-déposez</p>
    )}
  </div>
</div>
```

#### `ReportDeep.jsx` — Affichage Résultats

**State & Props** :
```javascript
const location = useLocation()
const { report, input } = location.state?.report || {}

// Calcul des scores
const scores = {
  propaganda: report?.propaganda_score || 0,
  conspiracy: report?.conspiracy_score || 0,
  misinfo: report?.misinfo_score || 0,
  overall: report?.overall_risk || 0
}
```

**Barres de progression** :
```jsx
<div className="mb-4">
  <div className="flex justify-between text-sm text-gray-300 mb-1">
    <span>Indice d'influence</span>
    <span className="font-medium text-white">{scores.overall}/100</span>
  </div>
  <div className="w-full h-2 bg-gray-800 rounded">
    <div className="h-2 rounded bg-white" style={{ width: `${scores.overall}%` }}></div>
  </div>
</div>
```

**Techniques détectées** :
```jsx
{Array.isArray(report.techniques) && report.techniques.map((t, i) => (
  <div key={i} className="border-l-4 border-white pl-4 pb-3">
    <div className="flex items-center justify-between">
      <div className="text-white font-medium">{t.name}</div>
      {t.severity && (
        <span className={`text-xs px-2 py-1 rounded ${
          t.severity === 'high' ? 'bg-gray-800 text-white border border-white' :
          t.severity === 'medium' ? 'bg-gray-800 text-gray-300 border border-gray-600' :
          'bg-gray-800 text-gray-500 border border-gray-700'
        }`}>
          {t.severity === 'high' ? 'Élevé' : t.severity === 'medium' ? 'Moyen' : 'Faible'}
        </span>
      )}
    </div>
    {t.evidence && <div className="text-gray-300 mt-2 italic">« {t.evidence} »</div>}
    {t.explanation && <div className="text-gray-400 text-sm mt-2">{t.explanation}</div>}
  </div>
))}
```

#### `MethodCard.jsx` — Documentation

**Composant `Equation`** :
```jsx
import Equation from '../components/Equation.jsx'

<Equation expr={"I_p = \\alpha_1 \\cdot \\text{manipulation\\_émotionnelle} + ..."} />
```

**Composant `Equation.jsx`** :
```jsx
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function Equation({ expr, display = false }) {
  const html = katex.renderToString(expr, {
    throwOnError: false,
    displayMode: display
  })
  
  return (
    <div 
      className={display ? "my-4 overflow-x-auto" : "inline-block"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

### Configuration API

**Local dev** (`web/.env.local`) :
```bash
VITE_API_URL=http://localhost:8000
```

**Production** (Vercel env var) :
```bash
VITE_API_URL=https://infoveriforg-production.up.railway.app
```

**Code** (`Home.jsx`) :
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api'
```

---

## Algorithmes d'Analyse

### Prompt Engineering

#### `ANALYSIS_PROMPT` (deep.py)

**Structure** :
```python
ANALYSIS_PROMPT = """Tu es un expert en manipulation médiatique, analyse de propagande et détection de désinformation.

Analyse ce contenu pour identifier :

1. TECHNIQUES DE PROPAGANDE (score 0-100) :
   - Manipulation émotionnelle (peur, colère, indignation, urgence)
   - Cadrage "eux vs nous" / désignation d'un bouc émissaire
   - Langage chargé / mots sensationnalistes
   - Sélection partielle des faits (cherry-picking)
   - Appel à l'autorité sans preuves
   - Généralisation abusive
   - Faux dilemmes / pensée binaire
   - Déformation / exagération
   - Répétition de messages clés

2. MARQUEURS CONSPIRATIONNISTES (score 0-100) :
   - Narratives de "vérité cachée" / révélation
   - Défiance envers institutions/experts/médias mainstream
   - Recherche de patterns dans le bruit
   - Affirmations infalsifiables
   - Rhétorique "ils ne veulent pas que tu saches"
   - Théories causales simplistes pour phénomènes complexes
   - Appel au "bon sens" contre l'expertise

3. DÉSINFORMATION & MANIPULATION (score 0-100) :
   - Affirmations non sourcées présentées comme faits
   - Sophismes logiques identifiables
   - Information hors contexte
   - Statistiques trompeuses
   - Confusion corrélation/causalité
   - Omission d'informations cruciales
   - Fausses équivalences

RÉPONDS UNIQUEMENT EN JSON VALIDE dans ce format exact (en français) :
{{
  "propaganda_score": 0-100,
  "conspiracy_score": 0-100,
  "misinfo_score": 0-100,
  "overall_risk": 0-100,
  "techniques": [
    {{"name": "Nom de la technique en français", "evidence": "Citation exacte", "severity": "high/medium/low", "explanation": "Explication détaillée (2-3 phrases)"}}
  ],
  "claims": [
    {{"claim": "Affirmation textuelle", "confidence": "supported/unsupported/misleading", "issues": ["problème 1", "problème 2"], "reasoning": "Explication du jugement"}}
  ],
  "summary": "Analyse détaillée en 3-4 phrases : résumé des techniques identifiées, niveau de risque, et impact potentiel sur l'audience"
}}

MÉTADONNÉES :
Titre : {title}
Description : {description}
Plateforme : {platform}

CONTENU À ANALYSER :
{transcript}
"""
```

**Paramètres critiques** :
- **Échappement des accolades** : `{{` et `}}` au lieu de `{` et `}` dans l'exemple JSON pour éviter les conflits avec `.format()`
- **Langue** : "en français" explicite dans le prompt
- **Structure** : JSON schema détaillé avec types et exemples
- **Limites** : `transcript[:8000]` pour éviter dépassement contexte

### Appel OpenAI

```python
def analyze_with_gpt4(transcript: str, metadata: Dict) -> Dict:
    """Analyze content using OpenAI GPT-4 with JSON mode."""
    prompt = ANALYSIS_PROMPT.format(
        title=metadata.get('title', 'N/A'),
        description=metadata.get('description', 'N/A'),
        platform=metadata.get('platform', 'unknown'),
        transcript=transcript[:8000]  # Limit to ~2K tokens
    )

    # Use json_object mode (compatible with openai 1.12.0)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system", 
                "content": "Tu es un expert en analyse médiatique. Tu DOIS répondre UNIQUEMENT en JSON valide, en français. Pas de markdown, pas de blocs de code, pas d'explications hors du JSON."
            },
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},  # Force JSON output
        temperature=0  # Déterminisme
    )

    content = response.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned empty content")

    # Aggressive cleaning (remove markdown code blocks if present)
    content = content.strip()
    if content.startswith("```"):
        lines = content.split('\n')
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = '\n'.join(lines).strip()

    # Extract JSON object (first { to last })
    first_brace = content.find('{')
    last_brace = content.rfind('}')
    if first_brace == -1 or last_brace == -1:
        raise ValueError(f"No JSON object found. Content: {content[:500]}")
    
    content = content[first_brace:last_brace+1]

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON parse error: {str(e)}. Response: {content[:500]}")

    # Validate and set defaults
    parsed.setdefault("propaganda_score", 0)
    parsed.setdefault("conspiracy_score", 0)
    parsed.setdefault("misinfo_score", 0)
    parsed.setdefault("overall_risk", 0)
    parsed.setdefault("techniques", [])
    parsed.setdefault("claims", [])
    parsed.setdefault("summary", "")

    return parsed
```

### Traitement Audio/Vidéo

#### Extraction Audio (FFmpeg)

```python
def extract_audio_from_file(video_path: str) -> str:
    """Extract audio from video file using FFmpeg."""
    audio_path = video_path.replace(os.path.splitext(video_path)[1], ".mp3")
    
    try:
        ffmpeg.input(video_path).output(
            audio_path, 
            acodec='libmp3lame',  # MP3 codec
            ar='16000',           # 16kHz (sufficient for speech)
            ac='1',               # Mono
            ab='64k'              # 64 kbps
        ).overwrite_output().run(
            quiet=True,
            capture_stdout=True,
            capture_stderr=True
        )
    except ffmpeg.Error as e:
        raise RuntimeError(f"FFmpeg extraction failed: {e.stderr.decode()}")
    
    return audio_path
```

#### Transcription (Whisper)

```python
def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio using OpenAI Whisper API."""
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="fr",  # Force français (optionnel, auto-détection sinon)
            response_format="text"
        )
    
    transcript = response if isinstance(response, str) else response.text
    
    if not transcript or len(transcript.strip()) < 10:
        raise ValueError("Transcription trop courte ou vide")
    
    return transcript
```

### Extraction Texte Image (Vision)

```python
def analyze_image(image_path: str) -> str:
    """Extract text from image using Vision API."""
    # Encode image to base64
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Extract all text visible in this image. Include any captions, usernames, post content, comments, or any other text. Output only the extracted text, preserving the original language and structure."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        }],
        max_tokens=1000
    )
    
    extracted_text = response.choices[0].message.content
    
    if not extracted_text or len(extracted_text.strip()) < 5:
        raise ValueError("Aucun texte détectable dans l'image")
    
    return extracted_text
```

---

## Déploiement & Infrastructure

### Railway (Backend)

#### Configuration (`nixpacks.toml`)

```toml
[phases.setup]
nixPkgs = ["python311"]
aptPackages = [
  "curl",
  "ffmpeg"  # Critical for audio extraction
]

[phases.install]
cmds = [
  "cd api && pip install -r requirements-lite.txt"
]

[start]
cmd = "cd api && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"
```

#### Variables d'Environnement

```bash
OPENAI_API_KEY=sk-...
PORT=8080  # Railway sets this automatically
DEEP_ANALYSIS_ENABLED=true  # Default
```

#### Auto-Deploy Git

**Setup** :
1. Railway dashboard → Connect GitHub repo
2. Select service `infoverif.org`
3. Enable auto-deploy on push to `main`

**Workflow** :
```bash
git add .
git commit -m "feat: new feature"
git push origin main  # Triggers Railway deploy automatically
```

**Logs** :
```bash
# Railway CLI
railway logs --service infoverif.org --tail
```

#### Health Checks

Railway monitors `GET /health` :
```python
@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Vercel (Frontend)

#### Configuration

**Root Directory** : `web`  
**Build Command** : `npm run build`  
**Output Directory** : `dist`  
**Framework Preset** : Vite

#### Variables d'Environnement

```bash
VITE_API_URL=https://infoveriforg-production.up.railway.app
```

#### Auto-Deploy Git

**Setup** :
1. Vercel dashboard → Import project from GitHub
2. Configure root directory = `web`
3. Add environment variable `VITE_API_URL`

**Workflow** :
```bash
git push origin main  # Triggers Vercel deploy automatically
```

#### Rewrites (SPA Routing)

Vercel automatically handles SPA routing for Vite (no config needed).

---

## Tests & Qualité

### Tests Backend

#### Tests Manuels (curl)

```bash
# Health check
curl https://infoveriforg-production.up.railway.app/health

# Test OpenAI
curl https://infoveriforg-production.up.railway.app/test-openai

# Analyse texte
curl -X POST https://infoveriforg-production.up.railway.app/analyze-text \
  -F 'text=Ce gouvernement nous ment ! Réveillez-vous !' \
  -F 'platform=text' | jq .

# Analyse vidéo
curl -X POST https://infoveriforg-production.up.railway.app/analyze-video \
  -F 'video=@./test_video.mp4' \
  -F 'platform=youtube' | jq .

# Analyse image
curl -X POST https://infoveriforg-production.up.railway.app/analyze-image \
  -F 'image=@./screenshot.png' \
  -F 'platform=twitter' | jq .
```

#### Tests Unitaires (TODO Phase 2)

```python
# tests/test_deep.py
import pytest
from api.deep import analyze_with_gpt4, extract_audio_from_file, transcribe_audio

def test_analyze_with_gpt4():
    """Test GPT-4 analysis with sample text."""
    text = "Les médias mainstream cachent la vérité ! Réveillez-vous !"
    metadata = {"platform": "text", "title": "Test", "description": "Test"}
    
    result = analyze_with_gpt4(text, metadata)
    
    assert result["propaganda_score"] > 0
    assert result["conspiracy_score"] > 0
    assert len(result["techniques"]) > 0
    assert result["summary"]

def test_extract_audio():
    """Test FFmpeg audio extraction."""
    audio_path = extract_audio_from_file("tests/fixtures/sample_video.mp4")
    assert os.path.exists(audio_path)
    assert audio_path.endswith(".mp3")

def test_transcribe_audio():
    """Test Whisper transcription."""
    transcript = transcribe_audio("tests/fixtures/sample_audio.mp3")
    assert len(transcript) > 10
```

### Tests Frontend

#### Tests Manuels

1. **Texte** : Collez un texte propagandiste et vérifiez scores élevés
2. **Vidéo** : Uploadez une courte vidéo (< 5 Mo) et vérifiez transcription
3. **Image** : Uploadez une capture de tweet et vérifiez extraction texte

#### Tests E2E (TODO Phase 2)

```javascript
// tests/e2e/analyze.spec.js
import { test, expect } from '@playwright/test'

test('analyze text flow', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Click Text tab
  await page.click('text=Texte')
  
  // Enter text
  await page.fill('textarea', 'Les médias mentent !')
  
  // Submit
  await page.click('text=Lancer l\'analyse')
  
  // Wait for results
  await page.waitForURL('**/report')
  
  // Check scores displayed
  await expect(page.locator('text=Indice d\'influence')).toBeVisible()
  await expect(page.locator('text=Intensité persuasive')).toBeVisible()
})
```

---

## Sécurité

### Backend

#### Input Validation

```python
# Validation taille fichier
MAX_VIDEO_SIZE = 60 * 1024 * 1024  # 60 MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

@app.post("/analyze-video")
async def analyze_video_endpoint(video: UploadFile):
    # Check file size
    file_size = 0
    for chunk in video.file:
        file_size += len(chunk)
        if file_size > MAX_VIDEO_SIZE:
            raise HTTPException(400, "Video too large (max 60 MB)")
    
    # Check MIME type
    if not video.content_type.startswith('video/'):
        raise HTTPException(400, "Invalid video file")
```

#### Sanitization

```python
# Nettoyage input text
def sanitize_text(text: str) -> str:
    """Remove potentially harmful characters."""
    text = text.strip()
    text = text[:10000]  # Max 10K chars
    return text
```

#### Secrets Management

```bash
# .env (NEVER commit)
OPENAI_API_KEY=sk-...

# .gitignore
.env
.env.local
*.env
```

#### CORS

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://infoverif.org", "http://localhost:5173"],  # Production + local dev
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### Frontend

#### Environment Variables

```bash
# .env.local (NEVER commit)
VITE_API_URL=http://localhost:8000

# .gitignore
.env.local
.env*.local
```

#### API Key Protection

- ✅ API key uniquement en backend
- ✅ Jamais exposée au frontend
- ✅ Railway environment variables (encrypted)

---

## Performance & Optimisation

### Backend

#### Optimisations Actuelles

- **Température = 0** : Déterminisme, pas de randomness
- **Limite transcript** : `[:8000]` chars (~2K tokens)
- **FFmpeg audio** : 16kHz mono 64kbps (sufficient for speech)
- **Cleanup temporaire** : Fichiers supprimés après traitement

#### Optimisations Futures (Phase 2-3)

- **Caching** : Redis pour résultats identiques (hash du contenu)
- **Batch processing** : Analyse multiple contenus en parallèle
- **GPU** : Fine-tuned models sur GPU pour inférence rapide
- **CDN** : Cloudflare pour assets statiques

### Frontend

#### Optimisations Actuelles

- **Vite** : Build ultra-rapide, HMR
- **Code splitting** : Lazy loading pages
- **Tailwind** : Purge CSS inutilisé

#### Optimisations Futures

- **React.lazy** : Lazy load `ReportDeep`, `MethodCard`
- **Image optimization** : WebP, lazy loading images
- **Service Worker** : Offline mode, cache API responses

---

## Troubleshooting

### Erreurs Communes

#### `KeyError: '\n  "propaganda_score"'`

**Cause** : Accolades non échappées dans `ANALYSIS_PROMPT`.

**Solution** :
```python
# BAD
"{"propaganda_score": 0-100}"

# GOOD
"{{"propaganda_score": 0-100}}"
```

#### `TypeError: Client.__init__() got unexpected keyword argument 'proxies'`

**Cause** : Incompatibilité `httpx>=0.28` avec `openai==1.12.0`.

**Solution** :
```bash
pip install 'httpx<0.28'
```

#### `FFmpeg extraction failed: No such file or directory`

**Cause** : FFmpeg non installé.

**Solution** :
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install -y ffmpeg

# Railway: Ajoutez à nixpacks.toml
aptPackages = ["ffmpeg"]
```

#### `JSON parse error: Expecting value`

**Cause** : GPT-4 retourne markdown au lieu de JSON pur.

**Solution** : Aggressive cleaning dans `analyze_with_gpt4()` :
```python
# Remove markdown code blocks
if content.startswith("```"):
    lines = content.split('\n')
    if lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    content = '\n'.join(lines).strip()
```

#### `Railway: Failed to create code snapshot`

**Cause** : `railway up` (snapshot deploy) est instable.

**Solution** : Utiliser auto-deploy Git :
```bash
git push origin main  # Preferred method
```

### Logs & Debugging

#### Backend Logs (Railway)

```bash
# Real-time logs
railway logs --service infoverif.org --tail

# Filtrer par niveau
railway logs | grep ERROR
```

#### Frontend Logs (Vercel)

```bash
# Via Vercel dashboard
https://vercel.com/your-team/infoverif-org/logs

# Via CLI
vercel logs infoverif-org
```

#### Local Debugging

```bash
# Backend
cd api
uvicorn main:app --reload --log-level debug

# Frontend
cd web
npm run dev
# Ouvrir DevTools Console (F12)
```

---

## Contributions

Pour contribuer au développement, voir [README.md](./README.md) section "Contribuer".

**Tests avant PR** :
```bash
# Backend
cd api
pytest tests/

# Frontend
cd web
npm run test
npm run build  # Vérifier pas d'erreur de build
```

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026  
**Contact** : contact@generativschool.com

