const { logger } = require('../utils/logger');
const DataStorageService = require('./dataStorageService');
const RealTimeService = require('./realTimeService');

// Data quality monitoring service
class DataQualityMonitoringService {
    constructor() {
        this.storageService = new DataStorageService();
        this.realTimeService = new RealTimeService();
        this.monitoringInterval = null;
        this.isRunning = false;
        this.alerts = [];
        this.qualityThresholds = {
            minConfidence: 50,
            minDataQuality: 60,
            maxStaleHours: 168, // 7 days
            minSources: 1,
            maxErrorRate: 0.1 // 10%
        };
        this.alertCooldown = 60 * 60 * 1000; // 1 hour cooldown between similar alerts
    }

    // Initialize the service
    async initialize() {
        try {
            await this.storageService.initialize();
            await this.realTimeService.initialize();

            logger.info('Data quality monitoring service initialized');
        } catch (error) {
            logger.error('Failed to initialize data quality monitoring service:', error);
            throw error;
        }
    }

    // Start monitoring
    async start() {
        if (this.isRunning) {
            logger.warn('Data quality monitoring service is already running');
            return;
        }

        try {
            this.isRunning = true;
            logger.info('Starting data quality monitoring service');

            // Start immediate check
            await this.performQualityCheck();

            // Schedule regular monitoring
            this.monitoringInterval = setInterval(async () => {
                if (this.isRunning) {
                    await this.performQualityCheck();
                }
            }, 30 * 60 * 1000); // Every 30 minutes

            logger.info('Data quality monitoring service started successfully');
        } catch (error) {
            logger.error('Error starting data quality monitoring service:', error);
            this.isRunning = false;
            throw error;
        }
    }

    // Stop monitoring
    async stop() {
        if (!this.isRunning) {
            logger.warn('Data quality monitoring service is not running');
            return;
        }

        try {
            this.isRunning = false;

            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            logger.info('Data quality monitoring service stopped');
        } catch (error) {
            logger.error('Error stopping data quality monitoring service:', error);
        }
    }

    // Perform comprehensive quality check
    async performQualityCheck() {
        try {
            logger.info('Performing data quality check');

            const issues = [];

            // Check overall data quality
            const overallStats = await this.checkOverallQuality();
            issues.push(...overallStats.issues);

            // Check individual athlete quality
            const athleteIssues = await this.checkAthleteQuality();
            issues.push(...athleteIssues);

            // Check data freshness
            const freshnessIssues = await this.checkDataFreshness();
            issues.push(...freshnessIssues);

            // Check source reliability
            const sourceIssues = await this.checkSourceReliability();
            issues.push(...sourceIssues);

            // Check error rates
            const errorIssues = await this.checkErrorRates();
            issues.push(...errorIssues);

            // Process alerts
            await this.processAlerts(issues);

            // Store quality metrics
            await this.storeQualityMetrics(overallStats);

            logger.info(`Data quality check completed. Found ${issues.length} issues`);
        } catch (error) {
            logger.error('Error performing quality check:', error);
        }
    }

    // Check overall data quality statistics
    async checkOverallQuality() {
        try {
            const stats = await this.storageService.getDataQualityStats();

            const issues = [];

            // Check average confidence
            if (stats.averageConfidence < this.qualityThresholds.minConfidence) {
                issues.push({
                    type: 'overall_confidence',
                    severity: 'high',
                    message: `Average data confidence (${stats.averageConfidence.toFixed(1)}%) is below threshold (${this.qualityThresholds.minConfidence}%)`,
                    metric: 'averageConfidence',
                    value: stats.averageConfidence,
                    threshold: this.qualityThresholds.minConfidence
                });
            }

            // Check average data quality
            if (stats.averageQuality < this.qualityThresholds.minDataQuality) {
                issues.push({
                    type: 'overall_quality',
                    severity: 'high',
                    message: `Average data quality (${stats.averageQuality.toFixed(1)}%) is below threshold (${this.qualityThresholds.minDataQuality}%)`,
                    metric: 'averageQuality',
                    value: stats.averageQuality,
                    threshold: this.qualityThresholds.minDataQuality
                });
            }

            // Check total athletes
            if (stats.totalAthletes < 100) {
                issues.push({
                    type: 'insufficient_data',
                    severity: 'medium',
                    message: `Only ${stats.totalAthletes} athletes in database. Consider expanding data collection.`,
                    metric: 'totalAthletes',
                    value: stats.totalAthletes,
                    threshold: 100
                });
            }

            return { stats, issues };
        } catch (error) {
            logger.error('Error checking overall quality:', error);
            return { stats: {}, issues: [] };
        }
    }

    // Check individual athlete data quality
    async checkAthleteQuality() {
        try {
            const db = this.storageService.db;
            const collection = db.collection('athlete_data');

            const issues = [];

            // Find athletes with low confidence
            const lowConfidenceAthletes = await collection.find({
                'metadata.confidence': { $lt: this.qualityThresholds.minConfidence }
            }).limit(20).toArray();

            lowConfidenceAthletes.forEach(athlete => {
                issues.push({
                    type: 'low_confidence_athlete',
                    severity: 'medium',
                    message: `Athlete ${athlete.name} has low confidence score (${athlete.metadata.confidence.toFixed(1)}%)`,
                    athleteId: athlete._id,
                    athleteName: athlete.name,
                    metric: 'confidence',
                    value: athlete.metadata.confidence,
                    threshold: this.qualityThresholds.minConfidence
                });
            });

            // Find athletes with insufficient sources
            const insufficientSources = await collection.find({
                $or: [
                    { 'metadata.sourcesUsed': { $exists: false } },
                    { 'metadata.sourcesUsed': { $size: { $lt: this.qualityThresholds.minSources } } }
                ]
            }).limit(20).toArray();

            insufficientSources.forEach(athlete => {
                const sourcesUsed = athlete.metadata?.sourcesUsed?.length || 0;
                issues.push({
                    type: 'insufficient_sources',
                    severity: 'low',
                    message: `Athlete ${athlete.name} only has ${sourcesUsed} data sources`,
                    athleteId: athlete._id,
                    athleteName: athlete.name,
                    metric: 'sourcesUsed',
                    value: sourcesUsed,
                    threshold: this.qualityThresholds.minSources
                });
            });

            return issues;
        } catch (error) {
            logger.error('Error checking athlete quality:', error);
            return [];
        }
    }

    // Check data freshness
    async checkDataFreshness() {
        try {
            const db = this.storageService.db;
            const collection = db.collection('athlete_data');

            const issues = [];
            const cutoffDate = new Date(Date.now() - this.qualityThresholds.maxStaleHours * 60 * 60 * 1000);

            // Find stale data
            const staleAthletes = await collection.find({
                updatedAt: { $lt: cutoffDate }
            }).limit(20).toArray();

            staleAthletes.forEach(athlete => {
                const hoursSince = (new Date() - new Date(athlete.updatedAt)) / (1000 * 60 * 60);
                issues.push({
                    type: 'stale_data',
                    severity: 'medium',
                    message: `Athlete ${athlete.name} data is ${hoursSince.toFixed(1)} hours old`,
                    athleteId: athlete._id,
                    athleteName: athlete.name,
                    metric: 'hoursSinceUpdate',
                    value: hoursSince,
                    threshold: this.qualityThresholds.maxStaleHours
                });
            });

            return issues;
        } catch (error) {
            logger.error('Error checking data freshness:', error);
            return [];
        }
    }

    // Check source reliability
    async checkSourceReliability() {
        try {
            const db = this.storageService.db;
            const collection = db.collection('data_quality');

            const issues = [];

            // Aggregate source success rates
            const sourceStats = await collection.aggregate([
                { $unwind: '$sourcesUsed' },
                {
                    $group: {
                        _id: '$sourcesUsed',
                        totalUses: { $sum: 1 },
                        avgQuality: { $avg: '$dataQuality' },
                        avgConfidence: { $avg: '$confidence' }
                    }
                },
                { $sort: { totalUses: -1 } }
            ]).toArray();

            sourceStats.forEach(source => {
                // Check if source has low average quality
                if (source.avgQuality < 50) {
                    issues.push({
                        type: 'unreliable_source',
                        severity: 'high',
                        message: `Source ${source._id} has low average quality (${source.avgQuality.toFixed(1)}%)`,
                        source: source._id,
                        metric: 'avgQuality',
                        value: source.avgQuality,
                        threshold: 50
                    });
                }

                // Check if source has low average confidence
                if (source.avgConfidence < 40) {
                    issues.push({
                        type: 'unreliable_source_confidence',
                        severity: 'medium',
                        message: `Source ${source._id} has low average confidence (${source.avgConfidence.toFixed(1)}%)`,
                        source: source._id,
                        metric: 'avgConfidence',
                        value: source.avgConfidence,
                        threshold: 40
                    });
                }
            });

            return issues;
        } catch (error) {
            logger.error('Error checking source reliability:', error);
            return [];
        }
    }

    // Check error rates
    async checkErrorRates() {
        try {
            const db = this.storageService.db;
            const collection = db.collection('scraping_jobs');

            const issues = [];

            // Get recent job statistics
            const recentJobs = await collection.find({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            }).toArray();

            if (recentJobs.length > 0) {
                const failedJobs = recentJobs.filter(job => job.status === 'failed');
                const errorRate = failedJobs.length / recentJobs.length;

                if (errorRate > this.qualityThresholds.maxErrorRate) {
                    issues.push({
                        type: 'high_error_rate',
                        severity: 'high',
                        message: `Scraping error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.qualityThresholds.maxErrorRate * 100)}%)`,
                        metric: 'errorRate',
                        value: errorRate,
                        threshold: this.qualityThresholds.maxErrorRate,
                        totalJobs: recentJobs.length,
                        failedJobs: failedJobs.length
                    });
                }
            }

            return issues;
        } catch (error) {
            logger.error('Error checking error rates:', error);
            return [];
        }
    }

    // Process alerts and send notifications
    async processAlerts(newIssues) {
        try {
            const currentTime = new Date();

            // Filter out alerts that are on cooldown
            const activeAlerts = newIssues.filter(issue => {
                const existingAlert = this.alerts.find(alert =>
                    alert.type === issue.type &&
                    alert.athleteId === issue.athleteId &&
                    alert.source === issue.source &&
                    (currentTime - new Date(alert.lastSent)) < this.alertCooldown
                );

                return !existingAlert;
            });

            // Add new alerts
            activeAlerts.forEach(issue => {
                const alert = {
                    ...issue,
                    id: this.generateAlertId(),
                    firstDetected: currentTime,
                    lastSent: currentTime,
                    occurrences: 1
                };

                this.alerts.push(alert);
            });

            // Update existing alerts
            this.alerts.forEach(alert => {
                const matchingIssue = newIssues.find(issue =>
                    issue.type === alert.type &&
                    issue.athleteId === alert.athleteId &&
                    issue.source === alert.source
                );

                if (matchingIssue) {
                    alert.occurrences++;
                    alert.lastSent = currentTime;
                    alert.value = matchingIssue.value; // Update with latest value
                }
            });

            // Send notifications for new alerts
            for (const alert of activeAlerts) {
                await this.sendAlertNotification(alert);
            }

            // Clean up old alerts
            this.alerts = this.alerts.filter(alert =>
                (currentTime - new Date(alert.firstDetected)) < 7 * 24 * 60 * 60 * 1000 // Keep for 7 days
            );

            logger.info(`Processed ${activeAlerts.length} new alerts`);
        } catch (error) {
            logger.error('Error processing alerts:', error);
        }
    }

    // Send alert notification
    async sendAlertNotification(alert) {
        try {
            // Send via real-time service
            await this.realTimeService.broadcastToTopic('admin_alerts', {
                type: 'data_quality_alert',
                alert: {
                    id: alert.id,
                    type: alert.type,
                    severity: alert.severity,
                    message: alert.message,
                    timestamp: new Date(),
                    occurrences: alert.occurrences
                }
            });

            // Log alert
            logger.warn(`Data Quality Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);

            // In a production system, you might also:
            // - Send email notifications
            // - Send SMS alerts for critical issues
            // - Create tickets in issue tracking systems
            // - Send Slack/Discord notifications

        } catch (error) {
            logger.error('Error sending alert notification:', error);
        }
    }

    // Store quality metrics
    async storeQualityMetrics(stats) {
        try {
            const db = this.storageService.db;
            const collection = db.collection('quality_metrics');

            const metrics = {
                timestamp: new Date(),
                totalAthletes: stats.stats.totalAthletes || 0,
                averageQuality: stats.stats.averageQuality || 0,
                averageConfidence: stats.stats.averageConfidence || 0,
                highQualityCount: stats.stats.highQualityCount || 0,
                sourceDistribution: stats.stats.sourceDistribution || {},
                activeAlerts: this.alerts.length,
                issuesFound: stats.issues.length
            };

            await collection.insertOne(metrics);
        } catch (error) {
            logger.error('Error storing quality metrics:', error);
        }
    }

    // Generate unique alert ID
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get current alerts
    getCurrentAlerts() {
        return this.alerts.map(alert => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            firstDetected: alert.firstDetected,
            lastSent: alert.lastSent,
            occurrences: alert.occurrences,
            athleteName: alert.athleteName,
            source: alert.source,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold
        }));
    }

    // Get quality metrics history
    async getQualityMetricsHistory(hours = 24) {
        try {
            const db = this.storageService.db;
            const collection = db.collection('quality_metrics');

            const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

            return await collection.find({
                timestamp: { $gte: cutoffDate }
            }).sort({ timestamp: -1 }).toArray();
        } catch (error) {
            logger.error('Error getting quality metrics history:', error);
            return [];
        }
    }

    // Update quality thresholds
    updateQualityThresholds(newThresholds) {
        try {
            this.qualityThresholds = { ...this.qualityThresholds, ...newThresholds };
            logger.info('Quality thresholds updated:', this.qualityThresholds);
        } catch (error) {
            logger.error('Error updating quality thresholds:', error);
        }
    }

    // Manual quality check
    async manualQualityCheck() {
        if (!this.isRunning) {
            await this.initialize();
        }
        await this.performQualityCheck();
    }

    // Get monitoring status
    getMonitoringStatus() {
        return {
            isRunning: this.isRunning,
            activeAlerts: this.alerts.length,
            qualityThresholds: this.qualityThresholds,
            lastCheck: this.lastCheckTime || null
        };
    }

    // Health check
    async healthCheck() {
        try {
            const status = this.getMonitoringStatus();
            const isHealthy = status.isRunning && status.activeAlerts < 50; // Reasonable alert threshold

            return {
                service: 'DataQualityMonitoringService',
                healthy: isHealthy,
                running: status.isRunning,
                alerts: status.activeAlerts,
                lastCheck: status.lastCheck
            };
        } catch (error) {
            logger.error('Health check failed:', error);
            return {
                service: 'DataQualityMonitoringService',
                healthy: false,
                error: error.message
            };
        }
    }
}

module.exports = DataQualityMonitoringService;
