// Wearable Device Integration Service for AthleteAI
// Provides seamless connections with fitness trackers, smart devices, and biometric sensors

const axios = require('axios');
const mongoose = require('mongoose');

class WearableIntegrationService {
  constructor() {
    this.connectedDevices = new Map();
    this.deviceAPIs = new Map();
    this.dataStreams = new Map();
    this.syncIntervals = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the wearable integration service
   */
  async initialize() {
    try {
      console.log('Initializing Wearable Integration Service...');

      // Initialize API configurations for different devices
      this.initializeDeviceAPIs();

      // Set up data collection intervals
      this.setupDataCollection();

      this.isInitialized = true;
      console.log('Wearable Integration Service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Wearable Integration Service:', error);
      throw error;
    }
  }

  /**
   * Initialize API configurations for different wearable devices
   */
  initializeDeviceAPIs() {
    // Garmin Connect API
    this.deviceAPIs.set('garmin', {
      name: 'Garmin Connect',
      baseUrl: 'https://connect.garmin.com',
      authUrl: 'https://connect.garmin.com/oauth2/authorize',
      tokenUrl: 'https://connect.garmin.com/oauth2/token',
      scopes: ['read', 'write'],
      endpoints: {
        activities: '/modern/proxy/activitylist-service/activities',
        heartRate: '/modern/proxy/wellness-service/wellness/heartRate',
        sleep: '/modern/proxy/wellness-service/wellness/sleep',
        bodyComposition: '/modern/proxy/weight-service/weight'
      }
    });

    // Fitbit API
    this.deviceAPIs.set('fitbit', {
      name: 'Fitbit',
      baseUrl: 'https://api.fitbit.com',
      authUrl: 'https://www.fitbit.com/oauth2/authorize',
      tokenUrl: 'https://api.fitbit.com/oauth2/token',
      scopes: ['activity', 'heartrate', 'sleep', 'weight'],
      endpoints: {
        activities: '/1/user/-/activities/date/{date}.json',
        heartRate: '/1/user/-/activities/heart/date/{date}/1d.json',
        sleep: '/1/user/-/sleep/date/{date}.json',
        bodyComposition: '/1/user/-/body/log/weight/date/{date}.json'
      }
    });

    // WHOOP API
    this.deviceAPIs.set('whoop', {
      name: 'WHOOP',
      baseUrl: 'https://api.prod.whoop.com',
      authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
      tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
      scopes: ['read:recovery', 'read:cycles', 'read:sleep', 'read:workout'],
      endpoints: {
        recovery: '/developer/v1/recovery',
        cycles: '/developer/v1/cycle',
        sleep: '/developer/v1/sleep',
        workouts: '/developer/v1/workouts'
      }
    });

    // Polar API
    this.deviceAPIs.set('polar', {
      name: 'Polar',
      baseUrl: 'https://www.polaraccesslink.com',
      authUrl: 'https://flow.polar.com/oauth2/authorization',
      tokenUrl: 'https://polarremote.com/v2/oauth2/token',
      scopes: ['accesslink.read_all'],
      endpoints: {
        exercises: '/v3/exercises',
        physicalInfo: '/v3/physical-informations',
        sleep: '/v3/sleep'
      }
    });

    // Apple Health (simulated - would require HealthKit integration)
    this.deviceAPIs.set('apple_health', {
      name: 'Apple Health',
      baseUrl: 'https://health.apple.com', // Placeholder
      authUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      scopes: ['healthkit'],
      endpoints: {
        workouts: '/api/workouts',
        vitals: '/api/vitals',
        sleep: '/api/sleep'
      }
    });

    // Google Fit
    this.deviceAPIs.set('google_fit', {
      name: 'Google Fit',
      baseUrl: 'https://www.googleapis.com/fitness/v1',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/fitness.activity.read', 'https://www.googleapis.com/auth/fitness.body.read'],
      endpoints: {
        dataSources: '/users/me/dataSources',
        datasets: '/users/me/dataSources/{dataSourceId}/datasets/{datasetId}'
      }
    });

    // Smart scales (Withings, etc.)
    this.deviceAPIs.set('withings', {
      name: 'Withings',
      baseUrl: 'https://wbsapi.withings.net',
      authUrl: 'https://account.withings.com/oauth2_user/authorize2',
      tokenUrl: 'https://wbsapi.withings.net/v2/oauth2/token',
      scopes: ['user.info', 'user.metrics'],
      endpoints: {
        measures: '/measure',
        sleep: '/sleep'
      }
    });
  }

  /**
   * Connect a wearable device for an athlete
   * @param {string} athleteId - Athlete ID
   * @param {string} deviceType - Type of device (garmin, fitbit, etc.)
   * @param {Object} authCredentials - OAuth credentials
   * @returns {Object} Connection result
   */
  async connectDevice(athleteId, deviceType, authCredentials) {
    try {
      if (!this.deviceAPIs.has(deviceType)) {
        throw new Error(`Unsupported device type: ${deviceType}`);
      }

      const deviceConfig = this.deviceAPIs.get(deviceType);

      // Validate credentials
      const tokenData = await this.validateCredentials(deviceType, authCredentials);

      // Create device connection
      const connection = {
        athleteId,
        deviceType,
        deviceConfig,
        tokens: tokenData,
        connectedAt: new Date(),
        lastSync: null,
        status: 'connected',
        syncInterval: 15 * 60 * 1000 // 15 minutes
      };

      // Store connection
      const connectionId = `${athleteId}_${deviceType}`;
      this.connectedDevices.set(connectionId, connection);

      // Start automatic data sync
      this.startDataSync(connectionId);

      console.log(`Connected ${deviceType} device for athlete ${athleteId}`);

      return {
        connectionId,
        deviceType,
        status: 'connected',
        nextSync: new Date(Date.now() + connection.syncInterval)
      };

    } catch (error) {
      console.error('Error connecting device:', error);
      throw error;
    }
  }

  /**
   * Disconnect a wearable device
   * @param {string} connectionId - Connection ID
   * @returns {Object} Disconnection result
   */
  async disconnectDevice(connectionId) {
    try {
      const connection = this.connectedDevices.get(connectionId);
      if (!connection) {
        throw new Error('Device connection not found');
      }

      // Stop data sync
      this.stopDataSync(connectionId);

      // Revoke tokens if possible
      await this.revokeTokens(connection.deviceType, connection.tokens);

      // Remove connection
      this.connectedDevices.delete(connectionId);

      console.log(`Disconnected device ${connectionId}`);

      return {
        connectionId,
        status: 'disconnected',
        disconnectedAt: new Date()
      };

    } catch (error) {
      console.error('Error disconnecting device:', error);
      throw error;
    }
  }

  /**
   * Sync data from a connected device
   * @param {string} connectionId - Connection ID
   * @returns {Object} Sync result
   */
  async syncDeviceData(connectionId) {
    try {
      const connection = this.connectedDevices.get(connectionId);
      if (!connection) {
        throw new Error('Device connection not found');
      }

      console.log(`Syncing data from ${connection.deviceType} for athlete ${connection.athleteId}`);

      // Fetch data from device API
      const rawData = await this.fetchDeviceData(connection);

      // Process and normalize data
      const processedData = this.processDeviceData(connection.deviceType, rawData);

      // Store data in database
      await this.storeDeviceData(connection.athleteId, connection.deviceType, processedData);

      // Update connection status
      connection.lastSync = new Date();
      connection.status = 'synced';

      return {
        connectionId,
        deviceType: connection.deviceType,
        athleteId: connection.athleteId,
        dataPoints: processedData.length,
        lastSync: connection.lastSync,
        nextSync: new Date(Date.now() + connection.syncInterval)
      };

    } catch (error) {
      console.error('Error syncing device data:', error);

      // Update connection status on error
      const connection = this.connectedDevices.get(connectionId);
      if (connection) {
        connection.status = 'error';
        connection.lastError = error.message;
      }

      throw error;
    }
  }

  /**
   * Get real-time data from connected devices
   * @param {string} athleteId - Athlete ID
   * @returns {Object} Real-time data
   */
  async getRealTimeData(athleteId) {
    try {
      const athleteConnections = Array.from(this.connectedDevices.values())
        .filter(conn => conn.athleteId === athleteId && conn.status === 'connected');

      const realTimeData = {
        athleteId,
        timestamp: new Date(),
        devices: []
      };

      for (const connection of athleteConnections) {
        try {
          const deviceData = await this.fetchRealTimeData(connection);
          if (deviceData) {
            realTimeData.devices.push({
              deviceType: connection.deviceType,
              data: deviceData,
              lastSync: connection.lastSync
            });
          }
        } catch (error) {
          console.warn(`Failed to get real-time data from ${connection.deviceType}:`, error);
        }
      }

      return realTimeData;

    } catch (error) {
      console.error('Error getting real-time data:', error);
      throw error;
    }
  }

  /**
   * Fetch data from device API
   * @param {Object} connection - Device connection
   * @returns {Object} Raw device data
   */
  async fetchDeviceData(connection) {
    const deviceConfig = connection.deviceConfig;
    const tokens = connection.tokens;

    // Refresh token if needed
    if (this.isTokenExpired(tokens)) {
      const newTokens = await this.refreshToken(connection.deviceType, tokens);
      connection.tokens = newTokens;
    }

    const headers = {
      'Authorization': `Bearer ${connection.tokens.access_token}`,
      'Content-Type': 'application/json'
    };

    const data = {};

    // Fetch different data types based on device
    try {
      if (connection.deviceType === 'fitbit') {
        const today = new Date().toISOString().split('T')[0];

        data.activities = await this.makeAPIRequest(
          `${deviceConfig.baseUrl}${deviceConfig.endpoints.activities.replace('{date}', today)}`,
          headers
        );

        data.heartRate = await this.makeAPIRequest(
          `${deviceConfig.baseUrl}${deviceConfig.endpoints.heartRate.replace('{date}', today)}`,
          headers
        );

        data.sleep = await this.makeAPIRequest(
          `${deviceConfig.baseUrl}${deviceConfig.endpoints.sleep.replace('{date}', today)}`,
          headers
        );

      } else if (connection.deviceType === 'garmin') {
        // Garmin API calls would go here
        data.activities = await this.makeAPIRequest(
          `${deviceConfig.baseUrl}${deviceConfig.endpoints.activities}`,
          headers
        );

      } else if (connection.deviceType === 'whoop') {
        data.recovery = await this.makeAPIRequest(
          `${deviceConfig.baseUrl}${deviceConfig.endpoints.recovery}`,
          headers
        );

        data.sleep = await this.makeAPIRequest(
          `${deviceConfig.baseUrl}${deviceConfig.endpoints.sleep}`,
          headers
        );
      }

    } catch (error) {
      console.warn(`Failed to fetch data from ${connection.deviceType}:`, error);
    }

    return data;
  }

  /**
   * Process and normalize device data
   * @param {string} deviceType - Device type
   * @param {Object} rawData - Raw device data
   * @returns {Array} Normalized data points
   */
  processDeviceData(deviceType, rawData) {
    const normalizedData = [];

    try {
      if (deviceType === 'fitbit') {
        // Process Fitbit data
        if (rawData.activities?.activities) {
          rawData.activities.activities.forEach(activity => {
            normalizedData.push({
              type: 'activity',
              timestamp: new Date(activity.startTime),
              device: 'fitbit',
              data: {
                activityType: activity.activityType,
                calories: activity.calories,
                distance: activity.distance,
                duration: activity.duration,
                steps: activity.steps,
                heartRate: activity.averageHeartRate
              }
            });
          });
        }

        if (rawData.heartRate?.['activities-heart']) {
          rawData.heartRate['activities-heart'].forEach(hr => {
            normalizedData.push({
              type: 'heart_rate',
              timestamp: new Date(hr.dateTime),
              device: 'fitbit',
              data: {
                restingHeartRate: hr.value.restingHeartRate,
                heartRateZones: hr.value.heartRateZones
              }
            });
          });
        }

        if (rawData.sleep?.sleep) {
          rawData.sleep.sleep.forEach(sleep => {
            normalizedData.push({
              type: 'sleep',
              timestamp: new Date(sleep.startTime),
              device: 'fitbit',
              data: {
                duration: sleep.duration,
                efficiency: sleep.efficiency,
                stages: sleep.levels
              }
            });
          });
        }

      } else if (deviceType === 'whoop') {
        // Process WHOOP data
        if (rawData.recovery) {
          normalizedData.push({
            type: 'recovery',
            timestamp: new Date(),
            device: 'whoop',
            data: {
              recoveryScore: rawData.recovery.score,
              hrv: rawData.recovery.hrv,
              restingHeartRate: rawData.recovery.resting_heart_rate
            }
          });
        }

        if (rawData.sleep) {
          normalizedData.push({
            type: 'sleep',
            timestamp: new Date(),
            device: 'whoop',
            data: {
              sleepQuality: rawData.sleep.score,
              sleepDuration: rawData.sleep.duration,
              remSleep: rawData.sleep.rem_duration
            }
          });
        }
      }

    } catch (error) {
      console.error('Error processing device data:', error);
    }

    return normalizedData;
  }

  /**
   * Store device data in database
   * @param {string} athleteId - Athlete ID
   * @param {string} deviceType - Device type
   * @param {Array} dataPoints - Data points to store
   */
  async storeDeviceData(athleteId, deviceType, dataPoints) {
    try {
      // In a real implementation, this would save to MongoDB
      // For now, we'll simulate storage
      console.log(`Storing ${dataPoints.length} data points from ${deviceType} for athlete ${athleteId}`);

      // Group data by type for efficient storage
      const dataByType = {};
      dataPoints.forEach(point => {
        if (!dataByType[point.type]) {
          dataByType[point.type] = [];
        }
        dataByType[point.type].push(point);
      });

      // Simulate database storage
      for (const [type, points] of Object.entries(dataByType)) {
        console.log(`Stored ${points.length} ${type} records`);
      }

    } catch (error) {
      console.error('Error storing device data:', error);
      throw error;
    }
  }

  /**
   * Fetch real-time data from device
   * @param {Object} connection - Device connection
   * @returns {Object} Real-time data
   */
  async fetchRealTimeData(connection) {
    // In a real implementation, this would fetch live data
    // For simulation, return mock real-time data
    return {
      heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 BPM
      timestamp: new Date(),
      device: connection.deviceType
    };
  }

  /**
   * Set up automatic data collection intervals
   */
  setupDataCollection() {
    // This would be called to set up periodic sync for all connected devices
    console.log('Setting up automatic data collection...');
  }

  /**
   * Start automatic data sync for a connection
   * @param {string} connectionId - Connection ID
   */
  startDataSync(connectionId) {
    const connection = this.connectedDevices.get(connectionId);
    if (!connection) return;

    const intervalId = setInterval(async () => {
      try {
        await this.syncDeviceData(connectionId);
      } catch (error) {
        console.error(`Auto-sync failed for ${connectionId}:`, error);
      }
    }, connection.syncInterval);

    this.syncIntervals.set(connectionId, intervalId);
  }

  /**
   * Stop automatic data sync for a connection
   * @param {string} connectionId - Connection ID
   */
  stopDataSync(connectionId) {
    const intervalId = this.syncIntervals.get(connectionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.syncIntervals.delete(connectionId);
    }
  }

  /**
   * Validate OAuth credentials
   * @param {string} deviceType - Device type
   * @param {Object} credentials - OAuth credentials
   * @returns {Object} Token data
   */
  async validateCredentials(deviceType, credentials) {
    // In a real implementation, this would validate tokens with the device API
    // For simulation, return mock token data
    return {
      access_token: credentials.access_token || 'mock_access_token',
      refresh_token: credentials.refresh_token || 'mock_refresh_token',
      expires_at: Date.now() + (3600 * 1000) // 1 hour from now
    };
  }

  /**
   * Exchange OAuth authorization code for tokens
   * @param {string} deviceType - Device type
   * @param {string} code - Authorization code
   * @returns {Object} Token data
   */
  async exchangeCodeForTokens(deviceType, code) {
    try {
      const deviceConfig = this.deviceAPIs.get(deviceType);
      if (!deviceConfig) {
        throw new Error(`Unsupported device type: ${deviceType}`);
      }

      // In a real implementation, this would make an API call to exchange the code
      // For simulation, return mock tokens
      return {
        access_token: `mock_access_token_${Date.now()}`,
        refresh_token: `mock_refresh_token_${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Date.now() + (3600 * 1000)
      };

    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Check if token is expired
   * @param {Object} tokens - Token data
   * @returns {boolean} True if expired
   */
  isTokenExpired(tokens) {
    return tokens.expires_at && tokens.expires_at < Date.now();
  }

  /**
   * Refresh OAuth token
   * @param {string} deviceType - Device type
   * @param {Object} tokens - Current tokens
   * @returns {Object} New token data
   */
  async refreshToken(deviceType, tokens) {
    // In a real implementation, this would refresh tokens with the device API
    return {
      ...tokens,
      access_token: 'refreshed_access_token',
      expires_at: Date.now() + (3600 * 1000)
    };
  }

  /**
   * Revoke OAuth tokens
   * @param {string} deviceType - Device type
   * @param {Object} tokens - Token data
   */
  async revokeTokens(deviceType, tokens) {
    // In a real implementation, this would revoke tokens with the device API
    console.log(`Revoking tokens for ${deviceType}`);
  }

  /**
   * Make API request to device
   * @param {string} url - API URL
   * @param {Object} headers - Request headers
   * @returns {Object} API response
   */
  async makeAPIRequest(url, headers) {
    try {
      const response = await axios.get(url, { headers, timeout: 10000 });
      return response.data;
    } catch (error) {
      console.warn(`API request failed for ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Get wearable integration statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      connectedDevices: this.connectedDevices.size,
      activeSyncs: this.syncIntervals.size,
      supportedDevices: Array.from(this.deviceAPIs.keys()),
      version: '1.0.0'
    };
  }

  /**
   * Get connected devices for an athlete
   * @param {string} athleteId - Athlete ID
   * @returns {Array} Connected devices
   */
  getAthleteDevices(athleteId) {
    return Array.from(this.connectedDevices.values())
      .filter(conn => conn.athleteId === athleteId)
      .map(conn => ({
        connectionId: `${conn.athleteId}_${conn.deviceType}`,
        deviceType: conn.deviceType,
        status: conn.status,
        connectedAt: conn.connectedAt,
        lastSync: conn.lastSync,
        nextSync: conn.lastSync ? new Date(conn.lastSync.getTime() + conn.syncInterval) : null
      }));
  }
}

module.exports = WearableIntegrationService;