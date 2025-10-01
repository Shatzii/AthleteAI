#!/bin/bash

# AthleteAI Staging Deployment Script
# This script sets up and deploys the AthleteAI platform to staging environment

set -e

echo "🚀 Starting AthleteAI Staging Deployment"

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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if environment file exists
check_env() {
    if [ ! -f ".env.staging" ]; then
        print_warning "Staging environment file (.env.staging) not found."
        print_status "Copying example environment file..."
        cp .env.staging.example .env.staging
        print_warning "Please edit .env.staging with your actual configuration values before proceeding."
        read -p "Press enter when you've configured the environment file..."
    fi
    print_success "Environment file found"
}

# Build and start services
deploy_staging() {
    print_status "Building and starting staging services..."

    # Stop any existing staging containers
    docker-compose -f docker-compose.staging.yml down || true

    # Build and start services
    docker-compose -f docker-compose.staging.yml up --build -d

    print_success "Staging services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."

    # Wait for backend
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:5001/health > /dev/null 2>&1; then
            print_success "Backend service is healthy"
            break
        fi
        print_status "Waiting for backend service... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_error "Backend service failed to start properly"
        exit 1
    fi

    # Wait for frontend
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001 > /dev/null 2>&1; then
            print_success "Frontend service is healthy"
            break
        fi
        print_status "Waiting for frontend service... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_error "Frontend service failed to start properly"
        exit 1
    fi
}

# Run basic health checks
run_health_checks() {
    print_status "Running health checks..."

    # Check backend health
    if curl -s http://localhost:5001/health | grep -q "healthy"; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi

    # Check API endpoints
    if curl -s http://localhost:5001/api/v1/auth/status > /dev/null 2>&1; then
        print_success "API endpoints are responding"
    else
        print_warning "Some API endpoints may not be responding (this is normal for staging)"
    fi
}

# Show deployment information
show_info() {
    print_success "Staging deployment completed successfully!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:3001"
    echo "   Backend API: http://localhost:5001"
    echo "   Health Check: http://localhost:5001/health"
    echo ""
    echo "🐳 Docker Services:"
    docker-compose -f docker-compose.staging.yml ps
    echo ""
    echo "📊 To view logs:"
    echo "   docker-compose -f docker-compose.staging.yml logs -f"
    echo ""
    echo "🛑 To stop staging environment:"
    echo "   docker-compose -f docker-compose.staging.yml down"
}

# Main deployment process
main() {
    print_status "AthleteAI Staging Deployment Script"
    echo "=================================="

    check_docker
    check_env
    deploy_staging
    wait_for_services
    run_health_checks
    show_info

    print_success "🎉 Staging deployment completed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    "stop")
        print_status "Stopping staging environment..."
        docker-compose -f docker-compose.staging.yml down
        print_success "Staging environment stopped"
        ;;
    "restart")
        print_status "Restarting staging environment..."
        docker-compose -f docker-compose.staging.yml restart
        wait_for_services
        print_success "Staging environment restarted"
        ;;
    "logs")
        docker-compose -f docker-compose.staging.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose.staging.yml ps
        ;;
    *)
        main
        ;;
esac