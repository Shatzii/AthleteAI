const express = require('express');
const router = express.Router();
const { connectDB, mockDB } = require('../config/database');
const authMiddleware = require('../middleware/auth').authenticateToken;

// Import new services
const jobProcessor = require('../services/backgroundJobProcessor');
const achievementSystem = require('../services/achievementSystem');
const DataValidationService = require('../services/dataValidationService');
const AnalyticsService = require('../services/analyticsService');
const adminService = require('../services/adminService');
const DataStorageService = require('../services/dataStorageService');

// Initialize services
const dataValidator = new DataValidationService();
const analyticsService = new AnalyticsService();
const dataStorageService = new DataStorageService();

// Initialize database connection for ranking routes
connectDB().catch(err => console.error('Database connection failed in ranking routes:', err));

// Initialize data storage service
dataStorageService.initialize().catch(err => console.error('Data storage service initialization failed:', err));

// Enhanced GAR Scoring Algorithm
function calculateEnhancedGAR(athlete) {
  let totalScore = 0;
  const breakdown = {
    technical: 0,
    physical: 0,
    tactical: 0,
    mental: 0,
    consistency: 0
  };

  // Technical Scoring (25% weight)
  breakdown.technical = calculateTechnicalScore(athlete);

  // Physical Scoring (20% weight)
  breakdown.physical = calculatePhysicalScore(athlete);

  // Tactical Scoring (20% weight)
  breakdown.tactical = calculateTacticalScore(athlete);

  // Mental Scoring (20% weight)
  breakdown.mental = calculateMentalScore(athlete);

  // Consistency Scoring (15% weight)
  breakdown.consistency = calculateConsistencyScore(athlete);

  // Calculate weighted total
  totalScore = (
    breakdown.technical * 0.25 +
    breakdown.physical * 0.20 +
    breakdown.tactical * 0.20 +
    breakdown.mental * 0.20 +
    breakdown.consistency * 0.15
  );

  return {
    total: Math.min(100, Math.max(0, Math.round(totalScore))),
    breakdown: {
      technical: Math.round(breakdown.technical),
      physical: Math.round(breakdown.physical),
      tactical: Math.round(breakdown.tactical),
      mental: Math.round(breakdown.mental),
      consistency: Math.round(breakdown.consistency)
    }
  };
}

function calculateTechnicalScore(athlete) {
  let score = 70; // Base score

  // Position-specific technical skills
  if (athlete.position) {
    const position = athlete.position.toLowerCase();
    if (['qb', 'pg', 'sg'].includes(position)) {
      score += athlete.stats?.passingYards ? Math.min(athlete.stats.passingYards * 0.001, 15) : 0;
      score += athlete.stats?.touchdowns ? Math.min(athlete.stats.touchdowns * 2, 10) : 0;
    }
    if (['rb', 'wr', 'te'].includes(position)) {
      score += athlete.stats?.receivingYards ? Math.min(athlete.stats.receivingYards * 0.002, 15) : 0;
      score += athlete.stats?.rushingYards ? Math.min(athlete.stats.rushingYards * 0.002, 10) : 0;
    }
    if (['ol', 'dl', 'lb'].includes(position)) {
      score += athlete.stats?.tackles ? Math.min(athlete.stats.tackles * 0.5, 15) : 0;
      score += athlete.stats?.sacks ? Math.min(athlete.stats.sacks * 3, 10) : 0;
    }
  }

  // Highlight reel bonus
  if (athlete.highlights && athlete.highlights.length > 0) {
    score += Math.min(athlete.highlights.length * 2, 10);
  }

  return Math.min(100, Math.max(0, score));
}

function calculatePhysicalScore(athlete) {
  let score = 75; // Base score

  // Age factor (peak physical age 18-22)
  if (athlete.year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - (athlete.year - 18); // Approximate age calculation
    if (age >= 18 && age <= 22) {
      score += 10;
    } else if (age >= 16 && age <= 25) {
      score += 5;
    }
  }

  // Statistical performance indicators
  if (athlete.stats) {
    score += athlete.stats.touchdowns ? Math.min(athlete.stats.touchdowns * 2, 15) : 0;
    score += athlete.stats.tackles ? Math.min(athlete.stats.tackles * 0.3, 10) : 0;
  }

  // Social media engagement as physical presence indicator
  if (athlete.socialMedia) {
    const socialCount = Object.values(athlete.socialMedia).filter(url => url).length;
    score += Math.min(socialCount * 2, 5);
  }

  return Math.min(100, Math.max(0, score));
}

function calculateTacticalScore(athlete) {
  let score = 70; // Base score

  // Star rating indicates tactical awareness
  score += athlete.stars * 5;

  // Recruiting ranking bonus
  if (athlete.recruitingData?.rating) {
    score += Math.min(athlete.recruitingData.rating * 0.5, 15);
  }

  // Achievements indicate tactical understanding
  if (athlete.achievements && athlete.achievements.length > 0) {
    score += Math.min(athlete.achievements.length * 2, 10);
  }

  return Math.min(100, Math.max(0, score));
}

function calculateMentalScore(athlete) {
  let score = 75; // Base score

  // Consistency in performance
  if (athlete.stats) {
    const totalGames = athlete.stats.gamesPlayed || 10;
    const avgPoints = athlete.stats.touchdowns || 0;
    if (avgPoints > 0) {
      score += Math.min(avgPoints * 3, 15);
    }
  }

  // Star rating indicates mental toughness
  score += athlete.stars * 4;

  // School reputation (top schools indicate mentally tough players)
  if (athlete.school) {
    const topSchools = ['Alabama', 'Ohio State', 'USC', 'Texas', 'LSU'];
    if (topSchools.some(school => athlete.school.includes(school))) {
      score += 5;
    }
  }

  return Math.min(100, Math.max(0, score));
}

function calculateConsistencyScore(athlete) {
  let score = 70; // Base score

  // Base consistency on star rating and achievements
  score += athlete.stars * 6;

  // Multiple achievements indicate consistency
  if (athlete.achievements && athlete.achievements.length > 0) {
    score += Math.min(athlete.achievements.length * 3, 15);
  }

  // Regular stats updates indicate consistent performance tracking
  if (athlete.stats && Object.keys(athlete.stats).length > 3) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

// Get GAR rankings by category
router.post('/gar-ranking', async (req, res) => {
  try {
    const { sport = 'football', region = 'USA', gender = 'men', maxResults = 100 } = req.body;

    // Get athletes from mock database
    let athletes = mockDB.players || [];

    // Filter by sport if specified
    if (sport !== 'all') {
      athletes = athletes.filter(player => player.sport === sport);
    }

    // Calculate enhanced GAR scores for all athletes
    const rankedAthletes = athletes.map(athlete => {
      const garData = calculateEnhancedGAR(athlete);
      return {
        id: athlete._id,
        name: athlete.name,
        position: athlete.position,
        sport: athlete.sport || 'football',
        country: athlete.recruitingData?.location || 'USA',
        garScore: garData.total,
        garBreakdown: garData.breakdown,
        stars: athlete.stars,
        school: athlete.school,
        year: athlete.year,
        stats: athlete.stats
      };
    });

    // Sort by GAR score descending
    rankedAthletes.sort((a, b) => b.garScore - a.garScore);

    // Take top results
    const topAthletes = rankedAthletes.slice(0, maxResults);

    // Add ranking positions
    topAthletes.forEach((athlete, index) => {
      athlete.ranking = {
        overall: index + 1,
        national: index + 1, // Simplified - would need region filtering
        regional: index + 1,
        position: index + 1  // Simplified - would need position filtering
      };
    });

    // Calculate analytics
    const analytics = {
      averageGAR: topAthletes.length > 0 ? Math.round(topAthletes.reduce((sum, a) => sum + a.garScore, 0) / topAthletes.length) : 0,
      topGAR: topAthletes[0]?.garScore || 0,
      sportDistribution: { football: topAthletes.length }, // Simplified
      countryDistribution: { USA: topAthletes.length }, // Simplified
      eliteAthletes: topAthletes.filter(a => a.garScore >= 90).length,
      risingStars: topAthletes.filter(a => a.garScore >= 80 && a.garScore < 90).length,
      prospects: topAthletes.filter(a => a.garScore >= 70 && a.garScore < 80).length
    };

    res.json({
      success: true,
      athletes: topAthletes,
      analytics,
      metadata: {
        totalProcessed: athletes.length,
        totalRanked: topAthletes.length,
        filteredResults: topAthletes.length,
        rankingMethod: 'GAR-based',
        lastUpdated: new Date().toISOString(),
        sources: ['Mock Database', 'Recruiting Data', 'Performance Stats']
      }
    });

  } catch (error) {
    console.error('GAR ranking error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get rankings by position
router.get('/position/:position', async (req, res) => {
  try {
    const { position } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Filter athletes by position from mock database
    const athletes = (mockDB.players || [])
      .filter(player => player.position === position.toUpperCase())
      .slice(0, limit);

    const rankedAthletes = athletes.map((athlete, index) => ({
      ...athlete,
      ranking: index + 1,
      garBreakdown: calculateEnhancedGAR(athlete).breakdown
    }));

    res.json({
      success: true,
      position,
      athletes: rankedAthletes,
      total: rankedAthletes.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get top athletes across all categories
router.get('/top-athletes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    // Get all athletes from mock database, sort by GAR score
    const athletes = (mockDB.players || [])
      .sort((a, b) => b.garScore - a.garScore)
      .slice(0, limit);

    const rankedAthletes = athletes.map((athlete, index) => ({
      ...athlete,
      ranking: index + 1,
      garBreakdown: calculateEnhancedGAR(athlete).breakdown
    }));

    res.json({
      success: true,
      athletes: rankedAthletes,
      total: rankedAthletes.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update athlete GAR score
router.put('/update-gar/:id', authMiddleware, async (req, res) => {
  try {
    // Find athlete in mock database
    const athlete = (mockDB.players || []).find(p => p._id === req.params.id);
    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const garData = calculateEnhancedGAR(athlete);
    athlete.garScore = garData.total;
    athlete.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      athlete: {
        ...athlete,
        garBreakdown: garData.breakdown
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== DATA SCRAPING ROUTES =====

// Start data scraping job
router.post('/scrape-athlete', authMiddleware, async (req, res) => {
  try {
    const { athleteName, options = {} } = req.body;

    if (!athleteName) {
      return res.status(400).json({ message: 'Athlete name is required' });
    }

    const jobId = await jobProcessor.addScrapingJob(athleteName, options);

    // Update user stats for data collection
    achievementSystem.updateUserStats(req.user?.id || 'anonymous', {
      athletes_scraped: (achievementSystem.getUserStats(req.user?.id || 'anonymous').athletes_scraped || 0) + 1
    });

    res.json({
      success: true,
      jobId,
      message: 'Data scraping job started',
      statusUrl: `/api/rankings/job-status/${jobId}`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get job status
router.get('/job-status/:jobId', async (req, res) => {
  try {
    const status = jobProcessor.getJobStatus(req.params.jobId);

    if (status.error) {
      return res.status(404).json(status);
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Batch scraping
router.post('/scrape-batch', authMiddleware, async (req, res) => {
  try {
    const { athletes, options = {} } = req.body;

    if (!Array.isArray(athletes) || athletes.length === 0) {
      return res.status(400).json({ message: 'Athletes array is required' });
    }

    const jobIds = await jobProcessor.addBatchScrapingJobs(athletes, options);

    res.json({
      success: true,
      jobIds,
      message: `Started ${jobIds.length} scraping jobs`,
      statusUrls: jobIds.map(id => `/api/rankings/job-status/${id}`)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== ACHIEVEMENT ROUTES =====

// Get user achievements
router.get('/achievements/:userId?', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const achievements = achievementSystem.getUserAchievements(userId);
    const stats = achievementSystem.getUserStats(userId);

    res.json({
      success: true,
      achievements,
      stats,
      progress: achievementSystem.getAllAchievementsWithProgress(userId)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboards
router.get('/leaderboards/:type?', async (req, res) => {
  try {
    const type = req.params.type || 'points';
    const limit = parseInt(req.query.limit) || 50;

    const leaderboard = achievementSystem.getLeaderboard(type, limit);

    res.json({
      success: true,
      type,
      leaderboard,
      userRank: req.user?.id ? achievementSystem.getUserRank(req.user?.id, type) : null
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== ANALYTICS ROUTES =====

// Get athlete analytics
router.get('/analytics/:athleteId', async (req, res) => {
  try {
    const analytics = analyticsService.getAthleteAnalytics(req.params.athleteId);

    if (!analytics) {
      return res.status(404).json({ message: 'Analytics not found for this athlete' });
    }

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get analytics summary
router.get('/analytics-summary', async (req, res) => {
  try {
    const summary = analyticsService.getAnalyticsSummary();

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Calculate athlete analytics
router.post('/calculate-analytics/:athleteId', async (req, res) => {
  try {
    const athlete = (mockDB.players || []).find(p => p._id === req.params.athleteId);

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const analytics = analyticsService.calculateAthleteAnalytics(athlete);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== ADMIN ROUTES =====

// Admin dashboard
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!adminService.verifyAdminAccess(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const dashboard = await adminService.getSystemDashboard();

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin job management
router.post('/admin/jobs/:action', authMiddleware, async (req, res) => {
  try {
    if (!adminService.verifyAdminAccess(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await adminService.manageJobs(req.params.action, req.body.jobId, req.body);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin ranking management
router.post('/admin/rankings/:action', authMiddleware, async (req, res) => {
  try {
    if (!adminService.verifyAdminAccess(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await adminService.manageRankings(req.params.action, req.body);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin user management
router.post('/admin/users/:action', authMiddleware, async (req, res) => {
  try {
    if (!adminService.verifyAdminAccess(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await adminService.manageUsers(req.params.action, req.body);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin maintenance
router.post('/admin/maintenance/:action', authMiddleware, async (req, res) => {
  try {
    if (!adminService.verifyAdminAccess(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await adminService.performMaintenance(req.params.action, req.body);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin audit log
router.get('/admin/audit', authMiddleware, async (req, res) => {
  try {
    if (!adminService.verifyAdminAccess(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const auditLog = adminService.getAuditLog(req.query);

    res.json({
      success: true,
      auditLog
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin data export
router.get('/admin/export/:type/:format?', authMiddleware, async (req, res) => {
  try {
    if (!adminService.verifyAdminAccess(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await adminService.exportData(req.params.type, req.params.format);

    if (result.error) {
      return res.status(400).json(result);
    }

    // Set appropriate headers for file download
    const fileName = `athleteai_${req.params.type}_${new Date().toISOString().split('T')[0]}.${req.params.format || 'json'}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', req.params.format === 'csv' ? 'text/csv' : 'application/json');

    res.send(req.params.format === 'json' ? JSON.stringify(result.data, null, 2) : result.data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== REAL-TIME ROUTES =====

// Get real-time stats
router.get('/realtime/stats', async (req, res) => {
  try {
    const stats = global.realTimeService ? global.realTimeService.getStats() : {
      totalConnections: 0,
      authenticatedUsers: 0,
      totalSubscriptions: 0,
      topicsCount: 0
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== DATA VALIDATION ROUTES =====

// Validate athlete data
router.post('/validate-athlete', async (req, res) => {
  try {
    const { athleteData } = req.body;

    if (!athleteData) {
      return res.status(400).json({ message: 'Athlete data is required' });
    }

    const validation = dataValidator.validateAthleteData(athleteData);

    res.json({
      success: true,
      validation
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Batch validate athletes
router.post('/validate-batch', async (req, res) => {
  try {
    const { athletes } = req.body;

    if (!Array.isArray(athletes)) {
      return res.status(400).json({ message: 'Athletes array is required' });
    }

    const result = dataValidator.validateBatchAthletes(athletes);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get data quality score
router.post('/data-quality', async (req, res) => {
  try {
    const { athleteData } = req.body;

    if (!athleteData) {
      return res.status(400).json({ message: 'Athlete data is required' });
    }

    const qualityScore = dataValidator.calculateDataQualityScore(athleteData);

    res.json({
      success: true,
      qualityScore
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
