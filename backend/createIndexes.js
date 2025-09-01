const mongoose = require('mongoose');
const { connectDB } = require('./config/database');

const createIndexes = async () => {
    try {
        await connectDB();
        
        const db = mongoose.connection.db;
        
        console.log('🔧 Creating database indexes for optimal performance...');
        
        // Player collection indexes
        const playerIndexes = [
            // Primary search indexes
            { key: { name: 1 } },
            { key: { position: 1 } },
            { key: { school: 1 } },
            { key: { year: 1 } },
            
            // Performance indexes
            { key: { garScore: -1 } },
            { key: { stars: -1 } },
            { key: { highlightScore: -1 } },
            
            // Recruiting data indexes
            { key: { 'recruitingData.source': 1 } },
            { key: { 'recruitingData.recruitingClass': 1 } },
            { key: { 'recruitingData.rating': -1 } },
            { key: { 'recruitingData.location': 1 } },
            
            // Compound indexes for common queries
            { key: { position: 1, garScore: -1 } },
            { key: { school: 1, year: 1 } },
            { key: { 'recruitingData.recruitingClass': 1, position: 1 } },
            { key: { isHighlighted: 1, highlightScore: -1 } },
            
            // Text index for full-text search
            { key: { name: 'text', school: 'text', 'recruitingData.location': 'text' } },
            
            // Timestamp indexes
            { key: { createdAt: -1 } },
            { key: { updatedAt: -1 } },
            { key: { 'recruitingData.scrapedAt': -1 } }
        ];
        
        for (const index of playerIndexes) {
            try {
                await db.collection('players').createIndex(index.key, {
                    background: true,
                    name: Object.keys(index.key).join('_')
                });
                console.log(`✅ Created index: ${Object.keys(index.key).join('_')}`);
            } catch (error) {
                console.log(`⚠️  Index may already exist: ${Object.keys(index.key).join('_')}`);
            }
        }
        
        // User collection indexes (if exists)
        try {
            await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });
            await db.collection('users').createIndex({ role: 1 }, { background: true });
            console.log('✅ Created user indexes');
        } catch (error) {
            console.log('⚠️  User indexes may already exist');
        }
        
        console.log('🎉 Database indexes created successfully!');
        
        // Show index statistics
        const stats = await db.collection('players').stats();
        console.log(`📊 Player collection stats:`);
        console.log(`   - Documents: ${stats.count}`);
        console.log(`   - Indexes: ${stats.nindexes}`);
        console.log(`   - Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
};

createIndexes();
