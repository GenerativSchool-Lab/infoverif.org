# Guide de Démarrage Rapide — InfoVerif.org ⚡

Ce guide vous permet de lancer **InfoVerif** localement en **5 minutes**.

---

## 📋 Prérequis

- **Python** 3.11+ installé
- **Node.js** 18+ installé
- **FFmpeg** installé
- **Clé API OpenAI** (avec accès GPT-4o-mini, Whisper, Vision)

---

## ⚡ Installation Express

### 1. Clone le Repo

```bash
git clone https://github.com/GenerativSchool-Lab/infoverif.org.git
cd infoverif.org
```

### 2. Backend (Terminal 1)

```bash
# Installer FFmpeg (si pas déjà fait)
# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt install -y ffmpeg

# Windows: Télécharger depuis https://ffmpeg.org/download.html

# Setup Python
cd api
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements-lite.txt

# Configuration
echo "OPENAI_API_KEY=sk-votre-clé-ici" > .env
echo "PORT=8000" >> .env

# Lancer
uvicorn main:app --reload --port 8000
```

✅ Backend prêt sur : `http://localhost:8000`

### 3. Frontend (Terminal 2)

```bash
# Setup Node
cd web
npm install

# Configuration
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Lancer
npm run dev
```

✅ Frontend prêt sur : `http://localhost:5173`

---

## 🧪 Test Rapide

### 1. Health Check

```bash
curl http://localhost:8000/health
# {"status": "healthy"}
```

### 2. Test OpenAI

```bash
curl http://localhost:8000/test-openai
# {"openai_status": "connected", ...}
```

### 3. Analyse de Texte

```bash
curl -X POST http://localhost:8000/analyze-text \
  -F 'text=Les médias mainstream cachent la vérité ! Réveillez-vous !' \
  -F 'platform=text' | jq .
```

### 4. Interface Web

1. Ouvrir `http://localhost:5173`
2. Cliquer sur l'onglet **Texte**
3. Coller un texte de test
4. Cliquer **"Lancer l'analyse"**
5. Observer les résultats (scores, techniques, affirmations)

---

## 📊 Exemple de Réponse API

```json
{
  "success": true,
  "input": {
    "platform": "text",
    "title": "N/A",
    "description": "N/A"
  },
  "report": {
    "propaganda_score": 75,
    "conspiracy_score": 60,
    "misinfo_score": 45,
    "overall_risk": 60,
    "techniques": [
      {
        "name": "Manipulation émotionnelle",
        "evidence": "Réveillez-vous !",
        "severity": "high",
        "explanation": "Utilisation d'un appel émotionnel urgentiste..."
      },
      {
        "name": "Défiance institutionnelle",
        "evidence": "Les médias mainstream cachent la vérité",
        "severity": "high",
        "explanation": "Rhétorique conspirationniste ciblant les médias..."
      }
    ],
    "claims": [
      {
        "claim": "Les médias mainstream cachent la vérité",
        "confidence": "unsupported",
        "issues": ["Affirmation non sourcée", "Généralisation abusive"],
        "reasoning": "Aucune preuve fournie, généralisation de tous les médias..."
      }
    ],
    "summary": "Ce contenu présente un niveau élevé de rhétorique conspirationniste avec manipulation émotionnelle et défiance institutionnelle envers les médias. L'absence de sources et les affirmations non étayées renforcent le caractère manipulatoire du message."
  }
}
```

---

## 🎨 Interface Utilisateur

### Page d'Accueil (3 Onglets)

**Onglet Texte** :
- Textarea pour coller/écrire du texte
- Support posts, articles, messages, scripts

**Onglet Vidéo** :
- Upload drag-and-drop
- Formats supportés : MP4, MOV, AVI (< 60 Mo)
- Transcription automatique via Whisper

**Onglet Capture** :
- Upload drag-and-drop
- Formats supportés : PNG, JPG, WEBP
- Extraction texte via Vision API

### Page de Résultats

**Scores visuels** (barres de progression) :
- **Indice d'influence** : Score global (0-100)
- **Intensité persuasive** : Techniques de propagande
- **Narratif spéculatif** : Marqueurs conspirationnistes
- **Fiabilité factuelle** : Patterns de désinformation

**Techniques détectées** :
- Nom en français
- Citation exacte du contenu
- Niveau de sévérité (élevé/moyen/faible)
- Explication détaillée (2-3 phrases)

**Affirmations analysées** :
- Affirmation extraite
- Niveau de confiance (supportée/non supportée/trompeuse)
- Liste des problèmes identifiés
- Raisonnement du jugement

**Résumé** :
- Analyse globale en 3-4 phrases
- Impact potentiel sur l'audience

---

## 🛠️ Dépannage

### Backend ne démarre pas

**Erreur** : `ModuleNotFoundError: No module named 'fastapi'`

**Solution** :
```bash
cd api
source venv/bin/activate  # Activer le venv
pip install -r requirements-lite.txt
```

---

**Erreur** : `FileNotFoundError: FFmpeg not found`

**Solution** :
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install -y ffmpeg

# Vérifier installation
ffmpeg -version
```

---

**Erreur** : `OpenAI API key not found`

**Solution** :
```bash
cd api
echo "OPENAI_API_KEY=sk-votre-clé-ici" > .env
```

Obtenez une clé API sur : [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

### Frontend ne démarre pas

**Erreur** : `command not found: npm`

**Solution** :
```bash
# Installer Node.js
# macOS:
brew install node

# Ubuntu/Debian:
sudo apt install -y nodejs npm

# Windows: Télécharger depuis https://nodejs.org/
```

---

**Erreur** : `Network Error` lors de l'analyse

**Solution** :
```bash
# Vérifier que le backend tourne
curl http://localhost:8000/health

# Vérifier la configuration
cat web/.env.local
# VITE_API_URL=http://localhost:8000  (doit être correct)
```

---

### Analyse échoue

**Erreur** : `analyze-text failed: KeyError`

**Solution** : Problème de prompt (déjà corrigé dans version actuelle). Vérifiez que vous êtes sur la dernière version :
```bash
git pull origin main
```

---

**Erreur** : `OpenAI API error: Insufficient quota`

**Solution** : Quota API OpenAI épuisé. Ajoutez du crédit sur [platform.openai.com/account/billing](https://platform.openai.com/account/billing).

---

**Erreur** : `Video too large (max 60 MB)`

**Solution** : Compressez votre vidéo :
```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 output.mp4
```

---

## 📚 Documentation Complète

Pour plus de détails :

- **README.md** : Vue d'ensemble, fonctionnalités, roadmap
- **TECHNICAL_DOCUMENTATION.md** : Architecture, API, algorithmes
- **CONTRIBUTING.md** : Guide de contribution, standards de code
- **API Docs** : `http://localhost:8000/docs` (Swagger UI)

---

## 🤝 Besoin d'Aide ?

- **GitHub Issues** : [github.com/GenerativSchool-Lab/infoverif.org/issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
- **GitHub Discussions** : [github.com/GenerativSchool-Lab/infoverif.org/discussions](https://github.com/GenerativSchool-Lab/infoverif.org/discussions)
- **Email** : contact@generativschool.com

---

## 🚀 Prochaines Étapes

### Pour Utilisateurs

1. **Tester avec différents contenus** :
   - Posts de réseaux sociaux (Twitter/X, TikTok, Instagram)
   - Articles de blog
   - Transcriptions de vidéos YouTube
   - Captures d'écran de messages

2. **Comprendre les résultats** :
   - Consulter `/method-card` pour la méthodologie
   - Lire les explications détaillées de chaque technique
   - Comparer les scores entre différents contenus

3. **Contribuer** :
   - Signaler des faux positifs/négatifs
   - Proposer des améliorations
   - Partager le projet avec votre réseau

### Pour Développeurs

1. **Explorer l'API** :
   - Tester tous les endpoints via `curl` ou Postman
   - Examiner le code source (`api/main.py`, `api/deep.py`)
   - Consulter la documentation technique

2. **Contribuer au code** :
   - Consulter [CONTRIBUTING.md](./CONTRIBUTING.md)
   - Chercher des issues marquées `good first issue`
   - Proposer des nouvelles features

3. **Améliorer les modèles** :
   - Affiner les prompts d'analyse
   - Proposer de nouvelles techniques à détecter
   - Contribuer des datasets annotés

### Pour Chercheurs

1. **Analyser la méthodologie** :
   - Consulter `/method-card` (frontend)
   - Lire le prompt d'analyse (`api/deep.py`)
   - Évaluer la taxonomie des techniques

2. **Proposer des améliorations** :
   - Références académiques pertinentes
   - Datasets annotés de qualité
   - Métriques d'évaluation

3. **Collaborer** :
   - Contacter pour partenariats de recherche
   - Proposer des publications conjointes
   - Intégrer dans vos projets de recherche

---

## 🎯 Cas d'Usage Rapides

### Analyse d'un Tweet

```bash
curl -X POST http://localhost:8000/analyze-text \
  -F 'text=🚨 ALERTE ! Le gouvernement cache la vérité sur les vaccins ! Partagez avant censure ! #ReveilToi' \
  -F 'platform=twitter' | jq .
```

**Attendu** :
- Scores élevés (propaganda, conspiracy)
- Techniques : Manipulation émotionnelle, Défiance institutionnelle, Urgence artificielle
- Claims : Affirmations non sourcées

---

### Analyse d'un Extrait de Vidéo

```bash
# Créer un fichier texte avec la transcription
echo "Dans cette vidéo, je vais vous révéler ce que les médias mainstream ne veulent pas que vous sachiez. Les élites mondiales ont un plan secret pour contrôler la population. Réveillez-vous !" > transcript.txt

# Analyser
curl -X POST http://localhost:8000/analyze-text \
  -F "text=$(cat transcript.txt)" \
  -F 'platform=youtube' | jq .
```

**Attendu** :
- Scores très élevés
- Techniques multiples : Vérité cachée, Élites secrètes, Rhétorique complotiste
- Nombreuses claims non supportées

---

### Analyse d'un Article de Fact-Checking

```bash
curl -X POST http://localhost:8000/analyze-text \
  -F 'text=Analyse : Cette affirmation virale sur les réseaux sociaux est trompeuse. Selon les données officielles de l INSEE, les chiffres cités sont sortis de leur contexte. Plusieurs experts interrogés confirment que...' \
  -F 'platform=text' | jq .
```

**Attendu** :
- Scores bas (peu de manipulation)
- Peu de techniques détectées
- Claims majoritairement supportées

---

## 📈 Métriques de Performance

### Backend

- **Health check** : < 10ms
- **Analyse texte court** (< 500 chars) : 2-4s (GPT-4o-mini)
- **Analyse vidéo** (5 min) : 30-60s (FFmpeg + Whisper + GPT-4)
- **Analyse image** : 3-6s (Vision + GPT-4)

### Frontend

- **First Contentful Paint** : < 1s
- **Time to Interactive** : < 2s
- **Bundle size** : ~300 KB (minified + gzipped)

---

## 🔐 Sécurité & Confidentialité

### Données Utilisateur

✅ **Pas de stockage permanent** : Analyses éphémères uniquement  
✅ **Pas de tracking** : Aucun cookie, aucun analytics  
✅ **Pas de profilage** : Aucune base de données utilisateurs  
✅ **Fichiers temporaires** : Supprimés immédiatement après traitement  

### API Key

⚠️ **Ne jamais exposer votre clé OpenAI** :
- Toujours dans `.env` (gitignored)
- Jamais dans le code frontend
- Jamais dans les commits Git

### Limites de Sécurité

- **Max video size** : 60 MB
- **Max image size** : 10 MB
- **Max text length** : 10,000 chars
- **Rate limiting** : Non implémenté (TODO Phase 2)

---

## 🌟 Bonnes Pratiques

### Pour des Analyses de Qualité

1. **Texte complet** : Plus de contexte = meilleure analyse
2. **Langue** : Fonctionne mieux en français (langue du prompt)
3. **Longueur** : 100-5000 chars optimal (trop court = peu de détection, trop long = tronqué)
4. **Contexte** : Inclure métadonnées si possible (titre, plateforme)

### Pour des Vidéos

1. **Qualité audio** : Audio clair pour meilleure transcription
2. **Durée** : 30s - 10 min optimal (plus long = coût Whisper élevé)
3. **Format** : MP4 recommandé (meilleure compatibilité)
4. **Taille** : < 30 MB recommandé pour upload rapide

### Pour des Images

1. **Résolution** : Minimum 800x600 pour lisibilité
2. **Texte visible** : Capture complète du post/message
3. **Format** : PNG pour screenshots (meilleure qualité)
4. **Taille** : < 5 MB recommandé

---

## 💡 Tips & Astuces

### Analyse en Masse

```bash
# Analyser plusieurs fichiers texte
for file in texts/*.txt; do
  echo "Analyzing $file..."
  curl -X POST http://localhost:8000/analyze-text \
    -F "text=$(cat $file)" \
    -F 'platform=text' > "results/$(basename $file .txt).json"
done
```

### Filtrer Résultats

```bash
# Extraire uniquement les scores élevés (> 70)
curl -X POST http://localhost:8000/analyze-text \
  -F 'text=...' | jq 'select(.report.overall_risk > 70)'
```

### Exporter au Format CSV

```bash
# Créer un CSV des techniques détectées
curl -X POST http://localhost:8000/analyze-text \
  -F 'text=...' | jq -r '.report.techniques[] | [.name, .severity, .evidence] | @csv'
```

---

## 🎓 Ressources Complémentaires

### Tutorials Vidéo

- [Installation & Setup (5 min)](https://youtube.com/placeholder)
- [Analyse de Texte (3 min)](https://youtube.com/placeholder)
- [Analyse de Vidéo (7 min)](https://youtube.com/placeholder)

### Exemples de Code

- **Python** : [examples/python_client.py](./examples/python_client.py)
- **JavaScript** : [examples/javascript_client.js](./examples/javascript_client.js)
- **Bash** : [examples/batch_analysis.sh](./examples/batch_analysis.sh)

### Intégrations

- **Plugin Chrome** : [Analyse de tweets in-browser](./extensions/chrome)
- **Bot Telegram** : [Analyse via Telegram](./bots/telegram)
- **API Python** : [SDK Python pour chercheurs](./sdk/python)

---

**✨ Vous êtes prêt ! Bon analyse et n'hésitez pas à contribuer au projet !**

---

_Un projet du Civic Tech AI Lab — [GenerativSchool.com](https://generativschool.com)_

