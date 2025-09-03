const { logger } = require('../utils/logger');
const { connectDB, getDBStats } = require('../config/database');

// Data storage and normalization service
class DataStorageService {
    constructor() {
        this.db = null;
        this.collections = {
            athletes: 'athletes',
            athleteData: 'athlete_data',
            scrapingJobs: 'scraping_jobs',
            dataQuality: 'data_quality'
        };
    }

    // Initialize database connection
    async initialize() {
        try {
            const dbConnection = await connectDB();

            // Check if it's a mock database or real MongoDB
            if (dbConnection && typeof dbConnection.collection === 'function') {
                // Real MongoDB connection
                this.db = dbConnection;
                this.isMock = false;
            } else {
                // Mock database
                this.db = dbConnection;
                this.isMock = true;
                this.mockCollections = {
                    athletes: [],
                    athleteData: [],
                    scrapingJobs: [],
                    dataQuality: [],
                    qualityMetrics: []
                };
            }

            logger.info(`Data storage service initialized (${this.isMock ? 'mock' : 'real'} database)`);
        } catch (error) {
            logger.error('Failed to initialize data storage service:', error);
            throw error;
        }
    }

    // Store athlete data
    async storeAthleteData(athleteData) {
        try {
            // Normalize the data before storing
            const normalizedData = this.normalizeAthleteData(athleteData);

            if (this.isMock) {
                // Mock database storage
                const collection = this.mockCollections.athleteData;
                const existingIndex = collection.findIndex(a => a.name === normalizedData.name && a.sport === normalizedData.sport);

                if (existingIndex >= 0) {
                    // Update existing athlete
                    normalizedData._id = collection[existingIndex]._id;
                    normalizedData.updatedAt = new Date();
                    normalizedData.version = (collection[existingIndex].version || 0) + 1;

                    // Merge with existing data
                    normalizedData.stats = this.mergeStats(collection[existingIndex].stats || {}, normalizedData.stats);
                    normalizedData.highlights = this.mergeHighlights(collection[existingIndex].highlights || [], normalizedData.highlights);
                    normalizedData.recruitingData = this.mergeRecruitingData(collection[existingIndex].recruitingData || {}, normalizedData.recruitingData);

                    collection[existingIndex] = normalizedData;
                } else {
                    // Insert new athlete
                    normalizedData._id = Date.now().toString();
                    normalizedData.createdAt = new Date();
                    normalizedData.updatedAt = new Date();
                    normalizedData.version = 1;
                    collection.push(normalizedData);
                }

                logger.info(`Stored athlete data for: ${normalizedData.name} (mock)`);
            } else {
                // Real MongoDB storage
                const collection = this.db.collection(this.collections.athleteData);
                const existingAthlete = await collection.findOne({
                    name: normalizedData.name,
                    sport: normalizedData.sport
                });

                if (existingAthlete) {
                    // Update existing athlete
                    normalizedData._id = existingAthlete._id;
                    normalizedData.updatedAt = new Date();
                    normalizedData.version = (existingAthlete.version || 0) + 1;

                    // Merge with existing data
                    normalizedData.stats = this.mergeStats(existingAthlete.stats || {}, normalizedData.stats);
                    normalizedData.highlights = this.mergeHighlights(existingAthlete.highlights || [], normalizedData.highlights);
                    normalizedData.recruitingData = this.mergeRecruitingData(existingAthlete.recruitingData || {}, normalizedData.recruitingData);

                    await collection.replaceOne({ _id: existingAthlete._id }, normalizedData);
                    logger.info(`Updated athlete data for: ${normalizedData.name}`);
                } else {
                    // Insert new athlete
                    normalizedData.createdAt = new Date();
                    normalizedData.updatedAt = new Date();
                    normalizedData.version = 1;

                    const result = await collection.insertOne(normalizedData);
                    normalizedData._id = result.insertedId;
                    logger.info(`Stored new athlete data for: ${normalizedData.name}`);
                }
            }

            // Store data quality metrics
            await this.storeDataQualityMetrics(normalizedData);

            return normalizedData;
        } catch (error) {
            logger.error('Error storing athlete data:', error);
            throw error;
        }
    }

    // Normalize athlete data
    normalizeAthleteData(data) {
        const normalized = { ...data };

        // Normalize name
        if (normalized.name) {
            normalized.name = this.normalizeName(normalized.name);
            normalized.nameLower = normalized.name.toLowerCase();
        }

        // Normalize sport
        if (normalized.sport) {
            normalized.sport = this.normalizeSport(normalized.sport);
        }

        // Normalize position
        if (normalized.position) {
            normalized.position = this.normalizePosition(normalized.position, normalized.sport);
        }

        // Normalize school
        if (normalized.school) {
            normalized.school = this.normalizeSchool(normalized.school);
        }

        // Normalize stats
        if (normalized.stats) {
            normalized.stats = this.normalizeStats(normalized.stats);
        }

        // Normalize highlights
        if (normalized.highlights) {
            normalized.highlights = this.normalizeHighlights(normalized.highlights);
        }

        // Normalize recruiting data
        if (normalized.recruitingData) {
            normalized.recruitingData = this.normalizeRecruitingData(normalized.recruitingData);
        }

        // Add metadata
        normalized.metadata = {
            ...normalized.metadata,
            normalizedAt: new Date(),
            dataSources: normalized.metadata?.sourcesUsed || [],
            confidence: this.calculateConfidence(normalized)
        };

        return normalized;
    }

    // Normalize athlete name
    normalizeName(name) {
        if (!name) return '';

        return name
            .trim()
            .replace(/\s+/g, ' ') // Multiple spaces to single
            .replace(/[^\w\s'-]/g, '') // Remove special characters except apostrophes and hyphens
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Normalize sport name
    normalizeSport(sport) {
        if (!sport) return 'football';

        const sportMap = {
            'football': 'football',
            'basketball': 'basketball',
            'baseball': 'baseball',
            'soccer': 'soccer',
            'track': 'track',
            'track and field': 'track',
            'cross country': 'track',
            'tennis': 'tennis',
            'swimming': 'swimming',
            'wrestling': 'wrestling',
            'volleyball': 'volleyball',
            'lacrosse': 'lacrosse',
            'hockey': 'hockey',
            'golf': 'golf'
        };

        return sportMap[sport.toLowerCase()] || sport.toLowerCase();
    }

    // Normalize position
    normalizePosition(position, sport = 'football') {
        if (!position) return '';

        const positionMap = {
            football: {
                'qb': 'Quarterback',
                'quarterback': 'Quarterback',
                'rb': 'Running Back',
                'running back': 'Running Back',
                'wr': 'Wide Receiver',
                'wide receiver': 'Wide Receiver',
                'te': 'Tight End',
                'tight end': 'Tight End',
                'ol': 'Offensive Line',
                'offensive line': 'Offensive Line',
                'ot': 'Offensive Tackle',
                'offensive tackle': 'Offensive Tackle',
                'og': 'Offensive Guard',
                'offensive guard': 'Offensive Guard',
                'c': 'Center',
                'center': 'Center',
                'de': 'Defensive End',
                'defensive end': 'Defensive End',
                'dt': 'Defensive Tackle',
                'defensive tackle': 'Defensive Tackle',
                'lb': 'Linebacker',
                'linebacker': 'Linebacker',
                'cb': 'Cornerback',
                'cornerback': 'Cornerback',
                's': 'Safety',
                'safety': 'Safety',
                'k': 'Kicker',
                'kicker': 'Kicker',
                'p': 'Punter',
                'punter': 'Punter'
            },
            basketball: {
                'pg': 'Point Guard',
                'sg': 'Shooting Guard',
                'sf': 'Small Forward',
                'pf': 'Power Forward',
                'c': 'Center'
            }
        };

        const sportPositions = positionMap[sport.toLowerCase()] || {};
        return sportPositions[position.toLowerCase()] || position;
    }

    // Normalize school name
    normalizeSchool(school) {
        if (!school) return '';

        // Common school name variations
        const schoolMap = {
            'texas high school': 'Texas High School',
            'austin high': 'Austin High School',
            'houston high': 'Houston High School',
            'dallas high': 'Dallas High School',
            'san antonio high': 'San Antonio High School'
        };

        return schoolMap[school.toLowerCase()] || school;
    }

    // Normalize stats
    normalizeStats(stats) {
        const normalized = {};

        Object.entries(stats).forEach(([key, value]) => {
            // Ensure numeric values
            if (typeof value === 'number') {
                normalized[key] = value;
            } else if (typeof value === 'string') {
                const numValue = parseFloat(value.replace(/,/g, ''));
                if (!isNaN(numValue)) {
                    normalized[key] = numValue;
                }
            }
        });

        return normalized;
    }

    // Normalize highlights
    normalizeHighlights(highlights) {
        return highlights.map(highlight => ({
            ...highlight,
            title: highlight.title ? highlight.title.trim() : 'Untitled',
            url: highlight.url ? highlight.url.trim() : '',
            views: typeof highlight.views === 'number' ? highlight.views : 0,
            duration: highlight.duration || '00:00',
            uploadedAt: highlight.uploadedAt || new Date(),
            platform: highlight.platform || 'unknown'
        })).filter(h => h.url); // Only keep highlights with URLs
    }

    // Normalize recruiting data
    normalizeRecruitingData(recruitingData) {
        const normalized = { ...recruitingData };

        // Ensure numeric values
        ['rating', 'stars', 'ranking', 'offers'].forEach(field => {
            if (normalized[field] !== undefined) {
                normalized[field] = typeof normalized[field] === 'number' ?
                    normalized[field] : parseFloat(normalized[field]) || 0;
            }
        });

        return normalized;
    }

    // Merge stats from multiple sources
    mergeStats(existingStats, newStats) {
        const merged = { ...existingStats };

        Object.entries(newStats).forEach(([key, value]) => {
            if (typeof value === 'number' && value > 0) {
                if (!merged[key]) {
                    merged[key] = value;
                } else {
                    // Use the more recent/higher value
                    merged[key] = Math.max(merged[key], value);
                }
            }
        });

        return merged;
    }

    // Merge highlights from multiple sources
    mergeHighlights(existingHighlights, newHighlights) {
        const merged = [...existingHighlights];
        const existingUrls = new Set(existingHighlights.map(h => h.url));

        newHighlights.forEach(highlight => {
            if (!existingUrls.has(highlight.url)) {
                merged.push(highlight);
            }
        });

        // Sort by views and limit to top 20
        return merged
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 20);
    }

    // Merge recruiting data
    mergeRecruitingData(existingData, newData) {
        const merged = { ...existingData };

        // Use the most recent or highest quality data
        Object.entries(newData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (!merged[key] || key === 'rating' || key === 'stars') {
                    merged[key] = value;
                }
            }
        });

        return merged;
    }

    // Calculate confidence score
    calculateConfidence(data) {
        let confidence = 0;

        // Data completeness (40 points)
        if (data.name) confidence += 10;
        if (data.sport) confidence += 5;
        if (data.position) confidence += 5;
        if (data.school) confidence += 5;
        if (Object.keys(data.stats || {}).length > 0) confidence += 10;
        if ((data.highlights || []).length > 0) confidence += 5;

        // Source quality (30 points)
        const sources = data.metadata?.sourcesUsed || [];
        confidence += Math.min(sources.length * 6, 30);

        // Data recency (20 points)
        const lastUpdated = data.metadata?.lastUpdated;
        if (lastUpdated) {
            const hoursSince = (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60);
            if (hoursSince < 24) confidence += 20;
            else if (hoursSince < 168) confidence += 15;
            else if (hoursSince < 720) confidence += 10; // 30 days
        }

        // Data quality (10 points)
        const quality = data.metadata?.dataQuality || 0;
        confidence += Math.min(quality / 10, 10);

        return Math.min(confidence, 100);
    }

    // Helper method to get nested object values
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Store data quality metrics
    async storeDataQualityMetrics(athleteData) {
        try {
            if (this.isMock) {
                const collection = this.mockCollections.dataQuality;
                const existingIndex = collection.findIndex(q => q.athleteId === athleteData._id);

                const qualityMetrics = {
                    athleteId: athleteData._id,
                    athleteName: athleteData.name,
                    sport: athleteData.sport,
                    dataQuality: athleteData.metadata?.dataQuality || 0,
                    confidence: athleteData.metadata?.confidence || 0,
                    sourcesUsed: athleteData.metadata?.sourcesUsed || [],
                    statsCount: Object.keys(athleteData.stats || {}).length,
                    highlightsCount: (athleteData.highlights || []).length,
                    hasRecruitingData: Object.keys(athleteData.recruitingData || {}).length > 0,
                    lastUpdated: new Date()
                };

                if (existingIndex >= 0) {
                    collection[existingIndex] = { ...collection[existingIndex], ...qualityMetrics };
                } else {
                    collection.push(qualityMetrics);
                }
            } else {
                const collection = this.db.collection(this.collections.dataQuality);

                const qualityMetrics = {
                    athleteId: athleteData._id,
                    athleteName: athleteData.name,
                    sport: athleteData.sport,
                    dataQuality: athleteData.metadata?.dataQuality || 0,
                    confidence: athleteData.metadata?.confidence || 0,
                    sourcesUsed: athleteData.metadata?.sourcesUsed || [],
                    statsCount: Object.keys(athleteData.stats || {}).length,
                    highlightsCount: (athleteData.highlights || []).length,
                    hasRecruitingData: Object.keys(athleteData.recruitingData || {}).length > 0,
                    lastUpdated: new Date(),
                    version: athleteData.version || 1
                };

                await collection.updateOne(
                    { athleteId: athleteData._id },
                    { $set: qualityMetrics },
                    { upsert: true }
                );
            }
        } catch (error) {
            logger.error('Error storing data quality metrics:', error);
        }
    }

    // Get athlete data by name
    async getAthleteData(athleteName, sport = null) {
        try {
            if (this.isMock) {
                const collection = this.mockCollections.athleteData;
                const athlete = collection.find(a =>
                    a.nameLower === athleteName.toLowerCase() &&
                    (!sport || a.sport === sport)
                );
                return athlete || null;
            } else {
                const collection = this.db.collection(this.collections.athleteData);
                const query = {
                    nameLower: athleteName.toLowerCase()
                };

                if (sport) {
                    query.sport = sport;
                }

                return await collection.findOne(query);
            }
        } catch (error) {
            logger.error('Error getting athlete data:', error);
            return null;
        }
    }

    // Search athletes
    async searchAthletes(query, options = {}) {
        try {
            if (this.isMock) {
                const collection = this.mockCollections.athleteData;
                let results = [...collection];

                // Text search
                if (query) {
                    results = results.filter(a =>
                        a.nameLower?.includes(query.toLowerCase()) ||
                        a.school?.toLowerCase().includes(query.toLowerCase())
                    );
                }

                // Filters
                const { sport, position, school, limit = 50, sortBy = 'metadata.confidence', sortOrder = -1 } = options;
                if (sport) results = results.filter(a => a.sport === sport);
                if (position) results = results.filter(a => a.position === position);
                if (school) results = results.filter(a => a.school?.toLowerCase().includes(school.toLowerCase()));

                // Sort
                results.sort((a, b) => {
                    const aVal = this.getNestedValue(a, sortBy) || 0;
                    const bVal = this.getNestedValue(b, sortBy) || 0;
                    return sortOrder === 1 ? aVal - bVal : bVal - aVal;
                });

                return results.slice(0, limit);
            } else {
                const collection = this.db.collection(this.collections.athleteData);
                const {
                    sport,
                    position,
                    school,
                    limit = 50,
                    sortBy = 'metadata.confidence',
                    sortOrder = -1
                } = options;

                const searchQuery = {};

                // Text search
                if (query) {
                    searchQuery.$or = [
                        { nameLower: { $regex: query.toLowerCase(), $options: 'i' } },
                        { school: { $regex: query, $options: 'i' } }
                    ];
                }

                // Filters
                if (sport) searchQuery.sport = sport;
                if (position) searchQuery.position = position;
                if (school) searchQuery.school = { $regex: school, $options: 'i' };

                const results = await collection
                    .find(searchQuery)
                    .sort({ [sortBy]: sortOrder })
                    .limit(limit)
                    .toArray();

                return results;
            }
        } catch (error) {
            logger.error('Error searching athletes:', error);
            return [];
        }
    }

    // Get data quality statistics
    async getDataQualityStats() {
        try {
            if (this.isMock) {
                const athletes = this.mockCollections.athleteData;
                const qualityData = this.mockCollections.dataQuality;

                const stats = {
                    totalAthletes: athletes.length,
                    averageQuality: athletes.length > 0 ?
                        athletes.reduce((sum, a) => sum + (a.metadata?.dataQuality || 0), 0) / athletes.length : 0,
                    averageConfidence: athletes.length > 0 ?
                        athletes.reduce((sum, a) => sum + (a.metadata?.confidence || 0), 0) / athletes.length : 0,
                    highQualityCount: athletes.filter(a => (a.metadata?.dataQuality || 0) >= 80).length,
                    sourceDistribution: {}
                };

                // Count sources
                athletes.forEach(athlete => {
                    const sources = athlete.metadata?.sourcesUsed || [];
                    sources.forEach(source => {
                        stats.sourceDistribution[source] = (stats.sourceDistribution[source] || 0) + 1;
                    });
                });

                return stats;
            } else {
                const collection = this.db.collection(this.collections.dataQuality);

                const stats = await collection.aggregate([
                    {
                        $group: {
                            _id: null,
                            totalAthletes: { $sum: 1 },
                            averageQuality: { $avg: '$dataQuality' },
                            averageConfidence: { $avg: '$confidence' },
                            highQualityCount: {
                                $sum: { $cond: [{ $gte: ['$dataQuality', 80] }, 1, 0] }
                            },
                            sourcesUsed: { $push: '$sourcesUsed' }
                        }
                    }
                ]).toArray();

                if (stats.length > 0) {
                    // Flatten sources array
                    const allSources = stats[0].sourcesUsed.flat();
                    const sourceCounts = {};
                    allSources.forEach(source => {
                        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
                    });

                    stats[0].sourceDistribution = sourceCounts;
                    delete stats[0].sourcesUsed;
                }

                return stats[0] || {
                    totalAthletes: 0,
                    averageQuality: 0,
                    averageConfidence: 0,
                    highQualityCount: 0,
                    sourceDistribution: {}
                };
            }
        } catch (error) {
            logger.error('Error getting data quality stats:', error);
            return {};
        }
    }

    // Clean up old data
    async cleanupOldData(daysOld = 90) {
        try {
            const collection = this.db.collection(this.collections.athleteData);
            const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

            const result = await collection.deleteMany({
                updatedAt: { $lt: cutoffDate },
                'metadata.confidence': { $lt: 50 } // Only delete low-confidence old data
            });

            logger.info(`Cleaned up ${result.deletedCount} old athlete records`);
            return result.deletedCount;
        } catch (error) {
            logger.error('Error cleaning up old data:', error);
            return 0;
        }
    }

    // Export athlete data
    async exportAthleteData(format = 'json', filters = {}) {
        try {
            const collection = this.db.collection(this.collections.athleteData);
            const data = await collection.find(filters).toArray();

            if (format === 'csv') {
                return this.convertToCSV(data);
            }

            return data;
        } catch (error) {
            logger.error('Error exporting athlete data:', error);
            return [];
        }
    }

    // Convert data to CSV
    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = [
            'name', 'sport', 'position', 'school', 'dataQuality', 'confidence',
            'sourcesUsed', 'statsCount', 'highlightsCount', 'lastUpdated'
        ];

        const rows = data.map(item => [
            item.name || '',
            item.sport || '',
            item.position || '',
            item.school || '',
            item.metadata?.dataQuality || 0,
            item.metadata?.confidence || 0,
            (item.metadata?.sourcesUsed || []).join(';'),
            Object.keys(item.stats || {}).length,
            (item.highlights || []).length,
            item.updatedAt ? new Date(item.updatedAt).toISOString() : ''
        ]);

        return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    }
}

module.exports = DataStorageService;
