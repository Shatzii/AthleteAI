const { logger } = require('../utils/logger');
const DataScrapingService = require('./dataScrapingService');
const DataStorageService = require('./dataStorageService');
const jobProcessor = require('./backgroundJobProcessor');

// Scheduled data refresh service
class ScheduledDataRefreshService {
    constructor() {
        this.scrapingService = new DataScrapingService();
        this.storageService = new DataStorageService();
        this.jobProcessor = jobProcessor;
        this.isRunning = false;
        this.refreshInterval = null;
        this.refreshConfig = {
            // Refresh intervals in minutes
            fullRefresh: 60 * 24, // Daily full refresh
            incrementalRefresh: 60 * 4, // Every 4 hours
            priorityRefresh: 60, // Hourly for priority athletes
            emergencyRefresh: 15 // Every 15 minutes for critical updates
        };
    }

    // Initialize the service
    async initialize() {
        try {
            await this.storageService.initialize();
            await this.scrapingService.initialize();
            await this.jobProcessor.initialize();

            logger.info('Scheduled data refresh service initialized');
        } catch (error) {
            logger.error('Failed to initialize scheduled data refresh service:', error);
            throw error;
        }
    }

    // Start the scheduled refresh service
    async start() {
        if (this.isRunning) {
            logger.warn('Scheduled data refresh service is already running');
            return;
        }

        try {
            this.isRunning = true;
            logger.info('Starting scheduled data refresh service');

            // Start immediate refresh
            await this.performFullRefresh();

            // Schedule regular refreshes
            this.scheduleRefreshes();

            logger.info('Scheduled data refresh service started successfully');
        } catch (error) {
            logger.error('Error starting scheduled data refresh service:', error);
            this.isRunning = false;
            throw error;
        }
    }

    // Stop the scheduled refresh service
    async stop() {
        if (!this.isRunning) {
            logger.warn('Scheduled data refresh service is not running');
            return;
        }

        try {
            this.isRunning = false;

            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }

            logger.info('Scheduled data refresh service stopped');
        } catch (error) {
            logger.error('Error stopping scheduled data refresh service:', error);
        }
    }

    // Schedule regular refreshes
    scheduleRefreshes() {
        // Full refresh every 24 hours
        setInterval(async () => {
            if (this.isRunning) {
                await this.performFullRefresh();
            }
        }, this.refreshConfig.fullRefresh * 60 * 1000);

        // Incremental refresh every 4 hours
        setInterval(async () => {
            if (this.isRunning) {
                await this.performIncrementalRefresh();
            }
        }, this.refreshConfig.incrementalRefresh * 60 * 1000);

        // Priority refresh every hour
        setInterval(async () => {
            if (this.isRunning) {
                await this.performPriorityRefresh();
            }
        }, this.refreshConfig.priorityRefresh * 60 * 1000);

        // Emergency refresh every 15 minutes
        setInterval(async () => {
            if (this.isRunning) {
                await this.performEmergencyRefresh();
            }
        }, this.refreshConfig.emergencyRefresh * 60 * 1000);

        logger.info('Scheduled refreshes configured');
    }

    // Perform full refresh of all athlete data
    async performFullRefresh() {
        try {
            logger.info('Starting full data refresh');

            // Get all athletes from database
            const athletes = await this.getAllAthletes();

            // Process athletes in batches
            const batchSize = 10;
            for (let i = 0; i < athletes.length; i += batchSize) {
                const batch = athletes.slice(i, i + batchSize);

                await this.jobProcessor.addBatchScrapingJobs(
                    batch.map(a => a.name),
                    { sport: 'football' },
                    'high'
                );
            }

            logger.info(`Full refresh queued for ${athletes.length} athletes`);
        } catch (error) {
            logger.error('Error performing full refresh:', error);
        }
    }

    // Perform incremental refresh for recently updated athletes
    async performIncrementalRefresh() {
        try {
            logger.info('Starting incremental data refresh');

            // Get athletes updated in the last 24 hours
            const recentAthletes = await this.getRecentlyUpdatedAthletes(24);

            if (recentAthletes.length > 0) {
                await this.jobProcessor.addBatchScrapingJobs(
                    recentAthletes.map(a => a.name),
                    { sport: 'football' },
                    'medium'
                );

                logger.info(`Incremental refresh queued for ${recentAthletes.length} athletes`);
            } else {
                logger.info('No athletes need incremental refresh');
            }
        } catch (error) {
            logger.error('Error performing incremental refresh:', error);
        }
    }

    // Perform priority refresh for high-profile athletes
    async performPriorityRefresh() {
        try {
            logger.info('Starting priority data refresh');

            // Get priority athletes (high ratings, recent activity, etc.)
            const priorityAthletes = await this.getPriorityAthletes();

            if (priorityAthletes.length > 0) {
                await this.jobProcessor.addBatchScrapingJobs(
                    priorityAthletes.map(a => a.name),
                    { sport: 'football' },
                    'high'
                );

                logger.info(`Priority refresh queued for ${priorityAthletes.length} athletes`);
            } else {
                logger.info('No priority athletes found');
            }
        } catch (error) {
            logger.error('Error performing priority refresh:', error);
        }
    }

    // Perform emergency refresh for critical updates
    async performEmergencyRefresh() {
        try {
            logger.info('Starting emergency data refresh');

            // Get athletes with critical updates needed
            const emergencyAthletes = await this.getEmergencyAthletes();

            if (emergencyAthletes.length > 0) {
                await this.jobProcessor.addBatchScrapingJobs(
                    emergencyAthletes.map(a => a.name),
                    { sport: 'football' },
                    'urgent'
                );

                logger.info(`Emergency refresh queued for ${emergencyAthletes.length} athletes`);
            } else {
                logger.info('No emergency athletes found');
            }
        } catch (error) {
            logger.error('Error performing emergency refresh:', error);
        }
    }

    // Process batch refresh job
    async processBatchRefresh(jobData) {
        const { athletes } = jobData;

        for (const athlete of athletes) {
            try {
                // Scrape fresh data for the athlete
                const freshData = await this.scrapingService.collectAthleteData(athlete.name, athlete.sport);

                if (freshData) {
                    // Store the updated data
                    await this.storageService.storeAthleteData(freshData);

                    logger.info(`Refreshed data for athlete: ${athlete.name}`);
                } else {
                    logger.warn(`No fresh data found for athlete: ${athlete.name}`);
                }

                // Add delay to avoid overwhelming external services
                await this.delay(2000);
            } catch (error) {
                logger.error(`Error refreshing athlete ${athlete.name}:`, error);
            }
        }
    }

    // Get all athletes from database
    async getAllAthletes() {
        try {
            const db = this.storageService.db;
            const collection = db.collection('athlete_data');

            return await collection.find({}).toArray();
        } catch (error) {
            logger.error('Error getting all athletes:', error);
            return [];
        }
    }

    // Get recently updated athletes
    async getRecentlyUpdatedAthletes(hours = 24) {
        try {
            const db = this.storageService.db;
            const collection = db.collection('athlete_data');

            const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

            return await collection.find({
                updatedAt: { $gte: cutoffDate }
            }).toArray();
        } catch (error) {
            logger.error('Error getting recently updated athletes:', error);
            return [];
        }
    }

    // Get priority athletes
    async getPriorityAthletes() {
        try {
            const db = this.storageService.db;
            const collection = db.collection('athlete_data');

            // Priority criteria: high rating, recent activity, multiple sources
            return await collection.find({
                $or: [
                    { 'recruitingData.rating': { $gte: 0.9 } },
                    { 'metadata.confidence': { $gte: 90 } },
                    { 'metadata.sourcesUsed': { $size: { $gte: 3 } } }
                ]
            }).limit(50).toArray();
        } catch (error) {
            logger.error('Error getting priority athletes:', error);
            return [];
        }
    }

    // Get athletes needing emergency refresh
    async getEmergencyAthletes() {
        try {
            const db = this.storageService.db;
            const collection = db.collection('athlete_data');

            // Emergency criteria: very old data or low confidence
            const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

            return await collection.find({
                $or: [
                    { updatedAt: { $lt: cutoffDate } },
                    { 'metadata.confidence': { $lt: 30 } },
                    { 'metadata.dataQuality': { $lt: 20 } }
                ]
            }).limit(20).toArray();
        } catch (error) {
            logger.error('Error getting emergency athletes:', error);
            return [];
        }
    }

    // Manual refresh for specific athlete
    async refreshAthlete(athleteName, sport = null) {
        try {
            logger.info(`Manual refresh requested for athlete: ${athleteName}`);

            const jobId = await this.jobProcessor.addScrapingJob(
                athleteName,
                { sport: sport || 'football' },
                'high'
            );

            return jobId;
        } catch (error) {
            logger.error(`Error creating manual refresh job for ${athleteName}:`, error);
            throw error;
        }
    }

    // Process single athlete refresh
    async processSingleRefresh(jobData) {
        const { athleteName, sport } = jobData;

        try {
            const freshData = await this.scrapingService.collectAthleteData(athleteName, sport);

            if (freshData) {
                await this.storageService.storeAthleteData(freshData);
                logger.info(`Successfully refreshed data for: ${athleteName}`);
                return { success: true, data: freshData };
            } else {
                logger.warn(`No data found for athlete: ${athleteName}`);
                return { success: false, message: 'No data found' };
            }
        } catch (error) {
            logger.error(`Error refreshing athlete ${athleteName}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get refresh statistics
    async getRefreshStats() {
        try {
            const jobStats = this.jobProcessor.getStats();

            const stats = {
                isRunning: this.isRunning,
                pendingJobs: jobStats.queuedJobs || 0,
                completedJobs: jobStats.completedJobs || 0,
                failedJobs: jobStats.failedJobs || 0,
                activeJobs: jobStats.activeJobs || 0,
                totalJobs: jobStats.totalJobs || 0
            };

            return stats;
        } catch (error) {
            logger.error('Error getting refresh stats:', error);
            return {};
        }
    }

        // Get last job execution time
    async getLastJobTime(jobType) {
        try {
            const db = this.storageService.db;
            const collection = db.collection('scraping_jobs');

            const lastJob = await collection.findOne(
                { type: jobType, status: 'completed' },
                { sort: { completedAt: -1 } }
            );

            return lastJob ? lastJob.completedAt : null;
        } catch (error) {
            logger.error(`Error getting last ${jobType} time:`, error);
            return null;
        }
    }

    // Configure refresh intervals
    updateRefreshConfig(newConfig) {
        try {
            this.refreshConfig = { ...this.refreshConfig, ...newConfig };
            logger.info('Refresh configuration updated:', this.refreshConfig);
        } catch (error) {
            logger.error('Error updating refresh config:', error);
        }
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Health check
    async healthCheck() {
        try {
            const stats = await this.getRefreshStats();
            const isHealthy = this.isRunning && stats.pendingJobs < 100;

            return {
                service: 'ScheduledDataRefreshService',
                healthy: isHealthy,
                running: this.isRunning,
                stats
            };
        } catch (error) {
            logger.error('Health check failed:', error);
            return {
                service: 'ScheduledDataRefreshService',
                healthy: false,
                error: error.message
            };
        }
    }
}

module.exports = ScheduledDataRefreshService;
