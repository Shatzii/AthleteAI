const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const WearableIntegrationService = require('../services/wearableIntegrationService');

const wearableService = new WearableIntegrationService();

// Initialize service
wearableService.initialize().catch(console.error);

// POST /api/wearable/connect
// Connect a wearable device
router.post('/connect', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { deviceType, authCredentials } = req.body;
    const athleteId = req.user?.id;

    if (!deviceType || !authCredentials) {
      return res.status(400).json({
        success: false,
        error: 'deviceType and authCredentials are required'
      });
    }

    // Connect device
    const connection = await wearableService.connectDevice(athleteId, deviceType, authCredentials);

    res.json({
      success: true,
      data: connection
    });

  } catch (error) {
    console.error('Error connecting wearable device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect device',
      details: error.message
    });
  }
});

// POST /api/wearable/disconnect
// Disconnect a wearable device
router.post('/disconnect', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'connectionId is required'
      });
    }

    // Disconnect device
    const result = await wearableService.disconnectDevice(connectionId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error disconnecting wearable device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect device',
      details: error.message
    });
  }
});

// POST /api/wearable/sync
// Manually sync data from a device
router.post('/sync', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'connectionId is required'
      });
    }

    // Sync device data
    const result = await wearableService.syncDeviceData(connectionId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error syncing wearable data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync device data',
      details: error.message
    });
  }
});

// GET /api/wearable/devices
// Get connected devices for the current athlete
router.get('/devices', authMiddleware.verifyToken, async (req, res) => {
  try {
    const athleteId = req.user?.id;
    const devices = wearableService.getAthleteDevices(athleteId);

    res.json({
      success: true,
      data: devices
    });

  } catch (error) {
    console.error('Error getting wearable devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get devices',
      details: error.message
    });
  }
});

// GET /api/wearable/realtime
// Get real-time data from connected devices
router.get('/realtime', authMiddleware.verifyToken, async (req, res) => {
  try {
    const athleteId = req.user?.id;
    const realTimeData = await wearableService.getRealTimeData(athleteId);

    res.json({
      success: true,
      data: realTimeData
    });

  } catch (error) {
    console.error('Error getting real-time wearable data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get real-time data',
      details: error.message
    });
  }
});

// GET /api/wearable/supported
// Get list of supported wearable devices
router.get('/supported', authMiddleware.verifyToken, async (req, res) => {
  try {
    const supportedDevices = [
      {
        type: 'fitbit',
        name: 'Fitbit',
        description: 'Fitness tracker with heart rate, sleep, and activity monitoring',
        authUrl: 'https://www.fitbit.com/oauth2/authorize',
        scopes: ['activity', 'heartrate', 'sleep', 'weight']
      },
      {
        type: 'garmin',
        name: 'Garmin Connect',
        description: 'Advanced fitness platform with comprehensive health metrics',
        authUrl: 'https://connect.garmin.com/oauth2/authorize',
        scopes: ['read', 'write']
      },
      {
        type: 'whoop',
        name: 'WHOOP',
        description: 'Recovery and performance optimization platform',
        authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
        scopes: ['read:recovery', 'read:cycles', 'read:sleep', 'read:workout']
      },
      {
        type: 'polar',
        name: 'Polar',
        description: 'Professional training and recovery monitoring',
        authUrl: 'https://flow.polar.com/oauth2/authorization',
        scopes: ['accesslink.read_all']
      },
      {
        type: 'google_fit',
        name: 'Google Fit',
        description: 'Google\'s health and fitness platform',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: ['https://www.googleapis.com/auth/fitness.activity.read']
      },
      {
        type: 'withings',
        name: 'Withings',
        description: 'Smart scales and health monitors',
        authUrl: 'https://account.withings.com/oauth2_user/authorize2',
        scopes: ['user.info', 'user.metrics']
      }
    ];

    res.json({
      success: true,
      data: supportedDevices
    });

  } catch (error) {
    console.error('Error getting supported devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported devices',
      details: error.message
    });
  }
});

// GET /api/wearable/stats
// Get wearable integration statistics
router.get('/stats', authMiddleware.verifyToken, async (req, res) => {
  try {
    const stats = wearableService.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting wearable stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
});

// POST /api/wearable/oauth/callback
// Handle OAuth callback from wearable providers
router.post('/oauth/callback', async (req, res) => {
  try {
    const { deviceType, code, state } = req.body;

    if (!deviceType || !code) {
      return res.status(400).json({
        success: false,
        error: 'deviceType and authorization code are required'
      });
    }

    // Exchange code for tokens (would be implemented per device)
    const tokens = await wearableService.exchangeCodeForTokens(deviceType, code);

    res.json({
      success: true,
      data: {
        deviceType,
        tokens: {
          access_token: tokens.access_token,
          expires_in: tokens.expires_in,
          token_type: tokens.token_type
        }
      }
    });

  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle OAuth callback',
      details: error.message
    });
  }
});

module.exports = router;