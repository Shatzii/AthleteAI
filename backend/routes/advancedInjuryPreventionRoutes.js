// Advanced Injury Prevention Routes
// API endpoints for enhanced injury prevention with computer vision and rehabilitation

const express = require('express');
const router = express.Router();
const advancedInjuryPreventionService = require('../services/advancedInjuryPreventionService');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const { body, param, validationResult } = require('express-validator');

// Configure multer for image uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

/**
 * @route POST /api/injury-prevention/analyze-movement
 * @desc Analyze movement patterns using computer vision
 * @access Private
 */
router.post('/analyze-movement', [
  verifyToken,
  upload.single('image'),
  body('exerciseType').optional().isString().withMessage('Exercise type must be a string'),
  body('bodyPart').optional().isString().withMessage('Body part must be a string'),
  body('angle').optional().isString().withMessage('Angle must be a string'),
  body('athleteLevel').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid athlete level'),
  validateRequest
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const metadata = {
      athleteId: req.user.id,
      exerciseType: req.body.exerciseType,
      bodyPart: req.body.bodyPart,
      angle: req.body.angle,
      athleteLevel: req.body.athleteLevel
    };

    const result = await advancedInjuryPreventionService.analyzeMovementPattern(
      req.file.buffer,
      metadata
    );

    res.json({
      success: true,
      message: 'Movement analysis completed',
      data: result
    });

  } catch (error) {
    console.error('Error analyzing movement:', error);
    res.status(500).json({
      success: false,
      message: 'Movement analysis failed',
      error: error.message
    });
  }
});

/**
 * @route POST /api/injury-prevention/rehabilitation-plan
 * @desc Create personalized rehabilitation plan
 * @access Private
 */
router.post('/rehabilitation-plan', [
  verifyToken,
  body('athleteId').isMongoId().withMessage('Invalid athlete ID'),
  body('injuryRisks').isArray().withMessage('Injury risks must be an array'),
  body('injuryRisks.*').isString().withMessage('Each injury risk must be a string'),
  validateRequest
], async (req, res) => {
  try {
    const { athleteId, injuryRisks } = req.body;

    // Check if user has permission to create rehab plan for this athlete
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create rehabilitation plan for this athlete'
      });
    }

    const rehabPlan = await advancedInjuryPreventionService.createRehabilitationPlan(
      athleteId,
      injuryRisks
    );

    res.status(201).json({
      success: true,
      message: 'Rehabilitation plan created successfully',
      data: rehabPlan
    });

  } catch (error) {
    console.error('Error creating rehabilitation plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rehabilitation plan',
      error: error.message
    });
  }
});

/**
 * @route GET /api/injury-prevention/rehabilitation-plan/:athleteId
 * @desc Get rehabilitation plan for athlete
 * @access Private
 */
router.get('/rehabilitation-plan/:athleteId', [
  verifyToken,
  param('athleteId').isMongoId().withMessage('Invalid athlete ID'),
  validateRequest
], async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view rehabilitation plan'
      });
    }

    // For now, return a placeholder - in real implementation, you'd fetch from database
    const rehabPlan = {
      athleteId,
      phases: [
        {
          name: 'Acute Management',
          duration: '3 days',
          focus: 'Reduce inflammation and pain',
          exercises: ['RICE protocol', 'Gentle range of motion'],
          precautions: ['Avoid aggravating activities']
        }
      ],
      monitoring: {
        frequency: 'daily',
        metrics: ['Pain levels', 'Range of motion']
      }
    };

    res.json({
      success: true,
      data: rehabPlan
    });

  } catch (error) {
    console.error('Error getting rehabilitation plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rehabilitation plan',
      error: error.message
    });
  }
});

/**
 * @route POST /api/injury-prevention/preventive-program
 * @desc Generate preventive training program
 * @access Private
 */
router.post('/preventive-program', [
  verifyToken,
  body('athleteId').isMongoId().withMessage('Invalid athlete ID'),
  body('riskFactors').isArray().withMessage('Risk factors must be an array'),
  body('riskFactors.*').isString().withMessage('Each risk factor must be a string'),
  validateRequest
], async (req, res) => {
  try {
    const { athleteId, riskFactors } = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create preventive program'
      });
    }

    const program = await advancedInjuryPreventionService.generatePreventiveProgram(
      athleteId,
      riskFactors
    );

    res.status(201).json({
      success: true,
      message: 'Preventive program generated successfully',
      data: program
    });

  } catch (error) {
    console.error('Error generating preventive program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preventive program',
      error: error.message
    });
  }
});

/**
 * @route GET /api/injury-prevention/preventive-program/:athleteId
 * @desc Get preventive program for athlete
 * @access Private
 */
router.get('/preventive-program/:athleteId', [
  verifyToken,
  param('athleteId').isMongoId().withMessage('Invalid athlete ID'),
  validateRequest
], async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view preventive program'
      });
    }

    // Placeholder response - in real implementation, fetch from database
    const program = {
      athleteId,
      duration: '12 weeks',
      focus: 'Injury prevention and performance enhancement',
      components: {
        warmUp: ['Dynamic stretching', 'Light cardio'],
        mainExercises: ['Core stability', 'Balance training'],
        coolDown: ['Static stretching', 'Foam rolling']
      }
    };

    res.json({
      success: true,
      data: program
    });

  } catch (error) {
    console.error('Error getting preventive program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preventive program',
      error: error.message
    });
  }
});

/**
 * @route POST /api/injury-prevention/analyze-load
 * @desc Analyze training load and recovery needs
 * @access Private
 */
router.post('/analyze-load', [
  verifyToken,
  body('athleteId').isMongoId().withMessage('Invalid athlete ID'),
  body('sessions').isArray().withMessage('Sessions must be an array'),
  body('sessions.*.date').isISO8601().withMessage('Session date must be valid ISO date'),
  body('sessions.*.trainingLoad').isNumeric().withMessage('Training load must be numeric'),
  validateRequest
], async (req, res) => {
  try {
    const { athleteId, sessions } = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to analyze training load'
      });
    }

    const analysis = await advancedInjuryPreventionService.analyzeTrainingLoad(
      athleteId,
      sessions
    );

    res.json({
      success: true,
      message: 'Training load analysis completed',
      data: analysis
    });

  } catch (error) {
    console.error('Error analyzing training load:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze training load',
      error: error.message
    });
  }
});

/**
 * @route GET /api/injury-prevention/risk-history/:athleteId
 * @desc Get injury risk assessment history
 * @access Private
 */
router.get('/risk-history/:athleteId', [
  verifyToken,
  param('athleteId').isMongoId().withMessage('Invalid athlete ID'),
  validateRequest
], async (req, res) => {
  try {
    const { athleteId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view risk history'
      });
    }

    // In real implementation, you'd query the InjuryRisk model
    const riskHistory = {
      athleteId,
      totalRecords: 0,
      page,
      limit,
      records: []
    };

    res.json({
      success: true,
      data: riskHistory
    });

  } catch (error) {
    console.error('Error getting risk history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get risk history',
      error: error.message
    });
  }
});

/**
 * @route POST /api/injury-prevention/batch-analysis
 * @desc Analyze multiple movement patterns
 * @access Private
 */
router.post('/batch-analysis', [
  verifyToken,
  upload.array('images', 10), // Max 10 images
  body('metadata').isArray().withMessage('Metadata must be an array'),
  validateRequest
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image file is required'
      });
    }

    const results = [];
    const metadata = req.body.metadata || [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileMetadata = metadata[i] || {};

      try {
        const analysis = await advancedInjuryPreventionService.analyzeMovementPattern(
          file.buffer,
          {
            ...fileMetadata,
            athleteId: req.user.id
          }
        );

        results.push({
          fileIndex: i,
          filename: file.originalname,
          success: true,
          analysis
        });

      } catch (error) {
        results.push({
          fileIndex: i,
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Batch analysis completed. ${results.filter(r => r.success).length}/${results.length} successful`,
      data: results
    });

  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Batch analysis failed',
      error: error.message
    });
  }
});

/**
 * @route GET /api/injury-prevention/analytics/:athleteId
 * @desc Get injury prevention analytics
 * @access Private
 */
router.get('/analytics/:athleteId', [
  verifyToken,
  param('athleteId').isMongoId().withMessage('Invalid athlete ID'),
  validateRequest
], async (req, res) => {
  try {
    const { athleteId } = req.params;
    const timeframe = req.query.timeframe || '30d'; // 30d, 90d, 1y

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view analytics'
      });
    }

    // Placeholder analytics - in real implementation, compute from historical data
    const analytics = {
      athleteId,
      timeframe,
      riskTrends: {
        overall: 'decreasing',
        categories: {
          biomechanical: 'stable',
          training_load: 'improving',
          recovery: 'stable'
        }
      },
      commonIssues: [
        { issue: 'Knee alignment', frequency: 15, trend: 'decreasing' },
        { issue: 'Shoulder positioning', frequency: 8, trend: 'stable' }
      ],
      recommendations: [
        'Continue current preventive program',
        'Focus on core stability exercises',
        'Monitor training load ratios'
      ]
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

module.exports = router;