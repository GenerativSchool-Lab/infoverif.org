# InfoVerif.org 🛡️

**Analyse de propagande, désinformation et manipulation médiatique basée sur l'IA**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤-green.svg)](https://github.com/GenerativSchool-Lab/infoverif.org)

---

## 📢 À Propos

**InfoVerif** est un projet **open source** développé par le **[Civic Tech AI Lab](https://generativschool.com)** de GenerativSchool. Notre mission est de démocratiser l'accès aux outils d'analyse de contenu médiatique pour identifier la propagande, les théories du complot et la désinformation.

### 🎯 Mission
Fournir un outil **transparent, éducatif et accessible** pour :
- 🔍 Analyser les techniques de manipulation médiatique
- 🧠 Détecter les marqueurs de propagande et de conspiration
- 📊 Évaluer le risque de désinformation dans les contenus
- 🎓 Éduquer le public sur les mécanismes de manipulation

### 🌟 Valeurs
- **Open Source** : Code public, méthodologie transparente
- **Éthique** : Pas de stockage permanent, respect de la vie privée
- **Éducation** : Explications détaillées des techniques détectées
- **Collaboration** : Contributions bienvenues de la communauté

---

## 🚀 Fonctionnalités (MVP)

### ✅ Actuellement Disponible

**Analyse multi-formats** :
- 📝 **Texte** : Analyse directe de posts, articles, messages
- 🎥 **Vidéo** : Upload + transcription (Whisper) + analyse sémantique
- 📸 **Image** : Screenshots de posts sociaux + extraction texte (Vision API) + analyse

**Détection avancée** :
- 🎭 **Techniques de propagande** (9+ catégories)
  - Manipulation émotionnelle
  - Cadrage "eux vs nous"
  - Appel à l'autorité sans preuves
  - Généralisation abusive
  - Faux dilemmes
  - Et plus...

- 🔮 **Marqueurs conspirationnistes** (7+ indicateurs)
  - Narratives de "vérité cachée"
  - Défiance envers institutions/experts
  - Rhétorique "ils ne veulent pas que tu saches"
  - Théories causales simplistes
  - Et plus...

- ❌ **Patterns de désinformation** (7+ types)
  - Affirmations non sourcées
  - Sophismes logiques
  - Statistiques trompeuses
  - Information hors contexte
  - Et plus...

**Analyse détaillée en français** :
- Scores de risque (0-100) pour propagande, conspiration, désinformation
- Citations exactes du contenu analysé
- Explications détaillées de chaque technique identifiée
- Raisonnement sur la fiabilité des affirmations
- Résumé de l'impact potentiel sur l'audience

---

## 🛠️ Stack Technique

### Backend
- **FastAPI** : API REST performante
- **OpenAI GPT-4o-mini** : Analyse sémantique et détection de patterns
- **Whisper API** : Transcription audio pour vidéos
- **Vision API** : Extraction de texte depuis screenshots
- **FFmpeg** : Traitement audio/vidéo
- **Railway** : Déploiement backend

### Frontend
- **React + Vite** : Interface utilisateur moderne
- **Tailwind CSS** : Design system
- **Vercel** : Déploiement frontend

---

## 📈 Roadmap

### 🎯 Phase 1 : MVP Fonctionnel ✅ (Actuel)
- [x] Analyse texte/vidéo/image
- [x] Détection de 9+ techniques de propagande
- [x] Analyse en français avec explications détaillées
- [x] Interface utilisateur intuitive
- [x] Déploiement production

### 🔬 Phase 2 : Fine-tuning & Modèles Spécialisés (Q2 2025)
**Objectif** : Améliorer précision et spécialisation

- [ ] **Fine-tuning de modèles dédiés**
  - Modèle spécialisé détection de propagande (BERT/RoBERTa)
  - Classifier de théories du complot entraîné sur corpus annoté
  - Détecteur de sophismes logiques (fallacy detection)

- [ ] **Base de données d'entraînement**
  - Constitution d'un dataset annoté (10K+ exemples)
  - Taxonomie de techniques de manipulation (100+ variantes)
  - Corpus multilingue (français, anglais, arabe)

- [ ] **Embeddings sémantiques**
  - Vector database pour patterns de manipulation connus
  - Recherche sémantique de techniques similaires
  - Clustering de narratives conspirationnistes récurrentes

### 🤖 Phase 3 : Agent Autonome & Monitoring (Q3 2025)
**Objectif** : Détection proactive et analyse de réseaux

- [ ] **Scan automatisé de plateformes**
  - Monitoring YouTube, TikTok, Twitter (via APIs)
  - Détection proactive de contenus suspects
  - Alertes en temps réel

- [ ] **Analyse de réseaux**
  - Graph database (Neo4j) pour mapping de comptes liés
  - Détection de coordinated inauthentic behavior
  - Analyse de propagation virale

- [ ] **Dashboard analytics**
  - Visualisation de tendances
  - Tracking de narratives dans le temps
  - API pour chercheurs et fact-checkers

### 🎭 Phase 4 : Détection Multimodale Avancée (Q4 2025)
**Objectif** : Deepfakes, manipulation vidéo, ingérence

- [ ] **Détection de deepfakes**
  - Vision Transformers pour analyse temporelle
  - Détection d'artefacts audio/vidéo
  - Vérification synchronisation audio-visuelle

- [ ] **Analyse avancée de contenu vidéo**
  - Détection de montage manipulatoire
  - Analyse de densité de cuts et transitions
  - Identification de logos, symboles, QR codes

- [ ] **Détecteur d'ingérence étrangère**
  - Analyse de patterns de timing coordonnés
  - Détection de fermes de trolls
  - Provenance géographique suspecte

### 🌍 Phase 5 : Plateforme Communautaire (2026)
**Objectif** : Écosystème collaboratif

- [ ] **Contributions communautaires**
  - Annotations collaboratives de contenus
  - Taxonomie ouverte de techniques de manipulation
  - API publique pour intégrations tierces

- [ ] **Ressources éducatives**
  - Bibliothèque de cas d'étude annotés
  - Tutoriels sur les techniques de manipulation
  - Formation à la littératie médiatique

- [ ] **Partenariats institutionnels**
  - Intégration avec fact-checkers (AFP, Reuters, Snopes)
  - Collaborations universitaires (datasets, recherche)
  - Outils pour journalistes et éducateurs

---

## 🤝 Contribuer

Nous accueillons **toutes les contributions** ! Que vous soyez développeur, chercheur, fact-checker ou simplement intéressé par la lutte contre la désinformation.

### 🌟 Comment Contribuer

1. **Code & Features**
   - Fork le repo
   - Créez une branche (`git checkout -b feature/AmazingFeature`)
   - Committez vos changements (`git commit -m 'Add AmazingFeature'`)
   - Push vers la branche (`git push origin feature/AmazingFeature`)
   - Ouvrez une Pull Request

2. **Données & Annotations**
   - Proposez des datasets annotés de propagande/désinformation
   - Contribuez à la taxonomie de techniques de manipulation
   - Signalez des faux positifs/négatifs

3. **Documentation & Traductions**
   - Améliorez la documentation
   - Traduisez l'interface (anglais, arabe, etc.)
   - Créez des tutoriels et guides

4. **Recherche & Partenariats**
   - Proposez des collaborations académiques
   - Partagez des papers et méthodologies
   - Contactez-nous pour des intégrations

### 📧 Contact
- **Email** : [generativschool.com](mailto:contact@generativschool.com)
- **GitHub Issues** : [github.com/GenerativSchool-Lab/infoverif.org/issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)


---

## 🚀 Installation & Déploiement

### Développement Local

```bash
# Backend
cd api
pip install -r requirements-lite.txt
uvicorn main:app --reload

# Frontend
cd web
npm install
npm run dev
```

### Variables d'Environnement

Créez un fichier `.env` dans `/api` :

```bash
OPENAI_API_KEY=sk-...
PORT=8000
```

### Déploiement Production

**Backend (Railway)** :
```bash
git push origin main  # Auto-deploy activé
```

**Frontend (Vercel)** :
```bash
cd web
vercel --prod
```

---

## 📊 Architecture Technique

```
┌─────────────────────────────────────────────┐
│            Frontend (React)                 │
│  ┌──────────┬──────────┬──────────────┐    │
│  │  Text    │  Video   │  Screenshot  │    │
│  │  Input   │  Upload  │  Upload      │    │
│  └────┬─────┴────┬─────┴──────┬───────┘    │
└───────┼──────────┼────────────┼────────────┘
        │          │            │
┌───────▼──────────▼────────────▼────────────┐
│         FastAPI Backend                     │
│  ┌─────────────────────────────────────┐   │
│  │  /analyze-text                      │   │
│  │  /analyze-video (Whisper)           │   │
│  │  /analyze-image (Vision API)        │   │
│  └─────────────┬───────────────────────┘   │
└────────────────┼───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│      OpenAI GPT-4o-mini Analysis           │
│  • 9+ propaganda techniques                │
│  • 7+ conspiracy markers                   │
│  • 7+ misinfo patterns                     │
│  • Evidence extraction                     │
│  • Detailed explanations (FR)              │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│          JSON Response                      │
│  {                                          │
│    propaganda_score: 0-100,                 │
│    conspiracy_score: 0-100,                 │
│    misinfo_score: 0-100,                    │
│    techniques: [{name, evidence, ...}],     │
│    claims: [{claim, confidence, ...}],      │
│    summary: "..."                           │
│  }                                          │
└─────────────────────────────────────────────┘
```

---

## 🔬 Méthodologie

### Taxonomie des Techniques de Propagande

Notre analyse s'appuie sur des recherches académiques en communication, psychologie sociale et études médiatiques :

1. **Manipulation émotionnelle** : Appel à la peur, colère, indignation
2. **Cadrage "eux vs nous"** : Désignation de boucs émissaires, polarisation
3. **Langage chargé** : Mots sensationnalistes, déshumanisation
4. **Sélection partielle** : Cherry-picking, omission d'informations
5. **Appel à l'autorité sans preuves** : Citations hors contexte, faux experts
6. **Généralisation abusive** : Stéréotypes, sur-simplification
7. **Faux dilemmes** : Pensée binaire, élimination de nuances
8. **Déformation/exagération** : Catastrophisme, amplification
9. **Répétition** : Martèlement de messages clés

### Limitations & Avertissements

⚠️ **InfoVerif est un outil d'aide à l'analyse, pas un verdict absolu**

- Les scores sont des **indicateurs**, pas des preuves définitives
- Le contexte culturel, l'humour et la satire peuvent créer des faux positifs
- L'outil ne remplace pas le jugement critique humain
- Les explications sont générées par IA et peuvent contenir des erreurs

➡️ **Utilisez InfoVerif comme un point de départ pour approfondir votre analyse critique**

---

## 📜 License

**MIT License** - Voir [LICENSE](./LICENSE)

Ce projet est **open source** et **gratuit**. Vous êtes libre de :
- ✅ Utiliser le code à des fins commerciales
- ✅ Modifier et adapter le code
- ✅ Distribuer le code original ou modifié
- ✅ Utiliser le code à des fins privées

Sous condition de :
- 📄 Inclure la license et le copyright original
- 📄 Indiquer les modifications apportées

---

## 🙏 Remerciements

Développé avec ❤️ par le **Civic Tech AI Lab** de [GenerativSchool.com](https://generativschool.com)

**Technologies utilisées** :
- [OpenAI](https://openai.com) - GPT-4, Whisper, Vision APIs
- [React](https://react.dev) - Framework frontend
- [FastAPI](https://fastapi.tiangolo.com) - Framework backend
- [Railway](https://railway.app) - Hébergement backend
- [Vercel](https://vercel.com) - Hébergement frontend

---

**🛡️ InfoVerif** : Pour une information libre, transparente et critique.

_Un projet du Civic Tech AI Lab - [GenerativSchool.com](https://generativschool.com)_
