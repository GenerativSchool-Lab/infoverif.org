# Maintenance — Extension Distribution Repo

**Guide pour maintenir le repo de distribution de l'extension** (`infoverif-extension`)

---

## 🎯 Objectif

Le repo `infoverif-extension` est un **repo de distribution** qui contient uniquement les fichiers nécessaires pour installer l'extension Chrome. Le code source principal reste dans `infoverif.org`.

**Workflow** :
```
infoverif.org (main repo)
    ↓ (sync)
infoverif-extension (distribution repo)
    ↓ (download)
Users install extension
```

---

## 📋 Structure du Repo de Distribution

```
infoverif-extension/
├── README.md                  # Guide d'installation (copié de DISTRIBUTION_README.md)
├── LICENSE                    # MIT License
├── manifest.json              # Configuration extension
├── background-bundle.js       # Service worker
├── contentScript-bundle.js    # Content script
├── styles/
│   └── content.css           # Styles overlay
├── ui/
│   ├── floating-panel.html   # Panel HTML
│   ├── floating-panel.js      # Panel logic
│   └── floating-panel.css    # Panel styles
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

**Note** : Les fichiers sources (`background.js`, `contentScript.js`, etc.) ne sont **pas** inclus (seulement les bundles).

---

## 🔄 Synchronisation

### Automatique (Script)

```bash
# Depuis le repo principal
cd /Volumes/LaCie/Dev/infoverif.org
./scripts/sync_extension_repo.sh
```

Le script :
1. ✅ Copie tous les fichiers nécessaires
2. ✅ Crée la structure de dossiers
3. ✅ Commit avec message descriptif
4. ✅ Prêt pour `git push`

### Manuelle

Si besoin, copier manuellement :

```bash
# 1. Fichiers à copier
cp extension/manifest.json ../infoverif-extension/
cp extension/background-bundle.js ../infoverif-extension/
cp extension/contentScript-bundle.js ../infoverif-extension/
cp extension/styles/content.css ../infoverif-extension/styles/
cp extension/ui/floating-panel.* ../infoverif-extension/ui/
cp extension/icons/icon*.png ../infoverif-extension/icons/
cp extension/DISTRIBUTION_README.md ../infoverif-extension/README.md
cp LICENSE ../infoverif-extension/

# 2. Commit
cd ../infoverif-extension
git add -A
git commit -m "chore: Sync extension v1.0.0"
git push origin main
```

---

## 📝 Checklist de Release

Avant de synchroniser une nouvelle version :

- [ ] **Tester l'extension** :
  - [ ] Twitter : Bouton apparaît, analyse fonctionne
  - [ ] TikTok : Bouton apparaît, analyse fonctionne
  - [ ] Panel flottant : S'affiche, draggable, ferme correctement
  - [ ] Cache : Fonctionne (re-analyser même post = instant)

- [ ] **Vérifier les fichiers** :
  - [ ] `manifest.json` : Version correcte
  - [ ] `background-bundle.js` : Existe et fonctionne
  - [ ] `contentScript-bundle.js` : Existe et fonctionne
  - [ ] `ui/floating-panel.*` : Tous les 3 fichiers présents
  - [ ] `icons/*.png` : Tous les 4 icônes présents

- [ ] **Mettre à jour le README** :
  - [ ] Version dans `DISTRIBUTION_README.md`
  - [ ] Date de dernière mise à jour
  - [ ] Changelog si nouvelles fonctionnalités

- [ ] **Sync** :
  - [ ] Exécuter `./scripts/sync_extension_repo.sh`
  - [ ] Vérifier le commit
  - [ ] Push vers GitHub

---

## 🔧 Configuration du Repo GitHub

### Créer le Repo

1. **GitHub** : Créer nouveau repo `infoverif-extension`
2. **Public** : Pour permettre téléchargement
3. **README** : Copier depuis `DISTRIBUTION_README.md`

### Configuration Initiale

```bash
# Depuis le repo principal, après premier sync
cd ../infoverif-extension

# Ajouter remote
git remote add origin https://github.com/GenerativSchool-Lab/infoverif-extension.git

# Push initial
git push -u origin main
```

### GitHub Actions (Optionnel)

Créer `.github/workflows/sync.yml` pour sync automatique :

```yaml
name: Sync from Main Repo

on:
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          repository: GenerativSchool-Lab/infoverif.org
          path: main-repo
      
      - uses: actions/checkout@v3
        with:
          repository: GenerativSchool-Lab/infoverif-extension
          path: extension-repo
      
      - name: Sync files
        run: |
          cp main-repo/extension/manifest.json extension-repo/
          cp main-repo/extension/background-bundle.js extension-repo/
          # ... etc
      
      - name: Commit and push
        run: |
          cd extension-repo
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add -A
          git commit -m "chore: Sync from main repo"
          git push
```

---

## 📦 Releases GitHub

### Créer une Release

1. **Tag la version** :
   ```bash
   cd ../infoverif-extension
   git tag -a v1.0.0 -m "Release 1.0.0"
   git push origin v1.0.0
   ```

2. **Créer Release GitHub** :
   - Aller sur GitHub → Releases → "Draft a new release"
   - Tag : `v1.0.0`
   - Titre : "InfoVerif Extension v1.0.0"
   - Description : Changelog
   - **Attacher ZIP** : `infoverif-extension.zip` (archive du repo)

3. **Packaging ZIP** :
   ```bash
   cd ../infoverif-extension
   zip -r infoverif-extension-v1.0.0.zip . \
     -x "*.git*" \
     -x "*.md" \
     -x "*.sh"
   ```

---

## 🐛 Troubleshooting

### Sync Script Fails

**Erreur** : "Repo de distribution non trouvé"

**Solution** :
```bash
mkdir -p /Volumes/LaCie/Dev/infoverif-extension
cd /Volumes/LaCie/Dev/infoverif-extension
git init
git remote add origin https://github.com/GenerativSchool-Lab/infoverif-extension.git
```

---

### Fichiers Manquants après Sync

**Vérifier** :
1. Les fichiers existent dans `extension/`
2. Les noms de fichiers sont corrects (case-sensitive)
3. Les bundles sont générés (`background-bundle.js`, pas `background.js`)

---

### Git Push Fails

**Vérifier** :
1. Remote configuré : `git remote -v`
2. Permissions GitHub : Accès en écriture au repo
3. Branch : `git branch` (devrait être `main`)

---

## 📚 Documentation

- **Distribution README** : `extension/DISTRIBUTION_README.md` → `infoverif-extension/README.md`
- **Main repo docs** : https://github.com/GenerativSchool-Lab/infoverif.org

---

**Dernière mise à jour** : Janvier 2026

