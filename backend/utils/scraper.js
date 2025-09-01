const axios = require('axios');
const cheerio = require('cheerio');
const { logger, logPerformance } = require('./logger');
const { captureException } = require('./sentry');

// Rate limiting configuration
const RATE_LIMITS = {
    'rivals.com': { requests: 10, period: 60000 }, // 10 requests per minute
    '247sports.com': { requests: 15, period: 60000 }, // 15 requests per minute
    'hudl.com': { requests: 20, period: 60000 }, // 20 requests per minute
};

// Track request timestamps for rate limiting
const requestHistory = {
    'rivals.com': [],
    '247sports.com': [],
    'hudl.com': [],
};

// User agents to rotate
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
];

/**
 * Check if we can make a request to a domain without violating rate limits
 */
function canMakeRequest(domain) {
    const now = Date.now();
    const history = requestHistory[domain];
    const limit = RATE_LIMITS[domain];

    if (!limit) return true;

    // Remove old requests outside the time window
    const validRequests = history.filter(timestamp => now - timestamp < limit.period);

    // Update history
    requestHistory[domain] = validRequests;

    return validRequests.length < limit.requests;
}

/**
 * Record a request for rate limiting
 */
function recordRequest(domain) {
    requestHistory[domain].push(Date.now());
}

/**
 * Get a random user agent
 */
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Make a rate-limited HTTP request
 */
async function makeRequest(url, options = {}) {
    const domain = new URL(url).hostname;

    if (!canMakeRequest(domain)) {
        throw new Error(`Rate limit exceeded for ${domain}`);
    }

    const startTime = Date.now();

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...options.headers,
            },
            timeout: 10000,
            ...options,
        });

        recordRequest(domain);

        const duration = Date.now() - startTime;
        logger.info('Web scraping request completed', {
            url,
            domain,
            status: response.status,
            duration,
            contentLength: response.data.length,
        });

        return response;
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Web scraping request failed', {
            url,
            domain,
            error: error.message,
            duration,
        });

        captureException(error, {
            tags: { component: 'scraper', domain },
            extra: { url, duration },
        });

        throw error;
    }
}

/**
 * Scrape athlete data from Rivals.com
 */
async function scrapeRivalsAthletes(sport = 'football', year = new Date().getFullYear()) {
    const startTime = Date.now();

    try {
        const url = `https://rivals.com/${sport}/recruits/${year}`;
        const response = await makeRequest(url);
        const $ = cheerio.load(response.data);

        const athletes = [];

        // Rivals.com athlete cards
        $('.recruit-card, .player-card').each((index, element) => {
            const $el = $(element);

            const athlete = {
                name: $el.find('.player-name, .name').text().trim(),
                position: $el.find('.position').text().trim(),
                school: $el.find('.school, .high-school').text().trim(),
                location: $el.find('.location, .city-state').text().trim(),
                stars: parseInt($el.find('.stars .star').length) || 0,
                rating: parseFloat($el.find('.rating, .score').text().trim()) || 0,
                height: $el.find('.height').text().trim(),
                weight: parseInt($el.find('.weight').text().trim()) || 0,
                source: 'rivals.com',
                sourceUrl: $el.find('a').attr('href'),
                scrapedAt: new Date(),
                sport,
                recruitingClass: year,
            };

            if (athlete.name && athlete.position) {
                athletes.push(athlete);
            }
        });

        const duration = Date.now() - startTime;
        logPerformance('scrape_rivals', duration, {
            athletesFound: athletes.length,
            sport,
            year,
        });

        return athletes;

    } catch (error) {
        logger.error('Failed to scrape Rivals.com', { sport, year, error: error.message });
        captureException(error, {
            tags: { component: 'scraper', source: 'rivals.com' },
            extra: { sport, year },
        });
        return [];
    }
}

/**
 * Scrape athlete data from 247Sports.com
 */
async function scrape247SportsAthletes(sport = 'football', year = new Date().getFullYear()) {
    const startTime = Date.now();

    try {
        const url = `https://247sports.com/season/${year}-${sport}/recruits/`;
        const response = await makeRequest(url);
        const $ = cheerio.load(response.data);

        const athletes = [];

        // 247Sports athlete listings
        $('.recruit, .player-listing').each((index, element) => {
            const $el = $(element);

            const athlete = {
                name: $el.find('.name, .player-name').text().trim(),
                position: $el.find('.position').text().trim(),
                school: $el.find('.school, .high-school').text().trim(),
                location: $el.find('.location, .hometown').text().trim(),
                stars: parseInt($el.find('.stars .star, .rating-stars .star').length) || 0,
                rating: parseFloat($el.find('.rating, .score').text().trim()) || 0,
                height: $el.find('.height').text().trim(),
                weight: parseInt($el.find('.weight').text().trim()) || 0,
                source: '247sports.com',
                sourceUrl: $el.find('a').attr('href'),
                scrapedAt: new Date(),
                sport,
                recruitingClass: year,
            };

            if (athlete.name && athlete.position) {
                athletes.push(athlete);
            }
        });

        const duration = Date.now() - startTime;
        logPerformance('scrape_247sports', duration, {
            athletesFound: athletes.length,
            sport,
            year,
        });

        return athletes;

    } catch (error) {
        logger.error('Failed to scrape 247Sports.com', { sport, year, error: error.message });
        captureException(error, {
            tags: { component: 'scraper', source: '247sports.com' },
            extra: { sport, year },
        });
        return [];
    }
}

/**
 * Scrape athlete data from Hudl.com
 */
async function scrapeHudlAthletes(sport = 'football', location = '') {
    const startTime = Date.now();

    try {
        const baseUrl = 'https://www.hudl.com/search';
        const params = new URLSearchParams({
            q: sport,
            type: 'athlete',
            location: location,
        });

        const url = `${baseUrl}?${params.toString()}`;
        const response = await makeRequest(url);
        const $ = cheerio.load(response.data);

        const athletes = [];

        // Hudl athlete profiles
        $('.athlete-card, .player-profile').each((index, element) => {
            const $el = $(element);

            const athlete = {
                name: $el.find('.name, .athlete-name').text().trim(),
                position: $el.find('.position').text().trim(),
                school: $el.find('.school, .team').text().trim(),
                location: $el.find('.location, .hometown').text().trim(),
                sport,
                source: 'hudl.com',
                sourceUrl: $el.find('a').attr('href'),
                scrapedAt: new Date(),
                // Hudl doesn't have traditional recruiting ratings
                stars: 0,
                rating: 0,
            };

            if (athlete.name) {
                athletes.push(athlete);
            }
        });

        const duration = Date.now() - startTime;
        logPerformance('scrape_hudl', duration, {
            athletesFound: athletes.length,
            sport,
            location,
        });

        return athletes;

    } catch (error) {
        logger.error('Failed to scrape Hudl.com', { sport, location, error: error.message });
        captureException(error, {
            tags: { component: 'scraper', source: 'hudl.com' },
            extra: { sport, location },
        });
        return [];
    }
}

/**
 * Scrape athlete highlights/videos from Hudl
 */
async function scrapeHudlHighlights(athleteName, sport = 'football') {
    const startTime = Date.now();

    try {
        const searchUrl = `https://www.hudl.com/search?q=${encodeURIComponent(athleteName)}&type=video&sport=${sport}`;
        const response = await makeRequest(searchUrl);
        const $ = cheerio.load(response.data);

        const highlights = [];

        $('.video-card, .highlight').each((index, element) => {
            const $el = $(element);

            const highlight = {
                title: $el.find('.title').text().trim(),
                url: $el.find('a').attr('href'),
                thumbnail: $el.find('img').attr('src'),
                duration: $el.find('.duration').text().trim(),
                views: parseInt($el.find('.views').text().trim()) || 0,
                sport,
                athleteName,
                scrapedAt: new Date(),
            };

            if (highlight.title && highlight.url) {
                highlights.push(highlight);
            }
        });

        const duration = Date.now() - startTime;
        logPerformance('scrape_hudl_highlights', duration, {
            highlightsFound: highlights.length,
            athleteName,
            sport,
        });

        return highlights;

    } catch (error) {
        logger.error('Failed to scrape Hudl highlights', { athleteName, sport, error: error.message });
        captureException(error, {
            tags: { component: 'scraper', source: 'hudl_highlights' },
            extra: { athleteName, sport },
        });
        return [];
    }
}

/**
 * Main scraping function that aggregates data from all sources
 */
async function scrapeAllSources(options = {}) {
    const {
        sport = 'football',
        year = new Date().getFullYear(),
        location = '',
        includeHighlights = false,
    } = options;

    const startTime = Date.now();
    const allAthletes = [];
    const errors = [];

    try {
        // Scrape from all sources concurrently
        const scrapingPromises = [
            scrapeRivalsAthletes(sport, year),
            scrape247SportsAthletes(sport, year),
            scrapeHudlAthletes(sport, location),
        ];

        const results = await Promise.allSettled(scrapingPromises);

        // Process results
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allAthletes.push(...result.value);
            } else {
                const source = ['rivals.com', '247sports.com', 'hudl.com'][index];
                errors.push({ source, error: result.reason.message });
                logger.warn(`Failed to scrape ${source}`, { error: result.reason.message });
            }
        });

        // If requested, scrape highlights for top athletes
        if (includeHighlights && allAthletes.length > 0) {
            const topAthletes = allAthletes
                .filter(athlete => athlete.rating > 0)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 10); // Top 10 rated athletes

            for (const athlete of topAthletes) {
                try {
                    const highlights = await scrapeHudlHighlights(athlete.name, sport);
                    athlete.highlights = highlights;
                    // Add small delay to be respectful
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    logger.warn(`Failed to get highlights for ${athlete.name}`, { error: error.message });
                }
            }
        }

        const duration = Date.now() - startTime;
        logPerformance('scrape_all_sources', duration, {
            totalAthletes: allAthletes.length,
            sport,
            year,
            location,
            includeHighlights,
            errors: errors.length,
        });

        return {
            athletes: allAthletes,
            metadata: {
                totalFound: allAthletes.length,
                sourcesScraped: 3 - errors.length,
                errors,
                duration,
                scrapedAt: new Date(),
            },
        };

    } catch (error) {
        logger.error('Failed to scrape all sources', { sport, year, location, error: error.message });
        captureException(error, {
            tags: { component: 'scraper', operation: 'scrape_all' },
            extra: { sport, year, location },
        });

        return {
            athletes: allAthletes,
            metadata: {
                totalFound: allAthletes.length,
                sourcesScraped: 0,
                errors: [{ source: 'general', error: error.message }],
                duration: Date.now() - startTime,
                scrapedAt: new Date(),
            },
        };
    }
}

/**
 * Normalize athlete data from different sources
 */
function normalizeAthleteData(athlete) {
    const normalized = { ...athlete };

    // Normalize position abbreviations
    const positionMap = {
        'QB': ['QB', 'Quarterback'],
        'RB': ['RB', 'Running Back', 'HB', 'Halfback'],
        'WR': ['WR', 'Wide Receiver'],
        'TE': ['TE', 'Tight End'],
        'OL': ['OL', 'Offensive Line', 'OT', 'OG', 'C'],
        'DL': ['DL', 'Defensive Line', 'DT', 'DE'],
        'LB': ['LB', 'Linebacker', 'ILB', 'OLB'],
        'CB': ['CB', 'Cornerback'],
        'S': ['S', 'Safety', 'SS', 'FS'],
        'K': ['K', 'Kicker'],
        'P': ['P', 'Punter'],
    };

    // Find matching position
    if (athlete.position) {
        const pos = athlete.position.toUpperCase().trim();
        for (const [standardPos, variations] of Object.entries(positionMap)) {
            if (variations.some(v => v.toUpperCase() === pos || pos === v.toUpperCase())) {
                normalized.position = standardPos;
                break;
            }
        }
    }

    // Normalize height format (convert to feet'inches)
    if (athlete.height) {
        const heightMatch = athlete.height.match(/(\d)'?\s*(\d+)?/);
        if (heightMatch) {
            const feet = heightMatch[1];
            const inches = heightMatch[2] || '0';
            normalized.height = `${feet}'${inches}"`;
        }
    }

    // Ensure rating is between 0-100 and handle null/undefined
    if (normalized.rating == null) {
        delete normalized.rating;
    } else if (normalized.rating > 100) {
        normalized.rating = normalized.rating / 10; // Some sites use 0-1000 scale
    }

    // Trim whitespace from text fields
    if (normalized.name) normalized.name = normalized.name.trim();
    if (normalized.school) normalized.school = normalized.school.trim();
    if (normalized.location) normalized.location = normalized.location.trim();

    // Calculate GAR score if not provided
    if (!normalized.garScore) {
        if (normalized.rating) {
            normalized.garScore = Math.round(normalized.rating);
        } else if (normalized.recruitingData && normalized.recruitingData.rating) {
            normalized.garScore = Math.round(normalized.recruitingData.rating);
        }
    }

    return normalized;
}

/**
 * Remove duplicate athletes based on name and school
 */
function deduplicateAthletes(athletes) {
    const seen = new Set();
    const unique = [];

    for (const athlete of athletes) {
        const key = `${athlete.name?.toLowerCase().trim()}-${athlete.school?.toLowerCase().trim()}`;

        if (!seen.has(key)) {
            seen.add(key);
            unique.push(athlete);
        }
    }

    return unique;
}

/**
 * Get scraping statistics
 */
function getScrapingStats() {
    const stats = {};

    for (const [domain, history] of Object.entries(requestHistory)) {
        const now = Date.now();
        const limit = RATE_LIMITS[domain];
        const validRequests = history.filter(timestamp => now - timestamp < limit.period);

        stats[domain] = {
            requestsInWindow: validRequests.length,
            limit: limit.requests,
            windowMs: limit.period,
            canMakeRequest: validRequests.length < limit.requests,
        };
    }

    return stats;
}

module.exports = {
    scrapeRivalsAthletes,
    scrape247SportsAthletes,
    scrapeHudlAthletes,
    scrapeHudlHighlights,
    scrapeAllSources,
    normalizeAthleteData,
    deduplicateAthletes,
    getScrapingStats,
    makeRequest,
};
