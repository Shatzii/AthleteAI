const Sentry = require('@sentry/node');

// Conditionally load profiling integration
let nodeProfilingIntegration;
try {
  nodeProfilingIntegration = require('@sentry/profiling-node').nodeProfilingIntegration;
} catch (error) {
  console.warn('Sentry profiling integration not available:', error.message);
}

// Initialize Sentry
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'https://your-sentry-dsn@sentry.io/project-id') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // HTTP integration for automatic instrumentation (if available)
      ...(Sentry.Integrations && Sentry.Integrations.Http ? [new Sentry.Integrations.Http({ tracing: true })] : []),
      // MongoDB integration for database monitoring (if available)
      ...(Sentry.Integrations && Sentry.Integrations.Mongo ? [new Sentry.Integrations.Mongo({ useMongoose: true })] : []),
      // Profiling integration for performance monitoring (optional)
      ...(nodeProfilingIntegration ? [nodeProfilingIntegration()] : []),
    ],

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Release tracking
    release: process.env.RELEASE_VERSION || '1.0.0',

    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error && error.message) {
          // Filter out common validation errors
          if (error.message.includes('Validation failed') ||
              error.message.includes('Cast to ObjectId failed')) {
            return null;
          }
        }
      }
      return event;
    },

    // User context
    beforeSendTransaction(event) {
      // Add custom transaction context
      if (event.transaction) {
        event.tags = {
          ...event.tags,
          service: 'athlete-ai-backend',
          version: process.env.RELEASE_VERSION || '1.0.0',
        };
      }
      return event;
    },
  });
} else {
  console.log('Sentry not initialized - valid SENTRY_DSN not provided');
}

// Set user context helper
const setUserContext = (user) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
};

// Set request context helper
const setRequestContext = (req) => {
  Sentry.setContext('request', {
    url: req.originalUrl,
    method: req.method,
    headers: {
      'user-agent': req.get('User-Agent'),
      'accept': req.get('Accept'),
      'content-type': req.get('Content-Type'),
    },
    ip: req.ip,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
  });
};

// Performance monitoring helpers
const startTransaction = (name, op) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

const startSpan = (transaction, name, op) => {
  return transaction.startChild({
    op,
    description: name,
  });
};

// Error capture helpers
const captureException = (error, context = {}) => {
  Sentry.withScope((scope) => {
    if (context.user) {
      setUserContext(context.user);
    }
    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }
    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }
    Sentry.captureException(error);
  });
};

const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context.user) {
      setUserContext(context.user);
    }
    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }
    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }
    Sentry.captureMessage(message);
  });
};

// Health check for Sentry
const checkSentryHealth = async () => {
  try {
    // Test Sentry connection by sending a test event
    Sentry.captureMessage('Sentry health check', 'debug');
    return { status: 'healthy', message: 'Sentry operational' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

// Middleware for automatic error tracking
const sentryErrorHandler = (err, req, res, next) => {
  Sentry.withScope((scope) => {
    if (req.user) {
      setUserContext(req.user);
    }
    setRequestContext(req);
    scope.setTag('handler', 'error');
    Sentry.captureException(err);
  });

  // Continue to next error handler
  next(err);
};

// Performance monitoring middleware
const sentryTracingHandler = (req, res, next) => {
  const transaction = Sentry.startTransaction({
    name: `${req.method} ${req.originalUrl}`,
    op: 'http.server',
  });

  Sentry.getCurrentScope().setSpan(transaction);

  res.on('finish', () => {
    transaction.setHttpStatus(res.statusCode);
    transaction.finish();
  });

  next();
};

module.exports = {
  Sentry,
  setUserContext,
  setRequestContext,
  startTransaction,
  startSpan,
  captureException,
  captureMessage,
  checkSentryHealth,
  sentryErrorHandler,
  sentryTracingHandler,
};
