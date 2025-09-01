const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { validatePerformanceData, sanitizeInput } = require('../middleware/validation');

// Mock performance data - in a real app, this would come from a database
const mockPerformanceData = [
    {
        id: 1,
        title: 'Total Distance',
        value: '45.2 km',
        change: '+5.2%',
        trend: 'up'
    },
    {
        id: 2,
        title: 'Average Speed',
        value: '8.5 km/h',
        change: '+2.1%',
        trend: 'up'
    },
    {
        id: 3,
        title: 'Training Sessions',
        value: '24',
        change: '+15%',
        trend: 'up'
    },
    {
        id: 4,
        title: 'Personal Best',
        value: '12.3 km',
        change: 'New Record!',
        trend: 'up'
    },
    {
        id: 5,
        title: 'Calories Burned',
        value: '2,450',
        change: '+8.3%',
        trend: 'up'
    },
    {
        id: 6,
        title: 'Heart Rate Avg',
        value: '145 bpm',
        change: '-3.2%',
        trend: 'down'
    }
];

// Get user performance data
router.get('/', authMiddleware.verifyToken, (req, res) => {
    try {
        // In a real app, filter by user ID from token
        res.json({
            success: true,
            data: mockPerformanceData,
            userId: req.user?.id || 'demo-user'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching performance data',
            error: error.message
        });
    }
});

// Log new performance data
router.post('/', authMiddleware.verifyToken, sanitizeInput, validatePerformanceData, (req, res) => {
    try {
        const { metrics, workout, notes } = req.body;

        // In a real app, save to database
        const newPerformance = {
            id: Date.now(),
            userId: req.user?.id || 'demo-user',
            date: new Date(),
            metrics,
            workout,
            notes,
            createdAt: new Date()
        };

        res.status(201).json({
            success: true,
            message: 'Performance data logged successfully',
            data: newPerformance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error logging performance data',
            error: error.message
        });
    }
});

// Get performance analytics
router.get('/analytics', authMiddleware.verifyToken, (req, res) => {
    try {
        // Mock analytics data
        const analytics = {
            weeklyProgress: [
                { day: 'Mon', distance: 5.2, sessions: 1 },
                { day: 'Tue', distance: 6.8, sessions: 1 },
                { day: 'Wed', distance: 4.9, sessions: 1 },
                { day: 'Thu', distance: 7.2, sessions: 1 },
                { day: 'Fri', distance: 5.5, sessions: 1 },
                { day: 'Sat', distance: 8.1, sessions: 2 },
                { day: 'Sun', distance: 7.5, sessions: 1 }
            ],
            monthlyStats: {
                totalDistance: 45.2,
                totalSessions: 24,
                averageSpeed: 8.5,
                bestPerformance: 12.3
            },
            goals: {
                weeklyDistance: 35,
                weeklySessions: 5,
                monthlyDistance: 150
            }
        };

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
});

// Update performance goals
router.put('/goals', authMiddleware.verifyToken, (req, res) => {
    try {
        const { weeklyDistance, weeklySessions, monthlyDistance } = req.body;

        // In a real app, save goals to database
        const goals = {
            weeklyDistance: weeklyDistance || 35,
            weeklySessions: weeklySessions || 5,
            monthlyDistance: monthlyDistance || 150,
            updatedAt: new Date()
        };

        res.json({
            success: true,
            message: 'Goals updated successfully',
            data: goals
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating goals',
            error: error.message
        });
    }
});

module.exports = router;
