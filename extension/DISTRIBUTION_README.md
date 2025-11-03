# InfoVerif Chrome Extension — Installation Guide

**Version** : 1.0.0  
**Status** : Alpha Release  
**Platforms** : Twitter/X, TikTok  
**Language** : Français

---

## 📋 À Propos

L'extension InfoVerif permet d'analyser **directement sur les réseaux sociaux** les contenus (posts, vidéos) avec la **taxonomie DIMA** (130 techniques de manipulation).

### ✅ Fonctionnalités

- **Twitter/X** : Analyse de tweets (texte + vidéo) via hover detection
- **TikTok** : Analyse de vidéos sur tous types de pages (vidéo, feed, recherche)
- **Panel flottant** : Résultats d'analyse avec scores, techniques DIMA, affirmations
- **Multimodal fusion** : Combine texte du post + transcription vidéo pour analyse plus précise
- **Cache intelligent** : Réduit les appels API (5 minutes TTL)

### 🛡️ Confidentialité

- ✅ **Aucun stockage permanent** : Analyses éphémères uniquement
- ✅ **Pas de tracking** : Aucune donnée utilisateur collectée
- ✅ **Open source** : Code auditable sur GitHub
- ✅ **Server-side analysis** : Toutes les analyses via API InfoVerif

---

## 🚀 Installation (Chrome / Edge / Brave)

### Étape 1 : Télécharger l'Extension

**Option A : Depuis GitHub (Recommandé)**

```bash
# Cloner ou télécharger le repo
git clone https://github.com/GenerativSchool-Lab/infoverif-extension.git
cd infoverif-extension
```

**Option B : Télécharger ZIP**

1. Aller sur : https://github.com/GenerativSchool-Lab/infoverif-extension
2. Cliquer **"Code"** → **"Download ZIP"**
3. Extraire le dossier `infoverif-extension-main`

---

### Étape 2 : Charger l'Extension (Mode Développeur)

1. **Ouvrir Chrome** (ou Edge, Brave)

2. **Aller sur la page Extensions** :
   ```
   chrome://extensions/
   ```
   
   Ou via menu :
   - **Chrome** : Menu (⋮) → **Extensions** → **Gérer les extensions**
   - **Edge** : Menu (⋯) → **Extensions**
   - **Brave** : Menu → **Extensions**

3. **Activer le Mode Développeur** :
   - Chercher le toggle **"Mode développeur"** en haut à droite
   - **Activer** le toggle

4. **Charger l'Extension** :
   - Cliquer **"Charger l'extension non empaquetée"** (ou **"Load unpacked"**)
   - Naviguer vers le dossier `infoverif-extension` téléchargé
   - Sélectionner le dossier et cliquer **"Sélectionner le dossier"** (ou **"Select Folder"**)

5. **Vérification** :
   - L'extension **InfoVerif** devrait apparaître dans la liste
   - Une icône 🛡️ devrait apparaître dans la barre d'outils Chrome

---

### Étape 3 : Autoriser les Permissions

Au premier chargement, Chrome demandera des permissions :

1. **Permissions requises** :
   - ✅ **Accéder aux données des sites** (Twitter, TikTok)
   - ✅ **Stockage local** (cache des analyses)
   - ✅ **Onglets actifs** (détection de la plateforme)

2. **Cliquer "Ajouter l'extension"** (ou **"Add extension"**)

---

## 📖 Guide d'Utilisation

### Sur Twitter/X

1. **Aller sur** : https://twitter.com ou https://x.com

2. **Survoler un tweet** :
   - Passez la souris sur un tweet dans votre timeline
   - Un bouton **"Analyser avec InfoVerif"** apparaît en haut à droite du tweet

3. **Cliquer "Analyser"** :
   - Le panel flottant InfoVerif s'ouvre à droite de l'écran
   - État de chargement : "Analyse en cours..."
   - Après analyse : Rapport complet avec scores, techniques DIMA, affirmations

4. **Résultats** :
   - **Scores** : Indice d'influence, Intensité persuasive, Narratif spéculatif, Fiabilité factuelle
   - **Techniques DIMA** : Codes `[TE-XX]`, familles, preuves, explications
   - **Affirmations** : Analyse factuelle des claims
   - **Synthèse** : Résumé de l'analyse

### Sur TikTok

1. **Aller sur** : https://tiktok.com

2. **Bouton fixe** :
   - Un bouton **"Analyser avec InfoVerif"** apparaît en bas à gauche
   - Visible sur toutes les pages (vidéo individuelle, feed, recherche, profil)

3. **Cliquer "Analyser"** :
   - Analyse la vidéo actuellement visible
   - Combine texte de la description + transcription audio
   - Affiche le rapport dans le panel flottant

4. **Navigation** :
   - Le bouton persiste quand vous scroll dans le feed
   - Chaque clic analyse la vidéo actuellement à l'écran

---

## 🎨 Interface

### Panel Flottant

Le panel flottant affiche :

1. **📄 Contenu analysé** : Résumé objectif du contenu
2. **📊 Scores d'analyse** : 4 barres de progression (0-100)
3. **🎯 Techniques DIMA** : Liste des techniques détectées avec codes
4. **✓ Affirmations** : Analyse factuelle
5. **🔗 Synergies** : Interactions entre techniques (si applicable)
6. **📝 Synthèse** : Résumé détaillé

### Contrôles

- **Minimiser** (bouton `−`) : Réduit le panel
- **Fermer** (bouton `×`) : Cache le panel
- **Drag & Drop** : Déplacer le panel en glissant le header
- **Resize** : Redimensionner en glissant le coin inférieur droit

### Actions

- **📋 Copier JSON** : Exporte le rapport complet en JSON
- **📄 Copier synthèse** : Copie le texte de synthèse

---

## 🔧 Configuration

### Backend API

Par défaut, l'extension utilise l'API de production :
```
https://infoveriforg-production.up.railway.app
```

### Configuration Locale (Développement)

Si vous développez localement, modifiez `shared/constants.js` :

```javascript
// shared/constants.js
const API_URL = process.env.API_URL || 'http://localhost:8000';
```

Puis rechargez l'extension.

---

## 🐛 Dépannage

### L'extension ne s'installe pas

**Problème** : "Impossible de charger l'extension"

**Solutions** :
1. Vérifier que le **Mode développeur** est activé
2. Vérifier que vous sélectionnez le **dossier** contenant `manifest.json` (pas un sous-dossier)
3. Vérifier les erreurs dans `chrome://extensions/` (icône "Erreurs")

---

### Le bouton n'apparaît pas sur Twitter

**Problème** : Aucun bouton "Analyser" visible

**Solutions** :
1. **Rafraîchir la page** (F5 ou Cmd+R)
2. Vérifier que l'extension est **activée** dans `chrome://extensions/`
3. Ouvrir la **Console** (F12) et chercher les erreurs `[InfoVerif]`
4. Vérifier que vous êtes sur **twitter.com** ou **x.com** (pas sur une page générique)

---

### Le bouton n'apparaît pas sur TikTok

**Problème** : Bouton manquant sur TikTok

**Solutions** :
1. Attendre 2-3 secondes (détection automatique après chargement)
2. Vérifier la **Console** (F12) pour erreurs
3. Rafraîchir la page si nécessaire

---

### L'analyse ne démarre pas

**Problème** : "Analyse en cours..." reste bloqué

**Solutions** :
1. Vérifier la **Console** (F12) → onglet "Console"
2. Chercher les erreurs `[InfoVerif]`
3. Vérifier la connexion internet
4. Vérifier que l'API backend est accessible :
   ```
   https://infoveriforg-production.up.railway.app/health
   ```

---

### Erreur "Extension context invalidated"

**Problème** : Message d'erreur après rechargement de l'extension

**Solution** :
- **Rafraîchir la page** du réseau social (F5)
- L'extension a été rechargée, la page doit se reconnecter

---

### Le panel flottant est invisible

**Problème** : Panel ne s'affiche pas après analyse

**Solutions** :
1. Vérifier la **Console** (F12) → messages `[InfoVerif Panel]`
2. Essayer de **fermer puis ré-analyser**
3. Vérifier que `ui/floating-panel.html` existe dans le dossier extension

---

## 📝 Notes Techniques

### Architecture

- **Manifest V3** : Service worker (pas de background persistent)
- **Content Scripts** : Injection dans pages Twitter/TikTok
- **Floating Panel** : UI injectée dans le DOM de la page
- **API Communication** : Via `chrome.runtime.sendMessage()`

### Fichiers Clés

```
extension/
├── manifest.json              # Configuration MV3
├── background-bundle.js        # Service worker
├── contentScript-bundle.js    # DOM extraction
├── ui/
│   ├── floating-panel.html    # Panel UI
│   ├── floating-panel.js     # Panel logic
│   └── floating-panel.css    # Panel styles
├── styles/
│   └── content.css           # Styles overlay
└── icons/                     # Icônes extension
```

---

## 🔄 Mises à Jour

### Mettre à Jour l'Extension

1. **Télécharger la nouvelle version** depuis GitHub :
   ```bash
   git pull origin main
   # ou re-télécharger le ZIP
   ```

2. **Recharger l'extension** :
   - Aller sur `chrome://extensions/`
   - Trouver **InfoVerif**
   - Cliquer l'icône **🔄 Recharger** (ou **Reload**)

3. **Rafraîchir les pages** ouvertes (Twitter/TikTok) avec F5

---

## 🐛 Signaler un Bug

Si vous rencontrez un problème :

1. **Ouvrir une Issue** sur GitHub :
   - https://github.com/GenerativSchool-Lab/infoverif-extension/issues

2. **Inclure** :
   - Description du problème
   - Étapes pour reproduire
   - Captures d'écran (si pertinent)
   - Messages d'erreur de la Console (F12)

---

## 📚 Documentation Complète

- **Repo principal** : https://github.com/GenerativSchool-Lab/infoverif.org
- **Documentation complète** : [DOCUMENTATION_INDEX.md](https://github.com/GenerativSchool-Lab/infoverif.org/blob/main/DOCUMENTATION_INDEX.md)
- **Architecture** : [ARCHITECTURE_AND_PROCESS.md](https://github.com/GenerativSchool-Lab/infoverif.org/blob/main/docs/ARCHITECTURE_AND_PROCESS.md)

---

## 🤝 Contribuer

Les contributions sont bienvenues ! Voir [CONTRIBUTING.md](https://github.com/GenerativSchool-Lab/infoverif.org/blob/main/CONTRIBUTING.md)

---

## 📜 License

**MIT License** — Voir [LICENSE](https://github.com/GenerativSchool-Lab/infoverif.org/blob/main/LICENSE)

---

**Développé par** : [Civic Tech AI Lab — GenerativSchool](https://generativschool.com)

**Support** : [GitHub Issues](https://github.com/GenerativSchool-Lab/infoverif-extension/issues)

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026

