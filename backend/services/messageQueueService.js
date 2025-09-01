const AWS = require('aws-sdk');
const { logger } = require('../utils/logger');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize SQS
const sqs = new AWS.SQS();

// Queue URLs (these would be set via environment variables in production)
const QUEUE_URLS = {
  SCRAPING: process.env.SCRAPING_QUEUE_URL,
  VIDEO_PROCESSING: process.env.VIDEO_PROCESSING_QUEUE_URL,
  ANALYTICS: process.env.ANALYTICS_QUEUE_URL,
  NOTIFICATIONS: process.env.NOTIFICATIONS_QUEUE_URL
};

/**
 * Message Queue Service for AthleteAI
 * Handles async processing of heavy operations
 */
class MessageQueueService {
  constructor() {
    this.queues = QUEUE_URLS;
  }

  /**
   * Send message to athlete scraping queue
   * @param {Object} athleteData - Athlete data to scrape
   */
  async sendAthleteScrapingJob(athleteData) {
    try {
      const message = {
        athleteId: athleteData.id || athleteData._id,
        source: athleteData.recruitingData?.source,
        sourceUrl: athleteData.recruitingData?.sourceUrl,
        priority: athleteData.isHighlighted ? 'high' : 'normal',
        timestamp: new Date().toISOString()
      };

      const params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: this.queues.SCRAPING,
        MessageGroupId: `athlete-${athleteData.id || athleteData._id}`,
        MessageDeduplicationId: `${athleteData.id || athleteData._id}-${Date.now()}`
      };

      const result = await sqs.sendMessage(params).promise();
      logger.info('Athlete scraping job queued', {
        athleteId: athleteData.id || athleteData._id,
        messageId: result.MessageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to queue athlete scraping job', {
        error: error.message,
        athleteId: athleteData.id || athleteData._id
      });
      throw error;
    }
  }

  /**
   * Send message to video processing queue
   * @param {Object} videoData - Video data to process
   */
  async sendVideoProcessingJob(videoData) {
    try {
      const message = {
        videoId: videoData.id,
        athleteId: videoData.athleteId,
        videoUrl: videoData.url,
        platform: videoData.platform,
        processingType: videoData.processingType || 'analysis', // analysis, thumbnail, compression
        priority: videoData.priority || 'normal',
        timestamp: new Date().toISOString()
      };

      const params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: this.queues.VIDEO_PROCESSING,
        MessageGroupId: `video-${videoData.id}`,
        MessageDeduplicationId: `${videoData.id}-${Date.now()}`
      };

      const result = await sqs.sendMessage(params).promise();
      logger.info('Video processing job queued', {
        videoId: videoData.id,
        processingType: videoData.processingType,
        messageId: result.MessageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to queue video processing job', {
        error: error.message,
        videoId: videoData.id
      });
      throw error;
    }
  }

  /**
   * Send message to analytics queue
   * @param {Object} analyticsData - Analytics data to process
   */
  async sendAnalyticsJob(analyticsData) {
    try {
      const message = {
        type: analyticsData.type, // 'user_engagement', 'athlete_performance', 'recruiting_trends'
        data: analyticsData.data,
        timeRange: analyticsData.timeRange,
        aggregation: analyticsData.aggregation || 'daily',
        priority: analyticsData.priority || 'normal',
        timestamp: new Date().toISOString()
      };

      const params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: this.queues.ANALYTICS
      };

      const result = await sqs.sendMessage(params).promise();
      logger.info('Analytics job queued', {
        type: analyticsData.type,
        messageId: result.MessageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to queue analytics job', {
        error: error.message,
        type: analyticsData.type
      });
      throw error;
    }
  }

  /**
   * Send message to notifications queue
   * @param {Object} notificationData - Notification data
   */
  async sendNotificationJob(notificationData) {
    try {
      const message = {
        type: notificationData.type, // 'email', 'sms', 'push'
        recipient: notificationData.recipient,
        subject: notificationData.subject,
        content: notificationData.content,
        template: notificationData.template,
        priority: notificationData.priority || 'normal',
        timestamp: new Date().toISOString()
      };

      const params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: this.queues.NOTIFICATIONS
      };

      const result = await sqs.sendMessage(params).promise();
      logger.info('Notification job queued', {
        type: notificationData.type,
        recipient: notificationData.recipient,
        messageId: result.MessageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to queue notification job', {
        error: error.message,
        type: notificationData.type
      });
      throw error;
    }
  }

  /**
   * Send bulk athlete scraping jobs
   * @param {Array} athletes - Array of athlete data
   */
  async sendBulkAthleteScrapingJobs(athletes) {
    const results = [];
    const errors = [];

    for (const athlete of athletes) {
      try {
        const result = await this.sendAthleteScrapingJob(athlete);
        results.push(result);
      } catch (error) {
        errors.push({ athleteId: athlete.id || athlete._id, error: error.message });
      }
    }

    logger.info('Bulk athlete scraping jobs completed', {
      total: athletes.length,
      successful: results.length,
      failed: errors.length
    });

    return { results, errors };
  }

  /**
   * Get queue attributes (for monitoring)
   * @param {string} queueType - Type of queue to check
   */
  async getQueueAttributes(queueType) {
    try {
      const params = {
        QueueUrl: this.queues[queueType],
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateNumberOfMessagesDelayed'
        ]
      };

      const result = await sqs.getQueueAttributes(params).promise();
      return result.Attributes;
    } catch (error) {
      logger.error('Failed to get queue attributes', {
        error: error.message,
        queueType
      });
      throw error;
    }
  }

  /**
   * Purge queue (use with caution)
   * @param {string} queueType - Type of queue to purge
   */
  async purgeQueue(queueType) {
    try {
      const params = {
        QueueUrl: this.queues[queueType]
      };

      await sqs.purgeQueue(params).promise();
      logger.warn('Queue purged', { queueType });
    } catch (error) {
      logger.error('Failed to purge queue', {
        error: error.message,
        queueType
      });
      throw error;
    }
  }

  /**
   * Send athlete discovery completion notification
   * @param {Object} discoveryResult - Discovery operation result
   */
  async sendDiscoveryNotification(discoveryResult) {
    try {
      const notificationData = {
        type: 'email',
        recipient: discoveryResult.userEmail,
        subject: `Athlete Discovery Complete - ${discoveryResult.athletesFound} athletes found`,
        template: 'discovery_complete',
        content: {
          athletesFound: discoveryResult.athletesFound,
          sourcesScraped: discoveryResult.sourcesScraped,
          duration: discoveryResult.duration,
          highlights: discoveryResult.highlights
        },
        priority: 'normal'
      };

      return await this.sendNotificationJob(notificationData);
    } catch (error) {
      logger.error('Failed to send discovery notification', {
        error: error.message,
        userEmail: discoveryResult.userEmail
      });
      throw error;
    }
  }

  /**
   * Send system health alert
   * @param {Object} healthData - Health check data
   */
  async sendHealthAlert(healthData) {
    try {
      const notificationData = {
        type: 'email',
        recipient: process.env.ADMIN_EMAIL,
        subject: `System Health Alert - ${healthData.service}`,
        template: 'health_alert',
        content: {
          service: healthData.service,
          status: healthData.status,
          message: healthData.message,
          timestamp: new Date().toISOString()
        },
        priority: 'high'
      };

      return await this.sendNotificationJob(notificationData);
    } catch (error) {
      logger.error('Failed to send health alert', {
        error: error.message,
        service: healthData.service
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new MessageQueueService();
