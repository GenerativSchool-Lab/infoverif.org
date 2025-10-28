#!/bin/bash
# Setup script for InfoVerif

set -e

echo "InfoVerif — Setup Script"
echo "========================"
echo ""

# Create .env files if they don't exist
if [ ! -f "api/.env" ]; then
    echo "Creating api/.env..."
    cp api/.env.example api/.env
fi

if [ ! -f "web/.env" ]; then
    echo "Creating web/.env..."
    cp web/.env.example web/.env
fi

# Install Python dependencies (if venv exists)
if [ -d "venv" ]; then
    echo "Installing Python dependencies..."
    source venv/bin/activate
    pip install -r api/requirements.txt
fi

# Install Node dependencies
echo "Installing frontend dependencies..."
cd web
npm install
cd ..

echo ""
echo "✓ Setup complete!"
echo ""
echo "To start the application:"
echo "  make dev"
echo ""
echo "Or manually:"
echo "  docker-compose up"
echo "  cd web && npm run dev"

