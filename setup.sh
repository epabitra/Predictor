#!/bin/bash

echo "🚀 Setting up Tournament Predictor Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18.20.8 or higher first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.20.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is lower than required version $REQUIRED_VERSION"
    echo "Please upgrade Node.js to v18.20.8 or higher"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy backend/env.example to backend/.env"
echo "2. Configure your Google Sheets API credentials in backend/.env"
echo "3. Run 'npm run dev' to start both backend and frontend"
echo ""
echo "🔧 For detailed setup instructions, see README.md"
echo ""
echo "🎯 Happy predicting!"
