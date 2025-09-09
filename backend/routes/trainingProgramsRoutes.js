const express = require('express');
const router = express.Router();
const TrainingProgramsService = require('../services/trainingProgramsService');
const { authenticateToken } = require('../middleware/auth');

const trainingProgramsService = new TrainingProgramsService();

// Initialize service
trainingProgramsService.initialize().catch(console.error);

// POST /api/training-programs/generate
// Generate personalized training program
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { athleteId, sport, goals, experience, availability, preferences } = req.body;

        if (!athleteId || !sport || !goals) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID, sport, and goals are required'
            });
        }

        const program = await trainingProgramsService.generateProgram({
            athleteId,
            sport,
            goals,
            experience,
            availability,
            preferences
        });

        res.json({
            success: true,
            data: program
        });

    } catch (error) {
        console.error('Error generating training program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate training program',
            details: error.message
        });
    }
});

// GET /api/training-programs/athlete/:athleteId
// Get athlete's current program
router.get('/athlete/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;

        const program = trainingProgramsService.getAthleteProgram(athleteId);

        if (!program) {
            return res.status(404).json({
                success: false,
                error: 'No active program found for athlete'
            });
        }

        res.json({
            success: true,
            data: program
        });

    } catch (error) {
        console.error('Error fetching athlete program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch athlete program',
            details: error.message
        });
    }
});

// PUT /api/training-programs/progress
// Update program progress
router.put('/progress', authenticateToken, async (req, res) => {
    try {
        const { athleteId, sessionId, performanceData } = req.body;

        if (!athleteId || !sessionId || !performanceData) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID, session ID, and performance data are required'
            });
        }

        const program = await trainingProgramsService.updateProgramProgress(
            athleteId,
            sessionId,
            performanceData
        );

        res.json({
            success: true,
            data: program
        });

    } catch (error) {
        console.error('Error updating program progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update program progress',
            details: error.message
        });
    }
});

// GET /api/training-programs/recommendations/:athleteId
// Get program recommendations
router.get('/recommendations/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;

        const recommendations = trainingProgramsService.getProgramRecommendations(athleteId);

        res.json({
            success: true,
            data: recommendations
        });

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recommendations',
            details: error.message
        });
    }
});

// PUT /api/training-programs/modify/:programId
// Modify existing program
router.put('/modify/:programId', authenticateToken, async (req, res) => {
    try {
        const { programId } = req.params;
        const modifications = req.body;

        const program = await trainingProgramsService.modifyProgram(programId, modifications);

        res.json({
            success: true,
            data: program
        });

    } catch (error) {
        console.error('Error modifying program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to modify program',
            details: error.message
        });
    }
});

// GET /api/training-programs/analytics/:programId
// Get program analytics
router.get('/analytics/:programId', authenticateToken, async (req, res) => {
    try {
        const { programId } = req.params;

        const analytics = trainingProgramsService.getProgramAnalytics(programId);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: 'Program not found'
            });
        }

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Error fetching program analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch program analytics',
            details: error.message
        });
    }
});

// GET /api/training-programs/templates
// Get available program templates
router.get('/templates', authenticateToken, async (req, res) => {
    try {
        const templates = trainingProgramsService.getProgramTemplates();

        res.json({
            success: true,
            data: templates
        });

    } catch (error) {
        console.error('Error fetching program templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch program templates',
            details: error.message
        });
    }
});

// POST /api/training-programs/end/:athleteId
// End athlete's current program
router.post('/end/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;

        const program = trainingProgramsService.endProgram(athleteId);

        if (!program) {
            return res.status(404).json({
                success: false,
                error: 'No active program found for athlete'
            });
        }

        res.json({
            success: true,
            data: program,
            message: 'Program ended successfully'
        });

    } catch (error) {
        console.error('Error ending program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end program',
            details: error.message
        });
    }
});

// GET /api/training-programs/session/:programId/:week/:sessionNumber
// Get specific session details
router.get('/session/:programId/:week/:sessionNumber', authenticateToken, async (req, res) => {
    try {
        const { programId, week, sessionNumber } = req.params;

        // Get program
        const program = Array.from(trainingProgramsService.programs.values())
            .find(p => p.id === programId);

        if (!program) {
            return res.status(404).json({
                success: false,
                error: 'Program not found'
            });
        }

        // Find session
        const weekData = program.schedule.find(w => w.week === parseInt(week));
        if (!weekData) {
            return res.status(404).json({
                success: false,
                error: 'Week not found in program'
            });
        }

        const session = weekData.sessions.find(s => s.sessionNumber === parseInt(sessionNumber));
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found in program'
            });
        }

        res.json({
            success: true,
            data: {
                programId,
                week: parseInt(week),
                session: session
            }
        });

    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch session details',
            details: error.message
        });
    }
});

// POST /api/training-programs/log-session
// Log completed session
router.post('/log-session', authenticateToken, async (req, res) => {
    try {
        const { athleteId, sessionId, duration, exercises, notes } = req.body;

        if (!athleteId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID and session ID are required'
            });
        }

        // Get current program
        const program = trainingProgramsService.getAthleteProgram(athleteId);
        if (!program) {
            return res.status(404).json({
                success: false,
                error: 'No active program found for athlete'
            });
        }

        // Create performance data
        const performanceData = {
            duration: duration || 0,
            exercises: exercises || [],
            notes: notes || '',
            completedAt: new Date(),
            score: this.calculateSessionScore(exercises)
        };

        // Update progress
        const updatedProgram = await trainingProgramsService.updateProgramProgress(
            athleteId,
            sessionId,
            performanceData
        );

        res.json({
            success: true,
            data: {
                sessionId,
                performanceData,
                program: updatedProgram
            }
        });

    } catch (error) {
        console.error('Error logging session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log session',
            details: error.message
        });
    }
});

// Helper function to calculate session score
function calculateSessionScore(exercises) {
    if (!exercises || exercises.length === 0) return 0;

    let totalScore = 0;
    let exerciseCount = 0;

    exercises.forEach(exercise => {
        if (exercise.actualReps && exercise.targetReps) {
            const completionRate = exercise.actualReps / exercise.targetReps;
            totalScore += Math.min(completionRate * 100, 100);
            exerciseCount++;
        }
    });

    return exerciseCount > 0 ? totalScore / exerciseCount : 0;
}

// GET /api/training-programs/progress-history/:athleteId
// Get progress history for athlete
router.get('/progress-history/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { limit } = req.query;

        const program = trainingProgramsService.getAthleteProgram(athleteId);
        if (!program) {
            return res.status(404).json({
                success: false,
                error: 'No active program found for athlete'
            });
        }

        const progressHistory = trainingProgramsService.programProgress.get(program.id) || [];
        const recentProgress = progressHistory.slice(-(parseInt(limit) || 10));

        res.json({
            success: true,
            data: {
                programId: program.id,
                programName: program.name,
                progressHistory: recentProgress,
                totalEntries: progressHistory.length
            }
        });

    } catch (error) {
        console.error('Error fetching progress history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch progress history',
            details: error.message
        });
    }
});

// POST /api/training-programs/create-custom
// Create custom training program
router.post('/create-custom', authenticateToken, async (req, res) => {
    try {
        const { athleteId, name, description, duration, sessionsPerWeek, schedule } = req.body;

        if (!athleteId || !name || !schedule) {
            return res.status(400).json({
                success: false,
                error: 'Athlete ID, name, and schedule are required'
            });
        }

        // Create custom program
        const program = {
            id: `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            athleteId,
            templateId: 'custom',
            name,
            description: description || '',
            category: 'custom',
            difficulty: 'intermediate',
            duration: duration || schedule.length,
            sessionsPerWeek: sessionsPerWeek || 3,
            goals: ['custom goals'],
            schedule: schedule,
            progress: {
                currentWeek: 1,
                completedSessions: 0,
                totalSessions: schedule.reduce((sum, week) => sum + week.sessions.length, 0),
                overallProgress: 0,
                performanceMetrics: {}
            },
            createdAt: new Date(),
            status: 'active'
        };

        // Store program
        trainingProgramsService.programs.set(program.id, program);
        trainingProgramsService.athletePrograms.set(athleteId, program.id);

        res.json({
            success: true,
            data: program
        });

    } catch (error) {
        console.error('Error creating custom program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create custom program',
            details: error.message
        });
    }
});

// GET /api/training-programs/compare-programs
// Compare two programs
router.post('/compare-programs', authenticateToken, async (req, res) => {
    try {
        const { programId1, programId2 } = req.body;

        if (!programId1 || !programId2) {
            return res.status(400).json({
                success: false,
                error: 'Two program IDs are required for comparison'
            });
        }

        const program1 = trainingProgramsService.programs.get(programId1);
        const program2 = trainingProgramsService.programs.get(programId2);

        if (!program1 || !program2) {
            return res.status(404).json({
                success: false,
                error: 'One or both programs not found'
            });
        }

        const comparison = {
            program1: {
                id: program1.id,
                name: program1.name,
                duration: program1.duration,
                sessionsPerWeek: program1.sessionsPerWeek,
                difficulty: program1.difficulty,
                progress: program1.progress.overallProgress
            },
            program2: {
                id: program2.id,
                name: program2.name,
                duration: program2.duration,
                sessionsPerWeek: program2.sessionsPerWeek,
                difficulty: program2.difficulty,
                progress: program2.progress.overallProgress
            },
            differences: {
                duration: program2.duration - program1.duration,
                sessionsPerWeek: program2.sessionsPerWeek - program1.sessionsPerWeek,
                progress: program2.progress.overallProgress - program1.progress.overallProgress
            }
        };

        res.json({
            success: true,
            data: comparison
        });

    } catch (error) {
        console.error('Error comparing programs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare programs',
            details: error.message
        });
    }
});

// GET /api/training-programs/health
// Get service health status
router.get('/health', authenticateToken, async (req, res) => {
    try {
        const health = {
            service: 'Training Programs',
            status: trainingProgramsService.isInitialized ? 'healthy' : 'unhealthy',
            activePrograms: trainingProgramsService.programs.size,
            totalAthletes: trainingProgramsService.athletePrograms.size,
            availableTemplates: trainingProgramsService.programTemplates.size,
            uptime: process.uptime(),
            timestamp: new Date()
        };

        res.json({
            success: true,
            data: health
        });

    } catch (error) {
        console.error('Error fetching service health:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service health',
            details: error.message
        });
    }
});

module.exports = router;
