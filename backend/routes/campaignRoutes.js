const express = require('express');
const router = express.Router();
const Campaign = require('../models/campaignModel');
const authMiddleware = require('../middleware/auth');

// Get all campaigns (admin only)
router.get('/', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const { status, type, limit = 10, page = 1 } = req.query;

        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (type && type !== 'all') {
            query.type = type;
        }

        const campaigns = await Campaign.find(query)
            .populate('createdBy', 'username')
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Campaign.countDocuments(query);

        res.json({
            campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
    }
});

// Get single campaign
router.get('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const campaign = await Campaign.findById(req.params.id)
            .populate('createdBy', 'username')
            .populate('assignedTo', 'username')
            .populate('media');

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        res.json(campaign);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaign', error: error.message });
    }
});

// Create new campaign (admin only)
router.post('/', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const campaignData = {
            ...req.body,
            createdBy: req.user.id
        };

        const campaign = new Campaign(campaignData);
        await campaign.save();

        res.status(201).json({ message: 'Campaign created successfully', campaign });
    } catch (error) {
        res.status(500).json({ message: 'Error creating campaign', error: error.message });
    }
});

// Update campaign (admin only)
router.put('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        Object.assign(campaign, req.body);
        await campaign.save();

        res.json({ message: 'Campaign updated successfully', campaign });
    } catch (error) {
        res.status(500).json({ message: 'Error updating campaign', error: error.message });
    }
});

// Delete campaign (admin only)
router.delete('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        await Campaign.findByIdAndDelete(req.params.id);
        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting campaign', error: error.message });
    }
});

// Update campaign metrics
router.patch('/:id/metrics', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Update metrics
        if (req.body.metrics) {
            Object.assign(campaign.metrics, req.body.metrics);
        }

        await campaign.save();

        res.json({ message: 'Campaign metrics updated successfully', campaign });
    } catch (error) {
        res.status(500).json({ message: 'Error updating campaign metrics', error: error.message });
    }
});

// Get campaign analytics
router.get('/:id/analytics', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        const analytics = {
            campaign: campaign.title,
            status: campaign.status,
            metrics: campaign.metrics,
            ctr: campaign.ctr,
            conversionRate: campaign.conversionRate,
            budget: campaign.budget,
            schedule: campaign.schedule,
            performance: {
                budgetUtilization: campaign.budget.allocated > 0 ? (campaign.budget.spent / campaign.budget.allocated) * 100 : 0,
                roi: campaign.metrics.revenue > 0 && campaign.budget.spent > 0 ? (campaign.metrics.revenue / campaign.budget.spent) * 100 : 0
            }
        };

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaign analytics', error: error.message });
    }
});

module.exports = router;
