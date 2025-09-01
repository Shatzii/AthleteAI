const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const {
    scrapeRivalsAthletes,
    scrape247SportsAthletes,
    scrapeHudlAthletes,
    normalizeAthleteData,
    deduplicateAthletes
} = require('../../backend/utils/scraper');

// Configure AWS
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

// Initialize MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) return;

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

// Athlete model (simplified for Lambda)
const athleteSchema = new mongoose.Schema({
    name: String,
    position: String,
    school: String,
    year: String,
    garScore: Number,
    stars: Number,
    recruitingData: {
        source: String,
        sourceUrl: String,
        rating: Number,
        location: String,
        recruitingClass: Number,
        lastUpdated: Date
    },
    highlights: [{
        title: String,
        url: String,
        platform: String,
        uploadedAt: Date
    }],
    isHighlighted: { type: Boolean, default: false },
    highlightScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

athleteSchema.methods.calculateHighlightScore = function() {
    let score = 0;
    if (this.recruitingData?.rating) score += this.recruitingData.rating;
    score += this.stars * 10;
    if (this.highlights && this.highlights.length > 0) {
        score += Math.min(this.highlights.length * 5, 20);
    }
    this.highlightScore = Math.min(100, Math.max(0, score));
    return this.highlightScore;
};

const Athlete = mongoose.model('Player', athleteSchema);

/**
 * Lambda function to process athlete scraping jobs
 */
exports.handler = async (event) => {
    const startTime = Date.now();
    let athletesProcessed = 0;
    let athletesSaved = 0;
    let errors = [];

    try {
        console.log('🚀 Starting athlete scraping job processing');

        // Connect to database
        await connectToDatabase();

        // Process each message in the batch
        for (const record of event.Records) {
            try {
                const message = JSON.parse(record.body);
                console.log('📨 Processing scraping job:', message);

                const { athleteId, source, sourceUrl, priority } = message;

                // Determine which scraping function to use
                let scrapingFunction;
                let scrapingParams = {};

                switch (source) {
                    case 'rivals.com':
                        scrapingFunction = scrapeRivalsAthletes;
                        scrapingParams = { athleteId };
                        break;
                    case '247sports.com':
                        scrapingFunction = scrape247SportsAthletes;
                        scrapingParams = { athleteId };
                        break;
                    case 'hudl.com':
                        scrapingFunction = scrapeHudlAthletes;
                        scrapingParams = { athleteId };
                        break;
                    default:
                        console.log(`⚠️  Unknown source: ${source}`);
                        continue;
                }

                // Scrape athlete data
                console.log(`🔍 Scraping athlete from ${source}`);
                const scrapedData = await scrapingFunction(scrapingParams);

                if (!scrapedData || scrapedData.length === 0) {
                    console.log(`⚠️  No data found for athlete ${athleteId} from ${source}`);
                    continue;
                }

                // Process each scraped athlete
                for (const athleteData of scrapedData) {
                    try {
                        athletesProcessed++;

                        // Normalize data
                        const normalizedData = normalizeAthleteData(athleteData);

                        // Check if athlete already exists
                        const existingAthlete = await Athlete.findOne({
                            name: new RegExp(`^${normalizedData.name?.trim()}$`, 'i'),
                            school: new RegExp(`^${normalizedData.school?.trim()}$`, 'i')
                        });

                        if (existingAthlete) {
                            // Update existing athlete
                            Object.assign(existingAthlete, {
                                recruitingData: {
                                    ...normalizedData.recruitingData,
                                    source,
                                    sourceUrl,
                                    lastUpdated: new Date()
                                },
                                highlights: normalizedData.highlights || existingAthlete.highlights,
                                garScore: normalizedData.garScore || existingAthlete.garScore,
                                stars: normalizedData.stars || existingAthlete.stars,
                                updatedAt: new Date()
                            });

                            existingAthlete.calculateHighlightScore();
                            await existingAthlete.save();
                            console.log(`✅ Updated athlete: ${normalizedData.name}`);
                        } else {
                            // Create new athlete
                            const newAthlete = new Athlete({
                                ...normalizedData,
                                recruitingData: {
                                    ...normalizedData.recruitingData,
                                    source,
                                    sourceUrl,
                                    lastUpdated: new Date()
                                }
                            });

                            newAthlete.calculateHighlightScore();
                            await newAthlete.save();
                            athletesSaved++;
                            console.log(`✅ Created new athlete: ${normalizedData.name}`);
                        }

                    } catch (athleteError) {
                        console.error(`❌ Error processing athlete:`, athleteError);
                        errors.push({
                            athleteId,
                            error: athleteError.message,
                            source
                        });
                    }
                }

            } catch (messageError) {
                console.error('❌ Error processing message:', messageError);
                errors.push({
                    messageId: record.messageId,
                    error: messageError.message
                });
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Scraping job completed in ${duration}ms`);
        console.log(`📊 Processed: ${athletesProcessed}, Saved: ${athletesSaved}, Errors: ${errors.length}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Scraping job completed successfully',
                metrics: {
                    athletesProcessed,
                    athletesSaved,
                    errors: errors.length,
                    duration,
                    timestamp: new Date().toISOString()
                },
                errors: errors.slice(0, 10) // Limit error details
            })
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('❌ Scraping job failed:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Scraping job failed',
                error: error.message,
                metrics: {
                    athletesProcessed,
                    athletesSaved,
                    errors: errors.length,
                    duration,
                    timestamp: new Date().toISOString()
                }
            })
        };
    }
};
