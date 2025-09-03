const Eligibility = require('../models/eligibilityModel');
const Amateurism = require('../models/amateurismModel');

class EligibilityService {
  /**
   * Initialize eligibility tracking for a new athlete
   * @param {string} athleteId - Athlete's ID
   */
  async initializeEligibility(athleteId) {
    try {
      const existingEligibility = await Eligibility.findOne({ athleteId });

      if (existingEligibility) {
        throw new Error('Eligibility already initialized for this athlete');
      }

      const eligibility = new Eligibility({
        athleteId,
        seasonsRemaining: 5,
        redshirtEligible: true,
        academicStanding: {
          gpa: 0,
          progressToDegree: 0,
          coreCoursesCompleted: 0,
          eligibilityYear: 'FR'
        },
        complianceScore: 100
      });

      await eligibility.save();
      return eligibility;
    } catch (error) {
      console.error('Error initializing eligibility:', error);
      throw error;
    }
  }

  /**
   * Calculate remaining eligibility for an athlete
   * @param {string} athleteId - Athlete's ID
   */
  async calculateRemainingEligibility(athleteId) {
    try {
      const eligibility = await Eligibility.findOne({ athleteId });

      if (!eligibility) {
        throw new Error('Eligibility not found for athlete');
      }

      const clockExpiry = eligibility.clockExpiry;
      const isExpired = eligibility.isClockExpired();

      return {
        seasonsUsed: eligibility.seasonsUsed,
        seasonsRemaining: eligibility.seasonsRemaining,
        clockStart: eligibility.clockStart,
        clockExpiry: clockExpiry,
        isExpired: isExpired,
        redshirtEligible: eligibility.redshirtEligible,
        redshirtUsed: eligibility.redshirtUsed,
        waiverHistory: eligibility.waiverHistory,
        eligibilityUsedPercentage: eligibility.eligibilityUsedPercentage,
        lastUpdated: eligibility.updatedAt
      };
    } catch (error) {
      console.error('Error calculating eligibility:', error);
      throw error;
    }
  }

  /**
   * Record a competition and update eligibility clock
   * @param {string} athleteId - Athlete's ID
   * @param {string} competitionType - Type of competition
   * @param {string} season - Season (fall, winter, spring, summer)
   */
  async recordCompetition(athleteId, competitionType, season) {
    try {
      const eligibility = await Eligibility.findOne({ athleteId });

      if (!eligibility) {
        throw new Error('Eligibility not found for athlete');
      }

      // Start clock if not already started
      if (!eligibility.clockStart) {
        eligibility.clockStart = new Date();
      }

      // Check if this counts toward seasons used
      const countableCompetitions = ['regular_season', 'conference', 'postseason', 'bowl'];
      if (countableCompetitions.includes(competitionType)) {
        // Only count if not already counted this season
        const currentYear = new Date().getFullYear();
        const seasonKey = `${season}_${currentYear}`;

        // This is a simplified version - in reality, you'd track per season
        if (eligibility.seasonsUsed < 5) {
          eligibility.seasonsUsed += 1;
          eligibility.seasonsRemaining = Math.max(0, 5 - eligibility.seasonsUsed);
        }
      }

      await eligibility.save();

      return {
        message: 'Competition recorded successfully',
        seasonsUsed: eligibility.seasonsUsed,
        seasonsRemaining: eligibility.seasonsRemaining
      };
    } catch (error) {
      console.error('Error recording competition:', error);
      throw error;
    }
  }

  /**
   * Check amateur status based on earnings
   * @param {string} athleteId - Athlete's ID
   */
  async checkAmateurStatus(athleteId) {
    try {
      const totalEarnings = await Amateurism.getTotalEarnings(athleteId);
      const recentEarnings = await Amateurism.find({
        athleteId,
        dateReceived: {
          $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      });

      // NCAA amateurism threshold is complex, but simplified here
      const isAmateur = totalEarnings < 100; // Simplified threshold

      return {
        isAmateur: isAmateur,
        totalEarnings: totalEarnings,
        recentEarnings: recentEarnings.length,
        lastUpdated: new Date(),
        complianceStatus: isAmateur ? 'compliant' : 'under_review'
      };
    } catch (error) {
      console.error('Error checking amateur status:', error);
      throw error;
    }
  }

  /**
   * Update academic standing
   * @param {string} athleteId - Athlete's ID
   * @param {Object} academicData - Academic information
   */
  async updateAcademicStanding(athleteId, academicData) {
    try {
      const eligibility = await Eligibility.findOne({ athleteId });

      if (!eligibility) {
        throw new Error('Eligibility not found for athlete');
      }

      eligibility.academicStanding = {
        ...eligibility.academicStanding,
        ...academicData,
        lastAcademicUpdate: new Date()
      };

      await eligibility.save();

      return {
        message: 'Academic standing updated successfully',
        academicStanding: eligibility.academicStanding,
        isEligible: eligibility.isAcademicallyEligible()
      };
    } catch (error) {
      console.error('Error updating academic standing:', error);
      throw error;
    }
  }

  /**
   * Record amateurism activity
   * @param {string} athleteId - Athlete's ID
   * @param {Object} earningsData - Earnings information
   */
  async recordAmateurismActivity(athleteId, earningsData) {
    try {
      const amateurism = new Amateurism({
        athleteId,
        ...earningsData,
        ncaaImpact: {
          affectsAmateurism: this._assessAmateurismImpact(earningsData),
          impactLevel: this._calculateImpactLevel(earningsData),
          eligibilityImplication: this._getEligibilityImplication(earningsData)
        }
      });

      await amateurism.save();

      // Update compliance score
      await this._updateComplianceScore(athleteId);

      return {
        message: 'Amateurism activity recorded successfully',
        activity: amateurism,
        affectsAmateurStatus: amateurism.affectsAmateurStatus()
      };
    } catch (error) {
      console.error('Error recording amateurism activity:', error);
      throw error;
    }
  }

  /**
   * Get recruiting status and contact limits
   * @param {string} athleteId - Athlete's ID
   */
  async getRecruitingStatus(athleteId) {
    try {
      // This would integrate with recruiting calendar logic
      const currentDate = new Date();
      const isDeadPeriod = this._checkDeadPeriod(currentDate);

      // Simplified contact tracking - would need actual contact records
      const contactsThisWeek = 0; // Would query actual contacts
      const contactsThisMonth = 0;

      return {
        isDeadPeriod: isDeadPeriod,
        contactsThisWeek: contactsThisWeek,
        contactsThisMonth: contactsThisMonth,
        weeklyLimit: 7,
        monthlyLimit: 30,
        nextLivePeriod: this._getNextLivePeriod(currentDate),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting recruiting status:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive eligibility report
   * @param {string} athleteId - Athlete's ID
   */
  async getEligibilityReport(athleteId) {
    try {
      const eligibility = await this.calculateRemainingEligibility(athleteId);
      const amateurStatus = await this.checkAmateurStatus(athleteId);
      const recruitingStatus = await this.getRecruitingStatus(athleteId);

      const report = {
        athleteId,
        eligibility,
        amateurStatus,
        recruitingStatus,
        overallStatus: this._calculateOverallStatus(eligibility, amateurStatus),
        alerts: await this._generateAlerts(athleteId, eligibility, amateurStatus),
        reportGenerated: new Date()
      };

      return report;
    } catch (error) {
      console.error('Error generating eligibility report:', error);
      throw error;
    }
  }

  // Private helper methods
  _assessAmateurismImpact(earningsData) {
    const affectingTypes = ['endorsement', 'sponsorship', 'appearance_fee'];
    return affectingTypes.includes(earningsData.earningsType);
  }

  _calculateImpactLevel(earningsData) {
    if (earningsData.amount > 10000) return 'high';
    if (earningsData.amount > 1000) return 'medium';
    if (earningsData.amount > 100) return 'low';
    return 'none';
  }

  _getEligibilityImplication(earningsData) {
    if (earningsData.amount > 100) {
      return 'May affect amateur status - consult compliance officer';
    }
    return 'No eligibility impact expected';
  }

  async _updateComplianceScore(athleteId) {
    const eligibility = await Eligibility.findOne({ athleteId });
    if (eligibility) {
      // Simplified compliance scoring
      eligibility.complianceScore = Math.max(0, eligibility.complianceScore - 5);
      eligibility.lastComplianceCheck = new Date();
      await eligibility.save();
    }
  }

  _checkDeadPeriod(date) {
    // Simplified dead period logic - would need actual NCAA calendar
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Example: Dead period during holidays
    return (month === 12 && day >= 20) || (month === 1 && day <= 5);
  }

  _getNextLivePeriod(date) {
    // Simplified - would calculate actual next live period
    return new Date(date.getTime() + (7 * 24 * 60 * 60 * 1000));
  }

  _calculateOverallStatus(eligibility, amateurStatus) {
    if (!eligibility.isExpired && amateurStatus.isAmateur) {
      return 'eligible';
    } else if (eligibility.seasonsRemaining === 0) {
      return 'exhausted';
    } else {
      return 'ineligible';
    }
  }

  async _generateAlerts(athleteId, eligibility, amateurStatus) {
    const alerts = [];

    if (eligibility.seasonsRemaining <= 1) {
      alerts.push({
        type: 'warning',
        title: 'Eligibility Running Low',
        message: `Only ${eligibility.seasonsRemaining} seasons remaining`,
        priority: 'high'
      });
    }

    if (!amateurStatus.isAmateur) {
      alerts.push({
        type: 'critical',
        title: 'Amateur Status at Risk',
        message: 'Professional earnings may affect amateur status',
        priority: 'critical'
      });
    }

    if (eligibility.clockExpiry) {
      const daysUntilExpiry = Math.ceil((eligibility.clockExpiry - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 365) {
        alerts.push({
          type: 'info',
          title: 'Clock Expiring Soon',
          message: `Eligibility clock expires in ${daysUntilExpiry} days`,
          priority: 'medium'
        });
      }
    }

    return alerts;
  }
}

module.exports = new EligibilityService();
