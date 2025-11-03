# InfoVerif Chrome Extension 🛡️

**Analysez les posts Twitter et TikTok directement depuis votre navigateur !**

**Version** : 1.0.0  
**Status** : Alpha Release  
**Platforms** : Twitter/X, TikTok  
**Language** : Français  
**License** : MIT

---

## 🎯 Installation Simple (2 minutes)

### Étape 1 : Télécharger l'Extension

1. **Cliquez sur le bouton vert "Code"** en haut à droite de cette page
2. **Choisissez "Download ZIP"**
3. **Décompressez le fichier** : Double-cliquez sur `infoverif-extension-main.zip`
4. **Vous avez maintenant un dossier** `infoverif-extension-main`

> 💡 **Astuce** : Notez où vous avez décompressé le dossier, vous en aurez besoin à l'étape 3 !

---

### Étape 2 : Ouvrir Chrome

1. **Ouvrez Google Chrome** (ou Microsoft Edge, Brave)
2. **Tapez dans la barre d'adresse** : `chrome://extensions/`
   - Ou allez dans le menu Chrome (les 3 points ⋮) → **Extensions** → **Gérer les extensions**

---

### Étape 3 : Activer le Mode Développeur

En haut à droite de la page `chrome://extensions/`, vous verrez un **interrupteur** qui dit **"Mode développeur"**.

**Cliquez dessus** pour l'activer (il doit devenir bleu/vert).

> ℹ️ **Pourquoi ?** Ce mode permet d'installer des extensions depuis votre ordinateur, pas seulement depuis le Chrome Web Store.

---

### Étape 4 : Charger l'Extension

1. **Cliquez sur le bouton** **"Charger l'extension non empaquetée"** (en haut à gauche)
2. **Une fenêtre s'ouvre** pour choisir un dossier
3. **Naviguez** jusqu'au dossier `infoverif-extension-main` que vous avez décompressé
4. **Sélectionnez le dossier** et cliquez **"Sélectionner le dossier"** (ou **"Ouvrir"**)

> ✅ **C'est fait !** L'extension InfoVerif devrait maintenant apparaître dans votre liste d'extensions !

---

### Étape 5 : Vérifier l'Installation

Vous devriez voir :
- ✅ L'extension **InfoVerif** dans la liste
- ✅ Une **icône 🛡️** dans la barre d'outils Chrome (en haut à droite)

Si l'icône n'apparaît pas, cliquez sur l'**icône puzzle** 🧩 dans la barre d'outils et épinglez InfoVerif.

---

## 📖 Comment Utiliser

### Sur Twitter/X

1. **Allez sur** [twitter.com](https://twitter.com) ou [x.com](https://x.com)
2. **Survolez un tweet** avec votre souris
3. Un bouton **"Analyser avec InfoVerif"** apparaît en haut à droite du tweet
4. **Cliquez dessus**
5. Un **panneau flottant** s'ouvre à droite avec l'analyse complète

> 💡 **Astuce** : Fonctionne avec les tweets texte ET les tweets avec vidéo !

---

### Sur TikTok

1. **Allez sur** [tiktok.com](https://tiktok.com)
2. Un bouton **"Analyser avec InfoVerif"** apparaît en bas à gauche
3. **Cliquez dessus**
4. Le panneau flottant s'ouvre avec l'analyse

> 💡 **Astuce** : Le bouton fonctionne sur toutes les pages TikTok (vidéo, feed, recherche) !

---

## 🎨 Ce que Vous Voyez

L'analyse affiche :

- **📊 Scores** : 4 indicateurs (0-100)
  - Indice d'influence global
  - Intensité persuasive
  - Narratif spéculatif
  - Fiabilité factuelle

- **🎯 Techniques DIMA** : Les techniques de manipulation détectées
  - Code exact (ex: `[TE-58]` = Théorie du complot)
  - Citation du texte analysé
  - Explication détaillée

- **✓ Affirmations** : Analyse factuelle des claims
  - Supportée / Non supportée / Trompeuse
  - Raisonnement

- **📝 Synthèse** : Résumé complet de l'analyse

---

## 🛡️ Confidentialité & Sécurité

**Votre vie privée est protégée** :

- ✅ **Aucun stockage permanent** : Les analyses ne sont jamais sauvegardées
- ✅ **Pas de tracking** : Aucune donnée personnelle collectée
- ✅ **Pas de cookies** : Pas de suivi de votre navigation
- ✅ **Code open source** : Vous pouvez vérifier le code vous-même
- ✅ **Analyses éphémères** : Les résultats disparaissent quand vous fermez le navigateur

**Les analyses sont envoyées uniquement quand vous cliquez sur "Analyser"**. Rien n'est fait automatiquement.

---

## ❓ Questions Fréquentes

### L'extension ne s'installe pas

**Problème** : "Impossible de charger l'extension"

**Solutions** :
1. Vérifiez que le **Mode développeur** est bien activé (interrupteur bleu/vert)
2. Assurez-vous de sélectionner le **dossier** (pas un fichier à l'intérieur)
3. Vérifiez que vous avez bien décompressé le ZIP

---

### Le bouton n'apparaît pas sur Twitter

**Solutions** :
1. **Rafraîchissez la page** (F5 ou Cmd+R sur Mac)
2. Vérifiez que l'extension est **activée** dans `chrome://extensions/`
3. Vérifiez que vous êtes bien sur **twitter.com** ou **x.com** (pas une autre page)

---

### Le bouton n'apparaît pas sur TikTok

**Solutions** :
1. Attendez 2-3 secondes (le bouton apparaît automatiquement)
2. Rafraîchissez la page si nécessaire
3. Vérifiez que vous êtes bien sur **tiktok.com**

---

### L'analyse ne démarre pas

**Solutions** :
1. Vérifiez votre **connexion internet**
2. Attendez quelques secondes (l'analyse peut prendre 10-15 secondes pour les vidéos)
3. Si ça ne marche toujours pas, rafraîchissez la page et réessayez

---

### J'ai une erreur

**Que faire** :
1. **Notez le message d'erreur** exact
2. **Rafraîchissez la page** et réessayez
3. Si le problème persiste, **ouvrez une issue** sur [GitHub](https://github.com/GenerativSchool-Lab/infoverif-extension/issues) en décrivant :
   - Ce que vous faisiez quand l'erreur est survenue
   - Le message d'erreur complet
   - Votre navigateur (Chrome, Edge, etc.) et sa version

---

## 🔄 Mettre à Jour l'Extension

Quand une nouvelle version est disponible :

1. **Téléchargez** la nouvelle version (ZIP)
2. **Décompressez** le nouveau dossier
3. Allez sur `chrome://extensions/`
4. **Trouvez InfoVerif** dans la liste
5. **Cliquez sur l'icône 🔄 Recharger** (à droite de l'extension)
6. **Sélectionnez le nouveau dossier** avec "Charger l'extension non empaquetée"

> 💡 **Astuce** : Vous pouvez aussi supprimer l'ancienne version et charger la nouvelle.

---

## 📚 En Savoir Plus

- **Site web** : [infoverif.org](https://infoverif.org) - Utilisez l'application web pour analyser d'autres contenus
- **Documentation complète** : Voir ce README pour plus de détails techniques
- **Code source** : [github.com/GenerativSchool-Lab/infoverif.org](https://github.com/GenerativSchool-Lab/infoverif.org)

---

## 🐛 Signaler un Bug

Si quelque chose ne fonctionne pas :

1. Allez sur [GitHub Issues](https://github.com/GenerativSchool-Lab/infoverif-extension/issues)
2. Cliquez **"New Issue"**
3. Décrivez le problème :
   - Ce que vous faisiez
   - Ce qui était attendu
   - Ce qui s'est passé
   - Votre navigateur et système d'exploitation

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voir le [repo principal](https://github.com/GenerativSchool-Lab/infoverif.org) pour plus d'informations.

---

## 📜 License

**MIT License** - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

Vous êtes libre d'utiliser, modifier et distribuer cette extension.

---

**Développé avec ❤️ par** [Civic Tech AI Lab — GenerativSchool](https://generativschool.com)

**Version** : 1.0.0  
**Dernière mise à jour** : Novembre 2025

---

> 💬 **Besoin d'aide ?** Ouvrez une [Issue sur GitHub](https://github.com/GenerativSchool-Lab/infoverif-extension/issues) ou consultez [infoverif.org](https://infoverif.org)
