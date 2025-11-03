# Extension Distribution — Résumé Rapide

**Quick reference pour setup et maintenance du repo de distribution**

---

## 🚀 Setup Initial (Une Seule Fois)

### 1. Créer Repo GitHub

```bash
# GitHub → New Repository
# Name: infoverif-extension
# Public: ✅
# Initialize: ❌
```

### 2. Clone Local

```bash
cd /Volumes/LaCie/Dev
git clone https://github.com/GenerativSchool-Lab/infoverif-extension.git
```

### 3. Première Sync

```bash
cd /Volumes/LaCie/Dev/infoverif.org
./scripts/sync_extension_repo.sh
cd ../infoverif-extension
git push -u origin main
```

**✅ Done!** Le repo est prêt.

---

## 🔄 Sync Régulier (Après Modifications)

```bash
cd /Volumes/LaCie/Dev/infoverif.org
./scripts/sync_extension_repo.sh
cd ../infoverif-extension
git push origin main
```

---

## 📦 Release (Créer Version)

```bash
cd /Volumes/LaCie/Dev/infoverif-extension
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# Créer ZIP
zip -r infoverif-extension-v1.0.0.zip . -x "*.git*" -x ".DS_Store"

# GitHub → Releases → Draft new release
# Attacher le ZIP
```

---

## 📚 Documentation Complète

- **User Guide** : `DISTRIBUTION_README.md` → Installation complète
- **Maintenance** : `MAINTENANCE.md` → Guide développeur
- **Setup** : `SETUP_DISTRIBUTION_REPO.md` → Setup initial détaillé

---

## ✅ Checklist Release

- [ ] Tester extension (Twitter + TikTok)
- [ ] Mettre à jour version dans `manifest.json`
- [ ] Exécuter sync script
- [ ] Push vers GitHub
- [ ] Créer Release GitHub (optionnel)
- [ ] Attacher ZIP (optionnel)

---

**Créé** : Janvier 2026

