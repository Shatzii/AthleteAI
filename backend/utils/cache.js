const redis = require('redis');
const expressRedisCache = require('express-redis-cache');

// Redis client configuration
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis connection refused');
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('Redis max retry attempts reached');
      return undefined;
    }
    // Exponential backoff
    return Math.min(options.attempt * 100, 3000);
  }
});

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('ℹ️  Redis connection ended');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Create Redis cache middleware
const cache = expressRedisCache({
  client: redisClient,
  prefix: 'go4it:',
  expire: 3600, // 1 hour default
  resetExpiryOnHit: true
});

// Cache middleware functions
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Skip caching for authenticated requests
    if (req.headers.authorization) {
      return next();
    }

    // Set cache duration
    req.cacheDuration = duration || 3600;
    cache(req, res, next);
  };
};

// Clear cache for specific patterns
const clearCache = (pattern) => {
  return new Promise((resolve, reject) => {
    redisClient.keys(`go4it:${pattern}`, (err, keys) => {
      if (err) {
        reject(err);
        return;
      }

      if (keys.length === 0) {
        resolve(0);
        return;
      }

      redisClient.del(keys, (err, count) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(count);
      });
    });
  });
};

// Health check for Redis
const checkRedisHealth = async () => {
  try {
    await redisClient.ping();
    return { status: 'connected', latency: 0 };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
};

module.exports = {
  redisClient,
  cache,
  cacheMiddleware,
  clearCache,
  checkRedisHealth
};
