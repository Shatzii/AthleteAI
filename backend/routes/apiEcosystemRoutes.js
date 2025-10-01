// Third-Party API Ecosystem Routes
// Developer platform endpoints for API management and integration

const express = require('express');
const router = express.Router();
const apiEcosystemService = require('../services/apiEcosystemService');
const { verifyToken } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Initialize service on startup
apiEcosystemService.initialize().catch(console.error);

/**
 * @route GET /api/ecosystem/stats
 * @desc Get API ecosystem statistics
 * @access Private (Admin)
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = apiEcosystemService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching ecosystem stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ecosystem statistics'
    });
  }
});

/**
 * @route POST /api/ecosystem/keys/generate
 * @desc Generate a new API key
 * @access Private (Admin)
 */
router.post('/keys/generate', [
  verifyToken,
  body('name').isString().notEmpty().withMessage('Application name is required'),
  body('owner').isEmail().withMessage('Valid owner email is required'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*').isString().withMessage('Each permission must be a string'),
  body('rateLimit').optional().isNumeric().withMessage('Rate limit must be a number'),
  body('description').optional().isString().withMessage('Description must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only admins can generate API keys
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, owner, permissions, rateLimit = 100, description = '' } = req.body;

    const apiKey = await apiEcosystemService.generateAPIKey({
      name,
      owner,
      permissions,
      rateLimit,
      description
    });

    res.status(201).json({
      success: true,
      data: apiKey,
      message: 'API key generated successfully. Keep this key secure!'
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key'
    });
  }
});

/**
 * @route GET /api/ecosystem/keys
 * @desc List API keys (admin only)
 * @access Private (Admin)
 */
router.get('/keys', verifyToken, async (req, res) => {
  try {
    // Only admins can list API keys
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const keys = Array.from(apiEcosystemService.apiKeys.values()).map(key => ({
      id: key.id,
      name: key.name,
      owner: key.owner,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      active: key.active,
      usage: key.usage
    }));

    res.json({
      success: true,
      data: keys
    });

  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys'
    });
  }
});

/**
 * @route GET /api/ecosystem/keys/:keyId/stats
 * @desc Get API key statistics
 * @access Private (Admin)
 */
router.get('/keys/:keyId/stats', [
  verifyToken,
  param('keyId').isString().notEmpty().withMessage('Key ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only admins can view key stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { keyId } = req.params;

    // Find key by ID
    const keyData = Array.from(apiEcosystemService.apiKeys.values())
      .find(key => key.id === keyId);

    if (!keyData) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    const stats = apiEcosystemService.getAPIKeyStats(keyData.key);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching key stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch key statistics'
    });
  }
});

/**
 * @route DELETE /api/ecosystem/keys/:keyId
 * @desc Deactivate an API key
 * @access Private (Admin)
 */
router.delete('/keys/:keyId', [
  verifyToken,
  param('keyId').isString().notEmpty().withMessage('Key ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Only admins can deactivate API keys
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { keyId } = req.params;

    // Find and deactivate key
    const keyData = Array.from(apiEcosystemService.apiKeys.values())
      .find(key => key.id === keyId);

    if (!keyData) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    apiEcosystemService.deactivateAPIKey(keyData.key);

    res.json({
      success: true,
      message: 'API key deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate API key'
    });
  }
});

/**
 * @route GET /api/ecosystem/docs/:version?
 * @desc Get API documentation
 * @access Public
 */
router.get('/docs/:version?', async (req, res) => {
  try {
    const { version = 'v1' } = req.params;

    const documentation = apiEcosystemService.getAPIDocumentation(version);

    res.json({
      success: true,
      data: documentation
    });

  } catch (error) {
    console.error('Error fetching API docs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API documentation'
    });
  }
});

/**
 * @route POST /api/ecosystem/webhooks/register
 * @desc Register a webhook endpoint
 * @access Private
 */
router.post('/webhooks/register', [
  verifyToken,
  body('event').isString().notEmpty().withMessage('Event type is required'),
  body('url').isURL().withMessage('Valid webhook URL is required'),
  body('apiKey').isString().notEmpty().withMessage('API key is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { event, url, apiKey } = req.body;

    // Validate API key
    const validation = await apiEcosystemService.validateAPIKey(apiKey);
    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        message: validation.error
      });
    }

    const webhookId = await apiEcosystemService.registerWebhook(event, url, apiKey);

    res.status(201).json({
      success: true,
      data: { webhookId },
      message: 'Webhook registered successfully'
    });

  } catch (error) {
    console.error('Error registering webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register webhook'
    });
  }
});

/**
 * @route GET /api/ecosystem/webhooks/events
 * @desc Get available webhook events
 * @access Public
 */
router.get('/webhooks/events', async (req, res) => {
  try {
    const events = Array.from(apiEcosystemService.webhooks.keys());

    res.json({
      success: true,
      data: {
        events: events.map(event => ({
          name: event,
          description: getEventDescription(event)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch webhook events'
    });
  }
});

/**
 * @route POST /api/ecosystem/webhooks/test
 * @desc Test webhook delivery
 * @access Private
 */
router.post('/webhooks/test', [
  verifyToken,
  body('event').isString().notEmpty().withMessage('Event type is required'),
  body('url').isURL().withMessage('Valid webhook URL is required'),
  body('apiKey').isString().notEmpty().withMessage('API key is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { event, url, apiKey } = req.body;

    // Validate API key
    const validation = await apiEcosystemService.validateAPIKey(apiKey);
    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        message: validation.error
      });
    }

    // Send test webhook
    const testPayload = {
      test: true,
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-Webhook-Event': event,
          'X-Webhook-Test': 'true'
        },
        body: JSON.stringify({
          event: event,
          timestamp: new Date().toISOString(),
          data: testPayload
        })
      });

      if (response.ok) {
        res.json({
          success: true,
          message: 'Test webhook delivered successfully',
          statusCode: response.status
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Test webhook delivery failed',
          statusCode: response.status
        });
      }

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Test webhook delivery failed',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test webhook'
    });
  }
});

/**
 * @route GET /api/ecosystem/logs
 * @desc Get API request logs
 * @access Private (Admin)
 */
router.get('/logs', verifyToken, async (req, res) => {
  try {
    // Only admins can view logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { limit = 50, offset = 0 } = req.query;

    const logs = apiEcosystemService.apiLogs
      .slice(-parseInt(limit) - parseInt(offset), -parseInt(offset) || undefined)
      .reverse();

    res.json({
      success: true,
      data: {
        logs,
        total: apiEcosystemService.apiLogs.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API logs'
    });
  }
});

/**
 * @route POST /api/ecosystem/cleanup
 * @desc Clean up old logs and inactive keys
 * @access Private (Admin)
 */
router.post('/cleanup', verifyToken, async (req, res) => {
  try {
    // Only admins can trigger cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { maxLogAgeHours = 24 } = req.body;

    const result = await apiEcosystemService.cleanup(maxLogAgeHours);

    res.json({
      success: true,
      message: `Cleanup completed: ${result.cleanedLogs} logs and ${result.cleanedKeys} keys removed`,
      data: result
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed'
    });
  }
});

/**
 * @route GET /api/ecosystem/permissions
 * @desc Get available API permissions
 * @access Public
 */
router.get('/permissions', async (req, res) => {
  try {
    const permissions = [
      {
        scope: 'athletes',
        permissions: [
          'read:athletes',
          'write:athletes',
          'admin:athletes'
        ],
        description: 'Athlete profile management'
      },
      {
        scope: 'performance',
        permissions: [
          'read:performance',
          'write:performance',
          'admin:performance'
        ],
        description: 'Performance data and analytics'
      },
      {
        scope: 'training',
        permissions: [
          'read:training',
          'write:training',
          'admin:training'
        ],
        description: 'Training programs and workouts'
      },
      {
        scope: 'analytics',
        permissions: [
          'read:analytics',
          'write:analytics',
          'admin:analytics'
        ],
        description: 'Advanced analytics and insights'
      },
      {
        scope: 'social',
        permissions: [
          'read:social',
          'write:social',
          'admin:social'
        ],
        description: 'Social features and community'
      },
      {
        scope: 'wearable',
        permissions: [
          'read:wearable',
          'write:wearable',
          'admin:wearable'
        ],
        description: 'Wearable device integration'
      },
      {
        scope: 'ai_coach',
        permissions: [
          'read:ai_coach',
          'write:ai_coach',
          'admin:ai_coach'
        ],
        description: 'AI coaching and voice features'
      },
      {
        scope: 'predictive',
        permissions: [
          'read:predictive',
          'write:predictive',
          'admin:predictive'
        ],
        description: 'Predictive analytics and forecasting'
      }
    ];

    res.json({
      success: true,
      data: { permissions }
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions'
    });
  }
});

/**
 * Helper function to get event descriptions
 */
function getEventDescription(event) {
  const descriptions = {
    'athlete.created': 'Triggered when a new athlete profile is created',
    'athlete.updated': 'Triggered when an athlete profile is updated',
    'performance.recorded': 'Triggered when new performance data is recorded',
    'training.completed': 'Triggered when a training session is completed',
    'injury.reported': 'Triggered when an injury is reported',
    'achievement.unlocked': 'Triggered when an athlete unlocks an achievement'
  };

  return descriptions[event] || 'Event notification';
}

module.exports = router;