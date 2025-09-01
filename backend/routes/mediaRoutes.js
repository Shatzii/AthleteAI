const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../models/mediaModel');
const authMiddleware = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|mp4|avi|mov/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Get all media files
router.get('/', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { category, search, limit = 20, page = 1 } = req.query;

        let query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        if (search) {
            query.$or = [
                { filename: { $regex: search, $options: 'i' } },
                { originalName: { $regex: search, $options: 'i' } },
                { alt: { $regex: search, $options: 'i' } },
                { caption: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const media = await Media.find(query)
            .populate('uploadedBy', 'username')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Media.countDocuments(query);

        res.json({
            media,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching media', error: error.message });
    }
});

// Get single media file
router.get('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id)
            .populate('uploadedBy', 'username');

        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        res.json(media);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching media', error: error.message });
    }
});

// Upload media file
router.post('/upload', authMiddleware.verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const mediaData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`,
            category: req.body.category || 'other',
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            alt: req.body.alt || '',
            caption: req.body.caption || '',
            uploadedBy: req.user.id
        };

        // Generate thumbnail for images
        if (req.file.mimetype.startsWith('image/')) {
            // For now, we'll just set the thumbnail to the same as the main image
            // In a real implementation, you'd use a library like sharp to generate thumbnails
            mediaData.thumbnailUrl = mediaData.url;
        }

        const media = new Media(mediaData);
        await media.save();

        res.status(201).json({ message: 'File uploaded successfully', media });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});

// Update media metadata
router.put('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Check if user is the uploader or admin
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only edit your own uploads.' });
        }

        Object.assign(media, req.body);
        await media.save();

        res.json({ message: 'Media updated successfully', media });
    } catch (error) {
        res.status(500).json({ message: 'Error updating media', error: error.message });
    }
});

// Delete media file
router.delete('/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Check if user is the uploader or admin
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. You can only delete your own uploads.' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../uploads', media.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Media.findByIdAndDelete(req.params.id);
        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting media', error: error.message });
    }
});

// Serve uploaded files
router.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

module.exports = router;
