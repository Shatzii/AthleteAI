const express = require('express');
const router = express.Router();
const Page = require('../models/pageModel');
const authMiddleware = require('../middleware/auth');

// Get all pages (public for published pages)
router.get('/', async (req, res) => {
    try {
        const { template, isPublished = true } = req.query;

        let query = { isPublished };
        if (template) {
            query.template = template;
        }

        const pages = await Page.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.json(pages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pages', error: error.message });
    }
});

// Get single page by slug (public)
router.get('/:slug', async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug, isPublished: true })
            .populate('author', 'username');

        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        res.json(page);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching page', error: error.message });
    }
});

// Get page by ID (admin only)
router.get('/admin/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const page = await Page.findById(req.params.id)
            .populate('author', 'username');

        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        res.json(page);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching page', error: error.message });
    }
});

// Create new page (admin only)
router.post('/', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const pageData = {
            ...req.body,
            author: req.user.id
        };

        const page = new Page(pageData);
        await page.save();

        res.status(201).json({ message: 'Page created successfully', page });
    } catch (error) {
        res.status(500).json({ message: 'Error creating page', error: error.message });
    }
});

// Update page (admin only)
router.put('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        Object.assign(page, req.body);
        await page.save();

        res.json({ message: 'Page updated successfully', page });
    } catch (error) {
        res.status(500).json({ message: 'Error updating page', error: error.message });
    }
});

// Delete page (admin only)
router.delete('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const page = await Page.findById(req.params.id);
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        await Page.findByIdAndDelete(req.params.id);
        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting page', error: error.message });
    }
});

// Get all pages for admin (including drafts)
router.get('/admin/all', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const pages = await Page.find({})
            .populate('author', 'username')
            .sort({ updatedAt: -1 });

        res.json(pages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pages', error: error.message });
    }
});

module.exports = router;
