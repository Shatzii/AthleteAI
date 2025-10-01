const express = require('express');
const router = express.Router();
const ComputerVisionService = require('../services/computerVisionService');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const computerVisionService = new ComputerVisionService();

// Configure multer for video upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/videos');
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video files are allowed.'));
        }
    }
});

// Initialize service
computerVisionService.initialize().catch(console.error);

// POST /api/computer-vision/analyze
// Analyze video for technique
router.post('/analyze', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No video file provided'
            });
        }

        const { sport, position, athleteId } = req.body;

        if (!sport || !position) {
            return res.status(400).json({
                success: false,
                error: 'Sport and position are required'
            });
        }

        // Start analysis
        const analysis = await computerVisionService.analyzeTechnique(
            req.file.path,
            sport,
            position,
            athleteId || req.user?.id
        );

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('Error in video analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze video',
            details: error.message
        });
    }
});

// GET /api/computer-vision/history/:athleteId
// Get analysis history for athlete
router.get('/history/:athleteId', authenticateToken, async (req, res) => {
    try {
        const { athleteId } = req.params;
        const { sport, position, limit } = req.query;

        const history = await computerVisionService.getAnalysisHistory(
            athleteId,
            sport,
            position,
            parseInt(limit) || 10
        );

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Error fetching analysis history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analysis history',
            details: error.message
        });
    }
});

// POST /api/computer-vision/compare
// Compare athlete with benchmarks
router.post('/compare', authenticateToken, async (req, res) => {
    try {
        const { analysis, sport, position } = req.body;

        if (!analysis || !sport || !position) {
            return res.status(400).json({
                success: false,
                error: 'Analysis data, sport, and position are required'
            });
        }

        const comparison = await computerVisionService.compareWithBenchmarks(
            analysis,
            sport,
            position
        );

        res.json({
            success: true,
            data: comparison
        });

    } catch (error) {
        console.error('Error comparing with benchmarks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare with benchmarks',
            details: error.message
        });
    }
});

// GET /api/computer-vision/sports
// Get supported sports and positions
router.get('/sports', authenticateToken, async (req, res) => {
    try {
        const sports = {
            football: {
                name: 'Football',
                positions: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'],
                techniques: {
                    QB: ['throwing_motion', 'footwork', 'release_point'],
                    RB: ['running_form', 'cutting_technique', 'contact_balance'],
                    WR: ['route_running', 'catching_technique', 'release_moves']
                }
            },
            basketball: {
                name: 'Basketball',
                positions: ['PG', 'SG', 'SF', 'PF', 'C'],
                techniques: {
                    PG: ['dribbling', 'shooting_form', 'defense_stance'],
                    SG: ['shooting', 'ball_handling', 'perimeter_defense']
                }
            },
            baseball: {
                name: 'Baseball',
                positions: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
                techniques: {
                    P: ['pitching_motion', 'release_point', 'follow_through'],
                    C: ['catching_technique', 'throwing_motion', 'blocking']
                }
            },
            soccer: {
                name: 'Soccer',
                positions: ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LW', 'RW', 'ST'],
                techniques: {
                    GK: ['diving_save', 'distribution', 'positioning'],
                    ST: ['shooting_technique', 'heading', 'first_touch']
                }
            },
            tennis: {
                name: 'Tennis',
                positions: ['Singles', 'Doubles'],
                techniques: {
                    Singles: ['forehand', 'backhand', 'serve', 'volley'],
                    Doubles: ['forehand', 'backhand', 'serve', 'overhead']
                }
            }
        };

        res.json({
            success: true,
            data: sports
        });

    } catch (error) {
        console.error('Error fetching sports data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sports data',
            details: error.message
        });
    }
});

// GET /api/computer-vision/metrics/:sport/:position
// Get performance metrics for sport and position
router.get('/metrics/:sport/:position', authenticateToken, async (req, res) => {
    try {
        const { sport, position } = req.params;

        const metrics = {
            football: {
                QB: ['arm_angle', 'release_height', 'follow_through', 'foot_position', 'hip_rotation'],
                RB: ['stride_length', 'ground_contact_time', 'vertical_displacement', 'arm_carry'],
                WR: ['route_efficiency', 'catch_radius', 'release_time', 'separation_distance']
            },
            basketball: {
                PG: ['shooting_arc', 'ball_control', 'court_vision', 'decision_speed'],
                C: ['rebound_positioning', 'shot_blocking', 'post_moves', 'screen_setting']
            },
            baseball: {
                P: ['pitch_velocity', 'spin_rate', 'release_angle', 'arm_slot'],
                C: ['pop_time', 'throwing_velocity', 'framing_technique', 'blocking_efficiency']
            }
        };

        const sportMetrics = metrics[sport]?.[position] || [];

        res.json({
            success: true,
            data: {
                sport,
                position,
                metrics: sportMetrics,
                descriptions: sportMetrics.map(metric => ({
                    name: metric,
                    description: getMetricDescription(metric),
                    unit: getMetricUnit(metric),
                    normalRange: getMetricRange(metric, sport, position)
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metrics',
            details: error.message
        });
    }
});

// Helper functions
function getMetricDescription(metric) {
    const descriptions = {
        arm_angle: 'Angle of the arm during throwing motion',
        release_height: 'Height at which the ball is released',
        shooting_arc: 'Arc of the ball during shooting motion',
        stride_length: 'Length of each running stride',
        pitch_velocity: 'Speed of the pitched ball'
    };
    return descriptions[metric] || 'Performance metric for technique analysis';
}

function getMetricUnit(metric) {
    const units = {
        arm_angle: 'degrees',
        release_height: 'cm',
        shooting_arc: 'degrees',
        stride_length: 'cm',
        pitch_velocity: 'mph'
    };
    return units[metric] || 'units';
}

function getMetricRange(metric, sport, position) {
    const ranges = {
        arm_angle: { min: 80, max: 110 },
        release_height: { min: 160, max: 190 },
        shooting_arc: { min: 45, max: 55 },
        stride_length: { min: 200, max: 250 },
        pitch_velocity: { min: 85, max: 95 }
    };
    return ranges[metric] || { min: 0, max: 100 };
}

// POST /api/computer-vision/batch-analyze
// Analyze multiple videos in batch
router.post('/batch-analyze', authenticateToken, upload.array('videos', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No video files provided'
            });
        }

        const { sport, position, athleteId } = req.body;

        if (!sport || !position) {
            return res.status(400).json({
                success: false,
                error: 'Sport and position are required'
            });
        }

        // Process videos in parallel with concurrency limit
        const concurrencyLimit = 2;
        const results = [];

        for (let i = 0; i < req.files.length; i += concurrencyLimit) {
            const batch = req.files.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(async (file) => {
                try {
                    const analysis = await computerVisionService.analyzeTechnique(
                        file.path,
                        sport,
                        position,
                        athleteId || req.user?.id
                    );
                    return {
                        file: file.originalname,
                        success: true,
                        analysis
                    };
                } catch (error) {
                    return {
                        file: file.originalname,
                        success: false,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        res.json({
            success: true,
            data: {
                totalVideos: req.files.length,
                processedVideos: results.length,
                successfulAnalyses: results.filter(r => r.success).length,
                failedAnalyses: results.filter(r => !r.success).length,
                results
            }
        });

    } catch (error) {
        console.error('Error in batch analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process video batch',
            details: error.message
        });
    }
});

module.exports = router;
