const WebSocket = require('ws');
const { logger } = require('../utils/logger');

// Real-time updates service using WebSockets
class RealTimeService {
    constructor(server) {
        this.wss = null;
        this.clients = new Map(); // clientId -> { ws, userId, subscriptions }
        this.subscriptions = new Map(); // topic -> Set of clientIds
        this.heartbeatInterval = null;
        this.messageQueue = [];
        this.isProcessingQueue = false;

        if (server) {
            this.initialize(server);
        }
    }

    // Initialize WebSocket server
    initialize(server) {
        this.wss = new WebSocket.Server({
            server,
            perMessageDeflate: false,
            maxPayload: 1024 * 1024 // 1MB max payload
        });

        this.wss.on('connection', (ws, request) => {
            this.handleConnection(ws, request);
        });

        this.wss.on('error', (error) => {
            logger.error('WebSocket server error:', error);
        });

        // Start heartbeat
        this.startHeartbeat();

        logger.info('Real-time service initialized');
    }

    // Handle new WebSocket connection
    handleConnection(ws, request) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            ws,
            userId: null,
            subscriptions: new Set(),
            connectedAt: new Date(),
            lastHeartbeat: Date.now(),
            isAlive: true
        };

        this.clients.set(clientId, client);

        logger.info(`Client connected: ${clientId}`);

        // Set up event handlers
        ws.on('message', (data) => this.handleMessage(clientId, data));
        ws.on('close', () => this.handleDisconnection(clientId));
        ws.on('error', (error) => this.handleError(clientId, error));
        ws.on('pong', () => {
            client.lastHeartbeat = Date.now();
            client.isAlive = true;
        });

        // Send welcome message
        this.sendToClient(clientId, {
            type: 'welcome',
            clientId,
            timestamp: new Date()
        });
    }

    // Handle incoming messages
    handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.clients.get(clientId);

            if (!client) return;

            switch (message.type) {
                case 'authenticate':
                    this.handleAuthentication(clientId, message);
                    break;
                case 'subscribe':
                    this.handleSubscription(clientId, message);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscription(clientId, message);
                    break;
                case 'ping':
                    this.sendToClient(clientId, { type: 'pong', timestamp: new Date() });
                    break;
                default:
                    logger.warn(`Unknown message type: ${message.type} from client ${clientId}`);
            }
        } catch (error) {
            logger.error(`Error handling message from client ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: new Date()
            });
        }
    }

    // Handle client authentication
    handleAuthentication(clientId, message) {
        const { userId, token } = message;
        const client = this.clients.get(clientId);

        if (!client) return;

        // TODO: Validate token with auth service
        // For now, accept any userId
        client.userId = userId;

        this.sendToClient(clientId, {
            type: 'authenticated',
            userId,
            timestamp: new Date()
        });

        logger.info(`Client ${clientId} authenticated as user ${userId}`);
    }

    // Handle subscription to topics
    handleSubscription(clientId, message) {
        const { topics } = message;
        const client = this.clients.get(clientId);

        if (!client || !Array.isArray(topics)) return;

        topics.forEach(topic => {
            client.subscriptions.add(topic);

            if (!this.subscriptions.has(topic)) {
                this.subscriptions.set(topic, new Set());
            }
            this.subscriptions.get(topic).add(clientId);
        });

        this.sendToClient(clientId, {
            type: 'subscribed',
            topics,
            timestamp: new Date()
        });

        logger.debug(`Client ${clientId} subscribed to topics: ${topics.join(', ')}`);
    }

    // Handle unsubscription from topics
    handleUnsubscription(clientId, message) {
        const { topics } = message;
        const client = this.clients.get(clientId);

        if (!client || !Array.isArray(topics)) return;

        topics.forEach(topic => {
            client.subscriptions.delete(topic);

            const topicSubscriptions = this.subscriptions.get(topic);
            if (topicSubscriptions) {
                topicSubscriptions.delete(clientId);
                if (topicSubscriptions.size === 0) {
                    this.subscriptions.delete(topic);
                }
            }
        });

        this.sendToClient(clientId, {
            type: 'unsubscribed',
            topics,
            timestamp: new Date()
        });

        logger.debug(`Client ${clientId} unsubscribed from topics: ${topics.join(', ')}`);
    }

    // Handle client disconnection
    handleDisconnection(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        // Clean up subscriptions
        client.subscriptions.forEach(topic => {
            const topicSubscriptions = this.subscriptions.get(topic);
            if (topicSubscriptions) {
                topicSubscriptions.delete(clientId);
                if (topicSubscriptions.size === 0) {
                    this.subscriptions.delete(topic);
                }
            }
        });

        this.clients.delete(clientId);
        logger.info(`Client disconnected: ${clientId}`);
    }

    // Handle WebSocket errors
    handleError(clientId, error) {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnection(clientId);
    }

    // Send message to specific client
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            client.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            logger.error(`Error sending message to client ${clientId}:`, error);
            return false;
        }
    }

    // Broadcast message to all clients
    broadcast(message, filterFn = null) {
        let sentCount = 0;

        for (const [clientId, client] of this.clients.entries()) {
            if (client.ws.readyState === WebSocket.OPEN) {
                if (!filterFn || filterFn(client)) {
                    if (this.sendToClient(clientId, message)) {
                        sentCount++;
                    }
                }
            }
        }

        logger.debug(`Broadcasted message to ${sentCount} clients`);
        return sentCount;
    }

    // Send message to clients subscribed to a topic
    broadcastToTopic(topic, message) {
        const topicSubscriptions = this.subscriptions.get(topic);
        if (!topicSubscriptions) return 0;

        let sentCount = 0;

        for (const clientId of topicSubscriptions) {
            if (this.sendToClient(clientId, message)) {
                sentCount++;
            }
        }

        logger.debug(`Broadcasted message to ${sentCount} clients subscribed to topic: ${topic}`);
        return sentCount;
    }

    // Send message to specific user (all their clients)
    sendToUser(userId, message) {
        let sentCount = 0;

        for (const [clientId, client] of this.clients.entries()) {
            if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
                if (this.sendToClient(clientId, message)) {
                    sentCount++;
                }
            }
        }

        return sentCount;
    }

    // Publish ranking update
    publishRankingUpdate(athleteId, newRanking, oldRanking = null) {
        const message = {
            type: 'ranking_update',
            athleteId,
            newRanking,
            oldRanking,
            timestamp: new Date()
        };

        // Broadcast to ranking subscribers
        this.broadcastToTopic('rankings', message);

        // Also broadcast to athlete-specific subscribers
        this.broadcastToTopic(`athlete_${athleteId}`, message);
    }

    // Publish leaderboard update
    publishLeaderboardUpdate(leaderboardType, leaderboard) {
        const message = {
            type: 'leaderboard_update',
            leaderboardType,
            leaderboard,
            timestamp: new Date()
        };

        this.broadcastToTopic('leaderboards', message);
        this.broadcastToTopic(`leaderboard_${leaderboardType}`, message);
    }

    // Publish achievement unlocked
    publishAchievementUnlocked(userId, achievement) {
        const message = {
            type: 'achievement_unlocked',
            achievement,
            timestamp: new Date()
        };

        this.sendToUser(userId, message);
    }

    // Publish system notification
    publishNotification(userId, notification) {
        const message = {
            type: 'notification',
            ...notification,
            timestamp: new Date()
        };

        this.sendToUser(userId, message);
    }

    // Publish data scraping completion
    publishScrapingComplete(userId, athleteName, results) {
        const message = {
            type: 'scraping_complete',
            athleteName,
            results,
            timestamp: new Date()
        };

        this.sendToUser(userId, message);
    }

    // Start heartbeat mechanism
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    ws.terminate();
                    return;
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 seconds
    }

    // Stop heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Generate unique client ID
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get connection statistics
    getStats() {
        const clients = Array.from(this.clients.values());
        const stats = {
            totalConnections: clients.length,
            authenticatedUsers: clients.filter(c => c.userId).length,
            totalSubscriptions: Array.from(this.subscriptions.values())
                .reduce((sum, subs) => sum + subs.size, 0),
            topicsCount: this.subscriptions.size,
            uptime: process.uptime()
        };

        return stats;
    }

    // Clean up inactive connections
    cleanupInactiveConnections() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutes

        for (const [clientId, client] of this.clients.entries()) {
            if (now - client.lastHeartbeat > timeout) {
                logger.info(`Cleaning up inactive client: ${clientId}`);
                client.ws.terminate();
                this.handleDisconnection(clientId);
            }
        }
    }

    // Graceful shutdown
    shutdown() {
        logger.info('Shutting down real-time service...');

        this.stopHeartbeat();

        // Close all connections
        for (const [clientId, client] of this.clients.entries()) {
            client.ws.close(1001, 'Server shutdown');
        }

        if (this.wss) {
            this.wss.close(() => {
                logger.info('Real-time service shut down');
            });
        }
    }
}

// Message queue processing for high-throughput scenarios
class MessageQueue {
    constructor(realTimeService) {
        this.realTimeService = realTimeService;
        this.queue = [];
        this.processing = false;
        this.maxBatchSize = 100;
        this.flushInterval = 1000; // 1 second
    }

    // Add message to queue
    enqueue(message) {
        this.queue.push({
            ...message,
            queuedAt: new Date()
        });

        if (!this.processing) {
            this.startProcessing();
        }
    }

    // Start processing queue
    async startProcessing() {
        if (this.processing) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.maxBatchSize);

            // Process batch
            for (const message of batch) {
                try {
                    await this.processMessage(message);
                } catch (error) {
                    logger.error('Error processing queued message:', error);
                }
            }

            // Small delay between batches
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        this.processing = false;
    }

    // Process individual message
    async processMessage(message) {
        const { type, ...data } = message;

        switch (type) {
            case 'ranking_update':
                this.realTimeService.publishRankingUpdate(data.athleteId, data.newRanking, data.oldRanking);
                break;
            case 'leaderboard_update':
                this.realTimeService.publishLeaderboardUpdate(data.leaderboardType, data.leaderboard);
                break;
            case 'achievement_unlocked':
                this.realTimeService.publishAchievementUnlocked(data.userId, data.achievement);
                break;
            case 'notification':
                this.realTimeService.publishNotification(data.userId, data.notification);
                break;
            case 'scraping_complete':
                this.realTimeService.publishScrapingComplete(data.userId, data.athleteName, data.results);
                break;
        }
    }

    // Get queue statistics
    getStats() {
        return {
            queueLength: this.queue.length,
            processing: this.processing,
            maxBatchSize: this.maxBatchSize,
            flushInterval: this.flushInterval
        };
    }
}

module.exports = { RealTimeService, MessageQueue };
