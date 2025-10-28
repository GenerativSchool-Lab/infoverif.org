#!/bin/bash
# Deploy to Railway using CLI

set -e

echo "Deploying InfoVerif to Railway..."
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "Install it: npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

echo "📦 Creating services..."
echo ""

# Create API service
echo "Creating API service..."
railway service create --name api || true

# Create Worker service  
echo "Creating Worker service..."
railway service create --name worker || true

# Link to project if not already
if [ ! -f ".railway" ]; then
    echo "🔗 Link to Railway project..."
    railway init
fi

echo ""
echo "✓ Services created"
echo ""
echo "Next steps:"
echo "1. Set environment variables:"
echo "   railway variables"
echo ""
echo "2. Deploy API:"
echo "   railway up --service api"
echo ""
echo "3. Deploy Worker:"
echo "   railway up --service worker --detach"

