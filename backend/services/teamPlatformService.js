const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// Team Platform Service for collaborative athlete management
class TeamPlatformService {
    constructor() {
        this.teams = new Map();
        this.teamMembers = new Map();
        this.collaborationSessions = new Map();
        this.notifications = new Map();
        this.isInitialized = false;
    }

    // Initialize the service
    async initialize() {
        try {
            logger.info('Initializing Team Platform Service...');

            // Initialize team data structures
            this.initializeTeamStructures();

            // Set up collaboration features
            this.setupCollaborationFeatures();

            // Initialize notification system
            this.setupNotificationSystem();

            this.isInitialized = true;
            logger.info('Team Platform Service initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize Team Platform Service:', error);
            throw error;
        }
    }

    // Initialize team data structures
    initializeTeamStructures() {
        this.teams.set('default', {
            id: 'default',
            name: 'Default Team',
            coach: 'system',
            athletes: [],
            createdAt: new Date(),
            settings: {
                allowPublicSharing: false,
                requireApproval: true,
                maxMembers: 50
            }
        });
    }

    // Set up collaboration features
    setupCollaborationFeatures() {
        this.collaborationFeatures = {
            sharedWorkouts: true,
            groupAnalysis: true,
            teamGoals: true,
            progressTracking: true,
            communication: true
        };
    }

    // Set up notification system
    setupNotificationSystem() {
        this.notificationTypes = {
            TEAM_INVITATION: 'team_invitation',
            WORKOUT_SHARED: 'workout_shared',
            GOAL_ACHIEVED: 'goal_achieved',
            PERFORMANCE_UPDATE: 'performance_update',
            TEAM_ANNOUNCEMENT: 'team_announcement'
        };
    }

    // Create a new team
    async createTeam(teamData) {
        try {
            const { name, coachId, description, settings } = teamData;

            if (!name || !coachId) {
                throw new Error('Team name and coach ID are required');
            }

            const team = {
                id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                coach: coachId,
                description: description || '',
                athletes: [],
                createdAt: new Date(),
                settings: {
                    allowPublicSharing: settings?.allowPublicSharing || false,
                    requireApproval: settings?.requireApproval || true,
                    maxMembers: settings?.maxMembers || 50,
                    ...settings
                },
                stats: {
                    totalMembers: 0,
                    activeMembers: 0,
                    averagePerformance: 0,
                    goalsAchieved: 0
                }
            };

            this.teams.set(team.id, team);
            this.teamMembers.set(team.id, new Map());

            logger.info(`Created new team: ${team.name} (${team.id})`);
            return team;

        } catch (error) {
            logger.error('Error creating team:', error);
            throw error;
        }
    }

    // Add athlete to team
    async addAthleteToTeam(teamId, athleteId, role = 'member') {
        try {
            const team = this.teams.get(teamId);
            if (!team) {
                throw new Error('Team not found');
            }

            if (team.athletes.includes(athleteId)) {
                throw new Error('Athlete is already a member of this team');
            }

            if (team.athletes.length >= team.settings.maxMembers) {
                throw new Error('Team has reached maximum member limit');
            }

            // Add athlete to team
            team.athletes.push(athleteId);
            team.stats.totalMembers++;

            // Initialize member data
            const memberData = {
                athleteId,
                role,
                joinedAt: new Date(),
                status: 'active',
                permissions: this.getRolePermissions(role)
            };

            this.teamMembers.get(teamId).set(athleteId, memberData);

            // Send notification
            await this.sendNotification(athleteId, 'TEAM_INVITATION', {
                teamId,
                teamName: team.name,
                message: `You have been added to team: ${team.name}`
            });

            logger.info(`Added athlete ${athleteId} to team ${teamId}`);
            return memberData;

        } catch (error) {
            logger.error('Error adding athlete to team:', error);
            throw error;
        }
    }

    // Get role permissions
    getRolePermissions(role) {
        const permissions = {
            member: {
                viewTeamData: true,
                shareWorkouts: true,
                participateInGoals: true,
                viewAnalytics: false,
                manageTeam: false
            },
            captain: {
                viewTeamData: true,
                shareWorkouts: true,
                participateInGoals: true,
                viewAnalytics: true,
                manageTeam: false
            },
            coach: {
                viewTeamData: true,
                shareWorkouts: true,
                participateInGoals: true,
                viewAnalytics: true,
                manageTeam: true
            }
        };

        return permissions[role] || permissions.member;
    }

    // Remove athlete from team
    async removeAthleteFromTeam(teamId, athleteId) {
        try {
            const team = this.teams.get(teamId);
            if (!team) {
                throw new Error('Team not found');
            }

            const memberIndex = team.athletes.indexOf(athleteId);
            if (memberIndex === -1) {
                throw new Error('Athlete is not a member of this team');
            }

            // Remove athlete from team
            team.athletes.splice(memberIndex, 1);
            team.stats.totalMembers--;

            // Remove member data
            this.teamMembers.get(teamId).delete(athleteId);

            logger.info(`Removed athlete ${athleteId} from team ${teamId}`);
            return true;

        } catch (error) {
            logger.error('Error removing athlete from team:', error);
            throw error;
        }
    }

    // Get team details
    getTeamDetails(teamId) {
        const team = this.teams.get(teamId);
        if (!team) {
            return null;
        }

        const members = Array.from(this.teamMembers.get(teamId)?.values() || []);

        return {
            ...team,
            members: members.map(member => ({
                athleteId: member.athleteId,
                role: member.role,
                joinedAt: member.joinedAt,
                status: member.status
            }))
        };
    }

    // Get athlete's teams
    getAthleteTeams(athleteId) {
        const athleteTeams = [];

        for (const [teamId, team] of this.teams.entries()) {
            if (team.athletes.includes(athleteId)) {
                const memberData = this.teamMembers.get(teamId)?.get(athleteId);
                athleteTeams.push({
                    teamId,
                    teamName: team.name,
                    role: memberData?.role || 'member',
                    joinedAt: memberData?.joinedAt,
                    permissions: memberData?.permissions
                });
            }
        }

        return athleteTeams;
    }

    // Share workout with team
    async shareWorkoutWithTeam(teamId, athleteId, workoutData) {
        try {
            const team = this.teams.get(teamId);
            if (!team) {
                throw new Error('Team not found');
            }

            if (!team.athletes.includes(athleteId)) {
                throw new Error('Athlete is not a member of this team');
            }

            const sharedWorkout = {
                id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                teamId,
                athleteId,
                workoutData,
                sharedAt: new Date(),
                likes: 0,
                comments: []
            };

            // Store shared workout (in a real implementation, this would go to database)
            if (!team.sharedWorkouts) {
                team.sharedWorkouts = [];
            }
            team.sharedWorkouts.push(sharedWorkout);

            // Notify team members
            for (const memberId of team.athletes) {
                if (memberId !== athleteId) {
                    await this.sendNotification(memberId, 'WORKOUT_SHARED', {
                        teamId,
                        teamName: team.name,
                        athleteId,
                        workoutId: sharedWorkout.id,
                        message: `${athleteId} shared a workout: ${workoutData.name}`
                    });
                }
            }

            logger.info(`Shared workout ${sharedWorkout.id} with team ${teamId}`);
            return sharedWorkout;

        } catch (error) {
            logger.error('Error sharing workout with team:', error);
            throw error;
        }
    }

    // Create team goal
    async createTeamGoal(teamId, goalData) {
        try {
            const team = this.teams.get(teamId);
            if (!team) {
                throw new Error('Team not found');
            }

            const goal = {
                id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                teamId,
                ...goalData,
                createdAt: new Date(),
                progress: 0,
                participants: [],
                status: 'active'
            };

            // Initialize team goals if not exists
            if (!team.goals) {
                team.goals = [];
            }
            team.goals.push(goal);

            // Notify team members
            for (const memberId of team.athletes) {
                await this.sendNotification(memberId, 'TEAM_ANNOUNCEMENT', {
                    teamId,
                    teamName: team.name,
                    goalId: goal.id,
                    message: `New team goal created: ${goal.title}`
                });
            }

            logger.info(`Created team goal ${goal.id} for team ${teamId}`);
            return goal;

        } catch (error) {
            logger.error('Error creating team goal:', error);
            throw error;
        }
    }

    // Update team goal progress
    async updateTeamGoalProgress(teamId, goalId, athleteId, progress) {
        try {
            const team = this.teams.get(teamId);
            if (!team) {
                throw new Error('Team not found');
            }

            const goal = team.goals?.find(g => g.id === goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Update participant progress
            const participant = goal.participants.find(p => p.athleteId === athleteId);
            if (participant) {
                participant.progress = progress;
                participant.updatedAt = new Date();
            } else {
                goal.participants.push({
                    athleteId,
                    progress,
                    joinedAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // Recalculate overall goal progress
            const totalProgress = goal.participants.reduce((sum, p) => sum + p.progress, 0);
            goal.progress = totalProgress / goal.participants.length;

            // Check if goal is achieved
            if (goal.progress >= 100 && goal.status === 'active') {
                goal.status = 'achieved';
                goal.achievedAt = new Date();
                team.stats.goalsAchieved++;

                // Notify team members
                for (const memberId of team.athletes) {
                    await this.sendNotification(memberId, 'GOAL_ACHIEVED', {
                        teamId,
                        teamName: team.name,
                        goalId: goal.id,
                        message: `Team goal achieved: ${goal.title}!`
                    });
                }
            }

            logger.info(`Updated goal ${goalId} progress: ${goal.progress}%`);
            return goal;

        } catch (error) {
            logger.error('Error updating team goal progress:', error);
            throw error;
        }
    }

    // Get team analytics
    getTeamAnalytics(teamId) {
        const team = this.teams.get(teamId);
        if (!team) {
            return null;
        }

        const members = Array.from(this.teamMembers.get(teamId)?.values() || []);
        const activeMembers = members.filter(m => m.status === 'active');

        // Calculate team performance metrics
        const performanceMetrics = {
            totalMembers: team.stats.totalMembers,
            activeMembers: activeMembers.length,
            goalsAchieved: team.stats.goalsAchieved,
            averagePerformance: this.calculateAveragePerformance(team),
            topPerformers: this.getTopPerformers(team),
            recentActivity: this.getRecentActivity(team)
        };

        return {
            teamId,
            teamName: team.name,
            ...performanceMetrics
        };
    }

    // Calculate average team performance
    calculateAveragePerformance(team) {
        // In a real implementation, this would calculate based on actual performance data
        return 78.5; // Mock average
    }

    // Get top performers
    getTopPerformers(team) {
        // Mock top performers data
        return [
            { athleteId: 'athlete_1', performance: 92, improvement: 8 },
            { athleteId: 'athlete_2', performance: 89, improvement: 12 },
            { athleteId: 'athlete_3', performance: 87, improvement: 5 }
        ];
    }

    // Get recent team activity
    getRecentActivity(team) {
        const activities = [];

        // Add recent goals
        if (team.goals) {
            team.goals.slice(-3).forEach(goal => {
                activities.push({
                    type: 'goal_created',
                    description: `New goal: ${goal.title}`,
                    timestamp: goal.createdAt
                });
            });
        }

        // Add recent shared workouts
        if (team.sharedWorkouts) {
            team.sharedWorkouts.slice(-3).forEach(workout => {
                activities.push({
                    type: 'workout_shared',
                    description: `Workout shared: ${workout.workoutData.name}`,
                    timestamp: workout.sharedAt
                });
            });
        }

        return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    }

    // Send notification
    async sendNotification(athleteId, type, data) {
        const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            athleteId,
            type,
            data,
            timestamp: new Date(),
            read: false
        };

        // Store notification
        if (!this.notifications.has(athleteId)) {
            this.notifications.set(athleteId, []);
        }
        this.notifications.get(athleteId).push(notification);

        logger.info(`Sent notification ${type} to athlete ${athleteId}`);
        return notification;
    }

    // Get athlete notifications
    getAthleteNotifications(athleteId, limit = 20) {
        const notifications = this.notifications.get(athleteId) || [];
        return notifications.slice(-limit).reverse();
    }

    // Mark notification as read
    markNotificationAsRead(athleteId, notificationId) {
        const notifications = this.notifications.get(athleteId) || [];
        const notification = notifications.find(n => n.id === notificationId);

        if (notification) {
            notification.read = true;
            notification.readAt = new Date();
            return true;
        }

        return false;
    }

    // Start collaboration session
    startCollaborationSession(teamId, sessionData) {
        const session = {
            id: `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            teamId,
            ...sessionData,
            participants: [],
            startedAt: new Date(),
            status: 'active'
        };

        this.collaborationSessions.set(session.id, session);
        logger.info(`Started collaboration session ${session.id} for team ${teamId}`);

        return session;
    }

    // Join collaboration session
    joinCollaborationSession(sessionId, athleteId) {
        const session = this.collaborationSessions.get(sessionId);
        if (!session) {
            throw new Error('Collaboration session not found');
        }

        if (!session.participants.includes(athleteId)) {
            session.participants.push(athleteId);
        }

        return session;
    }

    // End collaboration session
    endCollaborationSession(sessionId) {
        const session = this.collaborationSessions.get(sessionId);
        if (!session) {
            return null;
        }

        session.endedAt = new Date();
        session.status = 'completed';
        session.duration = session.endedAt - session.startedAt;

        logger.info(`Ended collaboration session ${sessionId}, duration: ${session.duration}ms`);
        return session;
    }

    // Get all teams
    getAllTeams() {
        return Array.from(this.teams.values()).map(team => ({
            id: team.id,
            name: team.name,
            coach: team.coach,
            totalMembers: team.stats.totalMembers,
            createdAt: team.createdAt
        }));
    }

    // Clean up old data
    cleanup() {
        const cutoffTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Clean up old notifications
        for (const [athleteId, notifications] of this.notifications.entries()) {
            const recentNotifications = notifications.filter(n => n.timestamp >= cutoffTime);
            if (recentNotifications.length === 0) {
                this.notifications.delete(athleteId);
            } else {
                this.notifications.set(athleteId, recentNotifications);
            }
        }

        logger.info('Team Platform Service cleanup completed');
    }
}

module.exports = TeamPlatformService;
