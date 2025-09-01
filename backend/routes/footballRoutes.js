const express = require('express');
const router = express.Router();
const { validateAICoachQuestion, sanitizeInput } = require('../middleware/validation');

// Football strategies and techniques data
const footballData = {
  defenses: {
    'cover-2': {
      name: 'Cover 2 Defense',
      description: 'A zone defense where two safeties split the field into deep halves, each responsible for half of the deep zone.',
      keyPoints: [
        'Two deep safeties provide deep coverage',
        'Cornerbacks play man-to-man underneath',
        'Linebackers cover middle zones',
        'Effective against vertical passing attacks'
      ],
      videoUrl: 'https://example.com/videos/cover2.mp4'
    },
    'man-to-man': {
      name: 'Man-to-Man Defense',
      description: 'Each defensive player is assigned to cover a specific offensive player.',
      keyPoints: [
        'Direct player matchup',
        'Requires athletic defenders',
        'Vulnerable to double moves',
        'Strong against short routes'
      ]
    }
  },
  offenses: {
    'west-coast': {
      name: 'West Coast Offense',
      description: 'An offensive scheme that emphasizes short, horizontal passing routes to control the ball and methodically move down the field.',
      keyPoints: [
        'Short, precise passes',
        'Horizontal stretching of defense',
        'High completion percentage',
        'Time management'
      ],
      videoUrl: 'https://example.com/videos/westcoast.mp4'
    }
  },
  drills: {
    'quarterback-footwork': {
      name: 'Quarterback Footwork Drills',
      description: 'Essential drills for improving quarterback mobility, accuracy, and decision-making in the pocket.',
      exercises: [
        'Drop-back drills',
        'Pocket movement',
        'Throwing on the run',
        'Footwork patterns'
      ],
      videoUrl: 'https://example.com/videos/qbdrills.mp4'
    }
  }
};

// Get all football strategies
router.get('/strategies', (req, res) => {
  res.json({
    success: true,
    data: footballData
  });
});

// Get specific defense strategy
router.get('/defenses/:type', (req, res) => {
  const { type } = req.params;
  const defense = footballData.defenses[type];

  if (!defense) {
    return res.status(404).json({
      success: false,
      message: 'Defense strategy not found'
    });
  }

  res.json({
    success: true,
    data: defense
  });
});

// Get specific offense strategy
router.get('/offenses/:type', (req, res) => {
  const { type } = req.params;
  const offense = footballData.offenses[type];

  if (!offense) {
    return res.status(404).json({
      success: false,
      message: 'Offense strategy not found'
    });
  }

  res.json({
    success: true,
    data: offense
  });
});

// Get specific drill
router.get('/drills/:type', (req, res) => {
  const { type } = req.params;
  const drill = footballData.drills[type];

  if (!drill) {
    return res.status(404).json({
      success: false,
      message: 'Drill not found'
    });
  }

  res.json({
    success: true,
    data: drill
  });
});

// AI Coach endpoint for processing questions
router.post('/coach', sanitizeInput, validateAICoachQuestion, (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({
      success: false,
      message: 'Question is required'
    });
  }

  // Simple keyword-based response system
  let response = '';
  let videoSuggestion = null;

  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes('cover 2') || lowerQuestion.includes('cover-2')) {
    response = 'The Cover 2 defense is a zone defense where two safeties split the field into deep halves. Each safety is responsible for half of the deep zone, while cornerbacks play man-to-man underneath.';
    videoSuggestion = footballData.defenses['cover-2'];
  } else if (lowerQuestion.includes('west coast')) {
    response = 'The West Coast offense emphasizes short, precise passing routes to methodically advance down the field. It focuses on timing, accuracy, and controlling the ball.';
    videoSuggestion = footballData.offenses['west-coast'];
  } else if (lowerQuestion.includes('quarterback') && lowerQuestion.includes('drill')) {
    response = 'Quarterback drills focus on footwork, accuracy, and decision-making. Key areas include drop-back mechanics, throwing motion, and reading defenses.';
    videoSuggestion = footballData.drills['quarterback-footwork'];
  } else if (lowerQuestion.includes('defense') && lowerQuestion.includes('read')) {
    response = 'Reading a defense starts by identifying the formation, then focusing on key players like linebackers and safeties. Look for blitz indicators and coverage tells.';
  } else if (lowerQuestion.includes('man-to-man')) {
    response = 'Man-to-man defense assigns each defender to cover a specific offensive player. It requires athletic defenders but can be vulnerable to double moves and mismatches.';
  } else {
    response = 'I can help with football strategies, defensive schemes, offensive plays, and training drills. Try asking about specific techniques like "Cover 2 defense" or "quarterback drills".';
  }

  res.json({
    success: true,
    response,
    videoSuggestion,
    timestamp: new Date().toISOString()
  });
});

// Get video playlist
router.get('/videos', (req, res) => {
  const videos = [
    {
      id: 'cover2',
      title: 'Cover 2 Defense Explanation',
      description: 'Learn how the Cover 2 defense works with two deep safeties splitting the field into halves.',
      thumbnail: 'https://example.com/thumbnails/cover2.jpg',
      url: 'https://example.com/videos/cover2.mp4'
    },
    {
      id: 'westcoast',
      title: 'West Coast Offense Basics',
      description: 'The West Coast offense emphasizes short, horizontal passing routes to stretch defenses horizontally.',
      thumbnail: 'https://example.com/thumbnails/westcoast.jpg',
      url: 'https://example.com/videos/westcoast.mp4'
    },
    {
      id: 'qbdrills',
      title: 'Quarterback Footwork Drills',
      description: 'Improve your quarterback skills with these essential footwork drills for better pocket presence.',
      thumbnail: 'https://example.com/thumbnails/qbdrills.jpg',
      url: 'https://example.com/videos/qbdrills.mp4'
    }
  ];

  res.json({
    success: true,
    data: videos
  });
});

module.exports = router;
