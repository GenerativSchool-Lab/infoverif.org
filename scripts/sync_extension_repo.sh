#!/bin/bash
# Sync extension to distribution repo
# Usage: ./scripts/sync_extension_repo.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
MAIN_REPO="/Volumes/LaCie/Dev/infoverif.org"
EXTENSION_REPO="/Volumes/LaCie/Dev/infoverif-extension"
EXTENSION_DIR="$MAIN_REPO/extension"

echo -e "${GREEN}🔄 Synchronisation de l'extension vers le repo de distribution...${NC}"

# Check if extension repo exists
if [ ! -d "$EXTENSION_REPO" ]; then
    echo -e "${YELLOW}⚠️  Repo de distribution non trouvé: $EXTENSION_REPO${NC}"
    echo "Création du repo..."
    mkdir -p "$EXTENSION_REPO"
    cd "$EXTENSION_REPO"
    git init
    echo "# InfoVerif Chrome Extension" > README.md
    git add README.md
    git commit -m "Initial commit"
    echo -e "${GREEN}✅ Repo créé${NC}"
fi

# Files to copy
FILES=(
    "manifest.json"
    "background-bundle.js"
    "contentScript-bundle.js"
    "styles/content.css"
    "ui/floating-panel.html"
    "ui/floating-panel.js"
    "ui/floating-panel.css"
    "icons/icon16.png"
    "icons/icon32.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

# Copy files
echo -e "${GREEN}📋 Copie des fichiers...${NC}"
cd "$EXTENSION_DIR"

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Create directory structure in destination
        dir=$(dirname "$file")
        if [ "$dir" != "." ]; then
            mkdir -p "$EXTENSION_REPO/$dir"
        fi
        cp "$file" "$EXTENSION_REPO/$file"
        echo "  ✅ $file"
    else
        echo -e "${YELLOW}  ⚠️  $file non trouvé${NC}"
    fi
done

# Copy README
if [ -f "DISTRIBUTION_README.md" ]; then
    cp "DISTRIBUTION_README.md" "$EXTENSION_REPO/README.md"
    echo "  ✅ README.md"
fi

# Copy LICENSE if exists
if [ -f "../LICENSE" ]; then
    cp "../LICENSE" "$EXTENSION_REPO/LICENSE"
    echo "  ✅ LICENSE"
fi

# Git operations
echo -e "${GREEN}📝 Commit dans le repo de distribution...${NC}"
cd "$EXTENSION_REPO"

# Add all files
git add -A

# Check if there are changes
if git diff --staged --quiet; then
    echo -e "${YELLOW}ℹ️  Aucun changement détecté${NC}"
else
    # Commit
    git commit -m "chore: Sync extension from main repo

Synced from: $(cd "$MAIN_REPO" && git rev-parse HEAD)
Date: $(date '+%Y-%m-%d %H:%M:%S')
" || true
    
    echo -e "${GREEN}✅ Synchronisation complète!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. cd $EXTENSION_REPO"
    echo "  2. git remote add origin https://github.com/GenerativSchool-Lab/infoverif-extension.git"
    echo "  3. git push -u origin main"
fi

echo -e "${GREEN}✨ Terminé!${NC}"

