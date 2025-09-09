const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// Real-Time Analytics Service for live performance tracking
class RealTimeAnalyticsService {
    constructor() {
        this.activeSessions = new Map();
        this.performanceMetrics = new Map();
        this.alerts = new Map();
        this.websocketClients = new Set();
        this.isInitialized = false;
        this.updateInterval = null;
    }

    // Initialize the service
    async initialize() {
        try {
            logger.info('Initializing Real-Time Analytics Service...');

            // Start real-time data processing
            this.startRealTimeProcessing();

            // Initialize performance tracking
            this.initializePerformanceTracking();

            // Set up alert monitoring
            this.setupAlertMonitoring();

            this.isInitialized = true;
            logger.info('Real-Time Analytics Service initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize Real-Time Analytics Service:', error);
            throw error;
        }
    }

    // Start real-time data processing
    startRealTimeProcessing() {
        // Process real-time data every 5 seconds
        this.updateInterval = setInterval(() => {
            this.processRealTimeData();
        }, 5000);
    }

    // Initialize performance tracking
    initializePerformanceTracking() {
        this.performanceMetrics.set('activeUsers', 0);
        this.performanceMetrics.set('dataPointsProcessed', 0);
        this.performanceMetrics.set('alertsTriggered', 0);
        this.performanceMetrics.set('averageResponseTime', 0);
    }

    // Set up alert monitoring
    setupAlertMonitoring() {
        this.alertThresholds = {
            heartRate: { min: 50, max: 200, critical: 220 },
            fatigue: { warning: 70, critical: 85 },
            recovery: { warning: 60, critical: 40 },
            performanceDrop: { threshold: 15 } // 15% drop
        };
    }

    // Process real-time data
    async processRealTimeData() {
        try {
            // Get active sessions
            const activeSessions = Array.from(this.activeSessions.values());

            for (const session of activeSessions) {
                await this.analyzeSessionData(session);
            }

            // Update performance metrics
            this.updatePerformanceMetrics();

        } catch (error) {
            logger.error('Error processing real-time data:', error);
        }
    }

    // Analyze session data
    async analyzeSessionData(session) {
        try {
            const { athleteId, sport, metrics } = session;

            // Analyze heart rate
            if (metrics.heartRate) {
                await this.analyzeHeartRate(athleteId, metrics.heartRate);
            }

            // Analyze fatigue levels
            if (metrics.fatigue) {
                await this.analyzeFatigue(athleteId, metrics.fatigue);
            }

            // Analyze performance metrics
            if (metrics.performance) {
                await this.analyzePerformance(athleteId, metrics.performance);
            }

            // Check for alerts
            await this.checkForAlerts(athleteId, metrics);

        } catch (error) {
            logger.error(`Error analyzing session data for athlete ${session.athleteId}:`, error);
        }
    }

    // Analyze heart rate data
    async analyzeHeartRate(athleteId, heartRate) {
        const thresholds = this.alertThresholds.heartRate;

        if (heartRate > thresholds.critical) {
            await this.triggerAlert(athleteId, 'CRITICAL_HEART_RATE', {
                current: heartRate,
                threshold: thresholds.critical,
                message: `Heart rate critically high: ${heartRate} bpm`
            });
        } else if (heartRate > thresholds.max) {
            await this.triggerAlert(athleteId, 'HIGH_HEART_RATE', {
                current: heartRate,
                threshold: thresholds.max,
                message: `Heart rate elevated: ${heartRate} bpm`
            });
        } else if (heartRate < thresholds.min) {
            await this.triggerAlert(athleteId, 'LOW_HEART_RATE', {
                current: heartRate,
                threshold: thresholds.min,
                message: `Heart rate low: ${heartRate} bpm`
            });
        }
    }

    // Analyze fatigue levels
    async analyzeFatigue(athleteId, fatigue) {
        const thresholds = this.alertThresholds.fatigue;

        if (fatigue > thresholds.critical) {
            await this.triggerAlert(athleteId, 'CRITICAL_FATIGUE', {
                current: fatigue,
                threshold: thresholds.critical,
                message: `Critical fatigue level: ${fatigue}%`
            });
        } else if (fatigue > thresholds.warning) {
            await this.triggerAlert(athleteId, 'HIGH_FATIGUE', {
                current: fatigue,
                threshold: thresholds.warning,
                message: `High fatigue level: ${fatigue}%`
            });
        }
    }

    // Analyze performance metrics
    async analyzePerformance(athleteId, performance) {
        // Calculate performance trends
        const baseline = await this.getAthleteBaseline(athleteId);
        const performanceDrop = ((baseline - performance) / baseline) * 100;

        if (performanceDrop > this.alertThresholds.performanceDrop.threshold) {
            await this.triggerAlert(athleteId, 'PERFORMANCE_DROP', {
                current: performance,
                baseline: baseline,
                drop: performanceDrop,
                message: `Performance dropped ${performanceDrop.toFixed(1)}%`
            });
        }
    }

    // Check for alerts
    async checkForAlerts(athleteId, metrics) {
        // Check recovery status
        if (metrics.recovery < this.alertThresholds.recovery.critical) {
            await this.triggerAlert(athleteId, 'CRITICAL_RECOVERY', {
                current: metrics.recovery,
                threshold: this.alertThresholds.recovery.critical,
                message: `Critical recovery level: ${metrics.recovery}%`
            });
        } else if (metrics.recovery < this.alertThresholds.recovery.warning) {
            await this.triggerAlert(athleteId, 'LOW_RECOVERY', {
                current: metrics.recovery,
                threshold: this.alertThresholds.recovery.warning,
                message: `Low recovery level: ${metrics.recovery}%`
            });
        }
    }

    // Trigger alert
    async triggerAlert(athleteId, alertType, data) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            athleteId,
            type: alertType,
            data,
            timestamp: new Date(),
            acknowledged: false
        };

        // Store alert
        if (!this.alerts.has(athleteId)) {
            this.alerts.set(athleteId, []);
        }
        this.alerts.get(athleteId).push(alert);

        // Update metrics
        this.performanceMetrics.set('alertsTriggered',
            this.performanceMetrics.get('alertsTriggered') + 1);

        // Broadcast to WebSocket clients
        this.broadcastAlert(alert);

        logger.warn(`Alert triggered for athlete ${athleteId}: ${alertType}`, data);
    }

    // Broadcast alert to WebSocket clients
    broadcastAlert(alert) {
        // This would integrate with WebSocket server
        // For now, we'll just log it
        logger.info(`Broadcasting alert: ${alert.type} for athlete ${alert.athleteId}`);
    }

    // Get athlete baseline performance
    async getAthleteBaseline(athleteId) {
        // In a real implementation, this would query the database
        // For demo purposes, return a mock baseline
        return 85; // Mock baseline score
    }

    // Update performance metrics
    updatePerformanceMetrics() {
        this.performanceMetrics.set('activeUsers', this.activeSessions.size);
        this.performanceMetrics.set('dataPointsProcessed',
            this.performanceMetrics.get('dataPointsProcessed') + this.activeSessions.size);
    }

    // Start session for athlete
    startSession(athleteId, sport, initialMetrics = {}) {
        const session = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            athleteId,
            sport,
            startTime: new Date(),
            metrics: { ...initialMetrics },
            alerts: [],
            status: 'active'
        };

        this.activeSessions.set(athleteId, session);
        logger.info(`Started real-time session for athlete ${athleteId}`);

        return session;
    }

    // Update session metrics
    updateSessionMetrics(athleteId, metrics) {
        const session = this.activeSessions.get(athleteId);
        if (!session) {
            logger.warn(`No active session found for athlete ${athleteId}`);
            return null;
        }

        // Update metrics
        session.metrics = { ...session.metrics, ...metrics };
        session.lastUpdate = new Date();

        return session;
    }

    // End session
    endSession(athleteId) {
        const session = this.activeSessions.get(athleteId);
        if (!session) {
            return null;
        }

        session.endTime = new Date();
        session.status = 'completed';
        session.duration = session.endTime - session.startTime;

        // Remove from active sessions
        this.activeSessions.delete(athleteId);

        logger.info(`Ended real-time session for athlete ${athleteId}, duration: ${session.duration}ms`);

        return session;
    }

    // Get active session
    getActiveSession(athleteId) {
        return this.activeSessions.get(athleteId) || null;
    }

    // Get athlete alerts
    getAthleteAlerts(athleteId, limit = 10) {
        const alerts = this.alerts.get(athleteId) || [];
        return alerts.slice(-limit);
    }

    // Acknowledge alert
    acknowledgeAlert(athleteId, alertId) {
        const alerts = this.alerts.get(athleteId) || [];
        const alert = alerts.find(a => a.id === alertId);

        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date();
            return true;
        }

        return false;
    }

    // Get real-time dashboard data
    getDashboardData(athleteId) {
        const session = this.getActiveSession(athleteId);
        const alerts = this.getAthleteAlerts(athleteId, 5);

        return {
            session: session ? {
                id: session.id,
                sport: session.sport,
                startTime: session.startTime,
                metrics: session.metrics,
                status: session.status
            } : null,
            alerts: alerts.map(alert => ({
                id: alert.id,
                type: alert.type,
                message: alert.data.message,
                timestamp: alert.timestamp,
                acknowledged: alert.acknowledged
            })),
            performance: {
                activeUsers: this.performanceMetrics.get('activeUsers'),
                dataPointsProcessed: this.performanceMetrics.get('dataPointsProcessed'),
                alertsTriggered: this.performanceMetrics.get('alertsTriggered')
            }
        };
    }

    // Get analytics summary
    getAnalyticsSummary(timeframe = '24h') {
        // Calculate time range
        const now = new Date();
        const startTime = new Date(now.getTime() - this.parseTimeframe(timeframe));

        return {
            timeframe,
            activeSessions: this.activeSessions.size,
            totalAlerts: Array.from(this.alerts.values()).reduce((sum, alerts) => sum + alerts.length, 0),
            performanceMetrics: Object.fromEntries(this.performanceMetrics),
            topAlerts: this.getTopAlerts(startTime)
        };
    }

    // Parse timeframe string
    parseTimeframe(timeframe) {
        const unit = timeframe.slice(-1);
        const value = parseInt(timeframe.slice(0, -1));

        switch (unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'w': return value * 7 * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000; // Default to 24 hours
        }
    }

    // Get top alerts
    getTopAlerts(since) {
        const allAlerts = [];
        for (const alerts of this.alerts.values()) {
            allAlerts.push(...alerts.filter(alert => alert.timestamp >= since));
        }

        // Group by type and count
        const alertCounts = {};
        allAlerts.forEach(alert => {
            alertCounts[alert.type] = (alertCounts[alert.type] || 0) + 1;
        });

        return Object.entries(alertCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    // Clean up old data
    cleanup() {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        // Clean up old alerts
        for (const [athleteId, alerts] of this.alerts.entries()) {
            const recentAlerts = alerts.filter(alert => alert.timestamp >= cutoffTime);
            if (recentAlerts.length === 0) {
                this.alerts.delete(athleteId);
            } else {
                this.alerts.set(athleteId, recentAlerts);
            }
        }

        logger.info('Real-Time Analytics Service cleanup completed');
    }

    // Stop the service
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // End all active sessions
        for (const athleteId of this.activeSessions.keys()) {
            this.endSession(athleteId);
        }

        this.isInitialized = false;
        logger.info('Real-Time Analytics Service stopped');
    }
}

module.exports = RealTimeAnalyticsService;
