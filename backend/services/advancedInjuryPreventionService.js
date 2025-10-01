// Advanced Injury Prevention Service
// Enhanced injury risk assessment with computer vision and rehabilitation planning

const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Models
const InjuryRisk = require('../models/injuryModel');
const Athlete = require('../models/playerModel');
const TrainingSession = require('../models/trainingSessionModel');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

class AdvancedInjuryPreventionService {
  constructor() {
    this.visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    this.textModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Analyze movement patterns using computer vision
   * @param {Buffer} imageBuffer - Image buffer of athlete movement
   * @param {Object} metadata - Movement metadata (exercise type, angle, etc.)
   * @returns {Object} Analysis results
   */
  async analyzeMovementPattern(imageBuffer, metadata = {}) {
    try {
      // Process image for better analysis
      const processedImage = await this.preprocessImage(imageBuffer);

      // Create vision prompt for movement analysis
      const prompt = this.createMovementAnalysisPrompt(metadata);

      // Analyze with Google Vision AI
      const result = await this.visionModel.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: processedImage.toString('base64')
          }
        }
      ]);

      const analysis = result.response.text();
      const parsedAnalysis = this.parseMovementAnalysis(analysis);

      // Store analysis results
      await this.storeMovementAnalysis(parsedAnalysis, metadata);

      return {
        success: true,
        analysis: parsedAnalysis,
        recommendations: await this.generateRecommendations(parsedAnalysis),
        riskLevel: this.calculateRiskLevel(parsedAnalysis)
      };

    } catch (error) {
      console.error('Error analyzing movement pattern:', error);
      throw new Error(`Movement analysis failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better AI analysis
   */
  async preprocessImage(imageBuffer) {
    try {
      // Resize and enhance image for better analysis
      const processed = await sharp(imageBuffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 90,
          progressive: true
        })
        .toBuffer();

      return processed;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      return imageBuffer; // Return original if processing fails
    }
  }

  /**
   * Create detailed prompt for movement analysis
   */
  createMovementAnalysisPrompt(metadata) {
    const { exerciseType, bodyPart, angle, athleteLevel } = metadata;

    return `You are an expert sports medicine physician and biomechanics specialist. Analyze this athlete's movement pattern for injury risk assessment.

Exercise: ${exerciseType || 'Unknown exercise'}
Target Body Part: ${bodyPart || 'General movement'}
Camera Angle: ${angle || 'Standard view'}
Athlete Level: ${athleteLevel || 'Intermediate'}

Please analyze:
1. FORM QUALITY: Assess overall technique quality (Excellent/Good/Fair/Poor)
2. BIOMECHANICAL ISSUES: Identify any improper joint alignment, muscle imbalances, or movement compensations
3. INJURY RISK FACTORS: Flag high-risk movement patterns that could lead to injury
4. SPECIFIC CORRECTIONS: Provide detailed technical corrections
5. PREVENTION STRATEGIES: Suggest exercises or modifications to prevent injury

Format your response as a structured analysis with clear sections. Be specific and actionable in your recommendations.`;
  }

  /**
   * Parse AI analysis response into structured data
   */
  parseMovementAnalysis(analysisText) {
    // Extract key information from AI response
    const analysis = {
      timestamp: new Date(),
      formQuality: this.extractFormQuality(analysisText),
      biomechanicalIssues: this.extractBiomechanicalIssues(analysisText),
      injuryRiskFactors: this.extractInjuryRisks(analysisText),
      corrections: this.extractCorrections(analysisText),
      preventionStrategies: this.extractPreventionStrategies(analysisText),
      confidence: this.calculateConfidence(analysisText)
    };

    return analysis;
  }

  /**
   * Extract form quality rating
   */
  extractFormQuality(text) {
    const qualityMatch = text.match(/FORM QUALITY:?\s*(Excellent|Good|Fair|Poor)/i);
    if (qualityMatch) {
      return qualityMatch[1].toLowerCase();
    }

    // Fallback: look for quality indicators
    if (text.toLowerCase().includes('excellent')) return 'excellent';
    if (text.toLowerCase().includes('good')) return 'good';
    if (text.toLowerCase().includes('fair')) return 'fair';
    if (text.toLowerCase().includes('poor')) return 'poor';

    return 'unknown';
  }

  /**
   * Extract biomechanical issues
   */
  extractBiomechanicalIssues(text) {
    const issues = [];
    const issuePatterns = [
      /joint alignment/gi,
      /muscle imbalance/gi,
      /compensation/gi,
      /asymmetry/gi,
      /posture/gi,
      /kinetics/gi,
      /kinematics/gi
    ];

    issuePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        issues.push(...matches);
      }
    });

    return [...new Set(issues)]; // Remove duplicates
  }

  /**
   * Extract injury risk factors
   */
  extractInjuryRisks(text) {
    const risks = [];
    const riskKeywords = [
      'high risk', 'injury risk', 'potential injury', 'risk factor',
      'dangerous', 'hazardous', 'unsafe', 'improper'
    ];

    riskKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        // Extract sentence containing the risk
        const sentences = text.split(/[.!?]+/);
        const riskSentence = sentences.find(s => s.toLowerCase().includes(keyword));
        if (riskSentence) {
          risks.push(riskSentence.trim());
        }
      }
    });

    return risks;
  }

  /**
   * Extract technical corrections
   */
  extractCorrections(text) {
    const corrections = [];
    const correctionPatterns = [
      /correction/gi,
      /fix/gi,
      /adjust/gi,
      /modify/gi,
      /improve/gi
    ];

    correctionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        corrections.push(...matches);
      }
    });

    return [...new Set(corrections)];
  }

  /**
   * Extract prevention strategies
   */
  extractPreventionStrategies(text) {
    const strategies = [];
    const strategyPatterns = [
      /prevention/gi,
      /strengthen/gi,
      /stretch/gi,
      /warm.up/gi,
      /cool.down/gi,
      /recovery/gi
    ];

    strategyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        strategies.push(...matches);
      }
    });

    return [...new Set(strategies)];
  }

  /**
   * Calculate confidence score for analysis
   */
  calculateConfidence(text) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on detailed analysis
    if (text.length > 500) confidence += 0.2;
    if (text.includes('biomechanical') || text.includes('kinematic')) confidence += 0.1;
    if (text.includes('specific correction') || text.includes('recommendation')) confidence += 0.1;
    if (text.includes('prevention') || text.includes('risk')) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Store movement analysis results
   */
  async storeMovementAnalysis(analysis, metadata) {
    try {
      const analysisDoc = new InjuryRisk({
        athleteId: metadata.athleteId,
        analysisType: 'movement_pattern',
        data: {
          ...analysis,
          metadata
        },
        riskLevel: this.calculateRiskLevel(analysis),
        recommendations: await this.generateRecommendations(analysis),
        createdAt: new Date()
      });

      await analysisDoc.save();
    } catch (error) {
      console.error('Error storing movement analysis:', error);
    }
  }

  /**
   * Calculate overall risk level
   */
  calculateRiskLevel(analysis) {
    let riskScore = 0;

    // Form quality scoring
    switch (analysis.formQuality) {
      case 'excellent': riskScore += 1; break;
      case 'good': riskScore += 2; break;
      case 'fair': riskScore += 3; break;
      case 'poor': riskScore += 4; break;
      default: riskScore += 2.5;
    }

    // Biomechanical issues
    riskScore += analysis.biomechanicalIssues.length * 0.5;

    // Injury risk factors
    riskScore += analysis.injuryRiskFactors.length * 1;

    // Normalize to 1-5 scale
    const normalizedRisk = Math.min(Math.max(riskScore / 2, 1), 5);

    if (normalizedRisk <= 2) return 'low';
    if (normalizedRisk <= 3.5) return 'moderate';
    return 'high';
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(analysis) {
    try {
      const prompt = `Based on this movement analysis, generate 3-5 specific, actionable recommendations for injury prevention and performance improvement:

Analysis Summary:
- Form Quality: ${analysis.formQuality}
- Biomechanical Issues: ${analysis.biomechanicalIssues.join(', ')}
- Injury Risk Factors: ${analysis.injuryRiskFactors.join(', ')}
- Risk Level: ${this.calculateRiskLevel(analysis)}

Provide recommendations that include:
1. Immediate corrections for the current session
2. Long-term strengthening exercises
3. Flexibility and mobility work
4. Recovery and monitoring strategies

Format as a numbered list with clear, specific instructions.`;

      const result = await this.textModel.generateContent(prompt);
      const recommendations = result.response.text();

      return this.parseRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return ['Consult with a qualified trainer for personalized assessment'];
    }
  }

  /**
   * Parse AI-generated recommendations
   */
  parseRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\d+\./) || trimmed.match(/^[•\-*]/)) {
        recommendations.push(trimmed.replace(/^\d+\.\s*|^[•\-*]\s*/, ''));
      }
    });

    return recommendations.length > 0 ? recommendations : [text];
  }

  /**
   * Create rehabilitation plan for identified issues
   * @param {String} athleteId - Athlete ID
   * @param {Array} injuryRisks - Identified injury risks
   * @returns {Object} Rehabilitation plan
   */
  async createRehabilitationPlan(athleteId, injuryRisks) {
    try {
      const athlete = await Athlete.findById(athleteId);
      if (!athlete) {
        throw new Error('Athlete not found');
      }

      // Analyze injury patterns
      const injuryPatterns = await this.analyzeInjuryPatterns(athleteId);

      // Generate comprehensive rehab plan
      const rehabPlan = {
        athleteId,
        createdAt: new Date(),
        phases: await this.generateRehabPhases(injuryRisks, injuryPatterns, athlete),
        monitoring: this.createMonitoringPlan(),
        progressTracking: this.createProgressTracking()
      };

      return rehabPlan;
    } catch (error) {
      console.error('Error creating rehabilitation plan:', error);
      throw error;
    }
  }

  /**
   * Analyze historical injury patterns
   */
  async analyzeInjuryPatterns(athleteId) {
    try {
      const injuryHistory = await InjuryRisk.find({ athleteId })
        .sort({ createdAt: -1 })
        .limit(20);

      const patterns = {
        commonInjuries: [],
        recurringIssues: [],
        seasonalPatterns: [],
        trainingLoadCorrelation: []
      };

      // Analyze patterns (simplified version)
      const injuryTypes = injuryHistory.map(record => record.data?.injuryType).filter(Boolean);
      patterns.commonInjuries = [...new Set(injuryTypes)];

      return patterns;
    } catch (error) {
      console.error('Error analyzing injury patterns:', error);
      return {};
    }
  }

  /**
   * Generate rehabilitation phases
   */
  async generateRehabPhases(injuryRisks, patterns, athlete) {
    const phases = [];

    // Phase 1: Acute Management (Days 1-3)
    phases.push({
      name: 'Acute Management',
      duration: '3 days',
      focus: 'Reduce inflammation and pain',
      exercises: [
        'RICE protocol (Rest, Ice, Compression, Elevation)',
        'Gentle range of motion exercises',
        'Isometric contractions at 50% effort'
      ],
      precautions: [
        'Avoid aggravating activities',
        'Monitor swelling and pain levels',
        'Use supportive devices as needed'
      ]
    });

    // Phase 2: Recovery and Mobility (Days 4-14)
    phases.push({
      name: 'Recovery and Mobility',
      duration: '10 days',
      focus: 'Restore range of motion and reduce pain',
      exercises: [
        'Active assisted range of motion',
        'Light stretching and mobility work',
        'Proprioception exercises',
        'Core stability exercises'
      ],
      precautions: [
        'Progress slowly based on pain levels',
        'Maintain cardiovascular fitness with low-impact activities'
      ]
    });

    // Phase 3: Strength Building (Weeks 3-6)
    phases.push({
      name: 'Strength Building',
      duration: '3-4 weeks',
      focus: 'Build strength and power',
      exercises: [
        'Progressive resistance training',
        'Functional movement patterns',
        'Sport-specific drills at 70-80% intensity',
        'Balance and stability training'
      ],
      precautions: [
        'Ensure proper form before increasing intensity',
        'Monitor for compensatory movement patterns'
      ]
    });

    // Phase 4: Return to Play (Weeks 7-12)
    phases.push({
      name: 'Return to Play',
      duration: '4-6 weeks',
      focus: 'Gradual return to full activity',
      exercises: [
        'Full sport-specific training',
        'High-intensity interval training',
        'Contact/agility drills',
        'Performance testing'
      ],
      precautions: [
        'Follow return-to-play protocol',
        'Have medical clearance before full return'
      ]
    });

    return phases;
  }

  /**
   * Create monitoring plan
   */
  createMonitoringPlan() {
    return {
      frequency: 'daily',
      metrics: [
        'Pain levels (0-10 scale)',
        'Range of motion measurements',
        'Strength testing results',
        'Functional movement assessments',
        'Swelling and inflammation markers'
      ],
      redFlags: [
        'Increased pain with activity',
        'Significant swelling',
        'Loss of function',
        'Systemic symptoms (fever, etc.)'
      ],
      checkIns: [
        'Daily self-assessment',
        'Weekly professional evaluation',
        'Bi-weekly progress testing'
      ]
    };
  }

  /**
   * Create progress tracking system
   */
  createProgressTracking() {
    return {
      milestones: [
        'Pain-free range of motion',
        'Return to light activity',
        'Sport-specific training clearance',
        'Full return to competition'
      ],
      assessments: [
        'Functional movement screen',
        'Strength testing',
        'Performance metrics',
        'Psychological readiness'
      ],
      successCriteria: [
        'No pain with activity',
        'Full strength recovery (90%+ of uninjured side)',
        'Successful completion of return-to-play protocol',
        'Medical clearance for full activity'
      ]
    };
  }

  /**
   * Generate preventive training program
   * @param {String} athleteId - Athlete ID
   * @param {Array} riskFactors - Identified risk factors
   * @returns {Object} Preventive training program
   */
  async generatePreventiveProgram(athleteId, riskFactors) {
    try {
      const athlete = await Athlete.findById(athleteId);
      if (!athlete) {
        throw new Error('Athlete not found');
      }

      const program = {
        athleteId,
        createdAt: new Date(),
        duration: '12 weeks',
        focus: 'Injury prevention and performance enhancement',
        sessionsPerWeek: 3,
        components: await this.generateProgramComponents(riskFactors, athlete),
        progression: this.createProgressionPlan(),
        monitoring: this.createProgramMonitoring()
      };

      return program;
    } catch (error) {
      console.error('Error generating preventive program:', error);
      throw error;
    }
  }

  /**
   * Generate program components based on risk factors
   */
  async generateProgramComponents(riskFactors, athlete) {
    const components = {
      warmUp: [],
      mainExercises: [],
      coolDown: [],
      mobility: []
    };

    // Base components for all athletes
    components.warmUp = [
      'Dynamic stretching (5-10 minutes)',
      'Light cardio activation',
      'Joint mobility exercises'
    ];

    components.coolDown = [
      'Static stretching (5-10 minutes)',
      'Foam rolling or self-massage',
      'Deep breathing and relaxation'
    ];

    // Risk-factor specific exercises
    riskFactors.forEach(risk => {
      if (risk.toLowerCase().includes('knee')) {
        components.mainExercises.push(
          'Single-leg balance exercises',
          'Hamstring strengthening',
          'Quadriceps strengthening',
          'Hip stability work'
        );
        components.mobility.push('Hip flexor stretches', 'IT band release');
      }

      if (risk.toLowerCase().includes('shoulder')) {
        components.mainExercises.push(
          'Rotator cuff strengthening',
          'Scapular stabilization',
          'Postural correction exercises'
        );
        components.mobility.push('Shoulder stretches', 'Chest opener stretches');
      }

      if (risk.toLowerCase().includes('back') || risk.toLowerCase().includes('spine')) {
        components.mainExercises.push(
          'Core stability exercises',
          'Dead bug variations',
          'Bird-dog exercises',
          'Plank progressions'
        );
        components.mobility.push('Cat-cow stretches', 'Child\'s pose');
      }
    });

    // Sport-specific additions
    if (athlete.sport) {
      switch (athlete.sport.toLowerCase()) {
        case 'football':
          components.mainExercises.push(
            'Agility ladder drills',
            'Change of direction training',
            'Contact simulation drills'
          );
          break;
        case 'basketball':
          components.mainExercises.push(
            'Jump landing mechanics',
            'Cutting and pivoting drills',
            'Upper body strength for rebounding'
          );
          break;
        case 'soccer':
          components.mainExercises.push(
            'Cutting and turning drills',
            'Heading technique work',
            'Balance and stability training'
          );
          break;
      }
    }

    return components;
  }

  /**
   * Create progression plan
   */
  createProgressionPlan() {
    return {
      weeks1_4: {
        focus: 'Foundation building',
        intensity: '60-70% max effort',
        volume: '2-3 sets of 10-15 reps',
        frequency: '3x per week'
      },
      weeks5_8: {
        focus: 'Strength development',
        intensity: '70-80% max effort',
        volume: '3-4 sets of 8-12 reps',
        frequency: '3x per week'
      },
      weeks9_12: {
        focus: 'Power and sport-specific',
        intensity: '80-90% max effort',
        volume: '3-4 sets of 6-10 reps',
        frequency: '3x per week'
      }
    };
  }

  /**
   * Create program monitoring
   */
  createProgramMonitoring() {
    return {
      checkIns: 'Weekly progress assessments',
      adjustments: 'Based on form quality and recovery',
      successMetrics: [
        'Improved movement quality scores',
        'Reduced injury risk factors',
        'Enhanced performance metrics',
        'Better recovery patterns'
      ],
      modificationTriggers: [
        'Persistent pain or discomfort',
        'Poor exercise form',
        'Inadequate recovery',
        'Changes in training load'
      ]
    };
  }

  /**
   * Analyze training load and recovery needs
   * @param {String} athleteId - Athlete ID
   * @param {Array} recentSessions - Recent training sessions
   * @returns {Object} Load analysis and recovery recommendations
   */
  async analyzeTrainingLoad(athleteId, recentSessions) {
    try {
      const analysis = {
        currentLoad: this.calculateTrainingLoad(recentSessions),
        loadTrend: this.analyzeLoadTrend(recentSessions),
        recoveryNeeds: await this.assessRecoveryNeeds(athleteId, recentSessions),
        recommendations: []
      };

      // Generate recommendations based on analysis
      analysis.recommendations = this.generateLoadRecommendations(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing training load:', error);
      throw error;
    }
  }

  /**
   * Calculate acute and chronic training load
   */
  calculateTrainingLoad(sessions) {
    const now = new Date();
    const acutePeriod = 7; // 7 days
    const chronicPeriod = 28; // 28 days

    const acuteSessions = sessions.filter(session => {
      const daysDiff = (now - new Date(session.date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= acutePeriod;
    });

    const chronicSessions = sessions.filter(session => {
      const daysDiff = (now - new Date(session.date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= chronicPeriod;
    });

    const acuteLoad = acuteSessions.reduce((sum, session) => sum + (session.trainingLoad || 0), 0);
    const chronicLoad = chronicSessions.reduce((sum, session) => sum + (session.trainingLoad || 0), 0) / 4; // Average weekly load

    return {
      acute: acuteLoad,
      chronic: chronicLoad,
      ratio: chronicLoad > 0 ? acuteLoad / chronicLoad : 0
    };
  }

  /**
   * Analyze load trend over time
   */
  analyzeLoadTrend(sessions) {
    if (sessions.length < 7) return 'insufficient_data';

    const sortedSessions = sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const recent = sortedSessions.slice(-7);
    const previous = sortedSessions.slice(-14, -7);

    const recentAvg = recent.reduce((sum, s) => sum + (s.trainingLoad || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, s) => sum + (s.trainingLoad || 0), 0) / previous.length;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (change > 20) return 'sharp_increase';
    if (change > 10) return 'moderate_increase';
    if (change < -20) return 'sharp_decrease';
    if (change < -10) return 'moderate_decrease';
    return 'stable';
  }

  /**
   * Assess recovery needs
   */
  async assessRecoveryNeeds(athleteId, sessions) {
    const load = this.calculateTrainingLoad(sessions);

    let recoveryLevel = 'normal';

    if (load.ratio > 1.5) recoveryLevel = 'high';
    else if (load.ratio > 1.2) recoveryLevel = 'moderate';
    else if (load.ratio < 0.8) recoveryLevel = 'low';

    return {
      level: recoveryLevel,
      strategies: this.getRecoveryStrategies(recoveryLevel),
      duration: this.getRecoveryDuration(recoveryLevel)
    };
  }

  /**
   * Get recovery strategies based on needs
   */
  getRecoveryStrategies(level) {
    const strategies = {
      high: [
        'Extended rest periods between sessions',
        'Active recovery activities (light walking, swimming)',
        'Increased sleep duration (9-10 hours/night)',
        'Nutrition focus on recovery (protein, carbs, anti-inflammatory foods)',
        'Professional recovery modalities (massage, cryotherapy)',
        'Reduced training volume for 1-2 weeks'
      ],
      moderate: [
        'Additional rest days',
        'Light recovery sessions between intense workouts',
        'Sleep optimization (8-9 hours/night)',
        'Balanced nutrition with emphasis on recovery',
        'Mobility and flexibility work',
        'Monitor fatigue levels closely'
      ],
      normal: [
        'Standard recovery protocols',
        'Adequate sleep (7-8 hours/night)',
        'Proper nutrition and hydration',
        'Regular mobility work',
        'Listen to body signals'
      ],
      low: [
        'Consider increasing training intensity gradually',
        'Ensure adequate nutrition for performance',
        'Monitor for overtraining signs',
        'Include deload weeks every 4-6 weeks'
      ]
    };

    return strategies[level] || strategies.normal;
  }

  /**
   * Get recovery duration
   */
  getRecoveryDuration(level) {
    const durations = {
      high: '2-4 weeks',
      moderate: '1-2 weeks',
      normal: 'standard',
      low: 'monitor and adjust'
    };

    return durations[level] || 'standard';
  }

  /**
   * Generate load-based recommendations
   */
  generateLoadRecommendations(analysis) {
    const recommendations = [];

    const { currentLoad, loadTrend, recoveryNeeds } = analysis;

    // Load ratio recommendations
    if (currentLoad.ratio > 1.5) {
      recommendations.push('High training load detected - consider reducing volume by 20-30%');
      recommendations.push('Increase recovery time between sessions');
    } else if (currentLoad.ratio > 1.2) {
      recommendations.push('Moderate training load - monitor fatigue levels closely');
    }

    // Trend-based recommendations
    switch (loadTrend) {
      case 'sharp_increase':
        recommendations.push('Sharp load increase detected - allow adequate adaptation time');
        break;
      case 'sharp_decrease':
        recommendations.push('Significant load reduction - gradually increase to avoid detraining');
        break;
    }

    // Recovery recommendations
    if (recoveryNeeds.level === 'high') {
      recommendations.push('High recovery needs - prioritize rest and recovery modalities');
    }

    return recommendations;
  }
}

module.exports = AdvancedInjuryPreventionService;