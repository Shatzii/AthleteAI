const Player = require('../models/playerModel');
const {
    scrapeAllSources,
    scrapeRivalsAthletes,
    scrape247SportsAthletes,
    scrapeHudlAthletes,
    scrapeHudlHighlights,
    normalizeAthleteData,
    deduplicateAthletes,
    getScrapingStats
} = require('../utils/scraper');
const { logger, logPerformance } = require('../utils/logger');
const { captureException } = require('../utils/sentry');

/**
 * Scrape athletes from all sources
 */
exports.scrapeAthletes = async (req, res) => {
    const startTime = Date.now();
    const {
        sport = 'football',
        year = new Date().getFullYear(),
        location = '',
        includeHighlights = false,
        limit = 100
    } = req.query;

    try {
        logger.info('Starting athlete scraping', {
            sport,
            year,
            location,
            includeHighlights,
            user: req.user?.id
        });

        // Scrape from all sources
        const result = await scrapeAllSources({
            sport,
            year: parseInt(year),
            location,
            includeHighlights: includeHighlights === 'true'
        });

        if (!result.athletes || result.athletes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No athletes found',
                metadata: result.metadata
            });
        }

        // Normalize and deduplicate data
        const normalizedAthletes = result.athletes.map(normalizeAthleteData);
        const uniqueAthletes = deduplicateAthletes(normalizedAthletes);

        // Limit results
        const limitedAthletes = uniqueAthletes.slice(0, parseInt(limit));

        // Calculate highlight scores and save to database
        const savedAthletes = [];
        for (const athleteData of limitedAthletes) {
            try {
                // Check if athlete already exists
                const existingAthlete = await Player.findOne({
                    name: new RegExp(`^${athleteData.name.trim()}$`, 'i'),
                    school: new RegExp(`^${athleteData.school?.trim()}$`, 'i')
                });

                if (existingAthlete) {
                    // Update existing athlete with new data
                    Object.assign(existingAthlete, {
                        recruitingData: {
                            ...athleteData.recruitingData,
                            lastUpdated: new Date()
                        },
                        highlights: athleteData.highlights || existingAthlete.highlights,
                        garScore: athleteData.garScore || existingAthlete.garScore,
                        stars: athleteData.stars || existingAthlete.stars
                    });

                    existingAthlete.calculateHighlightScore();
                    await existingAthlete.save();
                    savedAthletes.push(existingAthlete);
                } else {
                    // Create new athlete
                    const newAthlete = new Player({
                        ...athleteData,
                        recruitingData: {
                            ...athleteData.recruitingData,
                            source: athleteData.source,
                            lastUpdated: new Date()
                        }
                    });

                    newAthlete.calculateHighlightScore();
                    await newAthlete.save();
                    savedAthletes.push(newAthlete);
                }
            } catch (saveError) {
                logger.error('Failed to save athlete', {
                    athlete: athleteData.name,
                    error: saveError.message
                });
            }
        }

        const duration = Date.now() - startTime;
        logPerformance('scrape_and_save_athletes', duration, {
            athletesScraped: result.athletes.length,
            athletesNormalized: normalizedAthletes.length,
            athletesUnique: uniqueAthletes.length,
            athletesSaved: savedAthletes.length,
            sport,
            year
        });

        res.json({
            success: true,
            message: `Successfully scraped and saved ${savedAthletes.length} athletes`,
            data: {
                athletes: savedAthletes,
                metadata: {
                    ...result.metadata,
                    normalized: normalizedAthletes.length,
                    unique: uniqueAthletes.length,
                    saved: savedAthletes.length,
                    duration
                }
            }
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Athlete scraping failed', {
            sport,
            year,
            location,
            error: error.message,
            duration
        });

        captureException(error, {
            tags: { component: 'scraper', operation: 'scrape_athletes' },
            extra: { sport, year, location, duration }
        });

        res.status(500).json({
            success: false,
            message: 'Failed to scrape athletes',
            error: error.message
        });
    }
};

/**
 * Get highlighted athletes
 */
exports.getHighlightedAthletes = async (req, res) => {
    try {
        const {
            limit = 20,
            sortBy = 'highlightScore',
            sortOrder = 'desc',
            reason,
            minScore = 0
        } = req.query;

        const query = { isHighlighted: true };
        if (reason) query.highlightReason = reason;
        if (minScore) query.highlightScore = { $gte: parseInt(minScore) };

        const athletes = await Player.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(parseInt(limit))
            .populate('recruitingData')
            .select('-__v');

        res.json({
            success: true,
            data: athletes,
            metadata: {
                total: athletes.length,
                sortBy,
                sortOrder,
                filters: { reason, minScore }
            }
        });

    } catch (error) {
        logger.error('Failed to get highlighted athletes', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get highlighted athletes',
            error: error.message
        });
    }
};

/**
 * Highlight an athlete
 */
exports.highlightAthlete = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'manual', score } = req.body;

        const athlete = await Player.findById(id);
        if (!athlete) {
            return res.status(404).json({
                success: false,
                message: 'Athlete not found'
            });
        }

        athlete.isHighlighted = true;
        athlete.highlightReason = reason;
        if (score !== undefined) {
            athlete.highlightScore = parseInt(score);
        } else {
            athlete.calculateHighlightScore();
        }

        await athlete.save();

        logger.info('Athlete highlighted', {
            athleteId: id,
            athleteName: athlete.name,
            reason,
            score: athlete.highlightScore,
            user: req.user?.id
        });

        res.json({
            success: true,
            message: 'Athlete highlighted successfully',
            data: athlete
        });

    } catch (error) {
        logger.error('Failed to highlight athlete', {
            athleteId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to highlight athlete',
            error: error.message
        });
    }
};

/**
 * Remove athlete highlight
 */
exports.unhighlightAthlete = async (req, res) => {
    try {
        const { id } = req.params;

        const athlete = await Player.findById(id);
        if (!athlete) {
            return res.status(404).json({
                success: false,
                message: 'Athlete not found'
            });
        }

        athlete.isHighlighted = false;
        athlete.highlightReason = null;
        athlete.highlightScore = 0;

        await athlete.save();

        logger.info('Athlete unhighlighted', {
            athleteId: id,
            athleteName: athlete.name,
            user: req.user?.id
        });

        res.json({
            success: true,
            message: 'Athlete unhighlighted successfully',
            data: athlete
        });

    } catch (error) {
        logger.error('Failed to unhighlight athlete', {
            athleteId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to unhighlight athlete',
            error: error.message
        });
    }
};

/**
 * Get athlete highlights/videos
 */
exports.getAthleteHighlights = async (req, res) => {
    try {
        const { id } = req.params;

        const athlete = await Player.findById(id).select('name highlights recruitingData');
        if (!athlete) {
            return res.status(404).json({
                success: false,
                message: 'Athlete not found'
            });
        }

        // If no highlights in database, try to scrape from Hudl
        if (!athlete.highlights || athlete.highlights.length === 0) {
            try {
                const highlights = await scrapeHudlHighlights(athlete.name);

                if (highlights.length > 0) {
                    athlete.highlights = highlights;
                    await athlete.save();
                }
            } catch (scrapeError) {
                logger.warn('Failed to scrape highlights for athlete', {
                    athleteId: id,
                    athleteName: athlete.name,
                    error: scrapeError.message
                });
            }
        }

        res.json({
            success: true,
            data: {
                athlete: {
                    id: athlete._id,
                    name: athlete.name,
                    highlights: athlete.highlights || []
                }
            }
        });

    } catch (error) {
        logger.error('Failed to get athlete highlights', {
            athleteId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get athlete highlights',
            error: error.message
        });
    }
};

/**
 * Update athlete social media profiles
 */
exports.updateAthleteSocialMedia = async (req, res) => {
    try {
        const { id } = req.params;
        const { socialMedia } = req.body;

        const athlete = await Player.findById(id);
        if (!athlete) {
            return res.status(404).json({
                success: false,
                message: 'Athlete not found'
            });
        }

        athlete.socialMedia = { ...athlete.socialMedia, ...socialMedia };
        athlete.calculateHighlightScore(); // Recalculate highlight score
        await athlete.save();

        logger.info('Athlete social media updated', {
            athleteId: id,
            athleteName: athlete.name,
            platforms: Object.keys(socialMedia),
            user: req.user?.id
        });

        res.json({
            success: true,
            message: 'Athlete social media updated successfully',
            data: athlete
        });

    } catch (error) {
        logger.error('Failed to update athlete social media', {
            athleteId: req.params.id,
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update athlete social media',
            error: error.message
        });
    }
};

/**
 * Get scraping statistics
 */
exports.getScrapingStats = async (req, res) => {
    try {
        const stats = getScrapingStats();

        // Get database statistics
        const totalAthletes = await Player.countDocuments();
        const highlightedAthletes = await Player.countDocuments({ isHighlighted: true });
        const sourceStats = await Player.aggregate([
            { $group: { _id: '$recruitingData.source', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                scraping: stats,
                database: {
                    totalAthletes,
                    highlightedAthletes,
                    sourceBreakdown: sourceStats
                }
            }
        });

    } catch (error) {
        logger.error('Failed to get scraping stats', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to get scraping statistics',
            error: error.message
        });
    }
};

/**
 * Auto-highlight top athletes based on criteria
 */
exports.autoHighlightAthletes = async (req, res) => {
    try {
        const { criteria = {}, limit = 50 } = req.body;

        // Default criteria for auto-highlighting
        const defaultCriteria = {
            minRating: criteria.minRating || 85,
            minStars: criteria.minStars || 3,
            hasHighlights: criteria.hasHighlights !== false,
            maxAge: criteria.maxAge || 25
        };

        // Find athletes matching criteria
        const query = {
            $or: [
                { 'recruitingData.rating': { $gte: defaultCriteria.minRating } },
                { stars: { $gte: defaultCriteria.minStars } }
            ]
        };

        if (defaultCriteria.hasHighlights) {
            query.highlights = { $exists: true, $ne: [] };
        }

        const athletes = await Player.find(query)
            .sort({ 'recruitingData.rating': -1, stars: -1 })
            .limit(parseInt(limit));

        let highlightedCount = 0;
        const highlightedAthletes = [];

        for (const athlete of athletes) {
            if (!athlete.isHighlighted) {
                athlete.isHighlighted = true;
                athlete.highlightReason = 'top_rated';
                athlete.calculateHighlightScore();
                await athlete.save();

                highlightedAthletes.push(athlete);
                highlightedCount++;
            }
        }

        logger.info('Auto-highlighted athletes', {
            criteria: defaultCriteria,
            athletesFound: athletes.length,
            athletesHighlighted: highlightedCount,
            user: req.user?.id
        });

        res.json({
            success: true,
            message: `Auto-highlighted ${highlightedCount} athletes`,
            data: {
                highlighted: highlightedAthletes,
                criteria: defaultCriteria,
                stats: {
                    found: athletes.length,
                    highlighted: highlightedCount
                }
            }
        });

    } catch (error) {
        logger.error('Failed to auto-highlight athletes', { error: error.message });
        captureException(error, {
            tags: { component: 'highlight', operation: 'auto_highlight' },
            extra: { criteria: req.body.criteria }
        });

        res.status(500).json({
            success: false,
            message: 'Failed to auto-highlight athletes',
            error: error.message
        });
    }
};
