// Institutional Partnerships Service
// White-label solutions and institutional integrations

const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Models
const Institution = require('../models/Institution');
const User = require('../models/User');
const Athlete = require('../models/Athlete');
const Team = require('../models/Team');
const Subscription = require('../models/Subscription');

class InstitutionalPartnershipsService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
  }

  /**
   * Create a new institutional partnership
   * @param {Object} institutionData - Institution details
   * @returns {Object} Created institution with API credentials
   */
  async createInstitution(institutionData) {
    try {
      // Generate API credentials
      const apiKey = this.generateApiKey();
      const apiSecret = this.generateApiSecret();

      // Create institution
      const institution = new Institution({
        ...institutionData,
        apiCredentials: {
          apiKey,
          apiSecret: this.hashApiSecret(apiSecret),
          createdAt: new Date(),
          isActive: true
        },
        branding: {
          ...institutionData.branding,
          whiteLabelEnabled: institutionData.whiteLabelEnabled || false
        },
        features: institutionData.features || this.getDefaultFeatures(),
        subscription: {
          plan: institutionData.subscriptionPlan || 'basic',
          status: 'active',
          startDate: new Date(),
          maxUsers: institutionData.maxUsers || 100,
          maxTeams: institutionData.maxTeams || 10
        },
        createdAt: new Date(),
        isActive: true
      });

      await institution.save();

      // Create admin user for the institution
      if (institutionData.adminUser) {
        await this.createInstitutionAdmin(institution._id, institutionData.adminUser);
      }

      return {
        institution: {
          id: institution._id,
          name: institution.name,
          type: institution.type,
          domain: institution.domain,
          branding: institution.branding,
          features: institution.features,
          subscription: institution.subscription
        },
        apiCredentials: {
          apiKey,
          apiSecret, // Return unhashed secret only once
          webhookUrl: `${process.env.API_BASE_URL}/api/v1/institutions/${institution._id}/webhook`
        }
      };

    } catch (error) {
      console.error('Error creating institution:', error);
      throw new Error(`Failed to create institution: ${error.message}`);
    }
  }

  /**
   * Generate unique API key
   */
  generateApiKey() {
    return `inst_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate API secret
   */
  generateApiSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash API secret for storage
   */
  hashApiSecret(secret) {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /**
   * Get default features for institutions
   */
  getDefaultFeatures() {
    return {
      athleteManagement: true,
      teamManagement: true,
      performanceAnalytics: true,
      injuryPrevention: true,
      scheduling: true,
      communication: true,
      customBranding: false,
      apiAccess: true,
      whiteLabel: false,
      advancedAnalytics: false,
      customIntegrations: false
    };
  }

  /**
   * Create admin user for institution
   */
  async createInstitutionAdmin(institutionId, adminData) {
    try {
      const adminUser = new User({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        role: 'institution_admin',
        institutionId,
        permissions: [
          'manage_athletes',
          'manage_teams',
          'manage_coaches',
          'view_analytics',
          'manage_subscription',
          'manage_branding'
        ],
        isActive: true,
        createdAt: new Date()
      });

      await adminUser.save();
      return adminUser;
    } catch (error) {
      console.error('Error creating institution admin:', error);
      throw error;
    }
  }

  /**
   * Authenticate institution API request
   * @param {String} apiKey - API key
   * @param {String} signature - Request signature
   * @param {String} timestamp - Request timestamp
   * @param {String} body - Request body
   * @returns {Object} Authenticated institution
   */
  async authenticateInstitution(apiKey, signature, timestamp, body = '') {
    try {
      // Find institution by API key
      const institution = await Institution.findOne({
        'apiCredentials.apiKey': apiKey,
        'apiCredentials.isActive': true,
        isActive: true
      });

      if (!institution) {
        throw new Error('Invalid API key');
      }

      // Verify timestamp (prevent replay attacks)
      const requestTime = parseInt(timestamp);
      const currentTime = Date.now();
      const timeDiff = Math.abs(currentTime - requestTime);

      if (timeDiff > 300000) { // 5 minutes
        throw new Error('Request timestamp expired');
      }

      // Verify signature
      const expectedSignature = this.generateSignature(
        institution.apiCredentials.apiSecret,
        timestamp,
        body
      );

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      return institution;
    } catch (error) {
      console.error('Institution authentication failed:', error);
      throw error;
    }
  }

  /**
   * Generate request signature
   */
  generateSignature(secret, timestamp, body) {
    const message = `${timestamp}${body}`;
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Create white-label configuration
   * @param {String} institutionId - Institution ID
   * @param {Object} brandingConfig - Branding configuration
   * @returns {Object} White-label configuration
   */
  async createWhiteLabelConfig(institutionId, brandingConfig) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      // Check if white-label is enabled in subscription
      if (!institution.features.whiteLabel) {
        throw new Error('White-label feature not enabled for this institution');
      }

      const whiteLabelConfig = {
        institutionId,
        branding: {
          primaryColor: brandingConfig.primaryColor || '#3B82F6',
          secondaryColor: brandingConfig.secondaryColor || '#1F2937',
          logoUrl: brandingConfig.logoUrl,
          faviconUrl: brandingConfig.faviconUrl,
          customDomain: brandingConfig.customDomain,
          customCSS: brandingConfig.customCSS,
          emailTemplates: brandingConfig.emailTemplates || {},
          appName: brandingConfig.appName || institution.name,
          tagline: brandingConfig.tagline,
          supportEmail: brandingConfig.supportEmail,
          privacyPolicyUrl: brandingConfig.privacyPolicyUrl,
          termsOfServiceUrl: brandingConfig.termsOfServiceUrl
        },
        features: {
          customDashboard: brandingConfig.customDashboard || false,
          customReports: brandingConfig.customReports || false,
          customIntegrations: brandingConfig.customIntegrations || false,
          apiAccess: true,
          ssoEnabled: brandingConfig.ssoEnabled || false
        },
        restrictions: {
          maxUsers: institution.subscription.maxUsers,
          maxTeams: institution.subscription.maxTeams,
          allowedFeatures: Object.keys(institution.features).filter(key => institution.features[key])
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update institution with white-label config
      institution.branding = { ...institution.branding, ...whiteLabelConfig.branding };
      institution.whiteLabelConfig = whiteLabelConfig;
      await institution.save();

      return whiteLabelConfig;
    } catch (error) {
      console.error('Error creating white-label config:', error);
      throw error;
    }
  }

  /**
   * Create institutional team
   * @param {String} institutionId - Institution ID
   * @param {Object} teamData - Team details
   * @returns {Object} Created team
   */
  async createInstitutionalTeam(institutionId, teamData) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      // Check team limit
      const currentTeams = await Team.countDocuments({ institutionId });
      if (currentTeams >= institution.subscription.maxTeams) {
        throw new Error('Team limit reached for this institution');
      }

      const team = new Team({
        ...teamData,
        institutionId,
        sport: teamData.sport || institution.primarySport,
        level: teamData.level || 'varsity',
        season: teamData.season || this.getCurrentSeason(),
        coaches: teamData.coaches || [],
        athletes: [],
        isActive: true,
        createdAt: new Date()
      });

      await team.save();

      // Update institution stats
      await this.updateInstitutionStats(institutionId);

      return team;
    } catch (error) {
      console.error('Error creating institutional team:', error);
      throw error;
    }
  }

  /**
   * Get current season
   */
  getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Fall sports: August-December
    if (month >= 8 || month <= 12) {
      return `Fall ${year}`;
    }
    // Spring sports: January-May
    else if (month >= 1 && month <= 5) {
      return `Spring ${year}`;
    }
    // Summer: June-July
    else {
      return `Summer ${year}`;
    }
  }

  /**
   * Bulk import athletes for institution
   * @param {String} institutionId - Institution ID
   * @param {Array} athletesData - Array of athlete data
   * @returns {Object} Import results
   */
  async bulkImportAthletes(institutionId, athletesData) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      const results = {
        successful: [],
        failed: [],
        total: athletesData.length
      };

      // Check user limit
      const currentUsers = await User.countDocuments({
        institutionId,
        role: { $in: ['athlete', 'coach'] }
      });

      if (currentUsers + athletesData.length > institution.subscription.maxUsers) {
        throw new Error('User limit would be exceeded');
      }

      for (const athleteData of athletesData) {
        try {
          // Create user account
          const user = new User({
            name: athleteData.name,
            email: athleteData.email,
            password: this.generateTemporaryPassword(),
            role: 'athlete',
            institutionId,
            profile: {
              dateOfBirth: athleteData.dateOfBirth,
              sport: athleteData.sport || institution.primarySport,
              position: athleteData.position,
              year: athleteData.year,
              height: athleteData.height,
              weight: athleteData.weight
            },
            isActive: true,
            createdAt: new Date()
          });

          await user.save();

          // Create athlete profile
          const athlete = new Athlete({
            userId: user._id,
            institutionId,
            teamId: athleteData.teamId,
            sport: athleteData.sport || institution.primarySport,
            position: athleteData.position,
            academicInfo: athleteData.academicInfo || {},
            athleticInfo: athleteData.athleticInfo || {},
            medicalInfo: athleteData.medicalInfo || {},
            emergencyContacts: athleteData.emergencyContacts || [],
            isActive: true,
            createdAt: new Date()
          });

          await athlete.save();

          results.successful.push({
            id: athlete._id,
            name: athleteData.name,
            email: athleteData.email
          });

        } catch (error) {
          results.failed.push({
            data: athleteData,
            error: error.message
          });
        }
      }

      // Update institution stats
      await this.updateInstitutionStats(institutionId);

      return results;
    } catch (error) {
      console.error('Error bulk importing athletes:', error);
      throw error;
    }
  }

  /**
   * Generate temporary password
   */
  generateTemporaryPassword() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Update institution statistics
   */
  async updateInstitutionStats(institutionId) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) return;

      // Count current users, teams, athletes
      const userCount = await User.countDocuments({
        institutionId,
        isActive: true
      });

      const teamCount = await Team.countDocuments({
        institutionId,
        isActive: true
      });

      const athleteCount = await Athlete.countDocuments({
        institutionId,
        isActive: true
      });

      institution.stats = {
        totalUsers: userCount,
        totalTeams: teamCount,
        totalAthletes: athleteCount,
        lastUpdated: new Date()
      };

      await institution.save();
    } catch (error) {
      console.error('Error updating institution stats:', error);
    }
  }

  /**
   * Create custom integration
   * @param {String} institutionId - Institution ID
   * @param {Object} integrationData - Integration configuration
   * @returns {Object} Created integration
   */
  async createCustomIntegration(institutionId, integrationData) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      // Check if custom integrations are enabled
      if (!institution.features.customIntegrations) {
        throw new Error('Custom integrations not enabled for this institution');
      }

      const integration = {
        id: `int_${crypto.randomBytes(8).toString('hex')}`,
        name: integrationData.name,
        type: integrationData.type, // 'api', 'webhook', 'sso', 'lms', etc.
        config: integrationData.config,
        endpoints: integrationData.endpoints || {},
        authentication: integrationData.authentication || {},
        mappings: integrationData.mappings || {},
        isActive: true,
        createdAt: new Date()
      };

      // Add to institution integrations
      if (!institution.integrations) {
        institution.integrations = [];
      }
      institution.integrations.push(integration);

      await institution.save();

      return integration;
    } catch (error) {
      console.error('Error creating custom integration:', error);
      throw error;
    }
  }

  /**
   * Generate institution analytics report
   * @param {String} institutionId - Institution ID
   * @param {Object} filters - Report filters
   * @returns {Object} Analytics report
   */
  async generateInstitutionReport(institutionId, filters = {}) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      const report = {
        institution: {
          name: institution.name,
          type: institution.type,
          stats: institution.stats
        },
        dateRange: filters.dateRange || 'last_30_days',
        generatedAt: new Date()
      };

      // Team performance metrics
      report.teamPerformance = await this.getTeamPerformanceMetrics(institutionId, filters);

      // Athlete engagement metrics
      report.athleteEngagement = await this.getAthleteEngagementMetrics(institutionId, filters);

      // Injury and safety metrics
      report.safetyMetrics = await this.getSafetyMetrics(institutionId, filters);

      // Academic performance correlation
      report.academicCorrelation = await this.getAcademicCorrelationMetrics(institutionId, filters);

      return report;
    } catch (error) {
      console.error('Error generating institution report:', error);
      throw error;
    }
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformanceMetrics(institutionId, filters) {
    // Implementation would aggregate team performance data
    return {
      totalTeams: 0,
      averageWinRate: 0,
      topPerformingTeams: [],
      performanceTrends: []
    };
  }

  /**
   * Get athlete engagement metrics
   */
  async getAthleteEngagementMetrics(institutionId, filters) {
    // Implementation would aggregate athlete engagement data
    return {
      activeUsers: 0,
      sessionFrequency: 0,
      featureUsage: {},
      engagementTrends: []
    };
  }

  /**
   * Get safety metrics
   */
  async getSafetyMetrics(institutionId, filters) {
    // Implementation would aggregate injury and safety data
    return {
      totalInjuries: 0,
      injuryRate: 0,
      recoveryTime: 0,
      preventionPrograms: 0
    };
  }

  /**
   * Get academic correlation metrics
   */
  async getAcademicCorrelationMetrics(institutionId, filters) {
    // Implementation would correlate athletic and academic performance
    return {
      gpaCorrelation: 0,
      attendanceCorrelation: 0,
      academicAthleticBalance: 0
    };
  }

  /**
   * Handle institution webhook
   * @param {String} institutionId - Institution ID
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} Processing result
   */
  async handleInstitutionWebhook(institutionId, webhookData) {
    try {
      const institution = await Institution.findById(institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }

      // Process webhook based on type
      const result = {
        processed: true,
        type: webhookData.type,
        timestamp: new Date()
      };

      switch (webhookData.type) {
        case 'athlete_created':
          result.action = await this.handleAthleteCreatedWebhook(institutionId, webhookData.data);
          break;
        case 'team_updated':
          result.action = await this.handleTeamUpdatedWebhook(institutionId, webhookData.data);
          break;
        case 'performance_data':
          result.action = await this.handlePerformanceDataWebhook(institutionId, webhookData.data);
          break;
        default:
          result.action = 'ignored_unknown_type';
      }

      return result;
    } catch (error) {
      console.error('Error handling institution webhook:', error);
      throw error;
    }
  }

  /**
   * Handle athlete created webhook
   */
  async handleAthleteCreatedWebhook(institutionId, athleteData) {
    // Implementation would create athlete from webhook data
    return 'athlete_created';
  }

  /**
   * Handle team updated webhook
   */
  async handleTeamUpdatedWebhook(institutionId, teamData) {
    // Implementation would update team from webhook data
    return 'team_updated';
  }

  /**
   * Handle performance data webhook
   */
  async handlePerformanceDataWebhook(institutionId, performanceData) {
    // Implementation would process performance data from webhook
    return 'performance_data_processed';
  }
}

module.exports = InstitutionalPartnershipsService;