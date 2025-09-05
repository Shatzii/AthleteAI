# AthleteAI (Go4It Sports Platform) - Complete Documentation

## Overview
The AthleteAI platform is a comprehensive full-stack web application designed to analyze and optimize athletic performance using artificial intelligence. The platform provides users with insights based on their performance metrics, training programs, and AI analysis, with a focus on football and multi-sport athlete development.

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 🏆 Core Features

#### 1. AI Football Coach
- **Voice & Text Interaction**: Ask questions about football strategies and techniques
- **Video Demonstrations**: Watch instructional videos for various plays and drills
- **Real-time Responses**: Get instant answers to football-related questions
- **Strategy Topics**: Cover 2 Defense, West Coast Offense, QB Footwork, etc.
- **Interactive Learning**: Clickable example questions
- **Route**: `/ai-football-coach`

#### 2. Enhanced Athlete Ranking System
- **GAR Scoring Algorithm**: 15 ranking categories with weighted scoring
- **Real-time Data Integration**: Scraping from MaxPreps, HUDL, Athletic.net, ESPN, 247Sports
- **Multi-source Data Combination**: Priority-weighted data merging
- **Data Quality Monitoring**: Automated quality checks and alerts
- **Scheduled Data Refresh**: Background job processing for data updates
- **Route**: `/rankings`

#### 3. NCAA Tracker
- **Eligibility Tracking**: NCAA compliance and eligibility monitoring
- **Performance Analytics**: Statistical analysis and insights
- **Recruiting Data**: College recruiting information and timelines
- **Route**: `/ncaa-tracker`

#### 4. Player Management
- **Player Profiles**: Comprehensive athlete information
- **Performance Tracking**: Stats and metrics monitoring
- **Career Development**: Player progression tracking
- **Route**: `/players`

#### 5. Recruiting Hub
- **College Recruitment**: University recruiting information
- **Scholarship Tracking**: Financial aid and scholarship data
- **Recruiting Timelines**: Important dates and deadlines
- **Route**: `/recruiting-hub`

#### 6. StarPath
- **Career Planning**: Long-term athletic career development
- **Goal Setting**: Achievement tracking and milestones
- **Progress Monitoring**: Performance improvement tracking
- **Route**: `/starpath`

#### 7. International Sports
- **Global Competitions**: International sporting events
- **Cross-cultural Analysis**: International performance comparisons
- **Route**: `/international-sports`

#### 8. Admin Dashboard
- **System Management**: Platform administration tools
- **User Management**: User account and permission control
- **Marketing Dashboard**: Campaign and analytics management
- **Route**: `/admin` and `/admin/marketing`

---

## Technology Stack

### Backend
- **Runtime**: Node.js v22.17.0
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Process Management**: PM2
- **Monitoring**: New Relic APM, Sentry, Winston

### Frontend
- **Framework**: React 17.0.2
- **Routing**: React Router DOM v5.2.0
- **HTTP Client**: Axios
- **Charts**: Chart.js v3.6.0
- **Animations**: GSAP v3.10.4
- **Icons**: Lucide React
- **Styling**: CSS3 with Tailwind CSS
- **Build Tool**: Create React App

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt (auto-configured)
- **CI/CD**: GitHub Actions (planned)
- **Cloud**: AWS/Azure ready

### External Integrations
- **Data Sources**: MaxPreps, HUDL, Athletic.net, ESPN, 247Sports
- **Video Processing**: YouTube API
- **Email**: SendGrid/Mailgun (planned)
- **SMS**: Twilio (planned)

---

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   (React)       │◄──►│   (Nginx)       │◄──►│   (Express)     │
│                 │    │                 │    │                 │
│ - Components    │    │ - Load Balance  │    │ - Controllers   │
│ - Routing       │    │ - SSL Term.     │    │ - Services      │
│ - State Mgmt    │    │ - Rate Limit    │    │ - Models        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (MongoDB)     │
                    │                 │
                    │ - Users         │
                    │ - Players       │
                    │ - Articles      │
                    │ - Media         │
                    │ - Analytics     │
                    └─────────────────┘
```

### Service Architecture
```
AthleteAI Backend Services
├── Core Services
│   ├── DataScrapingService      # Multi-source data collection
│   ├── DataStorageService       # Data normalization & persistence
│   ├── ScheduledDataRefresh     # Background data updates
│   ├── DataQualityMonitoring    # Quality assurance & alerts
│   ├── RealTimeService          # WebSocket communication
│   ├── BackgroundJobProcessor   # Async job processing
│   └── AchievementSystem        # Gamification platform
├── API Services
│   ├── AuthService             # Authentication & authorization
│   ├── UserService             # User management
│   ├── PlayerService           # Athlete data management
│   ├── RankingService          # GAR scoring & rankings
│   ├── AnalyticsService        # Performance analytics
│   └── AdminService            # Administrative functions
└── Infrastructure
    ├── DatabaseService         # MongoDB connection & queries
    ├── CacheService            # Redis caching
    ├── EmailService            # Email notifications
    └── MonitoringService       # Health checks & metrics
```

---

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Redis (for caching)
- Docker & Docker Compose (optional)
- PM2 (for production)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AthleteAI
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your configuration
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

### Docker Setup
```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up --build
```

---

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/athleteai
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret
JWT_EXPIRES_IN=24h

# External Services
NEW_RELIC_LICENSE_KEY=your-newrelic-key
SENTRY_DSN=your-sentry-dsn

# Email (optional)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@athleteai.com

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Data Scraping
SCRAPING_RATE_LIMIT=2000
SCRAPING_TIMEOUT=30000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000
REACT_APP_ENVIRONMENT=development
```

### Database Configuration
```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
```

---

## API Documentation

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.athleteai.com/api/v1
```

### Authentication Endpoints

#### POST /auth/login
User login endpoint
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/register
User registration endpoint
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "athlete"
}
```

### Ranking System Endpoints

#### GET /rankings
Get athlete rankings with filtering
```javascript
GET /rankings?sport=football&position=QB&limit=50&sort=garScore
```

#### GET /rankings/:athleteId
Get detailed athlete ranking information

#### POST /rankings/scrape-athlete
Trigger athlete data scraping
```json
{
  "name": "Arch Manning",
  "sport": "football",
  "sources": ["maxpreps", "espn"]
}
```

### Data Management Endpoints

#### GET /data/stats
Get data quality statistics

#### GET /data/refresh/stats
Get data refresh service statistics

#### POST /data/refresh/manual
Manual athlete data refresh
```json
{
  "athleteName": "Arch Manning",
  "sport": "football"
}
```

#### GET /data/quality/alerts
Get current data quality alerts

### Player Management Endpoints

#### GET /players
Get all players with filtering

#### GET /players/:id
Get player by ID

#### POST /players
Create new player profile

#### PUT /players/:id
Update player information

#### DELETE /players/:id
Delete player profile

### Admin Endpoints

#### GET /admin/dashboard
Get admin dashboard statistics

#### GET /admin/users
Get all users (admin only)

#### POST /admin/users/:id/role
Update user role

#### GET /admin/analytics
Get platform analytics

---

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String, // Hashed
  role: String, // 'athlete', 'coach', 'admin'
  profile: {
    avatar: String,
    bio: String,
    sport: String,
    position: String
  },
  preferences: Object,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Player Model
```javascript
{
  _id: ObjectId,
  name: String,
  sport: String,
  position: String,
  school: String,
  year: Number, // Graduation year
  stats: Object, // Sport-specific statistics
  highlights: [{
    title: String,
    url: String,
    platform: String,
    views: Number,
    duration: String
  }],
  recruitingData: {
    rating: Number,
    stars: Number,
    ranking: Number,
    offers: Number
  },
  metadata: {
    sourcesUsed: [String],
    dataQuality: Number,
    confidence: Number,
    lastUpdated: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Ranking Model
```javascript
{
  _id: ObjectId,
  athleteId: ObjectId,
  garScore: Number,
  breakdown: {
    technical: Number,
    physical: Number,
    tactical: Number,
    mental: Number,
    consistency: Number
  },
  categoryRankings: Object,
  lastCalculated: Date,
  version: Number
}
```

### Scraping Job Model
```javascript
{
  _id: ObjectId,
  type: String, // 'scraping', 'refresh', 'batch'
  athleteName: String,
  sport: String,
  status: String, // 'queued', 'processing', 'completed', 'failed'
  priority: String, // 'low', 'medium', 'high', 'urgent'
  result: Object,
  error: String,
  createdAt: Date,
  startedAt: Date,
  completedAt: Date,
  duration: Number
}
```

---

## Deployment

### Development Deployment
```bash
# Using Docker Compose
docker-compose up --build

# Manual deployment
cd backend && npm run dev
cd frontend && npm start
```

### Production Deployment

#### Using PM2
```bash
# Build the application
cd backend
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up --build -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### SSL Configuration
```nginx
# nginx.conf for SSL termination
server {
    listen 80;
    server_name athleteai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name athleteai.com;

    ssl_certificate /etc/letsencrypt/live/athleteai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/athleteai.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Monitoring & Logging

### Health Checks
```bash
# Application health
curl http://localhost:5000/health

# Detailed health
curl http://localhost:5000/api/health

# Service-specific health
curl http://localhost:5000/api/v1/data/stats
```

### Log Files
```
backend/logs/
├── combined-YYYY-MM-DD.log    # All logs
├── error-YYYY-MM-DD.log       # Error logs only
├── http-YYYY-MM-DD.log        # HTTP request logs
├── exceptions.log             # Uncaught exceptions
└── rejections.log             # Unhandled rejections
```

### Monitoring Setup
```javascript
// New Relic configuration
require('newrelic');

// Sentry configuration
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:auth          # Authentication tests
npm run test:players       # Player tests
npm run test:coverage      # With coverage

# Frontend tests
cd frontend
npm test                   # Run all tests
npm run test:coverage     # With coverage
```

### Test Structure
```
backend/tests/
├── auth.test.js           # Authentication tests
├── players.test.js        # Player management tests
├── discovery.test.js      # Data discovery tests
├── logging.test.js        # Logging tests
├── security.test.js       # Security tests
└── setup.js              # Test configuration

frontend/src/components/__tests__/
├── Admin.test.js         # Admin component tests
├── Players.test.js       # Players component tests
└── StarPath.test.js      # StarPath component tests
```

### Integration Testing
```javascript
// Example API integration test
const request = require('supertest');
const app = require('../app');

describe('API Integration Tests', () => {
  test('GET /api/v1/rankings should return rankings', async () => {
    const response = await request(app)
      .get('/api/v1/rankings')
      .expect(200);

    expect(response.body).toHaveProperty('rankings');
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
mongosh "mongodb://localhost:27017/athleteai"
```

#### 2. Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 3. Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### 4. Docker Issues
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache
```

### Performance Issues

#### Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart services
pm2 restart all
```

#### Database Performance
```javascript
// Add database indexes
db.players.createIndex({ "name": 1 });
db.players.createIndex({ "sport": 1, "position": 1 });
db.rankings.createIndex({ "garScore": -1 });
```

### Data Scraping Issues

#### Rate Limiting
```javascript
// Adjust scraping configuration
const scrapingConfig = {
  rateLimit: 3000,    // Increase delay between requests
  timeout: 45000,     // Increase timeout
  retries: 5         // Increase retry attempts
};
```

#### Source URL Changes
```javascript
// Update source URLs in DataScrapingService
const updatedUrls = {
  maxpreps: 'https://new.maxpreps.com/search',
  hudl: 'https://new.hudl.com/search',
  // ... other sources
};
```

---

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Create a Pull Request

### Code Standards
```javascript
// Use ESLint configuration
{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es6": true
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}
```

### Commit Message Format
```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Testing
- chore: Maintenance
```

---

## Security

### Best Practices
- **Input Validation**: All user inputs validated with Joi
- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Rate Limiting**: API protection against abuse
- **HTTPS**: SSL/TLS encryption in production
- **Headers**: Security headers with Helmet.js

### Security Checklist
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] API keys rotated regularly
- [ ] Dependencies updated
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] XSS protection enabled
- [ ] CSRF protection configured

---

## Performance Optimization

### Frontend Optimization
```javascript
// Code splitting
const AthleteProfile = lazy(() => import('./components/AthleteProfile'));

// Image optimization
const optimizedImage = require('optimized-image.jpg?sizes[]=300,sizes[]=600');

// Bundle analysis
npm run analyze
```

### Backend Optimization
```javascript
// Database query optimization
const players = await Player.find()
  .select('name position stats')
  .limit(50)
  .sort({ createdAt: -1 });

// Caching strategy
const cache = require('redis');
await cache.setex('players:list', 3600, JSON.stringify(players));
```

### CDN Configuration
```nginx
# Static file caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

### Documentation
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)

### Community
- **Issues**: [GitHub Issues](https://github.com/username/athleteai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/athleteai/discussions)
- **Email**: support@athleteai.com

### Professional Services
- Custom development
- Performance optimization
- Security audits
- Training and consulting

---

## Roadmap

### Q4 2025
- [ ] Complete multi-source data integration
- [ ] Real-time WebSocket features
- [ ] Mobile app development
- [ ] Advanced analytics dashboard

### Q1 2026
- [ ] AI-powered training recommendations
- [ ] Social features and networking
- [ ] International expansion
- [ ] API marketplace

### Future Enhancements
- [ ] Machine learning models for performance prediction
- [ ] VR/AR training modules
- [ ] Blockchain-based achievement system
- [ ] IoT device integration

---

*Last updated: September 3, 2025*
*Version: 1.0.0*
*Maintained by: AthleteAI Development Team*
