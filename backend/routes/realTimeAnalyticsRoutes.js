const express = require('express');
const router = express.Router();
const RealTimeAnalyticsService = require('../services/realTimeAnalyticsService');
const { authenticateToken } = require('../middleware/auth');

const realTimeAnalyticsService = new RealTimeAnalyticsService();

// Initialize service
realTimeAnalyticsService.initialize().catch(console.error);

// POST /api/real-time-analytics/start-session
// Start a real-time analytics session for an athlete
router.post('/start-session', authenticateToken, async (req, res) => {
    try {
        const { athleteId, sport, initialMetrics } = req.body;

        if (!athleteId || !sport) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and sport are required'
            });
        }

        const session = realTimeAnalyticsService.startSession(
            athleteId,
            sport,
            initialMetrics || {}
        );

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error starting analytics session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start analytics session',
            details: error.message
        });
    }
});

// PUT /api/real-time-analytics/update-metrics
// Update metrics for an active session
router.put('/update-metrics', authenticateToken, async (req, res) => {
    try {
        const { athleteId, metrics } = req.body;

        if (!athleteId || !metrics) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and metrics are required'
            });
        }

        const session = realTimeAnalyticsService.updateSessionMetrics(athleteId, metrics);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No active session found for athlete'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error updating session metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update session metrics',
            details: error.message
        });
    }
});

// POST /api/real-time-analytics/end-session
// End a real-time analytics session
router.post('/end-session', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.body;

        if (!athleteId) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID is required'
            });
        }

        const session = realTimeAnalyticsService.endSession(athleteId);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No active session found for athlete'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error ending analytics session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end analytics session',
            details: error.message
        });
    }
});

// GET /api/real-time-analytics/session/:athleteId
// Get current session for an athlete
router.get('/session/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;

        const session = realTimeAnalyticsService.getActiveSession(athleteId);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'No active session found for athlete'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch session',
            details: error.message
        });
    }
});

// GET /api/real-time-analytics/dashboard/:athleteId
// Get real-time dashboard data for an athlete
router.get('/dashboard/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;

        const dashboard = realTimeAnalyticsService.getDashboardData(athleteId);

        res.json({
            success: true,
            data: dashboard
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            details: error.message
        });
    }
});

// GET /api/real-time-analytics/alerts/:athleteId
// Get alerts for an athlete
router.get('/alerts/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { limit } = req.query;

        const alerts = realTimeAnalyticsService.getAthleteAlerts(
            athleteId,
            parseInt(limit) || 10
        );

        res.json({
            success: true,
            data: alerts
        });

    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alerts',
            details: error.message
        });
    }
});

// POST /api/real-time-analytics/acknowledge-alert
// Acknowledge an alert
router.post('/acknowledge-alert', authenticateToken, async (req, res) => {
    try {
        const { athleteId, alertId } = req.body;

        if (!athleteId || !alertId) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and alert ID are required'
            });
        }

        const acknowledged = realTimeAnalyticsService.acknowledgeAlert(athleteId, alertId);

        if (!acknowledged) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({
            success: true,
            message: 'Alert acknowledged successfully'
        });

    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge alert',
            details: error.message
        });
    }
});

// GET /api/real-time-analytics/analytics-summary
// Get analytics summary
router.get('/analytics-summary', authenticateToken, async (req, res) => {
    try {
        const { timeframe } = req.query;

        const summary = realTimeAnalyticsService.getAnalyticsSummary(timeframe || '24h');

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics summary',
            details: error.message
        });
    }
});

// POST /api/real-time-analytics/bulk-update
// Bulk update metrics for multiple athletes
router.post('/bulk-update', authenticateToken, async (req, res) => {
    try {
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                error: 'Updates array is required'
            });
        }

        const results = [];

        for (const update of updates) {
            try {
                const session = realTimeAnalyticsService.updateSessionMetrics(
                    update.athleteId,
                    update.metrics
                );

                results.push({
                    athleteId: update.athleteId,
                    success: true,
                    session: session
                });
            } catch (error) {
                results.push({
                    athleteId: update.athleteId,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            data: {
                totalUpdates: updates.length,
                successfulUpdates: results.filter(r => r.success).length,
                failedUpdates: results.filter(r => !r.success).length,
                results: results
            }
        });

    } catch (error) {
        console.error('Error in bulk update:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process bulk update',
            details: error.message
        });
    }
});

// GET /api/real-time-analytics/performance-metrics
// Get real-time performance metrics
router.get('/performance-metrics', authenticateToken, async (req, res) => {
    try {
        // Get current performance metrics
        const metrics = {
            activeUsers: realTimeAnalyticsService.performanceMetrics.get('activeUsers') || 0,
            dataPointsProcessed: realTimeAnalyticsService.performanceMetrics.get('dataPointsProcessed') || 0,
            alertsTriggered: realTimeAnalyticsService.performanceMetrics.get('alertsTriggered') || 0,
            averageResponseTime: realTimeAnalyticsService.performanceMetrics.get('averageResponseTime') || 0,
            timestamp: new Date()
        };

        res.json({
            success: true,
            data: metrics
        });

    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch performance metrics',
            details: error.message
        });
    }
});

// POST /api/real-time-analytics/alert-thresholds
// Update alert thresholds
router.post('/alert-thresholds', authenticateToken, async (req, res) => {
    try {
        const { thresholds } = req.body;

        if (!thresholds) {
            return res.status(400).json({
                success: false,
                error: 'Alert thresholds are required'
            });
        }

        // Update alert thresholds
        realTimeAnalyticsService.alertThresholds = {
            ...realTimeAnalyticsService.alertThresholds,
            ...thresholds
        };

        res.json({
            success: true,
            message: 'Alert thresholds updated successfully',
            data: realTimeAnalyticsService.alertThresholds
        });

    } catch (error) {
        console.error('Error updating alert thresholds:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update alert thresholds',
            details: error.message
        });
    }
});

// GET /api/real-time-analytics/health
// Get service health status
router.get('/health', authenticateToken, async (req, res) => {
    try {
        const health = {
            service: 'Real-Time Analytics',
            status: realTimeAnalyticsService.isInitialized ? 'healthy' : 'unhealthy',
            activeSessions: realTimeAnalyticsService.activeSessions.size,
            totalAlerts: Array.from(realTimeAnalyticsService.alerts.values())
                .reduce((sum, alerts) => sum + alerts.length, 0),
            uptime: process.uptime(),
            timestamp: new Date()
        };

        res.json({
            success: true,
            data: health
        });

    } catch (error) {
        console.error('Error fetching service health:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service health',
            details: error.message
        });
    }
});

module.exports = router;
