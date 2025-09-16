// Predictive Analytics API Routes
// Advanced analytics endpoints for performance prediction and insights

const express = require('express');
const router = express.Router();
const predictiveAnalyticsService = require('../services/predictiveAnalyticsService');
const auth = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Initialize service on startup
predictiveAnalyticsService.initialize().catch(console.error);

/**
 * @route GET /api/analytics/predictive/stats
 * @desc Get predictive analytics service statistics
 * @access Private (Admin)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = predictiveAnalyticsService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics statistics'
    });
  }
});

/**
 * @route POST /api/analytics/predictive/performance-trajectory
 * @desc Generate performance trajectory prediction
 * @access Private
 */
router.post('/performance-trajectory', [
  auth,
  body('athleteId').isString().notEmpty().withMessage('Athlete ID is required'),
  body('currentData').isObject().withMessage('Current athlete data is required'),
  body('currentData.age').isNumeric().withMessage('Age must be a number'),
  body('currentData.experience').isNumeric().withMessage('Experience must be a number'),
  body('currentData.trainingHours').isNumeric().withMessage('Training hours must be a number'),
  body('currentData.recoveryScore').isNumeric().withMessage('Recovery score must be a number'),
  body('timeframe').optional().isNumeric().withMessage('Timeframe must be a number')
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

    const { athleteId, currentData, timeframe = 12 } = req.body;

    // Verify athlete access (coach can access their athletes, athletes can access themselves)
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const prediction = await predictiveAnalyticsService.predictPerformanceTrajectory(
      athleteId,
      currentData,
      timeframe
    );

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Error generating performance trajectory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance trajectory prediction'
    });
  }
});

/**
 * @route POST /api/analytics/predictive/injury-risk
 * @desc Assess injury risk for an athlete
 * @access Private
 */
router.post('/injury-risk', [
  auth,
  body('athleteId').isString().notEmpty().withMessage('Athlete ID is required'),
  body('riskFactors').isObject().withMessage('Risk factors are required'),
  body('riskFactors.workload').isNumeric().withMessage('Workload must be a number'),
  body('riskFactors.recoveryScore').isNumeric().withMessage('Recovery score must be a number'),
  body('riskFactors.age').isNumeric().withMessage('Age must be a number'),
  body('riskFactors.previousInjuries').isNumeric().withMessage('Previous injuries must be a number'),
  body('riskFactors.trainingIntensity').isNumeric().withMessage('Training intensity must be a number')
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

    const { athleteId, riskFactors } = req.body;

    // Verify athlete access
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const riskAssessment = await predictiveAnalyticsService.predictInjuryRisk(
      athleteId,
      riskFactors
    );

    res.json({
      success: true,
      data: riskAssessment
    });

  } catch (error) {
    console.error('Error assessing injury risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assess injury risk'
    });
  }
});

/**
 * @route POST /api/analytics/predictive/comparative-analysis
 * @desc Generate comparative analysis for an athlete
 * @access Private
 */
router.post('/comparative-analysis', [
  auth,
  body('athleteId').isString().notEmpty().withMessage('Athlete ID is required'),
  body('comparisonGroup').isArray().withMessage('Comparison group must be an array'),
  body('comparisonGroup.*.id').isString().notEmpty().withMessage('Each comparison athlete must have an ID'),
  body('comparisonGroup.*.name').isString().notEmpty().withMessage('Each comparison athlete must have a name')
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

    const { athleteId, comparisonGroup } = req.body;

    // Verify athlete access
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const analysis = await predictiveAnalyticsService.generateComparativeAnalysis(
      athleteId,
      comparisonGroup
    );

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error generating comparative analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comparative analysis'
    });
  }
});

/**
 * @route GET /api/analytics/predictive/models
 * @desc Get information about available predictive models
 * @access Private (Admin/Coach)
 */
router.get('/models', auth, async (req, res) => {
  try {
    // Only admins and coaches can access model information
    if (req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const models = Array.from(predictiveAnalyticsService.models.entries()).map(([key, model]) => ({
      name: key,
      type: model.type,
      features: model.features,
      target: model.target,
      accuracy: model.accuracy,
      lastTrained: model.lastTrained
    }));

    res.json({
      success: true,
      data: models
    });

  } catch (error) {
    console.error('Error fetching model information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model information'
    });
  }
});

/**
 * @route POST /api/analytics/predictive/batch-predictions
 * @desc Generate batch predictions for multiple athletes
 * @access Private (Admin/Coach)
 */
router.post('/batch-predictions', [
  auth,
  body('predictions').isArray().withMessage('Predictions must be an array'),
  body('predictions.*.athleteId').isString().notEmpty().withMessage('Each prediction must have an athlete ID'),
  body('predictions.*.type').isIn(['performance_trajectory', 'injury_risk']).withMessage('Invalid prediction type'),
  body('predictions.*.data').isObject().withMessage('Each prediction must have data')
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

    // Only admins and coaches can perform batch predictions
    if (req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { predictions } = req.body;
    const results = [];

    for (const prediction of predictions) {
      try {
        let result;

        if (prediction.type === 'performance_trajectory') {
          result = await predictiveAnalyticsService.predictPerformanceTrajectory(
            prediction.athleteId,
            prediction.data,
            prediction.timeframe || 12
          );
        } else if (prediction.type === 'injury_risk') {
          result = await predictiveAnalyticsService.predictInjuryRisk(
            prediction.athleteId,
            prediction.data
          );
        }

        results.push({
          athleteId: prediction.athleteId,
          type: prediction.type,
          success: true,
          data: result
        });

      } catch (error) {
        results.push({
          athleteId: prediction.athleteId,
          type: prediction.type,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        total: predictions.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });

  } catch (error) {
    console.error('Error processing batch predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch predictions'
    });
  }
});

/**
 * @route DELETE /api/analytics/predictive/cache
 * @desc Clear prediction cache
 * @access Private (Admin)
 */
router.delete('/cache', auth, async (req, res) => {
  try {
    // Only admins can clear cache
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    predictiveAnalyticsService.clearCache();

    res.json({
      success: true,
      message: 'Prediction cache cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear prediction cache'
    });
  }
});

/**
 * @route GET /api/analytics/predictive/dashboard/:athleteId
 * @desc Get comprehensive analytics dashboard data for an athlete
 * @access Private
 */
router.get('/dashboard/:athleteId', [
  auth,
  param('athleteId').isString().notEmpty().withMessage('Athlete ID is required'),
  query('timeframe').optional().isNumeric().withMessage('Timeframe must be a number')
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

    const { athleteId } = req.params;
    const { timeframe = 12 } = req.query;

    // Verify athlete access
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get athlete data (this would typically come from database)
    const athleteData = await getAthleteData(athleteId);
    if (!athleteData) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Generate comprehensive dashboard data
    const dashboardData = await generateDashboardData(athleteData, timeframe);

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard data'
    });
  }
});

/**
 * Helper function to get athlete data
 * In production, this would query the database
 */
async function getAthleteData(athleteId) {
  // Mock data - replace with actual database query
  return {
    id: athleteId,
    name: 'John Doe',
    age: 22,
    experience: 3,
    trainingHours: 25,
    recoveryScore: 75,
    injuryHistory: 1,
    position: 'QB',
    currentPerformance: 78
  };
}

/**
 * Generate comprehensive dashboard data
 */
async function generateDashboardData(athleteData, timeframe) {
  // Generate performance trajectory
  const trajectory = await predictiveAnalyticsService.predictPerformanceTrajectory(
    athleteData.id,
    athleteData,
    timeframe
  );

  // Generate injury risk assessment
  const injuryRisk = await predictiveAnalyticsService.predictInjuryRisk(
    athleteData.id,
    {
      workload: 65,
      recoveryScore: athleteData.recoveryScore,
      age: athleteData.age,
      previousInjuries: athleteData.injuryHistory,
      trainingIntensity: 70
    }
  );

  // Generate comparative analysis (mock comparison group)
  const comparisonGroup = [
    { id: 'comp1', name: 'Similar QB 1' },
    { id: 'comp2', name: 'Similar QB 2' },
    { id: 'comp3', name: 'Similar QB 3' }
  ];

  const comparativeAnalysis = await predictiveAnalyticsService.generateComparativeAnalysis(
    athleteData.id,
    comparisonGroup
  );

  return {
    athlete: {
      id: athleteData.id,
      name: athleteData.name,
      position: athleteData.position,
      age: athleteData.age
    },
    performanceTrajectory: trajectory,
    injuryRisk: injuryRisk,
    comparativeAnalysis: comparativeAnalysis,
    summary: {
      overallHealth: calculateOverallHealth(trajectory, injuryRisk),
      riskLevel: injuryRisk.riskLevel,
      predictedImprovement: trajectory.trajectory[timeframe - 1].predictedPerformance - athleteData.currentPerformance,
      percentileRankings: comparativeAnalysis.percentileRankings
    },
    generatedAt: new Date()
  };
}

/**
 * Calculate overall health score
 */
function calculateOverallHealth(trajectory, injuryRisk) {
  const performanceScore = trajectory.trajectory[trajectory.trajectory.length - 1].predictedPerformance;
  const riskScore = injuryRisk.probability * 100;

  // Higher performance, lower risk = better health
  const healthScore = (performanceScore * 0.7) + ((100 - riskScore) * 0.3);

  return Math.round(healthScore);
}

module.exports = router;