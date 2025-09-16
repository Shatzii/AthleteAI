// Third-Party API Ecosystem Service
// Developer platform for API management, authentication, and integration

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { RateLimiterMemory } = require('rate-limiter-flexible');

class APIEcosystemService {
  constructor() {
    this.apiKeys = new Map();
    this.rateLimiters = new Map();
    this.webhooks = new Map();
    this.apiLogs = [];
    this.metrics = {
      totalRequests: 0,
      activeKeys: 0,
      rateLimited: 0,
      errors: 0,
      webhooksDelivered: 0
    };

    // API versioning and endpoints
    this.apiVersions = {
      'v1': {
        endpoints: [
          'athletes',
          'performance',
          'training',
          'analytics',
          'social',
          'wearable'
        ],
        features: [
          'basic_crud',
          'webhooks',
          'rate_limiting',
          'analytics'
        ]
      },
      'v2': {
        endpoints: [
          'athletes',
          'performance',
          'training',
          'analytics',
          'social',
          'wearable',
          'ai_coach',
          'predictive'
        ],
        features: [
          'basic_crud',
          'webhooks',
          'rate_limiting',
          'analytics',
          'real_time',
          'ai_insights'
        ]
      }
    };

    // Initialize rate limiter
    this.globalRateLimiter = new RateLimiterMemory({
      keyPrefix: 'api_global',
      points: 1000, // Number of requests
      duration: 60 * 60, // Per hour
    });
  }

  /**
   * Initialize the API ecosystem service
   */
  async initialize() {
    try {
      // Load existing API keys from database
      await this.loadAPIKeys();

      // Initialize webhooks system
      await this.initializeWebhooks();

      console.log('✅ API Ecosystem service initialized');
      console.log(`🔑 Loaded ${this.apiKeys.size} API keys`);
      console.log(`🔗 Initialized ${this.webhooks.size} webhook endpoints`);

    } catch (error) {
      console.error('❌ Failed to initialize API ecosystem:', error);
      throw error;
    }
  }

  /**
   * Load API keys from database
   */
  async loadAPIKeys() {
    try {
      // This would typically load from MongoDB
      // For now, we'll initialize with some demo keys
      const demoKeys = [
        {
          id: 'demo_key_1',
          key: 'ak_demo_1234567890abcdef',
          name: 'Demo App',
          owner: 'demo@example.com',
          permissions: ['read:athletes', 'read:performance'],
          rateLimit: 100,
          createdAt: new Date(),
          lastUsed: null,
          active: true
        }
      ];

      demoKeys.forEach(keyData => {
        this.apiKeys.set(keyData.key, keyData);

        // Initialize rate limiter for this key
        this.rateLimiters.set(keyData.key, new RateLimiterMemory({
          keyPrefix: `api_${keyData.key}`,
          points: keyData.rateLimit,
          duration: 60 * 60, // Per hour
        }));
      });

      this.metrics.activeKeys = this.apiKeys.size;

    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  }

  /**
   * Initialize webhooks system
   */
  async initializeWebhooks() {
    // Initialize webhook queues for different events
    const events = [
      'athlete.created',
      'athlete.updated',
      'performance.recorded',
      'training.completed',
      'injury.reported',
      'achievement.unlocked'
    ];

    events.forEach(event => {
      this.webhooks.set(event, new Set());
    });
  }

  /**
   * Generate a new API key
   * @param {Object} keyData - API key configuration
   * @returns {Object} Generated API key
   */
  async generateAPIKey(keyData) {
    try {
      const { name, owner, permissions = [], rateLimit = 100, description = '' } = keyData;

      // Generate secure API key
      const key = `ak_${crypto.randomBytes(16).toString('hex')}`;
      const keyId = `key_${crypto.randomBytes(8).toString('hex')}`;

      const apiKey = {
        id: keyId,
        key: key,
        name: name,
        owner: owner,
        description: description,
        permissions: permissions,
        rateLimit: rateLimit,
        createdAt: new Date(),
        lastUsed: null,
        active: true,
        usage: {
          requests: 0,
          lastRequest: null,
          rateLimited: 0
        }
      };

      // Store API key
      this.apiKeys.set(key, apiKey);

      // Initialize rate limiter
      this.rateLimiters.set(key, new RateLimiterMemory({
        keyPrefix: `api_${key}`,
        points: rateLimit,
        duration: 60 * 60, // Per hour
      }));

      this.metrics.activeKeys++;

      console.log(`🔑 Generated new API key for ${name}: ${keyId}`);

      return {
        id: keyId,
        key: key,
        name: name,
        permissions: permissions,
        rateLimit: rateLimit,
        createdAt: apiKey.createdAt
      };

    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  }

  /**
   * Validate API key and check permissions
   * @param {string} apiKey - API key to validate
   * @param {string} requiredPermission - Required permission
   * @returns {Object} Validation result
   */
  async validateAPIKey(apiKey, requiredPermission = null) {
    try {
      const keyData = this.apiKeys.get(apiKey);

      if (!keyData) {
        return { valid: false, error: 'Invalid API key' };
      }

      if (!keyData.active) {
        return { valid: false, error: 'API key is deactivated' };
      }

      // Check permissions if required
      if (requiredPermission) {
        const hasPermission = keyData.permissions.some(permission => {
          return permission === requiredPermission ||
                 permission === '*' ||
                 permission.endsWith(':*') && requiredPermission.startsWith(permission.slice(0, -1));
        });

        if (!hasPermission) {
          return { valid: false, error: 'Insufficient permissions' };
        }
      }

      // Update usage statistics
      keyData.usage.requests++;
      keyData.lastUsed = new Date();
      keyData.usage.lastRequest = new Date();

      return {
        valid: true,
        keyData: {
          id: keyData.id,
          name: keyData.name,
          owner: keyData.owner,
          permissions: keyData.permissions
        }
      };

    } catch (error) {
      console.error('Error validating API key:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Check rate limit for API key
   * @param {string} apiKey - API key to check
   * @returns {Object} Rate limit status
   */
  async checkRateLimit(apiKey) {
    try {
      const limiter = this.rateLimiters.get(apiKey);

      if (!limiter) {
        return { allowed: false, error: 'Rate limiter not found' };
      }

      const rateLimitResult = await limiter.get(apiKey);

      if (rateLimitResult && rateLimitResult.remainingPoints <= 0) {
        // Rate limited
        this.metrics.rateLimited++;

        const keyData = this.apiKeys.get(apiKey);
        if (keyData) {
          keyData.usage.rateLimited++;
        }

        return {
          allowed: false,
          retryAfter: rateLimitResult.msBeforeNext || 3600000, // 1 hour default
          limit: limiter.points,
          remaining: 0
        };
      }

      // Consume a point
      await limiter.consume(apiKey);

      const remaining = rateLimitResult ? rateLimitResult.remainingPoints - 1 : limiter.points - 1;

      return {
        allowed: true,
        limit: limiter.points,
        remaining: Math.max(0, remaining)
      };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: false, error: 'Rate limit check failed' };
    }
  }

  /**
   * Register webhook endpoint
   * @param {string} event - Event type
   * @param {string} url - Webhook URL
   * @param {string} apiKey - API key for authentication
   * @returns {string} Webhook ID
   */
  async registerWebhook(event, url, apiKey) {
    try {
      // Validate API key
      const validation = await this.validateAPIKey(apiKey);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Validate event type
      if (!this.webhooks.has(event)) {
        throw new Error('Invalid event type');
      }

      const webhookId = `wh_${crypto.randomBytes(8).toString('hex')}`;

      const webhook = {
        id: webhookId,
        event: event,
        url: url,
        apiKey: apiKey,
        createdAt: new Date(),
        active: true,
        deliveryStats: {
          total: 0,
          successful: 0,
          failed: 0
        }
      };

      // Add to webhooks map
      const eventWebhooks = this.webhooks.get(event);
      eventWebhooks.add(webhook);

      console.log(`🔗 Registered webhook ${webhookId} for event ${event}`);

      return webhookId;

    } catch (error) {
      console.error('Error registering webhook:', error);
      throw error;
    }
  }

  /**
   * Trigger webhook for an event
   * @param {string} event - Event type
   * @param {Object} payload - Event payload
   */
  async triggerWebhook(event, payload) {
    try {
      const eventWebhooks = this.webhooks.get(event);
      if (!eventWebhooks || eventWebhooks.size === 0) {
        return; // No webhooks registered for this event
      }

      const webhookPromises = Array.from(eventWebhooks).map(async (webhook) => {
        if (!webhook.active) return;

        try {
          webhook.deliveryStats.total++;

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': webhook.apiKey,
              'X-Webhook-Event': event,
              'X-Webhook-ID': webhook.id
            },
            body: JSON.stringify({
              event: event,
              timestamp: new Date().toISOString(),
              data: payload
            })
          });

          if (response.ok) {
            webhook.deliveryStats.successful++;
            this.metrics.webhooksDelivered++;
          } else {
            webhook.deliveryStats.failed++;
            console.warn(`Webhook delivery failed for ${webhook.id}: ${response.status}`);
          }

        } catch (error) {
          webhook.deliveryStats.failed++;
          console.error(`Webhook delivery error for ${webhook.id}:`, error);
        }
      });

      await Promise.allSettled(webhookPromises);

    } catch (error) {
      console.error('Error triggering webhook:', error);
    }
  }

  /**
   * Log API request
   * @param {Object} logData - Request log data
   */
  logAPIRequest(logData) {
    try {
      const logEntry = {
        id: `log_${crypto.randomBytes(8).toString('hex')}`,
        timestamp: new Date(),
        ...logData
      };

      this.apiLogs.push(logEntry);

      // Keep only last 1000 logs
      if (this.apiLogs.length > 1000) {
        this.apiLogs.shift();
      }

      this.metrics.totalRequests++;

    } catch (error) {
      console.error('Error logging API request:', error);
    }
  }

  /**
   * Get API documentation
   * @param {string} version - API version
   * @returns {Object} API documentation
   */
  getAPIDocumentation(version = 'v1') {
    const apiVersion = this.apiVersions[version];

    if (!apiVersion) {
      throw new Error('Invalid API version');
    }

    return {
      version: version,
      baseUrl: `https://api.athleteai.com/${version}`,
      endpoints: apiVersion.endpoints.map(endpoint => ({
        name: endpoint,
        url: `/${version}/${endpoint}`,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        description: this.getEndpointDescription(endpoint)
      })),
      features: apiVersion.features,
      authentication: {
        type: 'API Key',
        header: 'X-API-Key',
        description: 'Include your API key in the request header'
      },
      rateLimiting: {
        description: 'Rate limits are enforced per API key',
        defaultLimit: '100 requests per hour',
        upgradeOptions: 'Contact support for higher limits'
      },
      webhooks: {
        supported: apiVersion.features.includes('webhooks'),
        events: Array.from(this.webhooks.keys()),
        registration: 'POST /webhooks/register'
      }
    };
  }

  /**
   * Get endpoint description
   */
  getEndpointDescription(endpoint) {
    const descriptions = {
      athletes: 'Manage athlete profiles and basic information',
      performance: 'Access performance metrics and training data',
      training: 'Retrieve training programs and workout plans',
      analytics: 'Get advanced analytics and performance insights',
      social: 'Access social features and community data',
      wearable: 'Integrate with wearable device data',
      ai_coach: 'Access AI coaching and voice features',
      predictive: 'Use predictive analytics and forecasting'
    };

    return descriptions[endpoint] || 'API endpoint';
  }

  /**
   * Get API key statistics
   * @param {string} apiKey - API key
   * @returns {Object} Key statistics
   */
  getAPIKeyStats(apiKey) {
    const keyData = this.apiKeys.get(apiKey);

    if (!keyData) {
      throw new Error('API key not found');
    }

    return {
      id: keyData.id,
      name: keyData.name,
      requests: keyData.usage.requests,
      lastUsed: keyData.lastUsed,
      rateLimited: keyData.usage.rateLimited,
      createdAt: keyData.createdAt,
      active: keyData.active
    };
  }

  /**
   * Deactivate API key
   * @param {string} apiKey - API key to deactivate
   */
  deactivateAPIKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);

    if (!keyData) {
      throw new Error('API key not found');
    }

    keyData.active = false;
    this.metrics.activeKeys--;

    console.log(`🔑 Deactivated API key: ${keyData.id}`);
  }

  /**
   * Get ecosystem statistics
   */
  getStats() {
    return {
      totalRequests: this.metrics.totalRequests,
      activeKeys: this.metrics.activeKeys,
      rateLimited: this.metrics.rateLimited,
      errors: this.metrics.errors,
      webhooksDelivered: this.metrics.webhooksDelivered,
      registeredWebhooks: Array.from(this.webhooks.values()).reduce((total, hooks) => total + hooks.size, 0),
      apiVersions: Object.keys(this.apiVersions),
      recentLogs: this.apiLogs.slice(-10),
      lastUpdated: new Date()
    };
  }

  /**
   * Clean up old logs and inactive keys
   */
  async cleanup(maxLogAgeHours = 24) {
    try {
      const maxAge = maxLogAgeHours * 60 * 60 * 1000;
      const cutoffTime = Date.now() - maxAge;

      // Clean old logs
      const initialLogCount = this.apiLogs.length;
      this.apiLogs = this.apiLogs.filter(log => log.timestamp.getTime() > cutoffTime);
      const cleanedLogs = initialLogCount - this.apiLogs.length;

      // Clean inactive API keys (not used in 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let cleanedKeys = 0;

      for (const [key, keyData] of this.apiKeys.entries()) {
        if (!keyData.lastUsed || keyData.lastUsed < thirtyDaysAgo) {
          this.apiKeys.delete(key);
          this.rateLimiters.delete(key);
          cleanedKeys++;
        }
      }

      console.log(`🧹 Cleaned up ${cleanedLogs} old logs and ${cleanedKeys} inactive API keys`);

      return { cleanedLogs, cleanedKeys };

    } catch (error) {
      console.error('Error during cleanup:', error);
      return { cleanedLogs: 0, cleanedKeys: 0 };
    }
  }
}

// Export singleton instance
const apiEcosystemService = new APIEcosystemService();
module.exports = apiEcosystemService;