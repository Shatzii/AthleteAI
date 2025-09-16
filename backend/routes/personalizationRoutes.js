const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const PersonalizationEngine = require('../services/personalizationEngine');
const Player = require('../models/playerModel');
const TrainingSession = require('../models/trainingSessionModel');

const personalizationEngine = new PersonalizationEngine();

// Initialize personalization engine
personalizationEngine.initialize().catch(console.error);

// Get personalized program for an athlete
router.get('/:athleteId/program', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Get athlete data
    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Get training sessions
    const trainingSessions = await TrainingSession.find({
      athleteId,
      date: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } // Last 6 months
    }).sort({ date: -1 });

    // Prepare athlete data for personalization
    const athleteData = {
      id: athlete._id,
      name: athlete.name,
      sport: athlete.sport || 'football',
      age: athlete.age,
      weight: athlete.weight,
      height: athlete.height,
      gender: athlete.gender,
      goals: athlete.goals || ['performance', 'strength'],
      metrics: athlete.metrics || {},
      genetics: athlete.genetics || {},
      trainingSessions,
      performanceHistory: athlete.performanceHistory || [],
      recoveryData: extractRecoveryData(trainingSessions),
      activityLevel: athlete.activityLevel || 'moderate',
      programDuration: req.query.duration || 12 // weeks
    };

    // Generate personalized program
    const personalizedProgram = await personalizationEngine.generatePersonalizedProgram(athleteId, athleteData);

    res.json({
      success: true,
      data: personalizedProgram
    });

  } catch (error) {
    console.error('Error generating personalized program:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personalized program',
      error: error.message
    });
  }
});

// Update athlete profile with new data
router.post('/:athleteId/profile/update', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { newData, outcomes } = req.body;

    await personalizationEngine.updateAthleteProfile(athleteId, newData, outcomes);

    res.json({
      success: true,
      message: 'Athlete profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating athlete profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update athlete profile',
      error: error.message
    });
  }
});

// Get genetic analysis for an athlete
router.get('/:athleteId/genetics', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    const geneticProfile = personalizationEngine.analyzeGeneticFactors(athlete.genetics || {});

    res.json({
      success: true,
      data: {
        athleteId,
        geneticProfile,
        analyzedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error analyzing genetics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze genetic profile',
      error: error.message
    });
  }
});

// Get nutrition plan for an athlete
router.get('/:athleteId/nutrition', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    const geneticProfile = personalizationEngine.analyzeGeneticFactors(athlete.genetics || {});
    const nutritionPlan = personalizationEngine.generateNutritionPlan({
      weight: athlete.weight,
      height: athlete.height,
      age: athlete.age,
      gender: athlete.gender,
      sport: athlete.sport,
      activityLevel: athlete.activityLevel
    }, geneticProfile);

    res.json({
      success: true,
      data: {
        athleteId,
        nutritionPlan,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error generating nutrition plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate nutrition plan',
      error: error.message
    });
  }
});

// Get coaching advice for an athlete
router.get('/:athleteId/coaching', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Get training sessions for assessment
    const trainingSessions = await TrainingSession.find({
      athleteId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    const athleteData = {
      metrics: athlete.metrics || {},
      trainingSessions
    };

    const fitnessAssessment = await personalizationEngine.assessFitnessLevel(athleteId, athleteData);
    const coachingAdvice = personalizationEngine.generatePersonalizedCoaching(athleteData, fitnessAssessment);

    res.json({
      success: true,
      data: {
        athleteId,
        coachingAdvice,
        fitnessAssessment,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error generating coaching advice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate coaching advice',
      error: error.message
    });
  }
});

// Get personalization engine statistics
router.get('/stats', authMiddleware.verifyToken, async (req, res) => {
  try {
    const stats = personalizationEngine.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting personalization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personalization statistics',
      error: error.message
    });
  }
});

// Helper function to extract recovery data from training sessions
function extractRecoveryData(sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      sleep: { hours: 7 },
      nutrition: { calories: 2500 },
      restDays: 1
    };
  }

  // Calculate average recovery metrics from sessions
  const totalSleep = sessions.reduce((sum, s) => sum + (s.recovery?.sleep || 7), 0);
  const totalCalories = sessions.reduce((sum, s) => sum + (s.recovery?.calories || 2500), 0);
  const restDays = sessions.filter(s => s.type === 'rest').length;

  return {
    sleep: { hours: totalSleep / sessions.length },
    nutrition: { calories: totalCalories / sessions.length },
    restDays: restDays
  };
}

module.exports = router;