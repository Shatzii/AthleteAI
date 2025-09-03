const mongoose = require('mongoose');

// NCAA Eligibility Model
const eligibilitySchema = new mongoose.Schema({
  athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true,
    unique: true
  },
  // Five-year eligibility clock
  clockStart: {
    type: Date,
    default: null
  },
  seasonsUsed: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  seasonsRemaining: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  // Redshirt status
  redshirtUsed: {
    type: Boolean,
    default: false
  },
  redshirtEligible: {
    type: Boolean,
    default: true
  },
  // Waiver history
  waiverHistory: [{
    type: {
      type: String,
      enum: ['medical', 'academic', 'hardship', 'other'],
      required: true
    },
    grantedDate: {
      type: Date,
      default: Date.now
    },
    seasonsExtended: {
      type: Number,
      default: 1,
      min: 1
    },
    reason: {
      type: String,
      required: true
    },
    approvedBy: String
  }],
  // Academic eligibility
  academicStanding: {
    gpa: {
      type: Number,
      min: 0,
      max: 4.0,
      default: 0
    },
    progressToDegree: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    coreCoursesCompleted: {
      type: Number,
      default: 0
    },
    eligibilityYear: {
      type: String,
      enum: ['FR', 'SO', 'JR', 'SR', '5TH', '6TH'],
      default: 'FR'
    },
    lastAcademicUpdate: {
      type: Date,
      default: Date.now
    }
  },
  // Compliance tracking
  complianceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  lastComplianceCheck: {
    type: Date,
    default: Date.now
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
eligibilitySchema.index({ athleteId: 1 });
eligibilitySchema.index({ 'academicStanding.gpa': -1 });
eligibilitySchema.index({ seasonsRemaining: -1 });

// Pre-save middleware to update timestamps
eligibilitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for clock expiry date
eligibilitySchema.virtual('clockExpiry').get(function() {
  if (!this.clockStart) return null;
  return new Date(this.clockStart.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));
});

// Virtual for eligibility percentage used
eligibilitySchema.virtual('eligibilityUsedPercentage').get(function() {
  return (this.seasonsUsed / 5) * 100;
});

// Method to check if clock is expired
eligibilitySchema.methods.isClockExpired = function() {
  if (!this.clockExpiry) return false;
  return new Date() > this.clockExpiry;
};

// Method to check if academically eligible
eligibilitySchema.methods.isAcademicallyEligible = function() {
  return this.academicStanding.gpa >= 2.0 && this.academicStanding.progressToDegree >= 40;
};

// Method to get eligibility summary
eligibilitySchema.methods.getEligibilitySummary = function() {
  return {
    seasonsRemaining: this.seasonsRemaining,
    clockExpiry: this.clockExpiry,
    redshirtEligible: this.redshirtEligible,
    academicallyEligible: this.isAcademicallyEligible(),
    complianceScore: this.complianceScore,
    eligibilityUsedPercentage: this.eligibilityUsedPercentage
  };
};

module.exports = mongoose.model('Eligibility', eligibilitySchema);
