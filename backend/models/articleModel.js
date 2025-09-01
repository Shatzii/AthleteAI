const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['football', 'basketball', 'baseball', 'soccer', 'tennis', 'other', 'international']
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    featuredImage: {
        type: String,
        trim: true
    },
    images: [{
        url: String,
        alt: String,
        caption: String
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    publishedAt: {
        type: Date
    },
    seoTitle: {
        type: String,
        trim: true
    },
    seoDescription: {
        type: String,
        trim: true
    },
    seoKeywords: [{
        type: String,
        trim: true
    }],
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
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
articleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Virtual for URL
articleSchema.virtual('url').get(function() {
    return `/articles/${this.slug}`;
});

// Ensure virtual fields are serialized
articleSchema.set('toJSON', { virtuals: true });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
