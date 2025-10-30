# InfoVerif — Détection de Propagande et Ingérence Étrangère

**Outil de défense informationnelle** pour identifier et signaler la propagande, l'ingérence étrangère, les manipulations médiatiques, les contenus extrémistes et les deepfakes dans les vidéos courtes (YouTube, TikTok, Instagram Reels).

## 🎯 Mission

InfoVerif est conçu pour **protéger l'information publique** contre :
- 🚨 **Propagande** et désinformation coordonnée
- 🌐 **Ingérence étrangère** (comptes, bots, influenceurs orchestrés)
- 🎭 **Manipulation médiatique** (deepfakes, montages, montage vidéo)
- ⚠️ **Théories du complot** et fausses narrations
- ⛔ **Contenu extrémiste** (djihadiste, suprémaciste, etc.)

### État Actuel : MVP avec Input Manuel

Le système **fonctionne actuellement avec des inputs manuels** :
- ✅ Analyse de vidéos soumises par l'utilisateur (URL ou upload)
- ✅ Détection de signaux de manipulation (cuts, texte sensationnaliste)
- ✅ Transcription audio (ASR) et extraction de texte (OCR)
- ✅ Scoring de risque heuristique
- ✅ Matching avec base de fact-checks

### Vision : Agent Autonome de Détection

**Objectif à long terme** : Transformer InfoVerif en **agent autonome** capable de :

1. **Détection Automatique de Contenu**
   - Scan automatisé de plateformes (YouTube, TikTok, etc.)
   - Identification proactive de contenus suspects
   - Monitoring continu de comptes à risque

2. **Classification Multi-Catégories**
   - 🎯 **Théories du complot** : Patterns linguistiques, références récurrentes
   - 🌐 **Ingérence étrangère** : Analyse de réseaux, timing coordonné, provenance suspecte
   - 🎭 **Deepfakes** : Détection de manipulation audio/vidéo (modèles Vision Transformers)
   - ⛔ **Contenu extrémiste** : Classification de discours radical (modèles NLP fine-tunés)

3. **Analyse de Réseaux**
   - Mapping de comptes liés et coordonnés
   - Détection de bots et fermes de trolls
   - Analyse de propagation virale

4. **Alertes en Temps Réel**
   - Dashboard de monitoring pour agences gouvernementales / ONG
   - API d'alertes pour intégration dans systèmes de sécurité
   - Reporting automatisé de violations

## 🏗️ Architecture

- **Backend**: FastAPI + RQ workers (Python 3.11) sur Railway
- **Frontend**: React (Vite) + Tailwind sur Vercel
- **Storage**: Local FS ou S3-compatible (MinIO) avec purge 48h
- **Vector Search**: FAISS (in-memory) pour MVP → Pinecone/Weaviate pour production
- **Queue**: Redis pour jobs asynchrones

## 🔍 Pipeline de Détection Actuel

### 1. Analyse Vidéo Multi-Modale

```
┌─────────────┐
│ Input Vidéo │ (URL YouTube ou Upload)
└──────┬──────┘
       │
   ┌───▼────────────────────────────┐
   │  Traitement Vidéo             │
   │  • Download/Upload             │
   │  • Extraction audio (16kHz)   │
   │  • Extraction frames (1 fps)  │
   └──────┬─────────────────────────┘
          │
   ┌──────▼──────────────────────────┐
   │  Analyse Parallèle              │
   │  ┌──────────┬──────────┬─────┐ │
   │  │ ASR      │ OCR      │Scene│ │
   │  │ (Whisper)│(PaddleOCR)│Detect│ │
   │  └────┬─────┴────┬─────┴──┬──┘ │
   └───────┼──────────┼────────┼────┘
           │          │        │
   ┌───────▼───────────▼────────▼─────┐
   │  Détection Signaux Manipulation │
   │  • Densité de cuts               │
   │  • Langage sensationnaliste      │
   │  • Texte plein écran             │
   │  • Patterns conspirationnistes   │
   └───────┬──────────────────────────┘
           │
   ┌───────▼──────────────────────────┐
   │  Matching Fact-Check              │
   │  • Embeddings (sentence-transform)│
   │  • Recherche vectorielle (FAISS)  │
   │  • Sources vérifiées              │
   └───────┬──────────────────────────┘
           │
   ┌───────▼──────────────────────────┐
   │  Scoring Risque (0-100)           │
   │  • Heuristique multi-facteurs    │
   │  • Timeline avec flags           │
   └──────────────────────────────────┘
```

### 2. Signaux Détectés

| Signal | Méthode | Valeur Détectrice |
|--------|---------|-------------------|
| **Manipulation vidéo** | Densité de cuts | >5 cuts/min = suspect |
| **Propagande** | Langage sensationnaliste | Termes émotionnels, polarisants |
| **Théories du complot** | Patterns textuels | Références récurrentes, "on nous cache" |
| **Deepfake** | (À venir) Vision Transformers | Anomalies temporelles, artefacts |
| **Ingérence** | (À venir) Analyse réseau | Timing coordonné, provenance suspecte |
| **Extrémisme** | (À venir) Classification NLP | Discours radical, appels à la violence |

### 3. Modules de Détection

#### Module ASR (Automatic Speech Recognition)
- **Outil**: `faster-whisper` (Whisper base, CPU)
- **Fonction**: Transcription audio → texte avec timestamps
- **Utilisation**: Extraction de discours pour analyse NLP
- **Évolution**: Whisper Large-v2 sur GPU pour détection d'accent suspect (ingérence)

#### Module OCR (Optical Character Recognition)
- **Outil**: `PaddleOCR`
- **Fonction**: Extraction de texte à l'écran (frames vidéo)
- **Utilisation**: Détection de surimpressions, slogans, fausses citations
- **Évolution**: Détection de patterns visuels (logos, symboles)

#### Module Détection de Scènes
- **Outil**: `PySceneDetect`
- **Fonction**: Identification de coupures et transitions
- **Utilisation**: Métrique de manipulation vidéo (densité de cuts)
- **Évolution**: Détection de montage et manipulation temporelle

#### Module Scoring de Risque (Heuristique)
- **Fonction**: Calcul score 0-100 basé sur multiples facteurs
- **Facteurs actuels**:
  - Densité de cuts (0-20 pts)
  - Langage sensationnaliste (0-20 pts)
  - Texte plein écran suspect (0-20 pts)
  - Matching fact-check négatif (0-40 pts)
- **Évolution TRL 7**: Modèles ML fine-tunés pour scoring précis

#### Module Matching Fact-Check
- **Outil**: `sentence-transformers` + `FAISS`
- **Fonction**: Recherche de correspondances avec base fact-checks
- **Embeddings**: `paraphrase-multilingual-MiniLM-L12-v2`
- **Évolution**: Base de millions de fact-checks (vs milliers actuels)

## 🚀 Déploiement Rapide

### Prérequis
- Compte GitHub (repo public)
- Compte Railway (railway.app)
- Railway CLI: `npm i -g @railway/cli`

### Déploiement Railway

```bash
# 1. Push vers GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/infoverif-org.git
git push -u origin main

# 2. Déploiement Railway
railway login
railway init

# 3. Création services
railway add --plugin redis
railway up --service api
railway up --service worker

# 4. Obtenir URL
railway domain
```

**Voir [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) pour instructions complètes.**

## 💻 Développement Local

### Prérequis
- Python 3.11+
- Node.js 18+ (pour frontend)
- Redis (ou Docker: `docker run -d -p 6379:6379 redis:7-alpine`)

### Démarrer Backend

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Démarrer Worker (terminal séparé)

```bash
cd api
python worker.py
```

### Démarrer Frontend

```bash
cd web
npm install
npm run dev
```

## 📁 Structure du Projet

```
/api            # FastAPI, workers, tâches, scoring
  /asr.py       # Module transcription audio
  /ocr.py       # Module reconnaissance texte
  /scene_detection.py  # Détection de scènes
  /scoring.py   # Scoring de risque heuristique
  /factcheck.py # Matching fact-checks
  /claims.py    # Extraction de claims
  /video_processing.py  # Traitement vidéo
/web            # React (Vite), Tailwind UI
/ops            # Dockerfiles, Railway Procfile, Vercel config
/data           # Fact-checks seed JSON
/scripts        # Helpers développement local
```

## 🔐 Éthique & Légal

### Principes

- **Purge automatique** : Toutes les données supprimées après 48h
- **Pas de scraping automatique** : TikTok/Instagram nécessitent upload manuel
- **Pas de stockage persistant** : Seul le contenu soumis par l'utilisateur est stocké
- **Transparence** : Code open source, méthodologie documentée
- **Respect vie privée** : Pas de profils utilisateurs persistants

### Limitations Actuelles

- ⚠️ **False positives** : Scoring basé sur heuristiques, pas ML validé
- ⚠️ **Index fact-checks limité** : MVP utilise données seed locales
- ⚠️ **Input manuel** : Pas encore d'agent autonome
- ⚠️ **Détection deepfake** : Non implémentée (TRL 7)
- ⚠️ **Analyse réseau** : Non implémentée (TRL 7)

Voir `/method-card` pour limitations détaillées et avertissements.

## 📊 État Technique : TRL 5-6 → Vision TRL 7

### TRL Actuel : 5-6 (Technologie Validée)

Le système démontre la faisabilité technique mais nécessite **input manuel** et opère en **mode CPU-only** avec contraintes de scalabilité.

### Vision TRL 7 : Agent Autonome de Détection

**TRL 7** nécessite transformation en **agent autonome** avec :

#### 1. Détection Automatique Multi-Catégories

```python
# Vision architecture TRL 7
{
  "conspiracy_detection": {
    "model": "fine-tuned-transformer",
    "features": ["linguistic_patterns", "reference_clusters", "narrative_analysis"],
    "precision_target": ">90%"
  },
  "foreign_interference": {
    "model": "network_analysis + NLP",
    "features": ["account_coordination", "timing_patterns", "provenance_analysis"],
    "precision_target": ">85%"
  },
  "deepfake_detection": {
    "model": "vision-transformer",
    "features": ["temporal_consistency", "artifacts", "audio-video_sync"],
    "precision_target": ">95%"
  },
  "extremist_content": {
    "model": "hate-speech-classifier",
    "features": ["radical_language", "calls_to_violence", "ideology_markers"],
    "precision_target": ">92%"
  }
}
```

#### 2. Infrastructure Hyperscaler Nécessaire

**Pourquoi les hyperscalers (AWS/Azure/GCP) sont critiques** :

1. **GPU Massif pour ML**
   - Whisper Large-v2 : 10-30x plus rapide sur GPU
   - Vision Transformers (deepfake) : Nécessite GPU clusters
   - Modèles de classification : Fine-tuning nécessite GPU

2. **Scalabilité Horizontale**
   - Auto-scaling : 2-50 instances selon charge
   - Traitement parallèle : Milliers de vidéos/jour
   - Kubernetes/ECS pour orchestration

3. **Bases Vectorielles Distribuées**
   - Pinecone/Weaviate : Millions de fact-checks
   - Elasticsearch : Index de comptes suspects
   - Recherche <100ms pour alertes temps réel

4. **Monitoring et Alerting**
   - APM distribué (CloudWatch, Datadog)
   - Alertes automatiques pour contenus critiques
   - Dashboards pour agences gouvernementales

#### 3. Architecture Cible TRL 7

```
┌────────────────────────────────────────┐
│  Agent Autonome de Détection          │
│  • Scan automatique plateformes        │
│  • Classification multi-catégories   │
│  • Analyse réseaux comptes            │
└───────┬────────────────────────────────┘
        │
┌───────▼───────────────────────────────┐
│  API Gateway (Load Balancer)          │
│  • Rate limiting                      │
│  • Authentication (API keys)          │
└───────┬───────────────────────────────┘
        │
   ┌────┴────┐
   │   API   │ → Queue (Redis Cluster)
   └────┬────┘
        │
┌───────▼───────────────────────────────┐
│  Worker Pool (Kubernetes)             │
│  ┌─────────────────────────────────┐  │
│  │ GPU Nodes:                      │  │
│  │ • Whisper Large-v2              │  │
│  │ • Vision Transformers (deepfake)│  │
│  │ • NLP Classifiers               │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ CPU Nodes:                      │  │
│  │ • Network analysis               │  │
│  │ • Heuristics                    │  │
│  └─────────────────────────────────┘  │
│  Auto-scaling: 2-50 instances         │
└───────┬───────────────────────────────┘
        │
┌───────▼───────────────────────────────┐
│  Vector DB + Graph DB                 │
│  • Pinecone: Fact-checks (millions)   │
│  • Neo4j/ArangoDB: Network graphs     │
│  • Elasticsearch: Account indexing    │
└───────────────────────────────────────┘
```

#### 4. Estimations Coûts TRL 7

- **GPU Workers** : $0.50-2.00/heure × 24/7 = $360-1440/mois
- **Vector DB** : $200-800/mois (Pinecone/Weaviate managed)
- **Graph DB** : $100-300/mois (Neo4j Cloud)
- **Storage** : $50-500/mois (S3/GCS pour vidéos + metadata)
- **Monitoring** : $50-200/mois (CloudWatch, Datadog)
- **Total** : ~$760-3240/mois pour charge moyenne

*(vs ~$20-50/mois Railway actuel pour TRL 5-6)*

#### 5. Modèles ML à Développer (TRL 7)

1. **Classifier Théories du Complot**
   - Fine-tune BERT/RoBERTa sur dataset conspirationniste
   - Features : Patterns linguistiques, références récurrentes
   - Dataset : r/conspiracy, articles fact-checked, forums

2. **Détecteur Ingérence Étrangère**
   - Network analysis : Coordinated inauthentic behavior
   - Timing analysis : Posts synchronisés
   - Provenance : VPN patterns, geolocation anomalies

3. **Détecteur Deepfake**
   - Vision Transformer fine-tuné (FaceForensics++, DFDC)
   - Temporal consistency analysis
   - Audio-video synchronization checks

4. **Classifier Contenu Extrémiste**
   - Hate speech classifier (multilingue)
   - Ideology markers (radicalization signals)
   - Violence detection (calls to action)

## 🎯 Roadmap TRL 5-6 → TRL 7

### Phase 1 : MVP Actuel (TRL 5-6) ✅
- [x] Pipeline analyse vidéo manuelle
- [x] ASR + OCR + Scene detection
- [x] Scoring heuristique
- [x] Matching fact-checks (FAISS)
- [x] Interface web (upload/URL)

### Phase 2 : Infrastructure Scalable (Q1 2024)
- [ ] Migration vers hyperscaler (AWS/Azure/GCP)
- [ ] GPU workers pour modèles ML
- [ ] Vector DB distribuée (Pinecone)
- [ ] Auto-scaling Kubernetes

### Phase 3 : Agent Autonome Base (Q2 2024)
- [ ] Scan automatisé YouTube/TikTok (APIs)
- [ ] Classification automatique (multi-labels)
- [ ] Dashboard monitoring
- [ ] API alertes

### Phase 4 : Détection Avancée (Q3 2024)
- [ ] Modèle deepfake (Vision Transformer)
- [ ] Analyse réseaux (Graph DB)
- [ ] Détecteur ingérence (coordination patterns)
- [ ] Classifier conspiration (NLP fine-tuned)

### Phase 5 : Production TRL 7 (Q4 2024)
- [ ] Validation opérationnelle à grande échelle
- [ ] Intégration agences gouvernementales
- [ ] Monitoring 24/7 avec alertes
- [ ] Documentation complète

## 📝 Variables d'Environnement

Voir `.env.example` pour variables requises.

## 📄 License

MIT - Outil open source pour défense informationnelle

---

**InfoVerif** : Protéger l'information publique contre propagande, ingérence étrangère et manipulation médiatique.
