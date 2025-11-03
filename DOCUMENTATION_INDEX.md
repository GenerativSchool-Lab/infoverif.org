# 📚 Index de la Documentation — InfoVerif.org

Bienvenue dans la documentation d'**InfoVerif.org** ! Ce fichier vous guide vers les ressources appropriées selon vos besoins.

---

## 🎓 Documentation Académique (PhD-Grade)

### ⭐ **ARCHITECTURE_AND_PROCESS.md** — NOUVEAU (Janvier 2026)

**Documentation complète de niveau académique** sur l'architecture, les processus d'implémentation, et les lessons learned.

**Contenu** :
- Architecture système complète (webapp + extension Chrome)
- Timeline d'implémentation (Phase 1-3)
- Processus d'intégration DIMA (M2.1, M2.2) avec détails techniques
- Développement extension Chrome (Twitter + TikTok)
- **Lessons learned** (15 tentatives deployment, memory planning, platform decisions)
- Technical debt & future work
- Références académiques

**Temps de lecture** : 45-60 minutes  
**Audience** : PhD-level, chercheurs, architectes système, ML engineers

---

## 🎯 DIMA Integration Documentation

### 🚀 **Semantic Embeddings Layer — Production Deployment Complete**

**Milestone 2.2** intègre 130 techniques DIMA (M82 Project) avec analyse vectorielle FAISS + GPT-4o-mini.

#### Documents clés :

1. **[DIMA_Semantic_RFC.md](./docs/DIMA_Semantic_RFC.md)** (1884 lignes)
   - RFC-style design document complet
   - Architecture hybride (embeddings + prompts)
   - Alignment tables (DIMA ↔ InfoVerif)
   - M1, M2.1, M2.2 status (tous ✅ COMPLETED)
   - Formules de scoring, exemples JSON
   - Risques et mitigation

2. **[DIMA_M2.2_Performance_Report.md](./docs/DIMA_M2.2_Performance_Report.md)** (455 lignes)
   - Rapport de production complet
   - Métriques de performance (latency, cost, accuracy)
   - Architecture diagram (Text → FAISS → GPT-4)
   - Comparaison M2.1 vs M2.2 (+50% detection)
   - Deployment journey (15 tentatives documentées)
   - Technical implementation (code samples)
   - Production health status
   - Lessons learned pour futurs ML deployments

3. **[DIMA_M2.2_Embeddings_Plan.md](./docs/DIMA_M2.2_Embeddings_Plan.md)** (540 lignes)
   - Plan original M2.2 (pré-implémentation)
   - Railway Pro plan resource allocation
   - Embedding model selection rationale
   - Cost estimates vs actual
   - Implementation timeline (3 semaines → 1 jour!)

4. **[CHANGELOG.md](./CHANGELOG.md)** — Sections M2.1 & M2.2
   - Summary user-facing des milestones
   - JSON schema enhancements
   - Performance metrics condensés
   - Production test results

**Temps de lecture total** : 2-3 heures (documentation complète)  
**Audience** : Architectes AI, ML Engineers, Chercheurs

**Status** : ✅ M2.2 LIVE in production (Nov 3, 2025)

---

## 🚀 Par Objectif

### Je veux **essayer rapidement** l'application

➡️ **[QUICKSTART.md](./QUICKSTART.md)** (546 lignes)
- Installation express en 5 minutes
- Commandes copy-paste (backend + frontend)
- Tests rapides avec curl et interface web
- Exemples de réponses API
- Dépannage des erreurs communes

**Temps de lecture** : 10-15 minutes  
**Temps d'installation** : 5 minutes

---

### Je veux **comprendre le projet** dans son ensemble

➡️ **[README.md](./README.md)** (refactorisé Janvier 2026)
- Mission, valeurs et objectif du projet
- Architecture système (webapp + extension Chrome)
- Fonctionnalités en production (multimodal analysis, DIMA 130 techniques)
- Stack technique (backend, frontend, extension)
- Documentation académique (références)
- Méthodologie scientifique (DIMA taxonomy)
- Limitations et avertissements éthiques
- Future work (court/moyen/long terme)

**Temps de lecture** : 30-40 minutes  
**Audience** : Tous (utilisateurs, développeurs, chercheurs)

### Je veux **comprendre l'architecture et les processus d'implémentation**

➡️ **[ARCHITECTURE_AND_PROCESS.md](./docs/ARCHITECTURE_AND_PROCESS.md)** ⭐ NOUVEAU
- Architecture système complète (diagrammes)
- Timeline d'implémentation (Phase 1-3)
- Processus DIMA integration (M2.1, M2.2) détaillé
- Extension Chrome development (Twitter + TikTok)
- Lessons learned (15 tentatives deployment, platform decisions)
- Technical debt & future work
- Références académiques

**Temps de lecture** : 45-60 minutes  
**Audience** : PhD-level, chercheurs, architectes système

---

### Je veux **développer ou contribuer** au code

➡️ **[CONTRIBUTING.md](./CONTRIBUTING.md)** (864 lignes)
- Code de conduite (inclusivité, respect)
- Processus de contribution étape par étape
- Templates (bug report, feature request, PR)
- Setup environnement développement
- Workflow Git (branching, commits)
- Standards de code (Python PEP 8, JavaScript Standard)
- Guidelines tests & documentation
- Review process

**Temps de lecture** : 20-30 minutes  
**Audience** : Contributeurs (code, docs, données)

---

### Je veux **comprendre l'architecture technique** en profondeur

➡️ **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** (1185 lignes)
- Architecture système complète
- API endpoints documentation (avec exemples curl)
- Modèles de données (TypeScript types)
- Algorithmes d'analyse (prompts, fonctions)
- Traitement audio/vidéo (FFmpeg, Whisper)
- Extraction texte images (Vision API)
- Configuration déploiement (Railway, Vercel, Nixpacks)
- Tests & qualité (pytest, vitest)
- Sécurité & best practices
- Performance & optimisation
- Troubleshooting détaillé

**Temps de lecture** : 45-60 minutes  
**Audience** : Développeurs, DevOps, Architectes

---

### Je veux **naviguer dans le code source**

➡️ **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** (603 lignes)
- Arborescence complète des fichiers (avec emojis)
- Inventaire fichiers clés (lignes, responsabilités)
- Modules & dépendances (Python, JavaScript)
- Flux de données détaillés (diagrammes ASCII)
- Architecture composants React (tree)
- Modèles de données (API response, React state)
- Variables d'environnement (dev, prod)
- Scripts utilitaires (dev, build, test)

**Temps de lecture** : 20-30 minutes  
**Audience** : Développeurs (nouveaux contributeurs)

---

### Je veux **suivre l'historique des versions**

➡️ **[CHANGELOG.md](./CHANGELOG.md)** (358 lignes)
- Version actuelle : v1.0.0 (MVP Fonctionnel)
- Détail complet des features ajoutées
- Bugs corrigés (pré-release)
- Limitations connues
- Roadmap versions futures (v1.1 - v3.0)
- Semantic versioning explained
- Policy maintenance & support

**Temps de lecture** : 15-20 minutes  
**Audience** : Mainteneurs, Contributeurs, Utilisateurs avancés

---

## 📂 Par Type de Document

### Documentation Utilisateur

| Document | Lignes | Description | Niveau |
|----------|--------|-------------|--------|
| **[README.md](./README.md)** | Refactorisé | Vue d'ensemble complète | ⭐ Débutant |
| **[QUICKSTART.md](./QUICKSTART.md)** | 546 | Installation rapide (5 min) | ⭐ Débutant |

### Documentation Académique & Architecture

| Document | Lignes | Description | Niveau |
|----------|--------|-------------|--------|
| **[ARCHITECTURE_AND_PROCESS.md](./docs/ARCHITECTURE_AND_PROCESS.md)** | ~800 | Architecture, processus, lessons learned | ⭐⭐⭐ PhD-level |
| **[DIMA_Semantic_RFC.md](./docs/DIMA_Semantic_RFC.md)** | 1884 | RFC intégration DIMA | ⭐⭐⭐ Avancé |
| **[DIMA_M2.2_Performance_Report.md](./docs/DIMA_M2.2_Performance_Report.md)** | 455 | Métriques production | ⭐⭐⭐ Avancé |

### Documentation Développeur

| Document | Lignes | Description | Niveau |
|----------|--------|-------------|--------|
| **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** | 1185 | Architecture & API | ⭐⭐⭐ Avancé |
| **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** | 603 | Structure code source | ⭐⭐ Intermédiaire |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | 864 | Guide contribution | ⭐⭐ Intermédiaire |

### Documentation Maintenance

| Document | Lignes | Description | Niveau |
|----------|--------|-------------|--------|
| **[CHANGELOG.md](./CHANGELOG.md)** | 358 | Historique versions | ⭐⭐ Intermédiaire |
| **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** | Ce fichier | Index documentation | ⭐ Débutant |

### Documentation Legacy (Archive)

| Document | Lignes | Description | Statut |
|----------|--------|-------------|--------|
| `API.md` | 243 | Ancienne doc API | ⚠️ Obsolète (voir TECHNICAL_DOCUMENTATION) |
| `DEPLOYMENT.md` | 304 | Ancien guide deploy | ⚠️ Obsolète (voir TECHNICAL_DOCUMENTATION) |
| `RAILWAY_DEPLOY.md` | 285 | Guide Railway legacy | ⚠️ Obsolète (voir QUICKSTART) |
| `RAILWAY_CHECKLIST.md` | 160 | Checklist Railway | ⚠️ Obsolète |
| `SETUP.md` | 183 | Ancien setup guide | ⚠️ Obsolète (voir QUICKSTART) |
| `DEPLOY_NOW.md` | 147 | Quick deploy notes | ⚠️ Obsolète |
| `LIGHTWEIGHT_MVP.md` | 60 | Notes MVP initial | ⚠️ Archive |

---

## 🎯 Par Rôle

### 👤 Utilisateur Final

**Objectif** : Comprendre ce que fait InfoVerif et comment l'utiliser

1. **[README.md](./README.md)** — Section "À Propos" et "Fonctionnalités"
2. **[QUICKSTART.md](./QUICKSTART.md)** — Test rapide de l'interface web
3. **[README.md](./README.md)** — Section "Méthodologie" et "Limitations"

**Temps total** : 30 minutes

---

### 💻 Développeur (Contribution)

**Objectif** : Contribuer du code au projet

1. **[README.md](./README.md)** — Vue d'ensemble du projet
2. **[QUICKSTART.md](./QUICKSTART.md)** — Setup environnement local
3. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Standards de code et workflow Git
4. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** — Navigation dans le code
5. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Architecture détaillée

**Temps total** : 2-3 heures

---

### 🔬 Chercheur / Fact-Checker / PhD Student

**Objectif** : Comprendre la méthodologie et intégrer dans recherche

1. **[README.md](./README.md)** — Sections "Mission", "Méthodologie", "Limitations"
2. **[ARCHITECTURE_AND_PROCESS.md](./docs/ARCHITECTURE_AND_PROCESS.md)** ⭐ — Architecture, processus, lessons learned
3. **[DIMA_Semantic_RFC.md](./docs/DIMA_Semantic_RFC.md)** — Intégration DIMA complète
4. **[DIMA_M2.2_Performance_Report.md](./docs/DIMA_M2.2_Performance_Report.md)** — Métriques production
5. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Section "Algorithmes d'Analyse"
6. **Frontend** : `/method-card` — Formules mathématiques & taxonomie

**Temps total** : 2-3 heures

---

### 🛠️ Mainteneur / DevOps

**Objectif** : Déployer, maintenir et améliorer l'infrastructure

1. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Sections "Déploiement & Infrastructure"
2. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** — Section "Variables d'Environnement" et "Build & Deploy"
3. **[CHANGELOG.md](./CHANGELOG.md)** — Historique et roadmap
4. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Section "Troubleshooting"

**Temps total** : 1-2 heures

---

### 📊 Data Scientist / ML Engineer

**Objectif** : Comprendre les modèles et proposer améliorations

1. **[README.md](./README.md)** — Section "Méthodologie Scientifique"
2. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Section "Algorithmes d'Analyse" (prompts, fine-tuning)
3. **[CHANGELOG.md](./CHANGELOG.md)** — Roadmap Phase 2 (Fine-tuning & Modèles Spécialisés)
4. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Section "Contributions de Données"

**Temps total** : 1-2 heures

---

## 📖 Guides de Lecture Recommandés

### 🌟 Parcours Débutant (30 min)

1. **[README.md](./README.md)** — Sections :
   - "À Propos" (5 min)
   - "Fonctionnalités (MVP)" (10 min)
   - "Méthodologie" (10 min)
   - "Limitations" (5 min)

2. **[QUICKSTART.md](./QUICKSTART.md)** — Test local (optionnel, 15 min)

**Total** : 30-45 minutes

---

### 🚀 Parcours Contributeur Code (3h)

1. **[README.md](./README.md)** — Lecture complète (30 min)
2. **[QUICKSTART.md](./QUICKSTART.md)** — Setup local + tests (30 min)
3. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Lecture complète (30 min)
4. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** — Navigation code (30 min)
5. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Architecture (45 min)
6. **Pratique** : Premier PR (Good First Issue) (1h)

**Total** : ~4 heures

---

### 🔬 Parcours Chercheur / Académique / PhD (3h)

1. **[README.md](./README.md)** — Sections :
   - "Mission & Valeurs" (10 min)
   - "Architecture du Système" (10 min)
   - "Fonctionnalités Principales" (15 min)
   - "Méthodologie Scientifique" (20 min)
   - "Limitations & Avertissements" (10 min)

2. **[ARCHITECTURE_AND_PROCESS.md](./docs/ARCHITECTURE_AND_PROCESS.md)** ⭐ — Complet (60 min)
   - Architecture système
   - Timeline d'implémentation
   - Processus DIMA integration
   - Extension Chrome development
   - Lessons learned

3. **[DIMA_Semantic_RFC.md](./docs/DIMA_Semantic_RFC.md)** — Sections clés (30 min)
   - Architecture hybride
   - Alignment tables
   - Formules de scoring

4. **[DIMA_M2.2_Performance_Report.md](./docs/DIMA_M2.2_Performance_Report.md)** — Métriques (20 min)

5. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Section "Algorithmes d'Analyse" (15 min)

**Total** : ~3 heures

---

### 🛠️ Parcours DevOps / Deployment (2h)

1. **[QUICKSTART.md](./QUICKSTART.md)** — Sections :
   - "Installation Express" (20 min)
   - "Dépannage" (10 min)

2. **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** — Sections :
   - "Architecture Système" (20 min)
   - "Déploiement & Infrastructure" (40 min)
   - "Sécurité" (15 min)
   - "Troubleshooting" (15 min)

3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** — Sections :
   - "Variables d'Environnement" (10 min)
   - "Build & Deploy" (10 min)

**Total** : ~2 heures

---

## 🔍 Recherche Rapide

### Questions Fréquentes → Document

| Question | Réponse dans |
|----------|--------------|
| **C'est quoi InfoVerif ?** | [README.md](./README.md) — Section "À Propos" |
| **Comment installer localement ?** | [QUICKSTART.md](./QUICKSTART.md) — Section "Installation Express" |
| **Quelles techniques sont détectées ?** | [README.md](./README.md) — Section "Méthodologie" |
| **Comment l'algorithme fonctionne ?** | [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) — Section "Algorithmes" |
| **Comment contribuer ?** | [CONTRIBUTING.md](./CONTRIBUTING.md) — Processus complet |
| **Où est le code du backend ?** | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — Arborescence |
| **Comment déployer en production ?** | [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) — Section "Déploiement" |
| **Quelles sont les limitations ?** | [README.md](./README.md) — Section "Limitations" |
| **Roadmap du projet ?** | [README.md](./README.md) + [CHANGELOG.md](./CHANGELOG.md) — Sections "Roadmap" |
| **Comment tester l'API ?** | [QUICKSTART.md](./QUICKSTART.md) — Section "Test Rapide" |
| **Variables d'environnement ?** | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — Section "Variables d'Environnement" |
| **Erreur lors de l'analyse ?** | [QUICKSTART.md](./QUICKSTART.md) + [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) — "Troubleshooting" |

---

## 📊 Statistiques Documentation

### Volume Total

**6115 lignes** de documentation (fichiers principaux uniquement, excluant legacy)

| Document | Lignes | % Total |
|----------|--------|---------|
| README.md | 1177 | 19.2% |
| TECHNICAL_DOCUMENTATION.md | 1185 | 19.4% |
| CONTRIBUTING.md | 864 | 14.1% |
| PROJECT_STRUCTURE.md | 603 | 9.9% |
| QUICKSTART.md | 546 | 8.9% |
| CHANGELOG.md | 358 | 5.9% |
| DOCUMENTATION_INDEX.md | ~150 | 2.5% |
| **TOTAL (Docs principales)** | **~4883** | **79.9%** |

### Temps de Lecture Estimé

- **Documentation complète** : ~5-6 heures
- **Quick Start** : ~30 minutes
- **Contribution** : ~3 heures
- **Architecture technique** : ~2 heures

---

## 🚀 Ressources Externes

### API Documentation Interactive

- **Swagger UI** : `http://localhost:8000/docs` (local)
- **Swagger UI** : `https://infoveriforg-production.up.railway.app/docs` (production)

### Code Source

- **GitHub Repository** : [github.com/GenerativSchool-Lab/infoverif.org](https://github.com/GenerativSchool-Lab/infoverif.org)
- **Extension Chrome Repo** : [github.com/GenerativSchool-Lab/infoverif-extension](https://github.com/GenerativSchool-Lab/infoverif-extension)
- **Frontend (Vercel)** : [infoverif.org](https://infoverif.org)
- **Backend (Railway)** : [infoveriforg-production.up.railway.app](https://infoveriforg-production.up.railway.app)

### Contact & Support

- **Issues** : [github.com/GenerativSchool-Lab/infoverif.org/issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
- **Discussions** : [github.com/GenerativSchool-Lab/infoverif.org/discussions](https://github.com/GenerativSchool-Lab/infoverif.org/discussions)
- **Email** : contact@generativschool.com
- **Twitter/X** : [@GenerativSchool](https://twitter.com/GenerativSchool)

---

## 🎓 Ressources Pédagogiques

### Taxonomie des Techniques

Consultez la **page `/method-card`** sur le frontend pour :
- Formules mathématiques détaillées (LaTeX)
- Taxonomie complète des 20+ techniques
- Roadmap avec objectifs académiques
- Principes éthiques & limitations

### Exemples de Code

```bash
# Analyse de texte
curl -X POST http://localhost:8000/analyze-text \
  -F 'text=Les médias mentent ! Réveillez-vous !' | jq .

# Analyse de vidéo
curl -X POST http://localhost:8000/analyze-video \
  -F 'video=@./test.mp4' | jq .

# Analyse d'image
curl -X POST http://localhost:8000/analyze-image \
  -F 'image=@./screenshot.png' | jq .
```

---

## 🔄 Mise à Jour de la Documentation

**Dernière mise à jour** : Janvier 2026 (v2.0.0)

### Changements Récents

- ✅ **README.md refactorisé** : Documentation académique, état actuel (webapp + extension)
- ✅ **ARCHITECTURE_AND_PROCESS.md** : Nouveau document académique (PhD-grade)
- ✅ **Roadmaps obsolètes supprimées** : Focus sur ce qui existe en production
- ✅ **Extension Chrome documentée** : Twitter + TikTok support

### Maintenance

La documentation est mise à jour à chaque version majeure/mineure. Pour signaler des erreurs ou proposer des améliorations :

1. Ouvrir une issue sur [GitHub Issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
2. Label : `documentation`
3. Proposer une Pull Request avec corrections

---

**Merci de votre intérêt pour InfoVerif.org ! Pour toute question, n'hésitez pas à nous contacter.** 🛡️

---

_Un projet du Civic Tech AI Lab — [GenerativSchool.com](https://generativschool.com)_

