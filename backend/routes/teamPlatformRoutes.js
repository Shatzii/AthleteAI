const express = require('express');
const router = express.Router();
const TeamPlatformService = require('../services/teamPlatformService');
const { authenticateToken } = require('../middleware/auth');

const teamPlatformService = new TeamPlatformService();

// Initialize service
teamPlatformService.initialize().catch(console.error);

// POST /api/team-platform/create-team
// Create a new team
router.post('/create-team', authenticateToken, async (req, res) => {
    try {
        const { name, description, settings } = req.body;
        const coachId = req.user?.id || 'system';

        const team = await teamPlatformService.createTeam({
            name,
            coachId,
            description,
            settings
        });

        res.json({
            success: true,
            data: team
        });

    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create team',
            details: error.message
        });
    }
});

// POST /api/team-platform/add-member
// Add athlete to team
router.post('/add-member', authenticateToken, async (req, res) => {
    try {
        const { teamId, athleteId, role } = req.body;

        if (!teamId || !athleteId) {
            return res.status(400).json({
                success: false,
                error: 'Team ID and athlete ID are required'
            });
        }

        const memberData = await teamPlatformService.addAthleteToTeam(
            teamId,
            athleteId,
            role || 'member'
        );

        res.json({
            success: true,
            data: memberData
        });

    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add team member',
            details: error.message
        });
    }
});

// DELETE /api/team-platform/remove-member
// Remove athlete from team
router.delete('/remove-member', authenticateToken, async (req, res) => {
    try {
        const { teamId, athleteId } = req.body;

        if (!teamId || !athleteId) {
            return res.status(400).json({
                success: false,
                error: 'Team ID and athlete ID are required'
            });
        }

        const result = await teamPlatformService.removeAthleteFromTeam(teamId, athleteId);

        res.json({
            success: true,
            message: 'Athlete removed from team successfully'
        });

    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove team member',
            details: error.message
        });
    }
});

// GET /api/team-platform/teams
// Get all teams
router.get('/teams', authenticateToken, async (req, res) => {
    try {
        const teams = teamPlatformService.getAllTeams();

        res.json({
            success: true,
            data: teams
        });

    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch teams',
            details: error.message
        });
    }
});

// GET /api/team-platform/team/:teamId
// Get team details
router.get('/team/:teamId', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = teamPlatformService.getTeamDetails(teamId);

        if (!team) {
            return res.status(404).json({
                success: false,
                error: 'Team not found'
            });
        }

        res.json({
            success: true,
            data: team
        });

    } catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch team details',
            details: error.message
        });
    }
});

// GET /api/team-platform/athlete-teams/:athleteId
// Get teams for an athlete
router.get('/athlete-teams/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;

        const teams = teamPlatformService.getAthleteTeams(athleteId);

        res.json({
            success: true,
            data: teams
        });

    } catch (error) {
        console.error('Error fetching athlete teams:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch athlete teams',
            details: error.message
        });
    }
});

// POST /api/team-platform/share-workout
// Share workout with team
router.post('/share-workout', authenticateToken, async (req, res) => {
    try {
        const { teamId, workoutData } = req.body;
        const athleteId = req.user?.id || 'system';

        if (!teamId || !workoutData) {
            return res.status(400).json({
                success: false,
                error: 'Team ID and workout data are required'
            });
        }

        const sharedWorkout = await teamPlatformService.shareWorkoutWithTeam(
            teamId,
            athleteId,
            workoutData
        );

        res.json({
            success: true,
            data: sharedWorkout
        });

    } catch (error) {
        console.error('Error sharing workout:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to share workout',
            details: error.message
        });
    }
});

// POST /api/team-platform/create-goal
// Create team goal
router.post('/create-goal', authenticateToken, async (req, res) => {
    try {
        const { teamId, title, description, target, deadline, metric } = req.body;

        if (!teamId || !title || !target) {
            return res.status(400).json({
                success: false,
                error: 'Team ID, title, and target are required'
            });
        }

        const goal = await teamPlatformService.createTeamGoal(teamId, {
            title,
            description,
            target,
            deadline: deadline ? new Date(deadline) : null,
            metric: metric || 'percentage'
        });

        res.json({
            success: true,
            data: goal
        });

    } catch (error) {
        console.error('Error creating team goal:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create team goal',
            details: error.message
        });
    }
});

// PUT /api/team-platform/update-goal-progress
// Update team goal progress
router.put('/update-goal-progress', authenticateToken, async (req, res) => {
    try {
        const { teamId, goalId, progress } = req.body;
        const athleteId = req.user?.id || 'system';

        if (!teamId || !goalId || progress === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Team ID, goal ID, and progress are required'
            });
        }

        const goal = await teamPlatformService.updateTeamGoalProgress(
            teamId,
            goalId,
            athleteId,
            parseFloat(progress)
        );

        res.json({
            success: true,
            data: goal
        });

    } catch (error) {
        console.error('Error updating goal progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update goal progress',
            details: error.message
        });
    }
});

// GET /api/team-platform/analytics/:teamId
// Get team analytics
router.get('/analytics/:teamId', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.params;

        const analytics = teamPlatformService.getTeamAnalytics(teamId);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: 'Team not found'
            });
        }

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Error fetching team analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch team analytics',
            details: error.message
        });
    }
});

// GET /api/team-platform/notifications/:athleteId
// Get notifications for an athlete
router.get('/notifications/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { limit } = req.query;

        const notifications = teamPlatformService.getAthleteNotifications(
            athleteId,
            parseInt(limit) || 20
        );

        res.json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications',
            details: error.message
        });
    }
});

// POST /api/team-platform/mark-notification-read
// Mark notification as read
router.post('/mark-notification-read', authenticateToken, async (req, res) => {
    try {
        const { athleteId, notificationId } = req.body;

        if (!athleteId || !notificationId) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and notification ID are required'
            });
        }

        const marked = teamPlatformService.markNotificationAsRead(athleteId, notificationId);

        if (!marked) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read',
            details: error.message
        });
    }
});

// POST /api/team-platform/start-collaboration
// Start collaboration session
router.post('/start-collaboration', authenticateToken, async (req, res) => {
    try {
        const { teamId, sessionType, topic } = req.body;

        if (!teamId) {
            return res.status(400).json({
                success: false,
                error: 'Team ID is required'
            });
        }

        const session = teamPlatformService.startCollaborationSession(teamId, {
            type: sessionType || 'general',
            topic: topic || 'Team Discussion',
            startedBy: req.user?.id || 'system'
        });

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error starting collaboration session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start collaboration session',
            details: error.message
        });
    }
});

// POST /api/team-platform/join-collaboration
// Join collaboration session
router.post('/join-collaboration', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const athleteId = req.user?.id || 'system';

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        const session = teamPlatformService.joinCollaborationSession(sessionId, athleteId);

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error joining collaboration session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to join collaboration session',
            details: error.message
        });
    }
});

// POST /api/team-platform/end-collaboration
// End collaboration session
router.post('/end-collaboration', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        const session = teamPlatformService.endCollaborationSession(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Collaboration session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Error ending collaboration session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end collaboration session',
            details: error.message
        });
    }
});

// GET /api/team-platform/leaderboard/:teamId
// Get team leaderboard
router.get('/leaderboard/:teamId', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { metric, timeframe } = req.query;

        // Get team analytics which includes top performers
        const analytics = teamPlatformService.getTeamAnalytics(teamId);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: 'Team not found'
            });
        }

        const leaderboard = {
            teamId,
            metric: metric || 'performance',
            timeframe: timeframe || 'current_month',
            topPerformers: analytics.topPerformers,
            generatedAt: new Date()
        };

        res.json({
            success: true,
            data: leaderboard
        });

    } catch (error) {
        console.error('Error fetching team leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch team leaderboard',
            details: error.message
        });
    }
});

// POST /api/team-platform/send-message
// Send message to team
router.post('/send-message', authenticateToken, async (req, res) => {
    try {
        const { teamId, message, messageType } = req.body;
        const senderId = req.user?.id || 'system';

        if (!teamId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Team ID and message are required'
            });
        }

        // In a real implementation, this would store the message
        // For now, we'll create a notification for all team members
        const team = teamPlatformService.getTeamDetails(teamId);

        if (!team) {
            return res.status(404).json({
                success: false,
                error: 'Team not found'
            });
        }

        // Send notification to all team members except sender
        for (const member of team.members) {
            if (member.athleteId !== senderId) {
                await teamPlatformService.sendNotification(member.athleteId, 'TEAM_ANNOUNCEMENT', {
                    teamId,
                    teamName: team.name,
                    senderId,
                    message: message,
                    messageType: messageType || 'general'
                });
            }
        }

        res.json({
            success: true,
            message: 'Message sent to team successfully'
        });

    } catch (error) {
        console.error('Error sending team message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send team message',
            details: error.message
        });
    }
});

// GET /api/team-platform/activity/:teamId
// Get team activity feed
router.get('/activity/:teamId', authenticateToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { limit } = req.query;

        const analytics = teamPlatformService.getTeamAnalytics(teamId);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: 'Team not found'
            });
        }

        const activity = {
            teamId,
            recentActivity: analytics.recentActivity.slice(0, parseInt(limit) || 20),
            generatedAt: new Date()
        };

        res.json({
            success: true,
            data: activity
        });

    } catch (error) {
        console.error('Error fetching team activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch team activity',
            details: error.message
        });
    }
});

module.exports = router;
