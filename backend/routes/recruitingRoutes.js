const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Sample recruiting data - in production, this would come from a database
const SAMPLE_MATCHES = [
  {
    id: 'match_001',
    schoolName: 'University of Excellence',
    schoolLogo: '/api/placeholder/60/60',
    program: 'Basketball',
    location: 'Springfield, IL',
    matchScore: 92,
    reasoning: 'Perfect match based on your athletic profile, academic performance, and basketball skills',
    tags: ['Division I', 'Academic Excellence', 'Championship Program'],
    coachName: 'Coach Johnson',
    coachAvatar: '/api/placeholder/40/40',
    insights: [
      'Your 3.8 GPA aligns perfectly with their academic standards',
      'Your vertical jump of 32" exceeds their average recruit profile',
      'Your leadership experience matches their team culture'
    ],
    programDetails: 'NCAA Division I Basketball Program',
    teamSize: 15,
    conference: 'Big Ten'
  },
  {
    id: 'match_002',
    schoolName: 'State University',
    schoolLogo: '/api/placeholder/60/60',
    program: 'Football',
    location: 'Columbus, OH',
    matchScore: 88,
    reasoning: 'Strong fit for your position and performance metrics',
    tags: ['Division I', 'Power 5', 'Scholarship Available'],
    coachName: 'Coach Williams',
    coachAvatar: '/api/placeholder/40/40',
    insights: [
      'Your 40-yard dash time of 4.6s is in their top recruit range',
      'Your bench press numbers exceed their position requirements',
      'Your academic profile qualifies for their merit scholarships'
    ],
    programDetails: 'NCAA Division I Football Program',
    teamSize: 120,
    conference: 'Big Ten'
  },
  {
    id: 'match_003',
    schoolName: 'Liberty College',
    schoolLogo: '/api/placeholder/60/60',
    program: 'Soccer',
    location: 'Lynchburg, VA',
    matchScore: 85,
    reasoning: 'Great cultural fit and competitive program for your skill level',
    tags: ['Division I', 'Christian College', 'Full Ride Potential'],
    coachName: 'Coach Martinez',
    coachAvatar: '/api/placeholder/40/40',
    insights: [
      'Your international experience aligns with their diverse team',
      'Your technical skills match their playing style',
      'Your character references are outstanding'
    ],
    programDetails: 'NCAA Division I Soccer Program',
    teamSize: 28,
    conference: 'Big South'
  }
];

const SAMPLE_CONVERSATIONS = [
  {
    id: 'conv_001',
    coachName: 'Coach Johnson',
    schoolName: 'University of Excellence',
    program: 'Basketball',
    coachAvatar: '/api/placeholder/40/40',
    lastMessage: 'Hi! I saw your profile and I\'m very interested in your potential...',
    timestamp: '2 hours ago',
    unread: 2
  },
  {
    id: 'conv_002',
    coachName: 'Coach Williams',
    schoolName: 'State University',
    program: 'Football',
    coachAvatar: '/api/placeholder/40/40',
    lastMessage: 'Thanks for your interest in our program. We\'d love to schedule a visit.',
    timestamp: '1 day ago',
    unread: 0
  },
  {
    id: 'conv_003',
    coachName: 'Coach Martinez',
    schoolName: 'Liberty College',
    program: 'Soccer',
    coachAvatar: '/api/placeholder/40/40',
    lastMessage: 'Your highlight tape is impressive. Let\'s discuss next steps.',
    timestamp: '3 days ago',
    unread: 1
  }
];

// Get AI-powered matches for a user
router.get('/matches', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || 'demo-user';
    const sport = req.query.sport;
    const division = req.query.division;
    const location = req.query.location;

    // In production, use AI algorithms to match based on:
    // - Player performance data (GAR scores, stats, videos)
    // - Academic profile (GPA, test scores, courses)
    // - Personal preferences (location, program size, etc.)
    // - Coach preferences and recruiting needs
    // - Historical success rates

    let filteredMatches = [...SAMPLE_MATCHES];

    if (sport) {
      filteredMatches = filteredMatches.filter(match =>
        match.program.toLowerCase().includes(sport.toLowerCase())
      );
    }

    if (division) {
      filteredMatches = filteredMatches.filter(match =>
        match.tags.some(tag => tag.toLowerCase().includes(division.toLowerCase()))
      );
    }

    if (location) {
      filteredMatches = filteredMatches.filter(match =>
        match.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    res.json({
      success: true,
      matches: filteredMatches,
      totalMatches: filteredMatches.length,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
});

// Get user conversations
router.get('/conversations', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || 'demo-user';

    // In production, fetch from database based on userId
    res.json({
      success: true,
      conversations: SAMPLE_CONVERSATIONS,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

// Send message to coach
router.post('/message', auth.verifyToken, async (req, res) => {
  try {
    const { coachId, message, conversationId } = req.body;
    const userId = req.user?.id || 'demo-user';

    if (!message || !coachId) {
      return res.status(400).json({
        success: false,
        message: 'Message and coach ID are required'
      });
    }

    // In production, save message to database and send notification to coach
    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: userId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Get recruiting analytics
router.get('/analytics', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || 'demo-user';

    // Sample analytics data - in production, calculate from real data
    const analytics = {
      totalMatches: 24,
      activeConversations: 8,
      offersReceived: 3,
      successRate: 75,
      averageResponseTime: '2.3 days',
      topPerformingSports: ['Basketball', 'Football'],
      geographicDistribution: {
        'Northeast': 8,
        'Southeast': 6,
        'Midwest': 5,
        'Southwest': 3,
        'West Coast': 2
      },
      divisionBreakdown: {
        'Division I': 18,
        'Division II': 4,
        'Division III': 2
      }
    };

    res.json({
      success: true,
      analytics: analytics,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Update match preferences
router.put('/preferences', auth.verifyToken, async (req, res) => {
  try {
    const { sport, division, location, academicFocus, budget } = req.body;
    const userId = req.user?.id || 'demo-user';

    // In production, save preferences to database and trigger new AI matching
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        sport,
        division,
        location,
        academicFocus,
        budget
      },
      userId: userId
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

// Get coach profiles
router.get('/coaches', auth.verifyToken, async (req, res) => {
  try {
    const sport = req.query.sport;
    const school = req.query.school;

    // Sample coach data
    const coaches = [
      {
        id: 'coach_001',
        name: 'Coach Johnson',
        school: 'University of Excellence',
        sport: 'Basketball',
        avatar: '/api/placeholder/100/100',
        bio: '15 years of college coaching experience, specializes in player development',
        contactInfo: {
          email: 'coach.johnson@university.edu',
          phone: '(555) 123-4567'
        },
        recruitingFocus: ['Point Guards', 'Shooting Guards'],
        successRate: 85
      },
      {
        id: 'coach_002',
        name: 'Coach Williams',
        school: 'State University',
        sport: 'Football',
        avatar: '/api/placeholder/100/100',
        bio: 'Former NFL player turned coach, focuses on fundamentals and character',
        contactInfo: {
          email: 'coach.williams@state.edu',
          phone: '(555) 234-5678'
        },
        recruitingFocus: ['Quarterbacks', 'Linebackers'],
        successRate: 78
      }
    ];

    let filteredCoaches = coaches;

    if (sport) {
      filteredCoaches = filteredCoaches.filter(coach =>
        coach.sport.toLowerCase() === sport.toLowerCase()
      );
    }

    if (school) {
      filteredCoaches = filteredCoaches.filter(coach =>
        coach.school.toLowerCase().includes(school.toLowerCase())
      );
    }

    res.json({
      success: true,
      coaches: filteredCoaches
    });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaches',
      error: error.message
    });
  }
});

// Schedule virtual visit
router.post('/visit', auth.verifyToken, async (req, res) => {
  try {
    const { coachId, date, time, visitType } = req.body;
    const userId = req.user?.id || 'demo-user';

    if (!coachId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Coach ID, date, and time are required'
      });
    }

    // In production, create calendar event and send invitations
    res.json({
      success: true,
      message: 'Virtual visit scheduled successfully',
      visitId: `visit_${Date.now()}`,
      details: {
        coachId,
        date,
        time,
        visitType: visitType || 'virtual',
        status: 'scheduled'
      },
      userId: userId
    });
  } catch (error) {
    console.error('Error scheduling visit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule visit',
      error: error.message
    });
  }
});

// Get recruiting timeline
router.get('/timeline', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || 'demo-user';

    // Sample timeline data
    const timeline = [
      {
        id: 'timeline_001',
        date: '2024-09-15',
        type: 'application',
        title: 'Early Application Submitted',
        description: 'Submitted early application to University of Excellence',
        status: 'completed'
      },
      {
        id: 'timeline_002',
        date: '2024-10-01',
        type: 'visit',
        title: 'Virtual Visit Scheduled',
        description: 'Virtual campus tour and coach meeting',
        status: 'scheduled'
      },
      {
        id: 'timeline_003',
        date: '2024-11-15',
        type: 'deadline',
        title: 'Scholarship Deadline',
        description: 'Priority scholarship application deadline',
        status: 'upcoming'
      }
    ];

    res.json({
      success: true,
      timeline: timeline,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline',
      error: error.message
    });
  }
});

module.exports = router;
