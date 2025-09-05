#!/bin/bash

echo "🔍 AthleteAI OAuth Setup Verification"
echo "====================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 exists"
        return 0
    else
        echo -e "${RED}❌${NC} $1 missing"
        return 1
    fi
}

check_env_var() {
    if grep -q "$1=" backend/.env 2>/dev/null && ! grep -q "$1=your-" backend/.env 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $2 configured"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC} $2 not configured"
        return 1
    fi
}

echo ""
echo "📁 Checking files..."
check_file "backend/.env"
check_file "backend/package.json"
check_file "frontend/package.json"
check_file "OAUTH_SETUP.md"

echo ""
echo "🔧 Checking environment configuration..."
check_env_var "JWT_SECRET" "JWT Secret"
check_env_var "SESSION_SECRET" "Session Secret"
check_env_var "GOOGLE_CLIENT_ID" "Google OAuth"
check_env_var "GITHUB_CLIENT_ID" "GitHub OAuth"
check_env_var "FACEBOOK_APP_ID" "Facebook OAuth"

echo ""
echo "📦 Checking dependencies..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✅${NC} Backend dependencies installed"
else
    echo -e "${RED}❌${NC} Backend dependencies missing - run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅${NC} Frontend dependencies installed"
else
    echo -e "${RED}❌${NC} Frontend dependencies missing - run: cd frontend && npm install"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Run: ./setup_oauth.sh (for OAuth setup instructions)"
echo "2. Configure OAuth applications and update backend/.env"
echo "3. Run: ./start_dev.sh (to start development servers)"
echo ""
echo "📖 Documentation: OAUTH_SETUP.md"
