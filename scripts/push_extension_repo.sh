#!/bin/bash
# Push extension folder directly to distribution repo using git subtree
# Usage: ./scripts/push_extension_repo.sh

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
EXTENSION_REPO_URL="https://github.com/GenerativSchool-Lab/infoverif-extension.git"
EXTENSION_DIR="extension"

cd "$MAIN_REPO"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📤 Push de l'extension vers le repo de distribution${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Main repo:${NC} $MAIN_REPO"
echo -e "${BLUE}Extension dir:${NC} $EXTENSION_DIR"
echo -e "${BLUE}Target repo:${NC} $EXTENSION_REPO_URL"
echo ""

# Check if extension directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
    echo -e "${RED}❌ Erreur: extension/ non trouvé dans $MAIN_REPO${NC}"
    exit 1
fi

# Check if git subtree is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Erreur: git n'est pas installé${NC}"
    exit 1
fi

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Erreur: Pas un repo git${NC}"
    exit 1
fi

# Check if remote exists, add if not
if ! git remote | grep -q "^extension-dist\$"; then
    echo -e "${YELLOW}⚠️  Remote 'extension-dist' non trouvé, ajout...${NC}"
    git remote add extension-dist "$EXTENSION_REPO_URL"
    echo -e "${GREEN}✅ Remote ajouté${NC}"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Branch actuelle:${NC} $CURRENT_BRANCH"
echo ""

# Get latest commit info
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_DATE=$(git log -1 --format='%cd' --date=short)

echo -e "${GREEN}📦 Pousser extension/ vers repo de distribution...${NC}"
echo ""

# Push subtree
# This pushes only the extension/ directory to the main branch of the target repo
git subtree push --prefix="$EXTENSION_DIR" extension-dist main || {
    # If push fails, try split first
    echo -e "${YELLOW}⚠️  Push direct échoué, tentative avec split...${NC}"
    
    # Split the subtree (without squash for split, we'll squash on push)
    echo -e "${BLUE}🔄 Split du subtree...${NC}"
    git subtree split --prefix="$EXTENSION_DIR" --branch extension-split || {
        echo -e "${RED}❌ Erreur lors du split${NC}"
        exit 1
    }
    
    # Push the split branch
    echo -e "${BLUE}📤 Push du split...${NC}"
    git push extension-dist extension-split:main || {
        echo -e "${RED}❌ Erreur lors du push${NC}"
        echo ""
        echo -e "${YELLOW}💡 Astuce: Le repo de distribution existe-t-il ?${NC}"
        echo "   Créez-le d'abord: https://github.com/new"
        exit 1
    }
    
    # Clean up split branch
    git branch -D extension-split 2>/dev/null || true
}

echo ""
echo -e "${GREEN}✅ Push réussi!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 Informations:${NC}"
echo ""
echo -e "  Commit source: ${BLUE}$COMMIT_HASH${NC} ($COMMIT_DATE)"
echo -e "  Repo distrib: ${BLUE}$EXTENSION_REPO_URL${NC}"
echo ""
echo -e "${GREEN}✨ Terminé!${NC}"
echo ""

