#!/bin/bash
# Sync extension to distribution repo
# Usage: ./scripts/sync_extension_repo.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get absolute path of script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
EXTENSION_REPO="$MAIN_REPO/../infoverif-extension"
EXTENSION_DIR="$MAIN_REPO/extension"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔄 Synchronisation de l'extension vers le repo de distribution${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Main repo:${NC} $MAIN_REPO"
echo -e "${BLUE}Extension repo:${NC} $EXTENSION_REPO"
echo ""

# Check if extension directory exists in main repo
if [ ! -d "$EXTENSION_DIR" ]; then
    echo -e "${RED}❌ Erreur: extension/ non trouvé dans $MAIN_REPO${NC}"
    exit 1
fi

# Check if extension repo exists
if [ ! -d "$EXTENSION_REPO" ]; then
    echo -e "${YELLOW}⚠️  Repo de distribution non trouvé: $EXTENSION_REPO${NC}"
    echo ""
    echo "Création du repo..."
    mkdir -p "$EXTENSION_REPO"
    cd "$EXTENSION_REPO"
    git init
    echo -e "${GREEN}✅ Repo Git initialisé${NC}"
fi

# Files to copy (relative to extension/)
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

MISSING_FILES=()

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Create directory structure in destination
        dir=$(dirname "$file")
        if [ "$dir" != "." ]; then
            mkdir -p "$EXTENSION_REPO/$dir"
        fi
        cp "$file" "$EXTENSION_REPO/$file"
        echo -e "  ${GREEN}✅${NC} $file"
    else
        echo -e "  ${YELLOW}⚠️${NC}  $file non trouvé"
        MISSING_FILES+=("$file")
    fi
done

# Copy README
if [ -f "DISTRIBUTION_README.md" ]; then
    cp "DISTRIBUTION_README.md" "$EXTENSION_REPO/README.md"
    echo -e "  ${GREEN}✅${NC} README.md"
else
    echo -e "  ${YELLOW}⚠️${NC}  DISTRIBUTION_README.md non trouvé"
fi

# Copy LICENSE if exists
if [ -f "$MAIN_REPO/LICENSE" ]; then
    cp "$MAIN_REPO/LICENSE" "$EXTENSION_REPO/LICENSE"
    echo -e "  ${GREEN}✅${NC} LICENSE"
fi

# Copy .gitignore if exists
if [ -f "$EXTENSION_DIR/.gitignore" ]; then
    cp "$EXTENSION_DIR/.gitignore" "$EXTENSION_REPO/.gitignore"
    echo -e "  ${GREEN}✅${NC} .gitignore"
fi

echo ""

# Check for missing critical files
if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Fichiers manquants:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "    - $file"
    done
    echo ""
fi

# Git operations
echo -e "${GREEN}📝 Commit dans le repo de distribution...${NC}"
cd "$EXTENSION_REPO"

# Configure git if needed
if [ -z "$(git config user.name)" ]; then
    git config user.name "InfoVerif Sync"
    git config user.email "noreply@infoverif.org"
fi

# Add all files
git add -A

# Check if there are changes
if git diff --staged --quiet; then
    echo -e "${YELLOW}ℹ️  Aucun changement détecté${NC}"
    echo ""
else
    # Get main repo commit info
    MAIN_COMMIT=$(cd "$MAIN_REPO" && git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    MAIN_BRANCH=$(cd "$MAIN_REPO" && git branch --show-current 2>/dev/null || echo "unknown")
    
    # Commit
    COMMIT_MSG="chore: Sync extension from main repo

Synced from: $MAIN_REPO
Commit: $MAIN_COMMIT ($MAIN_BRANCH)
Date: $(date '+%Y-%m-%d %H:%M:%S')"
    
    git commit -m "$COMMIT_MSG" || true
    
    echo -e "${GREEN}✅ Synchronisation complète!${NC}"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📤 Prochaines étapes:${NC}"
    echo ""
    echo "  1. cd $EXTENSION_REPO"
    
    # Check if remote exists
    if ! git remote | grep -q "^origin$"; then
        echo "  2. git remote add origin https://github.com/GenerativSchool-Lab/infoverif-extension.git"
        echo "  3. git push -u origin main"
    else
        echo "  2. git push origin main"
        REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
        if [ -n "$REMOTE_URL" ]; then
            echo ""
            echo -e "${BLUE}  Remote configuré:${NC} $REMOTE_URL"
        fi
    fi
    echo ""
fi

echo -e "${GREEN}✨ Terminé!${NC}"
echo ""

