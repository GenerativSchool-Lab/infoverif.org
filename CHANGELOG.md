# Changelog — InfoVerif.org

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Unreleased]

### 🚀 M1 COMPLETED — DIMA Framework Mapping (2025-11-03)

#### 📋 DIMA Integration Milestone 1: Taxonomy Mapping

**Status**: ✅ **COMPLETED**  
**RFC**: `docs/DIMA_Semantic_RFC.md`  
**Deliverables**:
- ✅ Complete mapping of 130 DIMA techniques to InfoVerif categories
- ✅ CSV mapping table with weights, semantic features, and keywords
- ✅ Hierarchical taxonomy JSON (6 families → 130 techniques)
- ✅ Statistical analysis report (distribution, coverage, alignment quality)
- ✅ Validation script for CSV integrity (weights, codes, fields)
- ✅ 50+ annotated examples (5 high-priority techniques)
- ✅ English translation of top 20 techniques for international research

**Key Artifacts**:
- `docs/DIMA_Full_Mapping.csv` — Full 130-technique mapping table
- `docs/DIMA_Taxonomy_Tree.json` — Hierarchical structure
- `docs/DIMA_Mapping_Stats.md` — Distribution analysis & metrics
- `docs/DIMA_Top20_EN.md` — English translations for collaboration
- `tools/validate_dima_mapping.py` — Automated validation script
- `data/dima_examples/*.json` — Annotated corpus (TE-01, TE-02, TE-31, TE-58, TE-62)

**Alignment Summary**:
- **I_p (Intensité persuasive)**: 70 techniques (54%) — Emotion, persuasion, propaganda
- **N_s (Narratif spéculatif)**: 14 techniques (11%) — Conspiracy, distrust, speculation
- **F_f (Fiabilité factuelle)**: 46 techniques (35%) — Fallacies, distortion, misinformation
- **Many-to-many mappings**: 38 techniques (29%) — Overlapping semantic categories

**Validation**: Automated checks passed ✅ (weights sum to 1.0, no missing codes)  
**Next Milestone**: M2 — Semantic Detector Design (embedding similarity, zero-shot classification)

---

## [1.0.0] - 2026-01-20

### 🎉 Version Initiale — MVP Fonctionnel

Premier déploiement public d'**InfoVerif.org**, outil d'analyse de propagande, désinformation et manipulation médiatique basé sur l'IA.

---

### ✨ Ajouté

#### Analyse Multi-Formats
- **Analyse de texte** : Support texte direct (posts, articles, messages)
- **Analyse de vidéo** : Upload vidéo + transcription Whisper + analyse sémantique
- **Analyse d'image** : Upload screenshot + extraction Vision API + analyse

#### Détection de Techniques (20+)
- **Intensité persuasive** (9+ catégories) :
  - Manipulation émotionnelle (peur, colère, indignation)
  - Cadrage dichotomique ("eux vs nous")
  - Langage chargé / mots sensationnalistes
  - Sélection partielle (cherry-picking)
  - Appel à l'autorité sans preuves
  - Généralisation abusive
  - Faux dilemmes / pensée binaire
  - Déformation / exagération
  - Répétition de messages clés

- **Narratif spéculatif** (7+ indicateurs) :
  - Vérité cachée / révélation
  - Défiance institutionnelle (experts, médias, gouvernements)
  - Recherche de patterns dans le bruit
  - Affirmations infalsifiables
  - Rhétorique "ils ne veulent pas que tu saches"
  - Causalité simpliste
  - Appel au "bon sens" contre expertise

- **Fiabilité factuelle** (7+ types) :
  - Affirmations non sourcées
  - Sophismes logiques
  - Information hors contexte
  - Statistiques trompeuses
  - Confusion corrélation/causalité
  - Omission d'informations
  - Fausses équivalences

#### Scores Normalisés [0-100]
- **Φ_influence** (Indice d'influence) : Score composite global
- **I_p** (Intensité persuasive) : Niveau de propagande
- **N_s** (Narratif spéculatif) : Marqueurs conspirationnistes
- **F_f** (Fiabilité factuelle) : Niveau de désinformation

Terminologie académique nuancée au frontend (vs variables techniques backend).

#### Explications Détaillées en Français
- **Techniques détectées** :
  - Nom en français
  - Citation exacte du contenu (evidence)
  - Niveau de sévérité (élevé/moyen/faible)
  - Explication détaillée (2-3 phrases)

- **Affirmations analysées** :
  - Affirmation textuelle extraite
  - Niveau de confiance (supportée/non supportée/trompeuse)
  - Liste des problèmes identifiés
  - Raisonnement du jugement

- **Résumé global** : Analyse en 3-4 phrases de l'impact sur l'audience

#### Interface Utilisateur
- **Page d'accueil** avec 3 onglets (Texte, Vidéo, Capture)
- **Upload drag-and-drop** pour fichiers (vidéo, images)
- **Thème noir & blanc** minimaliste et élégant
- **Page de résultats** avec :
  - Barres de progression pour scores
  - Cards pour techniques détectées
  - Cards pour affirmations analysées
  - Sidebar avec métadonnées et résumé

- **Page méthode & roadmap** avec :
  - Formules mathématiques (LaTeX via KaTeX)
  - Capacités actuelles détaillées
  - Roadmap phases 2-5 (Q2 2026 - 2026+)
  - Principes éthiques et limitations

#### Backend (FastAPI)
- **Endpoints** :
  - `GET /health` : Health check
  - `GET /test-openai` : Test connectivité OpenAI
  - `POST /analyze-text` : Analyse de texte
  - `POST /analyze-video` : Analyse de vidéo (transcription + analyse)
  - `POST /analyze-image` : Analyse d'image (extraction + analyse)
  - `GET /method-card` : Méthode & roadmap (JSON)

- **OpenAI Integration** :
  - GPT-4o-mini pour analyse sémantique
  - Whisper API pour transcription audio
  - Vision API pour extraction texte images
  - JSON mode strict (`response_format={"type": "json_object"}`)
  - Temperature = 0 (déterminisme)

- **FFmpeg Integration** :
  - Extraction audio depuis vidéos
  - Conversion MP3 16kHz mono 64kbps

- **Error Handling** :
  - Validation input (taille, format, contenu)
  - Traceback complet dans réponses erreur
  - Cleanup automatique fichiers temporaires

#### Frontend (React + Vite)
- **Composants** :
  - `Home.jsx` : Landing page avec formulaire 3 onglets
  - `ReportDeep.jsx` : Affichage résultats d'analyse
  - `MethodCard.jsx` : Documentation méthodologie
  - `Equation.jsx` : Rendu formules LaTeX (KaTeX)

- **State Management** : React Hooks (useState, useEffect, useLocation)
- **HTTP Client** : Axios pour API calls
- **Routing** : React Router (SPA)
- **Styling** : Tailwind CSS (thème noir & blanc)

#### Déploiement
- **Backend Railway** :
  - Auto-deploy Git (push → deploy automatique)
  - Nixpacks build configuration
  - Variables d'environnement (OPENAI_API_KEY)
  - FFmpeg installé via aptPackages

- **Frontend Vercel** :
  - Auto-deploy Git (push → deploy automatique)
  - Configuration Vite (build → dist)
  - Variable VITE_API_URL pour backend

#### Documentation Complète
- **README.md** (350+ lignes) :
  - Mission & valeurs
  - Fonctionnalités MVP détaillées
  - Formulation mathématique avec terminologie académique
  - Architecture système (diagrammes, data flow)
  - Roadmap détaillée (Q1 2026 - 2026+)
  - Guide contribution
  - Méthodologie scientifique
  - Limitations & avertissements

- **TECHNICAL_DOCUMENTATION.md** (1200+ lignes) :
  - Architecture complète (backend, frontend, OpenAI)
  - API endpoints documentation
  - Modèles de données
  - Algorithmes d'analyse (prompts, fonctions)
  - Configuration déploiement
  - Tests & qualité
  - Sécurité & best practices
  - Troubleshooting

- **CONTRIBUTING.md** (600+ lignes) :
  - Code de conduite
  - Processus de contribution
  - Templates (bug report, feature request, PR)
  - Setup développement
  - Workflow Git (branching, commits)
  - Standards de code (Python, JavaScript)
  - Guidelines tests & documentation
  - Review process

- **QUICKSTART.md** (500+ lignes) :
  - Installation express (5 minutes)
  - Commandes copy-paste (backend + frontend)
  - Tests rapides (curl, interface web)
  - Exemple réponse API complète
  - Dépannage (erreurs communes + solutions)
  - Métriques de performance
  - Tips & astuces (batch analysis, CSV export)
  - Use cases concrets

- **CHANGELOG.md** : Historique des versions

#### Open Source & Licence
- **Licence MIT** : Code libre d'utilisation commerciale
- **Repo GitHub** : github.com/GenerativSchool-Lab/infoverif.org
- **Contributions bienvenues** : Issues, PRs, datasets, traductions

#### Principes Éthiques
- ✅ **Transparence** : Code open source, méthodologie documentée
- ✅ **Confidentialité** : Pas de stockage permanent, pas de profilage
- ✅ **Éducation** : Explications détaillées, outil pédagogique
- ✅ **Nuance** : Reconnaissance des limitations et contexte
- ✅ **Collaboration** : Communauté ouverte

---

### 🔧 Technique

#### Dependencies (Backend)
```
fastapi==0.115.6
openai==1.12.0
httpx<0.28  # Compatibilité openai SDK
python-dotenv==1.0.1
python-multipart==0.0.20
ffmpeg-python==0.2.0
pydantic==2.10.5
uvicorn[standard]==0.34.0
```

#### Dependencies (Frontend)
```
react==18.3.1
react-dom==18.3.1
react-router-dom==7.1.1
axios==1.7.9
katex==0.16.11
tailwindcss==3.4.17
vite==6.0.5
```

#### Infrastructure
- **Backend** : Railway (Python 3.11, FFmpeg, Nixpacks)
- **Frontend** : Vercel (Node 18, Vite build)
- **APIs externes** : OpenAI (GPT-4o-mini, Whisper, Vision)

---

### 🐛 Corrigé

#### Bugs Majeurs Résolus (Pré-Release)
- **KeyError dans ANALYSIS_PROMPT** : Échappement accolades JSON (`{{` au lieu de `{`)
- **httpx incompatibilité** : Pin `httpx<0.28` pour compatibilité `openai==1.12.0`
- **JSON parsing errors** : Cleaning agressif des réponses OpenAI (markdown removal)
- **FFmpeg path errors** : Ajout FFmpeg à nixpacks.toml (aptPackages)
- **Railway snapshot deploy fails** : Migration vers auto-deploy Git (plus stable)

#### Améliorations (Pré-Release)
- **Prompt optimization** : Ajout instructions explicites pour sortie française
- **Error handling** : Full traceback dans réponses API pour debugging
- **Cleanup robuste** : Suppression automatique fichiers temporaires (finally blocks)
- **Frontend UX** : Upload drag-and-drop custom (remplacement input file gris)
- **Academic terminology** : Mapping backend (propaganda_score) → frontend (Intensité persuasive)

---

### 🚧 Limitations Connues

#### MVP (v1.0.0)
- **Langue** : Optimisé pour français (anglais possible mais moins précis)
- **Multimodal** : Vidéo = transcription uniquement (pas d'analyse visuelle)
- **Contexte** : Peut produire faux positifs sur humour/satire
- **Taille** : Vidéos limitées à 60 Mo, texte à 8000 chars
- **Performance** : Analyse synchrone (pas de queue/workers)
- **Rate limiting** : Pas implémenté (risque abus)
- **Datasets** : Pas de fine-tuning custom (modèles OpenAI génériques)
- **Graph analysis** : Pas d'analyse de réseaux sociaux
- **Deepfake detection** : Pas implémenté

---

### 📅 Roadmap

#### [1.1.0] - Q2 2026 (Planifié)
- Fine-tuning BERT/RoBERTa sur corpus annoté
- Vector database (ChromaDB/Pinecone) pour patterns connus
- Embeddings sémantiques pour clustering
- Improved prompt engineering avec few-shot examples
- Tests unitaires & intégration (pytest, vitest)
- CI/CD automatisé (GitHub Actions)

#### [1.2.0] - Q3 2026 (Planifié)
- API publique avec rate limiting & authentification
- Batch processing (analyse multiple contenus en parallèle)
- Webhooks pour notifications
- Dashboard analytics (tendances, visualisations)
- Export résultats (CSV, JSON, PDF)

#### [2.0.0] - Q4 2026 (Planifié)
- Graph database (Neo4j) pour analyse de réseaux
- Détection coordinated inauthentic behavior
- Monitoring proactif YouTube/TikTok/Twitter
- Deepfake detection (Vision Transformers)
- Analyse temporelle vidéo (montage manipulatoire)
- Multilingue (anglais, arabe, espagnol)

#### [3.0.0] - 2026+ (Vision)
- Plateforme communautaire (annotations collaboratives)
- Taxonomie ouverte (100+ techniques documentées)
- Partenariats fact-checkers (AFP, Reuters, Bellingcat)
- API SDKs (Python, JavaScript, R)
- Formation & éducation (tutoriels, workshops)
- Collaborations académiques (datasets, publications)

---

## Types de Changements

- `✨ Ajouté` : Nouvelles fonctionnalités
- `🔧 Modifié` : Changements dans fonctionnalités existantes
- `❌ Supprimé` : Fonctionnalités retirées
- `🐛 Corrigé` : Corrections de bugs
- `🔒 Sécurité` : Corrections de vulnérabilités
- `📖 Documentation` : Améliorations documentation uniquement
- `⚡ Performance` : Améliorations de performance
- `🎨 Style` : Changements cosmétiques (pas de logique)
- `♻️ Refactoring` : Refactoring sans changement fonctionnel
- `🧪 Tests` : Ajout/modification de tests

---

## Semantic Versioning

**Format** : `MAJOR.MINOR.PATCH`

- **MAJOR** : Changements incompatibles (breaking changes)
- **MINOR** : Nouvelles fonctionnalités (backward compatible)
- **PATCH** : Corrections de bugs (backward compatible)

**Exemple** :
- `1.0.0` → MVP initial
- `1.1.0` → Ajout fine-tuning (nouvelle feature, compatible)
- `1.1.1` → Bug fix sur fine-tuning (patch)
- `2.0.0` → Changement format API response (breaking change)

---

## Maintenance & Support

### Version Actuelle
**1.0.0** : Support actif (bug fixes, security patches)

### Versions Futures
Nous suivons une politique de **support à long terme** :
- **Bug fixes** : Toutes versions
- **Security patches** : Toutes versions
- **Nouvelles features** : Version latest uniquement

---

## Contact & Contributions

- **Issues** : [github.com/GenerativSchool-Lab/infoverif.org/issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
- **Pull Requests** : [github.com/GenerativSchool-Lab/infoverif.org/pulls](https://github.com/GenerativSchool-Lab/infoverif.org/pulls)
- **Discussions** : [github.com/GenerativSchool-Lab/infoverif.org/discussions](https://github.com/GenerativSchool-Lab/infoverif.org/discussions)
- **Email** : contact@generativschool.com

---

**Merci de votre soutien et vos contributions ! Ensemble, construisons un outil transparent pour détecter la manipulation médiatique.** 🛡️

---

_Un projet du Civic Tech AI Lab — [GenerativSchool.com](https://generativschool.com)_

