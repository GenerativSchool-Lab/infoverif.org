# Push Extension avec Git Subtree

**Guide pour pousser directement le dossier `extension/` vers un autre repo GitHub**

---

## 🎯 Avantages Git Subtree

✅ **Direct** : Push direct depuis le repo principal  
✅ **Automatique** : Pas besoin de copier des fichiers  
✅ **Historique** : Préserve l'historique Git (optionnel avec `--squash`)  
✅ **Simple** : Une seule commande

---

## 🚀 Setup Initial (Une Seule Fois)

### 1. Créer le Repo GitHub

1. Aller sur : https://github.com/new
2. **Repository name** : `infoverif-extension`
3. **Visibility** : ✅ **Public**
4. **Initialize** : ❌ Ne pas initialiser
5. **Créer le repo**

### 2. Ajouter Remote

```bash
cd /Volumes/LaCie/Dev/infoverif.org

# Ajouter remote pour extension
git remote add extension-dist https://github.com/GenerativSchool-Lab/infoverif-extension.git
```

---

## 📤 Push (Après chaque modification)

### Option 1 : Script Automatique (Recommandé)

```bash
cd /Volumes/LaCie/Dev/infoverif.org
./scripts/push_extension_repo.sh
```

Le script :
- ✅ Vérifie que `extension/` existe
- ✅ Ajoute le remote si nécessaire
- ✅ Push avec `git subtree push`
- ✅ Gère les erreurs et propose solutions

### Option 2 : Commande Manuelle

```bash
cd /Volumes/LaCie/Dev/infoverif.org

# Push direct (avec squash pour un commit propre)
git subtree push --prefix=extension extension-dist main --squash
```

---

## 🔧 Détails Techniques

### Git Subtree Push

**Commande de base** :
```bash
git subtree push --prefix=extension extension-dist main --squash
```

**Options** :
- `--prefix=extension` : Dossier à pousser
- `extension-dist` : Nom du remote
- `main` : Branch cible
- `--squash` : Combine tous les commits en un seul (optionnel, mais recommandé)

### Si le Push Échoue

**Erreur** : "refs/heads/main:refs/heads/main rejected"

**Solution** : Le repo de distribution doit avoir au moins un commit initial

```bash
# Dans le repo de distribution (première fois seulement)
cd /Volumes/LaCie/Dev/infoverif-extension
git init
echo "# InfoVerif Extension" > README.md
git add README.md
git commit -m "Initial commit"
git remote add origin https://github.com/GenerativSchool-Lab/infoverif-extension.git
git push -u origin main

# Puis retry le subtree push depuis le main repo
```

---

## 📝 Workflow Complet

### Première Fois

```bash
# 1. Créer repo GitHub (manuellement)

# 2. Initialiser le repo de distribution
cd /Volumes/LaCie/Dev
git clone https://github.com/GenerativSchool-Lab/infoverif-extension.git
cd infoverif-extension
echo "# InfoVerif Extension" > README.md
git add README.md
git commit -m "Initial commit"
git push -u origin main

# 3. Ajouter remote dans main repo
cd /Volumes/LaCie/Dev/infoverif.org
git remote add extension-dist https://github.com/GenerativSchool-Lab/infoverif-extension.git

# 4. Push extension/
./scripts/push_extension_repo.sh
```

### Usage Régulier

```bash
cd /Volumes/LaCie/Dev/infoverif.org

# Après chaque modification dans extension/
./scripts/push_extension_repo.sh
```

---

## 🔄 Alternative : Sync Script (Copie Fichiers)

Si vous préférez copier les fichiers au lieu de push direct :

```bash
./scripts/sync_extension_repo.sh
cd ../infoverif-extension
git push origin main
```

**Différence** :
- **Subtree push** : Push direct, historique Git
- **Sync script** : Copie fichiers, contrôle total sur les fichiers inclus

---

## 🐛 Troubleshooting

### Remote Already Exists

**Erreur** : "remote extension-dist already exists"

**Solution** :
```bash
# Retirer le remote
git remote remove extension-dist

# Réajouter
git remote add extension-dist https://github.com/GenerativSchool-Lab/infoverif-extension.git
```

### Push Failed - Empty Repo

**Erreur** : "refs/heads/main:refs/heads/main rejected"

**Solution** : Le repo doit avoir au moins un commit (voir "Première Fois" ci-dessus)

### Wrong Files in Distribution

**Problème** : Fichiers non désirés dans le repo de distribution

**Solution** : Utiliser `.gitignore` dans le dossier `extension/` ou utiliser le sync script à la place

---

## 📚 Ressources

- **Git Subtree Docs** : https://www.atlassian.com/git/tutorials/git-subtree
- **Script de push** : `scripts/push_extension_repo.sh`
- **Script de sync** : `scripts/sync_extension_repo.sh`

---

**Créé** : Novembre 2025

