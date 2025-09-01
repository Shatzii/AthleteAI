#!/bin/bash

# Production Deployment Script for Go4It Sports Platform
# This script handles secure production deployment with safety checks

set -e  # Exit on any error

echo "🚀 Go4It Sports Platform - Production Deployment"
echo "================================================"

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

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if we're in production environment
if [ "$NODE_ENV" != "production" ]; then
    print_warning "NODE_ENV is not set to 'production'. Current: $NODE_ENV"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check environment variables
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    exit 1
fi

# Check for placeholder values
if grep -q "your-super-secret\|changeme\|CHANGE_THIS" .env; then
    print_error "Environment file contains placeholder values!"
    print_error "Please update .env with secure production values."
    exit 1
fi

# Run security audit
print_status "Running security audit..."
if [ -f "security-audit.sh" ]; then
    ./security-audit.sh
else
    print_warning "Security audit script not found"
fi

# Backup current deployment
print_status "Creating backup..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d "backend/dist" ]; then
    cp -r backend/dist "$BACKUP_DIR/"
fi

if [ -d "frontend/build" ]; then
    cp -r frontend/build "$BACKUP_DIR/"
fi

print_status "Backup created in: $BACKUP_DIR"

# Install dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --only=production
cd ..

print_status "Installing frontend dependencies..."
cd frontend
npm ci --only=production
cd ..

# Build applications
print_status "Building backend..."
cd backend
npm run build
cd ..

print_status "Building frontend..."
cd frontend
npm run build
cd ..

# Run database migrations (if any)
print_status "Checking for database migrations..."
cd backend
if [ -f "dist/migrate.js" ]; then
    print_status "Running database migrations..."
    node dist/migrate.js
fi
cd ..

# Health checks
print_status "Running health checks..."

# Check if MongoDB is accessible
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_status "MongoDB connection: OK"
    else
        print_error "MongoDB connection: FAILED"
        exit 1
    fi
fi

# Check if Redis is accessible
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        print_status "Redis connection: OK"
    else
        print_warning "Redis connection: FAILED (optional)"
    fi
fi

# Deploy with Docker
print_status "Starting production deployment..."

if command -v docker-compose &> /dev/null; then
    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down || true

    # Start new containers
    docker-compose -f docker-compose.prod.yml up -d --build

    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 30

    # Check container health
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_status "✅ Deployment successful!"
        print_status "Application should be available at: http://localhost"
        print_status "Check logs with: docker-compose -f docker-compose.prod.yml logs -f"
    else
        print_error "❌ Deployment failed! Check logs:"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
else
    print_error "Docker Compose not found. Please install Docker and Docker Compose."
    exit 1
fi

# Post-deployment tasks
print_status "Running post-deployment tasks..."

# Clean up old backups (keep last 5)
print_status "Cleaning up old backups..."
ls -t backup-* 2>/dev/null | tail -n +6 | xargs -r rm -rf

# Set proper file permissions
print_status "Setting secure file permissions..."
chmod 600 .env 2>/dev/null || true
chmod 644 nginx.conf 2>/dev/null || true

print_status "🎉 Production deployment completed successfully!"
print_status ""
print_status "Monitoring commands:"
print_status "- View logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "- Check status: docker-compose -f docker-compose.prod.yml ps"
print_status "- Restart services: docker-compose -f docker-compose.prod.yml restart"
print_status ""
print_status "Security reminders:"
print_status "- Regularly update dependencies: npm audit"
print_status "- Monitor logs for suspicious activity"
print_status "- Keep secrets rotated and secure"
print_status "- Run security audits regularly"
