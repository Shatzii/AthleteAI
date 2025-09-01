#!/bin/bash

# Production Setup Script for AthleteAI
# This script sets up all high-impact enterprise features

set -e

echo "🚀 Setting up AthleteAI Production Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Create required directories
mkdir -p nginx/ssl
mkdir -p logs
mkdir -p backups

print_status "Created required directories"

# Build and start services
echo "🏗️  Building and starting production services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
services=("go4it-backend" "go4it-frontend" "api-gateway" "nginx" "mongo" "redis")
for service in "${services[@]}"; do
    if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then
        print_status "$service is running"
    else
        print_error "$service failed to start"
        docker-compose -f docker-compose.prod.yml logs $service
        exit 1
    fi
done

# Run database index creation
echo "🔧 Creating database indexes..."
docker-compose -f docker-compose.prod.yml exec -T go4it-backend node createIndexes.js

print_status "Database indexes created"

# Run health checks
echo "🏥 Running health checks..."
services_health=(
    "http://localhost/api/health:API Gateway"
    "http://localhost:5000/health:Backend"
)

for health_check in "${services_health[@]}"; do
    url=$(echo $health_check | cut -d: -f1)
    name=$(echo $health_check | cut -d: -f2)
    
    if curl -f -s $url > /dev/null; then
        print_status "$name health check passed"
    else
        print_warning "$name health check failed (may be normal during startup)"
    fi
done

# Display service URLs
echo ""
echo "🎉 AthleteAI Production Setup Complete!"
echo ""
echo "📊 Service URLs:"
echo "   🌐 Frontend:     http://localhost"
echo "   🚪 API Gateway:  http://localhost/api"
echo "   🔧 Backend:      http://localhost:5000"
echo "   📊 Nginx:        http://localhost"
echo ""
echo "🔒 Security Features:"
echo "   ✅ Nginx reverse proxy with rate limiting"
echo "   ✅ API Gateway with advanced rate limiting"
echo "   ✅ Redis caching for athlete data"
echo "   ✅ Database connection pooling"
echo "   ✅ Optimized database indexes"
echo ""
echo "📈 Performance Optimizations:"
echo "   ✅ Gzip compression"
echo "   ✅ Static file caching"
echo "   ✅ Database query optimization"
echo "   ✅ Redis caching strategies"
echo ""
echo "🛠️  Next Steps:"
echo "   1. Configure SSL certificates in nginx/ssl/"
echo "   2. Set up monitoring dashboards"
echo "   3. Configure backup schedules"
echo "   4. Set up CDN integration (optional)"
echo ""
echo "📝 Useful Commands:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo "   docker-compose -f docker-compose.prod.yml exec go4it-backend bash"
echo "   docker-compose -f docker-compose.prod.yml down"
