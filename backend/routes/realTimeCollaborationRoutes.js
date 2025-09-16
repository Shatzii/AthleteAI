// Real-Time Collaboration API Routes
// Live coaching sessions and virtual whiteboard management

const express = require('express');
const router = express.Router();
const realTimeCollaborationService = require('../services/realTimeCollaborationService');
const auth = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

/**
 * @route POST /api/collaboration/sessions
 * @desc Create a new collaboration session
 * @access Private
 */
router.post('/sessions', [
  auth,
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid date format'),
  body('allowDrawing').optional().isBoolean().withMessage('Allow drawing must be boolean'),
  body('allowChat').optional().isBoolean().withMessage('Allow chat must be boolean'),
  body('allowScreenShare').optional().isBoolean().withMessage('Allow screen share must be boolean'),
  body('maxParticipants').optional().isNumeric().withMessage('Max participants must be a number'),
  body('isPrivate').optional().isBoolean().withMessage('Is private must be boolean'),
  body('password').optional().isString().withMessage('Password must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const sessionData = {
      title: req.body.title,
      description: req.body.description,
      scheduledFor: req.body.scheduledFor,
      allowDrawing: req.body.allowDrawing,
      allowChat: req.body.allowChat,
      allowScreenShare: req.body.allowScreenShare,
      maxParticipants: req.body.maxParticipants,
      isPrivate: req.body.isPrivate,
      password: req.body.password
    };

    const session = realTimeCollaborationService.createSession(req.user.id, sessionData);

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error creating collaboration session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create collaboration session'
    });
  }
});

/**
 * @route GET /api/collaboration/sessions/:sessionId
 * @desc Get session information
 * @access Private
 */
router.get('/sessions/:sessionId', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const sessionInfo = realTimeCollaborationService.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: sessionInfo
    });

  } catch (error) {
    console.error('Error fetching session info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session information'
    });
  }
});

/**
 * @route PUT /api/collaboration/sessions/:sessionId
 * @desc Update session settings
 * @access Private
 */
router.put('/sessions/:sessionId', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('allowDrawing').optional().isBoolean().withMessage('Allow drawing must be boolean'),
  body('allowChat').optional().isBoolean().withMessage('Allow chat must be boolean'),
  body('allowScreenShare').optional().isBoolean().withMessage('Allow screen share must be boolean'),
  body('maxParticipants').optional().isNumeric().withMessage('Max participants must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const sessionInfo = realTimeCollaborationService.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Only host can update session settings
    if (sessionInfo.host !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // In a real implementation, update session settings in database
    // For now, just return success
    const updatedSettings = {
      title: req.body.title,
      description: req.body.description,
      allowDrawing: req.body.allowDrawing,
      allowChat: req.body.allowChat,
      allowScreenShare: req.body.allowScreenShare,
      maxParticipants: req.body.maxParticipants
    };

    res.json({
      success: true,
      data: {
        sessionId,
        settings: updatedSettings
      }
    });

  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session'
    });
  }
});

/**
 * @route DELETE /api/collaboration/sessions/:sessionId
 * @desc End/delete a collaboration session
 * @access Private
 */
router.delete('/sessions/:sessionId', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const sessionInfo = realTimeCollaborationService.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Only host or admin can delete session
    if (sessionInfo.host !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Broadcast session end to all participants
    realTimeCollaborationService.broadcastToSession(sessionId, 'session-ended', {
      endedBy: req.user.id,
      reason: 'Host ended the session'
    });

    // In a real implementation, mark session as ended in database
    res.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
});

/**
 * @route GET /api/collaboration/recordings/:recordingId
 * @desc Get session recording data
 * @access Private
 */
router.get('/recordings/:recordingId', [
  auth,
  param('recordingId').isString().notEmpty().withMessage('Recording ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recordingId } = req.params;
    const recording = realTimeCollaborationService.getRecording(recordingId);

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // Check if user has access to this recording
    // In a real implementation, check recording permissions
    if (req.user.role !== 'admin' && !recording.participants.some(p => p.id === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: recording
    });

  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording'
    });
  }
});

/**
 * @route GET /api/collaboration/stats
 * @desc Get collaboration service statistics
 * @access Private (Admin)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    // Only admins can access stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stats = realTimeCollaborationService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching collaboration stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

/**
 * @route POST /api/collaboration/cleanup
 * @desc Trigger cleanup of old sessions and recordings
 * @access Private (Admin)
 */
router.post('/cleanup', auth, async (req, res) => {
  try {
    // Only admins can trigger cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    realTimeCollaborationService.cleanup();

    res.json({
      success: true,
      message: 'Cleanup completed successfully'
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed'
    });
  }
});

/**
 * @route POST /api/collaboration/sessions/:sessionId/message
 * @desc Send a message to all participants in a session (REST API fallback)
 * @access Private
 */
router.post('/sessions/:sessionId/message', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  body('message').isString().notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['text', 'system', 'emoji']).withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const { message, type = 'text' } = req.body;

    // Check if session exists and user is participant
    const sessionInfo = realTimeCollaborationService.getSessionInfo(sessionId);
    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Send message via Socket.IO
    realTimeCollaborationService.broadcastToSession(sessionId, 'new-message', {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      userName: req.user.name || 'Unknown User',
      message,
      type,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

/**
 * @route GET /api/collaboration/sessions/:sessionId/participants
 * @desc Get list of session participants
 * @access Private
 */
router.get('/sessions/:sessionId/participants', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const sessionInfo = realTimeCollaborationService.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // In a real implementation, get participants from active session
    // For now, return mock data
    const participants = [
      {
        id: sessionInfo.host,
        name: 'Session Host',
        role: 'host',
        joinedAt: sessionInfo.createdAt
      }
    ];

    res.json({
      success: true,
      data: {
        sessionId,
        participants,
        count: participants.length
      }
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participants'
    });
  }
});

/**
 * @route POST /api/collaboration/sessions/:sessionId/kick
 * @desc Remove a participant from session
 * @access Private
 */
router.post('/sessions/:sessionId/kick', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  body('userId').isString().notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.params;
    const { userId } = req.body;

    const sessionInfo = realTimeCollaborationService.getSessionInfo(sessionId);
    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Only host or admin can kick participants
    if (sessionInfo.host !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Send kick message via Socket.IO
    realTimeCollaborationService.sendToParticipant(sessionId, userId, 'kicked', {
      kickedBy: req.user.id,
      reason: 'Removed by host'
    });

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Error kicking participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant'
    });
  }
});

module.exports = router;