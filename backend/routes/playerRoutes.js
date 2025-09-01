const express = require('express');
const router = express.Router();
const Player = require('../models/playerModel');
const authMiddleware = require('../middleware/auth').authenticateToken;

// Get all players
router.get('/', async (req, res) => {
    try {
        const players = await Player.find().sort({ garScore: -1 });
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get player by ID
router.get('/:id', async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json(player);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new player
router.post('/', authMiddleware, async (req, res) => {
    const player = new Player({
        name: req.body.name,
        position: req.body.position,
        team: req.body.team,
        school: req.body.school,
        year: req.body.year,
        height: req.body.height,
        weight: req.body.weight,
        garScore: req.body.garScore || 0,
        stars: req.body.stars || 0,
        profileImage: req.body.profileImage,
        stats: req.body.stats || {},
        achievements: req.body.achievements || []
    });

    try {
        const newPlayer = await player.save();
        res.status(201).json(newPlayer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update player
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                player[key] = req.body[key];
            }
        });

        player.updatedAt = Date.now();
        const updatedPlayer = await player.save();
        res.json(updatedPlayer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete player
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        await player.remove();
        res.json({ message: 'Player deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get players by position
router.get('/position/:position', async (req, res) => {
    try {
        const players = await Player.find({ position: req.params.position }).sort({ garScore: -1 });
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get top players by GAR score
router.get('/top/:limit', async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 10;
        const players = await Player.find().sort({ garScore: -1 }).limit(limit);
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update player stats and recalculate GAR
router.put('/:id/stats', authMiddleware, async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Update stats
        player.stats = { ...player.stats, ...req.body };
        player.calculateGAR(player.stats);

        const updatedPlayer = await player.save();
        res.json(updatedPlayer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
