// Institutional Partnerships Routes
// API endpoints for institutional partnerships and white-label solutions

const express = require('express');
const router = express.Router();
const institutionalPartnershipsService = require('../services/institutionalPartnershipsService');
const { verifyToken } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Institution authentication middleware
const authenticateInstitution = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (!apiKey || !signature || !timestamp) {
      return res.status(401).json({
        success: false,
        message: 'Missing authentication headers'
      });
    }

    const institution = await institutionalPartnershipsService.authenticateInstitution(
      apiKey,
      signature,
      timestamp,
      JSON.stringify(req.body)
    );

    req.institution = institution;
    next();
  } catch (error) {
    console.error('Institution authentication failed:', error);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route POST /api/institutions
 * @desc Create a new institutional partnership
 * @access Private (Admin only)
 */
router.post('/', [
  verifyToken,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Institution name must be 2-100 characters'),
  body('type').isIn(['university', 'high_school', 'club', 'professional', 'other']).withMessage('Invalid institution type'),
  body('domain').optional().isFQDN().withMessage('Invalid domain format'),
  body('primarySport').optional().isString().withMessage('Primary sport must be a string'),
  body('address').optional().isObject().withMessage('Address must be an object'),
  body('contactInfo').optional().isObject().withMessage('Contact info must be an object'),
  body('adminUser').optional().isObject().withMessage('Admin user must be an object'),
  body('subscriptionPlan').optional().isIn(['basic', 'premium', 'enterprise']).withMessage('Invalid subscription plan'),
  body('maxUsers').optional().isInt({ min: 1, max: 10000 }).withMessage('Max users must be 1-10000'),
  body('maxTeams').optional().isInt({ min: 1, max: 100 }).withMessage('Max teams must be 1-100'),
  body('whiteLabelEnabled').optional().isBoolean().withMessage('White label enabled must be boolean'),
  validateRequest
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const institutionData = {
      ...req.body,
      createdBy: req.user.id
    };

    const result = await institutionalPartnershipsService.createInstitution(institutionData);

    res.status(201).json({
      success: true,
      message: 'Institutional partnership created successfully',
      data: result
    });

  } catch (error) {
    console.error('Error creating institution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create institution',
      error: error.message
    });
  }
});

/**
 * @route GET /api/institutions
 * @desc Get all institutions (admin) or user's institution
 * @access Private
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    // If admin, return all institutions
    if (req.user.role === 'admin') {
      const institutions = await institutionalPartnershipsService.getAllInstitutions(req.query);
      return res.json({
        success: true,
        data: institutions
      });
    }

    // If institution user, return their institution
    if (req.user.institutionId) {
      const institution = await institutionalPartnershipsService.getInstitutionById(req.user.institutionId);
      return res.json({
        success: true,
        data: institution
      });
    }

    res.status(404).json({
      success: false,
      message: 'No institution found'
    });

  } catch (error) {
    console.error('Error getting institutions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get institutions',
      error: error.message
    });
  }
});

/**
 * @route GET /api/institutions/:institutionId
 * @desc Get institution details
 * @access Private
 */
router.get('/:institutionId', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const institution = await institutionalPartnershipsService.getInstitutionById(institutionId);

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    res.json({
      success: true,
      data: institution
    });

  } catch (error) {
    console.error('Error getting institution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get institution',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/institutions/:institutionId
 * @desc Update institution details
 * @access Private (Admin or Institution Admin)
 */
router.put('/:institutionId', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Institution name must be 2-100 characters'),
  body('contactInfo').optional().isObject().withMessage('Contact info must be an object'),
  body('branding').optional().isObject().withMessage('Branding must be an object'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedInstitution = await institutionalPartnershipsService.updateInstitution(
      institutionId,
      req.body,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Institution updated successfully',
      data: updatedInstitution
    });

  } catch (error) {
    console.error('Error updating institution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update institution',
      error: error.message
    });
  }
});

/**
 * @route POST /api/institutions/:institutionId/white-label
 * @desc Create white-label configuration
 * @access Private (Institution Admin)
 */
router.post('/:institutionId/white-label', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  body('secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
  body('logoUrl').optional().isURL().withMessage('Invalid logo URL'),
  body('faviconUrl').optional().isURL().withMessage('Invalid favicon URL'),
  body('customDomain').optional().isFQDN().withMessage('Invalid domain'),
  body('appName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('App name must be 1-50 characters'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const whiteLabelConfig = await institutionalPartnershipsService.createWhiteLabelConfig(
      institutionId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'White-label configuration created successfully',
      data: whiteLabelConfig
    });

  } catch (error) {
    console.error('Error creating white-label config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create white-label configuration',
      error: error.message
    });
  }
});

/**
 * @route POST /api/institutions/:institutionId/teams
 * @desc Create institutional team
 * @access Private (Institution Admin)
 */
router.post('/:institutionId/teams', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Team name is required'),
  body('sport').optional().isString().withMessage('Sport must be a string'),
  body('level').optional().isIn(['varsity', 'junior_varsity', 'freshman', 'club']).withMessage('Invalid team level'),
  body('season').optional().isString().withMessage('Season must be a string'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const team = await institutionalPartnershipsService.createInstitutionalTeam(
      institutionId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team',
      error: error.message
    });
  }
});

/**
 * @route POST /api/institutions/:institutionId/athletes/bulk
 * @desc Bulk import athletes
 * @access Private (Institution Admin)
 */
router.post('/:institutionId/athletes/bulk', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('athletes').isArray({ min: 1, max: 1000 }).withMessage('Athletes array must contain 1-1000 items'),
  body('athletes.*.name').trim().isLength({ min: 1 }).withMessage('Athlete name is required'),
  body('athletes.*.email').isEmail().withMessage('Valid email is required'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const results = await institutionalPartnershipsService.bulkImportAthletes(
      institutionId,
      req.body.athletes
    );

    res.json({
      success: true,
      message: `Bulk import completed. ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    console.error('Error bulk importing athletes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import athletes',
      error: error.message
    });
  }
});

/**
 * @route POST /api/institutions/:institutionId/integrations
 * @desc Create custom integration
 * @access Private (Institution Admin)
 */
router.post('/:institutionId/integrations', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Integration name is required'),
  body('type').isIn(['api', 'webhook', 'sso', 'lms', 'other']).withMessage('Invalid integration type'),
  body('config').isObject().withMessage('Config must be an object'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const integration = await institutionalPartnershipsService.createCustomIntegration(
      institutionId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Integration created successfully',
      data: integration
    });

  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create integration',
      error: error.message
    });
  }
});

/**
 * @route GET /api/institutions/:institutionId/analytics
 * @desc Generate institution analytics report
 * @access Private (Institution Admin)
 */
router.get('/:institutionId/analytics', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  query('dateRange').optional().isIn(['last_7_days', 'last_30_days', 'last_90_days', 'current_season']).withMessage('Invalid date range'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;
    const filters = req.query;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const report = await institutionalPartnershipsService.generateInstitutionReport(
      institutionId,
      filters
    );

    res.json({
      success: true,
      message: 'Analytics report generated successfully',
      data: report
    });

  } catch (error) {
    console.error('Error generating analytics report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics report',
      error: error.message
    });
  }
});

/**
 * @route POST /api/institutions/webhook/:institutionId
 * @desc Handle institution webhook
 * @access Public (with institution authentication)
 */
router.post('/webhook/:institutionId', [
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('type').isString().withMessage('Webhook type is required'),
  body('data').isObject().withMessage('Webhook data must be an object'),
  validateRequest,
  authenticateInstitution
], async (req, res) => {
  try {
    const { institutionId } = req.params;
    const webhookData = req.body;

    const result = await institutionalPartnershipsService.handleInstitutionWebhook(
      institutionId,
      webhookData
    );

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

/**
 * @route GET /api/institutions/:institutionId/api-keys
 * @desc Get institution API credentials (regenerate)
 * @access Private (Institution Admin)
 */
router.get('/:institutionId/api-keys', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const credentials = await institutionalPartnershipsService.regenerateApiCredentials(institutionId);

    res.json({
      success: true,
      message: 'API credentials regenerated',
      data: credentials
    });

  } catch (error) {
    console.error('Error regenerating API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate API keys',
      error: error.message
    });
  }
});

/**
 * @route POST /api/institutions/:institutionId/api-keys/regenerate
 * @desc Regenerate institution API credentials
 * @access Private (Institution Admin)
 */
router.post('/:institutionId/api-keys/regenerate', [
  verifyToken,
  param('institutionId').isMongoId().withMessage('Invalid institution ID'),
  validateRequest
], async (req, res) => {
  try {
    const { institutionId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.institutionId !== institutionId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const credentials = await institutionalPartnershipsService.regenerateApiCredentials(institutionId);

    res.json({
      success: true,
      message: 'API credentials regenerated successfully',
      data: credentials
    });

  } catch (error) {
    console.error('Error regenerating API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate API keys',
      error: error.message
    });
  }
});

module.exports = router;