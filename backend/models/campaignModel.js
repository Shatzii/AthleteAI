const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
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
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['newsletter', 'social', 'email', 'webinar', 'event', 'partnership'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
        default: 'draft'
    },
    targetAudience: {
        type: String,
        enum: ['students', 'coaches', 'parents', 'schools', 'all'],
        default: 'all'
    },
    content: {
        headline: String,
        subheadline: String,
        body: String,
        callToAction: String,
        ctaLink: String
    },
    media: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media'
    }],
    metrics: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 }
    },
    budget: {
        allocated: Number,
        spent: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
    },
    schedule: {
        startDate: Date,
        endDate: Date,
        timeZone: { type: String, default: 'UTC' }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    tags: [{
        type: String,
        trim: true
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
campaignSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for URL
campaignSchema.virtual('url').get(function() {
    return `/campaigns/${this.slug}`;
});

// Virtual for CTR (Click Through Rate)
campaignSchema.virtual('ctr').get(function() {
    if (this.metrics.impressions === 0) return 0;
    return (this.metrics.clicks / this.metrics.impressions) * 100;
});

// Virtual for conversion rate
campaignSchema.virtual('conversionRate').get(function() {
    if (this.metrics.clicks === 0) return 0;
    return (this.metrics.conversions / this.metrics.clicks) * 100;
});

// Ensure virtual fields are serialized
campaignSchema.set('toJSON', { virtuals: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
