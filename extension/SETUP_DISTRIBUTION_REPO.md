# Setup — Extension Distribution Repo

**Guide pour créer et configurer le repo GitHub de distribution**

---

## 🎯 Objectif

Créer un repo GitHub public (`infoverif-extension`) qui contient uniquement les fichiers nécessaires pour installer l'extension Chrome, séparé du repo principal.

---

## 📋 Étapes

### 1. Créer le Repo GitHub

1. **Aller sur** : https://github.com/new

2. **Configuration** :
   - **Repository name** : `infoverif-extension`
   - **Description** : "InfoVerif Chrome Extension — Analyse de propagande et désinformation sur Twitter et TikTok"
   - **Visibility** : ✅ **Public** (pour permettre téléchargement)
   - **Initialize** : ❌ Ne pas initialiser avec README (on va le copier)

3. **Créer le repo**

---

### 2. Clone Local

```bash
cd /Volumes/LaCie/Dev
git clone https://github.com/GenerativSchool-Lab/infoverif-extension.git
cd infoverif-extension
```

---

### 3. Première Synchronisation

```bash
# Depuis le repo principal
cd /Volumes/LaCie/Dev/infoverif.org

# Exécuter le script de sync
./scripts/sync_extension_repo.sh
```

Le script va :
- ✅ Copier tous les fichiers nécessaires
- ✅ Créer la structure de dossiers
- ✅ Commit initial

---

### 4. Push Initial

```bash
cd /Volumes/LaCie/Dev/infoverif-extension

# Vérifier les fichiers
git status

# Push
git push -u origin main
```

---

### 5. Vérification

1. **GitHub** : Vérifier que tous les fichiers sont présents
2. **README** : Le README.md devrait être affiché sur la page principale
3. **Structure** : Vérifier la structure des dossiers (`ui/`, `styles/`, `icons/`)

---

## 📝 Configuration GitHub

### Description du Repo

**Sur la page du repo GitHub**, éditer la description :

```
InfoVerif Chrome Extension — Analyse de propagande et désinformation sur Twitter et TikTok avec la taxonomie DIMA (130 techniques)
```

### Topics (Tags)

Ajouter les topics suivants :
- `chrome-extension`
- `manifest-v3`
- `misinformation-detection`
- `dima-framework`
- `fact-checking`
- `media-literacy`

### Website

**URL du repo principal** :
```
https://github.com/GenerativSchool-Lab/infoverif.org
```

---

## 📦 Releases

### Créer Release v1.0.0

1. **Tag** :
   ```bash
   cd /Volumes/LaCie/Dev/infoverif-extension
   git tag -a v1.0.0 -m "Release 1.0.0 — Alpha"
   git push origin v1.0.0
   ```

2. **Créer Release sur GitHub** :
   - Aller sur : https://github.com/GenerativSchool-Lab/infoverif-extension/releases/new
   - **Tag** : `v1.0.0`
   - **Title** : "InfoVerif Extension v1.0.0 (Alpha)"
   - **Description** :
     ```markdown
     ## 🎉 Première Release Alpha
     
     ### Fonctionnalités
     - ✅ Support Twitter/X (hover detection)
     - ✅ Support TikTok (bouton fixe)
     - ✅ Panel flottant avec résultats DIMA
     - ✅ Multimodal fusion (texte + vidéo)
     - ✅ Cache intelligent (5 min TTL)
     
     ### Installation
     Voir [README.md](README.md) pour instructions complètes.
     ```

3. **Attacher ZIP** :
   - Créer archive :
     ```bash
     cd /Volumes/LaCie/Dev/infoverif-extension
     zip -r infoverif-extension-v1.0.0.zip . \
       -x "*.git*" \
       -x ".DS_Store"
     ```
   - Uploader sur GitHub Release

---

## 🔄 Maintenance Continue

### Après chaque modification de l'extension

```bash
# 1. Tester dans le repo principal
cd /Volumes/LaCie/Dev/infoverif.org
# ... tester l'extension ...

# 2. Sync
./scripts/sync_extension_repo.sh

# 3. Push
cd ../infoverif-extension
git push origin main
```

### Avant chaque release

Voir checklist dans `extension/MAINTENANCE.md`

---

## 🔗 Liens Utiles

- **Repo principal** : https://github.com/GenerativSchool-Lab/infoverif.org
- **Repo distribution** : https://github.com/GenerativSchool-Lab/infoverif-extension
- **Documentation complète** : https://github.com/GenerativSchool-Lab/infoverif.org/blob/main/DOCUMENTATION_INDEX.md

---

**Créé** : Janvier 2026

