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
        this.dynamicChallenges = new Map();
        this.seasonalCompetitions = new Map();
        this.virtualRewards = new Map();
        this.userRewards = new Map();
        this.challengeProgress = new Map();
        this.competitionStandings = new Map();
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

    // Create a dynamic challenge
    createDynamicChallenge(challengeData) {
        const challengeId = `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const challenge = {
            id: challengeId,
            title: challengeData.title,
            description: challengeData.description,
            type: challengeData.type, // 'individual', 'team', 'time-limited'
            category: challengeData.category, // 'fitness', 'social', 'learning', etc.
            requirements: challengeData.requirements, // What needs to be accomplished
            rewards: challengeData.rewards || [],
            startDate: challengeData.startDate || new Date(),
            endDate: challengeData.endDate,
            maxParticipants: challengeData.maxParticipants || 1000,
            participants: new Map(),
            isActive: true,
            createdBy: challengeData.createdBy,
            difficulty: challengeData.difficulty || 'medium',
            tags: challengeData.tags || []
        };

        this.dynamicChallenges.set(challengeId, challenge);
        return challenge;
    }

    // Join a dynamic challenge
    joinDynamicChallenge(challengeId, userId) {
        const challenge = this.dynamicChallenges.get(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        if (!challenge.isActive) {
            throw new Error('Challenge is not active');
        }

        if (challenge.participants.size >= challenge.maxParticipants) {
            throw new Error('Challenge is full');
        }

        if (challenge.participants.has(userId)) {
            throw new Error('Already participating in this challenge');
        }

        challenge.participants.set(userId, {
            joinedAt: new Date(),
            progress: 0,
            completedTasks: new Set(),
            lastUpdate: new Date()
        });

        // Initialize challenge progress tracking
        if (!this.challengeProgress.has(userId)) {
            this.challengeProgress.set(userId, new Map());
        }
        this.challengeProgress.get(userId).set(challengeId, {
            progress: 0,
            milestones: [],
            startTime: new Date()
        });

        return challenge;
    }

    // Update challenge progress
    updateChallengeProgress(challengeId, userId, progressData) {
        const challenge = this.dynamicChallenges.get(challengeId);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const participant = challenge.participants.get(userId);
        if (!participant) {
            throw new Error('Not participating in this challenge');
        }

        // Update progress
        participant.progress = progressData.progress || participant.progress;
        participant.lastUpdate = new Date();

        // Track completed tasks
        if (progressData.completedTask) {
            participant.completedTasks.add(progressData.completedTask);
        }

        // Update challenge progress tracking
        const userProgress = this.challengeProgress.get(userId)?.get(challengeId);
        if (userProgress) {
            userProgress.progress = participant.progress;
            userProgress.milestones.push({
                timestamp: new Date(),
                progress: participant.progress,
                description: progressData.description || 'Progress update'
            });
        }

        // Check if challenge is completed
        if (this.isChallengeCompleted(challenge, participant)) {
            this.completeChallenge(challengeId, userId);
        }

        return participant;
    }

    // Check if challenge is completed
    isChallengeCompleted(challenge, participant) {
        // Simple completion check based on progress threshold
        return participant.progress >= 100;
    }

    // Complete a challenge and award rewards
    completeChallenge(challengeId, userId) {
        const challenge = this.dynamicChallenges.get(challengeId);
        const participant = challenge.participants.get(userId);

        if (!participant.completedAt) {
            participant.completedAt = new Date();
            participant.finalRank = this.calculateChallengeRank(challenge, userId);

            // Award rewards
            this.awardChallengeRewards(challengeId, userId, participant.finalRank);

            // Update user stats
            const userStats = this.userStats.get(userId);
            if (userStats) {
                userStats.challenges_completed = (userStats.challenges_completed || 0) + 1;
                userStats.total_points += challenge.rewards.points || 0;
            }
        }

        return participant;
    }

    // Calculate rank in challenge
    calculateChallengeRank(challenge, userId) {
        const participants = Array.from(challenge.participants.entries())
            .filter(([_, p]) => p.completedAt)
            .sort((a, b) => new Date(a[1].completedAt) - new Date(b[1].completedAt));

        const rank = participants.findIndex(([id, _]) => id === userId) + 1;
        return rank;
    }

    // Award challenge rewards
    awardChallengeRewards(challengeId, userId, rank) {
        const challenge = this.dynamicChallenges.get(challengeId);
        const rewards = challenge.rewards;

        if (!this.userRewards.has(userId)) {
            this.userRewards.set(userId, []);
        }

        const userRewards = this.userRewards.get(userId);

        // Base completion reward
        if (rewards.points) {
            userRewards.push({
                id: `challenge_${challengeId}_completion`,
                type: 'points',
                value: rewards.points,
                description: `Completed challenge: ${challenge.title}`,
                earnedAt: new Date(),
                source: 'challenge_completion'
            });
        }

        // Rank-based rewards
        if (rank === 1 && rewards.firstPlaceReward) {
            userRewards.push({
                id: `challenge_${challengeId}_first_place`,
                type: 'special',
                value: rewards.firstPlaceReward,
                description: `Won 1st place in: ${challenge.title}`,
                earnedAt: new Date(),
                source: 'challenge_rank'
            });
        } else if (rank <= 3 && rewards.topThreeReward) {
            userRewards.push({
                id: `challenge_${challengeId}_top_three`,
                type: 'special',
                value: rewards.topThreeReward,
                description: `Top 3 finish in: ${challenge.title}`,
                earnedAt: new Date(),
                source: 'challenge_rank'
            });
        }

        // Virtual items
        if (rewards.virtualItems) {
            rewards.virtualItems.forEach(item => {
                userRewards.push({
                    id: `challenge_${challengeId}_item_${item.id}`,
                    type: 'virtual_item',
                    value: item,
                    description: `Earned virtual item: ${item.name}`,
                    earnedAt: new Date(),
                    source: 'challenge_completion'
                });
            });
        }
    }

    // Create a seasonal competition
    createSeasonalCompetition(competitionData) {
        const competitionId = `season_${competitionData.season}_${competitionData.year}`;

        const competition = {
            id: competitionId,
            name: competitionData.name,
            description: competitionData.description,
            season: competitionData.season, // 'spring', 'summer', 'fall', 'winter'
            year: competitionData.year,
            startDate: competitionData.startDate,
            endDate: competitionData.endDate,
            categories: competitionData.categories || [], // Different competition categories
            scoringSystem: competitionData.scoringSystem || 'points', // 'points', 'time', 'distance'
            leaderboard: new Map(),
            participants: new Map(),
            prizes: competitionData.prizes || [],
            isActive: true,
            rules: competitionData.rules || [],
            sponsors: competitionData.sponsors || []
        };

        this.seasonalCompetitions.set(competitionId, competition);
        this.competitionStandings.set(competitionId, new Map());

        return competition;
    }

    // Join a seasonal competition
    joinSeasonalCompetition(competitionId, userId, category = 'general') {
        const competition = this.seasonalCompetitions.get(competitionId);
        if (!competition) {
            throw new Error('Competition not found');
        }

        if (!competition.isActive) {
            throw new Error('Competition is not active');
        }

        if (!competition.categories.includes(category) && category !== 'general') {
            throw new Error('Invalid competition category');
        }

        competition.participants.set(userId, {
            joinedAt: new Date(),
            category,
            score: 0,
            achievements: [],
            lastActivity: new Date()
        });

        // Initialize standings
        const standings = this.competitionStandings.get(competitionId);
        standings.set(userId, {
            score: 0,
            rank: 0,
            category,
            lastUpdate: new Date()
        });

        this.updateCompetitionStandings(competitionId);

        return competition;
    }

    // Update competition score
    updateCompetitionScore(competitionId, userId, scoreIncrement, activityType) {
        const competition = this.seasonalCompetitions.get(competitionId);
        if (!competition) {
            throw new Error('Competition not found');
        }

        const participant = competition.participants.get(userId);
        if (!participant) {
            throw new Error('Not participating in this competition');
        }

        // Update participant score
        participant.score += scoreIncrement;
        participant.lastActivity = new Date();

        // Record achievement
        participant.achievements.push({
            timestamp: new Date(),
            activityType,
            scoreIncrement,
            totalScore: participant.score
        });

        // Update standings
        const standings = this.competitionStandings.get(competitionId);
        const userStanding = standings.get(userId);
        userStanding.score = participant.score;
        userStanding.lastUpdate = new Date();

        this.updateCompetitionStandings(competitionId);

        return participant;
    }

    // Update competition standings
    updateCompetitionStandings(competitionId) {
        const competition = this.seasonalCompetitions.get(competitionId);
        const standings = this.competitionStandings.get(competitionId);

        // Sort participants by score
        const sortedParticipants = Array.from(standings.entries())
            .sort((a, b) => b[1].score - a[1].score);

        // Update ranks
        sortedParticipants.forEach(([userId, standing], index) => {
            standing.rank = index + 1;
        });

        competition.leaderboard = sortedParticipants.slice(0, 50); // Top 50
    }

    // Create virtual rewards catalog
    initializeVirtualRewards() {
        this.virtualRewards.set('profile_badges', [
            {
                id: 'champion_badge',
                name: 'Champion Badge',
                description: 'Awarded to challenge winners',
                icon: '🏆',
                rarity: 'epic',
                unlockCondition: 'Win a challenge'
            },
            {
                id: 'consistency_badge',
                name: 'Consistency Badge',
                description: 'Awarded for completing 10 challenges',
                icon: '📅',
                rarity: 'rare',
                unlockCondition: 'Complete 10 challenges'
            },
            {
                id: 'social_badge',
                name: 'Social Butterfly',
                description: 'Awarded for helping 50 community members',
                icon: '🦋',
                rarity: 'uncommon',
                unlockCondition: 'Help 50 community members'
            }
        ]);

        this.virtualRewards.set('profile_themes', [
            {
                id: 'champion_theme',
                name: 'Champion Theme',
                description: 'Exclusive theme for top performers',
                colors: ['#FFD700', '#FFA500', '#FF6347'],
                unlockCondition: 'Reach top 10 in seasonal competition'
            },
            {
                id: 'elite_theme',
                name: 'Elite Theme',
                description: 'Premium theme for elite athletes',
                colors: ['#4A90E2', '#7ED321', '#D0021B'],
                unlockCondition: 'Achieve elite status'
            }
        ]);

        this.virtualRewards.set('virtual_goods', [
            {
                id: 'training_booster',
                name: 'Training Booster',
                description: '25% XP boost for 24 hours',
                duration: 24 * 60 * 60 * 1000, // 24 hours
                effect: 'xp_multiplier',
                value: 1.25,
                unlockCondition: 'Complete weekly challenge'
            },
            {
                id: 'insight_unlock',
                name: 'Advanced Insight',
                description: 'Unlock advanced analytics for 7 days',
                duration: 7 * 24 * 60 * 60 * 1000, // 7 days
                effect: 'advanced_analytics',
                unlockCondition: 'Share 10 training insights'
            }
        ]);
    }

    // Award virtual reward
    awardVirtualReward(userId, rewardType, rewardId) {
        const rewards = this.virtualRewards.get(rewardType);
        if (!rewards) {
            throw new Error('Invalid reward type');
        }

        const reward = rewards.find(r => r.id === rewardId);
        if (!reward) {
            throw new Error('Reward not found');
        }

        if (!this.userRewards.has(userId)) {
            this.userRewards.set(userId, []);
        }

        const userRewards = this.userRewards.get(userId);

        // Check if already owned
        const alreadyOwned = userRewards.some(r => r.id === rewardId && r.type === 'virtual_item');
        if (alreadyOwned) {
            throw new Error('Reward already owned');
        }

        userRewards.push({
            id: rewardId,
            type: 'virtual_item',
            value: reward,
            description: `Earned virtual reward: ${reward.name}`,
            earnedAt: new Date(),
            source: 'achievement_system'
        });

        return reward;
    }

    // Get user rewards
    getUserRewards(userId) {
        return this.userRewards.get(userId) || [];
    }

    // Get active dynamic challenges
    getActiveChallenges(filters = {}) {
        const challenges = Array.from(this.dynamicChallenges.values())
            .filter(c => c.isActive);

        // Apply filters
        if (filters.category) {
            challenges = challenges.filter(c => c.category === filters.category);
        }

        if (filters.difficulty) {
            challenges = challenges.filter(c => c.difficulty === filters.difficulty);
        }

        if (filters.type) {
            challenges = challenges.filter(c => c.type === filters.type);
        }

        return challenges.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            type: c.type,
            category: c.category,
            difficulty: c.difficulty,
            participants: c.participants.size,
            maxParticipants: c.maxParticipants,
            endDate: c.endDate,
            rewards: c.rewards,
            tags: c.tags
        }));
    }

    // Get seasonal competitions
    getSeasonalCompetitions(season = null, year = null) {
        let competitions = Array.from(this.seasonalCompetitions.values());

        if (season) {
            competitions = competitions.filter(c => c.season === season);
        }

        if (year) {
            competitions = competitions.filter(c => c.year === year);
        }

        return competitions.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            season: c.season,
            year: c.year,
            startDate: c.startDate,
            endDate: c.endDate,
            categories: c.categories,
            leaderboard: c.leaderboard.slice(0, 10), // Top 10
            participantCount: c.participants.size,
            isActive: c.isActive
        }));
    }

    // Get virtual rewards catalog
    getVirtualRewardsCatalog() {
        const catalog = {};

        for (const [category, rewards] of this.virtualRewards.entries()) {
            catalog[category] = rewards.map(reward => ({
                id: reward.id,
                name: reward.name,
                description: reward.description,
                icon: reward.icon,
                rarity: reward.rarity,
                unlockCondition: reward.unlockCondition
            }));
        }

        return catalog;
    }
}

// Singleton instance
const achievementSystem = new AchievementSystem();

// Periodic leaderboard updates - only in non-test environments
if (process.env.NODE_ENV !== 'test') {
    setInterval(() => {
        achievementSystem.updateLeaderboards();
    }, 60 * 60 * 1000); // Every hour
}

module.exports = achievementSystem;
