// Advanced AI-Powered Personalization Engine for AthleteAI
// Implements machine learning algorithms for adaptive training programs,
// nutrition plans, and coaching advice based on individual athlete data

const mongoose = require('mongoose');
const PerformancePredictionModel = require('./performancePredictionModel');
const TrainingProgramsService = require('./trainingProgramsService');

class PersonalizationEngine {
  constructor() {
    this.performanceModel = new PerformancePredictionModel();
    this.trainingService = new TrainingProgramsService();
    this.athleteProfiles = new Map();
    this.personalizationModels = new Map();
    this.geneticFactors = new Map();
    this.adaptiveWeights = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the personalization engine
   */
  async initialize() {
    try {
      console.log('Initializing Advanced Personalization Engine...');

      // Initialize training service
      await this.trainingService.initialize();

      // Load athlete profiles and genetic data
      await this.loadAthleteProfiles();

      // Initialize adaptive learning models
      this.initializeAdaptiveModels();

      this.isInitialized = true;
      console.log('Personalization Engine initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Personalization Engine:', error);
      throw error;
    }
  }

  /**
   * Load athlete profiles and genetic data from database
   */
  async loadAthleteProfiles() {
    try {
      // This would load from MongoDB in a real implementation
      // For now, we'll initialize with sample data structure
      console.log('Loading athlete profiles and genetic data...');

      // Sample genetic factors that influence performance
      this.geneticFactors.set('endurance', {
        ACTN3: { rr: 1.0, rx: 0.8, xx: 0.6 }, // Sprint performance gene
        ACE: { ii: 1.0, id: 0.8, dd: 0.6 },   // Endurance gene
        PPARA: { gg: 1.0, ga: 0.8, aa: 0.6 }  // Fat metabolism gene
      });

      this.geneticFactors.set('strength', {
        MSTN: { aa: 1.0, ag: 0.8, gg: 0.6 },  // Myostatin gene
        COL5A1: { cc: 1.0, ct: 0.8, tt: 0.6 }  // Tendon strength gene
      });

    } catch (error) {
      console.error('Error loading athlete profiles:', error);
    }
  }

  /**
   * Initialize adaptive learning models for each athlete
   */
  initializeAdaptiveModels() {
    // Initialize reinforcement learning models for adaptive training
    this.adaptiveWeights.set('default', {
      trainingConsistency: 0.25,
      trainingLoad: 0.20,
      recoveryQuality: 0.15,
      skillDevelopment: 0.15,
      motivation: 0.10,
      stress: 0.08,
      competitionLevel: 0.07
    });
  }

  /**
   * Generate personalized training program for an athlete
   * @param {string} athleteId - Athlete ID
   * @param {Object} athleteData - Athlete's data and preferences
   * @returns {Object} Personalized training program
   */
  async generatePersonalizedProgram(athleteId, athleteData) {
    try {
      // Analyze athlete's genetic profile
      const geneticProfile = this.analyzeGeneticFactors(athleteData.genetics || {});

      // Assess current fitness level and goals
      const fitnessAssessment = await this.assessFitnessLevel(athleteId, athleteData);

      // Generate adaptive training program
      const program = await this.createAdaptiveProgram(athleteId, {
        ...athleteData,
        geneticProfile,
        fitnessAssessment
      });

      // Generate nutrition plan
      const nutritionPlan = this.generateNutritionPlan(athleteData, geneticProfile);

      // Generate coaching advice
      const coachingAdvice = this.generatePersonalizedCoaching(athleteData, fitnessAssessment);

      return {
        athleteId,
        trainingProgram: program,
        nutritionPlan,
        coachingAdvice,
        geneticInsights: geneticProfile,
        adaptationFactors: this.getAdaptationFactors(athleteId),
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error generating personalized program:', error);
      throw error;
    }
  }

  /**
   * Analyze genetic factors influencing performance
   * @param {Object} genetics - Athlete's genetic data
   * @returns {Object} Genetic profile analysis
   */
  analyzeGeneticFactors(genetics) {
    const profile = {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      performanceModifiers: {}
    };

    // Analyze endurance genes
    if (genetics.ACTN3) {
      const actn3 = genetics.ACTN3.toLowerCase();
      if (actn3 === 'rr') {
        profile.strengths.push('Sprint performance');
        profile.performanceModifiers.sprintPower = 1.2;
      } else if (actn3 === 'rx') {
        profile.performanceModifiers.sprintPower = 1.0;
      } else {
        profile.weaknesses.push('Sprint performance');
        profile.performanceModifiers.sprintPower = 0.8;
      }
    }

    // Analyze strength genes
    if (genetics.MSTN) {
      const mstn = genetics.MSTN.toLowerCase();
      if (mstn === 'aa') {
        profile.weaknesses.push('Muscle building potential');
        profile.performanceModifiers.strengthGain = 0.8;
      } else {
        profile.strengths.push('Muscle building potential');
        profile.performanceModifiers.strengthGain = 1.1;
      }
    }

    // Generate recommendations based on genetics
    if (profile.strengths.includes('Sprint performance')) {
      profile.recommendations.push('Focus on high-intensity interval training');
    }

    if (profile.weaknesses.includes('Muscle building potential')) {
      profile.recommendations.push('Emphasize progressive overload and recovery');

    }

    return profile;
  }

  /**
   * Assess athlete's current fitness level
   * @param {string} athleteId - Athlete ID
   * @param {Object} athleteData - Athlete data
   * @returns {Object} Fitness assessment
   */
  async assessFitnessLevel(athleteId, athleteData) {
    // Use performance prediction model to assess current level
    const prediction = await this.performanceModel.predictPerformance(athleteData);

    return {
      currentLevel: this.calculateFitnessLevel(athleteData),
      predictedProgression: prediction,
      limitingFactors: this.identifyLimitingFactors(athleteData),
      improvementAreas: this.identifyImprovementAreas(athleteData)
    };
  }

  /**
   * Create adaptive training program
   * @param {string} athleteId - Athlete ID
   * @param {Object} profile - Athlete profile with genetic and fitness data
   * @returns {Object} Adaptive training program
   */
  async createAdaptiveProgram(athleteId, profile) {
    // Get base program from training service
    const baseProgram = await this.trainingService.generateProgram({
      sport: profile.sport || 'football',
      level: profile.fitnessAssessment?.currentLevel || 'intermediate',
      goals: profile.goals || ['strength', 'endurance'],
      duration: profile.programDuration || 12 // weeks
    });

    // Adapt program based on genetic profile and performance data
    const adaptedProgram = this.adaptProgramToGenetics(baseProgram, profile.geneticProfile);

    // Apply reinforcement learning adjustments
    const reinforcedProgram = this.applyReinforcementLearning(athleteId, adaptedProgram, profile);

    return reinforcedProgram;
  }

  /**
   * Adapt program based on genetic factors
   * @param {Object} program - Base training program
   * @param {Object} geneticProfile - Genetic analysis
   * @returns {Object} Adapted program
   */
  adaptProgramToGenetics(program, geneticProfile) {
    const adaptedProgram = { ...program };

    // Adjust based on genetic modifiers
    if (geneticProfile.performanceModifiers) {
      adaptedProgram.phases = adaptedProgram.phases.map(phase => ({
        ...phase,
        sessions: phase.sessions.map(session => ({
          ...session,
          exercises: session.exercises.map(exercise => {
            let adjustedExercise = { ...exercise };

            // Adjust sprint work based on ACTN3 gene
            if (exercise.type === 'sprint' && geneticProfile.performanceModifiers.sprintPower) {
              adjustedExercise.intensity *= geneticProfile.performanceModifiers.sprintPower;
              adjustedExercise.volume *= (geneticProfile.performanceModifiers.sprintPower > 1 ? 1.1 : 0.9);
            }

            // Adjust strength work based on MSTN gene
            if (exercise.type === 'strength' && geneticProfile.performanceModifiers.strengthGain) {
              adjustedExercise.sets = Math.round(adjustedExercise.sets * geneticProfile.performanceModifiers.strengthGain);
              adjustedExercise.reps = Math.round(adjustedExercise.reps / geneticProfile.performanceModifiers.strengthGain);
            }

            return adjustedExercise;
          })
        }))
      }));
    }

    return adaptedProgram;
  }

  /**
   * Apply reinforcement learning to adapt program based on past performance
   * @param {string} athleteId - Athlete ID
   * @param {Object} program - Training program
   * @param {Object} profile - Athlete profile
   * @returns {Object} Reinforced program
   */
  applyReinforcementLearning(athleteId, program, profile) {
    // Get athlete's adaptation history
    const history = this.athleteProfiles.get(athleteId)?.adaptationHistory || [];

    if (history.length === 0) {
      return program; // Return unchanged if no history
    }

    // Analyze what worked and what didn't
    const successfulAdaptations = history.filter(h => h.outcome === 'positive');
    const unsuccessfulAdaptations = history.filter(h => h.outcome === 'negative');

    // Adjust program based on learning
    let adjustedProgram = { ...program };

    // If athlete responds well to higher volume, increase it
    if (successfulAdaptations.some(a => a.type === 'volume_increase')) {
      adjustedProgram = this.increaseProgramVolume(adjustedProgram, 1.1);
    }

    // If athlete gets injured with high intensity, reduce it
    if (unsuccessfulAdaptations.some(a => a.type === 'intensity_increase' && a.reason === 'injury')) {
      adjustedProgram = this.decreaseProgramIntensity(adjustedProgram, 0.9);
    }

    return adjustedProgram;
  }

  /**
   * Generate personalized nutrition plan
   * @param {Object} athleteData - Athlete data
   * @param {Object} geneticProfile - Genetic profile
   * @returns {Object} Nutrition plan
   */
  generateNutritionPlan(athleteData, geneticProfile) {
    const baseCalories = this.calculateBaseCalories(athleteData);
    const macroSplit = this.calculateMacroSplit(athleteData, geneticProfile);

    return {
      dailyCalories: baseCalories,
      macros: macroSplit,
      mealTiming: this.generateMealTiming(athleteData),
      supplementation: this.recommendSupplements(athleteData, geneticProfile),
      hydration: this.calculateHydrationNeeds(athleteData),
      geneticAdjustments: this.applyGeneticNutritionAdjustments(geneticProfile)
    };
  }

  /**
   * Generate personalized coaching advice
   * @param {Object} athleteData - Athlete data
   * @param {Object} fitnessAssessment - Fitness assessment
   * @returns {Array} Coaching advice
   */
  generatePersonalizedCoaching(athleteData, fitnessAssessment) {
    const advice = [];

    // Recovery-focused advice
    if (fitnessAssessment.limitingFactors.includes('recovery')) {
      advice.push({
        category: 'Recovery',
        priority: 'HIGH',
        message: 'Your recovery patterns are limiting performance gains.',
        actions: [
          'Prioritize 8-9 hours of sleep nightly',
          'Implement active recovery techniques',
          'Monitor HRV and fatigue levels'
        ]
      });
    }

    // Technique-focused advice
    if (fitnessAssessment.improvementAreas.includes('technique')) {
      advice.push({
        category: 'Technique',
        priority: 'MEDIUM',
        message: 'Focus on technical proficiency to maximize efficiency.',
        actions: [
          'Schedule regular technique sessions',
          'Use video analysis for form correction',
          'Work with a coach on specific drills'
        ]
      });
    }

    // Motivation and mental coaching
    advice.push({
      category: 'Mental Training',
      priority: 'MEDIUM',
      message: 'Mental resilience is key to consistent performance.',
      actions: [
        'Set process-oriented goals',
        'Practice visualization techniques',
        'Maintain a performance journal'
      ]
    });

    return advice;
  }

  /**
   * Update athlete profile with new data and learn from outcomes
   * @param {string} athleteId - Athlete ID
   * @param {Object} newData - New performance data
   * @param {Object} outcomes - Training outcomes
   */
  async updateAthleteProfile(athleteId, newData, outcomes) {
    // Store adaptation outcomes for reinforcement learning
    const profile = this.athleteProfiles.get(athleteId) || {
      adaptationHistory: [],
      performanceHistory: [],
      preferences: {}
    };

    // Record adaptation outcome
    if (outcomes.adaptation) {
      profile.adaptationHistory.push({
        ...outcomes.adaptation,
        timestamp: new Date()
      });
    }

    // Update performance history
    if (newData.performance) {
      profile.performanceHistory.push({
        ...newData.performance,
        timestamp: new Date()
      });
    }

    // Update adaptive weights based on outcomes
    this.updateAdaptiveWeights(athleteId, outcomes);

    this.athleteProfiles.set(athleteId, profile);
  }

  /**
   * Update adaptive weights using reinforcement learning
   * @param {string} athleteId - Athlete ID
   * @param {Object} outcomes - Training outcomes
   */
  updateAdaptiveWeights(athleteId, outcomes) {
    const currentWeights = this.adaptiveWeights.get(athleteId) || { ...this.adaptiveWeights.get('default') };

    // Simple reinforcement learning update
    if (outcomes.success) {
      // Slightly increase weights for factors that contributed to success
      Object.keys(currentWeights).forEach(factor => {
        if (outcomes.contributingFactors?.includes(factor)) {
          currentWeights[factor] = Math.min(0.4, currentWeights[factor] * 1.05);
        }
      });
    } else {
      // Slightly decrease weights for factors that contributed to failure
      Object.keys(currentWeights).forEach(factor => {
        if (outcomes.contributingFactors?.includes(factor)) {
          currentWeights[factor] = Math.max(0.05, currentWeights[factor] * 0.95);
        }
      });
    }

    // Normalize weights
    const total = Object.values(currentWeights).reduce((sum, w) => sum + w, 0);
    Object.keys(currentWeights).forEach(factor => {
      currentWeights[factor] /= total;
    });

    this.adaptiveWeights.set(athleteId, currentWeights);
  }

  // Helper methods
  calculateFitnessLevel(athleteData) {
    // Simple fitness level calculation
    const metrics = athleteData.metrics || {};
    const avgScore = (metrics.strength || 50) + (metrics.endurance || 50) + (metrics.speed || 50);
    return avgScore / 3;
  }

  identifyLimitingFactors(athleteData) {
    const factors = [];
    const metrics = athleteData.metrics || {};

    if ((metrics.recovery || 50) < 60) factors.push('recovery');
    if ((metrics.technique || 50) < 60) factors.push('technique');
    if ((metrics.nutrition || 50) < 60) factors.push('nutrition');

    return factors;
  }

  identifyImprovementAreas(athleteData) {
    const areas = [];
    const metrics = athleteData.metrics || {};

    if ((metrics.strength || 50) < 70) areas.push('strength');
    if ((metrics.endurance || 50) < 70) areas.push('endurance');
    if ((metrics.speed || 50) < 70) areas.push('speed');

    return areas;
  }

  calculateBaseCalories(athleteData) {
    // Basic BMR calculation (simplified)
    const weight = athleteData.weight || 70; // kg
    const height = athleteData.height || 175; // cm
    const age = athleteData.age || 20;
    const gender = athleteData.gender || 'male';

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'male' ? 5 : -161;

    // Activity multiplier for athletes
    const activityLevel = athleteData.activityLevel || 'moderate';
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    return Math.round(bmr * (multipliers[activityLevel] || 1.55));
  }

  calculateMacroSplit(athleteData, geneticProfile) {
    const sport = athleteData.sport || 'football';
    let protein = 1.6; // g/kg
    let carbs = 6; // g/kg
    let fat = 1.2; // g/kg

    // Adjust based on sport
    if (sport === 'football') {
      protein = 1.8;
      carbs = 7;
    } else if (sport === 'endurance') {
      protein = 1.4;
      carbs = 8;
    }

    // Adjust based on genetics
    if (geneticProfile.performanceModifiers?.strengthGain < 1) {
      protein *= 1.2; // Higher protein for muscle building challenges
    }

    const weight = athleteData.weight || 70;
    return {
      protein: Math.round(protein * weight),
      carbs: Math.round(carbs * weight),
      fat: Math.round(fat * weight)
    };
  }

  generateMealTiming(athleteData) {
    return {
      preWorkout: '2-3 hours before training',
      duringWorkout: 'If training >90 min, consume carbs',
      postWorkout: 'Within 30-60 min after training',
      frequency: '4-6 meals per day'
    };
  }

  recommendSupplements(athleteData, geneticProfile) {
    const supplements = ['multivitamin', 'omega-3'];

    if (geneticProfile.weaknesses?.includes('Muscle building potential')) {
      supplements.push('creatine', 'beta-alanine');
    }

    if (geneticProfile.strengths?.includes('Endurance')) {
      supplements.push('caffeine', 'electrolytes');
    }

    return supplements;
  }

  calculateHydrationNeeds(athleteData) {
    const weight = athleteData.weight || 70;
    const activityLevel = athleteData.activityLevel || 'moderate';

    const baseWater = weight * 35; // ml per kg
    const activityMultiplier = activityLevel === 'very_active' ? 1.5 : 1.2;

    return Math.round(baseWater * activityMultiplier);
  }

  applyGeneticNutritionAdjustments(geneticProfile) {
    const adjustments = {};

    if (geneticProfile.performanceModifiers?.strengthGain < 1) {
      adjustments.protein = 'Increase protein intake by 20%';
    }

    return adjustments;
  }

  increaseProgramVolume(program, multiplier) {
    return {
      ...program,
      phases: program.phases.map(phase => ({
        ...phase,
        sessions: phase.sessions.map(session => ({
          ...session,
          exercises: session.exercises.map(exercise => ({
            ...exercise,
            sets: Math.round(exercise.sets * multiplier),
            reps: exercise.reps // Keep reps the same for volume increase
          }))
        }))
      }))
    };
  }

  decreaseProgramIntensity(program, multiplier) {
    return {
      ...program,
      phases: program.phases.map(phase => ({
        ...phase,
        sessions: phase.sessions.map(session => ({
          ...session,
          exercises: session.exercises.map(exercise => ({
            ...exercise,
            weight: exercise.weight ? Math.round(exercise.weight * multiplier) : exercise.weight,
            intensity: exercise.intensity ? exercise.intensity * multiplier : exercise.intensity
          }))
        }))
      }))
    };
  }

  getAdaptationFactors(athleteId) {
    return this.adaptiveWeights.get(athleteId) || this.adaptiveWeights.get('default');
  }

  /**
   * Get personalization statistics
   * @returns {Object} Engine statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      athleteProfiles: this.athleteProfiles.size,
      personalizationModels: this.personalizationModels.size,
      geneticFactors: this.geneticFactors.size,
      version: '1.0.0'
    };
  }
}

module.exports = PersonalizationEngine;