const express = require('express');
const router = express.Router();
const eligibilityService = require('../services/eligibilityService');
const eligibilityCoach = require('../services/eligibilityCoach');
const { authenticateToken } = require('../middleware/auth');

// Initialize eligibility for new athlete
router.post('/initialize/:athleteId', authenticateToken, async (req, res) => {
  try {
    const eligibility = await eligibilityService.initializeEligibility(req.params.athleteId);
    res.json({
      message: 'Eligibility initialized successfully',
      eligibility: eligibility
    });
  } catch (error) {
    console.error('Error initializing eligibility:', error);
    res.status(500).json({ error: 'Failed to initialize eligibility' });
  }
});

// Get athlete eligibility status
router.get('/:athleteId', authenticateToken, async (req, res) => {
  try {
    const eligibility = await eligibilityService.calculateRemainingEligibility(req.params.athleteId);
    const amateurStatus = await eligibilityService.checkAmateurStatus(req.params.athleteId);

    res.json({
      eligibility,
      amateurStatus,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching eligibility:', error);
    res.status(500).json({ error: 'Failed to fetch eligibility data' });
  }
});

// Record competition and update eligibility
router.post('/:athleteId/competition', authenticateToken, async (req, res) => {
  try {
    const { competitionType, season } = req.body;

    if (!competitionType || !season) {
      return res.status(400).json({ error: 'Competition type and season are required' });
    }

    const result = await eligibilityService.recordCompetition(
      req.params.athleteId,
      competitionType,
      season
    );

    res.json(result);
  } catch (error) {
    console.error('Error recording competition:', error);
    res.status(500).json({ error: 'Failed to record competition' });
  }
});

// Update academic standing
router.put('/:athleteId/academic', authenticateToken, async (req, res) => {
  try {
    const academicData = req.body;

    const result = await eligibilityService.updateAcademicStanding(
      req.params.athleteId,
      academicData
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating academic standing:', error);
    res.status(500).json({ error: 'Failed to update academic standing' });
  }
});

// Record amateurism activity
router.post('/:athleteId/amateurism', authenticateToken, async (req, res) => {
  try {
    const earningsData = req.body;

    const result = await eligibilityService.recordAmateurismActivity(
      req.params.athleteId,
      earningsData
    );

    res.json(result);
  } catch (error) {
    console.error('Error recording amateurism activity:', error);
    res.status(500).json({ error: 'Failed to record amateurism activity' });
  }
});

// Get recruiting status
router.get('/:athleteId/recruiting/status', authenticateToken, async (req, res) => {
  try {
    const status = await eligibilityService.getRecruitingStatus(req.params.athleteId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching recruiting status:', error);
    res.status(500).json({ error: 'Failed to fetch recruiting status' });
  }
});

// Get comprehensive eligibility report
router.get('/:athleteId/report', authenticateToken, async (req, res) => {
  try {
    const report = await eligibilityService.getEligibilityReport(req.params.athleteId);
    res.json(report);
  } catch (error) {
    console.error('Error generating eligibility report:', error);
    res.status(500).json({ error: 'Failed to generate eligibility report' });
  }
});

// AI Coach Routes

// Generate eligibility-aware coaching
router.get('/:athleteId/coach/eligibility/:workoutType', authenticateToken, async (req, res) => {
  try {
    const { athleteId, workoutType } = req.params;
    const workoutData = req.query; // Performance data from query params

    const coaching = await eligibilityCoach.provideEligibilityCoaching(
      athleteId,
      workoutType,
      workoutData
    );

    res.json(coaching);
  } catch (error) {
    console.error('Error providing eligibility coaching:', error);
    res.status(500).json({ error: 'Failed to generate coaching response' });
  }
});

// Generate academic coaching
router.get('/:athleteId/coach/academic', authenticateToken, async (req, res) => {
  try {
    const academicData = req.query;

    const coaching = await eligibilityCoach.provideAcademicCoaching(
      req.params.athleteId,
      academicData
    );

    res.json(coaching);
  } catch (error) {
    console.error('Error providing academic coaching:', error);
    res.status(500).json({ error: 'Failed to generate academic coaching' });
  }
});

// Generate recruiting coaching
router.get('/:athleteId/coach/recruiting', authenticateToken, async (req, res) => {
  try {
    const recruitingData = req.query;

    const coaching = await eligibilityCoach.provideRecruitingCoaching(
      req.params.athleteId,
      recruitingData
    );

    res.json(coaching);
  } catch (error) {
    console.error('Error providing recruiting coaching:', error);
    res.status(500).json({ error: 'Failed to generate recruiting coaching' });
  }
});

// Generate performance coaching
router.post('/:athleteId/coach/performance', authenticateToken, async (req, res) => {
  try {
    const performanceData = req.body;

    const coaching = await eligibilityCoach.providePerformanceCoaching(
      req.params.athleteId,
      performanceData
    );

    res.json(coaching);
  } catch (error) {
    console.error('Error providing performance coaching:', error);
    res.status(500).json({ error: 'Failed to generate performance coaching' });
  }
});

// Generate workout coaching
router.post('/:athleteId/coach/workout', authenticateToken, async (req, res) => {
  try {
    const workoutData = req.body;

    const coaching = await eligibilityCoach.provideWorkoutCoaching(
      req.params.athleteId,
      workoutData
    );

    res.json(coaching);
  } catch (error) {
    console.error('Error providing workout coaching:', error);
    res.status(500).json({ error: 'Failed to generate workout coaching' });
  }
});

// Get AI coach statistics
router.get('/:athleteId/coach/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await eligibilityCoach.getCoachStats(req.params.athleteId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching coach stats:', error);
    res.status(500).json({ error: 'Failed to fetch coach statistics' });
  }
});

// Clear voice cache (admin only)
router.post('/coach/cache/clear', authenticateToken, async (req, res) => {
  try {
    // In production, add admin role check here
    const result = await eligibilityCoach.clearVoiceCache();
    res.json(result);
  } catch (error) {
    console.error('Error clearing voice cache:', error);
    res.status(500).json({ error: 'Failed to clear voice cache' });
  }
});

module.exports = router;
