// Backend Monitoring and Logging Utility
const fs = require('fs').promises;
const path = require('path');

class BackendMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      activeConnections: 0,
      memoryUsage: {},
      dbConnections: 0
    };

    this.logs = {
      errors: [],
      security: [],
      performance: []
    };

    this.init();
  }

  init() {
    // Monitor memory usage
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 30000); // Every 30 seconds

    // Clean old logs
    setInterval(() => {
      this.cleanOldLogs();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  // Request monitoring middleware
  requestLogger(req, res, next) {
    const startTime = Date.now();
    this.metrics.requests++;
    this.metrics.activeConnections++;

    // Log request
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : null
    };

    console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - IP: ${logEntry.ip}`);

    // Monitor response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.metrics.responseTimes.push(duration);
      this.metrics.activeConnections--;

      // Keep only last 100 response times
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes.shift();
      }

      console.log(`[${new Date().toISOString()}] Response: ${res.statusCode} - Duration: ${duration}ms`);

      // Log slow requests
      if (duration > 1000) {
        this.logPerformance('slow_request', {
          ...logEntry,
          duration,
          statusCode: res.statusCode
        });
      }

      // Log errors
      if (res.statusCode >= 400) {
        this.logError('http_error', {
          ...logEntry,
          statusCode: res.statusCode,
          duration
        });
      }
    });

    next();
  }

  // Error monitoring
  errorLogger(err, req, res, next) {
    this.metrics.errors++;

    const errorLog = {
      timestamp: new Date().toISOString(),
      message: err.message,
      stack: err.stack,
      url: req ? req.originalUrl : 'Unknown',
      method: req ? req.method : 'Unknown',
      ip: req ? (req.ip || req.connection.remoteAddress) : 'Unknown',
      userAgent: req ? req.get('User-Agent') : 'Unknown'
    };

    console.error('[ERROR]', errorLog);

    this.logs.errors.push(errorLog);

    // Keep only last 100 errors
    if (this.logs.errors.length > 100) {
      this.logs.errors.shift();
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('error', errorLog);
    }

    next();
  }

  // Security event logging
  logSecurity(event, details) {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      ...details
    };

    console.warn('[SECURITY]', securityLog);
    this.logs.security.push(securityLog);

    // Keep only last 50 security events
    if (this.logs.security.length > 50) {
      this.logs.security.shift();
    }

    // Always send security events to monitoring
    this.sendToMonitoringService('security', securityLog);
  }

  // Performance logging
  logPerformance(event, details) {
    const performanceLog = {
      timestamp: new Date().toISOString(),
      event,
      ...details
    };

    console.log('[PERFORMANCE]', performanceLog);
    this.logs.performance.push(performanceLog);

    // Keep only last 50 performance logs
    if (this.logs.performance.length > 50) {
      this.logs.performance.shift();
    }
  }

  // Memory usage monitoring
  monitorMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      timestamp: new Date().toISOString()
    };

    // Alert if memory usage is high
    if (this.metrics.memoryUsage.heapUsed > 500) { // 500MB threshold
      this.logPerformance('high_memory_usage', this.metrics.memoryUsage);
    }
  }

  // Database connection monitoring
  updateDBConnections(count) {
    this.metrics.dbConnections = count;
  }

  // Get current metrics
  getMetrics() {
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    return {
      ...this.metrics,
      averageResponseTime: Math.round(avgResponseTime),
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Health check endpoint data
  getHealthStatus() {
    const metrics = this.getMetrics();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      metrics: {
        requests: metrics.requests,
        errors: metrics.errors,
        averageResponseTime: metrics.averageResponseTime,
        activeConnections: metrics.activeConnections,
        memoryUsage: metrics.memoryUsage,
        dbConnections: metrics.dbConnections
      }
    };
  }

  // Send to external monitoring service
  sendToMonitoringService(type, data) {
    // Implement your monitoring service integration here
    // Examples: DataDog, New Relic, Sentry, etc.

    // For now, just log to console
    console.log(`[MONITORING] Sending ${type} to external service:`, data);
  }

  // Clean old logs (keep last 7 days)
  async cleanOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    this.logs.errors = this.logs.errors.filter(log =>
      new Date(log.timestamp) > cutoffDate
    );

    this.logs.security = this.logs.security.filter(log =>
      new Date(log.timestamp) > cutoffDate
    );

    this.logs.performance = this.logs.performance.filter(log =>
      new Date(log.timestamp) > cutoffDate
    );
  }

  // Export logs to file (for debugging)
  async exportLogs(filename) {
    const logsDir = path.join(__dirname, '../logs');
    await fs.mkdir(logsDir, { recursive: true });

    const exportData = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      logs: this.logs
    };

    await fs.writeFile(
      path.join(logsDir, filename),
      JSON.stringify(exportData, null, 2)
    );
  }
}

// Create singleton instance
const backendMonitor = new BackendMonitor();

module.exports = backendMonitor;
