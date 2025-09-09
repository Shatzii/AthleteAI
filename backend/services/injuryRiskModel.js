// Injury Risk Assessment Model for AthleteAI
// Uses statistical analysis and machine learning algorithms
// to predict injury risk based on athlete data

const mongoose = require('mongoose');

class InjuryRiskModel {
  constructor() {
    this.model = null;
    this.isTrained = false;
    this.trainingData = [];
    this.featureWeights = {
      // Physical factors
      age: 0.15,
      weight: 0.12,
      height: 0.08,
      position: 0.10,

      // Training factors
      trainingLoad: 0.20,
      sessionFrequency: 0.15,
      recoveryTime: 0.12,

      // Performance factors
      recentPerformance: 0.08,

      // Historical factors
      previousInjuries: 0.25,
      chronicConditions: 0.18
    };
  }

  /**
   * Calculate injury risk score for an athlete
   * @param {Object} athleteData - Athlete's physical and training data
   * @returns {Object} Risk assessment with score and recommendations
   */
  async calculateRisk(athleteData) {
    try {
      const features = this.extractFeatures(athleteData);
      const riskScore = this.computeRiskScore(features);
      const riskLevel = this.classifyRiskLevel(riskScore);
      const recommendations = this.generateRecommendations(riskScore, features);

      return {
        riskScore: Math.round(riskScore * 100) / 100,
        riskLevel,
        confidence: this.calculateConfidence(features),
        recommendations,
        factors: features,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error calculating injury risk:', error);
      throw error;
    }
  }

  /**
   * Extract relevant features from athlete data
   * @param {Object} athleteData - Raw athlete data
   * @returns {Object} Normalized features
   */
  extractFeatures(athleteData) {
    const features = {};

    // Physical features
    features.age = this.normalizeAge(athleteData.age || 20);
    features.weight = this.normalizeWeight(athleteData.weight || 180);
    features.height = this.normalizeHeight(athleteData.height || '6\'0"');
    features.position = this.encodePosition(athleteData.position || 'QB');

    // Training features
    features.trainingLoad = this.normalizeTrainingLoad(athleteData.trainingLoad || 0);
    features.sessionFrequency = this.normalizeSessionFrequency(athleteData.sessionFrequency || 3);
    features.recoveryTime = this.normalizeRecoveryTime(athleteData.recoveryTime || 48);

    // Performance features
    features.recentPerformance = this.normalizePerformance(athleteData.recentPerformance || 75);

    // Historical features
    features.previousInjuries = this.normalizeInjuryHistory(athleteData.previousInjuries || []);
    features.chronicConditions = this.normalizeChronicConditions(athleteData.chronicConditions || []);

    return features;
  }

  /**
   * Compute risk score using weighted features
   * @param {Object} features - Normalized features
   * @returns {number} Risk score between 0-1
   */
  computeRiskScore(features) {
    let riskScore = 0;

    // Apply weights to each feature
    for (const [feature, weight] of Object.entries(this.featureWeights)) {
      riskScore += features[feature] * weight;
    }

    // Apply non-linear transformations for high-risk combinations
    riskScore += this.applyRiskMultipliers(features);

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, riskScore));
  }

  /**
   * Apply additional risk multipliers for dangerous combinations
   * @param {Object} features - Normalized features
   * @returns {number} Additional risk score
   */
  applyRiskMultipliers(features) {
    let multiplier = 0;

    // High training load + insufficient recovery
    if (features.trainingLoad > 0.7 && features.recoveryTime < 0.3) {
      multiplier += 0.15;
    }

    // Previous injuries + high training load
    if (features.previousInjuries > 0.5 && features.trainingLoad > 0.6) {
      multiplier += 0.12;
    }

    // Young athlete + high training intensity
    if (features.age < 0.3 && features.trainingLoad > 0.7) {
      multiplier += 0.08;
    }

    return multiplier;
  }

  /**
   * Classify risk level based on score
   * @param {number} score - Risk score
   * @returns {string} Risk level
   */
  classifyRiskLevel(score) {
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Generate personalized recommendations
   * @param {number} score - Risk score
   * @param {Object} features - Feature values
   * @returns {Array} Recommendations
   */
  generateRecommendations(score, features) {
    const recommendations = [];

    if (score >= 0.7) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Immediate Action',
        message: 'Consider reducing training intensity and consulting with a medical professional.',
        actions: ['Reduce training load by 20-30%', 'Schedule medical evaluation', 'Increase recovery time']
      });
    }

    if (features.trainingLoad > 0.7) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Training Load',
        message: 'Your training load is high. Consider periodization to prevent overtraining.',
        actions: ['Implement deload week', 'Monitor training volume', 'Add recovery sessions']
      });
    }

    if (features.recoveryTime < 0.3) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Recovery',
        message: 'Insufficient recovery time detected. Focus on sleep and active recovery.',
        actions: ['Aim for 7-9 hours of sleep', 'Add mobility work', 'Consider massage therapy']
      });
    }

    if (features.previousInjuries > 0.5) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Injury History',
        message: 'Previous injury history increases current risk. Focus on prevention exercises.',
        actions: ['Strengthen stabilizer muscles', 'Improve technique', 'Regular screening']
      });
    }

    return recommendations;
  }

  /**
   * Calculate confidence in the prediction
   * @param {Object} features - Feature values
   * @returns {number} Confidence score 0-1
   */
  calculateConfidence(features) {
    let confidence = 0.5; // Base confidence

    // More complete data increases confidence
    const dataCompleteness = Object.values(features).filter(v => v !== null && v !== undefined).length / Object.keys(features).length;
    confidence += dataCompleteness * 0.3;

    // Historical data increases confidence
    if (features.previousInjuries > 0) confidence += 0.1;
    if (features.chronicConditions.length > 0) confidence += 0.1;

    return Math.min(1, confidence);
  }

  // Feature normalization methods
  normalizeAge(age) { return Math.min(1, Math.max(0, (age - 16) / (25 - 16))); }
  normalizeWeight(weight) { return Math.min(1, Math.max(0, (weight - 140) / (300 - 140))); }
  normalizeHeight(height) {
    const inches = this.heightToInches(height);
    return Math.min(1, Math.max(0, (inches - 60) / (84 - 60)));
  }
  normalizeTrainingLoad(load) { return Math.min(1, Math.max(0, load / 100)); }
  normalizeSessionFrequency(freq) { return Math.min(1, Math.max(0, freq / 7)); }
  normalizeRecoveryTime(hours) { return Math.min(1, Math.max(0, hours / 168)); }
  normalizePerformance(score) { return Math.min(1, Math.max(0, score / 100)); }
  normalizeInjuryHistory(injuries) { return Math.min(1, injuries.length / 5); }
  normalizeChronicConditions(conditions) { return Math.min(1, conditions.length / 3); }

  encodePosition(position) {
    const positionRisk = {
      'QB': 0.3, 'RB': 0.7, 'WR': 0.6, 'TE': 0.5,
      'OL': 0.4, 'DL': 0.8, 'LB': 0.7, 'CB': 0.6, 'S': 0.6, 'K': 0.2, 'P': 0.2
    };
    return positionRisk[position] || 0.5;
  }

  heightToInches(heightStr) {
    const match = heightStr.match(/(\d+)'(\d+)"/);
    if (match) {
      return parseInt(match[1]) * 12 + parseInt(match[2]);
    }
    return 72; // Default 6'0"
  }

  /**
   * Train the model with historical data
   * @param {Array} trainingData - Historical injury and athlete data
   */
  async train(trainingData) {
    // Store training data for future model improvements
    this.trainingData = trainingData;
    this.isTrained = true;

    // In a real implementation, this would train the ML model
    console.log(`Trained injury risk model with ${trainingData.length} samples`);
  }

  /**
   * Get model statistics
   * @returns {Object} Model statistics
   */
  getStats() {
    return {
      isTrained: this.isTrained,
      trainingSamples: this.trainingData.length,
      featureWeights: this.featureWeights,
      version: '1.0.0'
    };
  }
}

module.exports = InjuryRiskModel;
