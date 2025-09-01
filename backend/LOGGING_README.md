# Enterprise Logging and Error Tracking Setup

## Overview

The AthleteAI platform now includes comprehensive enterprise-grade logging and error tracking capabilities using Winston and Sentry. This implementation provides:

- **Structured Logging**: JSON-formatted logs with timestamps, levels, and metadata
- **Multiple Log Levels**: error, warn, info, http, debug
- **Log Rotation**: Automatic log file rotation and cleanup
- **Error Tracking**: Real-time error monitoring and alerting with Sentry
- **Performance Monitoring**: Request timing and performance metrics
- **Security Logging**: Dedicated security event tracking
- **Health Checks**: System health monitoring for all components

## Architecture

### Winston Logger (`utils/logger.js`)

The Winston logger provides:
- **Console Transport**: Real-time logging to console with colors
- **File Transports**:
  - `logs/error.log`: Error-level logs only
  - `logs/combined.log`: All log levels
  - `logs/http.log`: HTTP request logs
- **Daily Rotation**: Logs rotate daily, kept for 14 days (errors) or 7 days (HTTP)
- **Morgan Integration**: HTTP request logging via stream interface

### Sentry Error Tracking (`utils/sentry.js`)

Sentry provides:
- **Error Capture**: Automatic exception tracking
- **Performance Monitoring**: Request tracing and profiling
- **User Context**: User information in error reports
- **Release Tracking**: Version-based error grouping
- **Custom Filtering**: Intelligent error filtering

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
RELEASE_VERSION=1.0.0

# Logging Configuration
LOG_LEVEL=info  # error, warn, info, http, debug
```

### Log Levels

- **error**: Application errors and exceptions
- **warn**: Warnings and security events
- **info**: General information and performance metrics
- **http**: HTTP request/response logs
- **debug**: Detailed debugging information

## Usage

### Basic Logging

```javascript
const { logger } = require('./utils/logger');

// Simple logging
logger.info('User logged in', { userId: '123', email: 'user@example.com' });
logger.error('Database connection failed', { error: 'Connection timeout' });

// Security logging
const { logSecurity } = require('./utils/logger');
logSecurity('Failed login attempt', {
  ip: '192.168.1.1',
  userAgent: 'Suspicious Agent',
  attemptCount: 3
});

// Performance logging
const { logPerformance } = require('./utils/logger');
logPerformance('Database query', 150, {
  operation: 'user_lookup',
  records: 100
});
```

### Error Tracking

```javascript
const { captureException, captureMessage, setUserContext } = require('./utils/sentry');

// Capture exceptions
try {
  // Some operation
} catch (error) {
  captureException(error, {
    user: { id: '123', email: 'user@example.com' },
    tags: { component: 'auth', action: 'login' },
    extra: { attemptCount: 3 }
  });
}

// Capture custom messages
captureMessage('Payment processing failed', 'error', {
  tags: { component: 'payment' },
  extra: { amount: 99.99, userId: '123' }
});

// Set user context for all subsequent events
setUserContext({
  id: '123',
  email: 'user@example.com',
  role: 'premium'
});
```

### Request Logging

The request logging middleware automatically logs all HTTP requests:

```javascript
// Automatically logs:
// - HTTP method, URL, status code
// - Response time
// - User ID (if authenticated)
// - IP address and User-Agent
```

## Health Checks

### Logging Health

```javascript
const { checkLogHealth } = require('./utils/logger');
const health = checkLogHealth();
// Returns: { status: 'healthy', message: 'Logging system operational' }
```

### Sentry Health

```javascript
const { checkSentryHealth } = require('./utils/sentry');
const health = await checkSentryHealth();
// Returns: { status: 'healthy', message: 'Sentry operational' }
```

### Health Endpoints

- `GET /health`: Basic health check including logging and Sentry status
- `GET /api/health`: Detailed health check with all system components

## Log File Management

### Directory Structure

```
backend/
├── logs/
│   ├── error-2025-01-01.log
│   ├── combined-2025-01-01.log
│   ├── http-2025-01-01.log
│   └── exceptions.log
```

### Log Rotation

- **Error logs**: Rotated daily, kept for 14 days, max 20MB per file
- **Combined logs**: Rotated daily, kept for 14 days, max 20MB per file
- **HTTP logs**: Rotated daily, kept for 7 days, max 20MB per file
- **Exceptions**: Uncaught exceptions logged to separate file

### Monitoring Logs

```bash
# View recent logs
npm run logs:check

# View error logs
npm run logs:errors

# Manual log inspection
tail -f logs/combined.log
tail -f logs/error.log
```

## Testing

### Run Logging Tests

```bash
npm run test:logging
```

### Test Coverage

The test suite covers:
- Logger instance creation and functionality
- All log levels and metadata logging
- Security event logging
- Performance metric logging
- Error logging with context
- Sentry exception and message capture
- User context setting
- Health check functionality
- Request logging middleware
- Complex error scenario handling

## Production Deployment

### Environment Setup

1. **Configure Sentry DSN**:
   ```bash
   SENTRY_DSN=https://your-actual-sentry-dsn@sentry.io/project-id
   ```

2. **Set Log Level**:
   ```bash
   LOG_LEVEL=info  # Production level
   ```

3. **Release Version**:
   ```bash
   RELEASE_VERSION=1.0.0
   ```

### Log Aggregation

For production environments, consider:
- **ELK Stack**: Elasticsearch, Logstash, Kibana for log aggregation
- **CloudWatch**: AWS CloudWatch for centralized logging
- **DataDog**: Enterprise log monitoring and alerting
- **Splunk**: Advanced log analysis and reporting

### Alerting

Configure alerts for:
- Error rate thresholds
- Performance degradation
- Security events
- System health failures

## Best Practices

### Logging Guidelines

1. **Use appropriate log levels**:
   - `error`: Application errors requiring attention
   - `warn`: Potential issues or security events
   - `info`: Important business logic events
   - `debug`: Detailed debugging (disabled in production)

2. **Include relevant context**:
   - User IDs for user-specific operations
   - Request IDs for tracing
   - Performance metrics for monitoring
   - Error codes and stack traces

3. **Avoid sensitive data**:
   - Never log passwords, tokens, or PII
   - Sanitize user input in logs
   - Use structured logging for better filtering

### Error Handling

1. **Capture context**: Always include user and request context with errors
2. **Use custom tags**: Tag errors by component, feature, or severity
3. **Filter noise**: Configure Sentry to ignore known non-critical errors
4. **Monitor trends**: Use Sentry's issue tracking for error patterns

### Performance

1. **Async logging**: Winston handles async logging automatically
2. **Log rotation**: Prevents log files from consuming disk space
3. **Buffering**: Consider log buffering for high-throughput applications
4. **Compression**: Enable log compression for long-term storage

## Troubleshooting

### Common Issues

1. **Logs not appearing**:
   - Check LOG_LEVEL environment variable
   - Verify logs directory permissions
   - Ensure Winston transports are properly configured

2. **Sentry not capturing errors**:
   - Verify SENTRY_DSN is set correctly
   - Check network connectivity to Sentry
   - Ensure Sentry is initialized before errors occur

3. **Performance impact**:
   - Monitor logging overhead in production
   - Adjust log levels based on environment
   - Consider async logging for high-traffic applications

### Debug Mode

Enable debug logging temporarily:

```bash
LOG_LEVEL=debug
```

This will show all log levels including debug information.

## Integration with Existing Systems

The logging system integrates seamlessly with:
- **Express middleware**: Automatic request logging
- **Authentication**: User context in logs and errors
- **Database operations**: Connection and query logging
- **Caching**: Cache hit/miss logging
- **Monitoring**: Health check integration

## Future Enhancements

Potential improvements:
- **Log aggregation**: Centralized log collection
- **Metrics integration**: Prometheus/Grafana metrics
- **Distributed tracing**: Full request tracing across services
- **Log analysis**: Automated error pattern detection
- **Audit logging**: Compliance and security audit trails
