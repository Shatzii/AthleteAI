const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs, // Time window in milliseconds
        max: max, // Limit each IP to 'max' requests per windowMs
        message: {
            success: false,
            message: message || 'Too many requests from this IP, please try again later.'
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        // Redis store for production clustering
        // store: new RedisStore({ ... })
    });
};

// General API rate limiting
const apiLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many API requests, please try again later.'
);

// Authentication rate limiting (stricter)
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 auth attempts per windowMs
    'Too many authentication attempts, please try again later.'
);

// File upload rate limiting
const uploadLimiter = createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // limit each IP to 10 uploads per hour
    'Upload limit exceeded, please try again later.'
);

// Security headers configuration
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.example.com"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// CORS configuration for production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            process.env.FRONTEND_URL || 'http://localhost:3000'
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

module.exports = {
    apiLimiter,
    authLimiter,
    uploadLimiter,
    securityHeaders,
    corsOptions,
    createRateLimit
};
