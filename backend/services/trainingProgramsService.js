const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// Training Programs Service for automated program generation and management
class TrainingProgramsService {
    constructor() {
        this.programs = new Map();
        this.programTemplates = new Map();
        this.athletePrograms = new Map();
        this.programProgress = new Map();
        this.isInitialized = false;
    }

    // Initialize the service
    async initialize() {
        try {
            logger.info('Initializing Training Programs Service...');

            // Initialize program templates
            this.initializeProgramTemplates();

            // Set up program generation algorithms
            this.setupProgramGeneration();

            // Initialize progress tracking
            this.setupProgressTracking();

            this.isInitialized = true;
            logger.info('Training Programs Service initialized successfully');

        } catch (error) {
            logger.error('Failed to initialize Training Programs Service:', error);
            throw error;
        }
    }

    // Initialize program templates
    initializeProgramTemplates() {
        // Strength Training Template
        this.programTemplates.set('strength_basic', {
            id: 'strength_basic',
            name: 'Basic Strength Training',
            category: 'strength',
            difficulty: 'beginner',
            duration: 8, // weeks
            sessionsPerWeek: 3,
            focus: ['strength', 'muscle-building'],
            phases: [
                {
                    name: 'Foundation',
                    weeks: [1, 2],
                    focus: 'Form and technique',
                    intensity: 60
                },
                {
                    name: 'Build',
                    weeks: [3, 4, 5, 6],
                    focus: 'Progressive overload',
                    intensity: 75
                },
                {
                    name: 'Peak',
                    weeks: [7, 8],
                    focus: 'Max strength',
                    intensity: 85
                }
            ]
        });

        // Endurance Training Template
        this.programTemplates.set('endurance_cardio', {
            id: 'endurance_cardio',
            name: 'Cardio Endurance Training',
            category: 'endurance',
            difficulty: 'intermediate',
            duration: 12,
            sessionsPerWeek: 4,
            focus: ['cardio', 'endurance'],
            phases: [
                {
                    name: 'Base Building',
                    weeks: [1, 2, 3],
                    focus: 'Build aerobic base',
                    intensity: 65
                },
                {
                    name: 'Tempo Training',
                    weeks: [4, 5, 6, 7],
                    focus: 'Improve lactate threshold',
                    intensity: 80
                },
                {
                    name: 'Race Pace',
                    weeks: [8, 9, 10],
                    focus: 'Race-specific training',
                    intensity: 90
                },
                {
                    name: 'Taper',
                    weeks: [11, 12],
                    focus: 'Peak performance',
                    intensity: 70
                }
            ]
        });

        // Sports-Specific Template
        this.programTemplates.set('sports_football', {
            id: 'sports_football',
            name: 'Football Performance Training',
            category: 'sports-specific',
            difficulty: 'advanced',
            duration: 10,
            sessionsPerWeek: 5,
            focus: ['agility', 'power', 'endurance', 'technique'],
            phases: [
                {
                    name: 'Pre-Season',
                    weeks: [1, 2, 3],
                    focus: 'Build foundation',
                    intensity: 70
                },
                {
                    name: 'In-Season',
                    weeks: [4, 5, 6, 7, 8],
                    focus: 'Maintain performance',
                    intensity: 75
                },
                {
                    name: 'Off-Season',
                    weeks: [9, 10],
                    focus: 'Recovery and rebuilding',
                    intensity: 60
                }
            ]
        });

        logger.info(`Initialized ${this.programTemplates.size} program templates`);
    }

    // Set up program generation algorithms
    setupProgramGeneration() {
        this.generationRules = {
            strength: {
                exercises: ['squat', 'deadlift', 'bench_press', 'overhead_press', 'pull_ups'],
                progression: 'linear',
                restPeriods: { beginner: 120, intermediate: 90, advanced: 60 }
            },
            endurance: {
                exercises: ['running', 'cycling', 'swimming', 'rowing'],
                progression: 'periodized',
                restPeriods: { beginner: 60, intermediate: 45, advanced: 30 }
            },
            sports_specific: {
                exercises: ['agility_drills', 'plyometrics', 'sport_specific_drills'],
                progression: 'block',
                restPeriods: { beginner: 90, intermediate: 60, advanced: 45 }
            }
        };
    }

    // Set up progress tracking
    setupProgressTracking() {
        this.progressMetrics = {
            strength: ['weight', 'reps', 'sets'],
            endurance: ['distance', 'time', 'pace'],
            sports_specific: ['technique_score', 'performance_time', 'accuracy']
        };
    }

    // Generate personalized training program
    async generateProgram(athleteData) {
        try {
            const { athleteId, sport, goals, experience, availability, preferences } = athleteData;

            if (!athleteId || !sport || !goals) {
                throw new Error('Athlete ID, sport, and goals are required');
            }

            // Analyze athlete profile
            const athleteProfile = await this.analyzeAthleteProfile(athleteData);

            // Select appropriate template
            const template = this.selectProgramTemplate(athleteProfile);

            // Customize program based on athlete data
            const customizedProgram = await this.customizeProgram(template, athleteProfile);

            // Generate weekly schedule
            const schedule = this.generateWeeklySchedule(customizedProgram, availability);

            // Create program object
            const program = {
                id: `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                athleteId,
                templateId: template.id,
                name: customizedProgram.name,
                description: customizedProgram.description,
                category: template.category,
                difficulty: customizedProgram.difficulty,
                duration: customizedProgram.duration,
                sessionsPerWeek: customizedProgram.sessionsPerWeek,
                goals: goals,
                schedule: schedule,
                progress: {
                    currentWeek: 1,
                    completedSessions: 0,
                    totalSessions: customizedProgram.duration * customizedProgram.sessionsPerWeek,
                    overallProgress: 0,
                    performanceMetrics: {}
                },
                createdAt: new Date(),
                status: 'active'
            };

            // Store program
            this.programs.set(program.id, program);
            this.athletePrograms.set(athleteId, program.id);

            logger.info(`Generated training program ${program.id} for athlete ${athleteId}`);
            return program;

        } catch (error) {
            logger.error('Error generating training program:', error);
            throw error;
        }
    }

    // Analyze athlete profile
    async analyzeAthleteProfile(athleteData) {
        // In a real implementation, this would analyze historical data
        // For demo purposes, return mock analysis
        return {
            experienceLevel: athleteData.experience || 'intermediate',
            fitnessLevel: 'good',
            strengths: ['cardio', 'flexibility'],
            weaknesses: ['upper_body_strength'],
            trainingHistory: [],
            injuryHistory: [],
            preferences: athleteData.preferences || {}
        };
    }

    // Select program template
    selectProgramTemplate(athleteProfile) {
        const { sport, goals, experienceLevel } = athleteProfile;

        // Simple template selection logic
        if (goals.includes('strength')) {
            return this.programTemplates.get('strength_basic');
        } else if (goals.includes('endurance')) {
            return this.programTemplates.get('endurance_cardio');
        } else if (sport === 'football') {
            return this.programTemplates.get('sports_football');
        } else {
            return this.programTemplates.get('strength_basic'); // Default
        }
    }

    // Customize program based on athlete profile
    async customizeProgram(template, athleteProfile) {
        const customized = { ...template };

        // Adjust difficulty based on experience
        if (athleteProfile.experienceLevel === 'beginner') {
            customized.difficulty = 'beginner';
            customized.sessionsPerWeek = Math.max(2, customized.sessionsPerWeek - 1);
        } else if (athleteProfile.experienceLevel === 'advanced') {
            customized.difficulty = 'advanced';
            customized.intensity = Math.min(100, customized.intensity + 10);
        }

        // Adjust for weaknesses
        if (athleteProfile.weaknesses.includes('upper_body_strength')) {
            customized.focus.push('upper_body_development');
        }

        // Adjust for preferences
        if (athleteProfile.preferences?.equipment === 'minimal') {
            customized.equipmentRequired = 'bodyweight';
        }

        return customized;
    }

    // Generate weekly schedule
    generateWeeklySchedule(program, availability) {
        const schedule = [];
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        for (let week = 1; week <= program.duration; week++) {
            const weekSchedule = {
                week,
                sessions: []
            };

            // Generate sessions for this week
            for (let session = 1; session <= program.sessionsPerWeek; session++) {
                const sessionData = this.generateSession(program, week, session);
                weekSchedule.sessions.push(sessionData);
            }

            schedule.push(weekSchedule);
        }

        return schedule;
    }

    // Generate individual session
    generateSession(program, week, sessionNumber) {
        const phase = this.getCurrentPhase(program, week);
        const exercises = this.selectExercises(program.category, phase, program.difficulty);

        return {
            id: `session_${week}_${sessionNumber}`,
            week,
            sessionNumber,
            name: `Week ${week} - Session ${sessionNumber}`,
            phase: phase.name,
            duration: 60, // minutes
            exercises: exercises,
            intensity: phase.intensity,
            restDays: this.calculateRestDays(week, sessionNumber, program.sessionsPerWeek)
        };
    }

    // Get current phase for a week
    getCurrentPhase(program, week) {
        for (const phase of program.phases) {
            if (phase.weeks.includes(week)) {
                return phase;
            }
        }
        return program.phases[0]; // Default to first phase
    }

    // Select exercises for session
    selectExercises(category, phase, difficulty) {
        const categoryRules = this.generationRules[category] || this.generationRules.strength;
        const exercisePool = categoryRules.exercises;

        // Select 4-6 exercises based on difficulty
        const exerciseCount = difficulty === 'beginner' ? 4 : difficulty === 'advanced' ? 6 : 5;
        const selectedExercises = [];

        for (let i = 0; i < exerciseCount; i++) {
            const exercise = exercisePool[i % exercisePool.length];
            selectedExercises.push({
                name: exercise,
                sets: difficulty === 'beginner' ? 3 : 4,
                reps: this.getRepRange(difficulty, i),
                rest: categoryRules.restPeriods[difficulty] || 60,
                notes: `Focus on proper form during ${phase.focus.toLowerCase()}`
            });
        }

        return selectedExercises;
    }

    // Get rep range based on difficulty
    getRepRange(difficulty, exerciseIndex) {
        const repRanges = {
            beginner: ['12-15', '10-12', '8-10', '15-20', '20-25', '25-30'],
            intermediate: ['8-12', '8-10', '6-8', '12-15', '15-20', '20-25'],
            advanced: ['4-6', '6-8', '3-5', '8-10', '10-12', '12-15']
        };

        return repRanges[difficulty][exerciseIndex] || repRanges[difficulty][0];
    }

    // Calculate rest days
    calculateRestDays(week, sessionNumber, sessionsPerWeek) {
        // Simple rest day calculation
        const totalDays = 7;
        const restDays = totalDays - sessionsPerWeek;

        if (restDays <= 0) return 0;

        // Distribute rest days evenly
        return Math.floor(restDays / sessionsPerWeek);
    }

    // Get athlete's current program
    getAthleteProgram(athleteId) {
        const programId = this.athletePrograms.get(athleteId);
        if (!programId) {
            return null;
        }

        return this.programs.get(programId);
    }

    // Update program progress
    async updateProgramProgress(athleteId, sessionId, performanceData) {
        try {
            const program = this.getAthleteProgram(athleteId);
            if (!program) {
                throw new Error('No active program found for athlete');
            }

            // Find the session
            let targetSession = null;
            for (const week of program.schedule) {
                targetSession = week.sessions.find(s => s.id === sessionId);
                if (targetSession) break;
            }

            if (!targetSession) {
                throw new Error('Session not found in program');
            }

            // Update session with performance data
            targetSession.completed = true;
            targetSession.completedAt = new Date();
            targetSession.performance = performanceData;

            // Update overall progress
            program.progress.completedSessions++;
            program.progress.overallProgress = (program.progress.completedSessions / program.progress.totalSessions) * 100;

            // Update current week if needed
            const completedWeeks = Math.floor(program.progress.completedSessions / program.sessionsPerWeek);
            program.progress.currentWeek = Math.max(1, completedWeeks + 1);

            // Store progress data
            if (!this.programProgress.has(program.id)) {
                this.programProgress.set(program.id, []);
            }
            this.programProgress.get(program.id).push({
                sessionId,
                performanceData,
                timestamp: new Date()
            });

            logger.info(`Updated progress for program ${program.id}, session ${sessionId}`);
            return program;

        } catch (error) {
            logger.error('Error updating program progress:', error);
            throw error;
        }
    }

    // Get program recommendations
    getProgramRecommendations(athleteId) {
        const currentProgram = this.getAthleteProgram(athleteId);

        if (!currentProgram) {
            return {
                recommendations: [
                    'Start with a beginner program to build foundation',
                    'Consider your goals and availability when selecting a program',
                    'Consult with a coach for personalized recommendations'
                ]
            };
        }

        const recommendations = [];

        // Analyze current progress
        const progress = currentProgram.progress;

        if (progress.overallProgress < 50) {
            recommendations.push('Keep up the great work! You\'re making good progress.');
        } else if (progress.overallProgress < 80) {
            recommendations.push('You\'re in the home stretch! Focus on maintaining consistency.');
        } else {
            recommendations.push('Congratulations on nearing completion! Consider starting a new program.');
        }

        // Check for performance trends
        const recentSessions = this.programProgress.get(currentProgram.id) || [];
        if (recentSessions.length >= 3) {
            const recentPerformance = recentSessions.slice(-3);
            const improving = this.analyzePerformanceTrend(recentPerformance);

            if (improving) {
                recommendations.push('Your performance is improving! Keep pushing your limits.');
            } else {
                recommendations.push('Consider adjusting intensity or form. Track your progress carefully.');
            }
        }

        return { recommendations };
    }

    // Analyze performance trend
    analyzePerformanceTrend(sessions) {
        // Simple trend analysis - check if performance is generally improving
        let improvingCount = 0;
        let totalCount = 0;

        for (let i = 1; i < sessions.length; i++) {
            const current = sessions[i].performanceData;
            const previous = sessions[i-1].performanceData;

            // Compare key metrics (simplified)
            if (current.weight > previous.weight || current.reps > previous.reps) {
                improvingCount++;
            }
            totalCount++;
        }

        return improvingCount > totalCount / 2;
    }

    // Modify program
    async modifyProgram(programId, modifications) {
        try {
            const program = this.programs.get(programId);
            if (!program) {
                throw new Error('Program not found');
            }

            // Apply modifications
            if (modifications.name) program.name = modifications.name;
            if (modifications.duration) program.duration = modifications.duration;
            if (modifications.sessionsPerWeek) program.sessionsPerWeek = modifications.sessionsPerWeek;
            if (modifications.goals) program.goals = modifications.goals;

            // Regenerate schedule if needed
            if (modifications.duration || modifications.sessionsPerWeek) {
                program.schedule = this.generateWeeklySchedule(program, modifications.availability);
                program.progress.totalSessions = program.duration * program.sessionsPerWeek;
            }

            program.modifiedAt = new Date();

            logger.info(`Modified program ${programId}`);
            return program;

        } catch (error) {
            logger.error('Error modifying program:', error);
            throw error;
        }
    }

    // Get program analytics
    getProgramAnalytics(programId) {
        const program = this.programs.get(programId);
        if (!program) {
            return null;
        }

        const progressData = this.programProgress.get(programId) || [];

        return {
            programId,
            programName: program.name,
            totalSessions: program.progress.totalSessions,
            completedSessions: program.progress.completedSessions,
            overallProgress: program.progress.overallProgress,
            currentWeek: program.progress.currentWeek,
            averagePerformance: this.calculateAveragePerformance(progressData),
            completionRate: this.calculateCompletionRate(program),
            trends: this.analyzeProgressTrends(progressData)
        };
    }

    // Calculate average performance
    calculateAveragePerformance(progressData) {
        if (progressData.length === 0) return 0;

        const totalPerformance = progressData.reduce((sum, session) => {
            return sum + (session.performanceData.score || 0);
        }, 0);

        return totalPerformance / progressData.length;
    }

    // Calculate completion rate
    calculateCompletionRate(program) {
        const expectedSessions = program.progress.currentWeek * program.sessionsPerWeek;
        const actualSessions = program.progress.completedSessions;

        return Math.min(100, (actualSessions / expectedSessions) * 100);
    }

    // Analyze progress trends
    analyzeProgressTrends(progressData) {
        if (progressData.length < 2) {
            return { trend: 'insufficient_data' };
        }

        const recent = progressData.slice(-5);
        const scores = recent.map(p => p.performanceData.score || 0);

        // Simple linear trend
        let trend = 'stable';
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg * 1.05) {
            trend = 'improving';
        } else if (secondAvg < firstAvg * 0.95) {
            trend = 'declining';
        }

        return {
            trend,
            recentAverage: secondAvg,
            changePercent: ((secondAvg - firstAvg) / firstAvg) * 100
        };
    }

    // Get all available templates
    getProgramTemplates() {
        return Array.from(this.programTemplates.values()).map(template => ({
            id: template.id,
            name: template.name,
            category: template.category,
            difficulty: template.difficulty,
            duration: template.duration,
            sessionsPerWeek: template.sessionsPerWeek,
            focus: template.focus
        }));
    }

    // End program
    endProgram(athleteId) {
        const programId = this.athletePrograms.get(athleteId);
        if (!programId) {
            return null;
        }

        const program = this.programs.get(programId);
        if (program) {
            program.status = 'completed';
            program.completedAt = new Date();
        }

        this.athletePrograms.delete(athleteId);

        logger.info(`Ended program ${programId} for athlete ${athleteId}`);
        return program;
    }

    // Clean up old data
    cleanup() {
        const cutoffTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago

        // Clean up old programs
        for (const [programId, program] of this.programs.entries()) {
            if (program.status === 'completed' && program.completedAt < cutoffTime) {
                this.programs.delete(programId);
                this.programProgress.delete(programId);
            }
        }

        logger.info('Training Programs Service cleanup completed');
    }
}

module.exports = TrainingProgramsService;
