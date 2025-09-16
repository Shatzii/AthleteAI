const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const achievementSystem = require('../services/achievementSystem');

// Initialize virtual rewards catalog
achievementSystem.initializeVirtualRewards();

// GET /api/achievements/user/:userId
// Get user achievements and stats
router.get('/user/:userId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const achievements = achievementSystem.getUserAchievements(userId);
    const stats = achievementSystem.getUserStats(userId);
    const rewards = achievementSystem.getUserRewards(userId);

    res.json({
      success: true,
      data: {
        achievements,
        stats,
        rewards
      }
    });

  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user achievements',
      details: error.message
    });
  }
});

// GET /api/achievements/leaderboard/:type
// Get leaderboard for specific achievement type
router.get('/leaderboard/:type', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit } = req.query;

    const leaderboard = achievementSystem.getLeaderboard(type, parseInt(limit) || 50);

    res.json({
      success: true,
      data: leaderboard
    });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      details: error.message
    });
  }
});

// POST /api/achievements/challenges
// Create a dynamic challenge
router.post('/challenges', authMiddleware.verifyToken, async (req, res) => {
  try {
    const challengeData = req.body;
    challengeData.createdBy = req.user?.id;

    const challenge = achievementSystem.createDynamicChallenge(challengeData);

    res.json({
      success: true,
      data: challenge
    });

  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create challenge',
      details: error.message
    });
  }
});

// GET /api/achievements/challenges
// Get active dynamic challenges
router.get('/challenges', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { category, difficulty, type } = req.query;

    const challenges = achievementSystem.getActiveChallenges({
      category,
      difficulty,
      type
    });

    res.json({
      success: true,
      data: challenges
    });

  } catch (error) {
    console.error('Error getting challenges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get challenges',
      details: error.message
    });
  }
});

// POST /api/achievements/challenges/:challengeId/join
// Join a dynamic challenge
router.post('/challenges/:challengeId/join', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user?.id;

    const challenge = achievementSystem.joinDynamicChallenge(challengeId, userId);

    res.json({
      success: true,
      data: challenge
    });

  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join challenge',
      details: error.message
    });
  }
});

// POST /api/achievements/challenges/:challengeId/progress
// Update challenge progress
router.post('/challenges/:challengeId/progress', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { progress, completedTask, description } = req.body;
    const userId = req.user?.id;

    const participant = achievementSystem.updateChallengeProgress(challengeId, userId, {
      progress,
      completedTask,
      description
    });

    res.json({
      success: true,
      data: participant
    });

  } catch (error) {
    console.error('Error updating challenge progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update challenge progress',
      details: error.message
    });
  }
});

// POST /api/achievements/competitions
// Create a seasonal competition
router.post('/competitions', authMiddleware.verifyToken, async (req, res) => {
  try {
    const competitionData = req.body;

    const competition = achievementSystem.createSeasonalCompetition(competitionData);

    res.json({
      success: true,
      data: competition
    });

  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create competition',
      details: error.message
    });
  }
});

// GET /api/achievements/competitions
// Get seasonal competitions
router.get('/competitions', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { season, year } = req.query;

    const competitions = achievementSystem.getSeasonalCompetitions(season, year);

    res.json({
      success: true,
      data: competitions
    });

  } catch (error) {
    console.error('Error getting competitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get competitions',
      details: error.message
    });
  }
});

// POST /api/achievements/competitions/:competitionId/join
// Join a seasonal competition
router.post('/competitions/:competitionId/join', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { category } = req.body;
    const userId = req.user?.id;

    const competition = achievementSystem.joinSeasonalCompetition(competitionId, userId, category);

    res.json({
      success: true,
      data: competition
    });

  } catch (error) {
    console.error('Error joining competition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join competition',
      details: error.message
    });
  }
});

// POST /api/achievements/competitions/:competitionId/score
// Update competition score
router.post('/competitions/:competitionId/score', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { scoreIncrement, activityType } = req.body;
    const userId = req.user?.id;

    const participant = achievementSystem.updateCompetitionScore(competitionId, userId, scoreIncrement, activityType);

    res.json({
      success: true,
      data: participant
    });

  } catch (error) {
    console.error('Error updating competition score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update competition score',
      details: error.message
    });
  }
});

// GET /api/achievements/rewards/catalog
// Get virtual rewards catalog
router.get('/rewards/catalog', authMiddleware.verifyToken, async (req, res) => {
  try {
    const catalog = achievementSystem.getVirtualRewardsCatalog();

    res.json({
      success: true,
      data: catalog
    });

  } catch (error) {
    console.error('Error getting rewards catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rewards catalog',
      details: error.message
    });
  }
});

// POST /api/achievements/rewards/award
// Award virtual reward to user
router.post('/rewards/award', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { userId, rewardType, rewardId } = req.body;

    const reward = achievementSystem.awardVirtualReward(userId, rewardType, rewardId);

    res.json({
      success: true,
      data: reward
    });

  } catch (error) {
    console.error('Error awarding reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award reward',
      details: error.message
    });
  }
});

// GET /api/achievements/rewards/user/:userId
// Get user's virtual rewards
router.get('/rewards/user/:userId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const rewards = achievementSystem.getUserRewards(userId);

    res.json({
      success: true,
      data: rewards
    });

  } catch (error) {
    console.error('Error getting user rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user rewards',
      details: error.message
    });
  }
});

// POST /api/achievements/stats/update
// Update user achievement stats
router.post('/stats/update', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = req.user?.id;

    const stats = achievementSystem.updateUserStats(userId, updates);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user stats',
      details: error.message
    });
  }
});

// GET /api/achievements/stats
// Get achievement system statistics
router.get('/stats', authMiddleware.verifyToken, async (req, res) => {
  try {
    const stats = achievementSystem.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting achievement stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievement statistics',
      details: error.message
    });
  }
});

module.exports = router;