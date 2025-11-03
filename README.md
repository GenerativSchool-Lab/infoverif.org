# InfoVerif.org 🛡️

**Analyse de propagande, désinformation et manipulation médiatique basée sur l'IA**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤-green.svg)](https://github.com/GenerativSchool-Lab/infoverif.org)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://react.dev)

---

## 📢 À Propos

**InfoVerif** est un projet **open source** développé par le **[Civic Tech AI Lab](https://generativschool.com)** — GenerativSchool. Notre mission est de démocratiser l'accès aux outils d'analyse de contenu médiatique pour identifier les techniques de persuasion, la propagande, les théories du complot et la désinformation.

### 🎯 Mission

Fournir un outil **transparent, éducatif et accessible** pour :
- 🔍 Analyser les techniques de manipulation médiatique et persuasion
- 🧠 Détecter les marqueurs de propagande et de conspiration
- 📊 Évaluer le risque de désinformation dans les contenus
- 🎓 Éduquer le public sur les mécanismes de manipulation
- 🛡️ Renforcer l'esprit critique et la littératie médiatique

### 🌟 Valeurs Fondamentales

- **Transparence** : Code open source, méthodologie documentée, explications détaillées
- **Éthique** : Pas de stockage permanent, pas de profilage utilisateur, traitement éphémère
- **Éducation** : Outil pédagogique avec justifications explicables pour chaque détection
- **Collaboration** : Communauté ouverte, contributions bienvenues (chercheurs, fact-checkers, éducateurs)
- **Nuance** : Reconnaissance des limitations, contexte culturel, humour et satire

---

## 🚀 Fonctionnalités

### 🎯 **NOUVEAU: DIMA M2.2 — Semantic Embeddings Layer (Nov 2025)**

InfoVerif intègre désormais la **taxonomie DIMA (M82 Project)** avec **130 techniques de manipulation** documentées académiquement, combinant :

- 🧠 **Vector Similarity Search** : FAISS + sentence-transformers (470MB model)
- 💬 **GPT-4o-mini Hybrid Analysis** : Embeddings hints + enhanced prompts
- 🎨 **JSON Schema Enhanced** : DIMA codes (`[TE-XX]`) et familles pour chaque technique
- ⚡ **Production Performance** : +100ms latency, +50% detection improvement

**Architecture**:
```
Text/Video/Image → Whisper/Vision → FAISS Similarity (Top-5) → GPT-4 + Hints → DIMA Codes
```

**Voir** : [DIMA_Semantic_RFC.md](docs/DIMA_Semantic_RFC.md) | [M2.2 Performance Report](docs/DIMA_M2.2_Performance_Report.md) | [CHANGELOG.md](CHANGELOG.md)

---

### ✅ Analyse Multi-Formats

**Trois modes d'entrée** :

1. **📝 Texte** : Analyse directe de posts, articles, messages, scripts
   - Collez ou écrivez directement dans l'interface
   - Analyse sémantique contextuelle instantanée

2. **🎥 Vidéo** : Upload de fichiers vidéo (MP4, MOV, AVI)
   - Extraction audio automatique (FFmpeg)
   - Transcription via Whisper API (OpenAI)
   - Analyse du contenu transcrit

3. **📸 Image/Screenshot** : Captures de posts sociaux (PNG, JPG, WEBP)
   - Extraction de texte via Vision API (OpenAI)
   - Support pour captures Twitter/X, TikTok, Instagram, Facebook
   - Analyse du texte extrait

### 🎯 Détection Avancée (20+ Techniques)

#### 🎭 Intensité Persuasive (9+ catégories)
- **Manipulation émotionnelle** : Peur, colère, indignation, urgence artificielle
- **Cadrage dichotomique** : "Eux vs nous", désignation de boucs émissaires
- **Langage chargé** : Mots sensationnalistes, déshumanisation, charge émotionnelle
- **Sélection partielle** : Cherry-picking, omission d'informations cruciales
- **Appel à l'autorité** : Citations sans preuves, faux experts
- **Généralisation abusive** : Stéréotypes, sur-simplification
- **Faux dilemmes** : Pensée binaire, élimination de nuances
- **Déformation/exagération** : Catastrophisme, amplification
- **Répétition** : Martèlement de messages clés

#### 🔮 Narratif Spéculatif (7+ indicateurs)
- **Vérité cachée** : Narratives de révélation, "ce qu'on ne vous dit pas"
- **Défiance institutionnelle** : Méfiance envers experts, médias mainstream, institutions
- **Patterns dans le bruit** : Recherche de coïncidences, surinterprétation
- **Affirmations infalsifiables** : Théories impossibles à réfuter
- **Rhétorique "ils"** : "Ils ne veulent pas que tu saches", élites secrètes
- **Causalité simpliste** : Explication simple pour phénomènes complexes
- **Appel au "bon sens"** : Opposition sens commun vs expertise

#### ❌ Fiabilité Factuelle (7+ types)
- **Affirmations non sourcées** : Faits présentés sans références vérifiables
- **Sophismes logiques** : Erreurs de raisonnement identifiables
- **Information hors contexte** : Citations tronquées, statistiques décontextualisées
- **Statistiques trompeuses** : Manipulation de chiffres, corrélation ≠ causalité
- **Confusion corrélation/causalité** : Lien de cause à effet non prouvé
- **Omission d'informations** : Faits importants volontairement ignorés
- **Fausses équivalences** : Comparaisons inappropriées

### 📊 Scores Quantifiés & Terminologie Académique

**Scores normalisés [0-100]** avec terminologie nuancée :

- **Φ_influence (Indice d'influence global)** : Score composite du risque d'influence manipulatoire
- **I_p (Intensité persuasive)** : Niveau de techniques persuasives détectées (frontend : "Intensité persuasive")
- **N_s (Narratif spéculatif)** : Présence de marqueurs conspirationnistes (frontend : "Narratif spéculatif")
- **F_f (Fiabilité factuelle)** : Niveau de désinformation et manipulations factuelles (frontend : "Fiabilité factuelle")

**Formulation mathématique actuelle (MVP)** :

```
I_p = α₁·manipulation_émotionnelle + α₂·cadrage_dichotomique + α₃·charge_lexicale + α₄·appel_autorité + ...

N_s = β₁·défiance_institutionnelle + β₂·causalité_simpliste + β₃·vérité_cachée + β₄·rhétorique_complotiste + ...

F_f = γ₁·absence_sources + γ₂·sophismes_logiques + γ₃·cherry_picking + γ₄·hors_contexte + ...

Φ_influence = (I_p + N_s + F_f) / 3 · λ_contexte
```

où α, β, γ ∈ [0,1] sont calibrés par modèles de langage avec prompt structuré, et λ ajuste selon le contexte détecté.

### 🇫🇷 Analyse Détaillée en Français

Pour chaque contenu analysé, vous recevez :

1. **Scores normalisés** : Visualisation claire avec barres de progression
2. **Techniques détectées** :
   - Nom de la technique en français
   - Citation exacte du contenu (evidence)
   - Niveau de sévérité (élevé/moyen/faible)
   - Explication détaillée (2-3 phrases) de comment la technique est utilisée
3. **Affirmations analysées** :
   - Affirmation textuelle extraite
   - Niveau de confiance (supportée/non supportée/trompeuse)
   - Liste des problèmes identifiés
   - Raisonnement du jugement
4. **Résumé global** : Analyse en 3-4 phrases de l'impact sur l'audience
5. **Extrait de transcription** : Pour vidéos, aperçu du contenu transcrit

---

## 🛠️ Stack Technique

### Backend (FastAPI + OpenAI)

**Framework & API** :
- **FastAPI** 0.115+ : API REST performante avec validation Pydantic
- **Python** 3.11+ : Langage backend
- **Uvicorn** : Serveur ASGI haute performance

**IA & Traitement** :
- **OpenAI GPT-4o-mini** : Analyse sémantique, détection de patterns, génération d'explications
- **Whisper API** : Transcription audio de haute qualité pour vidéos
- **Vision API** : Extraction de texte depuis screenshots et images
- **FFmpeg** : Extraction audio depuis fichiers vidéo
- **python-multipart** : Support upload de fichiers

**Déploiement** :
- **Railway** : Hébergement backend avec auto-deploy Git
- **Nixpacks** : Build system (configuration via `nixpacks.toml`)

**Dépendances clés** :
```
fastapi==0.115.6
openai==1.12.0
httpx<0.28  # Compatibilité OpenAI SDK
python-dotenv==1.0.1
python-multipart==0.0.20
ffmpeg-python==0.2.0
pydantic==2.10.5
```

### Frontend (React + Vite)

**Framework & Build** :
- **React** 18+ : Bibliothèque UI moderne
- **Vite** : Build tool ultra-rapide
- **React Router** : Navigation SPA

**UI & Styling** :
- **Tailwind CSS** : Design system utility-first
- **Thème noir & blanc** : Design minimaliste et élégant
- **KaTeX** : Rendu de formules mathématiques (via `Equation` component)

**HTTP & State** :
- **Axios** : Client HTTP pour API calls
- **React Hooks** : State management (useState, useEffect, useLocation)

**Déploiement** :
- **Vercel** : Hébergement frontend avec auto-deploy Git
- **Variable d'environnement** : `VITE_API_URL` pour configuration API endpoint

---

## 📈 Roadmap Détaillée

### 🎯 Phase 1 : MVP Fonctionnel ✅ (Actuel — Q1 2026)

**Objectif** : Déployer un outil d'analyse fonctionnel et accessible

- [x] **Interface utilisateur intuitive**
  - Trois onglets (Texte, Vidéo, Capture)
  - Upload drag-and-drop pour fichiers
  - Design noir & blanc moderne

- [x] **Analyse multi-formats**
  - Texte direct (textarea)
  - Vidéo upload + transcription Whisper
  - Image upload + extraction Vision API

- [x] **Détection de 20+ techniques**
  - 9+ techniques persuasives
  - 7+ marqueurs conspirationnistes
  - 7+ patterns de désinformation

- [x] **Explications détaillées en français**
  - Citations exactes (evidence)
  - Niveaux de sévérité
  - Raisonnement pour chaque détection

- [x] **Déploiement production**
  - Backend sur Railway (auto-deploy Git)
  - Frontend sur Vercel (auto-deploy Git)
  - Health checks et monitoring

### 🔬 Phase 2 : Fine-tuning & Modèles Spécialisés (Q2 2026)

**Objectif** : Améliorer précision via modèles dédiés et bases de connaissances

#### Modèles Fine-tuned
- [ ] **Classifier de propagande** : Fine-tuning BERT/RoBERTa sur corpus annoté
  - Dataset : 10K+ exemples de techniques persuasives
  - Taxonomie : 100+ variantes de techniques
  - Métriques : Précision, Recall, F1-score par catégorie

- [ ] **Détecteur de narratifs spéculatifs** : Modèle spécialisé théories du complot
  - Dataset : Corpus annoté de narratifs complotistes
  - Features : Marqueurs linguistiques, structures rhétoriques
  - Calibration : Réduction des faux positifs (satire, humour)

- [ ] **Fallacy Detector** : Classifier de sophismes logiques
  - Dataset : Base de sophismes catégorisés (ad hominem, strawman, slippery slope, etc.)
  - Architecture : Multi-label classification
  - Explainability : Extraction de spans pertinents

#### Embeddings & Vector Database
- [ ] **Vector DB des patterns connus** : ChromaDB ou Pinecone
  - Indexation : Embeddings de techniques de manipulation connues
  - Recherche sémantique : Similarité cosine pour matching
  - Clustering : Regroupement de narratifs récurrents

- [ ] **Amélioration de l'indice d'influence** :
```
e⃗_c = BERT_fine-tuned(content)
sim(e⃗_c, e⃗_k) = (e⃗_c · e⃗_k) / (||e⃗_c|| ||e⃗_k||)
Φ_influence^v2 = ω₁·Φ_LLM + ω₂·max_k(sim(e⃗_c, e⃗_k)) + ω₃·classifier_BERT(e⃗_c)
```
où ω₁ + ω₂ + ω₃ = 1

#### Corpus Multilingue
- [ ] **Extension langues** : Anglais, arabe, espagnol
- [ ] **Adaptation culturelle** : Techniques spécifiques par région
- [ ] **Cross-lingual embeddings** : Multilingual-BERT pour transfert

### 🤖 Phase 3 : Agent Autonome & Monitoring (Q3-Q4 2026)

**Objectif** : Détection proactive et analyse de réseaux de propagation

#### Scan Automatisé de Plateformes
- [ ] **Monitoring continu** :
  - APIs YouTube Data, TikTok, Twitter/X
  - Scraping intelligent avec rate limiting
  - Détection de contenus à haut Φ_influence

- [ ] **Alertes en temps réel** :
  - Webhooks pour chercheurs/fact-checkers
  - Dashboard analytics avec visualisations
  - Export CSV/JSON des résultats

#### Analyse de Réseaux Sociaux
- [ ] **Graph Database** : Neo4j pour modélisation de réseaux
```
G = (V, E, W)
où V = comptes, E = partages/citations, W = poids d'influence
```

- [ ] **Détection de coordinated inauthentic behavior** :
  - Analyse temporelle : Pics d'activité synchronisés
  - Analyse structurelle : Clusters de comptes liés
  - Features : Timing, contenu similaire, patterns de réponse

- [ ] **PageRank d'influence** :
```
PageRank(v_i) = (1-d) + d·Σ(PageRank(v_j) / |out(v_j)|)
Ψ_propagation = Σ(Φ_influence(v) · PageRank(v) · reach(v))
```

#### API Publique pour Chercheurs
- [ ] **RESTful API** : Endpoints documentés (OpenAPI/Swagger)
- [ ] **Rate limiting** : Quotas par utilisateur/organisation
- [ ] **Webhooks** : Notifications événements critiques
- [ ] **Batch processing** : Analyse en masse pour recherche

### 🎭 Phase 4 : Détection Multimodale Avancée (Q4 2026)

**Objectif** : Deepfakes, manipulation vidéo, ingérence coordonnée

#### Détection de Deepfakes
- [ ] **Vision Transformers** : Analyse temporelle frame-by-frame
- [ ] **Audio forensics** : Détection d'artefacts audio synthétiques
- [ ] **Synchronisation audio-visuelle** : Vérification cohérence lèvres/voix
- [ ] **Artefacts visuels** : Détection de blurring, warping, inconsistances

#### Analyse Vidéo Avancée
- [ ] **Détection de montage manipulatoire** :
  - Densité de cuts suspects
  - Transitions rapides pour désorientation
  - Juxtaposition trompeuse (recontextualisation)

- [ ] **Extraction d'éléments visuels** :
  - Détection de logos, symboles, textes incrustés
  - Reconnaissance de QR codes et liens
  - Analyse de métadonnées vidéo (EXIF, modifications)

#### Détecteur d'Ingérence Étrangère
- [ ] **Analyse de provenance** :
  - Géolocalisation de sources
  - Détection de fermes de trolls (IP clustering, timing patterns)
  - Identification de campagnes coordonnées multi-plateformes

- [ ] **Patterns temporels suspects** :
  - Pics d'activité nocturnes (fuseaux horaires)
  - Coordination de messages identiques
  - Amplification artificielle (bots, comptes inauthentiques)

### 🌍 Phase 5 : Plateforme Communautaire & Éducation (2026+)

**Objectif** : Écosystème collaboratif et ressources éducatives

#### Contributions Communautaires
- [ ] **Annotations collaboratives** :
  - Interface web pour annoter contenus
  - Validation par consensus (crowdsourcing)
  - Gamification (points, badges)

- [ ] **Taxonomie ouverte** :
  - Wiki de techniques de manipulation
  - Exemples annotés par catégorie
  - Versioning et peer review

- [ ] **API publique** :
  - Intégrations tierces (plugins navigateurs, extensions fact-checking)
  - Widgets embeddables pour sites média
  - SDKs pour langages populaires (Python, JavaScript, R)

#### Ressources Éducatives
- [ ] **Bibliothèque de cas d'étude** :
  - Analyses détaillées de campagnes historiques
  - Déconstruction de techniques célèbres
  - Matériel pédagogique pour enseignants

- [ ] **Tutoriels interactifs** :
  - Formation à la littératie médiatique
  - Exercices de détection de manipulation
  - Quiz et évaluations

- [ ] **Formation professionnelle** :
  - Cours pour journalistes
  - Workshops pour fact-checkers
  - Séminaires pour éducateurs

#### Partenariats Institutionnels
- [ ] **Fact-checkers** : Intégration avec AFP Factuel, Reuters Fact Check, Snopes
- [ ] **Universités** : Collaborations recherche (datasets, méthodologies, publications)
- [ ] **Médias** : Outils pour salles de rédaction (vérification en temps réel)
- [ ] **ONG** : Organisations de littératie médiatique et démocratie

---

## 🚀 Installation & Déploiement

### Prérequis

**Backend** :
- Python 3.11+
- FFmpeg (pour extraction audio)
- Clé API OpenAI (GPT-4o-mini, Whisper, Vision)

**Frontend** :
- Node.js 18+
- npm ou yarn

### Développement Local

#### 1. Backend (FastAPI)

```bash
# Cloner le repo
git clone https://github.com/GenerativSchool-Lab/infoverif.org.git
cd infoverif.org

# Installer FFmpeg (macOS)
brew install ffmpeg

# Installer FFmpeg (Ubuntu/Debian)
sudo apt update && sudo apt install -y ffmpeg

# Créer environnement virtuel
cd api
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements-lite.txt

# Créer fichier .env
cat > .env << EOF
OPENAI_API_KEY=sk-your-key-here
PORT=8000
EOF

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

Backend accessible sur : `http://localhost:8000`
Documentation API : `http://localhost:8000/docs`

#### 2. Frontend (React + Vite)

```bash
# Dans un nouveau terminal
cd web

# Installer dépendances
npm install

# Créer fichier .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000
EOF

# Lancer le serveur de développement
npm run dev
```

Frontend accessible sur : `http://localhost:5173`

### Tests Locaux

#### Backend

```bash
# Health check
curl http://localhost:8000/health

# Test OpenAI connectivity
curl http://localhost:8000/test-openai

# Analyse de texte
curl -X POST http://localhost:8000/analyze-text \
  -F 'text=Ce gouvernement nous ment ! Ils cachent la vérité !' \
  -F 'platform=text' | jq .

# Analyse de vidéo
curl -X POST http://localhost:8000/analyze-video \
  -F 'video=@/path/to/video.mp4' \
  -F 'platform=youtube' | jq .

# Analyse d'image
curl -X POST http://localhost:8000/analyze-image \
  -F 'image=@/path/to/screenshot.png' \
  -F 'platform=twitter' | jq .
```

#### Frontend

Ouvrez `http://localhost:5173` et testez les trois onglets :
- **Texte** : Collez un texte et cliquez "Lancer l'analyse"
- **Vidéo** : Uploadez un fichier MP4 (< 60 Mo)
- **Capture** : Uploadez une capture PNG/JPG

### Déploiement Production

#### Backend (Railway)

**Option 1 : Auto-deploy Git (recommandé)**

```bash
# Pousser vers main déclenche auto-deploy
git add .
git commit -m "feat: deploy to production"
git push origin main
```

Railway détecte automatiquement `nixpacks.toml` et build/deploy.

**Configuration Railway** :
1. Créer un nouveau projet
2. Connecter le repo GitHub
3. Sélectionner le service `infoverif.org`
4. Ajouter les variables d'environnement :
   ```
   OPENAI_API_KEY=sk-your-key-here
   PORT=8080
   ```
5. Activer auto-deploy sur push

**Option 2 : Railway CLI**

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Lier au projet
railway link

# Deploy
railway up --detach
```

#### Frontend (Vercel)

**Option 1 : Auto-deploy Git (recommandé)**

```bash
# Pousser vers main déclenche auto-deploy
git push origin main
```

**Configuration Vercel** :
1. Importer le projet depuis GitHub
2. Root Directory : `web`
3. Build Command : `npm run build`
4. Output Directory : `dist`
5. Ajouter variable d'environnement :
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

**Option 2 : Vercel CLI**

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Lier au projet
cd web
vercel link

# Deploy en production
vercel --prod
```

### Variables d'Environnement

#### Backend (`/api/.env`)

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `OPENAI_API_KEY` | Clé API OpenAI | `sk-...` | ✅ |
| `PORT` | Port du serveur | `8000` (local), `8080` (Railway) | ✅ |
| `DEEP_ANALYSIS_ENABLED` | Activer analyse deep | `true` | ❌ (default: true) |

#### Frontend (`/web/.env.local` ou Vercel)

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `VITE_API_URL` | URL du backend | `https://backend.railway.app` | ✅ |

---

## 📊 Architecture Technique Détaillée

### Flux de Données

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                   │
│  ┌──────────────┬─────────────────┬─────────────────────┐  │
│  │   Text Tab   │   Video Tab     │   Screenshot Tab    │  │
│  │  (textarea)  │  (drag&drop)    │   (drag&drop)       │  │
│  └──────┬───────┴────────┬────────┴──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼─────────────┘
          │                │                   │
          │ POST           │ POST              │ POST
          │ /analyze-text  │ /analyze-video    │ /analyze-image
          │ (text)         │ (multipart/file)  │ (multipart/file)
          │                │                   │
┌─────────▼────────────────▼───────────────────▼─────────────┐
│              FASTAPI BACKEND (Python 3.11)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /analyze-text                                       │  │
│  │    → validate input                                  │  │
│  │    → analyze_text(text) → analyze_with_gpt4()       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  /analyze-video                                      │  │
│  │    → save temp file                                  │  │
│  │    → extract_audio_from_file() [FFmpeg]             │  │
│  │    → transcribe_audio() [Whisper API]               │  │
│  │    → analyze_with_gpt4(transcript)                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  /analyze-image                                      │  │
│  │    → save temp file                                  │  │
│  │    → analyze_image() [Vision API]                   │  │
│  │    → analyze_with_gpt4(extracted_text)              │  │
│  └─────────────────────┬────────────────────────────────┘  │
└────────────────────────┼───────────────────────────────────┘
                         │
                         │ OpenAI API Calls
                         │
┌────────────────────────▼───────────────────────────────────┐
│                   OPENAI APIS                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GPT-4o-mini (gpt-4o-mini)                           │  │
│  │    • System prompt: Expert en manipulation           │  │
│  │    • User prompt: ANALYSIS_PROMPT.format(...)        │  │
│  │    • response_format: {"type": "json_object"}        │  │
│  │    • temperature: 0 (déterministe)                   │  │
│  │                                                       │  │
│  │  Analyse 20+ techniques :                            │  │
│  │    ├─ Intensité persuasive (9+ catégories)          │  │
│  │    ├─ Narratif spéculatif (7+ indicateurs)          │  │
│  │    └─ Fiabilité factuelle (7+ types)                │  │
│  │                                                       │  │
│  │  Retour JSON structuré :                             │  │
│  │    {                                                 │  │
│  │      propaganda_score: 0-100,                        │  │
│  │      conspiracy_score: 0-100,                        │  │
│  │      misinfo_score: 0-100,                           │  │
│  │      overall_risk: 0-100,                            │  │
│  │      techniques: [{name, evidence, severity, ...}], │  │
│  │      claims: [{claim, confidence, issues, ...}],     │  │
│  │      summary: "..."                                  │  │
│  │    }                                                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Whisper API (whisper-1)                             │  │
│  │    • Transcription audio → texte (français auto)     │  │
│  │    • Format: MP3, WAV, M4A                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Vision API (gpt-4o-mini)                            │  │
│  │    • Extraction texte depuis image                   │  │
│  │    • Prompt: "Extract all text from this image"      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ JSON Response
                         │
┌────────────────────────▼───────────────────────────────────┐
│                BACKEND RESPONSE                             │
│  {                                                          │
│    success: true,                                           │
│    input: {url?, platform?, title?, description?},          │
│    report: {                                                │
│      propaganda_score: int,                                 │
│      conspiracy_score: int,                                 │
│      misinfo_score: int,                                    │
│      overall_risk: int,                                     │
│      techniques: [                                          │
│        {name, evidence, severity, explanation}              │
│      ],                                                     │
│      claims: [                                              │
│        {claim, confidence, issues, reasoning}               │
│      ],                                                     │
│      summary: str,                                          │
│      transcript_excerpt?: str (first 500 chars)             │
│    }                                                        │
│  }                                                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ Axios Response
                         │
┌────────────────────────▼───────────────────────────────────┐
│                 FRONTEND DISPLAY                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ReportDeep.jsx                                      │  │
│  │    ├─ Scores (avec barres de progression)           │  │
│  │    │    • Indice d'influence (overall)               │  │
│  │    │    • Intensité persuasive (propaganda)          │  │
│  │    │    • Narratif spéculatif (conspiracy)           │  │
│  │    │    • Fiabilité factuelle (misinfo)              │  │
│  │    ├─ Techniques détectées                           │  │
│  │    │    • Nom, evidence, sévérité, explication       │  │
│  │    ├─ Affirmations analysées                         │  │
│  │    │    • Claim, confidence, issues, reasoning       │  │
│  │    └─ Résumé + Métadonnées                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Structure des Fichiers

```
infoverif.org/
├── api/                           # Backend FastAPI
│   ├── main.py                    # Application principale, routes
│   ├── deep.py                    # Logique analyse OpenAI
│   ├── claims.py                  # Validation claims (legacy)
│   ├── requirements-lite.txt      # Dépendances Python
│   ├── .env                       # Variables d'environnement (gitignored)
│   └── runtime.txt                # Version Python pour Railway
│
├── web/                           # Frontend React
│   ├── src/
│   │   ├── App.jsx                # Router principal
│   │   ├── main.jsx               # Entry point
│   │   ├── components/
│   │   │   └── Equation.jsx       # Rendu formules LaTeX (KaTeX)
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Page d'accueil (3 tabs)
│   │   │   ├── ReportDeep.jsx     # Affichage résultats
│   │   │   └── MethodCard.jsx     # Documentation méthodologie
│   │   └── index.css              # Styles Tailwind
│   ├── public/                    # Assets statiques
│   ├── package.json               # Dépendances npm
│   ├── vite.config.js             # Configuration Vite
│   ├── tailwind.config.js         # Configuration Tailwind
│   └── .env.local                 # Variables d'environnement (gitignored)
│
├── nixpacks.toml                  # Configuration Railway build
├── README.md                      # Ce fichier
├── LICENSE                        # MIT License
└── .gitignore                     # Fichiers ignorés par Git
```

---

## 🔬 Méthodologie Scientifique

### Fondements Académiques

Notre taxonomie s'appuie sur des recherches en :
- **Communication** : Théories de la persuasion (Cialdini, Pratkanis & Aronson)
- **Psychologie sociale** : Biais cognitifs, influence sociale (Kahneman, Tversky)
- **Études médiatiques** : Propagande, désinformation (Chomsky, Herman, Wardle & Derakhshan)
- **Logique** : Sophismes et fallacies (Aristotle, Hamblin, Walton)

### Taxonomie Détaillée

#### 1. Intensité Persuasive (I_p)

**1.1 Manipulation émotionnelle**
- **Peur** : "Ils vont tous vous remplacer !", catastrophisme
- **Colère** : Indignation artificielle, scandale monté
- **Urgence** : "Partagez avant censure !", fausse deadline

**1.2 Cadrage dichotomique**
- **"Eux vs nous"** : Polarisation identitaire
- **Bouc émissaire** : Désignation d'un groupe responsable
- **In-group favoritism** : Valorisation exclusive du groupe

**1.3 Langage chargé**
- **Mots sensationnalistes** : "Choquant", "scandaleux", "incroyable"
- **Déshumanisation** : "Parasite", "vermine", "envahisseurs"
- **Euphémismes** : Minimisation d'actes graves

**1.4 Sélection partielle**
- **Cherry-picking** : Sélection de données favorables uniquement
- **Omission** : Faits importants ignorés volontairement
- **Décontextualisation** : Citation tronquée

**1.5 Appel à l'autorité**
- **Faux experts** : Expertise non pertinente
- **Citation sans source** : "Des études montrent..."
- **Argument d'autorité** : "X a dit donc c'est vrai" (sans logique)

**1.6 Généralisation abusive**
- **Stéréotypes** : "Tous les X sont Y"
- **Sur-simplification** : Phénomène complexe réduit à une cause
- **Anecdote → règle générale** : "Mon cousin a vu donc c'est systématique"

**1.7 Faux dilemmes**
- **Pensée binaire** : "Soit tu es avec nous, soit contre nous"
- **Élimination de nuances** : Exclusion de solutions intermédiaires
- **Fausse alternative** : Deux options présentées, d'autres ignorées

**1.8 Déformation/exagération**
- **Catastrophisme** : Amplification de risques
- **Strawman** : Caricature de la position adverse
- **Slippery slope** : "Si A alors nécessairement Z"

**1.9 Répétition**
- **Martèlement** : Répétition du message clé (technique Goebbels)
- **Slogans** : Phrases courtes mémorisables
- **Leitmotiv** : Retour cyclique au thème central

#### 2. Narratif Spéculatif (N_s)

**2.1 Vérité cachée**
- **"Ce qu'on ne vous dit pas"** : Information supposément censurée
- **Révélation** : "La vérité enfin dévoilée"
- **Secret d'État** : Gouvernement cache des faits

**2.2 Défiance institutionnelle**
- **Anti-expertise** : Méfiance envers scientifiques, médecins
- **Médias mainstream** : "Médias aux ordres", "propagande officielle"
- **Institutions corrompues** : Gouvernement, ONU, UE présentés comme malveillants

**2.3 Patterns dans le bruit**
- **Coïncidences** : Recherche de liens inexistants
- **Numérologie** : Dates, chiffres supposément significatifs
- **Symbolisme** : Interprétation sur-analytique de logos, gestes

**2.4 Affirmations infalsifiables**
- **Théories non testables** : "On ne peut pas prouver le contraire"
- **Déplacement de la charge de preuve** : "Prouvez que c'est faux"
- **Immunisation** : Toute réfutation = preuve du complot

**2.5 Rhétorique "ils"**
- **Élites secrètes** : "Ils", "les globalistes", "le système"
- **Intention cachée** : "Ils veulent nous contrôler"
- **Plan orchestré** : Événements aléatoires = stratégie coordonnée

**2.6 Causalité simpliste**
- **Cui bono?** : "À qui profite le crime ?" comme preuve
- **Post hoc ergo propter hoc** : A avant B donc A cause B
- **Monocausalité** : Une seule cause pour phénomène complexe

**2.7 Appel au "bon sens"**
- **"Réfléchissez par vous-même"** : Opposition sens commun vs expertise
- **Intuition > science** : "Ça paraît évident"
- **"Questions légitimes"** : Questions rhétoriques insinuantes

#### 3. Fiabilité Factuelle (F_f)

**3.1 Affirmations non sourcées**
- **"Des études"** : Sans référence vérifiable
- **"On sait que"** : Consensus imaginaire
- **Chiffres sans source** : Statistiques inventées ou déformées

**3.2 Sophismes logiques**
- **Ad hominem** : Attaque personnelle au lieu d'argument
- **Red herring** : Diversion hors sujet
- **Tu quoque** : "Toi aussi tu le fais"
- **Appeal to nature** : "Naturel donc bon"
- **Begging the question** : Conclusion dans les prémisses

**3.3 Information hors contexte**
- **Citation tronquée** : Phrase sortie du contexte
- **Statistique décontextualisée** : Chiffre sans comparaison pertinente
- **Image détournée** : Photo d'un autre événement

**3.4 Statistiques trompeuses**
- **Pourcentages trompeurs** : Base non précisée
- **Moyennes trompeuses** : Écrasement de la variance
- **Graphiques manipulés** : Axes tronqués, échelles biaisées

**3.5 Confusion corrélation/causalité**
- **Corrélation présentée comme causalité** : A et B simultanés ≠ A cause B
- **Variable confondante ignorée** : C cause A et B
- **Causalité inversée** : B cause A, pas A cause B

**3.6 Omission d'informations**
- **Sélectivité** : Faits contradictoires ignorés
- **Incompletude** : Histoire racontée partiellement
- **Context collapse** : Nuances éliminées

**3.7 Fausses équivalences**
- **Comparaison inappropriée** : "X c'est comme le nazisme"
- **Équivalence morale** : Deux actes de gravité différente présentés comme équivalents
- **Analogie défaillante** : Comparaison sur critères non pertinents

### Calibration & Validation

**Méthode actuelle (MVP)** :
- Prompts structurés avec exemples (few-shot learning)
- Température = 0 pour déterminisme
- JSON schema strict pour cohérence des outputs
- Validation manuelle sur échantillon de tests

**Méthode future (Phase 2)** :
- Fine-tuning sur dataset annoté par experts
- Validation croisée (k-fold cross-validation)
- Métriques : Precision, Recall, F1-score par catégorie
- Inter-annotator agreement (Kappa de Cohen) pour dataset
- A/B testing avec utilisateurs

### Limitations Reconnues

⚠️ **Cet outil est une aide à l'analyse, pas un verdict absolu**

**Limitations techniques** :
- **Faux positifs** : Contexte culturel, humour, satire peuvent déclencher détections
- **Faux négatifs** : Manipulation subtile peut échapper à l'analyse
- **Biais du modèle** : GPT-4 a ses propres biais (anglocentrisme, biais temporels)
- **Sensibilité au prompt** : Formulation du prompt influence les résultats

**Limitations conceptuelles** :
- **Subjectivité** : "Propagande" vs "communication persuasive" = continuum, pas binaire
- **Contexte crucial** : Même technique peut être légitime ou manipulatoire selon contexte
- **Évolution des techniques** : Nouvelles stratégies de manipulation émergent constamment
- **Multimodalité** : Analyse actuelle principalement textuelle (vidéo = transcription)

**Limitations éthiques** :
- **Risque de censure** : Outil peut être détourné pour censurer opinions légitimes
- **Polarisation** : Scores peuvent renforcer confirmation bias
- **Simplification** : Réduction d'un discours complexe à des chiffres
- **Déresponsabilisation** : Ne remplace pas l'esprit critique humain

**Notre engagement** :
- 📖 **Transparence totale** : Code open source, méthodologie documentée
- 🔬 **Amélioration continue** : Intégration feedback utilisateurs, fine-tuning
- 🎓 **Éducation** : Explications détaillées, pas juste des scores
- 🤝 **Collaboration** : Dialogue avec chercheurs, fact-checkers, communauté

---

## 🤝 Contribuer au Projet

**InfoVerif** est un projet **communautaire**. Nous accueillons toutes les contributions !

### 🌟 Domaines de Contribution

#### 1. Code & Features

**Backend** :
- [ ] Amélioration des prompts d'analyse
- [ ] Ajout de nouveaux endpoints (ex: `/analyze-batch`)
- [ ] Optimisation des performances (caching, async)
- [ ] Support de nouveaux formats (PDF, audio MP3)
- [ ] Tests unitaires et intégration

**Frontend** :
- [ ] Amélioration de l'UI/UX
- [ ] Visualisations interactives (graphes, timelines)
- [ ] Mode sombre/clair (actuellement noir & blanc uniquement)
- [ ] Internationalisation (i18n) pour multilingue
- [ ] Accessibilité (WCAG compliance)

**Infrastructure** :
- [ ] Migration vers GPU pour fine-tuning
- [ ] Vector database (ChromaDB, Pinecone)
- [ ] Graph database (Neo4j) pour réseaux
- [ ] CI/CD automatisé (GitHub Actions)
- [ ] Monitoring et alertes (Sentry, Prometheus)

#### 2. Données & Annotations

**Datasets** :
- [ ] Corpus annoté de propagande (français, anglais, arabe)
- [ ] Taxonomie étendue de techniques (100+ variantes)
- [ ] Cas d'étude historiques (campagnes, élections)
- [ ] Exemples de deepfakes et manipulations vidéo

**Annotations** :
- [ ] Labelling de contenus avec techniques détectées
- [ ] Validation croisée (inter-annotator agreement)
- [ ] Calibration de sévérité (low/medium/high)

#### 3. Documentation & Traductions

**Documentation** :
- [ ] Tutoriels pas-à-pas (vidéos, GIFs)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Guides pour chercheurs, journalistes, éducateurs
- [ ] Papers académiques (méthodologie, résultats)

**Traductions** :
- [ ] Interface en anglais
- [ ] Interface en arabe (RTL support)
- [ ] Interface en espagnol
- [ ] Documentation multilingue

#### 4. Recherche & Partenariats

**Collaborations académiques** :
- [ ] Publications scientifiques (ACL, ICWSM, CHI)
- [ ] Datasets partagés (Zenodo, Hugging Face)
- [ ] Workshops et conférences

**Partenariats institutionnels** :
- [ ] Fact-checkers (AFP, Reuters, Bellingcat)
- [ ] Universités (labos de NLP, communication)
- [ ] ONG (littératie médiatique, démocratie)

### 🚀 Comment Contribuer

#### 1. Via GitHub

```bash
# Fork le repo sur GitHub
# Cloner votre fork
git clone https://github.com/VOTRE_USERNAME/infoverif.org.git
cd infoverif.org

# Créer une branche pour votre feature
git checkout -b feature/ma-super-feature

# Faire vos modifications
# ... coder coder coder ...

# Commit avec message descriptif
git add .
git commit -m "feat: ajout support PDF + amélioration extraction texte"

# Push vers votre fork
git push origin feature/ma-super-feature

# Ouvrir une Pull Request sur GitHub
# Décrire vos changements, motivation, tests effectués
```

**Conventions de commit** (Conventional Commits) :
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation uniquement
- `style:` Formatting, pas de changement logique
- `refactor:` Refactoring sans changement fonctionnel
- `test:` Ajout/correction de tests
- `chore:` Maintenance (deps, config)

#### 2. Signalement de Bugs

Ouvrez une issue sur GitHub avec :
- **Description claire** du bug
- **Étapes pour reproduire**
- **Comportement attendu vs observé**
- **Environnement** (OS, navigateur, versions)
- **Screenshots/logs** si pertinent

#### 3. Suggestions de Features

Ouvrez une issue "Feature Request" avec :
- **Use case** : Pourquoi cette feature est utile
- **Proposition** : Comment l'implémenter (si idées)
- **Alternatives** : Autres solutions envisagées

#### 4. Propositions de Datasets

Contactez-nous par email (`contact@generativschool.com`) avec :
- **Description** : Type de données, taille, format
- **Annotations** : Métadonnées, labels
- **Licence** : Open data, académique, propriétaire ?
- **Qualité** : Méthodologie d'annotation, validation

### 📧 Contact & Communauté

- **Email** : contact@generativschool.com
- **GitHub Issues** : [github.com/GenerativSchool-Lab/infoverif.org/issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
- **GitHub Discussions** : Pour questions générales, idées, feedback
- **Twitter/X** : [@GenerativSchool](https://twitter.com/GenerativSchool)

---

## 📜 License & Utilisation

### MIT License

**InfoVerif.org** est sous licence **MIT** (voir [LICENSE](./LICENSE)).

**Vous êtes libre de** :
- ✅ **Utiliser** le code à des fins commerciales
- ✅ **Modifier** et adapter le code à vos besoins
- ✅ **Distribuer** le code original ou modifié
- ✅ **Utiliser** à des fins privées, académiques, ou éducatives

**Sous condition de** :
- 📄 Inclure la **license et le copyright original** dans toutes les copies
- 📄 Indiquer les **modifications apportées** (bonne pratique)

**Pas de garantie** :
- ⚠️ Fourni "tel quel" sans garantie de fonctionnement
- ⚠️ Auteurs non responsables d'usages problématiques

### 🚨 Usages Interdits & Éthique

**Nous nous opposons fermement à** :
- ❌ **Censure autoritaire** : Utilisation par régimes pour supprimer opinions légitimes
- ❌ **Surveillance de masse** : Monitoring de citoyens sans consentement
- ❌ **Répression de dissidents** : Ciblage d'opposants politiques
- ❌ **Manipulation inverse** : Créer de la propagande en inversant l'analyse
- ❌ **Désinformation** : Présenter les scores comme vérité absolue

**Nous encourageons** :
- ✅ **Éducation** : Formation à l'esprit critique et littératie médiatique
- ✅ **Recherche** : Études académiques sur manipulation et désinformation
- ✅ **Fact-checking** : Aide aux journalistes et vérificateurs de faits
- ✅ **Transparence** : Compréhension des mécanismes de persuasion
- ✅ **Démocratie** : Citoyens informés, débat public de qualité

**Notre engagement éthique** :
1. **Pas de stockage permanent** : Analyses éphémères, pas de base de données utilisateurs
2. **Pas de profilage** : Pas de tracking, cookies, ou monétisation de données
3. **Open source** : Code auditable par tous
4. **Explainability** : Explications détaillées, pas juste des scores opaques
5. **Humilité** : Reconnaissance des limitations et biais

---

## 🙏 Remerciements

### Équipe

Développé avec ❤️ par :
- **Soufiane Lemqari** ([@SoufianeLmq](https://twitter.com/SoufianeLmq)) - Lead Developer
- **Civic Tech AI Lab** ([GenerativSchool.com](https://generativschool.com)) - Organisation

### Technologies & Partenaires

**Infrastructures & APIs** :
- [OpenAI](https://openai.com) - GPT-4o-mini, Whisper, Vision APIs
- [Railway](https://railway.app) - Hébergement backend
- [Vercel](https://vercel.com) - Hébergement frontend

**Frameworks & Bibliothèques** :
- [FastAPI](https://fastapi.tiangolo.com) - Tiangolo & contributors
- [React](https://react.dev) - Meta & contributors
- [Vite](https://vitejs.dev) - Evan You & contributors
- [Tailwind CSS](https://tailwindcss.com) - Tailwind Labs
- [FFmpeg](https://ffmpeg.org) - FFmpeg team

**Inspirations académiques** :
- **Robert Cialdini** - _Influence: The Psychology of Persuasion_
- **Noam Chomsky & Edward Herman** - _Manufacturing Consent_
- **Claire Wardle & Hossein Derakhshan** - _Information Disorder_ (Council of Europe)
- **Daniel Kahneman** - _Thinking, Fast and Slow_
- **Alexandra Phelan** - Misinformation & Social Media research

### Communauté

Merci à tous les contributeurs, testeurs, et supporters du projet ! 🙏

- Tous les contributeurs GitHub (actifs et futurs)
- Beta testers et utilisateurs early adopters
- Chercheurs et fact-checkers nous ayant fait des retours
- Communauté open source pour l'inspiration et le soutien

---

## 📚 Ressources Complémentaires

### Documentation Externe

**Fact-checking & Désinformation** :
- [First Draft News](https://firstdraftnews.org) - Ressources fact-checking
- [Bellingcat](https://www.bellingcat.com) - Investigations open source
- [EU DisinfoLab](https://www.disinfo.eu) - Recherche sur désinformation
- [Poynter IFCN](https://www.poynter.org/ifcn/) - International Fact-Checking Network

**Propagande & Manipulation** :
- [Propaganda Critic](http://propagandacritic.com) - Techniques de propagande
- [Logical Fallacies](https://yourlogicalfallacyis.com) - Catalogue de sophismes
- [Media Manipulation Casebook](https://mediamanipulation.org) - Harvard Shorenstein Center

**Littératie Médiatique** :
- [News Literacy Project](https://newslit.org) - Éducation médiatique
- [CLEMI](https://www.clemi.fr) - Éducation aux médias (France)
- [MediaSmarts](https://mediasmarts.ca) - Littératie numérique (Canada)

**Recherche Académique** :
- [arXiv: cs.CL (NLP)](https://arxiv.org/list/cs.CL/recent) - Papers NLP & détection
- [ACL Anthology](https://aclanthology.org) - Computational Linguistics
- [ICWSM](https://icwsm.org) - Social Media research

### Papers Recommandés

**Détection de Propagande** :
- Fine-Grained Analysis of Propaganda in News Articles (Da San Martino et al., 2019)
- SemEval-2020 Task 11: Detection of Propaganda Techniques in News Articles
- Propaganda Detection in News Articles Using Multi-Task Learning

**Détection de Désinformation** :
- LIAR: A Benchmark Dataset for Fake News Detection (Wang, 2017)
- Automatic Detection of Fake News (Pérez-Rosas et al., 2018)
- The Spread of True and False News Online (Vosoughi et al., Science 2018)

**Deepfakes & Manipulation Vidéo** :
- FaceForensics++: Learning to Detect Manipulated Facial Images (Rossler et al., 2019)
- The Deepfake Detection Challenge Dataset (Dolhansky et al., 2020)

---

## 🛡️ InfoVerif : Pour une Information Libre, Transparente et Critique

> _"La démocratie meurt dans l'obscurité. Éclairons les mécanismes de manipulation pour un débat public éclairé."_

**Un projet du Civic Tech AI Lab — [GenerativSchool.com](https://generativschool.com)**

---

**Version** : 1.0.0 (MVP Fonctionnel)  
**Dernière mise à jour** : Janvier 2026  
**License** : MIT  
**Contact** : contact@generativschool.com
