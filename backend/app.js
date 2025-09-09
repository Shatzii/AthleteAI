// require('newrelic');
require('dotenv').config();

// Initialize Sentry FIRST (before any other imports)
const { sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
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
const eligibilityRoutes = require('./routes/eligibilityRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const oauthRoutes = require('./routes/oauthRoutes');

// New AI/ML routes
const injuryRiskRoutes = require('./routes/injuryRiskRoutes');
const performancePredictionRoutes = require('./routes/performancePredictionRoutes');
const enhancedCoachRoutes = require('./routes/enhancedCoachRoutes');
const authMiddleware = require('./middleware/auth');
const { securityHeaders, apiLimiter, authLimiter, corsOptions } = require('./middleware/security');
const backendMonitor = require('./utils/monitoring');
const { cacheMiddleware } = require('./utils/cache');
const { logger, logRequest, checkLogHealth } = require('./utils/logger');
const { checkSentryHealth } = require('./utils/sentry');

// Initialize advanced services
const DatabaseShardingService = require('./services/databaseSharding');
const MessageQueueService = require('./services/messageQueue');

// Import new services
const { RealTimeService } = require('./services/realTimeService');
const jobProcessor = require('./services/backgroundJobProcessor');
const achievementSystem = require('./services/achievementSystem');
const DataStorageService = require('./services/dataStorageService');
const ScheduledDataRefreshService = require('./services/scheduledDataRefreshService');
const DataQualityMonitoringService = require('./services/dataQualityMonitoringService');

// Database connection - moved up before routes
const { connectDB, getDBStats } = require('./config/database');
connectDB().catch(err => console.error('Database connection failed:', err));

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const dbShardingService = new DatabaseShardingService();
const messageQueueService = new MessageQueueService();
const dataStorageService = new DataStorageService();
const scheduledDataRefreshService = new ScheduledDataRefreshService();
const dataQualityMonitoringService = new DataQualityMonitoringService();

// Middleware
app.use(securityHeaders); // Security headers first
app.use(sentryTracingHandler); // Sentry tracing for performance monitoring
app.use(cors(corsOptions)); // CORS with security options
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

// Session configuration for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use(logRequest);

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve static files from frontend public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// OAuth routes
app.use('/api/v1/auth', oauthRoutes);

// Database connection moved to top of file

// Initialize advanced services - commented out for development
// (async () => {
//     try {
//         // Initialize database sharding
//         // await dbShardingService.initializeSharding();

//         // Initialize message queue
//         // await messageQueueService.initialize();

//         // Initialize data services
//         await dataStorageService.initialize();
//         await scheduledDataRefreshService.initialize();
//         await dataQualityMonitoringService.initialize();

//         // Start scheduled services
//         await scheduledDataRefreshService.start();
//         await dataQualityMonitoringService.start();

//         logger.info('Data services initialized and started');
//         logger.info('Advanced services initialization skipped for development');
//     } catch (error) {
//         logger.error('Failed to initialize advanced services:', error);
//         // Don't exit in development
//         // process.exit(1);
//     }
// })();

// Health check endpoint
app.get('/health', async (req, res) => {
    const healthStatus = backendMonitor.getHealthStatus();
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const logHealth = checkLogHealth();
    const sentryHealth = await checkSentryHealth();
    
    // Check advanced services health
    const shardingHealth = await dbShardingService.healthCheck().catch(() => ({ overall: 'error' }));
    const queueHealth = messageQueueService.getQueueStats();
    const dataStorageHealth = await dataStorageService.healthCheck ? await dataStorageService.healthCheck().catch(() => ({ healthy: false })) : { healthy: true };
    const refreshHealth = await scheduledDataRefreshService.healthCheck ? await scheduledDataRefreshService.healthCheck().catch(() => ({ healthy: false })) : { healthy: true };
    const qualityHealth = await dataQualityMonitoringService.healthCheck ? await dataQualityMonitoringService.healthCheck().catch(() => ({ healthy: false })) : { healthy: true };

    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbStatus,
        logging: logHealth,
        errorTracking: sentryHealth,
        sharding: shardingHealth,
        messageQueue: queueHealth,
        dataStorage: dataStorageHealth,
        scheduledRefresh: refreshHealth,
        qualityMonitoring: qualityHealth,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...healthStatus
    });
});

// Advanced services API endpoints
app.get('/api/v1/sharding/stats', async (req, res) => {
    try {
        const stats = await dbShardingService.getShardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/v1/queue/stats', (req, res) => {
    try {
        const stats = messageQueueService.getQueueStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/v1/queue/job', async (req, res) => {
    try {
        const { queueName, jobData } = req.body;
        const jobId = await messageQueueService.addJob(queueName, jobData);
        res.json({ jobId, status: 'queued' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Data services API endpoints
app.get('/api/v1/data/stats', async (req, res) => {
    try {
        const stats = await dataStorageService.getDataQualityStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/v1/data/refresh/stats', async (req, res) => {
    try {
        const stats = await scheduledDataRefreshService.getRefreshStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/v1/data/refresh/manual', async (req, res) => {
    try {
        const { athleteName, sport } = req.body;
        const jobId = await scheduledDataRefreshService.refreshAthlete(athleteName, sport);
        res.json({ jobId, status: 'scheduled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/v1/data/quality/alerts', async (req, res) => {
    try {
        const alerts = dataQualityMonitoringService.getCurrentAlerts();
        res.json({ alerts, count: alerts.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/v1/data/quality/metrics', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const metrics = await dataQualityMonitoringService.getQualityMetricsHistory(hours);
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/v1/data/quality/check', async (req, res) => {
    try {
        await dataQualityMonitoringService.manualQualityCheck();
        res.json({ status: 'Quality check initiated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes with API versioning and caching
app.use('/api/v1/users', authLimiter, userRoutes); // Stricter rate limiting for auth routes
console.log('🔐 Mounting auth routes at /api/v1/auth (without rate limiter for testing)');
app.use('/api/v1/auth', require('./routes/authRoutes')); // Authentication routes - temporarily removed rate limiter
console.log('✅ Auth routes mounted successfully');

// Test route to verify basic routing works
app.get('/test', (req, res) => {
    console.log('🧪 Test route hit!');
    res.json({ message: 'Test route works!' });
});
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
app.use('/api/v1/eligibility', eligibilityRoutes); // NCAA eligibility and AI coach
app.use('/api/v1/rankings', cacheMiddleware(900), rankingRoutes); // Cache for 15 minutes

// New AI/ML routes
app.use('/api/v1/injury-risk', injuryRiskRoutes); // Injury risk assessment
app.use('/api/v1/performance-prediction', performancePredictionRoutes); // Performance prediction
app.use('/api/v1/enhanced-coach', enhancedCoachRoutes); // Enhanced NLP coach

// Legacy routes (redirect to v1)
app.use('/api/users', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/auth', (req, res) => res.redirect(301, `/api/v1${req.path}`));
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
app.use('/api/eligibility', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/rankings', (req, res) => res.redirect(301, `/api/v1${req.path}`));

// Legacy redirects for new AI/ML routes
app.use('/api/injury-risk', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/performance-prediction', (req, res) => res.redirect(301, `/api/v1${req.path}`));
app.use('/api/enhanced-coach', (req, res) => res.redirect(301, `/api/v1${req.path}`));

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

// Start server only when this file is run directly (not when imported for testing)
if (require.main === module) {
    console.log('Starting server...');
    const server = app.listen(PORT, () => {
        console.log('✅ Server started successfully!');
        logger.info('Server started successfully', {
            port: PORT,
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            timestamp: new Date().toISOString()
        });
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Health check available at http://localhost:${PORT}/health`);
    });

    // Initialize real-time service
    const realTimeService = new RealTimeService(server);
    global.realTimeService = realTimeService;

    logger.info('Real-time service initialized and attached to server');
}

// 404 handler - MUST be last
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
            // Shutdown advanced services
            await Promise.all([
                dbShardingService.shutdown(),
                messageQueueService.shutdown(),
                realTimeService ? realTimeService.shutdown() : Promise.resolve(),
                scheduledDataRefreshService ? scheduledDataRefreshService.stop() : Promise.resolve(),
                dataQualityMonitoringService ? dataQualityMonitoringService.stop() : Promise.resolve()
            ]);
            
            // Close database connections
            await mongoose.connection.close();
            
            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Export the app for testing
module.exports = app;