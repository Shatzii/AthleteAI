const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String
    },
    alt: {
        type: String,
        trim: true
    },
    caption: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['players', 'teams', 'events', 'articles', 'marketing', 'other'],
        default: 'other'
    },
    tags: [{
        type: String,
        trim: true
    }],
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dimensions: {
        width: Number,
        height: Number
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
mediaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for search
mediaSchema.index({ filename: 'text', alt: 'text', caption: 'text', tags: 'text' });

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
