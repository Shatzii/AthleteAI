const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Enhanced connection options for production performance
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
            bufferMaxEntries: 0, // Disable mongoose buffering
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
            // Connection pool monitoring
            minPoolSize: 2, // Minimum number of connections in pool
        };

        // Add SSL options for production
        if (process.env.NODE_ENV === 'production') {
            options.ssl = true;
            options.sslValidate = true;
            options.sslCA = process.env.MONGO_SSL_CA;
        }

        await mongoose.connect(process.env.MONGO_URI, options);

        console.log('✅ MongoDB connected successfully with optimized settings');

        // Connection event handlers
        mongoose.connection.on('connected', () => {
            console.log('📊 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('📡 Mongoose disconnected from MongoDB');
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔄 MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

// Database performance monitoring
const getDBStats = async () => {
    try {
        const stats = await mongoose.connection.db.stats();
        return {
            collections: stats.collections,
            objects: stats.objects,
            avgObjSize: stats.avgObjSize,
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexes: stats.indexes,
            indexSize: stats.indexSize,
            ok: stats.ok
        };
    } catch (error) {
        console.error('Error getting database stats:', error.message);
        return null;
    }
};

module.exports = { connectDB, getDBStats };