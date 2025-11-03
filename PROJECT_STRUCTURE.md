# Structure du Projet — InfoVerif.org

Documentation de l'architecture et organisation des fichiers.

---

## 📁 Arborescence Principale

```
infoverif.org/
├── 📄 README.md                      # Vue d'ensemble complète du projet
├── 📄 QUICKSTART.md                  # Guide de démarrage rapide (5 min)
├── 📄 TECHNICAL_DOCUMENTATION.md     # Documentation technique détaillée
├── 📄 CONTRIBUTING.md                # Guide de contribution
├── 📄 CHANGELOG.md                   # Historique des versions
├── 📄 PROJECT_STRUCTURE.md           # Ce fichier
├── 📄 LICENSE                        # MIT License
├── 📄 .gitignore                     # Fichiers ignorés par Git
├── 📄 nixpacks.toml                  # Configuration Railway (build)
│
├── 📁 api/                           # Backend FastAPI
│   ├── 📄 main.py                    # Application principale, routes
│   ├── 📄 deep.py                    # Logique analyse OpenAI
│   ├── 📄 claims.py                  # Validation claims (legacy)
│   ├── 📄 requirements-lite.txt      # Dépendances Python
│   ├── 📄 runtime.txt                # Version Python (Railway)
│   └── 📄 .env                       # Variables d'environnement (gitignored)
│
└── 📁 web/                           # Frontend React + Vite
    ├── 📁 src/
    │   ├── 📄 main.jsx               # Entry point React
    │   ├── 📄 App.jsx                # Router principal
    │   ├── 📄 index.css              # Styles Tailwind
    │   ├── 📁 components/
    │   │   └── 📄 Equation.jsx       # Rendu formules LaTeX (KaTeX)
    │   └── 📁 pages/
    │       ├── 📄 Home.jsx           # Landing page (3 tabs)
    │       ├── 📄 ReportDeep.jsx     # Affichage résultats
    │       └── 📄 MethodCard.jsx     # Documentation méthodologie
    │
    ├── 📁 public/                    # Assets statiques
    ├── 📄 package.json               # Dépendances npm
    ├── 📄 vite.config.js             # Configuration Vite
    ├── 📄 tailwind.config.js         # Configuration Tailwind
    ├── 📄 postcss.config.js          # Configuration PostCSS
    ├── 📄 index.html                 # HTML template
    └── 📄 .env.local                 # Variables d'environnement (gitignored)
```

---

## 🔑 Fichiers Clés

### Documentation

| Fichier | Lignes | Description | Audience |
|---------|--------|-------------|----------|
| `README.md` | 350+ | Vue d'ensemble, mission, fonctionnalités, roadmap | Tous |
| `QUICKSTART.md` | 500+ | Installation express (5 min) avec commandes | Débutants |
| `TECHNICAL_DOCUMENTATION.md` | 1200+ | Architecture, API, algorithmes, déploiement | Développeurs |
| `CONTRIBUTING.md` | 600+ | Guide contribution, standards, workflow Git | Contributeurs |
| `CHANGELOG.md` | 400+ | Historique versions, roadmap | Mainteneurs |
| `PROJECT_STRUCTURE.md` | Ce fichier | Organisation fichiers | Développeurs |

### Backend (Python/FastAPI)

| Fichier | Lignes | Description | Responsabilité |
|---------|--------|-------------|----------------|
| `api/main.py` | 310 | Routes API, middleware CORS, method card | Endpoints, validation |
| `api/deep.py` | 284 | Logique OpenAI (GPT-4, Whisper, Vision), FFmpeg | Analyse sémantique |
| `api/claims.py` | 105 | Utilitaires validation (legacy) | Helpers |
| `api/requirements-lite.txt` | 15 | Dépendances Python | Dependencies |

**Endpoints principaux** :
- `GET /health` → Health check
- `GET /test-openai` → Test OpenAI connectivity
- `POST /analyze-text` → Analyse texte
- `POST /analyze-video` → Analyse vidéo (FFmpeg + Whisper + GPT)
- `POST /analyze-image` → Analyse image (Vision + GPT)
- `GET /method-card` → Méthode & roadmap (JSON)

### Frontend (React/Vite)

| Fichier | Lignes | Description | Responsabilité |
|---------|--------|-------------|----------------|
| `web/src/main.jsx` | 10 | Entry point React | ReactDOM.createRoot |
| `web/src/App.jsx` | 20 | Router principal | Routes (/, /report, /method-card) |
| `web/src/pages/Home.jsx` | 150 | Landing page avec 3 tabs | Formulaire, upload, submit |
| `web/src/pages/ReportDeep.jsx` | 185 | Affichage résultats | Scores, techniques, claims |
| `web/src/pages/MethodCard.jsx` | 100 | Documentation méthodologie | Formules LaTeX, roadmap |
| `web/src/components/Equation.jsx` | 15 | Rendu formules LaTeX | KaTeX wrapper |

**Routes** :
- `/` → Page d'accueil (Home.jsx)
- `/report` → Résultats analyse (ReportDeep.jsx)
- `/method-card` → Documentation (MethodCard.jsx)

### Configuration

| Fichier | Description | Utilisé par |
|---------|-------------|-------------|
| `nixpacks.toml` | Config build Railway (Python 3.11, FFmpeg, aptPackages) | Railway |
| `web/vite.config.js` | Config build Vite (plugins, alias) | Vite |
| `web/tailwind.config.js` | Config Tailwind (theme noir & blanc) | Tailwind CSS |
| `api/.env` | Variables backend (OPENAI_API_KEY, PORT) | FastAPI |
| `web/.env.local` | Variables frontend (VITE_API_URL) | Vite |

---

## 🧩 Modules & Dépendances

### Backend (Python)

**Dépendances principales** :
```python
fastapi==0.115.6           # API REST framework
openai==1.12.0             # OpenAI SDK (GPT-4, Whisper, Vision)
httpx<0.28                 # HTTP client (compatibilité openai)
python-multipart==0.0.20   # Support upload fichiers
ffmpeg-python==0.2.0       # Wrapper FFmpeg pour extraction audio
uvicorn[standard]==0.34.0  # Serveur ASGI
pydantic==2.10.5           # Validation données
python-dotenv==1.0.1       # Variables d'environnement
```

**Modules internes** :
- `main.py` → Routes API, middleware, validation
- `deep.py` → Analyse OpenAI, FFmpeg, transcription
- `claims.py` → Utilitaires validation (legacy)

### Frontend (React)

**Dépendances principales** :
```javascript
react==18.3.1              // Bibliothèque UI
react-dom==18.3.1          // Rendu DOM
react-router-dom==7.1.1    // Routing SPA
axios==1.7.9               // HTTP client
katex==0.16.11             // Rendu formules LaTeX
tailwindcss==3.4.17        // Design system utility-first
vite==6.0.5                // Build tool ultra-rapide
```

**Modules internes** :
- `main.jsx` → Entry point
- `App.jsx` → Router
- `pages/*.jsx` → Composants pages
- `components/*.jsx` → Composants réutilisables

---

## 📊 Flux de Données

### 1. Analyse de Texte

```
┌─────────────────┐
│   User Input    │
│   (textarea)    │
└────────┬────────┘
         │ onChange
         ▼
┌─────────────────┐
│ useState(text)  │
└────────┬────────┘
         │ handleSubmit
         ▼
┌─────────────────────────────────┐
│ axios.post('/analyze-text')     │
│ FormData {text, platform}       │
└────────┬────────────────────────┘
         │ HTTP POST
         ▼
┌─────────────────────────────────┐
│ FastAPI: analyze_text_endpoint  │
│ • Validate input                │
│ • analyze_text(text, platform)  │
└────────┬────────────────────────┘
         │ analyze_with_gpt4
         ▼
┌─────────────────────────────────┐
│ OpenAI GPT-4o-mini              │
│ • ANALYSIS_PROMPT.format(...)   │
│ • response_format: json_object  │
│ • temperature: 0                │
└────────┬────────────────────────┘
         │ JSON response
         ▼
┌─────────────────────────────────┐
│ parse_json_response()           │
│ • Clean markdown                │
│ • Extract JSON {...}            │
│ • Validate fields               │
└────────┬────────────────────────┘
         │ return formatted result
         ▼
┌─────────────────────────────────┐
│ navigate('/report', {state})    │
│ • report: analysis result       │
│ • input: metadata               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ ReportDeep.jsx                  │
│ • Display scores (bars)         │
│ • Display techniques            │
│ • Display claims                │
│ • Display summary               │
└─────────────────────────────────┘
```

### 2. Analyse de Vidéo

```
┌─────────────────┐
│  User Upload    │
│  (drag & drop)  │
└────────┬────────┘
         │ onChange
         ▼
┌─────────────────┐
│ useState(file)  │
└────────┬────────┘
         │ handleSubmit
         ▼
┌──────────────────────────────────┐
│ axios.post('/analyze-video')     │
│ FormData {video: File}           │
└────────┬─────────────────────────┘
         │ HTTP POST (multipart)
         ▼
┌──────────────────────────────────┐
│ FastAPI: analyze_video_endpoint  │
│ • Save temp file                 │
│ • extract_audio_from_file()      │
└────────┬─────────────────────────┘
         │ FFmpeg extraction
         ▼
┌──────────────────────────────────┐
│ FFmpeg                           │
│ • input(video_path)              │
│ • output(audio.mp3, 16kHz mono)  │
└────────┬─────────────────────────┘
         │ audio_path
         ▼
┌──────────────────────────────────┐
│ transcribe_audio()               │
│ • Whisper API (whisper-1)        │
│ • response_format: text          │
└────────┬─────────────────────────┘
         │ transcript
         ▼
┌──────────────────────────────────┐
│ analyze_with_gpt4(transcript)    │
│ (same as text analysis)          │
└────────┬─────────────────────────┘
         │ analysis result
         ▼
┌──────────────────────────────────┐
│ cleanup_temp_files()             │
│ • os.remove(video_path)          │
│ • os.remove(audio_path)          │
└────────┬─────────────────────────┘
         │ return result
         ▼
┌──────────────────────────────────┐
│ ReportDeep.jsx                   │
│ + transcript_excerpt (first 500) │
└──────────────────────────────────┘
```

### 3. Analyse d'Image

```
┌─────────────────┐
│  User Upload    │
│  (screenshot)   │
└────────┬────────┘
         │ onChange
         ▼
┌─────────────────┐
│ useState(file)  │
└────────┬────────┘
         │ handleSubmit
         ▼
┌──────────────────────────────────┐
│ axios.post('/analyze-image')     │
│ FormData {image: File}           │
└────────┬─────────────────────────┘
         │ HTTP POST (multipart)
         ▼
┌──────────────────────────────────┐
│ FastAPI: analyze_image_endpoint  │
│ • Save temp file                 │
│ • analyze_image(image_path)      │
└────────┬─────────────────────────┘
         │ Vision API call
         ▼
┌──────────────────────────────────┐
│ OpenAI Vision (gpt-4o-mini)      │
│ • Encode image → base64          │
│ • content: [{text}, {image_url}] │
│ • max_tokens: 1000               │
└────────┬─────────────────────────┘
         │ extracted_text
         ▼
┌──────────────────────────────────┐
│ analyze_with_gpt4(extracted_text)│
│ (same as text analysis)          │
└────────┬─────────────────────────┘
         │ analysis result
         ▼
┌──────────────────────────────────┐
│ cleanup_temp_files()             │
│ • os.remove(image_path)          │
└────────┬─────────────────────────┘
         │ return result
         ▼
┌──────────────────────────────────┐
│ ReportDeep.jsx                   │
└──────────────────────────────────┘
```

---

## 🎨 Architecture Composants React

```
App.jsx (Router)
├─ Route "/"
│  └─ Home.jsx
│     ├─ Header (title, subtitle)
│     ├─ Main
│     │  ├─ Tabs (text, video, image)
│     │  ├─ Form
│     │  │  ├─ TextTab → <textarea>
│     │  │  ├─ VideoTab → <input type="file" accept="video/*">
│     │  │  └─ ImageTab → <input type="file" accept="image/*">
│     │  └─ Submit Button
│     └─ Footer (GenerativSchool, links)
│
├─ Route "/report"
│  └─ ReportDeep.jsx
│     ├─ Header (back link, title)
│     └─ Main (grid 2 cols)
│        ├─ Left Column
│        │  ├─ Scores Card (4 progress bars)
│        │  ├─ Techniques Card (list with evidence)
│        │  └─ Claims Card (list with confidence)
│        └─ Right Column (Sidebar)
│           ├─ Input Metadata Card
│           ├─ Summary Card
│           └─ Transcript Excerpt Card (if video)
│
└─ Route "/method-card"
   └─ MethodCard.jsx
      ├─ Header (title, subtitle)
      └─ Main (single column)
         ├─ Current Capabilities
         │  └─ Equation components (LaTeX formulas)
         ├─ Phase 2 (Q2 2026)
         │  └─ Equation components
         ├─ Phase 3 (Q3-Q4 2026)
         │  └─ Equation components
         ├─ Ethics & Principles
         └─ Footer (back link)
```

---

## 🗄️ Modèles de Données

### Backend → Frontend (API Response)

```typescript
// POST /analyze-text | /analyze-video | /analyze-image
{
  success: boolean,
  input: {
    url?: string,
    platform?: string,
    title?: string,
    description?: string
  },
  report: {
    propaganda_score: number,      // 0-100
    conspiracy_score: number,      // 0-100
    misinfo_score: number,         // 0-100
    overall_risk: number,          // 0-100
    techniques: [
      {
        name: string,              // "Manipulation émotionnelle"
        evidence: string,          // "Citation exacte"
        severity: "high" | "medium" | "low",
        explanation: string        // "Explication détaillée..."
      }
    ],
    claims: [
      {
        claim: string,             // "Affirmation extraite"
        confidence: "supported" | "unsupported" | "misleading",
        issues: string[],          // ["Problème 1", "Problème 2"]
        reasoning: string          // "Raisonnement..."
      }
    ],
    summary: string,               // "Résumé en 3-4 phrases..."
    transcript_excerpt?: string    // First 500 chars (video only)
  },
  error?: string  // If success=false
}
```

### Frontend State (React)

```typescript
// Home.jsx
const [activeTab, setActiveTab] = useState<'text' | 'video' | 'image'>('text')
const [text, setText] = useState<string>('')
const [file, setFile] = useState<File | null>(null)
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)

// ReportDeep.jsx (via useLocation)
const { report, input } = location.state?.report || {}
const scores = {
  propaganda: report?.propaganda_score || 0,
  conspiracy: report?.conspiracy_score || 0,
  misinfo: report?.misinfo_score || 0,
  overall: report?.overall_risk || 0
}
```

---

## 🔐 Variables d'Environnement

### Backend (`api/.env`)

```bash
OPENAI_API_KEY=sk-...           # Required: OpenAI API key
PORT=8000                       # Optional: Server port (default: 8000)
DEEP_ANALYSIS_ENABLED=true      # Optional: Enable deep analysis (default: true)
```

### Frontend (`web/.env.local`)

```bash
VITE_API_URL=http://localhost:8000  # Required: Backend API URL
```

### Production (Railway)

```bash
OPENAI_API_KEY=sk-...           # Set via Railway dashboard
PORT=8080                       # Auto-set by Railway
```

### Production (Vercel)

```bash
VITE_API_URL=https://infoveriforg-production.up.railway.app  # Set via Vercel dashboard
```

---

## 🚀 Build & Deploy

### Backend (Railway)

**Build** :
```bash
# Nixpacks détecte requirements-lite.txt
cd api
pip install -r requirements-lite.txt
```

**Start** :
```bash
cd api
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
```

### Frontend (Vercel)

**Build** :
```bash
cd web
npm install
npm run build  # Output: dist/
```

**Serve** :
```bash
# Vercel serves dist/ automatically
```

---

## 📝 Scripts Utilitaires

### Backend

```bash
# Développement local
cd api
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Tests (TODO)
pytest tests/ -v

# Linter (TODO)
flake8 api/ --max-line-length=120
```

### Frontend

```bash
# Développement local
cd web
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Tests (TODO)
npm run test

# Linter
npm run lint
```

---

## 🧹 Fichiers Ignorés (.gitignore)

```bash
# Python
__pycache__/
*.py[cod]
venv/
.env

# Node
node_modules/
dist/
.env.local

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

---

## 📚 Documentation Externe

### API Swagger

Disponible sur : `http://localhost:8000/docs`

**Features** :
- Documentation interactive
- Test endpoints directement
- Schémas de données
- Exemples de requêtes/réponses

### Storybook (TODO Phase 2)

Documentation composants React :
```bash
cd web
npm run storybook
```

---

## 🤝 Contribution

Pour contribuer au projet, consultez [CONTRIBUTING.md](./CONTRIBUTING.md).

**Quick links** :
- [Issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
- [Pull Requests](https://github.com/GenerativSchool-Lab/infoverif.org/pulls)
- [Discussions](https://github.com/GenerativSchool-Lab/infoverif.org/discussions)

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026  
**Contact** : contact@generativschool.com

---

_Un projet du Civic Tech AI Lab — [GenerativSchool.com](https://generativschool.com)_
