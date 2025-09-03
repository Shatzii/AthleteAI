const { logger } = require('../utils/logger');

// Data validation and caching service
class DataValidationService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.validationRules = {
            athlete: {
                name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
                sport: { required: true, type: 'string', enum: ['football', 'basketball', 'baseball', 'soccer', 'track', 'other'] },
                position: { required: false, type: 'string', maxLength: 50 },
                school: { required: false, type: 'string', maxLength: 100 },
                year: { required: false, type: 'string', pattern: /^\d{4}$/ },
                stats: { required: false, type: 'object' }
            },
            stats: {
                passingYards: { type: 'number', min: 0, max: 10000 },
                rushingYards: { type: 'number', min: 0, max: 10000 },
                receivingYards: { type: 'number', min: 0, max: 10000 },
                touchdowns: { type: 'number', min: 0, max: 100 },
                tackles: { type: 'number', min: 0, max: 500 },
                sacks: { type: 'number', min: 0, max: 50 },
                interceptions: { type: 'number', min: 0, max: 20 },
                // Track and field
                time_100m: { type: 'string', pattern: /^\d{1,2}:\d{2}\.\d{2}$/ },
                time_200m: { type: 'string', pattern: /^\d{1,2}:\d{2}\.\d{2}$/ },
                time_400m: { type: 'string', pattern: /^\d{1,2}:\d{2}\.\d{2}$/ },
                longJump: { type: 'number', min: 0, max: 30 },
                highJump: { type: 'number', min: 0, max: 10 }
            },
            highlights: {
                title: { required: true, type: 'string', minLength: 1, maxLength: 200 },
                url: { required: true, type: 'string', pattern: /^https?:\/\/.+/ },
                duration: { required: false, type: 'string', pattern: /^\d{1,2}:\d{2}$/ },
                views: { type: 'number', min: 0 },
                platform: { type: 'string', enum: ['hudl', 'youtube', 'twitter', 'instagram'] }
            }
        };
    }

    // Validate athlete data
    validateAthleteData(data) {
        const errors = [];
        const warnings = [];

        // Validate basic athlete info
        const athleteValidation = this.validateObject(data, this.validationRules.athlete);
        errors.push(...athleteValidation.errors);
        warnings.push(...athleteValidation.warnings);

        // Validate stats if present
        if (data.stats) {
            const statsValidation = this.validateStats(data.stats);
            errors.push(...statsValidation.errors);
            warnings.push(...statsValidation.warnings);
        }

        // Validate highlights if present
        if (data.highlights && Array.isArray(data.highlights)) {
            data.highlights.forEach((highlight, index) => {
                const highlightValidation = this.validateObject(highlight, this.validationRules.highlights);
                highlightValidation.errors.forEach(error => {
                    errors.push(`Highlight ${index + 1}: ${error}`);
                });
                highlightValidation.warnings.forEach(warning => {
                    warnings.push(`Highlight ${index + 1}: ${warning}`);
                });
            });
        }

        // Additional business logic validations
        if (data.sport === 'football' && !data.position) {
            warnings.push('Football athletes should have a position specified');
        }

        if (data.stats && data.sport === 'track') {
            const hasTrackStats = Object.keys(data.stats).some(key =>
                key.includes('time_') || key.includes('jump') || key.includes('throw')
            );
            if (!hasTrackStats) {
                warnings.push('Track athletes should have timing or field event stats');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            data: this.sanitizeData(data)
        };
    }

    // Validate stats object
    validateStats(stats) {
        const errors = [];
        const warnings = [];

        for (const [key, value] of Object.entries(stats)) {
            const rule = this.validationRules.stats[key];
            if (!rule) {
                warnings.push(`Unknown stat: ${key}`);
                continue;
            }

            // Type validation
            if (rule.type === 'number' && typeof value !== 'number') {
                errors.push(`${key} must be a number`);
                continue;
            }

            if (rule.type === 'string' && typeof value !== 'string') {
                errors.push(`${key} must be a string`);
                continue;
            }

            // Range validation for numbers
            if (rule.type === 'number') {
                if (rule.min !== undefined && value < rule.min) {
                    errors.push(`${key} cannot be less than ${rule.min}`);
                }
                if (rule.max !== undefined && value > rule.max) {
                    errors.push(`${key} cannot be greater than ${rule.max}`);
                }
            }

            // Pattern validation for strings
            if (rule.type === 'string' && rule.pattern) {
                if (!rule.pattern.test(value)) {
                    errors.push(`${key} format is invalid`);
                }
            }
        }

        return { errors, warnings };
    }

    // Validate object against rules
    validateObject(data, rules) {
        const errors = [];
        const warnings = [];

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];

            // Required field validation
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }

            // Skip validation if field is not present and not required
            if (value === undefined || value === null) continue;

            // Type validation
            if (rule.type && typeof value !== rule.type) {
                errors.push(`${field} must be of type ${rule.type}`);
                continue;
            }

            // String length validation
            if (rule.type === 'string') {
                if (rule.minLength && value.length < rule.minLength) {
                    errors.push(`${field} must be at least ${rule.minLength} characters`);
                }
                if (rule.maxLength && value.length > rule.maxLength) {
                    errors.push(`${field} must be no more than ${rule.maxLength} characters`);
                }
            }

            // Number range validation
            if (rule.type === 'number') {
                if (rule.min !== undefined && value < rule.min) {
                    errors.push(`${field} must be at least ${rule.min}`);
                }
                if (rule.max !== undefined && value > rule.max) {
                    errors.push(`${field} must be no more than ${rule.max}`);
                }
            }

            // Enum validation
            if (rule.enum && !rule.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
            }

            // Pattern validation
            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${field} format is invalid`);
            }
        }

        return { errors, warnings };
    }

    // Sanitize data to remove malicious content and normalize values
    sanitizeData(data) {
        const sanitized = { ...data };

        // Sanitize strings
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'string') {
                // Remove HTML tags and trim whitespace
                sanitized[key] = sanitized[key].replace(/<[^>]*>/g, '').trim();
                // Limit length to prevent abuse
                if (sanitized[key].length > 1000) {
                    sanitized[key] = sanitized[key].substring(0, 1000) + '...';
                }
            }
        });

        // Sanitize nested objects
        if (sanitized.stats) {
            sanitized.stats = this.sanitizeStats(sanitized.stats);
        }

        if (sanitized.highlights && Array.isArray(sanitized.highlights)) {
            sanitized.highlights = sanitized.highlights.map(highlight => ({
                ...highlight,
                title: highlight.title ? highlight.title.replace(/<[^>]*>/g, '').trim() : '',
                url: highlight.url ? highlight.url.trim() : ''
            }));
        }

        return sanitized;
    }

    // Sanitize stats
    sanitizeStats(stats) {
        const sanitized = {};

        for (const [key, value] of Object.entries(stats)) {
            if (typeof value === 'number') {
                // Ensure positive numbers and reasonable bounds
                sanitized[key] = Math.max(0, Math.min(value, 100000));
            } else if (typeof value === 'string') {
                // Clean string values
                sanitized[key] = value.replace(/[^\w\s.:-]/g, '').trim();
            }
        }

        return sanitized;
    }

    // Cache management
    setCache(key, data, ttl = this.cacheExpiry) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
        logger.debug(`Cached data for key: ${key}`);
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    clearCache(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
        logger.info(`Cleared cache${key ? ` for key: ${key}` : ''}`);
    }

    // Get cache statistics
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                expiredEntries++;
            } else {
                validEntries++;
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            hitRate: validEntries / (validEntries + expiredEntries) || 0
        };
    }

    // Batch validation for multiple athletes
    validateBatchAthletes(athletes) {
        const results = [];

        for (const athlete of athletes) {
            const validation = this.validateAthleteData(athlete);
            results.push({
                athlete: athlete.name || 'Unknown',
                isValid: validation.isValid,
                errors: validation.errors,
                warnings: validation.warnings,
                sanitizedData: validation.data
            });
        }

        const summary = {
            total: results.length,
            valid: results.filter(r => r.isValid).length,
            invalid: results.filter(r => !r.isValid).length,
            totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
            totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
        };

        return { results, summary };
    }

    // Data quality scoring
    calculateDataQualityScore(data) {
        let score = 0;
        let maxScore = 100;

        // Basic info completeness (30 points)
        if (data.name) score += 10;
        if (data.sport) score += 10;
        if (data.position || data.school) score += 10;

        // Stats completeness (40 points)
        if (data.stats) {
            const statFields = Object.keys(data.stats).length;
            score += Math.min(statFields * 10, 40);
        }

        // Highlights quality (20 points)
        if (data.highlights && data.highlights.length > 0) {
            const avgViews = data.highlights.reduce((sum, h) => sum + (h.views || 0), 0) / data.highlights.length;
            if (avgViews > 1000) score += 15;
            else if (avgViews > 100) score += 10;
            else score += 5;
        }

        // Data freshness (10 points)
        if (data.lastUpdated) {
            const daysSinceUpdate = (Date.now() - new Date(data.lastUpdated)) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 7) score += 10;
            else if (daysSinceUpdate < 30) score += 7;
            else if (daysSinceUpdate < 90) score += 4;
        }

        return Math.min(score, maxScore);
    }
}

module.exports = DataValidationService;
