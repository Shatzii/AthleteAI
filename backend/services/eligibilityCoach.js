const aiCoachVoice = require('../../ai-coach-voice');
const eligibilityService = require('./eligibilityService');

class NCAAEligibilityCoach {
  constructor() {
    this.voiceCoach = aiCoachVoice;
  }

  /**
   * Generate eligibility-aware coaching response
   * @param {string} athleteId - Athlete's ID
   * @param {string} workoutType - Type of workout
   * @param {Object} workoutData - Workout performance data
   */
  async provideEligibilityCoaching(athleteId, workoutType, workoutData = {}) {
    try {
      // Get eligibility status
      const eligibility = await eligibilityService.calculateRemainingEligibility(athleteId);
      const amateurStatus = await eligibilityService.checkAmateurStatus(athleteId);

      // Generate contextual coaching message
      const coachingMessage = this._generateEligibilityCoachingMessage(
        eligibility,
        amateurStatus,
        workoutType,
        workoutData
      );

      // Generate voice response
      const voiceResponse = await this.voiceCoach.generateVoice(
        coachingMessage,
        this._selectCoachVoice(eligibility, workoutData),
        { context: 'eligibility' }
      );

      return {
        message: coachingMessage,
        voice: voiceResponse,
        eligibility: eligibility,
        amateurStatus: amateurStatus,
        coachingType: 'eligibility_aware',
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error providing eligibility coaching:', error);
      throw error;
    }
  }

  /**
   * Provide academic performance coaching
   * @param {string} athleteId - Athlete's ID
   * @param {Object} academicData - Academic performance data
   */
  async provideAcademicCoaching(athleteId, academicData = {}) {
    try {
      const eligibility = await eligibilityService.calculateRemainingEligibility(athleteId);

      const coachingMessage = this._generateAcademicCoachingMessage(
        eligibility.academicStanding,
        academicData
      );

      const voiceResponse = await this.voiceCoach.generateVoice(
        coachingMessage,
        'coach_supportive',
        { context: 'academic' }
      );

      return {
        message: coachingMessage,
        voice: voiceResponse,
        academicFocus: academicData.focus || 'general',
        coachingType: 'academic',
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error providing academic coaching:', error);
      throw error;
    }
  }

  /**
   * Provide recruiting timeline coaching
   * @param {string} athleteId - Athlete's ID
   * @param {Object} recruitingData - Recruiting context data
   */
  async provideRecruitingCoaching(athleteId, recruitingData = {}) {
    try {
      const recruitingStatus = await eligibilityService.getRecruitingStatus(athleteId);

      const coachingMessage = this._generateRecruitingCoachingMessage(
        recruitingStatus,
        recruitingData
      );

      const voiceResponse = await this.voiceCoach.generateVoice(
        coachingMessage,
        'coach_professional',
        { context: 'recruiting' }
      );

      return {
        message: coachingMessage,
        voice: voiceResponse,
        recruitingStatus: recruitingStatus,
        coachingType: 'recruiting',
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error providing recruiting coaching:', error);
      throw error;
    }
  }

  /**
   * Provide comprehensive performance coaching
   * @param {string} athleteId - Athlete's ID
   * @param {Object} performanceData - Performance metrics
   */
  async providePerformanceCoaching(athleteId, performanceData) {
    try {
      const eligibility = await eligibilityService.calculateRemainingEligibility(athleteId);
      const amateurStatus = await eligibilityService.checkAmateurStatus(athleteId);

      const coachingMessage = this._generatePerformanceCoachingMessage(
        performanceData,
        eligibility,
        amateurStatus
      );

      const voiceResponse = await this.voiceCoach.generateVoice(
        coachingMessage,
        this._selectPerformanceVoice(performanceData),
        { context: 'performance' }
      );

      return {
        message: coachingMessage,
        voice: voiceResponse,
        performance: performanceData,
        coachingType: 'performance',
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error providing performance coaching:', error);
      throw error;
    }
  }

  /**
   * Generate personalized workout coaching
   * @param {string} athleteId - Athlete's ID
   * @param {Object} workoutData - Workout session data
   */
  async provideWorkoutCoaching(athleteId, workoutData) {
    try {
      const eligibility = await eligibilityService.calculateRemainingEligibility(athleteId);

      const coachingMessage = this._generateWorkoutCoachingMessage(
        workoutData,
        eligibility
      );

      const voiceResponse = await this.voiceCoach.generateVoice(
        coachingMessage,
        this._selectWorkoutVoice(workoutData),
        { context: 'workout' }
      );

      return {
        message: coachingMessage,
        voice: voiceResponse,
        workout: workoutData,
        coachingType: 'workout',
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error providing workout coaching:', error);
      throw error;
    }
  }

  // Private helper methods for message generation
  _generateEligibilityCoachingMessage(eligibility, amateurStatus, workoutType, workoutData) {
    let message = '';

    // Eligibility-based coaching
    if (eligibility.seasonsRemaining <= 1) {
      message += "Remember, this is a crucial season for your eligibility. Make every workout count! ";
    } else if (eligibility.seasonsRemaining <= 2) {
      message += "You're in a good position with your eligibility. Keep building that foundation! ";
    } else {
      message += "You've got plenty of eligibility ahead. Focus on long-term development! ";
    }

    // Amateur status coaching
    if (!amateurStatus.isAmateur) {
      message += "Keep your amateur status in mind as you train. Every session builds your future opportunities! ";
    }

    // Workout-specific coaching
    if (workoutData.performance) {
      if (workoutData.performance.accuracy > 90) {
        message += "Excellent form! You're executing with precision. ";
      } else if (workoutData.performance.intensity > 80) {
        message += "Amazing intensity! You're pushing your limits. ";
      }
    }

    message += "Keep pushing - your dedication is paying off!";
    return message;
  }

  _generateAcademicCoachingMessage(academicStanding, academicData) {
    let message = '';

    if (academicStanding.gpa < 2.0) {
      message = "Your academics are crucial for eligibility. Let's prioritize study time alongside training. ";
    } else if (academicStanding.progressToDegree < 50) {
      message = "You're making good academic progress. Keep balancing training and studies! ";
    } else {
      message = "Excellent academic standing! Your eligibility is secure on all fronts. ";
    }

    if (academicData.focus === 'study_time') {
      message += "Remember, consistent study habits lead to academic success and eligibility security.";
    } else if (academicData.focus === 'time_management') {
      message += "Balance is key - manage your time well between training and academics.";
    }

    return message;
  }

  _generateRecruitingCoachingMessage(recruitingStatus, recruitingData) {
    let message = '';

    if (recruitingStatus.isDeadPeriod) {
      message = "We're in a dead period for recruiting. Focus on your development and academics. ";
    } else if (recruitingStatus.contactsThisWeek >= 7) {
      message = "You've reached your weekly contact limit. Great job staying engaged! ";
    } else {
      message = "This is a live recruiting period. Stay in touch with coaches and keep performing! ";
    }

    if (recruitingData.nextContact) {
      message += "Keep building those relationships - consistent communication matters.";
    }

    return message;
  }

  _generatePerformanceCoachingMessage(performanceData, eligibility, amateurStatus) {
    let message = '';

    const { accuracy, intensity, consistency } = performanceData;

    if (accuracy > 90) {
      message += "Perfect form! You're executing with precision. ";
    } else if (accuracy > 75) {
      message += "Good form! Keep focusing on technique. ";
    } else {
      message += "Let's work on your form. Quality over quantity! ";
    }

    if (intensity > 85) {
      message += "Amazing intensity! You're pushing your limits. ";
    } else if (intensity > 70) {
      message += "Keep that intensity up! ";
    }

    if (consistency > 80) {
      message += "Outstanding consistency! Your dedication shows. ";
    }

    // Add eligibility context
    if (eligibility.seasonsRemaining <= 2) {
      message += "Every workout matters for your future opportunities. ";
    }

    message += "You're building something special!";
    return message;
  }

  _generateWorkoutCoachingMessage(workoutData, eligibility) {
    let message = '';

    const { type, duration, exercises } = workoutData;

    message += `Great work on your ${type} session! `;

    if (duration > 60) {
      message += "That's a solid training block. ";
    } else if (duration < 30) {
      message += "Good intensity in a shorter session. ";
    }

    if (exercises && exercises.length > 0) {
      message += `Those ${exercises.length} exercises are building your strength. `;
    }

    // Add eligibility motivation
    if (eligibility.seasonsRemaining <= 2) {
      message += "Remember, every session counts toward your goals!";
    } else {
      message += "Keep this momentum going!";
    }

    return message;
  }

  // Voice selection helpers
  _selectCoachVoice(eligibility, workoutData) {
    if (eligibility.seasonsRemaining <= 1) {
      return 'coach_motivational'; // High energy for crucial seasons
    } else if (workoutData.performance && workoutData.performance.accuracy < 70) {
      return 'coach_male'; // Authoritative for form correction
    } else {
      return 'coach_female'; // Encouraging for general coaching
    }
  }

  _selectPerformanceVoice(performanceData) {
    const { accuracy, intensity } = performanceData;

    if (accuracy > 90 && intensity > 80) {
      return 'coach_motivational'; // Celebrate excellence
    } else if (accuracy < 70) {
      return 'coach_male'; // Correct form
    } else {
      return 'coach_female'; // Encourage improvement
    }
  }

  _selectWorkoutVoice(workoutData) {
    if (workoutData.intensity === 'high') {
      return 'coach_motivational';
    } else if (workoutData.focus === 'form') {
      return 'coach_male';
    } else {
      return 'coach_female';
    }
  }

  /**
   * Get AI coach statistics
   */
  async getCoachStats(athleteId) {
    try {
      // This would track coaching interactions
      return {
        totalSessions: 0, // Would be calculated from database
        voiceResponses: await this.voiceCoach.getCacheStats(),
        eligibilityChecks: 0,
        lastInteraction: new Date()
      };
    } catch (error) {
      console.error('Error getting coach stats:', error);
      throw error;
    }
  }

  /**
   * Clear voice cache for memory management
   */
  async clearVoiceCache() {
    try {
      this.voiceCoach.clearCache();
      return { message: 'Voice cache cleared successfully' };
    } catch (error) {
      console.error('Error clearing voice cache:', error);
      throw error;
    }
  }
}

module.exports = new NCAAEligibilityCoach();
