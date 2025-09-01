const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('winston-daily-rotate-file');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
);

// Define which transports the logger must use
const transports = [
  // Console transport for development
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),

  // Error log file
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
  }),

  // Combined log file
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  // HTTP requests log
  new DailyRotateFile({
    filename: 'logs/http-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '7d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' })
);

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log types
const logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : null,
    });
  });

  next();
};

const logError = (error, req = null, res = null) => {
  const logData = {
    message: error.message,
    stack: error.stack,
    url: req ? req.originalUrl : null,
    method: req ? req.method : null,
    ip: req ? req.ip : null,
    userId: req && req.user ? req.user.id : null,
    statusCode: res ? res.statusCode : null,
  };

  logger.error('Application Error', logData);
};

const logSecurity = (message, data = {}) => {
  logger.warn(`Security: ${message}`, {
    type: 'security',
    timestamp: new Date().toISOString(),
    ...data,
  });
};

const logPerformance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation}`, {
    type: 'performance',
    duration,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Health check for logging system
const checkLogHealth = () => {
  try {
    logger.info('Log health check');
    return { status: 'healthy', message: 'Logging system operational' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

module.exports = {
  logger,
  logRequest,
  logError,
  logSecurity,
  logPerformance,
  checkLogHealth,
};
