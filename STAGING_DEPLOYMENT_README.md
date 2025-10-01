# AthleteAI Staging Deployment Guide

This guide covers the staging deployment setup for the AthleteAI platform.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git repository cloned
- Environment configuration ready

### Deploy to Staging

1. **Configure Environment**
   ```bash
   cp .env.staging.example .env.staging
   # Edit .env.staging with your actual configuration values
   ```

2. **Deploy**
   ```bash
   ./deploy-staging.sh
   ```

3. **Access the Application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5001
   - Health Check: http://localhost:5001/health

## 📋 Staging Environment Overview

### Services
- **Backend API** (Port 5001): Node.js/Express API server
- **Frontend** (Port 3001): React application
- **MongoDB** (Port 27018): Database for staging data
- **Redis** (Port 6380): Caching and session storage
- **Nginx** (Port 80/443): Reverse proxy and load balancer

### Features Enabled in Staging
- ✅ All 14 implemented features
- ✅ Authentication & Authorization
- ✅ Database persistence
- ✅ Caching
- ✅ Health monitoring
- ✅ Rate limiting
- ⚠️ External APIs (Google AI, Stripe, etc.) - require API keys

## 🔧 Configuration

### Environment Variables
Copy `.env.staging.example` to `.env.staging` and configure:

```bash
# Required
NODE_ENV=staging
JWT_SECRET=your-secure-jwt-secret

# Optional (features disabled if not provided)
GOOGLE_AI_API_KEY=your-google-ai-key
STRIPE_SECRET_KEY=your-stripe-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### Docker Services

The staging environment uses separate containers with different ports to avoid conflicts with development:

- `athleteai-backend-staging`: Backend API server
- `athleteai-frontend-staging`: Frontend React app
- `mongo-staging`: MongoDB database
- `redis-staging`: Redis cache
- `nginx-staging`: Nginx reverse proxy

## 🛠️ Management Commands

### Start Staging Environment
```bash
./deploy-staging.sh
```

### Stop Staging Environment
```bash
./deploy-staging.sh stop
```

### Restart Services
```bash
./deploy-staging.sh restart
```

### View Logs
```bash
./deploy-staging.sh logs
```

### Check Status
```bash
./deploy-staging.sh status
```

### Manual Docker Commands
```bash
# View running containers
docker-compose -f docker-compose.staging.yml ps

# View logs for specific service
docker-compose -f docker-compose.staging.yml logs backend

# Execute commands in containers
docker-compose -f docker-compose.staging.yml exec backend bash
```

## 🧪 Testing in Staging

### Health Checks
```bash
# Backend health
curl http://localhost:5001/health

# API status
curl http://localhost:5001/api/v1/auth/status
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery quick --count 50 --num 10 http://localhost:5001/health
```

## 🔍 Monitoring

### Logs
- Application logs: `docker-compose -f docker-compose.staging.yml logs`
- Nginx access logs: Available in nginx container
- MongoDB logs: Available in mongo-staging container

### Health Endpoints
- `/health`: Basic health check
- `/metrics`: Application metrics (if enabled)

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Ensure ports 3001, 5001, 27018, 6380 are available
   - Check with: `netstat -tulpn | grep :3001`

2. **Environment Variables**
   - Ensure `.env.staging` exists and is properly configured
   - Check logs for missing required variables

3. **Database Connection**
   - Verify MongoDB is running: `docker-compose -f docker-compose.staging.yml logs mongo-staging`
   - Check connection string in environment variables

4. **Build Failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild: `docker-compose -f docker-compose.staging.yml build --no-cache`

### Debug Mode
```bash
# Run with debug logging
NODE_ENV=staging DEBUG=* ./deploy-staging.sh

# Check container resource usage
docker stats
```

## 🔒 Security Considerations

### Staging Environment Security
- Separate database from production
- Use strong JWT secrets
- Configure proper CORS settings
- Enable rate limiting
- Monitor for security vulnerabilities

### API Keys
- Never commit real API keys to version control
- Use environment variables for all secrets
- Rotate keys regularly
- Monitor API usage

## 📊 Performance Optimization

### Database
- MongoDB indexes are automatically created
- Connection pooling is configured
- Redis caching is enabled

### Application
- Gzip compression enabled
- Static asset caching configured
- Rate limiting active
- Health checks implemented

## 🚀 Next Steps

After successful staging deployment:

1. **Load Testing**: Perform comprehensive load testing
2. **Integration Testing**: Test all 14 features end-to-end
3. **Security Audit**: Run security scans
4. **Performance Monitoring**: Set up monitoring dashboards
5. **Production Deployment**: Prepare for production deployment

## 📞 Support

For issues with staging deployment:
1. Check the logs: `./deploy-staging.sh logs`
2. Verify configuration in `.env.staging`
3. Ensure all required services are running
4. Check Docker resource allocation

---

**Staging Environment Status**: ✅ Configured and Ready for Deployment