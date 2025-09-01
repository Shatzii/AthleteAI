const express = require('express');
const router = express.Router();
const Article = require('../models/articleModel');
const authMiddleware = require('../middleware/auth');

// Get all articles (public)
router.get('/', async (req, res) => {
    try {
        const { category, status, limit = 10, page = 1, search } = req.query;

        let query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const articles = await Article.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Article.countDocuments(query);

        res.json({
            articles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching articles', error: error.message });
    }
});

// Get single article by slug (public)
router.get('/:slug', async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug })
            .populate('author', 'username')
            .populate('comments.user', 'username');

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // Increment view count
        article.views += 1;
        await article.save();

        res.json(article);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching article', error: error.message });
    }
});

// Create new article (admin only)
router.post('/', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const articleData = {
            ...req.body,
            author: req.user.id
        };

        const article = new Article(articleData);
        await article.save();

        res.status(201).json({ message: 'Article created successfully', article });
    } catch (error) {
        res.status(500).json({ message: 'Error creating article', error: error.message });
    }
});

// Update article (admin only)
router.put('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // Check if user is the author or admin
        if (article.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only edit your own articles.' });
        }

        Object.assign(article, req.body);
        await article.save();

        res.json({ message: 'Article updated successfully', article });
    } catch (error) {
        res.status(500).json({ message: 'Error updating article', error: error.message });
    }
});

// Delete article (admin only)
router.delete('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        await Article.findByIdAndDelete(req.params.id);
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting article', error: error.message });
    }
});

// Add comment to article (authenticated users)
router.post('/:id/comments', authMiddleware.verifyToken, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const comment = {
            user: req.user.id,
            content: req.body.content
        };

        article.comments.push(comment);
        await article.save();

        res.status(201).json({ message: 'Comment added successfully', comment });
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
});

// Like article
router.post('/:id/like', authMiddleware.verifyToken, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        article.likes += 1;
        await article.save();

        res.json({ message: 'Article liked successfully', likes: article.likes });
    } catch (error) {
        res.status(500).json({ message: 'Error liking article', error: error.message });
    }
});

module.exports = router;
