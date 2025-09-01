const express = require('express');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

// API Gateway Service
class APIGateway {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Advanced rate limiting with different tiers
        const createRateLimit = (windowMs, max, message) => {
            return rateLimit({
                windowMs,
                max,
                message: { error: message },
                standardHeaders: true,
                legacyHeaders: false,
                handler: (req, res) => {
                    res.status(429).json({
                        error: 'Too many requests',
                        message,
                        retryAfter: Math.ceil(windowMs / 1000)
                    });
                }
            });
        };

        // General API rate limiting
        this.app.use('/api/', createRateLimit(
            15 * 60 * 1000, // 15 minutes
            1000, // 1000 requests per window
            'Too many API requests, please try again later'
        ));

        // Authentication endpoints - stricter limits
        this.app.use('/api/auth/', createRateLimit(
            15 * 60 * 1000,
            10,
            'Too many authentication attempts'
        ));

        // Discovery endpoints - moderate limits
        this.app.use('/api/discovery/', createRateLimit(
            15 * 60 * 1000,
            50,
            'Too many discovery requests'
        ));

        // Speed limiting for abusive clients
        this.app.use(slowDown({
            windowMs: 15 * 60 * 1000, // 15 minutes
            delayAfter: 100, // allow 100 requests per 15 minutes without delay
            delayMs: 500, // add 500ms of delay per request after delayAfter
        }));
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                service: 'API Gateway',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // API documentation
        this.app.get('/api/docs', (req, res) => {
            res.json({
                title: 'AthleteAI API Gateway',
                version: '1.0.0',
                endpoints: {
                    '/api/v1/*': 'Backend API routes',
                    '/api/auth/*': 'Authentication routes',
                    '/api/discovery/*': 'Athlete discovery routes'
                }
            });
        });

        // Proxy to backend service
        this.app.use('/api', createProxyMiddleware({
            target: process.env.BACKEND_URL || 'http://go4it-backend:5000',
            changeOrigin: true,
            pathRewrite: {
                '^/api': '/api', // keep /api prefix
            },
            onProxyReq: (proxyReq, req, res) => {
                // Add custom headers
                proxyReq.setHeader('X-API-Gateway', 'true');
                proxyReq.setHeader('X-Client-IP', req.ip);
                proxyReq.setHeader('X-Forwarded-For', req.ips.join(', '));
                
                // Log API requests
                console.log(`📡 API Gateway: ${req.method} ${req.originalUrl} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
            },
            onError: (err, req, res) => {
                console.error('❌ Proxy error:', err);
                res.status(502).json({
                    error: 'Bad Gateway',
                    message: 'Unable to connect to backend service'
                });
            }
        }));

        // Catch-all for undefined routes
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'The requested resource was not found'
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('❌ API Gateway Error:', err);

            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';

            res.status(err.status || 500).json({
                error: err.message || 'Internal Server Error',
                ...(isDevelopment && { stack: err.stack }),
                timestamp: new Date().toISOString()
            });
        });
    }

    start(port = 3001) {
        this.app.listen(port, () => {
            console.log(`🚀 API Gateway running on port ${port}`);
            console.log(`📊 Rate limiting: 1000 requests/15min`);
            console.log(`🔒 Security: Helmet, CORS, Compression enabled`);
        });
    }

    getApp() {
        return this.app;
    }
}

module.exports = APIGateway;
