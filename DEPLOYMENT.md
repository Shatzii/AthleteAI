# Go4It Sports Platform - Deployment Guide

## Overview
This guide covers deployment strategies for the Go4It Sports Platform, including development, staging, and production environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 16+ and npm
- MongoDB 4.4+
- Redis (optional, for caching)
- Docker & Docker Compose (for containerized deployment)
- SSL certificate (for production)

### Required Software
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install mongodb

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## Environment Setup

### Environment Variables

Create `.env` files for each environment:

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/go4it_prod
JWT_SECRET=your-super-secure-jwt-secret-here
FRONTEND_URL=https://yourdomain.com
REDIS_URL=redis://localhost:6379
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

#### Frontend (.env.production)
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
```

### SSL Certificate Setup

```bash
# Using Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Certificate paths
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

## Development Deployment

### Local Development Setup

1. **Clone and Install Dependencies**
```bash
git clone https://github.com/your-org/go4it-sports.git
cd go4it-sports

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Database Setup**
```bash
# Start MongoDB
sudo systemctl start mongodb

# Seed initial data
cd backend
npm run seed:cms
```

3. **Start Development Servers**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

4. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Production Deployment

### Option 1: Traditional Server Deployment

1. **Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

2. **Application Deployment**
```bash
# Clone repository
git clone https://github.com/your-org/go4it-sports.git /var/www/go4it
cd /var/www/go4it

# Install dependencies
cd backend && npm ci --production
cd ../frontend && npm ci && npm run build
```

3. **PM2 Configuration**
```bash
# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'go4it-backend',
    script: 'backend/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/go4it
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Frontend
    location / {
        root /var/www/go4it/frontend/build;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

### Option 2: Docker Deployment

1. **Docker Compose Setup**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/go4it_prod
    depends_on:
      - mongo
      - redis
    networks:
      - go4it-network

  mongo:
    image: mongo:5.0
    volumes:
      - mongodb_data:/data/db
    networks:
      - go4it-network

  redis:
    image: redis:7-alpine
    networks:
      - go4it-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    networks:
      - go4it-network

volumes:
  mongodb_data:

networks:
  go4it-network:
    driver: bridge
```

2. **Production Dockerfile**
```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S go4it -u 1001

# Change ownership
RUN chown -R go4it:nodejs /app
USER go4it

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["npm", "start"]
```

3. **Deploy with Docker**
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## Monitoring & Maintenance

### Health Checks
- **Application Health**: `GET /health`
- **Detailed Metrics**: `GET /metrics` (requires authentication)
- **Database Health**: MongoDB connection status
- **System Resources**: Memory, CPU, disk usage

### Log Management
```bash
# View PM2 logs
pm2 logs go4it-backend

# Monitor resources
pm2 monit

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Backup Strategy
```bash
# Database backup
mongodump --db go4it_prod --out /backup/$(date +%Y%m%d)

# Application backup
tar -czf /backup/app-$(date +%Y%m%d).tar.gz /var/www/go4it

# Automated backup script
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Common Issues

1. **Application Won't Start**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs go4it-backend --lines 100

# Restart application
pm2 restart go4it-backend
```

2. **Database Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Test connection
mongo --eval "db.stats()"

# Check connection string in .env
```

3. **Memory Issues**
```bash
# Check memory usage
pm2 monit

# Restart with more memory
pm2 restart go4it-backend --max-memory 1G
```

4. **SSL Certificate Issues**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Reload Nginx
sudo nginx -t && sudo nginx -s reload
```

### Performance Optimization

1. **Enable Gzip Compression**
```nginx
# In nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

2. **Database Indexing**
```javascript
// Add indexes for frequently queried fields
db.players.createIndex({ "name": 1 });
db.players.createIndex({ "position": 1 });
db.players.createIndex({ "school": 1 });
```

3. **Caching Strategy**
```javascript
// Implement Redis caching for API responses
const cache = require('redis').createClient();

app.get('/api/players', async (req, res) => {
  const cacheKey = 'players:' + JSON.stringify(req.query);

  cache.get(cacheKey, async (err, cached) => {
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const players = await Player.find(req.query);
    cache.setex(cacheKey, 300, JSON.stringify(players)); // Cache for 5 minutes
    res.json(players);
  });
});
```

## Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Authentication middleware active
- [ ] Database credentials secured
- [ ] File upload restrictions in place
- [ ] CORS properly configured
- [ ] Regular security updates scheduled

## Support

For deployment issues or questions:
- Check the logs: `pm2 logs`
- Health endpoint: `GET /health`
- Documentation: This guide
- Support team: devops@go4it-sports.com
