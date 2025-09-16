// Voice Coach API Routes
// Speech recognition and synthesis endpoints for interactive coaching

const express = require('express');
const router = express.Router();
const voiceCoachService = require('../services/voiceCoachService');
const auth = require('../middleware/auth');
const multer = require('multer');
const { body, param, query, validationResult } = require('express-validator');

// Configure multer for audio file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/') ||
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Initialize service on startup
voiceCoachService.initialize().catch(console.error);

/**
 * @route GET /api/voice/stats
 * @desc Get voice coach service statistics
 * @access Private (Admin)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = voiceCoachService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching voice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voice coach statistics'
    });
  }
});

/**
 * @route POST /api/voice/session/start
 * @desc Start a new voice coaching session
 * @access Private
 */
router.post('/session/start', [
  auth,
  body('athleteId').optional().isString().withMessage('Athlete ID must be a string'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
  body('preferences.voice').optional().isString().withMessage('Voice preference must be a string'),
  body('preferences.language').optional().isString().withMessage('Language must be a string'),
  body('preferences.style').optional().isIn(['motivational', 'technical', 'encouraging', 'strict']).withMessage('Invalid style preference'),
  body('preferences.speed').optional().isFloat({ min: 0.5, max: 2.0 }).withMessage('Speed must be between 0.5 and 2.0')
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

    const { athleteId, preferences = {} } = req.body;

    // Use authenticated user's ID if no athleteId provided
    const targetAthleteId = athleteId || req.user.id;

    // Verify access permissions
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== targetAthleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const session = await voiceCoachService.startSession(targetAthleteId, preferences);

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error starting voice session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start voice coaching session'
    });
  }
});

/**
 * @route POST /api/voice/session/:sessionId/process
 * @desc Process voice input and generate response
 * @access Private
 */
router.post('/session/:sessionId/process', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  upload.single('audio'),
  body('context').optional().isObject().withMessage('Context must be an object')
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
    const { context = {} } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    // Verify session ownership
    const session = voiceCoachService.activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Voice session not found'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== session.athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await voiceCoachService.processVoiceInput(
      sessionId,
      req.file.buffer,
      context
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error processing voice input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice input'
    });
  }
});

/**
 * @route POST /api/voice/session/:sessionId/text
 * @desc Process text input (fallback for voice processing)
 * @access Private
 */
router.post('/session/:sessionId/text', [
  auth,
  param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
  body('text').isString().notEmpty().withMessage('Text input is required'),
  body('context').optional().isObject().withMessage('Context must be an object')
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
    const { text, context = {} } = req.body;

    // Verify session ownership
    const session = voiceCoachService.activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Voice session not found'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== session.athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create a mock transcription object
    const mockTranscription = {
      text: text,
      confidence: 1.0
    };

    // Process as voice input with mock transcription
    const result = await voiceCoachService.processVoiceInput(
      sessionId,
      Buffer.from('mock'), // Mock audio data
      { ...context, mockTranscription }
    );

    res.json({
      success: true,
      data: {
        ...result,
        transcription: text,
        confidence: 1.0
      }
    });

  } catch (error) {
    console.error('Error processing text input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process text input'
    });
  }
});

/**
 * @route POST /api/voice/session/:sessionId/end
 * @desc End a voice coaching session
 * @access Private
 */
router.post('/session/:sessionId/end', [
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

    // Verify session ownership
    const session = voiceCoachService.activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Voice session not found'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== session.athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const summary = await voiceCoachService.endSession(sessionId);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error ending voice session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end voice session'
    });
  }
});

/**
 * @route GET /api/voice/session/:sessionId/status
 * @desc Get voice session status
 * @access Private
 */
router.get('/session/:sessionId/status', [
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

    const session = voiceCoachService.activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Voice session not found'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user.id !== session.athleteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        athleteId: session.athleteId,
        startTime: session.startTime,
        preferences: session.preferences,
        metrics: session.metrics,
        isActive: true
      }
    });

  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session status'
    });
  }
});

/**
 * @route GET /api/voice/voices
 * @desc Get available voice options
 * @access Private
 */
router.get('/voices', auth, async (req, res) => {
  try {
    // This would typically fetch from ElevenLabs API
    const voices = [
      {
        id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        language: 'en-US',
        gender: 'female',
        style: 'professional'
      },
      {
        id: 'AZnzlk1XvdvUeBnXmlld',
        name: 'Domi',
        language: 'en-US',
        gender: 'female',
        style: 'casual'
      },
      {
        id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        language: 'en-US',
        gender: 'female',
        style: 'soft'
      },
      {
        id: 'ErXwobaYiN019PkySvjV',
        name: 'Antoni',
        language: 'en-US',
        gender: 'male',
        style: 'warm'
      },
      {
        id: 'VR6AewLTigWG4xSOukaG',
        name: 'Arnold',
        language: 'en-US',
        gender: 'male',
        style: 'confident'
      },
      {
        id: 'pNInz6obpgDQGcFmaJgB',
        name: 'Adam',
        language: 'en-US',
        gender: 'male',
        style: 'professional'
      }
    ];

    res.json({
      success: true,
      data: voices
    });

  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available voices'
    });
  }
});

/**
 * @route PUT /api/voice/coach/personality
 * @desc Update coach personality settings
 * @access Private (Admin)
 */
router.put('/coach/personality', [
  auth,
  body('name').optional().isString().withMessage('Name must be a string'),
  body('style').optional().isIn(['motivational', 'technical', 'encouraging', 'strict']).withMessage('Invalid style'),
  body('tone').optional().isIn(['professional', 'casual', 'intense', 'supportive']).withMessage('Invalid tone'),
  body('language').optional().isString().withMessage('Language must be a string')
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

    // Only admins can update coach personality
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, style, tone, language } = req.body;

    voiceCoachService.updateCoachPersonality({
      name,
      style,
      tone,
      language
    });

    res.json({
      success: true,
      message: 'Coach personality updated successfully',
      data: voiceCoachService.coachPersonality
    });

  } catch (error) {
    console.error('Error updating coach personality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coach personality'
    });
  }
});

/**
 * @route POST /api/voice/cleanup
 * @desc Clean up old audio files
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

    const { maxAgeHours = 24 } = req.body;

    const cleanedCount = await voiceCoachService.cleanupOldAudioFiles(maxAgeHours);

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old audio files`,
      data: { cleanedCount }
    });

  } catch (error) {
    console.error('Error cleaning up audio files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up audio files'
    });
  }
});

/**
 * @route POST /api/voice/test
 * @desc Test voice coach functionality
 * @access Private (Admin)
 */
router.post('/test', auth, async (req, res) => {
  try {
    // Only admins can run tests
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { testType = 'basic' } = req.body;

    let testResult = {};

    switch (testType) {
      case 'speech':
        testResult = {
          speechRecognition: !!voiceCoachService.speechClient,
          message: 'Speech recognition test completed'
        };
        break;

      case 'tts':
        testResult = {
          textToSpeech: !!voiceCoachService.elevenlabsApiKey,
          message: 'Text-to-speech test completed'
        };
        break;

      case 'basic':
      default:
        testResult = {
          service: 'operational',
          speechRecognition: !!voiceCoachService.speechClient,
          textToSpeech: !!voiceCoachService.elevenlabsApiKey,
          activeSessions: voiceCoachService.activeSessions.size,
          message: 'Basic functionality test completed'
        };
        break;
    }

    res.json({
      success: true,
      data: testResult
    });

  } catch (error) {
    console.error('Error running voice test:', error);
    res.status(500).json({
      success: false,
      message: 'Voice test failed'
    });
  }
});

module.exports = router;