const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const SocialCommunityService = require('../services/socialCommunityService');

const socialService = new SocialCommunityService();

// Initialize service
socialService.initialize().catch(console.error);

// GET /api/social/forums
// Get list of forums
router.get('/forums', authMiddleware.verifyToken, async (req, res) => {
  try {
    const forums = socialService.getForums();

    res.json({
      success: true,
      data: forums
    });

  } catch (error) {
    console.error('Error getting forums:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get forums',
      details: error.message
    });
  }
});

// GET /api/social/forums/:forumId/posts
// Get posts from a forum
router.get('/forums/:forumId/posts', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { forumId } = req.params;
    const { page, limit, sortBy, sortOrder, tag, authorId } = req.query;

    const result = socialService.getForumPosts(forumId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder,
      tag,
      authorId
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting forum posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get forum posts',
      details: error.message
    });
  }
});

// POST /api/social/forums/:forumId/posts
// Create a new forum post
router.post('/forums/:forumId/posts', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { forumId } = req.params;
    const { title, content, tags } = req.body;
    const authorId = req.user?.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const post = await socialService.createForumPost(forumId, {
      authorId,
      title,
      content,
      tags: tags || []
    });

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create forum post',
      details: error.message
    });
  }
});

// POST /api/social/posts/:postId/replies
// Reply to a forum post
router.post('/posts/:postId/replies', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.user?.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const reply = await socialService.replyToPost(postId, {
      authorId,
      content
    });

    res.json({
      success: true,
      data: reply
    });

  } catch (error) {
    console.error('Error replying to post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reply to post',
      details: error.message
    });
  }
});

// POST /api/social/items/:itemId/like
// Like a post or reply
router.post('/items/:itemId/like', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;

    const item = await socialService.likeItem(itemId, userId);

    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('Error liking item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like item',
      details: error.message
    });
  }
});

// GET /api/social/mentors
// Find potential mentors
router.get('/mentors', authMiddleware.verifyToken, async (req, res) => {
  try {
    const athleteId = req.user?.id;
    const { sport, specialization, experience } = req.query;

    const mentors = await socialService.findMentors(athleteId, {
      sport,
      specialization,
      experience
    });

    res.json({
      success: true,
      data: mentors
    });

  } catch (error) {
    console.error('Error finding mentors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find mentors',
      details: error.message
    });
  }
});

// POST /api/social/mentorship/request
// Request mentorship
router.post('/mentorship/request', authMiddleware.verifyToken, async (req, res) => {
  try {
    const athleteId = req.user?.id;
    const { mentorId, goals, availability, message } = req.body;

    if (!mentorId || !goals) {
      return res.status(400).json({
        success: false,
        error: 'Mentor ID and goals are required'
      });
    }

    const mentorship = await socialService.requestMentorship(athleteId, mentorId, {
      goals,
      availability,
      message
    });

    res.json({
      success: true,
      data: mentorship
    });

  } catch (error) {
    console.error('Error requesting mentorship:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request mentorship',
      details: error.message
    });
  }
});

// GET /api/social/teams
// Get available teams
router.get('/teams', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { sport, level, isRecruiting } = req.query;

    const teams = socialService.getTeams({
      sport,
      level,
      isRecruiting: isRecruiting === 'true'
    });

    res.json({
      success: true,
      data: teams
    });

  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get teams',
      details: error.message
    });
  }
});

// POST /api/social/teams
// Create a new team
router.post('/teams', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { name, description, sport, level, location, maxMembers } = req.body;
    const captainId = req.user?.id;

    if (!name || !sport) {
      return res.status(400).json({
        success: false,
        error: 'Name and sport are required'
      });
    }

    const team = await socialService.createTeam({
      name,
      description,
      sport,
      level,
      location,
      captainId,
      maxMembers
    });

    res.json({
      success: true,
      data: team
    });

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create team',
      details: error.message
    });
  }
});

// POST /api/social/teams/:teamId/join
// Join a team
router.post('/teams/:teamId/join', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const athleteId = req.user?.id;

    const team = await socialService.joinTeam(teamId, athleteId);

    res.json({
      success: true,
      data: team
    });

  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join team',
      details: error.message
    });
  }
});

// GET /api/social/challenges
// Get active challenges
router.get('/challenges', authMiddleware.verifyToken, async (req, res) => {
  try {
    const challenges = socialService.getChallenges();

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

// POST /api/social/challenges/:challengeId/join
// Join a challenge
router.post('/challenges/:challengeId/join', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const athleteId = req.user?.id;

    const challenge = await socialService.joinChallenge(challengeId, athleteId);

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

// POST /api/social/challenges/:challengeId/progress
// Update challenge progress
router.post('/challenges/:challengeId/progress', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { progress } = req.body;
    const athleteId = req.user?.id;

    if (typeof progress !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Progress must be a number'
      });
    }

    const participant = await socialService.updateChallengeProgress(challengeId, athleteId, progress);

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

// GET /api/social/notifications
// Get user notifications
router.get('/notifications', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page, limit, unreadOnly } = req.query;

    const result = socialService.getUserNotifications(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      details: error.message
    });
  }
});

// POST /api/social/notifications/mark-read
// Mark notifications as read
router.post('/notifications/mark-read', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: 'notificationIds must be an array'
      });
    }

    socialService.markNotificationsRead(userId, notificationIds);

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
      details: error.message
    });
  }
});

// GET /api/social/stats
// Get social community statistics
router.get('/stats', authMiddleware.verifyToken, async (req, res) => {
  try {
    const stats = socialService.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting social stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get social statistics',
      details: error.message
    });
  }
});

module.exports = router;