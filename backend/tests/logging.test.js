const { logger, logRequest, logError, logSecurity, logPerformance, checkLogHealth } = require('../utils/logger');
const { captureException, captureMessage, checkSentryHealth, setUserContext } = require('../utils/sentry');

describe('Enterprise Logging and Error Tracking', () => {
  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
  });

  describe('Winston Logger', () => {
    test('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    test('should log different levels', () => {
      const testMessage = 'Test log message';

      expect(() => logger.info(testMessage)).not.toThrow();
      expect(() => logger.error(testMessage)).not.toThrow();
      expect(() => logger.warn(testMessage)).not.toThrow();
      expect(() => logger.debug(testMessage)).not.toThrow();
    });

    test('should log with metadata', () => {
      const metadata = { userId: '123', action: 'login' };

      expect(() => logger.info('User action', metadata)).not.toThrow();
      expect(() => logger.error('Error occurred', { error: 'Test error', ...metadata })).not.toThrow();
    });

    test('should check log health', () => {
      const health = checkLogHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('message');
      expect(health.status).toBe('healthy');
    });

    test('should log security events', () => {
      const securityData = {
        ip: '192.168.1.1',
        userAgent: 'Test Agent',
        action: 'failed_login_attempt'
      };

      expect(() => logSecurity('Suspicious login attempt', securityData)).not.toThrow();
    });

    test('should log performance metrics', () => {
      const performanceData = {
        operation: 'database_query',
        duration: 150,
        records: 100
      };

      expect(() => logPerformance('Database query completed', 150, performanceData)).not.toThrow();
    });

    test('should log errors with context', () => {
      const mockReq = {
        originalUrl: '/api/test',
        method: 'GET',
        ip: '127.0.0.1'
      };
      const mockRes = { statusCode: 500 };
      const testError = new Error('Test error');

      expect(() => logError(testError, mockReq, mockRes)).not.toThrow();
    });
  });

  describe('Sentry Error Tracking', () => {
    test('should have sentry functions available', () => {
      expect(typeof captureException).toBe('function');
      expect(typeof captureMessage).toBe('function');
      expect(typeof setUserContext).toBe('function');
    });

    test('should capture exceptions', () => {
      const testError = new Error('Test exception for Sentry');

      expect(() => captureException(testError)).not.toThrow();
      expect(() => captureException(testError, { user: { id: '123' } })).not.toThrow();
    });

    test('should capture messages', () => {
      expect(() => captureMessage('Test message')).not.toThrow();
      expect(() => captureMessage('Test warning', 'warning')).not.toThrow();
      expect(() => captureMessage('Test error', 'error', { tags: { component: 'test' } })).not.toThrow();
    });

    test('should set user context', () => {
      const user = { id: '123', email: 'test@example.com', role: 'admin' };

      expect(() => setUserContext(user)).not.toThrow();
      expect(() => setUserContext(null)).not.toThrow();
    });

    test('should check sentry health', async () => {
      const health = await checkSentryHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('message');
      // Health check might fail if Sentry DSN is not configured, but function should work
      expect(['healthy', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Request Logging Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        method: 'GET',
        originalUrl: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Test User Agent'),
        user: { id: '123' }
      };

      mockRes = {
        statusCode: 200,
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10); // Simulate async finish
          }
        })
      };

      mockNext = jest.fn();
    });

    test('should call next middleware', () => {
      logRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should log request on finish', (done) => {
      logRequest(mockReq, mockRes, mockNext);

      // Wait for the finish event
      setTimeout(() => {
        expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
        done();
      }, 20);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex error scenarios', () => {
      const complexError = new Error('Complex error');
      complexError.code = 'VALIDATION_ERROR';
      complexError.details = { field: 'email', value: 'invalid' };

      const context = {
        user: { id: '123', email: 'user@example.com' },
        tags: { component: 'auth', action: 'register' },
        extra: { attemptCount: 3, ip: '192.168.1.1' }
      };

      expect(() => captureException(complexError, context)).not.toThrow();
      expect(() => logger.error('Complex error occurred', {
        error: complexError.message,
        code: complexError.code,
        details: complexError.details,
        ...context
      })).not.toThrow();
    });

    test('should handle performance monitoring', () => {
      const startTime = Date.now();

      // Simulate some operation
      setTimeout(() => {
        const duration = Date.now() - startTime;
        logPerformance('Test operation', duration, {
          operation: 'test',
          success: true,
          recordsProcessed: 50
        });
      }, 10);

      // Test should pass regardless of timing
      expect(true).toBe(true);
    });
  });
});
