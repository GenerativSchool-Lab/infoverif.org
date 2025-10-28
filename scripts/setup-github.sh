#!/bin/bash
# Setup GitHub repo and push code

set -e

echo "🚀 Setting up InfoVerif for GitHub deployment"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: InfoVerif MVP"
    echo "✓ Git initialized"
else
    echo "✓ Git already initialized"
fi

# Check if remote is set
if git remote -v | grep -q "origin"; then
    echo ""
    echo "✓ Remote already configured:"
    git remote -v
    echo ""
    echo "To push: git push -u origin main"
else
    echo ""
    echo "📝 To push to GitHub, run:"
    echo ""
    echo "  # Create a new repo on GitHub, then:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/infoverif-org.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
    echo "Or use GitHub CLI:"
    echo "  gh repo create infoverif-org --public --source=. --remote=origin"
    echo "  git push -u origin main"
fi

echo ""
echo "✅ Ready to deploy to Railway!"
echo ""
echo "Next steps:"
echo "  1. Push to GitHub (see above)"
echo "  2. Run: railway login"
echo "  3. Run: railway init"
echo "  4. Follow RAILWAY_DEPLOY.md"
echo ""

