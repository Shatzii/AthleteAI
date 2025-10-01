// Comprehensive Testing Suite for All Implemented Features
// Tests for the 14 high-impact features added to AthleteAI

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');
const Athlete = require('../models/Athlete');

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  role: 'athlete'
};

const testAthlete = {
  name: 'John Doe',
  sport: 'football',
  position: 'QB',
  year: 'junior',
  height: '6\'2"',
  weight: 210
};

let authToken;
let userId;
let athleteId;

describe('AthleteAI Comprehensive Feature Tests', () => {
  beforeAll(async () => {
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Create test athlete
    const athleteResponse = await request(app)
      .post('/api/v1/athletes')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testAthlete)
      .expect(201);

    athleteId = athleteResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
    await Athlete.deleteMany({});
  });

  describe('1. Advanced AI-Powered Personalization Engine', () => {
    test('should get personalized recommendations', async () => {
      const response = await request(app)
        .get('/api/v1/personalization/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    test('should update user preferences', async () => {
      const preferences = {
        sport: 'football',
        position: 'QB',
        goals: ['improve_accuracy', 'increase_strength'],
        skillLevel: 'intermediate'
      };

      const response = await request(app)
        .put('/api/v1/personalization/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
    });

    test('should get personalized training plan', async () => {
      const response = await request(app)
        .get('/api/v1/personalization/training-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('plan');
    });
  });

  describe('2. Real-Time Video Analysis', () => {
    test('should upload video for analysis', async () => {
      // Mock file upload - in real test, would use actual video file
      const response = await request(app)
        .post('/api/v1/video-analysis/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', Buffer.from('fake video data'), 'test.mp4')
        .field('exerciseType', 'squat')
        .field('athleteId', athleteId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis');
    });

    test('should get analysis results', async () => {
      const response = await request(app)
        .get('/api/v1/video-analysis/results')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ athleteId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('3. Wearable Device Integration', () => {
    test('should connect wearable device', async () => {
      const deviceData = {
        deviceType: 'fitbit',
        deviceId: 'test_device_123',
        permissions: ['heartrate', 'activity', 'sleep']
      };

      const response = await request(app)
        .post('/api/v1/wearable/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('connectionId');
    });

    test('should get wearable data', async () => {
      const response = await request(app)
        .get('/api/v1/wearable/data')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date: '2024-01-01' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metrics');
    });

    test('should sync wearable data', async () => {
      const response = await request(app)
        .post('/api/v1/wearable/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deviceId: 'test_device_123' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('4. Social Community Platform', () => {
    test('should create community post', async () => {
      const postData = {
        content: 'Great workout today!',
        type: 'achievement',
        tags: ['workout', 'motivation'],
        visibility: 'public'
      };

      const response = await request(app)
        .post('/api/v1/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe(postData.content);
    });

    test('should get community feed', async () => {
      const response = await request(app)
        .get('/api/v1/social/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should join community group', async () => {
      const groupData = {
        name: 'Football QBs',
        sport: 'football',
        focus: 'quarterback_training'
      };

      const response = await request(app)
        .post('/api/v1/social/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('5. Enhanced Gamification', () => {
    test('should get user achievements', async () => {
      const response = await request(app)
        .get('/api/v1/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get leaderboard', async () => {
      const response = await request(app)
        .get('/api/v1/achievements/leaderboard')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'overall' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should award achievement', async () => {
      const achievementData = {
        type: 'workout_streak',
        value: 7,
        description: 'Completed 7 consecutive workouts'
      };

      const response = await request(app)
        .post('/api/v1/achievements/award')
        .set('Authorization', `Bearer ${authToken}`)
        .send(achievementData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('6. Standalone AI Football Coach', () => {
    test('should get tactical analysis', async () => {
      const analysisData = {
        gameId: 'test_game_123',
        team: 'offense',
        formation: 'spread',
        down: 2,
        yardsToGo: 8
      };

      const response = await request(app)
        .post('/api/v1/football-coach/tactical-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should get play prediction', async () => {
      const gameData = {
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        currentScore: '14-10',
        timeRemaining: '3:45',
        fieldPosition: 'own_35'
      };

      const response = await request(app)
        .post('/api/v1/football-coach/play-prediction')
        .set('Authorization', `Bearer ${authToken}`)
        .send(gameData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('prediction');
    });
  });

  describe('7. Multi-Language & International Expansion', () => {
    test('should get available languages', async () => {
      const response = await request(app)
        .get('/api/v1/i18n/languages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should set user language preference', async () => {
      const response = await request(app)
        .put('/api/v1/i18n/language')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ language: 'es' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should get localized content', async () => {
      const response = await request(app)
        .get('/api/v1/i18n/content')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ key: 'welcome_message', language: 'es' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('content');
    });
  });

  describe('8. Advanced Predictive Analytics Dashboard', () => {
    test('should get performance predictions', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/predictions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ athleteId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('predictions');
    });

    test('should get career trajectory analysis', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/career-trajectory')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ athleteId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trajectory');
    });

    test('should get performance trends', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ athleteId, timeframe: '30d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('9. Voice-Activated AI Coach', () => {
    test('should process voice command', async () => {
      const voiceData = {
        audioData: 'base64_encoded_audio',
        command: 'how to improve my squat form',
        language: 'en'
      };

      const response = await request(app)
        .post('/api/v1/voice/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send(voiceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('response');
    });

    test('should get voice training tips', async () => {
      const response = await request(app)
        .get('/api/v1/voice/tips')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'technique' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('10. Third-Party API Ecosystem', () => {
    test('should register API application', async () => {
      const appData = {
        name: 'Test Integration App',
        description: 'Integration for testing',
        redirectUris: ['https://testapp.com/callback'],
        scopes: ['read:athletes', 'write:performance']
      };

      const response = await request(app)
        .post('/api/v1/ecosystem/apps')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clientId');
      expect(response.body.data).toHaveProperty('clientSecret');
    });

    test('should get API documentation', async () => {
      const response = await request(app)
        .get('/api/v1/ecosystem/docs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('endpoints');
    });
  });

  describe('11. E-commerce Integration', () => {
    test('should get product recommendations', async () => {
      const response = await request(app)
        .get('/api/v1/ecommerce/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ athleteId, category: 'equipment' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should create order', async () => {
      const orderData = {
        items: [
          { productId: 'prod_123', quantity: 1, price: 99.99 }
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        }
      };

      const response = await request(app)
        .post('/api/v1/ecommerce/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderId');
    });
  });

  describe('12. Real-Time Collaboration Tools', () => {
    test('should create collaboration session', async () => {
      const sessionData = {
        title: 'Test Coaching Session',
        description: 'Real-time collaboration test',
        maxParticipants: 5,
        allowDrawing: true,
        allowChat: true,
        allowScreenShare: true
      };

      const response = await request(app)
        .post('/api/v1/collaboration/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    test('should get user sessions', async () => {
      const response = await request(app)
        .get('/api/v1/collaboration/user/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('13. Advanced Injury Prevention System', () => {
    test('should analyze movement pattern', async () => {
      // Mock image upload
      const response = await request(app)
        .post('/api/v1/injury-prevention/analyze-movement')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', Buffer.from('fake image data'), 'movement.jpg')
        .field('exerciseType', 'squat')
        .field('bodyPart', 'knees')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analysis');
    });

    test('should create rehabilitation plan', async () => {
      const rehabData = {
        athleteId,
        injuryRisks: ['knee_pain', 'back_strain']
      };

      const response = await request(app)
        .post('/api/v1/injury-prevention/rehabilitation-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rehabData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('phases');
    });

    test('should analyze training load', async () => {
      const loadData = {
        athleteId,
        sessions: [
          { date: '2024-01-01', trainingLoad: 100 },
          { date: '2024-01-02', trainingLoad: 120 }
        ]
      };

      const response = await request(app)
        .post('/api/v1/injury-prevention/analyze-load')
        .set('Authorization', `Bearer ${authToken}`)
        .send(loadData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('currentLoad');
    });
  });

  describe('14. Institutional Partnerships Program', () => {
    test('should create institution', async () => {
      const institutionData = {
        name: 'Test University',
        type: 'university',
        domain: 'test.edu',
        primarySport: 'football',
        subscriptionPlan: 'premium',
        maxUsers: 500,
        maxTeams: 20,
        whiteLabelEnabled: true
      };

      const response = await request(app)
        .post('/api/v1/institutions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(institutionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('apiCredentials');
    });

    test('should create white-label configuration', async () => {
      const whiteLabelData = {
        primaryColor: '#2563eb',
        secondaryColor: '#1f2937',
        appName: 'Test University Athletics',
        tagline: 'Excellence in Athletics',
        supportEmail: 'support@test.edu'
      };

      const response = await request(app)
        .post('/api/v1/institutions/inst_123/white-label')
        .set('Authorization', `Bearer ${authToken}`)
        .send(whiteLabelData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('branding');
    });

    test('should bulk import athletes', async () => {
      const athletesData = {
        athletes: [
          {
            name: 'Jane Smith',
            email: 'jane@test.edu',
            sport: 'basketball',
            position: 'PG',
            year: 'sophomore'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/institutions/inst_123/athletes/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(athletesData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('successful');
      expect(response.body.data).toHaveProperty('failed');
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end athlete workflow', async () => {
      // 1. Update athlete profile
      const profileUpdate = {
        goals: ['improve_speed', 'build_strength'],
        preferences: { notifications: true, publicProfile: false }
      };

      await request(app)
        .put(`/api/v1/athletes/${athleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileUpdate)
        .expect(200);

      // 2. Get personalized recommendations
      const recResponse = await request(app)
        .get('/api/v1/personalization/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(recResponse.body.success).toBe(true);

      // 3. Create a social post about progress
      const postData = {
        content: 'Working hard on my goals!',
        type: 'progress',
        tags: ['goals', 'motivation']
      };

      await request(app)
        .post('/api/v1/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(201);

      // 4. Check achievements
      const achievementResponse = await request(app)
        .get('/api/v1/achievements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(achievementResponse.body.success).toBe(true);
    });

    test('should handle concurrent API requests', async () => {
      const requests = [
        request(app).get('/api/v1/personalization/recommendations').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/v1/achievements').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/v1/social/feed').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/v1/analytics/trends').set('Authorization', `Bearer ${authToken}`).query({ athleteId })
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});