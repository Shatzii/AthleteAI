const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const PerformancePredictionModel = require('../services/performancePredictionModel');
const TrainingSession = require('../models/trainingSessionModel');
const Player = require('../models/playerModel');

const performanceModel = new PerformancePredictionModel();

// Get performance prediction for an athlete
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

    // Get training sessions for performance analysis
    const trainingSessions = await TrainingSession.find({
      athleteId,
      date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    }).sort({ date: 1 });

    // Get performance history (mock data for now - would come from performance tracking)
    const performanceHistory = generatePerformanceHistory(trainingSessions);

    // Prepare athlete data for prediction
    const athleteData = {
      trainingSessions,
      performanceHistory,
      recoveryData: extractRecoveryData(trainingSessions),
      stressFactors: [], // Would need to be tracked separately
      competitions: [] // Would need to be tracked separately
    };

    // Generate prediction
    const prediction = await performanceModel.predictPerformance(athleteData, days);

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name,
          position: athlete.position,
          currentGAR: athlete.garScore
        },
        prediction,
        dataPoints: {
          sessionsAnalyzed: trainingSessions.length,
          performanceRecords: performanceHistory.length,
          analysisPeriod: '90 days'
        }
      }
    });

  } catch (error) {
    console.error('Error getting performance prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating performance prediction',
      error: error.message
    });
  }
});

// Get performance trends and analysis
router.get('/:athleteId/analysis', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Get comprehensive training data
    const trainingSessions = await TrainingSession.find({
      athleteId,
      date: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } // Last 6 months
    }).sort({ date: 1 });

    const performanceHistory = generatePerformanceHistory(trainingSessions);

    // Analyze different aspects
    const analysis = {
      trainingConsistency: calculateTrainingConsistency(trainingSessions),
      improvementRate: calculateImprovementRate(performanceHistory),
      workloadDistribution: analyzeWorkloadDistribution(trainingSessions),
      recoveryPatterns: analyzeRecoveryPatterns(trainingSessions),
      peakPerformance: identifyPeakPerformance(trainingSessions),
      fatigueIndicators: detectFatigueIndicators(trainingSessions)
    };

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name
        },
        analysis,
        period: '6 months',
        sessionsCount: trainingSessions.length
      }
    });

  } catch (error) {
    console.error('Error getting performance analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing performance',
      error: error.message
    });
  }
});

// Get training optimization recommendations
router.get('/:athleteId/optimization', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    const trainingSessions = await TrainingSession.find({
      athleteId,
      date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }).sort({ date: -1 }).limit(20);

    const athleteData = {
      trainingSessions,
      performanceHistory: generatePerformanceHistory(trainingSessions),
      recoveryData: extractRecoveryData(trainingSessions),
      stressFactors: [],
      competitions: []
    };

    const prediction = await performanceModel.predictPerformance(athleteData, 30);

    // Generate optimization recommendations
    const optimization = {
      trainingFrequency: optimizeTrainingFrequency(trainingSessions),
      intensityDistribution: optimizeIntensityDistribution(trainingSessions),
      recoverySchedule: optimizeRecoverySchedule(trainingSessions),
      focusAreas: identifyFocusAreas(prediction, athlete),
      periodizationPlan: generatePeriodizationPlan(trainingSessions)
    };

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name,
          position: athlete.position
        },
        optimization,
        currentPrediction: prediction,
        recommendations: prediction.recommendations
      }
    });

  } catch (error) {
    console.error('Error getting training optimization:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating optimization recommendations',
      error: error.message
    });
  }
});

// Helper functions
function generatePerformanceHistory(sessions) {
  // Generate mock performance history based on training sessions
  // In a real implementation, this would come from actual performance tracking
  const history = [];
  const baseScore = 75; // Base GAR score

  sessions.forEach((session, index) => {
    const date = new Date(session.date);
    let score = baseScore;

    // Adjust score based on training quality
    score += (session.intensity - 5) * 2; // Intensity impact
    score += (session.perceivedExertion - 5) * 1; // Effort impact
    score -= session.fatigue || 0; // Fatigue penalty

    // Add some randomness and trend
    score += (Math.random() - 0.5) * 10;
    score += (index / sessions.length) * 5; // Slight improvement over time

    score = Math.max(0, Math.min(100, score));

    history.push({
      date: date.toISOString(),
      score: Math.round(score),
      sessionId: session._id
    });
  });

  return history;
}

function extractRecoveryData(sessions) {
  if (sessions.length === 0) return {};

  const totalSleep = sessions.reduce((sum, s) => sum + (s.sleep?.hours || 7), 0);
  const totalCalories = sessions.reduce((sum, s) => sum + (s.nutrition?.calories || 2000), 0);

  return {
    sleep: {
      hours: totalSleep / sessions.length
    },
    nutrition: {
      calories: totalCalories / sessions.length
    }
  };
}

function calculateTrainingConsistency(sessions) {
  if (sessions.length < 2) return 0.5;

  const dates = sessions.map(s => new Date(s.date)).sort((a, b) => a - b);
  const intervals = [];

  for (let i = 1; i < dates.length; i++) {
    intervals.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const targetInterval = 3; // 3 days between sessions

  return Math.max(0, 1 - Math.abs(avgInterval - targetInterval) / targetInterval);
}

function calculateImprovementRate(history) {
  if (history.length < 2) return 0;

  const firstHalf = history.slice(0, Math.floor(history.length / 2));
  const secondHalf = history.slice(Math.floor(history.length / 2));

  const firstAvg = firstHalf.reduce((sum, h) => sum + h.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, h) => sum + h.score, 0) / secondHalf.length;

  return (secondAvg - firstAvg) / firstAvg;
}

function analyzeWorkloadDistribution(sessions) {
  const distribution = {
    low: 0,
    medium: 0,
    high: 0
  };

  sessions.forEach(session => {
    const load = session.calculateTrainingLoad ? session.calculateTrainingLoad() : 0;
    if (load < 50) distribution.low++;
    else if (load < 100) distribution.medium++;
    else distribution.high++;
  });

  return distribution;
}

function analyzeRecoveryPatterns(sessions) {
  const patterns = {
    adequateRecovery: 0,
    insufficientRecovery: 0,
    overtraining: 0
  };

  sessions.forEach(session => {
    const recovery = session.calculateRecoveryTime ? session.calculateRecoveryTime() : 48;
    const fatigue = session.fatigue || 3;

    if (recovery >= 48 && fatigue <= 5) patterns.adequateRecovery++;
    else if (recovery < 24 || fatigue > 7) patterns.overtraining++;
    else patterns.insufficientRecovery++;
  });

  return patterns;
}

function identifyPeakPerformance(sessions) {
  if (sessions.length === 0) return null;

  let peakSession = sessions[0];
  let peakPerformance = 0;

  sessions.forEach(session => {
    const performance = (session.intensity || 5) * (session.perceivedExertion || 5);
    if (performance > peakPerformance) {
      peakPerformance = performance;
      peakSession = session;
    }
  });

  return {
    date: peakSession.date,
    performance: peakPerformance,
    conditions: {
      intensity: peakSession.intensity,
      fatigue: peakSession.fatigue,
      sleep: peakSession.sleep?.hours
    }
  };
}

function detectFatigueIndicators(sessions) {
  const indicators = [];

  sessions.forEach((session, index) => {
    const fatigue = session.fatigue || 3;
    const exertion = session.perceivedExertion || 5;

    if (fatigue > 7) {
      indicators.push({
        date: session.date,
        type: 'high_fatigue',
        severity: fatigue,
        exertion: exertion
      });
    }

    if (exertion < 3 && fatigue > 5) {
      indicators.push({
        date: session.date,
        type: 'low_effort_high_fatigue',
        severity: 'moderate'
      });
    }
  });

  return indicators;
}

function optimizeTrainingFrequency(sessions) {
  const currentFrequency = calculateTrainingConsistency(sessions);

  if (currentFrequency < 0.6) {
    return {
      recommendation: 'increase',
      target: '4-5 sessions per week',
      reasoning: 'Current consistency is low, increasing frequency will improve adaptation'
    };
  } else if (currentFrequency > 0.9) {
    return {
      recommendation: 'maintain',
      target: 'current frequency',
      reasoning: 'Good consistency, maintain current training schedule'
    };
  } else {
    return {
      recommendation: 'optimize',
      target: '3-4 sessions per week',
      reasoning: 'Balance training with adequate recovery'
    };
  }
}

function optimizeIntensityDistribution(sessions) {
  const distribution = analyzeWorkloadDistribution(sessions);
  const total = sessions.length;

  const lowPercent = (distribution.low / total) * 100;
  const highPercent = (distribution.high / total) * 100;

  if (highPercent > 40) {
    return {
      recommendation: 'reduce_high_intensity',
      target: '30-40% high intensity sessions',
      reasoning: 'Too many high-intensity sessions may lead to overtraining'
    };
  } else if (lowPercent > 60) {
    return {
      recommendation: 'increase_intensity',
      target: '20-30% high intensity sessions',
      reasoning: 'Need more challenging sessions to drive improvement'
    };
  } else {
    return {
      recommendation: 'maintain',
      target: 'current distribution',
      reasoning: 'Good balance of training intensities'
    };
  }
}

function optimizeRecoverySchedule(sessions) {
  const patterns = analyzeRecoveryPatterns(sessions);

  if (patterns.overtraining > patterns.adequateRecovery) {
    return {
      recommendation: 'increase_recovery',
      target: '48+ hours between intense sessions',
      reasoning: 'Signs of overtraining detected, prioritize recovery'
    };
  } else if (patterns.insufficientRecovery > patterns.adequateRecovery) {
    return {
      recommendation: 'optimize_recovery',
      target: '24-48 hours between sessions',
      reasoning: 'Balance training with adequate recovery time'
    };
  } else {
    return {
      recommendation: 'maintain',
      target: 'current recovery schedule',
      reasoning: 'Good recovery patterns established'
    };
  }
}

function identifyFocusAreas(prediction, athlete) {
  const areas = [];

  if (prediction.trend === 'declining') {
    areas.push({
      area: 'consistency',
      priority: 'high',
      action: 'Focus on maintaining regular training schedule'
    });
  }

  if (athlete.garScore < 70) {
    areas.push({
      area: 'fundamental_skills',
      priority: 'high',
      action: 'Work on basic technique and form'
    });
  }

  if (prediction.confidence < 0.7) {
    areas.push({
      area: 'data_collection',
      priority: 'medium',
      action: 'Track more detailed training metrics'
    });
  }

  return areas;
}

function generatePeriodizationPlan(sessions) {
  // Simple periodization based on recent training patterns
  const recentSessions = sessions.slice(0, 10);
  const avgIntensity = recentSessions.reduce((sum, s) => sum + (s.intensity || 5), 0) / recentSessions.length;

  if (avgIntensity > 7) {
    return {
      phase: 'recovery',
      duration: '1-2 weeks',
      focus: 'Active recovery and technique work',
      intensity: 'Low to moderate'
    };
  } else if (avgIntensity < 4) {
    return {
      phase: 'build',
      duration: '2-3 weeks',
      focus: 'Gradually increase training intensity',
      intensity: 'Progressive increase'
    };
  } else {
    return {
      phase: 'maintenance',
      duration: 'ongoing',
      focus: 'Maintain current fitness levels',
      intensity: 'Moderate, varied'
    };
  }
}

module.exports = router;
