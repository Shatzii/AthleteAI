const { logger } = require('../utils/logger');
const DataScrapingService = require('./dataScrapingService');
const DataStorageService = require('./dataStorageService');

// Background job processing for data scraping
class BackgroundJobProcessor {
    constructor() {
        this.jobs = new Map();
        this.isProcessing = false;
        this.maxConcurrentJobs = 3;
        this.activeJobs = 0;
        this.jobQueue = [];
        this.scrapingService = new DataScrapingService();
        this.dataStorageService = new DataStorageService();
    }

    // Initialize the service
    async initialize() {
        try {
            await this.dataStorageService.initialize();
            logger.info('Background job processor initialized');
        } catch (error) {
            logger.error('Failed to initialize background job processor:', error);
            throw error;
        }
    }

    // Add a scraping job to the queue
    async addScrapingJob(athleteName, options = {}, priority = 'normal') {
        const jobId = `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const job = {
            id: jobId,
            type: 'scraping',
            athleteName,
            options,
            priority,
            status: 'queued',
            createdAt: new Date(),
            startedAt: null,
            completedAt: null,
            result: null,
            error: null,
            progress: 0
        };

        this.jobs.set(jobId, job);
        this.jobQueue.push(job);

        // Sort queue by priority
        this.jobQueue.sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        logger.info(`Added scraping job for ${athleteName} with ID: ${jobId}`);

        // Start processing if not already running
        if (!this.isProcessing) {
            this.startProcessing();
        }

        return jobId;
    }

    // Start processing jobs
    async startProcessing() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        logger.info('Started background job processing');

        while (this.jobQueue.length > 0 && this.activeJobs < this.maxConcurrentJobs) {
            const job = this.jobQueue.shift();
            if (job) {
                this.processJob(job);
            }
        }

        this.isProcessing = false;
    }

    // Process a single job
    async processJob(job) {
        this.activeJobs++;
        job.status = 'running';
        job.startedAt = new Date();

        logger.info(`Processing job ${job.id} for athlete: ${job.athleteName}`);

        try {
            // Update progress
            job.progress = 25;

            // Perform scraping
            const result = await this.scrapingService.collectAthleteData(job.athleteName, job.options);

            // Store the scraped data
            if (result && result.name) {
                job.progress = 75;
                await this.dataStorageService.storeAthleteData(result);
                logger.info(`Stored data for athlete: ${result.name}`);
            }

            job.progress = 100;
            job.status = 'completed';
            job.completedAt = new Date();
            job.result = result;

            logger.info(`Completed job ${job.id} successfully`);

        } catch (error) {
            job.status = 'failed';
            job.completedAt = new Date();
            job.error = error.message;

            logger.error(`Job ${job.id} failed:`, error.message);
        } finally {
            this.activeJobs--;

            // Process next job if available
            if (this.jobQueue.length > 0 && this.activeJobs < this.maxConcurrentJobs) {
                const nextJob = this.jobQueue.shift();
                if (nextJob) {
                    setImmediate(() => this.processJob(nextJob));
                }
            }
        }
    }

    // Get job status
    getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { error: 'Job not found' };
        }

        return {
            id: job.id,
            status: job.status,
            progress: job.progress,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            athleteName: job.athleteName,
            result: job.result,
            error: job.error
        };
    }

    // Get all jobs with optional filtering
    getJobs(filter = {}) {
        let jobs = Array.from(this.jobs.values());

        if (filter.status) {
            jobs = jobs.filter(job => job.status === filter.status);
        }

        if (filter.type) {
            jobs = jobs.filter(job => job.type === filter.type);
        }

        // Sort by creation date (newest first)
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return jobs.map(job => ({
            id: job.id,
            type: job.type,
            athleteName: job.athleteName,
            status: job.status,
            progress: job.progress,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt
        }));
    }

    // Cancel a job
    cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { error: 'Job not found' };
        }

        if (job.status === 'running') {
            job.status = 'cancelled';
            job.completedAt = new Date();
            this.activeJobs--;
            logger.info(`Cancelled running job ${jobId}`);
        } else if (job.status === 'queued') {
            job.status = 'cancelled';
            job.completedAt = new Date();
            // Remove from queue
            const index = this.jobQueue.findIndex(j => j.id === jobId);
            if (index > -1) {
                this.jobQueue.splice(index, 1);
            }
            logger.info(`Cancelled queued job ${jobId}`);
        } else {
            return { error: `Cannot cancel job with status: ${job.status}` };
        }

        return { success: true, message: `Job ${jobId} cancelled` };
    }

    // Clean up old completed jobs (older than 24 hours)
    cleanupOldJobs() {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        for (const [jobId, job] of this.jobs.entries()) {
            if (job.completedAt && job.completedAt < cutoffTime) {
                this.jobs.delete(jobId);
            }
        }

        logger.info('Cleaned up old completed jobs');
    }

    // Get processing statistics
    getStats() {
        const jobs = Array.from(this.jobs.values());
        const stats = {
            total: jobs.length,
            queued: jobs.filter(j => j.status === 'queued').length,
            running: jobs.filter(j => j.status === 'running').length,
            completed: jobs.filter(j => j.status === 'completed').length,
            failed: jobs.filter(j => j.status === 'failed').length,
            cancelled: jobs.filter(j => j.status === 'cancelled').length,
            activeJobs: this.activeJobs,
            maxConcurrentJobs: this.maxConcurrentJobs,
            queueLength: this.jobQueue.length
        };

        return stats;
    }

    // Batch scraping for multiple athletes
    async addBatchScrapingJobs(athletes, options = {}, priority = 'normal') {
        const jobIds = [];

        for (const athlete of athletes) {
            const jobId = await this.addScrapingJob(athlete.name || athlete, {
                ...options,
                state: athlete.state || options.state,
                sport: athlete.sport || options.sport
            }, priority);
            jobIds.push(jobId);
        }

        logger.info(`Added batch of ${jobIds.length} scraping jobs`);
        return jobIds;
    }

    // Retry failed jobs
    async retryFailedJobs() {
        const failedJobs = Array.from(this.jobs.values()).filter(job => job.status === 'failed');

        for (const job of failedJobs) {
            // Reset job status
            job.status = 'queued';
            job.error = null;
            job.progress = 0;
            job.startedAt = null;
            job.completedAt = null;

            // Re-queue the job
            this.jobQueue.push(job);
        }

        if (failedJobs.length > 0) {
            logger.info(`Retrying ${failedJobs.length} failed jobs`);
            this.startProcessing();
        }

        return { retried: failedJobs.length };
    }
}

// Singleton instance
const jobProcessor = new BackgroundJobProcessor();

// Periodic cleanup - only in non-test environments
if (process.env.NODE_ENV !== 'test') {
    setInterval(() => {
        jobProcessor.cleanupOldJobs();
    }, 60 * 60 * 1000); // Every hour
}

module.exports = jobProcessor;
