const mongoose = require('mongoose');

// Amateurism Compliance Model
const amateurismSchema = new mongoose.Schema({
  athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  // Earnings details
  earningsType: {
    type: String,
    enum: [
      'prize_money',
      'endorsement',
      'sponsorship',
      'appearance_fee',
      'autograph',
      'merchandise',
      'other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Source and description
  source: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  // Date and approval
  dateReceived: {
    type: Date,
    required: true
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  // Compliance status
  complianceStatus: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'under_review'],
    default: 'pending'
  },
  reviewedBy: {
    type: String,
    trim: true
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  // Supporting documentation
  documentation: [{
    type: {
      type: String,
      enum: ['contract', 'receipt', 'invoice', 'agreement', 'other']
    },
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // NCAA impact assessment
  ncaaImpact: {
    affectsAmateurism: {
      type: Boolean,
      default: false
    },
    impactLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical'],
      default: 'none'
    },
    eligibilityImplication: {
      type: String,
      trim: true
    }
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
amateurismSchema.index({ athleteId: 1, dateReceived: -1 });
amateurismSchema.index({ complianceStatus: 1 });
amateurismSchema.index({ earningsType: 1 });

// Pre-save middleware
amateurismSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for total earnings by athlete
amateurismSchema.statics.getTotalEarnings = async function(athleteId) {
  const result = await this.aggregate([
    { $match: { athleteId: mongoose.Types.ObjectId(athleteId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Method to check if earnings affect amateur status
amateurismSchema.methods.affectsAmateurStatus = function() {
  // NCAA amateurism rules: earnings that affect amateur status
  const affectingTypes = ['endorsement', 'sponsorship', 'appearance_fee', 'prize_money'];
  return affectingTypes.includes(this.earningsType) && this.amount > 0;
};

// Method to get compliance summary
amateurismSchema.methods.getComplianceSummary = function() {
  return {
    type: this.earningsType,
    amount: this.amount,
    affectsAmateurism: this.affectsAmateurStatus(),
    status: this.complianceStatus,
    reviewed: !!this.reviewDate
  };
};

module.exports = mongoose.model('Amateurism', amateurismSchema);
