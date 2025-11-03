# Guide de Contribution — InfoVerif.org

Merci de votre intérêt pour contribuer à **InfoVerif** ! Ce guide vous aidera à démarrer.

---

## 📋 Table des Matières

1. [Code de Conduite](#code-de-conduite)
2. [Comment Contribuer](#comment-contribuer)
3. [Types de Contributions](#types-de-contributions)
4. [Configuration Développement](#configuration-développement)
5. [Workflow Git](#workflow-git)
6. [Standards de Code](#standards-de-code)
7. [Tests](#tests)
8. [Documentation](#documentation)
9. [Review Process](#review-process)

---

## Code de Conduite

### Notre Engagement

Nous nous engageons à faire de la participation à ce projet une expérience **respectueuse, inclusive et constructive** pour tous, indépendamment de l'âge, la taille corporelle, le handicap, l'ethnie, l'identité de genre, le niveau d'expérience, la nationalité, l'apparence personnelle, la race, la religion ou l'orientation sexuelle.

### Comportements Attendus

✅ **À faire** :
- Utiliser un langage accueillant et inclusif
- Respecter les points de vue et expériences différents
- Accepter les critiques constructives avec grâce
- Se concentrer sur ce qui est meilleur pour la communauté
- Faire preuve d'empathie envers les autres membres

❌ **À éviter** :
- Langage ou imagerie sexualisés, attention non sollicitée
- Trolling, commentaires insultants/désobligeants, attaques personnelles ou politiques
- Harcèlement public ou privé
- Publication d'informations privées d'autrui sans permission
- Autre conduite inappropriée dans un contexte professionnel

### Application

Les cas de comportement abusif, harcelant ou inacceptable peuvent être signalés en contactant **contact@generativschool.com**. Toutes les plaintes seront examinées et enquêtées, et donneront lieu à une réponse jugée nécessaire et appropriée.

---

## Comment Contribuer

### Processus Général

1. **🔍 Parcourir les Issues** : Consultez [GitHub Issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues) pour trouver des tâches ouvertes
2. **💬 Discuter** : Pour les contributions majeures, ouvrez d'abord une issue pour discuter de vos idées
3. **🍴 Fork** : Fork le repo sur votre compte GitHub
4. **🌿 Branch** : Créez une branche pour votre feature/bugfix
5. **💻 Code** : Implémentez vos changements avec tests et documentation
6. **🧪 Test** : Vérifiez que tout fonctionne (tests, linters)
7. **📝 Commit** : Commits clairs suivant Conventional Commits
8. **🚀 Push** : Poussez vers votre fork
9. **🔀 Pull Request** : Ouvrez une PR vers `main` avec description détaillée
10. **👀 Review** : Répondez aux commentaires de review
11. **✅ Merge** : Une fois approuvée, votre PR sera mergée !

---

## Types de Contributions

### 1. 🐛 Signalement de Bugs

**Avant de signaler** :
- Vérifiez que le bug n'a pas déjà été signalé dans [Issues](https://github.com/GenerativSchool-Lab/infoverif.org/issues)
- Assurez-vous que c'est bien un bug (pas une limitation documentée)

**Template de Bug Report** :

```markdown
**Description du bug**
Description claire et concise du bug.

**Étapes pour reproduire**
1. Aller sur '...'
2. Cliquer sur '...'
3. Scroller jusqu'à '...'
4. Observer l'erreur

**Comportement attendu**
Description claire de ce qui devrait se passer.

**Comportement observé**
Description de ce qui se passe actuellement.

**Screenshots**
Si applicable, ajoutez des screenshots.

**Environnement**
- OS: [ex: macOS 13.0, Ubuntu 22.04]
- Navigateur: [ex: Chrome 120, Firefox 121]
- Version Node: [ex: 18.17.0]
- Version Python: [ex: 3.11.5]

**Logs**
```
[Collez les logs pertinents ici]
```

**Contexte additionnel**
Toute autre information utile.
```

### 2. 💡 Propositions de Features

**Template de Feature Request** :

```markdown
**Problème résolu**
Décrivez le problème que cette feature résoudrait.
Ex: "Je suis toujours frustré quand [...]"

**Solution proposée**
Description claire de ce que vous voulez qu'il se passe.

**Alternatives considérées**
Description des solutions alternatives que vous avez envisagées.

**Détails d'implémentation (optionnel)**
Si vous avez des idées techniques :
- Changements backend
- Changements frontend
- Nouvelles dépendances
- Impacts sur performance/sécurité

**Use cases**
Exemples concrets d'utilisation de cette feature.

**Priorité suggérée**
Low / Medium / High

**Volonté de contribuer**
[ ] Je suis prêt(e) à implémenter cette feature
[ ] J'ai besoin d'aide pour l'implémenter
[ ] Je propose uniquement l'idée
```

### 3. 💻 Contributions de Code

#### Backend (Python/FastAPI)

**Domaines** :
- 🔧 Amélioration des prompts d'analyse
- 🆕 Nouveaux endpoints (ex: `/analyze-batch`)
- ⚡ Optimisations de performance (caching, async)
- 📦 Support de nouveaux formats (PDF, audio direct)
- 🧪 Tests unitaires et intégration
- 🔐 Améliorations de sécurité

**Checklist avant PR** :
- [ ] Code suit [PEP 8](https://pep8.org/)
- [ ] Docstrings pour nouvelles fonctions/classes
- [ ] Tests unitaires pour nouvelles fonctionnalités
- [ ] Pas de credentials/secrets dans le code
- [ ] Logging approprié pour debugging
- [ ] Gestion d'erreurs robuste

#### Frontend (React/Vite)

**Domaines** :
- 🎨 Amélioration UI/UX
- 📊 Visualisations interactives (charts, graphs)
- 🌐 Internationalisation (i18n) pour multilingue
- ♿ Accessibilité (WCAG compliance)
- 📱 Responsive design (mobile)
- ⚡ Optimisations de performance

**Checklist avant PR** :
- [ ] Code suit [JavaScript Standard Style](https://standardjs.com/)
- [ ] Composants réutilisables et modulaires
- [ ] Pas de console.log() en production
- [ ] Images optimisées (WebP, lazy loading)
- [ ] Tests E2E pour flux critiques (optionnel)
- [ ] Build Vite sans warnings

### 4. 📊 Contributions de Données

**Datasets annotés** :
- Corpus de propagande (français, anglais, arabe)
- Exemples de techniques de manipulation
- Cas d'étude historiques (campagnes, élections)
- Exemples de deepfakes et manipulations vidéo

**Format attendu** :

```json
{
  "id": "unique_id",
  "content": "Texte du contenu...",
  "platform": "twitter",
  "language": "fr",
  "annotations": {
    "propaganda_techniques": [
      {
        "technique": "Manipulation émotionnelle",
        "evidence": "Citation exacte",
        "severity": "high"
      }
    ],
    "conspiracy_markers": [...],
    "misinfo_patterns": [...],
    "overall_risk": 75
  },
  "metadata": {
    "annotator": "expert_id",
    "date": "2026-01-20",
    "confidence": 0.9
  }
}
```

**Soumission** :
1. Créer un fichier `.jsonl` (une annotation par ligne)
2. Inclure méthodologie d'annotation dans `README.md`
3. Ouvrir une PR vers `data/` avec description détaillée

### 5. 📖 Documentation

**Domaines** :
- README améliorations
- Tutoriels pas-à-pas (vidéos, GIFs)
- API documentation (Swagger/OpenAPI)
- Guides pour chercheurs, journalistes, éducateurs
- Traductions (anglais, arabe, espagnol)
- Papers académiques (méthodologie, résultats)

**Standards** :
- Markdown pour documentation technique
- Langage clair et accessible
- Exemples de code fonctionnels
- Screenshots/GIFs pour UI
- Liens vers ressources externes pertinentes

### 6. 🌍 Traductions

**Langues prioritaires** :
1. **Anglais** : Interface + documentation
2. **Arabe** : Interface (support RTL)
3. **Espagnol** : Interface + documentation

**Workflow** :
```bash
# 1. Copier fichier de langue
cp web/src/locales/fr.json web/src/locales/en.json

# 2. Traduire les valeurs (pas les clés)
{
  "home.title": "InfoVerif.org",  # NE PAS CHANGER LA CLÉ
  "home.subtitle": "Advanced Analysis"  # TRADUIRE LA VALEUR
}

# 3. Tester localement
npm run dev

# 4. Ouvrir PR avec screenshots
```

---

## Configuration Développement

### Prérequis

**Backend** :
- Python 3.11+
- FFmpeg
- Clé API OpenAI (pour tests)

**Frontend** :
- Node.js 18+
- npm ou yarn

### Installation Locale

#### 1. Fork & Clone

```bash
# Fork sur GitHub (bouton "Fork")

# Clone votre fork
git clone https://github.com/VOTRE_USERNAME/infoverif.org.git
cd infoverif.org

# Ajouter upstream remote
git remote add upstream https://github.com/GenerativSchool-Lab/infoverif.org.git
```

#### 2. Backend Setup

```bash
# Installer FFmpeg
# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt install -y ffmpeg

# Windows:
# Télécharger depuis https://ffmpeg.org/download.html

# Créer environnement virtuel
cd api
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements-lite.txt

# Créer .env
cat > .env << EOF
OPENAI_API_KEY=sk-your-key-here
PORT=8000
EOF

# Lancer serveur
uvicorn main:app --reload --port 8000
```

**Test** : `curl http://localhost:8000/health`

#### 3. Frontend Setup

```bash
# Dans un nouveau terminal
cd web

# Installer dépendances
npm install

# Créer .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000
EOF

# Lancer serveur
npm run dev
```

**Test** : Ouvrir `http://localhost:5173`

---

## Workflow Git

### Branching Strategy

**Branches principales** :
- `main` : Production, toujours stable

**Branches de feature** :
- `feature/nom-feature` : Nouvelles fonctionnalités
- `fix/nom-bug` : Corrections de bugs
- `docs/nom-doc` : Documentation uniquement
- `refactor/nom-refactor` : Refactoring sans changement fonctionnel

### Cycle de Développement

```bash
# 1. Sync avec upstream
git checkout main
git pull upstream main

# 2. Créer branche de feature
git checkout -b feature/analyse-pdf

# 3. Développer (commits fréquents)
git add .
git commit -m "feat: add PDF text extraction"

git add .
git commit -m "test: add PDF extraction tests"

# 4. Sync avec upstream régulièrement
git fetch upstream
git rebase upstream/main

# 5. Push vers votre fork
git push origin feature/analyse-pdf

# 6. Ouvrir Pull Request sur GitHub
# Aller sur https://github.com/GenerativSchool-Lab/infoverif.org
# Cliquer "Compare & pull request"
```

### Conventional Commits

**Format** :
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Formatting, pas de changement logique
- `refactor`: Refactoring sans changement fonctionnel
- `perf`: Amélioration de performance
- `test`: Ajout/correction de tests
- `chore`: Maintenance (deps, config)

**Exemples** :

```bash
# Feature simple
git commit -m "feat: add PDF upload support"

# Feature avec scope
git commit -m "feat(backend): add PDF text extraction endpoint"

# Bug fix
git commit -m "fix: resolve JSON parsing error in analyze_with_gpt4"

# Breaking change
git commit -m "feat!: change API response format

BREAKING CHANGE: Response now returns 'report' instead of 'analysis'.
Update frontend to use new format."

# Documentation
git commit -m "docs: add API authentication guide"

# Refactoring
git commit -m "refactor: extract prompt logic into separate module"
```

### Pull Request Template

```markdown
## Description
Décrivez vos changements en quelques phrases.

## Motivation et Contexte
Pourquoi ce changement est-il nécessaire ? Quel problème résout-il ?
Closes #123 (si applicable)

## Type de Changement
- [ ] Bug fix (changement non-breaking qui corrige un bug)
- [ ] Nouvelle feature (changement non-breaking qui ajoute une fonctionnalité)
- [ ] Breaking change (fix ou feature qui casserait des fonctionnalités existantes)
- [ ] Documentation uniquement

## Comment Tester ?
Décrivez les étapes pour tester vos changements :
1. Aller sur '...'
2. Cliquer sur '...'
3. Vérifier que '...'

## Screenshots (si applicable)
[Ajoutez des screenshots ici]

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai effectué un self-review de mon code
- [ ] J'ai commenté les parties complexes de mon code
- [ ] J'ai mis à jour la documentation
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] J'ai ajouté des tests qui prouvent que mon fix/feature fonctionne
- [ ] Les tests unitaires passent localement
- [ ] J'ai vérifié que le build Vite fonctionne (frontend)

## Dépendances
Listez les nouvelles dépendances ajoutées (si applicable).

## Impact
Décrivez l'impact potentiel de ce changement (performance, sécurité, etc.).
```

---

## Standards de Code

### Backend (Python)

#### Style

**PEP 8** : [https://pep8.org/](https://pep8.org/)

```python
# Bon
def analyze_text(text: str, platform: str) -> dict:
    """Analyze text content for manipulation techniques.
    
    Args:
        text: Input text to analyze
        platform: Source platform (e.g. "twitter", "facebook")
    
    Returns:
        Analysis result with scores and techniques
    
    Raises:
        ValueError: If text is empty or too short
    """
    if not text or len(text.strip()) < 10:
        raise ValueError("Text too short for analysis")
    
    # Process text
    result = process_analysis(text, platform)
    return format_response(result)

# Mauvais
def analyzeText(txt,p):  # Camel case, pas de types, pas de docstring
    if not txt:return None  # Pas d'espace, return inline
    result=process(txt,p)  # Pas d'espaces autour =
    return result
```

#### Type Hints

```python
from typing import Dict, List, Optional

def analyze_with_gpt4(
    transcript: str, 
    metadata: Dict[str, str]
) -> Dict[str, any]:
    """Type hints pour tous les paramètres et retours."""
    pass

def transcribe_audio(audio_path: str) -> Optional[str]:
    """Optional pour valeurs possiblement None."""
    pass
```

#### Error Handling

```python
# Bon
try:
    result = risky_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {str(e)}")
    raise ValueError(f"Failed to process: {str(e)}") from e

# Mauvais
try:
    result = risky_operation()
except:  # Trop large, masque les erreurs
    pass  # Erreur ignorée silencieusement
```

#### Logging

```python
import logging

logger = logging.getLogger(__name__)

# Bon
logger.info(f"Processing video: {video_id}")
logger.warning(f"Transcription short: {len(transcript)} chars")
logger.error(f"FFmpeg failed: {str(error)}", exc_info=True)

# Éviter
print(f"Debug: {variable}")  # Utiliser logger.debug() à la place
```

### Frontend (JavaScript/React)

#### Style

**JavaScript Standard Style** : [https://standardjs.com/](https://standardjs.com/)

```jsx
// Bon
export default function Home() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await axios.post(endpoint, formData)
      navigate('/report', { state: { report: response.data } })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container">
      {/* Content */}
    </div>
  )
}

// Mauvais
function home() {  // Majuscule pour composants React
  var loading = false  // Utiliser const/let, pas var
  
  function handleSubmit(e) {  // Pas de async, pas de error handling
    axios.post(endpoint, data)
    navigate('/report')
  }
  
  return <div>{/* ... */}</div>
}
```

#### Composants

```jsx
// Bon : Composant fonctionnel avec hooks
import { useState, useEffect } from 'react'

export default function AnalysisCard({ report }) {
  const [expanded, setExpanded] = useState(false)
  
  useEffect(() => {
    console.log('Report updated:', report.id)
  }, [report])
  
  return (
    <div className="card">
      <h2>{report.title}</h2>
      {expanded && <Details report={report} />}
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Réduire' : 'Développer'}
      </button>
    </div>
  )
}

// Mauvais : Classe component (legacy)
class AnalysisCard extends React.Component {
  // Préférer functional components avec hooks
}
```

#### Props Validation

```jsx
import PropTypes from 'prop-types'

AnalysisCard.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    scores: PropTypes.object.isRequired
  }).isRequired,
  onExpand: PropTypes.func
}

AnalysisCard.defaultProps = {
  onExpand: () => {}
}
```

---

## Tests

### Backend (pytest)

```bash
# Installer pytest
pip install pytest pytest-asyncio pytest-cov

# Lancer tests
cd api
pytest tests/ -v

# Avec coverage
pytest tests/ --cov=. --cov-report=html
```

**Exemple de test** :

```python
# tests/test_deep.py
import pytest
from api.deep import analyze_with_gpt4, sanitize_text

def test_sanitize_text():
    """Test text sanitization."""
    assert sanitize_text("  hello  ") == "hello"
    assert len(sanitize_text("a" * 20000)) == 10000  # Max length

def test_analyze_with_gpt4_valid_input():
    """Test GPT-4 analysis with valid input."""
    text = "Les médias mainstream cachent la vérité !"
    metadata = {"platform": "text", "title": "Test", "description": "Test"}
    
    result = analyze_with_gpt4(text, metadata)
    
    assert "propaganda_score" in result
    assert result["propaganda_score"] > 0
    assert len(result["techniques"]) > 0

@pytest.mark.asyncio
async def test_analyze_text_endpoint():
    """Test /analyze-text endpoint."""
    from fastapi.testclient import TestClient
    from api.main import app
    
    client = TestClient(app)
    response = client.post(
        "/analyze-text",
        data={"text": "Test content", "platform": "text"}
    )
    
    assert response.status_code == 200
    assert response.json()["success"] == True
```

### Frontend (Vitest)

```bash
# Installer vitest
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Lancer tests
cd web
npm run test
```

**Exemple de test** :

```javascript
// web/src/components/__tests__/Equation.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Equation from '../Equation'

describe('Equation', () => {
  it('renders LaTeX equation', () => {
    render(<Equation expr="E = mc^2" />)
    expect(screen.getByText(/mc/)).toBeInTheDocument()
  })
  
  it('handles display mode', () => {
    const { container } = render(<Equation expr="x = 5" display={true} />)
    expect(container.firstChild).toHaveClass('my-4')
  })
})
```

---

## Documentation

### Docstrings (Python)

```python
def analyze_with_gpt4(transcript: str, metadata: Dict) -> Dict:
    """Analyze content using OpenAI GPT-4 with JSON mode.
    
    This function sends the transcript and metadata to GPT-4o-mini
    with a structured prompt to detect propaganda, conspiracy markers,
    and misinformation patterns. The response is parsed as JSON.
    
    Args:
        transcript: Text content to analyze (max 8000 chars)
        metadata: Dictionary containing:
            - platform (str): Source platform (e.g. "youtube")
            - title (str): Content title or "N/A"
            - description (str): Content description or "N/A"
    
    Returns:
        Dictionary containing:
            - propaganda_score (int): 0-100
            - conspiracy_score (int): 0-100
            - misinfo_score (int): 0-100
            - overall_risk (int): 0-100
            - techniques (List[dict]): Detected techniques
            - claims (List[dict]): Analyzed claims
            - summary (str): Overall analysis summary
    
    Raises:
        ValueError: If OpenAI returns empty/invalid response
        RuntimeError: If JSON parsing fails after cleaning
    
    Example:
        >>> metadata = {"platform": "twitter", "title": "Post", "description": "N/A"}
        >>> result = analyze_with_gpt4("Les médias mentent !", metadata)
        >>> result["propaganda_score"]
        75
    """
    # Implementation...
```

### JSDoc (JavaScript)

```javascript
/**
 * Analyze content via backend API
 * 
 * @param {string} endpoint - API endpoint URL
 * @param {FormData} formData - Form data with text/video/image
 * @returns {Promise<Object>} Analysis result
 * @throws {Error} If API request fails
 * 
 * @example
 * const formData = new FormData()
 * formData.append('text', 'Content to analyze')
 * const result = await analyzeContent('/analyze-text', formData)
 */
async function analyzeContent(endpoint, formData) {
  const response = await axios.post(endpoint, formData)
  return response.data
}
```

---

## Review Process

### Pour les Contributeurs

**Après avoir ouvert une PR** :

1. **Attendre review** : Mainteneurs examineront dans 2-5 jours
2. **Répondre aux commentaires** : Discussions constructives
3. **Effectuer les modifications** : Commits additionnels sur la même branche
4. **Re-request review** : Une fois changements effectués
5. **Merge** : Mainteneurs mergeront quand tout est OK

**Patience** : Reviews prennent du temps, merci de votre compréhension !

### Pour les Reviewers

**Checklist de Review** :

- [ ] **Clarté** : Code lisible et bien commenté ?
- [ ] **Correctness** : Logique correcte, edge cases gérés ?
- [ ] **Tests** : Tests unitaires passent, nouveaux tests ajoutés ?
- [ ] **Performance** : Pas de régressions de performance ?
- [ ] **Sécurité** : Pas de vulnérabilités (injection, XSS, etc.) ?
- [ ] **Style** : Suit les standards du projet ?
- [ ] **Documentation** : Docstrings/comments à jour ?
- [ ] **Breaking changes** : Documentés si présents ?

**Tone** : Reviews constructives et bienveillantes 😊

---

## Questions ?

- **GitHub Discussions** : [github.com/GenerativSchool-Lab/infoverif.org/discussions](https://github.com/GenerativSchool-Lab/infoverif.org/discussions)
- **Email** : contact@generativschool.com
- **Twitter/X** : [@GenerativSchool](https://twitter.com/GenerativSchool)

---

**Merci pour votre contribution ! Ensemble, construisons un outil transparent et éducatif pour détecter la manipulation médiatique.** 🛡️

---

_Un projet du Civic Tech AI Lab — [GenerativSchool.com](https://generativschool.com)_

