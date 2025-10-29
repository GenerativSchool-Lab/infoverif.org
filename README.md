# InfoVerif — Video Integrity Analysis MVP

Production-deployable MVP that analyzes short videos (YouTube, TikTok, Instagram Reels) and returns transcription, on-screen text, risk score, and related fact-checks.

## Architecture

- **Backend**: FastAPI + RQ workers (Python 3.11) on Railway
- **Frontend**: React (Vite) + Tailwind on Vercel
- **Storage**: Local FS or S3-compatible (MinIO) with 48h purge
- **Vector Search**: FAISS (in-memory) for MVP

## Legal & Ethics

- **YouTube**: Public URL analysis via YouTube Data API (optional) or direct download
- **TikTok/Instagram**: User upload only (.mp4); no scraping in production
- **Auto-purge**: All media and derived data deleted after 48 hours
- **No persistent storage**: Only user-submitted content stored
- See `/method-card` for detailed limitations and false positive warnings

## Quick Start (Direct Deployment)

### Prerequisites
- GitHub account (public repo)
- Railway account (railway.app)
- Railway CLI: `npm i -g @railway/cli`

### Deploy to Railway (No Docker)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/infoverif-org.git
git push -u origin main

# 2. Deploy to Railway
railway login
railway init

# 3. Create services
railway add --plugin redis
railway up --service api
railway up --service worker

# 4. Get your URL
railway domain
```

**See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for complete instructions.**

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)
- Redis (or Docker: `docker run -d -p 6379:6379 redis:7-alpine`)

### Start Backend

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Start Worker (separate terminal)

```bash
cd api
python worker.py
```

### Start Frontend

```bash
cd web
npm install
npm run dev
```

## Deployment

### Railway (Backend)
1. Connect Railway to this repo
2. Set environment variables from `.env.example`
3. Deploy automatically

### Vercel (Frontend)
1. Connect Vercel to `/web` directory
2. Set `VITE_API_URL` to Railway backend URL
3. Deploy

## Directory Structure

```
/api            # FastAPI, workers, tasks, scoring
/web            # React (Vite), Tailwind UI
/ops            # Dockerfiles, Railway Procfile, Vercel config, Makefile
/data           # fact-checks seed JSON
/scripts        # local dev helpers
```

## Environment Variables

See `.env.example` for required variables.

## Limitations

- **No automated scraping**: TikTok/Instagram require manual upload
- **Dev browserless**: Only enabled in dev mode (`ALLOW_DEV_BROWSERLESS=true`), disabled in production
- **48h retention**: All data auto-deleted after 48 hours
- **False positives**: Risk score is heuristic-based, not ML-verified
- **Small fact-check index**: MVP uses local seed data, not production database

## Note Technique : Algorithme et Évolution vers TRL 7

### État Actuel : TRL 5-6 (Technologie Validée)

InfoVerif utilise une architecture multi-modale combinant plusieurs algorithmes de traitement vidéo et NLP :

#### Pipeline Algorithmique Actuel

1. **Reconnaissance Vocale (ASR)** - `faster-whisper`
   - Modèle : Whisper (OpenAI) base, CPU, int8
   - Fonction : Transcription audio → texte avec timestamps
   - Performance : ~1-2 min par minute de vidéo (CPU)

2. **Reconnaissance de Texte (OCR)** - `PaddleOCR`
   - Détection et extraction de texte à l'écran
   - Analyse frame par frame (1 fps)
   - Support multilingue (FR, EN)

3. **Détection de Scènes** - `PySceneDetect`
   - Analyse de changements visuels entre frames
   - Identification de coupures et transitions
   - Métrique de densité de cuts (indicateur de manipulation)

4. **Scoring de Risque** (Heuristique)
   - Densité de cuts (0-20 pts)
   - Termes sensationnalistes (0-20 pts)
   - Texte plein écran (0-20 pts)
   - Matching fact-check (0-40 pts)
   - **Limitation actuelle** : Basé sur règles, pas d'apprentissage automatique

5. **Matching Fact-Check** - `sentence-transformers` + `FAISS`
   - Embeddings : `paraphrase-multilingual-MiniLM-L12-v2`
   - Recherche vectorielle FAISS (CPU)
   - Indexation in-memory (limite de scalabilité)

#### Contraintes Techniques Actuelles

- **Compute** : CPU-only (Railway, contraintes budgétaires)
- **Latence** : 3-5 minutes par vidéo courte (1-3 min)
- **Scalabilité** : Traitement séquentiel, pas de parallélisation GPU
- **Modèles** : Versions optimisées CPU (quantifiées int8)
- **Index FAISS** : En mémoire, taille limitée

### Passage TRL 6 → TRL 7 : Nécessité des Hyperscalers

**TRL 7** requiert une démonstration du prototype dans un environnement opérationnel avec :
- Charge réelle et patterns d'utilisation production
- Scalabilité horizontale
- Performances comparables à la production

#### Pourquoi les Hyperscalers sont Critiques

1. **Accès GPU pour Modèles ML**
   - **Whisper Large-v2** : 10-30x plus rapide sur GPU (30s vs 5-10 min)
   - **OCR** : PaddleOCR peut utiliser GPU pour batch processing
   - **Embeddings** : sentence-transformers 5-10x plus rapide sur GPU
   - **Bénéfice** : Réduction latence de 5 min → 30-60s par vidéo

2. **Infrastructure Compute Auto-scaling**
   - Parallélisation : Traiter plusieurs vidéos simultanément
   - Worker pools : Distribution dynamique selon charge
   - **AWS/Azure/GCP** : Auto-scaling groups, Kubernetes
   - **Railway actuel** : Limité à instancing fixe

3. **Stockage et Index Vectoriel à Grande Échelle**
   - **FAISS in-memory** → **Elasticsearch / Pinecone / Weaviate**
   - Index fact-checks : De milliers → millions d'entrées
   - Recherche distribuée : Latence <100ms pour matching
   - **Actuel** : Limité par RAM disponible (quelques Go)

4. **Modèles ML Production-Grade**
   - **Whisper Large-v2** (vs base) : +15% précision, mais ~3x plus lent CPU
   - **Modèles de scoring** : Transformer fine-tuné sur dataset fact-checks
   - **Modèles de détection** : Vision transformers pour deepfake/manipulation
   - **Coût** : 10-50x plus de compute que CPU, nécessite GPU clusters

5. **Validations et Tests de Charge**
   - **TRL 7** : Démonstration à 100-1000 requêtes/jour
   - Load testing : Simuler pics de trafic (événements médiatiques)
   - Monitoring : APM, logging distribué, alerting
   - **Hyperscalers** : Tooling intégré (CloudWatch, Azure Monitor, etc.)

#### Architecture Cible TRL 7

```
┌─────────────┐
│   Frontend  │ (Vercel)
└──────┬──────┘
       │
┌──────▼─────────────────────────────────────┐
│        API Gateway (Load Balancer)          │
└──────┬──────────────────────────────────────┘
       │
   ┌───┴───┐
   │ API   │ → Queue (Redis Cluster)
   └───┬───┘
       │
   ┌───▼──────────────────────────────────────┐
   │  Worker Pool (Kubernetes / ECS)         │
   │  - GPU Nodes (Whisper, OCR, Embeddings) │
   │  - CPU Nodes (Heuristics, Post-proc)    │
   │  - Auto-scaling: 2-20 instances          │
   └───┬──────────────────────────────────────┘
       │
   ┌───▼──────────────────────────────────────┐
   │  Vector DB (Pinecone/Weaviate/ES)        │
   │  - Millions de fact-checks               │
   │  - Embeddings persistés                  │
   │  - Recherche distribuée                  │
   └──────────────────────────────────────────┘
```

#### Estimations Coûts Hyperscalers (TRL 7)

- **GPU Workers** : $0.50-2.00/heure (AWS p3.2xlarge, Azure NC6)
- **Vector DB** : $100-500/mois (Pinecone/Weaviate managed)
- **Storage** : $50-200/mois (S3/GCS pour vidéos temporaires)
- **Total** : ~$500-2000/mois pour charge moyenne (vs ~$20-50 Railway actuel)

**Conclusion** : Le passage à TRL 7 nécessite une infrastructure cloud à grande échelle pour :
- Accès GPU massif (modèles ML production)
- Scalabilité horizontale (charge réelle)
- Bases vectorielles distribuées (index fact-checks)
- Validations opérationnelles (monitoring, alerting)

L'architecture actuelle (Railway CPU) est optimale pour **TRL 5-6** (validation conceptuelle), mais insuffisante pour **TRL 7** (démonstration opérationnelle).

## License

MIT

