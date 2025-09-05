#!/bin/bash

# AthleteAI OAuth Setup Automation Script
# This script automates the parts of OAuth setup that can be automated

set -e  # Exit on any error

echo "🚀 AthleteAI OAuth Setup Automation"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the AthleteAI root directory"
    exit 1
fi

print_status "Step 1: Setting up environment configuration..."

# Create .env file from template
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_success "Created backend/.env from template"
else
    print_warning "backend/.env already exists, skipping..."
fi

print_status "Step 2: Installing backend dependencies..."

# Install backend dependencies
cd backend
if command -v npm &> /dev/null; then
    npm install
    print_success "Backend dependencies installed"
else
    print_error "npm not found. Please install Node.js and npm first."
    exit 1
fi

print_status "Step 3: Installing frontend dependencies..."

# Install frontend dependencies
cd ../frontend
npm install
print_success "Frontend dependencies installed"

print_status "Step 4: Setting up development environment..."

# Go back to root
cd ..

# Generate secure random secrets
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Update .env file with generated secrets
if [ -f "backend/.env" ]; then
    # Escape special characters for sed
    JWT_SECRET_ESCAPED=$(printf '%s\n' "$JWT_SECRET" | sed 's/[[\.*^$()+?{|]/\\&/g')
    SESSION_SECRET_ESCAPED=$(printf '%s\n' "$SESSION_SECRET" | sed 's/[[\.*^$()+?{|]/\\&/g')

    # Use sed to replace placeholder values
    sed -i.bak "s/your-super-secret-jwt-key-here/$JWT_SECRET_ESCAPED/g" backend/.env
    sed -i.bak "s/your-session-secret-key-here/$SESSION_SECRET_ESCAPED/g" backend/.env
    rm backend/.env.bak 2>/dev/null || true
    print_success "Generated secure JWT and session secrets"
fi

print_status "Step 5: Creating OAuth setup helper..."

# Create a helper script for OAuth configuration
cat > setup_oauth.sh << 'EOF'
#!/bin/bash

echo "🔧 OAuth Configuration Helper"
echo "============================="
echo ""
echo "This script will help you configure OAuth for AthleteAI."
echo "You'll need to manually create applications on each platform:"
echo ""
echo "1. 🌐 Google OAuth:"
echo "   - Go to: https://console.cloud.google.com/"
echo "   - Create/select project"
echo "   - Enable Google+ API"
echo "   - Create OAuth 2.0 Client ID"
echo "   - Add redirect URI: http://localhost:5000/api/v1/auth/google/callback"
echo ""
echo "2. 🐙 GitHub OAuth:"
echo "   - Go to: https://github.com/settings/developers"
echo "   - Create New OAuth App"
echo "   - Homepage URL: http://localhost:3000"
echo "   - Callback URL: http://localhost:5000/api/v1/auth/github/callback"
echo ""
echo "3. 📘 Facebook OAuth:"
echo "   - Go to: https://developers.facebook.com/"
echo "   - Create new app"
echo "   - Add Facebook Login product"
echo "   - Add redirect URI: http://localhost:5000/api/v1/auth/facebook/callback"
echo ""
echo "After creating the apps, update backend/.env with your credentials:"
echo "  - GOOGLE_CLIENT_ID=your_google_client_id"
echo "  - GOOGLE_CLIENT_SECRET=your_google_client_secret"
echo "  - GITHUB_CLIENT_ID=your_github_client_id"
echo "  - GITHUB_CLIENT_SECRET=your_github_client_secret"
echo "  - FACEBOOK_APP_ID=your_facebook_app_id"
echo "  - FACEBOOK_APP_SECRET=your_facebook_app_secret"
echo ""
echo "Then run: npm run dev (in backend/) and npm start (in frontend/)"
EOF

chmod +x setup_oauth.sh
print_success "Created OAuth setup helper script"

print_status "Step 6: Setting up database connection..."

# Check if MongoDB is running
if command -v mongod &> /dev/null; then
    if pgrep mongod > /dev/null; then
        print_success "MongoDB is running"
    else
        print_warning "MongoDB is not running. Please start MongoDB:"
        echo "  brew services start mongodb/brew/mongodb-community (macOS)"
        echo "  sudo systemctl start mongod (Linux)"
        echo "  Or use Docker: docker run -d -p 27017:27017 mongo"
    fi
else
    print_warning "MongoDB not found. Please install MongoDB or update MONGODB_URI in .env"
fi

print_status "Step 7: Creating development startup script..."

# Create a development startup script
cat > start_dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting AthleteAI Development Environment"
echo "============================================"

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found. Please run ./setup_oauth.sh first"
    exit 1
fi

# Check if OAuth credentials are configured
if grep -q "your-google-client-id" backend/.env; then
    echo "⚠️  OAuth credentials not configured. Please update backend/.env"
    echo "   Run ./setup_oauth.sh for instructions"
fi

echo "📦 Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "🌐 Starting frontend server..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
EOF

chmod +x start_dev.sh
print_success "Created development startup script"

print_success "🎉 Automated setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./setup_oauth.sh (for OAuth configuration instructions)"
echo "2. Set up OAuth applications on Google, GitHub, and Facebook"
echo "3. Update backend/.env with your OAuth credentials"
echo "4. Run: ./start_dev.sh (to start development servers)"
echo ""
echo "📖 For detailed instructions, see: OAUTH_SETUP.md"
echo ""
echo "🔗 Useful links:"
echo "   Google Cloud Console: https://console.cloud.google.com/"
echo "   GitHub OAuth Apps: https://github.com/settings/developers"
echo "   Facebook Developers: https://developers.facebook.com/"
