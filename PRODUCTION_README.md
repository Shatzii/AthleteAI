# Go4It Sports Platform - Production Deployment Guide

## 🚀 Production Readiness Overview

This guide covers the complete production deployment process for the Go4It Sports Platform, including security hardening, monitoring, and best practices.

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 16+ and npm
- MongoDB (or MongoDB Atlas)
- Redis (or Redis Cloud)
- SSL certificate (Let's Encrypt recommended)
- Domain name

## 🔒 Security Configuration

### 1. Environment Variables

Copy the production environment template and configure secure values:

```bash
cp .env.production .env
```

**CRITICAL: Update these values with secure production secrets:**

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For SESSION_SECRET

# Update in .env:
JWT_SECRET=your-secure-jwt-secret-here
SESSION_SECRET=your-secure-session-secret-here
MONGO_ROOT_PASSWORD=your-secure-mongo-password
REDIS_PASSWORD=your-secure-redis-password
```

### 2. SSL/TLS Configuration

#### Option A: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Option B: Manual SSL
Place your SSL certificate and key in `nginx/ssl/`:
```
nginx/ssl/cert.pem
nginx/ssl/key.pem
```

### 3. Security Audit

Run the security audit before deployment:

```bash
./security-audit.sh
```

## 🏗️ Production Deployment

### Automated Deployment

Use the production deployment script:

```bash
./deploy-production.sh
```

This script will:
- ✅ Run security checks
- ✅ Create backups
- ✅ Build applications
- ✅ Run database migrations
- ✅ Deploy with Docker
- ✅ Verify health checks

### Manual Deployment

If you prefer manual deployment:

```bash
# 1. Build applications
cd backend && npm run build
cd ../frontend && npm run build
cd ..

# 2. Start production services
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Check deployment status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

## 📊 Monitoring & Maintenance

### Health Checks

The application includes built-in health checks:

```bash
# Check application health
curl http://localhost:5000/health

# Check container health
docker-compose -f docker-compose.prod.yml ps
```

### Logging

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f go4it-backend

# View nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Monitoring Setup

#### New Relic (Application Performance)
1. Sign up at [New Relic](https://newrelic.com)
2. Get your license key
3. Update `NEW_RELIC_LICENSE_KEY` in `.env`
4. Uncomment `require('newrelic');` in `backend/app.js`

#### Nginx Monitoring
```bash
# Enable nginx stub status
# Add to nginx.conf:
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Run deployment script
./deploy-production.sh
```

### Dependency Updates

```bash
# Check for vulnerabilities
cd backend && npm audit
cd ../frontend && npm audit

# Update dependencies
npm update

# Rebuild and deploy
./deploy-production.sh
```

### Database Backups

```bash
# Manual backup
docker exec go4it-mongo mongodump --db go4it --out /backup

# Copy backup to host
docker cp go4it-mongo:/backup ./backups/
```

## 🚨 Security Best Practices

### Regular Maintenance

1. **Weekly Security Audits**
   ```bash
   ./security-audit.sh
   ```

2. **Monthly Dependency Updates**
   ```bash
   npm audit fix
   npm update
   ```

3. **Quarterly Security Reviews**
   - Rotate all secrets
   - Review access logs
   - Update SSL certificates

### Incident Response

1. **Monitor Logs Regularly**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f | grep -i error
   ```

2. **Set Up Alerts**
   - Monitor for unusual login attempts
   - Alert on high error rates
   - Monitor resource usage

3. **Backup Strategy**
   - Daily database backups
   - Weekly full system backups
   - Test backup restoration monthly

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs go4it-backend

# Check environment variables
docker-compose -f docker-compose.prod.yml exec go4it-backend env
```

#### Database Connection Issues
```bash
# Check MongoDB
docker-compose -f docker-compose.prod.yml exec mongo mongosh --eval "db.stats()"

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

#### SSL Issues
```bash
# Check certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

### Performance Optimization

1. **Enable Gzip Compression**
   ```nginx
   # Add to nginx.conf
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **Set Up Caching**
   ```nginx
   # Cache static assets
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Database Optimization**
   ```javascript
   // Add indexes in MongoDB
   db.users.createIndex({ email: 1 });
   db.articles.createIndex({ createdAt: -1 });
   ```

## 📞 Support & Documentation

- **API Documentation**: Available at `/api/docs` (when implemented)
- **Health Check**: `GET /health`
- **Logs**: Check Docker logs or application logs
- **Metrics**: New Relic dashboard (if configured)

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] SSL/TLS configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Dependencies updated
- [ ] Security audit passed
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Access controls verified

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures, monitor logs, and stay informed about security best practices.
