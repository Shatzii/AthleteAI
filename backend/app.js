// require('newrelic');
require('dotenv').config();

// Initialize Sentry FIRST (before any other imports)
const { sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const footballRoutes = require('./routes/footballRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const ncaaRoutes = require('./routes/ncaaRoutes');
const playerRoutes = require('./routes/playerRoutes');
const articleRoutes = require('./routes/articleRoutes');
const pageRoutes = require('./routes/pageRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const starpathRoutes = require('./routes/starpathRoutes');
const recruitingRoutes = require('./routes/recruitingRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const authMiddleware = require('./middleware/auth');
const { securityHeaders, apiLimiter, authLimiter, corsOptions } = require('./middleware/security');
const backendMonitor = require('./utils/monitoring');
const { cacheMiddleware } = require('./utils/cache');
const { logger, logRequest, checkLogHealth } = require('./utils/logger');
const { checkSentryHealth } = require('./utils/sentry');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(securityHeaders); // Security headers first
app.use(sentryTracingHandler); // Sentry tracing for performance monitoring
app.use(cors(corsOptions)); // CORS with security options
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

// Request logging middleware
app.use(logRequest);

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve static files from frontend public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Database connection
const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/go4it';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => logger.info('MongoDB connected successfully', { database: dbURI }))
    .catch(err => logger.error('MongoDB connection error', { error: err.message, stack: err.stack }));

// Health check endpoint
app.get('/health', async (req, res) => {
    const healthStatus = backendMonitor.getHealthStatus();
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const logHealth = checkLogHealth();
    const sentryHealth = await checkSentryHealth();

    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbStatus,
        logging: logHealth,
        errorTracking: sentryHealth,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...healthStatus
    });
});

// Routes with API versioning and caching
app.use('/api/v1/users', authLimiter, userRoutes); // Stricter rate limiting for auth routes
app.use('/api/v1/auth', authLimiter, require('./routes/authRoutes')); // Authentication routes
app.use('/api/v1/football', cacheMiddleware(1800), footballRoutes); // Cache for 30 minutes
app.use('/api/v1/performance', cacheMiddleware(900), performanceRoutes); // Cache for 15 minutes
app.use('/api/v1/ncaa', cacheMiddleware(3600), ncaaRoutes); // Cache for 1 hour
app.use('/api/v1/players', cacheMiddleware(1800), playerRoutes); // Cache for 30 minutes
app.use('/api/v1/articles', cacheMiddleware(1800), articleRoutes); // Cache for 30 minutes
app.use('/api/v1/pages', cacheMiddleware(3600), pageRoutes); // Cache for 1 hour
app.use('/api/v1/media', cacheMiddleware(7200), mediaRoutes); // Cache for 2 hours
app.use('/api/v1/campaigns', cacheMiddleware(1800), campaignRoutes); // Cache for 30 minutes
app.use('/api/v1/starpath', cacheMiddleware(900), starpathRoutes); // Cache for 15 minutes
app.use('/api/v1/recruiting', cacheMiddleware(1800), recruitingRoutes); // Cache for 30 minutes
app.use('/api/v1/discovery', discoveryRoutes); // Athlete discovery and scraping

// Legacy routes (redirect to v1)
app.use('/api/users', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/football', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/performance', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/ncaa', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/players', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/articles', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/pages', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/media', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/campaigns', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/starpath', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/recruiting', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/discovery', (req, res) => res.redirect(301, `/api/v1${req.path}`));

// Monitoring middleware
app.use(backendMonitor.requestLogger.bind(backendMonitor));

// Health check endpoint
app.get('/health', (req, res) => {
    const healthStatus = backendMonitor.getHealthStatus();
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbStatus,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...healthStatus
    });
});

// Detailed health check endpoint
app.get('/api/health', async (req, res) => {
    const healthStatus = backendMonitor.getHealthStatus();
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const logHealth = checkLogHealth();
    const sentryHealth = await checkSentryHealth();

    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
            status: dbStatus,
            name: mongoose.connection.name,
            host: mongoose.connection.host
        },
        logging: logHealth,
        errorTracking: sentryHealth,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...healthStatus
    });
});

// Metrics endpoint (protected)
app.get('/metrics', authMiddleware.authenticateToken, (req, res) => {
    res.json(backendMonitor.getMetrics());
});

// Error handling middleware
app.use(sentryErrorHandler); // Sentry error tracking
app.use(backendMonitor.errorLogger.bind(backendMonitor)); // Existing error logger

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString()
    });
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});