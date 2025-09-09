const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput, validateInjuryData } = require('../middleware/validation');
const InjuryRiskModel = require('../services/injuryRiskModel');
const Injury = require('../models/injuryModel');
const TrainingSession = require('../models/trainingSessionModel');
const Player = require('../models/playerModel');

const injuryRiskModel = new InjuryRiskModel();

// Get injury risk assessment for an athlete
router.get('/:athleteId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { days = 30 } = req.query;

    // Get athlete data
    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Get recent training sessions
    const recentSessions = await TrainingSession.find({
      athleteId,
      date: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    }).sort({ date: -1 });

    // Get injury history
    const injuryHistory = await Injury.find({
      athleteId,
      dateOccurred: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
    });

    // Prepare athlete data for risk assessment
    const athleteData = {
      age: calculateAge(athlete.year),
      weight: athlete.weight,
      height: athlete.height,
      position: athlete.position,
      trainingLoad: calculateAverageTrainingLoad(recentSessions),
      sessionFrequency: calculateSessionFrequency(recentSessions, days),
      recoveryTime: calculateAverageRecoveryTime(recentSessions),
      recentPerformance: athlete.garScore,
      previousInjuries: injuryHistory,
      chronicConditions: [] // Would need to be stored separately
    };

    // Calculate risk
    const riskAssessment = await injuryRiskModel.calculateRisk(athleteData);

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name,
          position: athlete.position,
          garScore: athlete.garScore
        },
        assessment: riskAssessment,
        dataPoints: {
          sessionsAnalyzed: recentSessions.length,
          injuriesFound: injuryHistory.length,
          analysisPeriod: `${days} days`
        }
      }
    });

  } catch (error) {
    console.error('Error getting injury risk assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating injury risk',
      error: error.message
    });
  }
});

// Get injury risk trends over time
router.get('/:athleteId/trends', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { months = 6 } = req.query;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    const trends = [];
    const now = new Date();

    // Calculate risk for each month
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthSessions = await TrainingSession.find({
        athleteId,
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const monthInjuries = await Injury.find({
        athleteId,
        dateOccurred: { $gte: monthStart, $lte: monthEnd }
      });

      const athleteData = {
        age: calculateAge(athlete.year),
        weight: athlete.weight,
        height: athlete.height,
        position: athlete.position,
        trainingLoad: calculateAverageTrainingLoad(monthSessions),
        sessionFrequency: calculateSessionFrequency(monthSessions, 30),
        recoveryTime: calculateAverageRecoveryTime(monthSessions),
        recentPerformance: athlete.garScore,
        previousInjuries: monthInjuries,
        chronicConditions: []
      };

      const riskAssessment = await injuryRiskModel.calculateRisk(athleteData);

      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        sessionsCount: monthSessions.length,
        injuriesCount: monthInjuries.length
      });
    }

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name
        },
        trends,
        period: `${months} months`
      }
    });

  } catch (error) {
    console.error('Error getting injury risk trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating injury risk trends',
      error: error.message
    });
  }
});

// Get injury prevention recommendations
router.get('/:athleteId/recommendations', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Get recent data for recommendations
    const recentSessions = await TrainingSession.find({
      athleteId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const injuryHistory = await Injury.find({
      athleteId,
      dateOccurred: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    });

    const athleteData = {
      age: calculateAge(athlete.year),
      weight: athlete.weight,
      height: athlete.height,
      position: athlete.position,
      trainingLoad: calculateAverageTrainingLoad(recentSessions),
      sessionFrequency: calculateSessionFrequency(recentSessions, 30),
      recoveryTime: calculateAverageRecoveryTime(recentSessions),
      recentPerformance: athlete.garScore,
      previousInjuries: injuryHistory,
      chronicConditions: []
    };

    const riskAssessment = await injuryRiskModel.calculateRisk(athleteData);

    // Generate additional prevention recommendations
    const preventionTips = generatePreventionTips(athleteData, riskAssessment);

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name,
          position: athlete.position
        },
        recommendations: riskAssessment.recommendations,
        preventionTips,
        riskLevel: riskAssessment.riskLevel
      }
    });

  } catch (error) {
    console.error('Error getting injury prevention recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
      error: error.message
    });
  }
});

// Helper functions
function calculateAge(year) {
  const currentYear = new Date().getFullYear();
  const yearMap = {
    'Freshman': 18,
    'Sophomore': 19,
    'Junior': 20,
    'Senior': 21,
    'Graduate': 22
  };
  return yearMap[year] || 20;
}

function calculateAverageTrainingLoad(sessions) {
  if (sessions.length === 0) return 0;

  const totalLoad = sessions.reduce((sum, session) => {
    return sum + (session.calculateTrainingLoad ? session.calculateTrainingLoad() : 0);
  }, 0);

  return totalLoad / sessions.length;
}

function calculateSessionFrequency(sessions, days) {
  if (sessions.length === 0) return 0;

  const expectedSessions = days / 3; // Assuming 3 sessions per week
  return Math.min(1, sessions.length / expectedSessions);
}

function calculateAverageRecoveryTime(sessions) {
  if (sessions.length === 0) return 168; // Default 1 week

  const totalRecovery = sessions.reduce((sum, session) => {
    return sum + (session.calculateRecoveryTime ? session.calculateRecoveryTime() : 48);
  }, 0);

  return totalRecovery / sessions.length;
}

function generatePreventionTips(athleteData, riskAssessment) {
  const tips = [];

  // Position-specific tips
  const positionTips = {
    'QB': [
      'Focus on proper throwing mechanics to prevent shoulder injuries',
      'Strengthen core for better pocket stability',
      'Practice footwork drills for quick releases'
    ],
    'RB': [
      'Build lower body strength for contact',
      'Work on change of direction drills',
      'Focus on proper tackling form in practice'
    ],
    'WR': [
      'Improve landing technique for jumps',
      'Strengthen ankles with balance exercises',
      'Practice route running with proper footwork'
    ],
    'OL': [
      'Build overall strength and power',
      'Focus on proper lifting technique',
      'Include mobility work for joints'
    ],
    'DL': [
      'Develop explosion and power',
      'Work on proper tackling form',
      'Include recovery-focused training'
    ]
  };

  if (positionTips[athleteData.position]) {
    tips.push(...positionTips[athleteData.position]);
  }

  // General prevention tips
  tips.push(
    'Always warm up properly before training',
    'Stay hydrated during all activities',
    'Listen to your body and rest when needed',
    'Maintain proper nutrition for recovery',
    'Get adequate sleep (7-9 hours per night)'
  );

  return tips;
}

module.exports = router;
