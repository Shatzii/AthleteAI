const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        enum: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P']
    },
    team: {
        type: String,
        trim: true
    },
    school: {
        type: String,
        trim: true
    },
    year: {
        type: String,
        enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']
    },
    height: {
        type: String,
        trim: true
    },
    weight: {
        type: Number
    },
    garScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    stars: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    profileImage: {
        type: String,
        default: '/default-player.png'
    },
    stats: {
        passingYards: { type: Number, default: 0 },
        rushingYards: { type: Number, default: 0 },
        receivingYards: { type: Number, default: 0 },
        touchdowns: { type: Number, default: 0 },
        tackles: { type: Number, default: 0 },
        sacks: { type: Number, default: 0 },
        interceptions: { type: Number, default: 0 }
    },
    achievements: [{
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
playerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for star rating display
playerSchema.virtual('starRating').get(function() {
    return '★'.repeat(this.stars) + '☆'.repeat(5 - this.stars);
});

// Method to calculate GAR score based on performance
playerSchema.methods.calculateGAR = function(stats) {
    // Simple GAR calculation - can be made more sophisticated
    const baseScore = 50;
    const statMultiplier = 0.5;

    let performanceScore = 0;
    if (stats) {
        performanceScore += (stats.passingYards || 0) * 0.001;
        performanceScore += (stats.rushingYards || 0) * 0.002;
        performanceScore += (stats.receivingYards || 0) * 0.002;
        performanceScore += (stats.touchdowns || 0) * 2;
        performanceScore += (stats.tackles || 0) * 0.5;
        performanceScore += (stats.sacks || 0) * 3;
        performanceScore += (stats.interceptions || 0) * 2;
    }

    this.garScore = Math.min(100, Math.max(0, baseScore + performanceScore));
    return this.garScore;
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
