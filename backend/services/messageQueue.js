// Message Queue Service for AthleteAI
// Implements async processing for heavy operations

const { logger } = require('../utils/logger');
const { athleteCache } = require('../utils/cache');

class MessageQueueService {
    constructor() {
        this.queues = new Map();
        this.workers = new Map();
        this.processingStats = {
            processed: 0,
            failed: 0,
            queued: 0,
            avgProcessingTime: 0
        };
        
        // Queue configurations
        this.queueConfigs = {
            athlete_scraping: {
                maxConcurrency: 5,
                retryAttempts: 3,
                timeout: 300000, // 5 minutes
                priority: 'high'
            },
            data_processing: {
                maxConcurrency: 10,
                retryAttempts: 2,
                timeout: 600000, // 10 minutes
                priority: 'medium'
            },
            analytics: {
                maxConcurrency: 3,
                retryAttempts: 1,
                timeout: 1800000, // 30 minutes
                priority: 'low'
            },
            notifications: {
                maxConcurrency: 20,
                retryAttempts: 5,
                timeout: 30000, // 30 seconds
                priority: 'high'
            },
            cache_invalidation: {
                maxConcurrency: 50,
                retryAttempts: 2,
                timeout: 10000, // 10 seconds
                priority: 'critical'
            }
        };
    }

    // Initialize message queue system
    async initialize() {
        try {
            logger.info('Initializing message queue service...');
            
            // Initialize queues
            await this.initializeQueues();
            
            // Start workers
            await this.startWorkers();
            
            // Set up monitoring
            this.startMonitoring();
            
            logger.info('Message queue service initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize message queue:', error);
            throw error;
        }
    }

    // Initialize queues
    async initializeQueues() {
        for (const [queueName, config] of Object.entries(this.queueConfigs)) {
            this.queues.set(queueName, {
                name: queueName,
                config,
                jobs: [],
                processing: new Set(),
                completed: [],
                failed: [],
                stats: {
                    totalJobs: 0,
                    completedJobs: 0,
                    failedJobs: 0,
                    avgProcessingTime: 0
                }
            });
            
            logger.info(`Initialized queue: ${queueName}`);
        }
    }

    // Start workers for each queue
    async startWorkers() {
        for (const [queueName, queue] of this.queues) {
            const worker = this.createWorker(queueName, queue);
            this.workers.set(queueName, worker);
            
            // Start processing jobs
            this.processQueue(queueName);
            
            logger.info(`Started worker for queue: ${queueName}`);
        }
    }

    // Create worker for a queue
    createWorker(queueName, queue) {
        return {
            queueName,
            isActive: true,
            processingJobs: new Set(),
            
            async process(job) {
                const startTime = Date.now();
                
                try {
                    logger.debug(`Processing job ${job.id} in queue ${queueName}`);
                    
                    // Execute job handler
                    const result = await this.executeJob(job);
                    
                    const processingTime = Date.now() - startTime;
                    
                    // Update stats
                    queue.stats.completedJobs++;
                    queue.stats.avgProcessingTime = 
                        (queue.stats.avgProcessingTime + processingTime) / 2;
                    
                    // Mark job as completed
                    job.status = 'completed';
                    job.completedAt = new Date();
                    job.result = result;
                    
                    queue.completed.push(job);
                    
                    logger.info(`Job ${job.id} completed in ${processingTime}ms`);
                    
                    return result;
                    
                } catch (error) {
                    const processingTime = Date.now() - startTime;
                    
                    logger.error(`Job ${job.id} failed after ${processingTime}ms:`, error);
                    
                    // Handle job failure
                    await this.handleJobFailure(job, error, queue);
                    
                    throw error;
                }
            },
            
            async executeJob(job) {
                // Route to appropriate handler based on job type
                switch (job.type) {
                    case 'scrape_athlete':
                        return await this.handleAthleteScraping(job);
                    case 'process_athlete_data':
                        return await this.handleDataProcessing(job);
                    case 'generate_analytics':
                        return await this.handleAnalytics(job);
                    case 'send_notification':
                        return await this.handleNotification(job);
                    case 'invalidate_cache':
                        return await this.handleCacheInvalidation(job);
                    default:
                        throw new Error(`Unknown job type: ${job.type}`);
                }
            },
            
            async handleAthleteScraping(job) {
                const { athleteId, sources } = job.data;
                
                // Import scraper utilities
                const scraperUtils = require('../utils/scraper');
                
                const results = [];
                
                for (const source of sources) {
                    try {
                        let result;
                        
                        switch (source) {
                            case 'rivals':
                                result = await scraperUtils.scrapeRivalsAthlete(athleteId);
                                break;
                            case '247sports':
                                result = await scraperUtils.scrape247SportsAthlete(athleteId);
                                break;
                            case 'hudl':
                                result = await scraperUtils.scrapeHudlAthlete(athleteId);
                                break;
                            default:
                                logger.warn(`Unknown scraping source: ${source}`);
                                continue;
                        }
                        
                        if (result) {
                            results.push(result);
                        }
                        
                    } catch (error) {
                        logger.warn(`Failed to scrape ${source} for athlete ${athleteId}:`, error);
                    }
                }
                
                return results;
            },
            
            async handleDataProcessing(job) {
                const { athleteData } = job.data;
                
                // Process and normalize athlete data
                const processedData = {
                    ...athleteData,
                    processedAt: new Date(),
                    dataQuality: this.calculateDataQuality(athleteData)
                };
                
                // Update athlete cache
                if (athleteData._id) {
                    await athleteCache.setAthleteProfile(athleteData._id, processedData);
                }
                
                return processedData;
            },
            
            async handleAnalytics(job) {
                const { athleteId, metrics } = job.data;
                
                // Generate analytics for athlete
                const analytics = {
                    athleteId,
                    generatedAt: new Date(),
                    metrics: {},
                    insights: []
                };
                
                // Calculate various metrics
                for (const metric of metrics) {
                    analytics.metrics[metric] = await this.calculateMetric(athleteId, metric);
                }
                
                // Generate insights
                analytics.insights = await this.generateInsights(analytics.metrics);
                
                return analytics;
            },
            
            async handleNotification(job) {
                const { type, recipient, data } = job.data;
                
                // Send notification (email, SMS, push, etc.)
                logger.info(`Sending ${type} notification to ${recipient}`);
                
                // Implementation would integrate with notification service
                // For now, just log the notification
                return { sent: true, type, recipient, timestamp: new Date() };
            },
            
            async handleCacheInvalidation(job) {
                const { pattern, keys } = job.data;
                
                if (pattern) {
                    // Invalidate by pattern
                    await athleteCache.clearCache(pattern);
                } else if (keys) {
                    // Invalidate specific keys
                    for (const key of keys) {
                        await athleteCache.invalidateAthleteCache(key);
                    }
                }
                
                return { invalidated: true, pattern, keys };
            },
            
            calculateDataQuality(data) {
                let score = 0;
                const maxScore = 100;
                
                // Check required fields
                if (data.name) score += 20;
                if (data.position) score += 15;
                if (data.school) score += 15;
                if (data.garScore) score += 15;
                if (data.stars) score += 10;
                if (data.recruitingData) score += 10;
                if (data.highlights && data.highlights.length > 0) score += 10;
                if (data.socialMedia && Object.keys(data.socialMedia).length > 0) score += 5;
                
                return Math.min(maxScore, score);
            },
            
            async calculateMetric(athleteId, metric) {
                // Implementation would calculate specific metrics
                // This is a placeholder
                return {
                    metric,
                    value: Math.random() * 100,
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                };
            },
            
            async generateInsights(metrics) {
                // Generate insights based on metrics
                const insights = [];
                
                // Example insights
                if (metrics.growth > 80) {
                    insights.push('High growth potential athlete');
                }
                
                if (metrics.consistency > 90) {
                    insights.push('Exceptionally consistent performer');
                }
                
                return insights;
            },
            
            async handleJobFailure(job, error, queue) {
                job.status = 'failed';
                job.failedAt = new Date();
                job.error = error.message;
                job.retryCount = (job.retryCount || 0) + 1;
                
                queue.stats.failedJobs++;
                queue.failed.push(job);
                
                // Check if job should be retried
                if (job.retryCount < queue.config.retryAttempts) {
                    logger.info(`Retrying job ${job.id} (attempt ${job.retryCount})`);
                    
                    // Add back to queue with delay
                    setTimeout(() => {
                        this.addJob(queue.name, job);
                    }, Math.pow(2, job.retryCount) * 1000); // Exponential backoff
                } else {
                    logger.error(`Job ${job.id} failed permanently after ${job.retryCount} attempts`);
                }
            }
        };
    }

    // Add job to queue
    async addJob(queueName, jobData) {
        const queue = this.queues.get(queueName);
        
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        
        const job = {
            id: this.generateJobId(),
            type: jobData.type,
            data: jobData.data,
            priority: jobData.priority || 'normal',
            createdAt: new Date(),
            status: 'queued',
            retryCount: 0
        };
        
        // Add to queue based on priority
        if (job.priority === 'high') {
            queue.jobs.unshift(job); // Add to front
        } else {
            queue.jobs.push(job); // Add to back
        }
        
        queue.stats.totalJobs++;
        this.processingStats.queued++;
        
        logger.info(`Added job ${job.id} to queue ${queueName}`);
        
        // Trigger processing
        this.processQueue(queueName);
        
        return job.id;
    }

    // Process jobs in queue
    async processQueue(queueName) {
        const queue = this.queues.get(queueName);
        const worker = this.workers.get(queueName);
        
        if (!queue || !worker || !worker.isActive) {
            return;
        }
        
        // Check if we can process more jobs
        const activeJobs = queue.processing.size;
        const maxConcurrency = queue.config.maxConcurrency;
        
        if (activeJobs >= maxConcurrency) {
            return; // Max concurrency reached
        }
        
        // Get next job
        const job = queue.jobs.shift();
        if (!job) {
            return; // No jobs in queue
        }
        
        // Mark job as processing
        job.status = 'processing';
        job.startedAt = new Date();
        queue.processing.add(job.id);
        
        // Process job asynchronously
        this.processJobAsync(queueName, job);
    }

    // Process job asynchronously
    async processJobAsync(queueName, job) {
        const queue = this.queues.get(queueName);
        const worker = this.workers.get(queueName);
        
        try {
            await worker.process(job);
        } catch (error) {
            logger.error(`Failed to process job ${job.id}:`, error);
        } finally {
            // Remove from processing set
            queue.processing.delete(job.id);
            
            // Process next job
            this.processQueue(queueName);
        }
    }

    // Generate unique job ID
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get queue statistics
    getQueueStats(queueName = null) {
        if (queueName) {
            return this.queues.get(queueName)?.stats || null;
        }
        
        const allStats = {};
        for (const [name, queue] of this.queues) {
            allStats[name] = queue.stats;
        }
        
        return {
            overall: this.processingStats,
            queues: allStats
        };
    }

    // Get queue status
    getQueueStatus(queueName = null) {
        if (queueName) {
            const queue = this.queues.get(queueName);
            if (!queue) return null;
            
            return {
                name: queueName,
                queuedJobs: queue.jobs.length,
                processingJobs: queue.processing.size,
                completedJobs: queue.completed.length,
                failedJobs: queue.failed.length,
                config: queue.config
            };
        }
        
        const allStatus = {};
        for (const [name, queue] of this.queues) {
            allStatus[name] = {
                queuedJobs: queue.jobs.length,
                processingJobs: queue.processing.size,
                completedJobs: queue.completed.length,
                failedJobs: queue.failed.length
            };
        }
        
        return allStatus;
    }

    // Start monitoring
    startMonitoring() {
        // Monitor queue health every 30 seconds
        setInterval(() => {
            this.monitorQueues();
        }, 30000);
        
        // Clean up old completed jobs every hour
        setInterval(() => {
            this.cleanupOldJobs();
        }, 3600000);
    }

    // Monitor queue health
    monitorQueues() {
        for (const [queueName, queue] of this.queues) {
            const status = this.getQueueStatus(queueName);
            
            // Log warnings for unhealthy queues
            if (status.queuedJobs > 100) {
                logger.warn(`Queue ${queueName} has ${status.queuedJobs} queued jobs`);
            }
            
            if (status.failedJobs > status.completedJobs * 0.1) {
                logger.warn(`Queue ${queueName} has high failure rate: ${status.failedJobs}/${status.completedJobs + status.failedJobs}`);
            }
        }
    }

    // Clean up old completed jobs
    cleanupOldJobs() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        
        for (const [queueName, queue] of this.queues) {
            // Remove old completed jobs
            queue.completed = queue.completed.filter(job => 
                job.completedAt.getTime() > cutoffTime
            );
            
            // Remove old failed jobs (keep longer for analysis)
            const failedCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
            queue.failed = queue.failed.filter(job => 
                job.failedAt.getTime() > failedCutoff
            );
        }
        
        logger.debug('Cleaned up old jobs from queues');
    }

    // Graceful shutdown
    async shutdown() {
        logger.info('Shutting down message queue service...');
        
        // Stop all workers
        for (const [queueName, worker] of this.workers) {
            worker.isActive = false;
            logger.info(`Stopped worker for queue: ${queueName}`);
        }
        
        // Wait for processing jobs to complete
        let activeJobs = 0;
        for (const [queueName, queue] of this.queues) {
            activeJobs += queue.processing.size;
        }
        
        if (activeJobs > 0) {
            logger.info(`Waiting for ${activeJobs} active jobs to complete...`);
            
            // Wait up to 30 seconds for jobs to complete
            let waitTime = 0;
            while (activeJobs > 0 && waitTime < 30000) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                waitTime += 1000;
                
                activeJobs = 0;
                for (const [queueName, queue] of this.queues) {
                    activeJobs += queue.processing.size;
                }
            }
        }
        
        logger.info('Message queue service shut down');
    }
}

module.exports = MessageQueueService;
