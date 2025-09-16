const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput, validateCoachQuestion } = require('../middleware/validation');
const standaloneFootballCoach = require('../services/standaloneFootballCoach');

// Standalone AI Football Coach endpoint
router.post('/ask', authMiddleware.verifyToken, sanitizeInput, validateCoachQuestion, async (req, res) => {
  try {
    const { question, athleteId, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Get athlete context if provided
    let athleteContext = {};
    if (athleteId) {
      // You could fetch athlete data from database here
      athleteContext = {
        athleteId,
        ...context
      };
    }

    // Process question with standalone football coach
    const response = await standaloneFootballCoach.processQuestion(question, athleteId, athleteContext);

    res.json({
      success: true,
      data: response,
      metadata: {
        processingTime: new Date() - new Date(response.timestamp),
        coachVersion: '2.0.0'
      }
    });

  } catch (error) {
    console.error('Error processing football coach question:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your question',
      error: error.message
    });
  }
});

// Get football coach statistics
router.get('/stats', authMiddleware.verifyToken, async (req, res) => {
  try {
    const stats = standaloneFootballCoach.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting coach stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get coach statistics',
      details: error.message
    });
  }
});

// Get available drills for a position
router.get('/drills/:position', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { position } = req.params;
    const { level = 'basic' } = req.query;

    let drills = [];

    switch (position.toLowerCase()) {
      case 'quarterback':
      case 'qb':
        drills = standaloneFootballCoach.getQuarterbackDrills(level);
        break;
      case 'runningback':
      case 'rb':
        drills = standaloneFootballCoach.getRunningBackDrills(level);
        break;
      case 'widereceiver':
      case 'wr':
        drills = standaloneFootballCoach.getWideReceiverDrills(level);
        break;
      case 'defense':
      case 'defensive':
        drills = standaloneFootballCoach.getDefenseDrills(level);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid position. Try: quarterback, runningback, widereceiver, defense'
        });
    }

    res.json({
      success: true,
      data: {
        position,
        level,
        drills
      }
    });

  } catch (error) {
    console.error('Error getting drills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drills',
      details: error.message
    });
  }
});

// Get video recommendations for a position
router.get('/videos/:position', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { position } = req.params;

    let videos = [];

    switch (position.toLowerCase()) {
      case 'quarterback':
      case 'qb':
        videos = standaloneFootballCoach.getQuarterbackVideos();
        break;
      case 'runningback':
      case 'rb':
        videos = standaloneFootballCoach.getRunningBackVideos();
        break;
      case 'widereceiver':
      case 'wr':
        videos = standaloneFootballCoach.getWideReceiverVideos();
        break;
      case 'defense':
      case 'defensive':
        videos = standaloneFootballCoach.getDefenseVideos();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid position. Try: quarterback, runningback, widereceiver, defense'
        });
    }

    res.json({
      success: true,
      data: {
        position,
        videos
      }
    });

  } catch (error) {
    console.error('Error getting videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get videos',
      details: error.message
    });
  }
});

// Get player profile insights
router.get('/profile/:athleteId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    // This would typically check if the requesting user has permission to view this profile
    const profile = standaloneFootballCoach.getPlayerProfile(athleteId);

    res.json({
      success: true,
      data: {
        athleteId,
        profile: {
          experience: profile.experience,
          position: profile.position,
          skillLevel: profile.skillLevel,
          interests: profile.interests,
          questionCount: profile.questionCount,
          lastInteraction: profile.lastInteraction
        }
      }
    });

  } catch (error) {
    console.error('Error getting player profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get player profile',
      details: error.message
    });
  }
});

// Clear conversation history (GDPR compliance)
router.delete('/history/:athleteId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    // In production, verify user has permission to clear this history
    standaloneFootballCoach.clearHistory(athleteId);

    res.json({
      success: true,
      message: 'Conversation history cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation history',
      details: error.message
    });
  }
});

// Get football knowledge base overview
router.get('/knowledge', authMiddleware.verifyToken, async (req, res) => {
  try {
    const knowledgeBase = standaloneFootballCoach.knowledgeBase;

    res.json({
      success: true,
      data: {
        positions: Object.keys(knowledgeBase.positions),
        strategies: {
          offense: knowledgeBase.strategies.offense,
          defense: knowledgeBase.strategies.defense
        },
        training: knowledgeBase.training,
        version: '2.0.0'
      }
    });

  } catch (error) {
    console.error('Error getting knowledge base:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge base',
      details: error.message
    });
  }
});

module.exports = router;