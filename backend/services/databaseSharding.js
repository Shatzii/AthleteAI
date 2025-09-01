// Database Sharding Service for AthleteAI
// Implements horizontal scaling for massive athlete data

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

class DatabaseShardingService {
    constructor() {
        this.shards = new Map();
        this.shardConfig = {
            // Shard by position for optimal query performance
            positions: {
                offense: ['QB', 'RB', 'WR', 'TE', 'OL'],
                defense: ['DL', 'LB', 'CB', 'S'],
                special: ['K', 'P']
            },
            // Geographic sharding for regional queries
            regions: {
                northeast: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'],
                south: ['DE', 'MD', 'VA', 'WV', 'KY', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'TN', 'AR', 'LA'],
                midwest: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
                southwest: ['TX', 'OK', 'NM', 'AZ'],
                west: ['CO', 'WY', 'MT', 'ID', 'UT', 'NV', 'CA', 'OR', 'WA', 'AK', 'HI']
            }
        };
        
        this.connectionPool = {
            primary: null,
            shards: [],
            analytics: null
        };
    }

    // Initialize sharding configuration
    async initializeSharding() {
        try {
            logger.info('Initializing database sharding...');
            
            // Connect to primary shard
            await this.connectPrimaryShard();
            
            // Initialize shard connections
            await this.initializeShardConnections();
            
            // Set up sharding keys and policies
            await this.setupShardingKeys();
            
            // Initialize read/write splitting
            await this.setupReadWriteSplitting();
            
            logger.info('Database sharding initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize database sharding:', error);
            throw error;
        }
    }

    // Connect to primary shard
    async connectPrimaryShard() {
        const primaryUri = process.env.MONGO_PRIMARY_URI || process.env.MONGO_URI;
        
        this.connectionPool.primary = await mongoose.createConnection(primaryUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            bufferCommands: false,
        });
        
        logger.info('Connected to primary shard');
    }

    // Initialize shard connections
    async initializeShardConnections() {
        const shardUris = this.parseShardUris();
        
        for (const [shardName, uri] of Object.entries(shardUris)) {
            try {
                const connection = await mongoose.createConnection(uri, {
                    maxPoolSize: 20,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                    readPreference: 'secondaryPreferred'
                });
                
                this.connectionPool.shards.push({
                    name: shardName,
                    connection,
                    type: this.getShardType(shardName)
                });
                
                logger.info(`Connected to shard: ${shardName}`);
                
            } catch (error) {
                logger.warn(`Failed to connect to shard ${shardName}:`, error.message);
            }
        }
    }

    // Parse shard URIs from environment
    parseShardUris() {
        const shardUris = {};
        
        // Position-based shards
        if (process.env.MONGO_OFFENSE_URI) {
            shardUris.offense = process.env.MONGO_OFFENSE_URI;
        }
        if (process.env.MONGO_DEFENSE_URI) {
            shardUris.defense = process.env.MONGO_DEFENSE_URI;
        }
        if (process.env.MONGO_SPECIAL_URI) {
            shardUris.special = process.env.MONGO_SPECIAL_URI;
        }
        
        // Regional shards
        if (process.env.MONGO_NORTHEAST_URI) {
            shardUris.northeast = process.env.MONGO_NORTHEAST_URI;
        }
        if (process.env.MONGO_SOUTH_URI) {
            shardUris.south = process.env.MONGO_SOUTH_URI;
        }
        if (process.env.MONGO_MIDWEST_URI) {
            shardUris.midwest = process.env.MONGO_MIDWEST_URI;
        }
        if (process.env.MONGO_WEST_URI) {
            shardUris.west = process.env.MONGO_WEST_URI;
        }
        
        // Analytics shard
        if (process.env.MONGO_ANALYTICS_URI) {
            shardUris.analytics = process.env.MONGO_ANALYTICS_URI;
        }
        
        return shardUris;
    }

    // Get shard type
    getShardType(shardName) {
        if (['offense', 'defense', 'special'].includes(shardName)) {
            return 'position';
        } else if (['northeast', 'south', 'midwest', 'west'].includes(shardName)) {
            return 'regional';
        } else if (shardName === 'analytics') {
            return 'analytics';
        }
        return 'general';
    }

    // Set up sharding keys
    async setupShardingKeys() {
        // Enable sharding on the database
        const adminDb = this.connectionPool.primary.db.admin();
        
        try {
            await adminDb.command({ enableSharding: 'go4it' });
            logger.info('Sharding enabled on database');
        } catch (error) {
            logger.warn('Sharding may already be enabled:', error.message);
        }
        
        // Shard the players collection by position
        try {
            await adminDb.command({
                shardCollection: 'go4it.players',
                key: { position: 1, _id: 1 }
            });
            logger.info('Players collection sharded by position');
        } catch (error) {
            logger.warn('Players collection may already be sharded:', error.message);
        }
        
        // Shard analytics collections
        try {
            await adminDb.command({
                shardCollection: 'go4it.athlete_analytics',
                key: { athleteId: 1, timestamp: 1 }
            });
            logger.info('Analytics collection sharded');
        } catch (error) {
            logger.warn('Analytics collection may already be sharded:', error.message);
        }
    }

    // Set up read/write splitting
    async setupReadWriteSplitting() {
        // Configure read preferences for different operations
        this.readPreferences = {
            // Write operations always go to primary
            write: 'primary',
            
            // Read operations can use secondaries
            read: 'secondaryPreferred',
            
            // Analytics queries prefer analytics shard
            analytics: 'secondary',
            
            // Real-time queries prefer primary for freshness
            realtime: 'primaryPreferred'
        };
        
        logger.info('Read/write splitting configured');
    }

    // Route query to appropriate shard
    routeToShard(query, operation = 'read') {
        const { position, location, athleteId } = query;
        
        // Position-based routing
        if (position) {
            if (this.shardConfig.positions.offense.includes(position)) {
                return this.getShardConnection('offense');
            } else if (this.shardConfig.positions.defense.includes(position)) {
                return this.getShardConnection('defense');
            } else if (this.shardConfig.positions.special.includes(position)) {
                return this.getShardConnection('special');
            }
        }
        
        // Regional routing
        if (location) {
            const state = this.extractState(location);
            const region = this.getRegionForState(state);
            if (region) {
                return this.getShardConnection(region);
            }
        }
        
        // Analytics routing
        if (operation === 'analytics' || query.analytics) {
            return this.getShardConnection('analytics');
        }
        
        // Default to primary for writes or primary shard for reads
        return operation === 'write' ? 
            this.connectionPool.primary : 
            this.connectionPool.primary;
    }

    // Get shard connection by name
    getShardConnection(shardName) {
        const shard = this.connectionPool.shards.find(s => s.name === shardName);
        return shard ? shard.connection : this.connectionPool.primary;
    }

    // Extract state from location string
    extractState(location) {
        if (!location) return null;
        
        // Handle different location formats
        const parts = location.split(',').map(p => p.trim());
        return parts.length > 1 ? parts[1] : null;
    }

    // Get region for state
    getRegionForState(state) {
        if (!state) return null;
        
        for (const [region, states] of Object.entries(this.shardConfig.regions)) {
            if (states.includes(state.toUpperCase())) {
                return region;
            }
        }
        return null;
    }

    // Execute query with automatic shard routing
    async executeQuery(modelName, query, options = {}) {
        const operation = options.operation || 'read';
        const shardConnection = this.routeToShard(query, operation);
        
        try {
            const Model = shardConnection.models[modelName] || 
                         this.connectionPool.primary.models[modelName];
            
            if (!Model) {
                throw new Error(`Model ${modelName} not found`);
            }
            
            // Set read preference based on operation type
            const readPreference = this.readPreferences[operation] || 'primary';
            
            const result = await Model.find(query)
                .setOptions({ readPreference })
                .exec();
            
            logger.debug(`Query executed on shard: ${shardConnection.name || 'primary'}`);
            
            return result;
            
        } catch (error) {
            logger.error('Shard query execution failed:', error);
            throw error;
        }
    }

    // Execute write operation
    async executeWrite(modelName, operation, data) {
        const shardConnection = this.routeToShard(data, 'write');
        
        try {
            const Model = shardConnection.models[modelName] || 
                         this.connectionPool.primary.models[modelName];
            
            if (!Model) {
                throw new Error(`Model ${modelName} not found`);
            }
            
            let result;
            
            switch (operation) {
                case 'create':
                    result = await Model.create(data);
                    break;
                case 'update':
                    result = await Model.findOneAndUpdate(
                        { _id: data._id }, 
                        data, 
                        { new: true }
                    );
                    break;
                case 'delete':
                    result = await Model.findOneAndDelete({ _id: data._id });
                    break;
                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }
            
            logger.debug(`Write operation executed on shard: ${shardConnection.name || 'primary'}`);
            
            return result;
            
        } catch (error) {
            logger.error('Shard write operation failed:', error);
            throw error;
        }
    }

    // Get shard statistics
    async getShardStats() {
        const stats = {
            totalShards: this.connectionPool.shards.length + 1, // +1 for primary
            shardDetails: [],
            performance: {}
        };
        
        // Primary shard stats
        try {
            const primaryStats = await this.connectionPool.primary.db.stats();
            stats.shardDetails.push({
                name: 'primary',
                type: 'primary',
                collections: primaryStats.collections,
                objects: primaryStats.objects,
                dataSize: primaryStats.dataSize,
                storageSize: primaryStats.storageSize
            });
        } catch (error) {
            logger.warn('Failed to get primary shard stats:', error);
        }
        
        // Shard stats
        for (const shard of this.connectionPool.shards) {
            try {
                const shardStats = await shard.connection.db.stats();
                stats.shardDetails.push({
                    name: shard.name,
                    type: shard.type,
                    collections: shardStats.collections,
                    objects: shardStats.objects,
                    dataSize: shardStats.dataSize,
                    storageSize: shardStats.storageSize
                });
            } catch (error) {
                logger.warn(`Failed to get stats for shard ${shard.name}:`, error);
            }
        }
        
        return stats;
    }

    // Health check for all shards
    async healthCheck() {
        const health = {
            overall: 'healthy',
            shards: []
        };
        
        // Check primary
        try {
            await this.connectionPool.primary.db.admin().ping();
            health.shards.push({ name: 'primary', status: 'healthy' });
        } catch (error) {
            health.shards.push({ name: 'primary', status: 'unhealthy', error: error.message });
            health.overall = 'degraded';
        }
        
        // Check shards
        for (const shard of this.connectionPool.shards) {
            try {
                await shard.connection.db.admin().ping();
                health.shards.push({ name: shard.name, status: 'healthy' });
            } catch (error) {
                health.shards.push({ 
                    name: shard.name, 
                    status: 'unhealthy', 
                    error: error.message 
                });
                health.overall = 'degraded';
            }
        }
        
        return health;
    }

    // Graceful shutdown
    async shutdown() {
        logger.info('Shutting down database sharding service...');
        
        // Close all shard connections
        for (const shard of this.connectionPool.shards) {
            try {
                await shard.connection.close();
                logger.info(`Closed connection to shard: ${shard.name}`);
            } catch (error) {
                logger.warn(`Error closing shard ${shard.name}:`, error);
            }
        }
        
        // Close primary connection
        if (this.connectionPool.primary) {
            try {
                await this.connectionPool.primary.close();
                logger.info('Closed primary connection');
            } catch (error) {
                logger.warn('Error closing primary connection:', error);
            }
        }
        
        logger.info('Database sharding service shut down');
    }
}

module.exports = DatabaseShardingService;
