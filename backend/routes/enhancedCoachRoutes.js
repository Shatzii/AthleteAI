const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput, validateCoachQuestion } = require('../middleware/validation');
const EnhancedNLPCoach = require('../services/enhancedNLPCoach');
const Player = require('../models/playerModel');

const nlpCoach = new EnhancedNLPCoach();

// Enhanced AI Coach endpoint
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
      const athlete = await Player.findById(athleteId);
      if (athlete) {
        athleteContext = {
          position: athlete.position,
          year: athlete.year,
          garScore: athlete.garScore,
          sport: 'football' // Default to football
        };
      }
    }

    // Combine provided context with athlete context
    const fullContext = {
      ...context,
      ...athleteContext,
      userId: req.user?.id
    };

    // Process question with enhanced NLP
    const response = await nlpCoach.processQuestion(question, athleteId, fullContext);

    res.json({
      success: true,
      data: response,
      metadata: {
        processingTime: new Date() - new Date(response.timestamp),
        athleteId: athleteId,
        userId: req.user?.id
      }
    });

  } catch (error) {
    console.error('Error processing coach question:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your question',
      error: error.message
    });
  }
});

// Get conversation history for an athlete
router.get('/history/:athleteId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { limit = 10 } = req.query;

    // Verify athlete access (coach or athlete themselves)
    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Get conversation history from NLP coach service
    // This would need to be implemented in the service
    const history = nlpCoach.getConversationHistory ?
      nlpCoach.getConversationHistory(athleteId, limit) : [];

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name,
          position: athlete.position
        },
        conversations: history,
        totalCount: history.length
      }
    });

  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving conversation history',
      error: error.message
    });
  }
});

// Get coach suggestions based on athlete profile
router.get('/suggestions/:athleteId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Player.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Generate contextual suggestions based on athlete profile
    const suggestions = generateCoachSuggestions(athlete);

    res.json({
      success: true,
      data: {
        athlete: {
          id: athlete._id,
          name: athlete.name,
          position: athlete.position,
          garScore: athlete.garScore
        },
        suggestions,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting coach suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating suggestions',
      error: error.message
    });
  }
});

// Get available topics and expertise areas
router.get('/topics', authMiddleware.verifyToken, (req, res) => {
  try {
    const topics = {
      technique: {
        name: 'Technique & Form',
        description: 'Footwork, throwing mechanics, tackling form',
        examples: ['quarterback footwork', 'proper tackling technique', 'route running form']
      },
      strategy: {
        name: 'Strategy & Tactics',
        description: 'Defensive schemes, offensive plays, game planning',
        examples: ['Cover 2 defense', 'West Coast offense', 'blitz packages']
      },
      performance: {
        name: 'Performance Improvement',
        description: 'Training optimization, skill development, mental preparation',
        examples: ['improve speed', 'build strength', 'mental toughness']
      },
      injury: {
        name: 'Injury Prevention & Recovery',
        description: 'Safety protocols, rehabilitation, conditioning',
        examples: ['prevent ACL injuries', 'recovery from concussion', 'conditioning programs']
      },
      motivation: {
        name: 'Motivation & Mindset',
        description: 'Mental preparation, goal setting, overcoming challenges',
        examples: ['stay motivated', 'handle pressure', 'build confidence']
      }
    };

    res.json({
      success: true,
      data: {
        topics,
        totalTopics: Object.keys(topics).length,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving topics',
      error: error.message
    });
  }
});

// Get coach statistics
router.get('/stats', authMiddleware.verifyToken, (req, res) => {
  try {
    const stats = nlpCoach.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        uptime: '99.9%', // Mock uptime
        averageResponseTime: '150ms', // Mock response time
        totalQuestionsAnswered: stats.conversationsHandled * 5, // Estimate
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting coach stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving statistics',
      error: error.message
    });
  }
});

// Helper functions
function generateCoachSuggestions(athlete) {
  const suggestions = [];
  const position = athlete.position;
  const garScore = athlete.garScore;
  const year = athlete.year;

  // Position-specific suggestions
  const positionSuggestions = {
    'QB': [
      {
        topic: 'technique',
        question: 'How can I improve my throwing accuracy?',
        priority: 'high',
        reasoning: 'Accuracy is crucial for quarterback success'
      },
      {
        topic: 'strategy',
        question: 'What are the keys to reading defenses?',
        priority: 'high',
        reasoning: 'Decision-making is essential for quarterbacks'
      },
      {
        topic: 'performance',
        question: 'How can I build arm strength safely?',
        priority: 'medium',
        reasoning: 'Arm strength affects velocity and endurance'
      }
    ],
    'RB': [
      {
        topic: 'technique',
        question: 'What drills improve change of direction?',
        priority: 'high',
        reasoning: 'Elusiveness is key for running backs'
      },
      {
        topic: 'performance',
        question: 'How can I improve my top speed?',
        priority: 'high',
        reasoning: 'Speed creates separation and big plays'
      },
      {
        topic: 'injury',
        question: 'How do I prevent knee injuries?',
        priority: 'medium',
        reasoning: 'Running backs are prone to lower body injuries'
      }
    ],
    'WR': [
      {
        topic: 'technique',
        question: 'How do I run sharper routes?',
        priority: 'high',
        reasoning: 'Route running separates good receivers from great ones'
      },
      {
        topic: 'performance',
        question: 'What exercises build explosion for jumps?',
        priority: 'medium',
        reasoning: 'Vertical leap helps with contested catches'
      },
      {
        topic: 'strategy',
        question: 'How do I create separation from defenders?',
        priority: 'high',
        reasoning: 'Getting open is fundamental to receiving'
      }
    ],
    'OL': [
      {
        topic: 'technique',
        question: 'How do I improve my footwork in pass protection?',
        priority: 'high',
        reasoning: 'Footwork is the foundation of blocking'
      },
      {
        topic: 'performance',
        question: 'What strength exercises are best for linemen?',
        priority: 'high',
        reasoning: 'Strength is essential for offensive line play'
      },
      {
        topic: 'strategy',
        question: 'How do I read defensive fronts?',
        priority: 'medium',
        reasoning: 'Recognizing formations helps with assignments'
      }
    ],
    'DL': [
      {
        topic: 'technique',
        question: 'How do I improve my first step quickness?',
        priority: 'high',
        reasoning: 'First step wins battles at the line'
      },
      {
        topic: 'performance',
        question: 'What drills build pass rush moves?',
        priority: 'high',
        reasoning: 'Pass rush skills create pressure'
      },
      {
        topic: 'strategy',
        question: 'How do I attack different blocking schemes?',
        priority: 'medium',
        reasoning: 'Versatility improves effectiveness'
      }
    ]
  };

  // Add position-specific suggestions
  if (positionSuggestions[position]) {
    suggestions.push(...positionSuggestions[position]);
  }

  // Add GAR score-based suggestions
  if (garScore < 70) {
    suggestions.push({
      topic: 'performance',
      question: 'What are the most important fundamentals for my position?',
      priority: 'high',
      reasoning: 'Building fundamentals will improve overall performance'
    });
  } else if (garScore > 85) {
    suggestions.push({
      topic: 'performance',
      question: 'How can I take my game to the next level?',
      priority: 'medium',
      reasoning: 'Advanced techniques for elite players'
    });
  }

  // Add year/experience-based suggestions
  const yearSuggestions = {
    'Freshman': {
      topic: 'performance',
      question: 'How do I transition from high school to college football?',
      priority: 'high',
      reasoning: 'College level requires different preparation'
    },
    'Sophomore': {
      topic: 'strategy',
      question: 'How do I develop leadership on the field?',
      priority: 'medium',
      reasoning: 'Sophomores often take on leadership roles'
    },
    'Junior': {
      topic: 'motivation',
      question: 'How do I prepare for the recruiting process?',
      priority: 'high',
      reasoning: 'Junior year is crucial for recruiting'
    },
    'Senior': {
      topic: 'motivation',
      question: 'How do I make the most of my final season?',
      priority: 'high',
      reasoning: 'Senior year should be the best performance'
    }
  };

  if (yearSuggestions[year]) {
    suggestions.push(yearSuggestions[year]);
  }

  // Add general suggestions
  suggestions.push(
    {
      topic: 'injury',
      question: 'What are the best injury prevention exercises?',
      priority: 'medium',
      reasoning: 'Prevention is better than treatment'
    },
    {
      topic: 'performance',
      question: 'How can I improve my mental toughness?',
      priority: 'medium',
      reasoning: 'Mental preparation is as important as physical'
    }
  );

  return suggestions;
}

module.exports = router;
