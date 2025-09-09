const express = require('express');
const router = express.Router();
const RecoveryOptimizationService = require('../services/recoveryOptimizationService');
const { authenticateToken } = require('../middleware/auth');

const recoveryService = new RecoveryOptimizationService();

// Initialize service
recoveryService.initialize().catch(console.error);

// POST /api/recovery/analyze
// Analyze comprehensive recovery for an athlete
router.post('/analyze', authenticateToken, async (req, res) => {
    try {
        const { athleteId, timeframe } = req.body;

        if (!athleteId) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID is required'
            });
        }

        // Check cache first
        const cachedAnalysis = recoveryService.getCachedRecoveryAnalysis(athleteId);
        if (cachedAnalysis && !req.query.force) {
            return res.json({
                success: true,
                data: cachedAnalysis,
                cached: true
            });
        }

        const analysis = await recoveryService.analyzeRecovery(
            athleteId,
            parseInt(timeframe) || 7
        );

        res.json({
            success: true,
            data: analysis,
            cached: false
        });

    } catch (error) {
        console.error('Error in recovery analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze recovery',
            details: error.message
        });
    }
});

// GET /api/recovery/sleep/:athleteId
// Get sleep analysis for an athlete
router.get('/sleep/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { timeframe } = req.query;

        const sleepAnalysis = await recoveryService.analyzeSleepQuality(
            athleteId,
            parseInt(timeframe) || 7
        );

        res.json({
            success: true,
            data: sleepAnalysis
        });

    } catch (error) {
        console.error('Error fetching sleep analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sleep analysis',
            details: error.message
        });
    }
});

// GET /api/recovery/nutrition/:athleteId
// Get nutrition analysis for an athlete
router.get('/nutrition/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { timeframe } = req.query;

        const nutritionAnalysis = await recoveryService.analyzeNutrition(
            athleteId,
            parseInt(timeframe) || 7
        );

        res.json({
            success: true,
            data: nutritionAnalysis
        });

    } catch (error) {
        console.error('Error fetching nutrition analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch nutrition analysis',
            details: error.message
        });
    }
});

// GET /api/recovery/stress/:athleteId
// Get stress analysis for an athlete
router.get('/stress/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { timeframe } = req.query;

        const stressAnalysis = await recoveryService.analyzeStressLevels(
            athleteId,
            parseInt(timeframe) || 7
        );

        res.json({
            success: true,
            data: stressAnalysis
        });

    } catch (error) {
        console.error('Error fetching stress analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stress analysis',
            details: error.message
        });
    }
});

// GET /api/recovery/workload/:athleteId
// Get training load analysis for an athlete
router.get('/workload/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { timeframe } = req.query;

        const workloadAnalysis = await recoveryService.analyzeTrainingLoad(
            athleteId,
            parseInt(timeframe) || 7
        );

        res.json({
            success: true,
            data: workloadAnalysis
        });

    } catch (error) {
        console.error('Error fetching workload analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workload analysis',
            details: error.message
        });
    }
});

// GET /api/recovery/trends/:athleteId
// Get recovery trends for an athlete
router.get('/trends/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { timeframe } = req.query;

        const trends = await recoveryService.getRecoveryTrends(
            athleteId,
            parseInt(timeframe) || 30
        );

        res.json({
            success: true,
            data: trends
        });

    } catch (error) {
        console.error('Error fetching recovery trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recovery trends',
            details: error.message
        });
    }
});

// POST /api/recovery/log-sleep
// Log sleep data for an athlete
router.post('/log-sleep', authenticateToken, async (req, res) => {
    try {
        const { athleteId, sleepData } = req.body;

        if (!athleteId || !sleepData) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and sleep data are required'
            });
        }

        // In a real implementation, this would save to database
        // For demo purposes, we'll just validate and return success

        const requiredFields = ['hours', 'quality', 'bedtime', 'waketime'];
        const missingFields = requiredFields.filter(field => !sleepData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate sleep data
        if (sleepData.hours < 0 || sleepData.hours > 24) {
            return res.status(400).json({
                success: false,
                error: 'Sleep hours must be between 0 and 24'
            });
        }

        if (sleepData.quality < 0 || sleepData.quality > 100) {
            return res.status(400).json({
                success: false,
                error: 'Sleep quality must be between 0 and 100'
            });
        }

        res.json({
            success: true,
            message: 'Sleep data logged successfully',
            data: {
                athleteId,
                loggedAt: new Date().toISOString(),
                sleepData
            }
        });

    } catch (error) {
        console.error('Error logging sleep data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log sleep data',
            details: error.message
        });
    }
});

// POST /api/recovery/log-nutrition
// Log nutrition data for an athlete
router.post('/log-nutrition', authenticateToken, async (req, res) => {
    try {
        const { athleteId, nutritionData } = req.body;

        if (!athleteId || !nutritionData) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and nutrition data are required'
            });
        }

        // Validate nutrition data
        const requiredFields = ['calories', 'protein', 'carbohydrates', 'fats'];
        const missingFields = requiredFields.filter(field => !nutritionData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate values
        if (nutritionData.calories < 0 || nutritionData.calories > 10000) {
            return res.status(400).json({
                success: false,
                error: 'Calories must be between 0 and 10000'
            });
        }

        if (nutritionData.protein < 0 || nutritionData.protein > 500) {
            return res.status(400).json({
                success: false,
                error: 'Protein must be between 0 and 500g'
            });
        }

        res.json({
            success: true,
            message: 'Nutrition data logged successfully',
            data: {
                athleteId,
                loggedAt: new Date().toISOString(),
                nutritionData
            }
        });

    } catch (error) {
        console.error('Error logging nutrition data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log nutrition data',
            details: error.message
        });
    }
});

// POST /api/recovery/log-workout
// Log workout data for recovery analysis
router.post('/log-workout', authenticateToken, async (req, res) => {
    try {
        const { athleteId, workoutData } = req.body;

        if (!athleteId || !workoutData) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and workout data are required'
            });
        }

        // Validate workout data
        const requiredFields = ['type', 'duration', 'intensity'];
        const missingFields = requiredFields.filter(field => !workoutData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate duration
        if (workoutData.duration < 0 || workoutData.duration > 600) {
            return res.status(400).json({
                success: false,
                error: 'Workout duration must be between 0 and 600 minutes'
            });
        }

        // Validate intensity
        const validIntensities = ['low', 'moderate', 'high', 'max'];
        if (!validIntensities.includes(workoutData.intensity)) {
            return res.status(400).json({
                success: false,
                error: 'Intensity must be one of: low, moderate, high, max'
            });
        }

        res.json({
            success: true,
            message: 'Workout data logged successfully',
            data: {
                athleteId,
                loggedAt: new Date().toISOString(),
                workoutData
            }
        });

    } catch (error) {
        console.error('Error logging workout data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log workout data',
            details: error.message
        });
    }
});

// GET /api/recovery/recommendations/:athleteId
// Get personalized recovery recommendations
router.get('/recommendations/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { category } = req.query;

        // Get comprehensive analysis
        const analysis = await recoveryService.analyzeRecovery(athleteId, 7);

        let recommendations = analysis.recommendations;

        // Filter by category if specified
        if (category) {
            recommendations = recommendations.filter(rec => rec.type === category);
        }

        // Group recommendations by priority
        const grouped = {
            high: recommendations.filter(rec => rec.priority === 'high'),
            medium: recommendations.filter(rec => rec.priority === 'medium'),
            low: recommendations.filter(rec => rec.priority === 'low')
        };

        res.json({
            success: true,
            data: {
                athleteId,
                totalRecommendations: recommendations.length,
                grouped,
                all: recommendations
            }
        });

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recommendations',
            details: error.message
        });
    }
});

// GET /api/recovery/risk-factors/:athleteId
// Get recovery risk factors
router.get('/risk-factors/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;

        // Get comprehensive analysis
        const analysis = await recoveryService.analyzeRecovery(athleteId, 7);

        // Group risk factors by severity
        const grouped = {
            high: analysis.riskFactors.filter(risk => risk.severity === 'high'),
            medium: analysis.riskFactors.filter(risk => risk.severity === 'medium'),
            low: analysis.riskFactors.filter(risk => risk.severity === 'low')
        };

        res.json({
            success: true,
            data: {
                athleteId,
                totalRiskFactors: analysis.riskFactors.length,
                grouped,
                all: analysis.riskFactors
            }
        });

    } catch (error) {
        console.error('Error fetching risk factors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch risk factors',
            details: error.message
        });
    }
});

// POST /api/recovery/action-plan
// Generate personalized recovery action plan
router.post('/action-plan', authenticateToken, async (req, res) => {
    try {
        const { athleteId, timeframe, focusAreas } = req.body;

        if (!athleteId) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID is required'
            });
        }

        // Get comprehensive analysis
        const analysis = await recoveryService.analyzeRecovery(
            athleteId,
            parseInt(timeframe) || 7
        );

        // Generate action plan
        const actionPlan = {
            athleteId,
            timeframe: parseInt(timeframe) || 7,
            generatedAt: new Date().toISOString(),
            overallScore: analysis.optimizationScore,
            focusAreas: focusAreas || ['sleep', 'nutrition', 'stress', 'workload'],
            phases: this.generateActionPlanPhases(analysis, focusAreas),
            milestones: this.generateMilestones(analysis),
            monitoring: this.generateMonitoringPlan(analysis),
            successMetrics: this.generateSuccessMetrics(analysis)
        };

        res.json({
            success: true,
            data: actionPlan
        });

    } catch (error) {
        console.error('Error generating action plan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate action plan',
            details: error.message
        });
    }
});

// Helper function to generate action plan phases
function generateActionPlanPhases(analysis, focusAreas) {
    const phases = [];
    const defaultAreas = ['sleep', 'nutrition', 'stress', 'workload'];
    const areas = focusAreas || defaultAreas;

    areas.forEach(area => {
        if (analysis.metrics[area]) {
            const phase = {
                area,
                duration: '2 weeks',
                priority: analysis.metrics[area].score < 70 ? 'high' : 'medium',
                currentScore: analysis.metrics[area].score,
                targetScore: Math.min(100, analysis.metrics[area].score + 15),
                actions: this.getPhaseActions(area, analysis.metrics[area]),
                timeline: this.generateTimeline(area)
            };
            phases.push(phase);
        }
    });

    return phases.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

// Helper function to get phase actions
function getPhaseActions(area, metrics) {
    const actionMap = {
        sleep: [
            'Establish consistent sleep schedule (same bedtime/waketime)',
            'Create optimal sleep environment (cool, dark, quiet)',
            'Avoid screens 1 hour before bedtime',
            'Limit caffeine after 2 PM',
            'Track sleep quality daily'
        ],
        nutrition: [
            'Calculate and track daily caloric needs',
            'Ensure proper macronutrient balance (protein, carbs, fats)',
            'Stay hydrated (3-4L water daily)',
            'Address any nutrient deficiencies',
            'Time meals around training sessions'
        ],
        stress: [
            'Practice daily stress management techniques',
            'Schedule regular rest days',
            'Incorporate recovery activities (yoga, meditation)',
            'Monitor HRV and stress indicators',
            'Maintain work-life balance'
        ],
        workload: [
            'Monitor training load and recovery balance',
            'Include periodization in training plan',
            'Add variety to training sessions',
            'Track fatigue and performance indicators',
            'Schedule deload weeks every 4-6 weeks'
        ]
    };

    return actionMap[area] || [];
}

// Helper function to generate timeline
function generateTimeline(area) {
    const timelines = {
        sleep: [
            { week: 1, focus: 'Establish routine' },
            { week: 2, focus: 'Optimize environment' }
        ],
        nutrition: [
            { week: 1, focus: 'Track and analyze' },
            { week: 2, focus: 'Optimize timing' }
        ],
        stress: [
            { week: 1, focus: 'Daily practices' },
            { week: 2, focus: 'Advanced techniques' }
        ],
        workload: [
            { week: 1, focus: 'Monitor and adjust' },
            { week: 2, focus: 'Periodization' }
        ]
    };

    return timelines[area] || [];
}

// Helper function to generate milestones
function generateMilestones(analysis) {
    return [
        {
            description: 'Improve overall recovery score by 10 points',
            target: analysis.optimizationScore + 10,
            timeframe: '2 weeks',
            metric: 'overall_score'
        },
        {
            description: 'Achieve consistent sleep quality above 80%',
            target: 80,
            timeframe: '1 week',
            metric: 'sleep_quality'
        },
        {
            description: 'Maintain proper hydration levels',
            target: 3.5,
            timeframe: '1 week',
            metric: 'water_intake'
        },
        {
            description: 'Keep training load within optimal range',
            target: 1.0,
            timeframe: '2 weeks',
            metric: 'acute_chronic_ratio'
        }
    ];
}

// Helper function to generate monitoring plan
function generateMonitoringPlan(analysis) {
    return {
        daily: [
            'Sleep duration and quality',
            'Hydration levels',
            'Energy levels and fatigue'
        ],
        weekly: [
            'Recovery scores',
            'Training load metrics',
            'Performance indicators'
        ],
        monthly: [
            'Overall progress review',
            'Adjust action plan as needed',
            'Update goals and targets'
        ],
        tools: [
            'Sleep tracking device/app',
            'Nutrition tracking app',
            'Heart rate monitor',
            'Performance tracking software'
        ]
    };
}

// Helper function to generate success metrics
function generateSuccessMetrics(analysis) {
    return [
        {
            name: 'Recovery Score Improvement',
            current: analysis.optimizationScore,
            target: Math.min(100, analysis.optimizationScore + 15),
            unit: 'points'
        },
        {
            name: 'Sleep Quality',
            current: analysis.metrics.sleep?.score || 0,
            target: 85,
            unit: 'score'
        },
        {
            name: 'Training Load Balance',
            current: analysis.metrics.workload?.acuteChronicRatio || 1,
            target: 1.0,
            unit: 'ratio'
        },
        {
            name: 'Injury Prevention',
            current: 0,
            target: 0,
            unit: 'incidents'
        }
    ];
}

module.exports = router;
