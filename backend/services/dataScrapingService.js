const axios = require('axios');
const cheerio = require('cheerio');
const { logger } = require('../utils/logger');

// Enhanced data scraping service for external athletic data sources
class DataScrapingService {
    constructor() {
        this.sources = {
            maxpreps: {
                baseUrl: 'https://www.maxpreps.com',
                rateLimit: 2000, // 2 seconds between requests
                lastRequest: 0,
                userAgents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
                ]
            },
            hudl: {
                baseUrl: 'https://www.hudl.com',
                rateLimit: 3000,
                lastRequest: 0,
                userAgents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ]
            },
            athleticNet: {
                baseUrl: 'https://www.athletic.net',
                rateLimit: 2500,
                lastRequest: 0,
                userAgents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ]
            },
            espn: {
                baseUrl: 'https://www.espn.com',
                rateLimit: 3000,
                lastRequest: 0,
                userAgents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ]
            },
            rivals247: {
                baseUrl: 'https://247sports.com',
                rateLimit: 2500,
                lastRequest: 0,
                userAgents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ]
            }
        };

        this.retryAttempts = 3;
        this.timeout = 30000; // 30 seconds
    }

    // Initialize the service
    async initialize() {
        try {
            logger.info('Data scraping service initialized');
            // Any initialization logic can go here
        } catch (error) {
            logger.error('Failed to initialize data scraping service:', error);
            throw error;
        }
    }

    // Enhanced rate limiting with random delays
    async rateLimit(source) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.sources[source].lastRequest;
        const baseDelay = this.sources[source].rateLimit;
        const randomDelay = Math.random() * 1000; // Add up to 1 second randomness
        const requiredDelay = baseDelay + randomDelay;

        if (timeSinceLastRequest < requiredDelay) {
            const delay = requiredDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.sources[source].lastRequest = Date.now();
    }

    // Get random user agent for the source
    getRandomUserAgent(source) {
        const userAgents = this.sources[source].userAgents;
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    // Enhanced HTTP request with retry logic
    async makeRequest(url, source, options = {}) {
        await this.rateLimit(source);

        const config = {
            timeout: this.timeout,
            headers: {
                'User-Agent': this.getRandomUserAgent(source),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...options.headers
            },
            ...options
        };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await axios.get(url, config);
                return response;
            } catch (error) {
                logger.warn(`Request attempt ${attempt} failed for ${url}:`, error.message);

                if (attempt === this.retryAttempts) {
                    throw error;
                }

                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Scrape MaxPreps for high school athlete data
    async scrapeMaxPrepsAthlete(athleteName, state = 'TX') {
        try {
            // Try multiple search approaches with correct MaxPreps URLs
            const searchUrls = [
                `${this.sources.maxpreps.baseUrl}/search/default.aspx?q=${encodeURIComponent(athleteName)}&sport=football&state=${state}`,
                `${this.sources.maxpreps.baseUrl}/search/default.aspx?q=${encodeURIComponent(athleteName)}&sport=football`,
                `${this.sources.maxpreps.baseUrl}/search/?q=${encodeURIComponent(athleteName)}&state=${state}`,
                `${this.sources.maxpreps.baseUrl}/search/?q=${encodeURIComponent(athleteName)}`
            ];

            let athletes = [];
            let response = null;

            for (const url of searchUrls) {
                try {
                    response = await this.makeRequest(url, 'maxpreps');
                    break;
                } catch (error) {
                    logger.debug(`MaxPreps search URL failed: ${url}`);
                    continue;
                }
            }

            if (!response) {
                logger.warn(`All MaxPreps search URLs failed for athlete: ${athleteName}`);
                return [];
            }

            const $ = cheerio.load(response.data);

            // Try multiple selector patterns for athlete results
            const selectors = [
                '.athlete-result',
                '.search-result.athlete',
                '.player-result',
                '[data-type="athlete"]',
                '.athlete-card',
                '.search-item',
                '.result-item'
            ];

            for (const selector of selectors) {
                $(selector).each((index, element) => {
                    const athlete = this.parseMaxPrepsAthlete($, element);
                    if (athlete && athlete.name) {
                        athletes.push(athlete);
                    }
                });

                if (athletes.length > 0) break;
            }

            // If no results found, try to extract from general search results
            if (athletes.length === 0) {
                $('a[href*="/athlete/"], a[href*="/player/"], a[href*="football"]').each((index, element) => {
                    const href = $(element).attr('href');
                    const text = $(element).text().trim();

                    if (text && href && (text.toLowerCase().includes(athleteName.toLowerCase().split(' ')[0]) ||
                        href.toLowerCase().includes('football'))) {
                        athletes.push({
                            name: text || athleteName,
                            profileUrl: href.startsWith('http') ? href : `${this.sources.maxpreps.baseUrl}${href}`,
                            source: 'maxpreps',
                            scrapedAt: new Date(),
                            confidence: 'low'
                        });
                    }
                });
            }

            logger.info(`MaxPreps scraping completed for ${athleteName}: found ${athletes.length} results`);
            return athletes;

        } catch (error) {
            logger.error('MaxPreps scraping error:', error.message);
            return [];
        }
    }

    // Parse MaxPreps athlete data from HTML element
    parseMaxPrepsAthlete($, element) {
        try {
            const athlete = {
                source: 'maxpreps',
                scrapedAt: new Date(),
                confidence: 'high'
            };

            // Extract name
            const nameSelectors = ['.athlete-name', '.name', '.player-name', 'h3', 'h4', '.title'];
            for (const selector of nameSelectors) {
                const name = $(element).find(selector).first().text().trim();
                if (name) {
                    athlete.name = name;
                    break;
                }
            }

            // Extract school
            const schoolSelectors = ['.school-name', '.school', '.team', '.institution'];
            for (const selector of schoolSelectors) {
                const school = $(element).find(selector).first().text().trim();
                if (school) {
                    athlete.school = school;
                    break;
                }
            }

            // Extract position
            const positionSelectors = ['.position', '.pos', '.role'];
            for (const selector of positionSelectors) {
                const position = $(element).find(selector).first().text().trim();
                if (position) {
                    athlete.position = position;
                    break;
                }
            }

            // Extract graduation year
            const yearSelectors = ['.grad-year', '.year', '.class', '.graduation'];
            for (const selector of yearSelectors) {
                const year = $(element).find(selector).first().text().trim();
                if (year && /^\d{4}$/.test(year)) {
                    athlete.year = parseInt(year);
                    break;
                }
            }

            // Extract profile URL
            const profileLink = $(element).find('a').first().attr('href');
            if (profileLink) {
                athlete.profileUrl = profileLink.startsWith('http') ? profileLink : `${this.sources.maxpreps.baseUrl}${profileLink}`;
            }

            // Extract stats if available
            athlete.stats = this.parseMaxPrepsStats($, element);

            return athlete;
        } catch (error) {
            logger.error('Error parsing MaxPreps athlete:', error.message);
            return null;
        }
    }

    // Parse MaxPreps stats
    parseMaxPrepsStats($, element) {
        const stats = {};

        try {
            // Look for stats in various formats
            const statSelectors = ['.stat-item', '.stats', '.performance', '.metrics'];

            for (const selector of statSelectors) {
                $(element).find(selector).each((index, stat) => {
                    const label = $(stat).find('.stat-label, .label, .name').first().text().trim().toLowerCase();
                    const value = $(stat).find('.stat-value, .value, .number').first().text().trim();

                    // Parse different stat types
                    if (label.includes('passing') || label.includes('pass')) {
                        stats.passingYards = this.parseNumericValue(value);
                    }
                    if (label.includes('rushing') || label.includes('rush')) {
                        stats.rushingYards = this.parseNumericValue(value);
                    }
                    if (label.includes('receiving') || label.includes('recept')) {
                        stats.receivingYards = this.parseNumericValue(value);
                    }
                    if (label.includes('touchdown') || label.includes('td')) {
                        stats.touchdowns = this.parseNumericValue(value);
                    }
                    if (label.includes('tackle')) {
                        stats.tackles = this.parseNumericValue(value);
                    }
                    if (label.includes('sack')) {
                        stats.sacks = this.parseNumericValue(value);
                    }
                    if (label.includes('interception') || label.includes('int')) {
                        stats.interceptions = this.parseNumericValue(value);
                    }
                    if (label.includes('completion') || label.includes('comp')) {
                        stats.completionPercentage = this.parseNumericValue(value.replace('%', ''));
                    }
                });
            }

            // Try to extract stats from text content
            const textContent = $(element).text();
            const statPatterns = {
                passingYards: /passing yards?:?\s*(\d+(?:,\d+)*)/i,
                rushingYards: /rushing yards?:?\s*(\d+(?:,\d+)*)/i,
                receivingYards: /receiving yards?:?\s*(\d+(?:,\d+)*)/i,
                touchdowns: /touchdowns?:?\s*(\d+)/i,
                tackles: /tackles?:?\s*(\d+)/i,
                sacks: /sacks?:?\s*(\d+(?:\.\d+)?)/i,
                interceptions: /interceptions?:?\s*(\d+)/i
            };

            Object.entries(statPatterns).forEach(([stat, pattern]) => {
                const match = textContent.match(pattern);
                if (match && !stats[stat]) {
                    stats[stat] = this.parseNumericValue(match[1]);
                }
            });

        } catch (error) {
            logger.error('Error parsing MaxPreps stats:', error.message);
        }

        return stats;
    }

    // Helper method to parse numeric values from strings
    parseNumericValue(value) {
        if (!value) return 0;

        // Remove commas and extract numbers
        const cleaned = value.toString().replace(/,/g, '');
        const match = cleaned.match(/(\d+(?:\.\d+)?)/);

        return match ? parseFloat(match[1]) : 0;
    }

    // Scrape HUDL for video highlights and performance data
    async scrapeHUDLAthlete(athleteName) {
        try {
            const searchUrls = [
                `${this.sources.hudl.baseUrl}/search?q=${encodeURIComponent(athleteName)}&type=athletes`,
                `${this.sources.hudl.baseUrl}/search/athletes?q=${encodeURIComponent(athleteName)}`,
                `${this.sources.hudl.baseUrl}/athletes?q=${encodeURIComponent(athleteName)}`,
                `${this.sources.hudl.baseUrl}/search?query=${encodeURIComponent(athleteName)}&filters=sport:football`
            ];

            let highlights = [];
            let athleteData = [];
            let response = null;

            for (const url of searchUrls) {
                try {
                    response = await this.makeRequest(url, 'hudl');
                    break;
                } catch (error) {
                    logger.debug(`HUDL search URL failed: ${url}`);
                    continue;
                }
            }

            if (!response) {
                logger.warn(`All HUDL search URLs failed for athlete: ${athleteName}`);
                return { highlights: [], athleteData: [] };
            }

            const $ = cheerio.load(response.data);

            // Extract video highlights
            const highlightSelectors = [
                '.highlight-card',
                '.video-card',
                '.media-card',
                '[data-type="highlight"]',
                '.highlight'
            ];

            for (const selector of highlightSelectors) {
                $(selector).each((index, element) => {
                    const highlight = this.parseHUDLHighlight($, element);
                    if (highlight) {
                        highlights.push(highlight);
                    }
                });
            }

            // Extract athlete profile data
            const athleteSelectors = [
                '.athlete-profile',
                '.player-card',
                '.athlete-card',
                '[data-type="athlete"]'
            ];

            for (const selector of athleteSelectors) {
                $(selector).each((index, element) => {
                    const athlete = this.parseHUDLAthlete($, element);
                    if (athlete) {
                        athleteData.push(athlete);
                    }
                });
            }

            // If no structured data found, try to extract from links
            if (highlights.length === 0) {
                $('a[href*="/highlight/"], a[href*="/video/"]').each((index, element) => {
                    const href = $(element).attr('href');
                    const title = $(element).text().trim() || $(element).attr('title') || 'Untitled Highlight';

                    if (href && title) {
                        highlights.push({
                            title,
                            url: href.startsWith('http') ? href : `${this.sources.hudl.baseUrl}${href}`,
                            platform: 'hudl',
                            uploadedAt: new Date(),
                            views: 0,
                            duration: '00:00',
                            sport: 'football',
                            source: 'hudl',
                            scrapedAt: new Date(),
                            confidence: 'medium'
                        });
                    }
                });
            }

            logger.info(`HUDL scraping completed for ${athleteName}: ${highlights.length} highlights, ${athleteData.length} profiles`);
            return { highlights, athleteData };

        } catch (error) {
            logger.error('HUDL scraping error:', error.message);
            return { highlights: [], athleteData: [] };
        }
    }

    // Parse HUDL highlight data
    parseHUDLHighlight($, element) {
        try {
            const highlight = {
                platform: 'hudl',
                source: 'hudl',
                scrapedAt: new Date(),
                confidence: 'high'
            };

            // Extract title
            const titleSelectors = ['.highlight-title', '.video-title', '.title', 'h3', 'h4'];
            for (const selector of titleSelectors) {
                const title = $(element).find(selector).first().text().trim();
                if (title) {
                    highlight.title = title;
                    break;
                }
            }

            // Extract URL
            const urlSelectors = ['a', '.video-link', '.highlight-link'];
            for (const selector of urlSelectors) {
                const href = $(element).find(selector).first().attr('href');
                if (href) {
                    highlight.url = href.startsWith('http') ? href : `${this.sources.hudl.baseUrl}${href}`;
                    break;
                }
            }

            // Extract thumbnail
            const thumbnailSelectors = ['img', '.thumbnail', '.video-thumbnail'];
            for (const selector of thumbnailSelectors) {
                const src = $(element).find(selector).first().attr('src') || $(element).find(selector).first().attr('data-src');
                if (src) {
                    highlight.thumbnail = src.startsWith('http') ? src : `${this.sources.hudl.baseUrl}${src}`;
                    break;
                }
            }

            // Extract views
            const viewSelectors = ['.views', '.view-count', '.plays'];
            for (const selector of viewSelectors) {
                const views = $(element).find(selector).first().text().trim();
                if (views) {
                    highlight.views = this.parseNumericValue(views);
                    break;
                }
            }

            // Extract duration
            const durationSelectors = ['.duration', '.length', '.time'];
            for (const selector of durationSelectors) {
                const duration = $(element).find(selector).first().text().trim();
                if (duration) {
                    highlight.duration = duration;
                    break;
                }
            }

            // Extract upload date
            const dateSelectors = ['.upload-date', '.date', '.uploaded', '[datetime]'];
            for (const selector of dateSelectors) {
                const dateStr = $(element).find(selector).first().attr('datetime') ||
                               $(element).find(selector).first().text().trim();
                if (dateStr) {
                    highlight.uploadedAt = new Date(dateStr) || new Date();
                    break;
                }
            }

            return highlight;
        } catch (error) {
            logger.error('Error parsing HUDL highlight:', error.message);
            return null;
        }
    }

    // Parse HUDL athlete data
    parseHUDLAthlete($, element) {
        try {
            const athlete = {
                source: 'hudl',
                scrapedAt: new Date(),
                confidence: 'high'
            };

            // Extract name
            const nameSelectors = ['.athlete-name', '.player-name', '.name', 'h2', 'h3'];
            for (const selector of nameSelectors) {
                const name = $(element).find(selector).first().text().trim();
                if (name) {
                    athlete.name = name;
                    break;
                }
            }

            // Extract school/team
            const schoolSelectors = ['.school', '.team', '.institution', '.organization'];
            for (const selector of schoolSelectors) {
                const school = $(element).find(selector).first().text().trim();
                if (school) {
                    athlete.school = school;
                    break;
                }
            }

            // Extract position
            const positionSelectors = ['.position', '.pos', '.role'];
            for (const selector of positionSelectors) {
                const position = $(element).find(selector).first().text().trim();
                if (position) {
                    athlete.position = position;
                    break;
                }
            }

            // Extract profile URL
            const profileLink = $(element).find('a').first().attr('href');
            if (profileLink) {
                athlete.profileUrl = profileLink.startsWith('http') ? profileLink : `${this.sources.hudl.baseUrl}${profileLink}`;
            }

            return athlete;
        } catch (error) {
            logger.error('Error parsing HUDL athlete:', error.message);
            return null;
        }
    }

    // Scrape Athletic.net for track and field data
    async scrapeAthleticNetAthlete(athleteName, state = 'TX') {
        try {
            const searchUrls = [
                `${this.sources.athleticNet.baseUrl}/Search.aspx?query=${encodeURIComponent(athleteName)}&state=${state}`,
                `${this.sources.athleticNet.baseUrl}/Search.aspx?q=${encodeURIComponent(athleteName)}&state=${state}`,
                `${this.sources.athleticNet.baseUrl}/athletes/search?q=${encodeURIComponent(athleteName)}&state=${state}`,
                `${this.sources.athleticNet.baseUrl}/Search/?q=${encodeURIComponent(athleteName)}&state=${state}`
            ];

            let trackData = [];
            let response = null;

            for (const url of searchUrls) {
                try {
                    response = await this.makeRequest(url, 'athleticNet');
                    break;
                } catch (error) {
                    logger.debug(`Athletic.net search URL failed: ${url}`);
                    continue;
                }
            }

            if (!response) {
                logger.warn(`All Athletic.net search URLs failed for athlete: ${athleteName}`);
                return [];
            }

            const $ = cheerio.load(response.data);

            // Extract athlete results
            const athleteSelectors = [
                '.athlete-result',
                '.search-result',
                '.athlete-card',
                '[data-type="athlete"]',
                '.result-item'
            ];

            for (const selector of athleteSelectors) {
                $(selector).each((index, element) => {
                    const athlete = this.parseAthleticNetAthlete($, element);
                    if (athlete) {
                        trackData.push(athlete);
                    }
                });
            }

            // If no structured data found, try to extract from links
            if (trackData.length === 0) {
                $('a[href*="/athletes/"], a[href*="/track/"]').each((index, element) => {
                    const href = $(element).attr('href');
                    const text = $(element).text().trim();

                    if (href && text && text.toLowerCase().includes(athleteName.toLowerCase())) {
                        trackData.push({
                            name: text,
                            profileUrl: href.startsWith('http') ? href : `${this.sources.athleticNet.baseUrl}${href}`,
                            source: 'athletic.net',
                            scrapedAt: new Date(),
                            confidence: 'medium',
                            events: [],
                            prs: {}
                        });
                    }
                });
            }

            logger.info(`Athletic.net scraping completed for ${athleteName}: found ${trackData.length} results`);
            return trackData;

        } catch (error) {
            logger.error('Athletic.net scraping error:', error.message);
            return [];
        }
    }

    // Parse Athletic.net athlete data
    parseAthleticNetAthlete($, element) {
        try {
            const athlete = {
                source: 'athletic.net',
                scrapedAt: new Date(),
                confidence: 'high',
                events: [],
                prs: {}
            };

            // Extract name
            const nameSelectors = ['.name', '.athlete-name', '.player-name', 'h3', 'h4'];
            for (const selector of nameSelectors) {
                const name = $(element).find(selector).first().text().trim();
                if (name) {
                    athlete.name = name;
                    break;
                }
            }

            // Extract school
            const schoolSelectors = ['.school', '.team', '.institution'];
            for (const selector of schoolSelectors) {
                const school = $(element).find(selector).first().text().trim();
                if (school) {
                    athlete.school = school;
                    break;
                }
            }

            // Extract grade/year
            const gradeSelectors = ['.grade', '.year', '.class'];
            for (const selector of gradeSelectors) {
                const grade = $(element).find(selector).first().text().trim();
                if (grade) {
                    athlete.grade = grade;
                    break;
                }
            }

            // Extract events and times
            const eventSelectors = ['.event', '.performance', '.result'];
            $(element).find(eventSelectors.join(', ')).each((index, event) => {
                const eventData = this.parseAthleticNetEvent($, event);
                if (eventData) {
                    athlete.events.push(eventData);

                    // Store PRs
                    if (eventData.isPR && eventData.time) {
                        athlete.prs[eventData.event] = eventData.time;
                    }
                }
            });

            // Extract profile URL
            const profileLink = $(element).find('a').first().attr('href');
            if (profileLink) {
                athlete.profileUrl = profileLink.startsWith('http') ? profileLink : `${this.sources.athleticNet.baseUrl}${profileLink}`;
            }

            return athlete;
        } catch (error) {
            logger.error('Error parsing Athletic.net athlete:', error.message);
            return null;
        }
    }

    // Parse Athletic.net event data
    parseAthleticNetEvent($, element) {
        try {
            const event = {};

            // Extract event name
            const eventNameSelectors = ['.event-name', '.event-title', '.discipline'];
            for (const selector of eventNameSelectors) {
                const name = $(element).find(selector).first().text().trim();
                if (name) {
                    event.event = name;
                    break;
                }
            }

            // Extract time/distance
            const timeSelectors = ['.time', '.result', '.performance', '.mark'];
            for (const selector of timeSelectors) {
                const time = $(element).find(selector).first().text().trim();
                if (time) {
                    event.time = time;
                    break;
                }
            }

            // Extract date
            const dateSelectors = ['.date', '.meet-date', '.when'];
            for (const selector of dateSelectors) {
                const date = $(element).find(selector).first().text().trim();
                if (date) {
                    event.date = date;
                    break;
                }
            }

            // Extract meet name
            const meetSelectors = ['.meet', '.competition', '.venue'];
            for (const selector of meetSelectors) {
                const meet = $(element).find(selector).first().text().trim();
                if (meet) {
                    event.meet = meet;
                    break;
                }
            }

            // Check if it's a PR
            const prIndicators = ['.pr', '.personal-best', '.pb'];
            event.isPR = prIndicators.some(indicator => $(element).find(indicator).length > 0) ||
                         $(element).text().toLowerCase().includes('pr') ||
                         $(element).text().toLowerCase().includes('personal best');

            return event;
        } catch (error) {
            logger.error('Error parsing Athletic.net event:', error.message);
            return null;
        }
    }

    // Scrape ESPN for professional rankings and stats
    async scrapeESPNAthlete(athleteName, sport = 'football') {
        try {
            const searchUrls = [
                `${this.sources.espn.baseUrl}/search/_/q/${encodeURIComponent(athleteName)}`,
                `${this.sources.espn.baseUrl}/search/?query=${encodeURIComponent(athleteName)}&type=player`,
                `${this.sources.espn.baseUrl}/players/search?q=${encodeURIComponent(athleteName)}`
            ];

            let espnData = [];
            let response = null;

            for (const url of searchUrls) {
                try {
                    response = await this.makeRequest(url, 'espn');
                    break;
                } catch (error) {
                    logger.debug(`ESPN search URL failed: ${url}`);
                    continue;
                }
            }

            if (!response) {
                logger.warn(`All ESPN search URLs failed for athlete: ${athleteName}`);
                return [];
            }

            const $ = cheerio.load(response.data);

            // Extract player results
            const playerSelectors = [
                '.search-results .player',
                '.player-result',
                '.athlete-card',
                '[data-type="player"]',
                '.search-item.player'
            ];

            for (const selector of playerSelectors) {
                $(selector).each((index, element) => {
                    const player = this.parseESPNPlayer($, element);
                    if (player) {
                        espnData.push(player);
                    }
                });
            }

            // If no structured data found, try to extract from search results
            if (espnData.length === 0) {
                $('a[href*="/player/"], a[href*="/athletes/"]').each((index, element) => {
                    const href = $(element).attr('href');
                    const text = $(element).text().trim();

                    if (href && text && text.toLowerCase().includes(athleteName.toLowerCase())) {
                        espnData.push({
                            name: text,
                            profileUrl: href.startsWith('http') ? href : `${this.sources.espn.baseUrl}${href}`,
                            source: 'espn',
                            scrapedAt: new Date(),
                            confidence: 'medium',
                            stats: {},
                            rankings: {}
                        });
                    }
                });
            }

            logger.info(`ESPN scraping completed for ${athleteName}: found ${espnData.length} results`);
            return espnData;

        } catch (error) {
            logger.error('ESPN scraping error:', error.message);
            return [];
        }
    }

    // Parse ESPN player data
    parseESPNPlayer($, element) {
        try {
            const player = {
                source: 'espn',
                scrapedAt: new Date(),
                confidence: 'high',
                stats: {},
                rankings: {}
            };

            // Extract name
            const nameSelectors = ['.player-name', '.name', '.athlete-name', 'h3', 'h4'];
            for (const selector of nameSelectors) {
                const name = $(element).find(selector).first().text().trim();
                if (name) {
                    player.name = name;
                    break;
                }
            }

            // Extract team
            const teamSelectors = ['.team-name', '.team', '.club', '.organization'];
            for (const selector of teamSelectors) {
                const team = $(element).find(selector).first().text().trim();
                if (team) {
                    player.team = team;
                    break;
                }
            }

            // Extract position
            const positionSelectors = ['.position', '.pos', '.role'];
            for (const selector of positionSelectors) {
                const position = $(element).find(selector).first().text().trim();
                if (position) {
                    player.position = position;
                    break;
                }
            }

            // Extract stats
            const statSelectors = ['.stat', '.statistic', '.performance'];
            $(element).find(statSelectors.join(', ')).each((index, stat) => {
                const statData = this.parseESPNStat($, stat);
                if (statData) {
                    player.stats[statData.label] = statData.value;
                }
            });

            // Extract rankings
            const rankingSelectors = ['.ranking', '.rank', '.rating'];
            $(element).find(rankingSelectors.join(', ')).each((index, ranking) => {
                const rankingData = this.parseESPNRanking($, ranking);
                if (rankingData) {
                    player.rankings[rankingData.type] = rankingData.value;
                }
            });

            // Extract profile URL
            const profileLink = $(element).find('a').first().attr('href');
            if (profileLink) {
                player.profileUrl = profileLink.startsWith('http') ? profileLink : `${this.sources.espn.baseUrl}${profileLink}`;
            }

            return player;
        } catch (error) {
            logger.error('Error parsing ESPN player:', error.message);
            return null;
        }
    }

    // Parse ESPN stat data
    parseESPNStat($, element) {
        try {
            const label = $(element).find('.label, .name, .stat-label').first().text().trim().toLowerCase();
            const value = $(element).find('.value, .number, .stat-value').first().text().trim();

            if (!label || !value) return null;

            let parsedValue = this.parseNumericValue(value);

            // Convert specific stats
            if (label.includes('passing') || label.includes('pass')) {
                return { label: 'passingYards', value: parsedValue };
            }
            if (label.includes('rushing') || label.includes('rush')) {
                return { label: 'rushingYards', value: parsedValue };
            }
            if (label.includes('receiving') || label.includes('recept')) {
                return { label: 'receivingYards', value: parsedValue };
            }
            if (label.includes('touchdown') || label.includes('td')) {
                return { label: 'touchdowns', value: parsedValue };
            }
            if (label.includes('tackle')) {
                return { label: 'tackles', value: parsedValue };
            }
            if (label.includes('sack')) {
                return { label: 'sacks', value: parsedValue };
            }
            if (label.includes('interception') || label.includes('int')) {
                return { label: 'interceptions', value: parsedValue };
            }

            return { label, value: parsedValue };
        } catch (error) {
            logger.error('Error parsing ESPN stat:', error.message);
            return null;
        }
    }

    // Parse ESPN ranking data
    parseESPNRanking($, element) {
        try {
            const type = $(element).find('.type, .category').first().text().trim().toLowerCase();
            const value = $(element).find('.value, .rank, .rating').first().text().trim();

            if (!type || !value) return null;

            return {
                type: type.replace(/\s+/g, '_'),
                value: this.parseNumericValue(value)
            };
        } catch (error) {
            logger.error('Error parsing ESPN ranking:', error.message);
            return null;
        }
    }

    // Scrape 247Sports for recruiting data
    async scrape247SportsAthlete(athleteName, year = new Date().getFullYear()) {
        try {
            const searchUrls = [
                `${this.sources.rivals247.baseUrl}/Search/?q=${encodeURIComponent(athleteName)}&year=${year}`,
                `${this.sources.rivals247.baseUrl}/players/search?q=${encodeURIComponent(athleteName)}&year=${year}`,
                `${this.sources.rivals247.baseUrl}/search/?query=${encodeURIComponent(athleteName)}&year=${year}`,
                `${this.sources.rivals247.baseUrl}/PlayerSearch.aspx?q=${encodeURIComponent(athleteName)}&year=${year}`
            ];

            let recruitingData = [];
            let response = null;

            for (const url of searchUrls) {
                try {
                    response = await this.makeRequest(url, 'rivals247');
                    break;
                } catch (error) {
                    logger.debug(`247Sports search URL failed: ${url}`);
                    continue;
                }
            }

            if (!response) {
                logger.warn(`All 247Sports search URLs failed for athlete: ${athleteName}`);
                return [];
            }

            const $ = cheerio.load(response.data);

            // Extract recruit results
            const recruitSelectors = [
                '.recruit',
                '.player-card',
                '.athlete-card',
                '[data-type="recruit"]',
                '.search-result'
            ];

            for (const selector of recruitSelectors) {
                $(selector).each((index, element) => {
                    const recruit = this.parse247SportsRecruit($, element);
                    if (recruit) {
                        recruitingData.push(recruit);
                    }
                });
            }

            // If no structured data found, try to extract from links
            if (recruitingData.length === 0) {
                $('a[href*="/player/"], a[href*="/recruit/"]').each((index, element) => {
                    const href = $(element).attr('href');
                    const text = $(element).text().trim();

                    if (href && text && text.toLowerCase().includes(athleteName.toLowerCase())) {
                        recruitingData.push({
                            name: text,
                            profileUrl: href.startsWith('http') ? href : `${this.sources.rivals247.baseUrl}${href}`,
                            source: '247sports',
                            scrapedAt: new Date(),
                            confidence: 'medium',
                            rating: 0,
                            stars: 0,
                            ranking: 0,
                            offers: 0
                        });
                    }
                });
            }

            logger.info(`247Sports scraping completed for ${athleteName}: found ${recruitingData.length} results`);
            return recruitingData;

        } catch (error) {
            logger.error('247Sports scraping error:', error.message);
            return [];
        }
    }

    // Parse 247Sports recruit data
    parse247SportsRecruit($, element) {
        try {
            const recruit = {
                source: '247sports',
                scrapedAt: new Date(),
                confidence: 'high'
            };

            // Extract name
            const nameSelectors = ['.name', '.player-name', '.athlete-name', 'h3', 'h4'];
            for (const selector of nameSelectors) {
                const name = $(element).find(selector).first().text().trim();
                if (name) {
                    recruit.name = name;
                    break;
                }
            }

            // Extract school
            const schoolSelectors = ['.school', '.high-school', '.institution'];
            for (const selector of schoolSelectors) {
                const school = $(element).find(selector).first().text().trim();
                if (school) {
                    recruit.school = school;
                    break;
                }
            }

            // Extract position
            const positionSelectors = ['.position', '.pos', '.role'];
            for (const selector of positionSelectors) {
                const position = $(element).find(selector).first().text().trim();
                if (position) {
                    recruit.position = position;
                    break;
                }
            }

            // Extract rating
            const ratingSelectors = ['.rating', '.score', '.composite-rating'];
            for (const selector of ratingSelectors) {
                const rating = $(element).find(selector).first().text().trim();
                if (rating) {
                    recruit.rating = this.parseNumericValue(rating);
                    break;
                }
            }

            // Extract stars
            const starElements = $(element).find('.stars .star, .star-rating .star');
            recruit.stars = starElements.length;

            // If no star elements found, try to extract from text
            if (recruit.stars === 0) {
                const starText = $(element).find('.stars, .star-rating').first().text().trim();
                const starMatch = starText.match(/(\d+)\s*star/i);
                if (starMatch) {
                    recruit.stars = parseInt(starMatch[1]);
                }
            }

            // Extract ranking
            const rankingSelectors = ['.ranking', '.rank', '.national-rank'];
            for (const selector of rankingSelectors) {
                const ranking = $(element).find(selector).first().text().trim();
                if (ranking) {
                    recruit.ranking = this.parseNumericValue(ranking);
                    break;
                }
            }

            // Extract offers
            const offerSelectors = ['.offers', '.offer-count', '.scholarships'];
            for (const selector of offerSelectors) {
                const offers = $(element).find(selector).first().text().trim();
                if (offers) {
                    recruit.offers = this.parseNumericValue(offers);
                    break;
                }
            }

            // Extract height
            const heightSelectors = ['.height', '.ht'];
            for (const selector of heightSelectors) {
                const height = $(element).find(selector).first().text().trim();
                if (height) {
                    recruit.height = height;
                    break;
                }
            }

            // Extract weight
            const weightSelectors = ['.weight', '.wt'];
            for (const selector of weightSelectors) {
                const weight = $(element).find(selector).first().text().trim();
                if (weight) {
                    recruit.weight = this.parseNumericValue(weight);
                    break;
                }
            }

            // Extract profile URL
            const profileLink = $(element).find('a').first().attr('href');
            if (profileLink) {
                recruit.profileUrl = profileLink.startsWith('http') ? profileLink : `${this.sources.rivals247.baseUrl}${profileLink}`;
            }

            return recruit;
        } catch (error) {
            logger.error('Error parsing 247Sports recruit:', error.message);
            return null;
        }
    }

    // Comprehensive athlete data collection
    async collectAthleteData(athleteName, options = {}) {
        const {
            state = 'TX',
            sport = 'football',
            year = new Date().getFullYear()
        } = options;

        logger.info(`Collecting comprehensive data for athlete: ${athleteName}`);

        const results = {
            athlete: athleteName,
            collectedAt: new Date(),
            sources: {},
            combinedData: {
                name: athleteName,
                sport: sport,
                stats: {},
                highlights: [],
                recruitingData: {},
                trackData: [],
                rankings: {},
                metadata: {
                    sourcesUsed: [],
                    dataQuality: 0,
                    lastUpdated: new Date()
                }
            }
        };

        try {
            // Collect from all sources concurrently
            const [
                maxprepsData,
                hudlData,
                athleticData,
                espnData,
                recruitingData
            ] = await Promise.allSettled([
                this.scrapeMaxPrepsAthlete(athleteName, state),
                this.scrapeHUDLAthlete(athleteName),
                this.scrapeAthleticNetAthlete(athleteName, state),
                this.scrapeESPNAthlete(athleteName, sport),
                this.scrape247SportsAthlete(athleteName, year)
            ]);

            // Process results
            results.sources.maxpreps = maxprepsData.status === 'fulfilled' ? maxprepsData.value : [];
            results.sources.hudl = hudlData.status === 'fulfilled' ? hudlData.value : { highlights: [], athleteData: [] };
            results.sources.athleticNet = athleticData.status === 'fulfilled' ? athleticData.value : [];
            results.sources.espn = espnData.status === 'fulfilled' ? espnData.value : [];
            results.sources.rivals247 = recruitingData.status === 'fulfilled' ? recruitingData.value : [];

            // Combine data from all sources
            this.combineAthleteData(results);

            // Calculate data quality score
            results.combinedData.metadata.dataQuality = this.calculateDataQuality(results);
            results.combinedData.metadata.sourcesUsed = Object.keys(results.sources).filter(
                source => {
                    const data = results.sources[source];
                    if (Array.isArray(data)) return data.length > 0;
                    if (typeof data === 'object' && data !== null) {
                        return Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0);
                    }
                    return false;
                }
            );

            logger.info(`Successfully collected data for ${athleteName} from ${results.combinedData.metadata.sourcesUsed.length} sources`);
            return results;

        } catch (error) {
            logger.error(`Error collecting data for ${athleteName}:`, error.message);
            return results;
        }
    }

    // Enhanced data combination
    combineAthleteData(results) {
        const combined = results.combinedData;

        // Combine stats from different sources with priority weighting
        const sourcePriority = {
            maxpreps: 1.0,    // High school data is most relevant
            espn: 0.9,        // Professional data is very reliable
            '247sports': 0.8, // Recruiting data is good
            'athletic.net': 0.7, // Track data is specialized
            hudl: 0.6        // Video data is supplementary
        };

        Object.entries(results.sources).forEach(([sourceName, sourceData]) => {
            const priority = sourcePriority[sourceName] || 0.5;

            if (Array.isArray(sourceData)) {
                sourceData.forEach(item => {
                    // Combine stats
                    if (item.stats) {
                        this.mergeStats(combined.stats, item.stats, priority);
                    }

                    // Combine highlights
                    if (item.highlights) {
                        combined.highlights.push(...item.highlights);
                    }

                    // Combine recruiting data
                    if (item.rating || item.stars || item.offers) {
                        this.mergeRecruitingData(combined.recruitingData, item, priority);
                    }

                    // Combine track data
                    if (item.events) {
                        combined.trackData.push(...item.events);
                    }
                });
            } else if (sourceData && typeof sourceData === 'object') {
                // Handle HUDL structure
                if (sourceData.highlights) {
                    combined.highlights.push(...sourceData.highlights);
                }
                if (sourceData.athleteData) {
                    sourceData.athleteData.forEach(athlete => {
                        if (athlete.stats) {
                            this.mergeStats(combined.stats, athlete.stats, priority);
                        }
                    });
                }
            }
        });

        // Remove duplicate highlights
        combined.highlights = this.deduplicateHighlights(combined.highlights);

        // Sort highlights by views (most popular first)
        combined.highlights.sort((a, b) => (b.views || 0) - (a.views || 0));

        // Limit highlights to top 10
        combined.highlights = combined.highlights.slice(0, 10);
    }

    // Merge stats with priority weighting
    mergeStats(targetStats, sourceStats, priority) {
        Object.entries(sourceStats).forEach(([stat, value]) => {
            if (typeof value === 'number' && value > 0) {
                if (!targetStats[stat]) {
                    targetStats[stat] = value * priority;
                } else {
                    // Weighted average
                    targetStats[stat] = (targetStats[stat] + value * priority) / (1 + priority);
                }
            }
        });
    }

    // Merge recruiting data
    mergeRecruitingData(targetData, sourceData, priority) {
        const fields = ['rating', 'stars', 'ranking', 'offers'];

        fields.forEach(field => {
            if (sourceData[field] !== undefined && sourceData[field] !== null) {
                if (!targetData[field]) {
                    targetData[field] = sourceData[field] * priority;
                } else {
                    // Use higher priority data
                    if (priority > 0.7) { // Prefer high-priority sources
                        targetData[field] = sourceData[field];
                    }
                }
            }
        });

        // Store source information
        if (!targetData.sources) targetData.sources = [];
        targetData.sources.push({
            name: sourceData.source,
            priority,
            data: sourceData
        });
    }

    // Remove duplicate highlights
    deduplicateHighlights(highlights) {
        const seen = new Set();
        return highlights.filter(highlight => {
            const key = `${highlight.title}_${highlight.url}`.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Calculate overall data quality score
    calculateDataQuality(results) {
        let qualityScore = 0;
        const sources = results.sources;

        // Source diversity (up to 30 points)
        const activeSources = Object.values(sources).filter(data => {
            if (Array.isArray(data)) return data.length > 0;
            if (typeof data === 'object' && data !== null) {
                return Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0);
            }
            return false;
        }).length;
        qualityScore += Math.min(activeSources * 6, 30);

        // Data completeness (up to 40 points)
        const combined = results.combinedData;
        if (Object.keys(combined.stats).length > 0) qualityScore += 15;
        if (combined.highlights.length > 0) qualityScore += 10;
        if (Object.keys(combined.recruitingData).length > 0) qualityScore += 10;
        if (combined.trackData.length > 0) qualityScore += 5;

        // Data recency (up to 30 points)
        const now = new Date();
        let recencyScore = 0;
        Object.values(sources).forEach(data => {
            if (Array.isArray(data) && data.length > 0) {
                const latestData = data[0];
                if (latestData.scrapedAt) {
                    const hoursSince = (now - new Date(latestData.scrapedAt)) / (1000 * 60 * 60);
                    if (hoursSince < 24) recencyScore += 10;
                    else if (hoursSince < 168) recencyScore += 5; // 1 week
                }
            }
        });
        qualityScore += Math.min(recencyScore, 30);

        return Math.min(qualityScore, 100);
    }
}

module.exports = DataScrapingService;
