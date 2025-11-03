# InfoVerif.org 🛡️

**Analyse de propagande, désinformation et manipulation médiatique basée sur l'IA**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤-green.svg)](https://github.com/GenerativSchool-Lab/infoverif.org)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://react.dev)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen)](https://infoverif.org)

---

## 📢 À Propos

**InfoVerif.org** est un système open source de détection de manipulation médiatique développé par le **Civic Tech AI Lab** — GenerativSchool. Le système combine **analyse multimodale par IA** (GPT-4o-mini, Whisper, Vision API) avec une **taxonomie académique** (130 techniques DIMA, M82 Project) pour identifier la propagande, les théories du complot et la désinformation.

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

## 🚀 Architecture du Système

InfoVerif.org est déployé en production avec **deux interfaces complémentaires** :

### 1. **Application Web** (`infoverif.org`)

**Interface React** permettant l'analyse de contenus via :
- **Texte** : Analyse directe de posts, articles, messages
- **Vidéo** : Upload de fichiers (MP4, MOV, AVI) → transcription Whisper → analyse
- **Image/Screenshot** : Upload de captures (PNG, JPG) → OCR Vision API → analyse

**Déploiement** : Vercel (frontend), Railway (backend)

### 2. **Extension Chrome** (Manifest V3)

**Analyse in-context sur réseaux sociaux** :
- **Twitter/X** : Détection par hover, analyse textuelle et vidéo
- **TikTok** : Bouton fixe, analyse vidéo avec captions

**Fonctionnalités** :
- Panel flottant avec résultats d'analyse
- Multimodal fusion (texte de post + transcription vidéo)
- Cache 5 minutes (réduit appels API)
- État de chargement persistant

**📦 Installation** : [GitHub - infoverif-extension](https://github.com/GenerativSchool-Lab/infoverif-extension)  
**Déploiement** : Extension Chrome Web Store (en développement)

---

## 🎯 Fonctionnalités Principales

### ✅ Analyse Multi-Formats (Production)

**Trois modes d'entrée** :

1. **📝 Texte** : Analyse directe de posts, articles, messages, scripts
   - Collez ou écrivez directement dans l'interface web
   - Analyse sémantique contextuelle instantanée

2. **🎥 Vidéo** : Upload de fichiers vidéo (MP4, MOV, AVI) ou URL (Twitter, YouTube, TikTok)
   - Extraction audio automatique (FFmpeg)
   - Transcription via Whisper API (OpenAI)
   - Analyse du contenu transcrit + fusion avec texte du post (multimodal)

3. **📸 Image/Screenshot** : Captures de posts sociaux (PNG, JPG, WEBP)
   - Extraction de texte via Vision API (OpenAI)
   - Support pour captures Twitter/X, TikTok, Instagram, Facebook
   - Analyse du texte extrait

### ✅ Détection Avancée : **130 Techniques DIMA** (Taxonomie M82 Project)

InfoVerif utilise la **taxonomie DIMA (M82 Project)** — une classification académique exhaustive de **130 techniques de manipulation** documentées dans la recherche en désinformation et propagande.

#### 🧠 Architecture d'Analyse Hybride (M2.2 — Production)

**Système en deux étapes** :

1. **Recherche Sémantique Vectorielle (FAISS)** :
   - Embeddings multilingues via `sentence-transformers` (470MB, 384 dimensions)
   - Index de 130 techniques DIMA préchargé en mémoire
   - Recherche de similarité cosinus (Top-5 techniques les plus proches)
   - Latence : <100ms par requête

2. **Analyse Contextuelle LLM (GPT-4o-mini)** :
   - Prompts enrichis avec taxonomie DIMA complète (130 codes)
   - Hints sémantiques issus de la recherche vectorielle
   - 5 exemples few-shot pour techniques prioritaires
   - Détection avec codes DIMA exacts (`[TE-XX]`) et familles

**Résultat** : Détection précise avec justifications académiques pour chaque technique identifiée.

#### 📚 Les 6 Familles DIMA (130 Techniques)

**1. 🎭 Persuasion émotionnelle** (26 techniques)
- Exemples : Appel à la peur (TE-14), Culpabilisation (TE-31), Choc émotionnel (TE-01)
- Exploitation des émotions pour court-circuiter l'esprit critique

**2. 🔮 Diversion** (22 techniques)
- Exemples : Théorie du complot (TE-58), Défiance institutionnelle (TE-62), Homme de paille (TE-02)
- Détourner l'attention des arguments principaux

**3. 🧩 Simplification** (22 techniques)
- Exemples : Généralisation abusive (TE-03), Faux dilemme (TE-21), Causalité simpliste (TE-45)
- Réduction de la complexité pour manipuler la compréhension

**4. 🎪 Justification** (21 techniques)
- Exemples : Appel à l'autorité (TE-11), Sophisme ad populum (TE-23), Cherry-picking (TE-17)
- Fausses preuves et raisonnements fallacieux

**5. 🎨 Attaque** (20 techniques)
- Exemples : Ad hominem (TE-05), Déshumanisation (TE-08), Bouc émissaire (TE-19)
- Discrédit et diabolisation des opposants

**6. 🎯 Cadrage** (17 techniques)
- Exemples : Langage chargé (TE-04), Répétition (TE-06), Slogans (TE-07)
- Structuration du récit pour orienter la perception

**Référence** : Voir [docs/DIMA_Full_Mapping.csv](docs/DIMA_Full_Mapping.csv) pour la taxonomie complète.

---

## 📊 Scores & Terminologie Académique

**Scores normalisés [0-100]** avec terminologie nuancée :

- **Φ_influence (Indice d'influence global)** : Score composite du risque d'influence manipulatoire
- **I_p (Intensité persuasive)** : Niveau de techniques persuasives détectées
- **N_s (Narratif spéculatif)** : Présence de marqueurs conspirationnistes
- **F_f (Fiabilité factuelle)** : Niveau de désinformation et manipulations factuelles

**Formulation mathématique (M2.2)** :

```
# Step 1: Semantic Search
e⃗_content = SentenceTransformer(text[:2000])
similar_techniques = FAISS.search(e⃗_content, top_k=5, threshold=0.3)

# Step 2: Enhanced Prompt
prompt = taxonomy_130 + few_shot_5 + embedding_hints(similar_techniques)

# Step 3: GPT-4 Analysis
detected_techniques = GPT-4o-mini(prompt, text) → [{dima_code, family, evidence}]

# Result: Hybrid precision
Φ_influence = f(detected_techniques, embedding_hints, scores)
```

---

## 🇫🇷 Analyse Détaillée en Français

Pour chaque contenu analysé, vous recevez :

1. **Scores normalisés** : Visualisation claire avec barres de progression
2. **Techniques détectées** :
   - Code DIMA exact (`[TE-XX]`)
   - Nom de la technique en français
   - Famille DIMA
   - Citation exacte du contenu (evidence)
   - Niveau de sévérité (élevé/moyen/faible)
   - Explication détaillée (2-3 phrases) de comment la technique est utilisée
   - Impact contextuel (pourquoi la technique est efficace dans ce contexte)
3. **Affirmations analysées** :
   - Affirmation textuelle extraite
   - Niveau de confiance (supportée/non supportée/trompeuse)
   - Liste des problèmes identifiés
   - Raisonnement du jugement
4. **Résumé global** : Analyse en 3-4 phrases de l'impact sur l'audience
5. **Extrait de transcription** : Pour vidéos, aperçu du contenu transcrit
6. **Synergies entre techniques** : Si plusieurs techniques se renforcent mutuellement

---

## 🛠️ Stack Technique

### Backend (FastAPI + OpenAI + Semantic Embeddings)

**Framework & API** :
- **FastAPI** 0.115+ : API REST performante avec validation Pydantic
- **Python** 3.11+ : Langage backend
- **Uvicorn** : Serveur ASGI haute performance

**Analyse Sémantique (M2.2)** :
- **sentence-transformers** 2.2.2+ : Embeddings multilingues (384-dim, 470MB)
- **FAISS** 1.7.4+ : Recherche vectorielle rapide (cosinus similarity)
- **numpy** 1.26.4+ : Calculs matriciels pour embeddings
- **PyTorch** 2.9.0 : Backend pour transformers

**IA & Traitement** :
- **OpenAI GPT-4o-mini** : Analyse sémantique, détection de patterns, génération d'explications
- **Whisper API** : Transcription audio de haute qualité pour vidéos
- **Vision API** : Extraction de texte depuis screenshots et images
- **FFmpeg** : Extraction audio depuis fichiers vidéo
- **yt-dlp** : Téléchargement vidéo depuis URLs (Twitter, YouTube, TikTok)
- **python-multipart** : Support upload de fichiers

**Déploiement** :
- **Railway Pro Plan** : Hébergement backend (8GB RAM, 8 vCPU, 100GB storage)
- **Custom Dockerfile** : Build avec C++ runtime (libstdc++, libgomp) pour ML dependencies

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

### Extension Chrome (Manifest V3)

**Architecture** :
- **Manifest V3** : Service worker (event-driven)
- **Content Scripts** : DOM extraction, platform detection
- **Background Service Worker** : API communication, message routing
- **Floating Panel** : UI overlay injected into pages

**Platforms** :
- ✅ **Twitter/X** : Hover detection, text + video analysis
- ✅ **TikTok** : Universal detection, all page types

---

## 📚 Documentation Académique

### Documents Principaux

1. **[ARCHITECTURE_AND_PROCESS.md](docs/ARCHITECTURE_AND_PROCESS.md)** ⭐ **NOUVEAU**
   - Architecture système complète
   - Timeline d'implémentation
   - Processus d'intégration DIMA (M2.1, M2.2)
   - Développement extension Chrome
   - Lessons learned & technical debt

2. **[DIMA_Semantic_RFC.md](docs/DIMA_Semantic_RFC.md)**
   - RFC-style design document (1884 lignes)
   - Architecture hybride (embeddings + prompts)
   - Alignment tables (DIMA ↔ InfoVerif)
   - Milestones M1, M2.1, M2.2 (tous ✅ COMPLETED)
   - Formules de scoring, exemples JSON
   - Risques et mitigation

3. **[DIMA_M2.2_Performance_Report.md](docs/DIMA_M2.2_Performance_Report.md)**
   - Rapport de production complet
   - Métriques de performance (latency, cost, accuracy)
   - Architecture diagram (Text → FAISS → GPT-4)
   - Comparaison M2.1 vs M2.2 (+50% detection)
   - Deployment journey (15 tentatives documentées)
   - Lessons learned pour futurs ML deployments

4. **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)**
   - Index complet de toute la documentation
   - Guides par rôle (utilisateur, développeur, chercheur)
   - Parcours de lecture recommandés

### Documentation Technique

- **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** : Architecture technique détaillée, API endpoints, algorithmes
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** : Structure du code source, modules, dépendances
- **[QUICKSTART.md](QUICKSTART.md)** : Installation rapide (5 minutes), tests locaux
- **[CONTRIBUTING.md](CONTRIBUTING.md)** : Guide de contribution, standards de code, workflow Git

---

## 🔬 Méthodologie Scientifique

### Fondements Académiques

Notre taxonomie s'appuie sur des recherches en :
- **Communication** : Théories de la persuasion (Cialdini, Pratkanis & Aronson)
- **Psychologie sociale** : Biais cognitifs, influence sociale (Kahneman, Tversky)
- **Études médiatiques** : Propagande, désinformation (Chomsky, Herman, Wardle & Derakhshan)
- **Logique** : Sophismes et fallacies (Aristotle, Hamblin, Walton)

### Taxonomie DIMA (M82 Project)

InfoVerif intègre **130 techniques de manipulation** organisées en **6 familles**, chacune documentée avec :
- Code unique (`[TE-XX]`)
- Nom en français et anglais
- Description académique
- Exemples annotés

**Référence** : `docs/DIMA_Full_Mapping.csv`

### Calibration & Validation

**Méthode actuelle (Production)** :
- Prompts structurés avec exemples (few-shot learning)
- Température = 0 pour déterminisme
- JSON schema strict pour cohérence des outputs
- Hybrid FAISS + GPT-4 pour précision accrue
- Validation manuelle sur échantillon de tests

**Métriques production (M2.2)** :
- Latency : <2s (text), <15s (video)
- Accuracy : +50% vs baseline (M2.1)
- Cost : +$0.0005/request (acceptable tradeoff)
- Memory : 1.2GB (model + embeddings + FAISS index)

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

Voir **[QUICKSTART.md](QUICKSTART.md)** pour installation complète en 5 minutes.

**Résumé** :

```bash
# Backend
cd api
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements-lite.txt
echo "OPENAI_API_KEY=sk-your-key" > .env
uvicorn main:app --reload --port 8000

# Frontend (nouveau terminal)
cd web
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

**Backend** : `http://localhost:8000`  
**Frontend** : `http://localhost:5173`  
**API Docs** : `http://localhost:8000/docs`

### Extension Chrome (Développement)

**📦 Repo de distribution** : [github.com/GenerativSchool-Lab/infoverif-extension](https://github.com/GenerativSchool-Lab/infoverif-extension)

**Installation pour utilisateurs** :
```bash
# Option 1 : Depuis le repo de distribution (recommandé pour utilisateurs finaux)
# 1. Aller sur: https://github.com/GenerativSchool-Lab/infoverif-extension
# 2. Télécharger ZIP → Extraire
# 3. Chrome → chrome://extensions/ → Mode développeur
# 4. Charger l'extension non empaquetée → Sélectionner le dossier
```

**Installation pour développeurs** :
```bash
# Option 2 : Depuis ce repo (développement)
# 1. Chrome → chrome://extensions/
# 2. Enable "Developer mode" (top-right toggle)
# 3. Click "Load unpacked"
# 4. Select: /path/to/infoverif.org/extension
```

**Documentation** :
- **[Extension Repo GitHub](https://github.com/GenerativSchool-Lab/infoverif-extension)** — Installation simple pour utilisateurs finaux (guide en français)
- **[extension/README.md](extension/README.md)** — Guide d'installation détaillé (développement)

### Déploiement Production

**Backend (Railway)** :
- Auto-deploy Git (push to `main` → deploy)
- Custom Dockerfile pour ML dependencies
- Railway Pro Plan (8GB RAM, 8 vCPU)

**Frontend (Vercel)** :
- Auto-deploy Git (push to `main` → deploy)
- Build: `npm run build`
- Output: `dist/`

**Variables d'environnement** :
- Backend: `OPENAI_API_KEY`, `PORT`
- Frontend: `VITE_API_URL`

---

## 🤝 Contribuer au Projet

**InfoVerif** est un projet **communautaire**. Nous accueillons toutes les contributions !

### Domaines de Contribution

1. **Code & Features** : Backend (FastAPI), Frontend (React), Extension (Chrome MV3)
2. **Données & Annotations** : Datasets annotés, taxonomie étendue, cas d'étude
3. **Documentation & Traductions** : Tutoriels, guides, traductions multilingues
4. **Recherche & Partenariats** : Publications académiques, collaborations

### Comment Contribuer

Voir **[CONTRIBUTING.md](CONTRIBUTING.md)** pour guide complet.

**Workflow rapide** :
```bash
git clone https://github.com/GenerativSchool-Lab/infoverif.org.git
cd infoverif.org
git checkout -b feature/ma-super-feature
# ... modifications ...
git commit -m "feat: description claire"
git push origin feature/ma-super-feature
# Ouvrir Pull Request sur GitHub
```

### Contact & Communauté

- **GitHub Issues** : [github.com/GenerativSchool-Lab/infoverif.org/issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
- **GitHub Discussions** : Questions générales, idées, feedback
- **Email** : contact@generativschool.com
- **Twitter/X** : [@GenerativSchool](https://twitter.com/GenerativSchool)

---

## 🔮 Future Work

### Améliorations Techniques (Court Terme)

- [ ] **Redis caching** : Cache des résultats d'embeddings (réduire coûts API)
- [ ] **WebSocket streaming** : Mises à jour temps réel de l'analyse
- [ ] **Confidence calibration** : Intervalles de confiance pour scores
- [ ] **Multi-language support** : English + French output
- [ ] **YouTube extension** : Résoudre problèmes de visibilité bouton

### Améliorations Fonctionnelles (Moyen Terme)

- [ ] **Batch analysis** : Analyser plusieurs posts simultanément
- [ ] **Export reports** : PDF/JSON download
- [ ] **Offline mode** : Service worker caching pour extension
- [ ] **API rate limiting** : Quotas par utilisateur
- [ ] **Monitoring** : Prometheus + Grafana pour métriques production

### Recherche & Expansion (Long Terme)

- [ ] **Fine-tuning** : Dataset annoté par experts pour améliorer précision
- [ ] **Graph analysis** : Réseaux de propagation (Neo4j)
- [ ] **Deepfake detection** : Vision transformers pour manipulation vidéo
- [ ] **Multi-platform extension** : Firefox, Safari support

---

## 📜 License & Utilisation

### MIT License

**InfoVerif.org** est sous licence **MIT** (voir [LICENSE](./LICENSE)).

**Vous êtes libre de** :
- ✅ Utiliser le code à des fins commerciales
- ✅ Modifier et adapter le code à vos besoins
- ✅ Distribuer le code original ou modifié
- ✅ Utiliser à des fins privées, académiques, ou éducatives

**Sous condition de** :
- 📄 Inclure la license et le copyright original dans toutes les copies
- 📄 Indiquer les modifications apportées (bonne pratique)

### 🚨 Usages Interdits & Éthique

**Nous nous opposons fermement à** :
- ❌ Censure autoritaire : Utilisation par régimes pour supprimer opinions légitimes
- ❌ Surveillance de masse : Monitoring de citoyens sans consentement
- ❌ Répression de dissidents : Ciblage d'opposants politiques
- ❌ Manipulation inverse : Créer de la propagande en inversant l'analyse
- ❌ Désinformation : Présenter les scores comme vérité absolue

**Nous encourageons** :
- ✅ Éducation : Formation à l'esprit critique et littératie médiatique
- ✅ Recherche : Études académiques sur manipulation et désinformation
- ✅ Fact-checking : Aide aux journalistes et vérificateurs de faits
- ✅ Transparence : Compréhension des mécanismes de persuasion
- ✅ Démocratie : Citoyens informés, débat public de qualité

**Notre engagement éthique** :
1. Pas de stockage permanent : Analyses éphémères, pas de base de données utilisateurs
2. Pas de profilage : Pas de tracking, cookies, ou monétisation de données
3. Open source : Code auditable par tous
4. Explainability : Explications détaillées, pas juste des scores opaques
5. Humilité : Reconnaissance des limitations et biais

---

## 🙏 Remerciements

### Équipe

Développé avec ❤️ par :
- **Civic Tech AI Lab** ([GenerativSchool.com](https://generativschool.com)) - Organisation
- **Contributeurs open source** : Voir [GitHub Contributors](https://github.com/GenerativSchool-Lab/infoverif.org/graphs/contributors)

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
- [sentence-transformers](https://www.sbert.net/) - Reimers & Gurevych
- [FAISS](https://github.com/facebookresearch/faiss) - Facebook Research

**Inspirations académiques** :
- **DIMA Framework (M82 Project)** : Taxonomie de 130 techniques de manipulation
- **Robert Cialdini** - _Influence: The Psychology of Persuasion_
- **Noam Chomsky & Edward Herman** - _Manufacturing Consent_
- **Claire Wardle & Hossein Derakhshan** - _Information Disorder_ (Council of Europe)
- **Daniel Kahneman** - _Thinking, Fast and Slow_

### Communauté

Merci à tous les contributeurs, testeurs, et supporters du projet ! 🙏

---

## 📚 Ressources Complémentaires

### Documentation Académique

- **[ARCHITECTURE_AND_PROCESS.md](docs/ARCHITECTURE_AND_PROCESS.md)** : Architecture, processus, lessons learned
- **[DIMA_Semantic_RFC.md](docs/DIMA_Semantic_RFC.md)** : RFC complète intégration DIMA
- **[DIMA_M2.2_Performance_Report.md](docs/DIMA_M2.2_Performance_Report.md)** : Métriques production

### Fact-checking & Désinformation

- [First Draft News](https://firstdraftnews.org) - Ressources fact-checking
- [Bellingcat](https://www.bellingcat.com) - Investigations open source
- [EU DisinfoLab](https://www.disinfo.eu) - Recherche sur désinformation
- [Poynter IFCN](https://www.poynter.org/ifcn/) - International Fact-Checking Network

### Recherche Académique

- [arXiv: cs.CL (NLP)](https://arxiv.org/list/cs.CL/recent) - Papers NLP & détection
- [ACL Anthology](https://aclanthology.org) - Computational Linguistics
- [ICWSM](https://icwsm.org) - Social Media research

---

## 🛡️ InfoVerif : Pour une Information Libre, Transparente et Critique

> _"La démocratie meurt dans l'obscurité. Éclairons les mécanismes de manipulation pour un débat public éclairé."_

**Un projet du Civic Tech AI Lab — [GenerativSchool.com](https://generativschool.com)**

---

**Version** : 2.0.0 (Production)  
**Dernière mise à jour** : Janvier 2026  
**License** : MIT  
**Contact** : contact@generativschool.com  
**Documentation** : [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
