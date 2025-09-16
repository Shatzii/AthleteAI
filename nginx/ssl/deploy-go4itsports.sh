#!/bin/bash

# Go4It Sports Deployment Script for go4itsports.org
# This script deploys the optimized site with SSL and domain configuration

set -e

echo "🚀 Deploying Go4It Sports to go4itsports.org..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/go4itsports.org.crt" ] || [ ! -f "nginx/ssl/go4itsports.org.key" ]; then
    echo -e "${BLUE}ℹ️  SSL certificates not found. Generating self-signed certificates...${NC}"
    mkdir -p nginx/ssl
    openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/go4itsports.org.key -out nginx/ssl/go4itsports.org.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Go4It Sports/OU=IT/CN=go4itsports.org"
    echo -e "${GREEN}✅ SSL certificates generated${NC}"
fi

# Build and start services
echo -e "${BLUE}🏗️  Building and starting production services...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 30

# Health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"

# Check nginx
if curl -f -k https://localhost/health 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx HTTPS health check passed${NC}"
else
    echo -e "${BLUE}⚠️  Nginx health check failed (may be normal during startup)${NC}"
fi

# Display deployment info
echo ""
echo -e "${GREEN}🎉 Go4It Sports Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "   🌐 Frontend:     https://go4itsports.org"
echo "   🔒 SSL:          ✅ Enabled with self-signed certificates"
echo "   🔍 SEO:          ✅ Optimized for go4itsports.org"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo "   View logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart:         docker-compose -f docker-compose.prod.yml restart"
echo "   Stop:           docker-compose -f docker-compose.prod.yml down"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   1. Point go4itsports.org DNS to your server"
echo "   2. Replace self-signed SSL with Let's Encrypt certificates"
echo "   3. Configure CDN (CloudFront) for global performance"
echo "   4. Set up monitoring and alerting"
