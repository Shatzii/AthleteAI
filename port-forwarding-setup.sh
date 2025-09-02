#!/bin/bash

# Port Forwarding Setup for AthleteAI
# This script configures port forwarding for Digital Ocean + Hetzner deployment

echo "🚀 Setting up port forwarding for AthleteAI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Install required packages
print_status "Installing required packages..."
apt update
apt install -y ufw nginx certbot python3-certbot-nginx

# Configure UFW firewall
print_status "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh
ufw allow 22

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Allow Docker Swarm ports (if using swarm)
ufw allow 2376/tcp  # Docker daemon
ufw allow 7946/tcp  # Docker Swarm
ufw allow 7946/udp  # Docker Swarm
ufw allow 4789/udp  # Docker Swarm overlay network

# Enable firewall
ufw --force enable

# Create nginx configuration
print_status "Setting up nginx configuration..."
cat > /etc/nginx/sites-available/athleteai << 'NGINX_EOF'
# Production Nginx Configuration for AthleteAI
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=1000r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=50r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

# Upstream backend servers
upstream athleteai_backend {
    server localhost:5000;
    keepalive 32;
}

# Upstream frontend servers
upstream athleteai_frontend {
    server localhost:3000;
    keepalive 16;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/athleteai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/athleteai.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://athleteai_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Authentication endpoints
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://athleteai_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Frontend application
    location / {
        limit_req zone=general burst=50 nodelay;
        proxy_pass http://athleteai_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# Enable the site
ln -sf /etc/nginx/sites-available/athleteai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
print_status "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
    systemctl reload nginx
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Create systemd service for backend
print_status "Creating systemd service for AthleteAI backend..."
cat > /etc/systemd/system/athleteai-backend.service << 'SERVICE_EOF'
[Unit]
Description=AthleteAI Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/athleteai/backend
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Create systemd service for frontend
print_status "Creating systemd service for AthleteAI frontend..."
cat > /etc/systemd/system/athleteai-frontend.service << 'SERVICE_EOF'
[Unit]
Description=AthleteAI Frontend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/athleteai/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Enable and start services
systemctl daemon-reload
systemctl enable athleteai-backend
systemctl enable athleteai-frontend

print_status "Port forwarding setup completed!"
print_warning "Next steps:"
echo "1. Update nginx config with your actual domain name"
echo "2. Run: certbot --nginx -d yourdomain.com"
echo "3. Deploy your application code to /var/www/athleteai/"
echo "4. Start services: systemctl start athleteai-backend athleteai-frontend"
echo "5. Test: curl https://yourdomain.com/health"

print_status "Port forwarding configuration:"
echo "  - Port 80 (HTTP) → Redirects to HTTPS"
echo "  - Port 443 (HTTPS) → Main application"
echo "  - Port 22 (SSH) → Server access"
echo "  - Internal: Backend on port 5000, Frontend on port 3000"
