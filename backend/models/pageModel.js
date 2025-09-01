const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
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
    template: {
        type: String,
        enum: ['default', 'landing', 'about', 'contact', 'marketing'],
        default: 'default'
    },
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    },
    featuredImage: {
        type: String,
        trim: true
    },
    sections: [{
        type: {
            type: String,
            enum: ['hero', 'content', 'gallery', 'cta', 'testimonials', 'stats']
        },
        title: String,
        content: String,
        image: String,
        link: String,
        data: mongoose.Schema.Types.Mixed
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
pageSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

// Virtual for URL
pageSchema.virtual('url').get(function() {
    return `/${this.slug}`;
});

// Ensure virtual fields are serialized
pageSchema.set('toJSON', { virtuals: true });

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;
