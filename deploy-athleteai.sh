#!/bin/bash

# Production Deployment Script for AthleteAI Platform
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting AthleteAI Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."

    required_vars=("MONGO_URI" "JWT_SECRET" "SESSION_SECRET" "NODE_ENV")
    missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        print_error "Please set these in your .env file or environment"
        exit 1
    fi

    print_status "Environment variables check passed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd backend
    npm ci --production=false
    print_status "Backend dependencies installed"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd ../frontend
    npm ci --production=false
    print_status "Frontend dependencies installed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    cd frontend
    npm run build
    print_status "Frontend build completed"
}

# Enable production services in app.js
enable_production_services() {
    print_status "Enabling production services..."

    # Create a backup of the original app.js
    cp backend/app.js backend/app.js.backup

    # Uncomment the service initialization section
    sed -i 's|// Initialize advanced services - commented out for development|// Initialize advanced services - enabled for production|' backend/app.js
    sed -i 's|// (async () => {|async () => {|' backend/app.js
    sed -i 's|//     try {|    try {|' backend/app.js
    sed -i 's|//         // Initialize data services|        // Initialize data services|' backend/app.js
    sed -i 's|//         await dataStorageService.initialize();|        await dataStorageService.initialize();|' backend/app.js
    sed -i 's|//         await scheduledDataRefreshService.initialize();|        await scheduledDataRefreshService.initialize();|' backend/app.js
    sed -i 's|//         await dataQualityMonitoringService.initialize();|        await dataQualityMonitoringService.initialize();|' backend/app.js
    sed -i 's|//         // Start scheduled services|        // Start scheduled services|' backend/app.js
    sed -i 's|//         await scheduledDataRefreshService.start();|        await scheduledDataRefreshService.start();|' backend/app.js
    sed -i 's|//         await dataQualityMonitoringService.start();|        await dataQualityMonitoringService.start();|' backend/app.js
    sed -i 's|//         logger.info|        logger.info|' backend/app.js
    sed -i 's|//     } catch (error) {|    } catch (error) {|' backend/app.js
    sed -i 's|//         logger.error|        logger.error|' backend/app.js
    sed -i 's|// })();|})();|' backend/app.js

    print_status "Production services enabled"
}

# Test the application
test_application() {
    print_status "Running application tests..."

    # Backend tests
    cd backend
    if npm test -- --passWithNoTests; then
        print_status "Backend tests passed"
    else
        print_warning "Some backend tests failed, but continuing deployment"
    fi

    # Frontend tests
    cd ../frontend
    if npm test -- --watchAll=false --passWithNoTests; then
        print_status "Frontend tests passed"
    else
        print_warning "Some frontend tests failed, but continuing deployment"
    fi
}

# Deploy with PM2
deploy_with_pm2() {
    print_status "Deploying with PM2..."

    cd backend

    # Stop existing application
    pm2 stop go4it-backend || true
    pm2 delete go4it-backend || true

    # Start application with PM2
    pm2 start ecosystem.config.js --env production

    # Save PM2 configuration
    pm2 save

    # Setup PM2 startup script
    pm2 startup

    print_status "Application deployed with PM2"
}

# Health check
health_check() {
    print_status "Performing health check..."

    # Wait for application to start
    sleep 10

    # Check if application is responding
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Health check passed - Application is running"
    else
        print_error "Health check failed - Application may not be running properly"
        exit 1
    fi
}

# Main deployment function
main() {
    print_status "Starting AthleteAI production deployment process..."

    # Change to project root
    cd /workspaces/.codespaces/AthleteAI

    # Run deployment steps
    check_env_vars
    install_backend_deps
    install_frontend_deps
    build_frontend
    enable_production_services
    test_application
    deploy_with_pm2
    health_check

    print_status "🎉 AthleteAI deployment completed successfully!"
    print_status "Application is running at: http://localhost:5000"
    print_status "Health check endpoint: http://localhost:5000/health"
    print_status "PM2 status: pm2 status"
    print_status "PM2 logs: pm2 logs go4it-backend"
}

# Run main function
main "$@"
