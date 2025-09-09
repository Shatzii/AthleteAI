// Performance Prediction Model for AthleteAI
// Uses time-series analysis and statistical modeling
// to predict future athletic performance

const mongoose = require('mongoose');

class PerformancePredictionModel {
  constructor() {
    this.model = null;
    this.isTrained = false;
    this.historicalData = [];
    this.performanceFactors = {
      // Physical factors
      trainingConsistency: 0.25,
      trainingLoad: 0.20,
      recoveryQuality: 0.15,

      // Technical factors
      skillDevelopment: 0.15,

      // Mental factors
      motivation: 0.10,
      stress: 0.08,

      // External factors
      competitionLevel: 0.07
    };
  }

  /**
   * Predict future performance for an athlete
   * @param {Object} athleteData - Athlete's historical performance data
   * @param {number} predictionDays - Days to predict ahead
   * @returns {Object} Performance prediction with confidence
   */
  async predictPerformance(athleteData, predictionDays = 30) {
    try {
      const features = this.extractPerformanceFeatures(athleteData);
      const currentTrend = this.analyzePerformanceTrend(athleteData);
      const prediction = this.generatePrediction(features, currentTrend, predictionDays);
      const confidence = this.calculatePredictionConfidence(features, athleteData);

      return {
        predictedPerformance: Math.round(prediction.score),
        confidence: Math.round(confidence * 100) / 100,
        trend: currentTrend.direction,
        trendStrength: currentTrend.strength,
        factors: features,
        timeHorizon: predictionDays,
        recommendations: this.generatePerformanceRecommendations(prediction, features),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error predicting performance:', error);
      throw error;
    }
  }

  /**
   * Extract performance features from athlete data
   * @param {Object} athleteData - Raw athlete data
   * @returns {Object} Normalized performance features
   */
  extractPerformanceFeatures(athleteData) {
    const features = {};

    // Training consistency (based on session regularity)
    features.trainingConsistency = this.calculateTrainingConsistency(athleteData.trainingSessions || []);

    // Training load (volume and intensity)
    features.trainingLoad = this.calculateTrainingLoad(athleteData.trainingSessions || []);

    // Recovery quality (sleep, nutrition, rest)
    features.recoveryQuality = this.calculateRecoveryQuality(athleteData.recoveryData || {});

    // Skill development (performance improvements over time)
    features.skillDevelopment = this.calculateSkillDevelopment(athleteData.performanceHistory || []);

    // Motivation (session attendance, effort levels)
    features.motivation = this.calculateMotivation(athleteData.trainingSessions || []);

    // Stress levels (fatigue, external factors)
    features.stress = this.calculateStressLevel(athleteData.stressFactors || []);

    // Competition level (quality of opponents, event importance)
    features.competitionLevel = this.calculateCompetitionLevel(athleteData.competitions || []);

    return features;
  }

  /**
   * Analyze performance trend from historical data
   * @param {Object} athleteData - Athlete's historical data
   * @returns {Object} Trend analysis
   */
  analyzePerformanceTrend(athleteData) {
    const performances = athleteData.performanceHistory || [];

    if (performances.length < 2) {
      return { direction: 'stable', strength: 0.5 };
    }

    // Calculate trend using linear regression
    const trend = this.calculateLinearTrend(performances);

    let direction = 'stable';
    if (trend.slope > 0.5) direction = 'improving';
    else if (trend.slope < -0.5) direction = 'declining';

    return {
      direction,
      strength: Math.min(1, Math.abs(trend.slope)),
      slope: trend.slope,
      rSquared: trend.rSquared
    };
  }

  /**
   * Generate performance prediction
   * @param {Object} features - Performance features
   * @param {Object} trend - Current trend
   * @param {number} days - Prediction horizon
   * @returns {Object} Prediction result
   */
  generatePrediction(features, trend, days) {
    // Base prediction on current performance
    const currentPerformance = features.skillDevelopment * 100;

    // Apply trend adjustment
    const trendAdjustment = trend.slope * (days / 30); // Scale trend by time horizon

    // Apply feature weights
    let featureAdjustment = 0;
    for (const [feature, weight] of Object.entries(this.performanceFactors)) {
      featureAdjustment += features[feature] * weight;
    }

    // Calculate final prediction
    const predictedScore = currentPerformance + trendAdjustment + (featureAdjustment - 0.5) * 20;

    return {
      score: Math.max(0, Math.min(100, predictedScore)),
      trendContribution: trendAdjustment,
      featureContribution: featureAdjustment
    };
  }

  /**
   * Calculate confidence in prediction
   * @param {Object} features - Feature values
   * @param {Object} athleteData - Raw data
   * @returns {number} Confidence score 0-1
   */
  calculatePredictionConfidence(features, athleteData) {
    let confidence = 0.5; // Base confidence

    // More historical data increases confidence
    const dataPoints = (athleteData.performanceHistory || []).length;
    confidence += Math.min(0.3, dataPoints / 20);

    // Consistent training increases confidence
    if (features.trainingConsistency > 0.7) confidence += 0.1;

    // Good recovery data increases confidence
    if (features.recoveryQuality > 0.6) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Generate performance recommendations
   * @param {Object} prediction - Prediction result
   * @param {Object} features - Feature values
   * @returns {Array} Recommendations
   */
  generatePerformanceRecommendations(prediction, features) {
    const recommendations = [];

    if (features.trainingConsistency < 0.6) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Training Consistency',
        message: 'Improve training consistency to maximize performance gains.',
        actions: ['Schedule regular training sessions', 'Track attendance', 'Set realistic goals']
      });
    }

    if (features.recoveryQuality < 0.5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Recovery',
        message: 'Focus on recovery to prevent performance decline.',
        actions: ['Prioritize sleep (7-9 hours)', 'Monitor nutrition', 'Include rest days']
      });
    }

    if (features.trainingLoad > 0.8) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Training Load',
        message: 'High training load detected. Consider periodization.',
        actions: ['Implement deload weeks', 'Monitor fatigue levels', 'Balance training types']
      });
    }

    if (prediction.trend === 'declining') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance Trend',
        message: 'Performance is trending downward. Review training approach.',
        actions: ['Assess technique', 'Check for overtraining', 'Consult coach']
      });
    }

    return recommendations;
  }

  // Feature calculation methods
  calculateTrainingConsistency(sessions) {
    if (sessions.length < 2) return 0.5;

    // Calculate session frequency and regularity
    const dates = sessions.map(s => new Date(s.date)).sort((a, b) => a - b);
    const intervals = [];

    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24)); // days
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const regularity = 1 / (1 + Math.abs(avgInterval - 3)); // Optimal is 3 days between sessions

    return Math.min(1, regularity);
  }

  calculateTrainingLoad(sessions) {
    if (sessions.length === 0) return 0.5;

    const recentSessions = sessions.slice(-10); // Last 10 sessions
    const avgIntensity = recentSessions.reduce((sum, s) => sum + (s.intensity || 5), 0) / recentSessions.length;
    const avgDuration = recentSessions.reduce((sum, s) => sum + (s.duration || 60), 0) / recentSessions.length;

    // Normalize to 0-1 scale
    const load = (avgIntensity / 10) * (avgDuration / 120); // Assuming 120 min max session
    return Math.min(1, load);
  }

  calculateRecoveryQuality(recoveryData) {
    let score = 0.5; // Base score

    if (recoveryData.sleep) {
      const sleepHours = recoveryData.sleep.hours || 7;
      score += Math.min(0.2, Math.max(0, (sleepHours - 6) / 4)); // Optimal 7-9 hours
    }

    if (recoveryData.nutrition) {
      // Simple nutrition scoring based on calorie intake
      const calories = recoveryData.nutrition.calories || 2000;
      score += Math.min(0.15, Math.max(0, (calories - 1500) / 1000));
    }

    return Math.min(1, score);
  }

  calculateSkillDevelopment(performanceHistory) {
    if (performanceHistory.length < 2) return 0.5;

    // Calculate improvement rate
    const recent = performanceHistory.slice(-5);
    const earlier = performanceHistory.slice(-10, -5);

    if (earlier.length === 0) return 0.5;

    const recentAvg = recent.reduce((sum, p) => sum + p.score, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, p) => sum + p.score, 0) / earlier.length;

    const improvement = (recentAvg - earlierAvg) / earlierAvg;
    return Math.min(1, Math.max(0, 0.5 + improvement));
  }

  calculateMotivation(sessions) {
    if (sessions.length === 0) return 0.5;

    // Based on session attendance and perceived exertion
    const attendanceRate = sessions.filter(s => s.completed !== false).length / sessions.length;
    const avgExertion = sessions.reduce((sum, s) => sum + (s.perceivedExertion || 5), 0) / sessions.length;

    return (attendanceRate * 0.6) + ((avgExertion / 10) * 0.4);
  }

  calculateStressLevel(stressFactors) {
    if (stressFactors.length === 0) return 0.3; // Low base stress

    // Simple stress scoring
    const stressScore = stressFactors.reduce((sum, factor) => sum + (factor.severity || 5), 0) / stressFactors.length;
    return Math.min(1, stressScore / 10);
  }

  calculateCompetitionLevel(competitions) {
    if (competitions.length === 0) return 0.5;

    // Based on competition quality and outcomes
    const avgLevel = competitions.reduce((sum, c) => sum + (c.level || 5), 0) / competitions.length;
    return Math.min(1, avgLevel / 10);
  }

  calculateLinearTrend(data) {
    if (data.length < 2) return { slope: 0, rSquared: 0 };

    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, d) => sum + d.score, 0);
    const sumXY = data.reduce((sum, d, i) => sum + (i * d.score), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = data.reduce((sum, d, i) => sum + Math.pow(d.score - (slope * i + intercept), 2), 0);
    const ssTot = data.reduce((sum, d) => sum + Math.pow(d.score - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return { slope, intercept, rSquared: isNaN(rSquared) ? 0 : rSquared };
  }

  /**
   * Train the model with historical performance data
   * @param {Array} trainingData - Historical performance data
   */
  async train(trainingData) {
    this.historicalData = trainingData;
    this.isTrained = true;
    console.log(`Trained performance prediction model with ${trainingData.length} samples`);
  }

  /**
   * Get model statistics
   * @returns {Object} Model statistics
   */
  getStats() {
    return {
      isTrained: this.isTrained,
      trainingSamples: this.historicalData.length,
      performanceFactors: this.performanceFactors,
      version: '1.0.0'
    };
  }
}

module.exports = PerformancePredictionModel;
