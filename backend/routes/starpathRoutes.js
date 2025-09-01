const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Sample StarPath data - in production, this would come from a database
const SAMPLE_STARPATH_DATA = [
  {
    id: 'ball_control',
    name: 'Ball Control Mastery',
    description: 'Master fundamental ball handling and control techniques',
    currentLevel: 3,
    maxLevel: 5,
    totalXp: 750,
    requiredXp: 1000,
    isUnlocked: true,
    category: 'technical',
    prerequisites: [],
    rewards: ['First Touch Badge', '+10 Technical Rating'],
  },
  {
    id: 'agility_training',
    name: 'Agility & Speed',
    description: 'Develop explosive movement and directional changes',
    currentLevel: 2,
    maxLevel: 5,
    totalXp: 450,
    requiredXp: 600,
    isUnlocked: true,
    category: 'physical',
    prerequisites: [],
    rewards: ['Speed Demon Badge', '+8 Athleticism Rating'],
  },
  {
    id: 'game_vision',
    name: 'Game Vision',
    description: 'Enhance field awareness and decision-making',
    currentLevel: 1,
    maxLevel: 5,
    totalXp: 200,
    requiredXp: 400,
    isUnlocked: true,
    category: 'tactical',
    prerequisites: [],
    rewards: ['Visionary Badge', '+12 Game Awareness'],
  },
  {
    id: 'mental_toughness',
    name: 'Mental Resilience',
    description: 'Build confidence and focus under pressure',
    currentLevel: 0,
    maxLevel: 5,
    totalXp: 0,
    requiredXp: 300,
    isUnlocked: false,
    category: 'mental',
    prerequisites: ['game_vision'],
    rewards: ['Unshakeable Badge', '+15 Consistency'],
  },
  {
    id: 'advanced_techniques',
    name: 'Advanced Techniques',
    description: 'Master elite-level skills and movements',
    currentLevel: 0,
    maxLevel: 5,
    totalXp: 0,
    requiredXp: 800,
    isUnlocked: false,
    category: 'technical',
    prerequisites: ['ball_control'],
    rewards: ['Elite Technician Badge', '+20 Technical Rating'],
  },
  {
    id: 'leadership',
    name: 'Team Leadership',
    description: 'Develop communication and leadership skills',
    currentLevel: 0,
    maxLevel: 5,
    totalXp: 0,
    requiredXp: 500,
    isUnlocked: false,
    category: 'mental',
    prerequisites: ['mental_toughness', 'game_vision'],
    rewards: ['Captain Badge', '+25 Leadership Rating'],
  },
];

// Get StarPath route data
router.get('/route', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';

    // In production, fetch from database based on userId
    // For now, return sample data
    res.json({
      success: true,
      skillNodes: SAMPLE_STARPATH_DATA,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching StarPath route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch StarPath data',
      error: error.message
    });
  }
});

// Get user progress data
router.get('/progress', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';

    // In production, fetch from database based on userId
    // For now, return sample progress data
    const progress = {
      totalXp: 1400,
      completedNodes: 3,
      currentTier: 2,
      achievements: 8,
      userId: userId
    };

    res.json({
      success: true,
      progress: progress
    });
  } catch (error) {
    console.error('Error fetching StarPath progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress data',
      error: error.message
    });
  }
});

// Start training session
router.post('/train', auth.verifyToken, async (req, res) => {
  try {
    const { nodeId, activity } = req.body;
    const userId = req.user?.id || 'demo-user';

    if (!nodeId) {
      return res.status(400).json({
        success: false,
        message: 'Node ID is required'
      });
    }

    // In production, update database with training session
    // For now, simulate training completion
    const xpGained = 50; // XP gained from training

    res.json({
      success: true,
      message: 'Training session completed',
      xpGained: xpGained,
      nodeId: nodeId,
      activity: activity,
      userId: userId
    });
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start training session',
      error: error.message
    });
  }
});

// Update skill level
router.post('/level-up', auth.verifyToken, async (req, res) => {
  try {
    const { nodeId } = req.body;
    const userId = req.user?.id || 'demo-user';

    if (!nodeId) {
      return res.status(400).json({
        success: false,
        message: 'Node ID is required'
      });
    }

    // Find the node in sample data
    const node = SAMPLE_STARPATH_DATA.find(n => n.id === nodeId);
    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Skill node not found'
      });
    }

    // Check if node can be leveled up
    if (node.currentLevel >= node.maxLevel) {
      return res.status(400).json({
        success: false,
        message: 'Skill is already at maximum level'
      });
    }

    if (node.totalXp < node.requiredXp) {
      return res.status(400).json({
        success: false,
        message: 'Not enough XP to level up'
      });
    }

    // In production, update database
    // For now, simulate level up
    const newLevel = node.currentLevel + 1;

    res.json({
      success: true,
      message: 'Skill leveled up successfully',
      nodeId: nodeId,
      newLevel: newLevel,
      userId: userId
    });
  } catch (error) {
    console.error('Error leveling up skill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to level up skill',
      error: error.message
    });
  }
});

// Get achievements
router.get('/achievements', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';

    // Sample achievements data
    const achievements = [
      {
        id: 'first_training',
        name: 'First Steps',
        description: 'Complete your first training session',
        icon: '🎯',
        unlockedAt: new Date('2024-01-15'),
        rarity: 'common'
      },
      {
        id: 'skill_master',
        name: 'Skill Master',
        description: 'Reach level 5 in any skill',
        icon: '⭐',
        unlockedAt: new Date('2024-02-01'),
        rarity: 'rare'
      },
      {
        id: 'consistency_king',
        name: 'Consistency King',
        description: 'Train for 30 consecutive days',
        icon: '👑',
        unlockedAt: new Date('2024-02-15'),
        rarity: 'epic'
      }
    ];

    res.json({
      success: true,
      achievements: achievements,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard', auth.verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Sample leaderboard data
    const leaderboard = [
      { rank: 1, username: 'AthletePro', totalXp: 2500, tier: 3 },
      { rank: 2, username: 'SpeedDemon', totalXp: 2200, tier: 3 },
      { rank: 3, username: 'BallMaster', totalXp: 2100, tier: 2 },
      { rank: 4, username: 'Visionary', totalXp: 1900, tier: 2 },
      { rank: 5, username: 'CurrentUser', totalXp: 1400, tier: 2 },
    ];

    res.json({
      success: true,
      leaderboard: leaderboard,
      limit: limit
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

module.exports = router;
