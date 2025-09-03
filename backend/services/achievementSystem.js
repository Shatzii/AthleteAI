const { logger } = require('../utils/logger');

// Achievement and gamification system
class AchievementSystem {
    constructor() {
        this.achievements = {
            // Data collection achievements
            first_scrape: {
                id: 'first_scrape',
                name: 'First Scrape',
                description: 'Successfully scraped data for your first athlete',
                icon: '🔍',
                category: 'data_collection',
                points: 10,
                rarity: 'common'
            },
            data_collector: {
                id: 'data_collector',
                name: 'Data Collector',
                description: 'Collected data from 10 different athletes',
                icon: '📊',
                category: 'data_collection',
                points: 50,
                rarity: 'uncommon',
                requirement: { type: 'count', field: 'athletes_scraped', value: 10 }
            },
            data_master: {
                id: 'data_master',
                name: 'Data Master',
                description: 'Collected comprehensive data from 50 athletes',
                icon: '👑',
                category: 'data_collection',
                points: 200,
                rarity: 'rare',
                requirement: { type: 'count', field: 'athletes_scraped', value: 50 }
            },

            // Ranking achievements
            top_ranker: {
                id: 'top_ranker',
                name: 'Top Ranker',
                description: 'Achieved a GAR score above 95',
                icon: '🥇',
                category: 'ranking',
                points: 25,
                rarity: 'uncommon',
                requirement: { type: 'threshold', field: 'max_gar_score', value: 95 }
            },
            elite_athlete: {
                id: 'elite_athlete',
                name: 'Elite Athlete',
                description: 'Achieved a GAR score above 98',
                icon: '💎',
                category: 'ranking',
                points: 100,
                rarity: 'epic',
                requirement: { type: 'threshold', field: 'max_gar_score', value: 98 }
            },

            // Social achievements
            team_builder: {
                id: 'team_builder',
                name: 'Team Builder',
                description: 'Added 20 athletes to your watchlist',
                icon: '👥',
                category: 'social',
                points: 30,
                rarity: 'uncommon',
                requirement: { type: 'count', field: 'watchlist_count', value: 20 }
            },
            networker: {
                id: 'networker',
                name: 'Networker',
                description: 'Connected with 50 athletes',
                icon: '🤝',
                category: 'social',
                points: 75,
                rarity: 'rare',
                requirement: { type: 'count', field: 'connections_count', value: 50 }
            },

            // Engagement achievements
            early_adopter: {
                id: 'early_adopter',
                name: 'Early Adopter',
                description: 'Used the platform within the first week',
                icon: '🚀',
                category: 'engagement',
                points: 15,
                rarity: 'common',
                requirement: { type: 'date', field: 'first_login', days: 7 }
            },
            dedicated_user: {
                id: 'dedicated_user',
                name: 'Dedicated User',
                description: 'Logged in for 30 consecutive days',
                icon: '📅',
                category: 'engagement',
                points: 60,
                rarity: 'rare',
                requirement: { type: 'streak', field: 'login_streak', value: 30 }
            },

            // Special achievements
            perfect_score: {
                id: 'perfect_score',
                name: 'Perfect Score',
                description: 'Achieved a perfect GAR score of 100',
                icon: '⭐',
                category: 'special',
                points: 500,
                rarity: 'legendary',
                requirement: { type: 'threshold', field: 'max_gar_score', value: 100 }
            },
            data_pioneer: {
                id: 'data_pioneer',
                name: 'Data Pioneer',
                description: 'First to discover and add a new athlete to the system',
                icon: '🗺️',
                category: 'special',
                points: 150,
                rarity: 'epic',
                requirement: { type: 'unique', field: 'first_discovery', value: true }
            }
        };

        this.leaderboards = new Map();
        this.userStats = new Map();
        this.userAchievements = new Map();
    }

    // Initialize user stats
    initializeUserStats(userId) {
        if (!this.userStats.has(userId)) {
            this.userStats.set(userId, {
                athletes_scraped: 0,
                max_gar_score: 0,
                watchlist_count: 0,
                connections_count: 0,
                first_login: new Date(),
                login_streak: 1,
                last_login: new Date(),
                total_points: 0,
                achievements_unlocked: 0,
                data_quality_score: 0,
                ranking_views: 0,
                comparisons_made: 0
            });
        }
        return this.userStats.get(userId);
    }

    // Update user stats
    updateUserStats(userId, updates) {
        const stats = this.initializeUserStats(userId);
        Object.assign(stats, updates);

        // Update login streak
        if (updates.last_login) {
            const daysSinceLastLogin = Math.floor((new Date() - new Date(stats.last_login)) / (1000 * 60 * 60 * 24));
            if (daysSinceLastLogin === 1) {
                stats.login_streak += 1;
            } else if (daysSinceLastLogin > 1) {
                stats.login_streak = 1;
            }
        }

        // Check for new achievements
        const newAchievements = this.checkAchievements(userId);
        if (newAchievements.length > 0) {
            this.unlockAchievements(userId, newAchievements);
        }

        return stats;
    }

    // Check if user qualifies for achievements
    checkAchievements(userId) {
        const stats = this.userStats.get(userId);
        if (!stats) return [];

        const newAchievements = [];

        for (const [achievementId, achievement] of Object.entries(this.achievements)) {
            // Skip if already unlocked
            if (this.userAchievements.get(userId)?.includes(achievementId)) {
                continue;
            }

            if (this.meetsRequirement(stats, achievement.requirement)) {
                newAchievements.push(achievementId);
            }
        }

        return newAchievements;
    }

    // Check if stats meet achievement requirement
    meetsRequirement(stats, requirement) {
        if (!requirement) return false;

        switch (requirement.type) {
            case 'count':
                return stats[requirement.field] >= requirement.value;
            case 'threshold':
                return stats[requirement.field] >= requirement.value;
            case 'date':
                const daysSince = Math.floor((new Date() - new Date(stats[requirement.field])) / (1000 * 60 * 60 * 24));
                return daysSince <= requirement.days;
            case 'streak':
                return stats[requirement.field] >= requirement.value;
            case 'unique':
                return stats[requirement.field] === requirement.value;
            default:
                return false;
        }
    }

    // Unlock achievements for user
    unlockAchievements(userId, achievementIds) {
        if (!this.userAchievements.has(userId)) {
            this.userAchievements.set(userId, []);
        }

        const userAchievements = this.userAchievements.get(userId);
        const stats = this.userStats.get(userId);

        for (const achievementId of achievementIds) {
            if (!userAchievements.includes(achievementId)) {
                userAchievements.push(achievementId);
                const achievement = this.achievements[achievementId];
                stats.total_points += achievement.points;
                stats.achievements_unlocked += 1;

                logger.info(`User ${userId} unlocked achievement: ${achievement.name}`);
            }
        }

        return achievementIds;
    }

    // Get user achievements
    getUserAchievements(userId) {
        const unlockedIds = this.userAchievements.get(userId) || [];
        return unlockedIds.map(id => this.achievements[id]);
    }

    // Get user stats
    getUserStats(userId) {
        return this.userStats.get(userId) || this.initializeUserStats(userId);
    }

    // Update leaderboards
    updateLeaderboards() {
        const users = Array.from(this.userStats.entries());

        // Points leaderboard
        const pointsLeaderboard = users
            .sort(([, a], [, b]) => b.total_points - a.total_points)
            .slice(0, 100)
            .map(([userId, stats]) => ({
                userId,
                points: stats.total_points,
                achievements: stats.achievements_unlocked
            }));

        // GAR score leaderboard
        const garLeaderboard = users
            .filter(([, stats]) => stats.max_gar_score > 0)
            .sort(([, a], [, b]) => b.max_gar_score - a.max_gar_score)
            .slice(0, 100)
            .map(([userId, stats]) => ({
                userId,
                maxGarScore: stats.max_gar_score,
                athletesScraped: stats.athletes_scraped
            }));

        // Data collection leaderboard
        const dataLeaderboard = users
            .sort(([, a], [, b]) => b.athletes_scraped - a.athletes_scraped)
            .slice(0, 100)
            .map(([userId, stats]) => ({
                userId,
                athletesScraped: stats.athletes_scraped,
                dataQualityScore: stats.data_quality_score
            }));

        this.leaderboards.set('points', pointsLeaderboard);
        this.leaderboards.set('gar', garLeaderboard);
        this.leaderboards.set('data', dataLeaderboard);

        logger.info('Updated leaderboards');
    }

    // Get leaderboard
    getLeaderboard(type, limit = 50) {
        const leaderboard = this.leaderboards.get(type);
        return leaderboard ? leaderboard.slice(0, limit) : [];
    }

    // Get user rank in leaderboard
    getUserRank(userId, type) {
        const leaderboard = this.leaderboards.get(type);
        if (!leaderboard) return null;

        const userIndex = leaderboard.findIndex(entry => entry.userId === userId);
        return userIndex >= 0 ? userIndex + 1 : null;
    }

    // Award bonus points for special events
    awardBonusPoints(userId, points, reason) {
        const stats = this.initializeUserStats(userId);
        stats.total_points += points;

        logger.info(`Awarded ${points} bonus points to user ${userId}: ${reason}`);

        return stats.total_points;
    }

    // Calculate achievement progress
    getAchievementProgress(userId, achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || !achievement.requirement) return null;

        const stats = this.userStats.get(userId);
        if (!stats) return { progress: 0, required: achievement.requirement.value };

        const current = stats[achievement.requirement.field] || 0;
        const required = achievement.requirement.value;

        return {
            progress: Math.min(current / required, 1),
            current,
            required,
            completed: current >= required
        };
    }

    // Get all achievements with progress
    getAllAchievementsWithProgress(userId) {
        const unlocked = new Set(this.userAchievements.get(userId) || []);
        const achievements = [];

        for (const [id, achievement] of Object.entries(this.achievements)) {
            const progress = this.getAchievementProgress(userId, id);
            achievements.push({
                ...achievement,
                unlocked: unlocked.has(id),
                progress
            });
        }

        return achievements;
    }

    // Generate achievement notifications
    generateNotifications(userId, newAchievements) {
        return newAchievements.map(achievementId => {
            const achievement = this.achievements[achievementId];
            return {
                type: 'achievement_unlocked',
                title: 'Achievement Unlocked!',
                message: `Congratulations! You unlocked "${achievement.name}"`,
                icon: achievement.icon,
                points: achievement.points,
                rarity: achievement.rarity,
                timestamp: new Date()
            };
        });
    }

    // Get gamification stats
    getGamificationStats() {
        const users = Array.from(this.userStats.values());
        const totalUsers = users.length;

        if (totalUsers === 0) return {};

        const stats = {
            totalUsers,
            totalAchievementsUnlocked: users.reduce((sum, user) => sum + user.achievements_unlocked, 0),
            totalPointsAwarded: users.reduce((sum, user) => sum + user.total_points, 0),
            averagePointsPerUser: users.reduce((sum, user) => sum + user.total_points, 0) / totalUsers,
            averageAchievementsPerUser: users.reduce((sum, user) => sum + user.achievements_unlocked, 0) / totalUsers,
            topAchievements: this.getMostUnlockedAchievements(),
            engagementMetrics: {
                activeUsers: users.filter(user => {
                    const daysSinceLastLogin = Math.floor((new Date() - new Date(user.last_login)) / (1000 * 60 * 60 * 24));
                    return daysSinceLastLogin <= 7;
                }).length,
                averageLoginStreak: users.reduce((sum, user) => sum + user.login_streak, 0) / totalUsers
            }
        };

        return stats;
    }

    // Get most unlocked achievements
    getMostUnlockedAchievements(limit = 10) {
        const achievementCounts = {};

        for (const achievements of this.userAchievements.values()) {
            for (const achievementId of achievements) {
                achievementCounts[achievementId] = (achievementCounts[achievementId] || 0) + 1;
            }
        }

        return Object.entries(achievementCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id, count]) => ({
                achievement: this.achievements[id],
                unlockedCount: count
            }));
    }
}

// Singleton instance
const achievementSystem = new AchievementSystem();

// Periodic leaderboard updates
setInterval(() => {
    achievementSystem.updateLeaderboards();
}, 60 * 60 * 1000); // Every hour

module.exports = achievementSystem;
