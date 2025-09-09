const mongoose = require('mongoose');

const injurySchema = new mongoose.Schema({
  athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateOccurred: {
    type: Date,
    required: true
  },
  dateReported: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: [
      'sprain', 'strain', 'fracture', 'dislocation', 'concussion',
      'tendonitis', 'bursitis', 'stress_fracture', 'muscle_tear',
      'ligament_tear', 'overuse', 'contact', 'other'
    ]
  },
  location: {
    type: String,
    required: true,
    enum: [
      'head', 'neck', 'shoulder', 'arm', 'elbow', 'wrist', 'hand',
      'chest', 'back', 'hip', 'thigh', 'knee', 'shin', 'ankle', 'foot',
      'other'
    ]
  },
  side: {
    type: String,
    enum: ['left', 'right', 'bilateral']
  },
  severity: {
    type: String,
    required: true,
    enum: ['minor', 'moderate', 'serious', 'severe']
  },
  mechanism: {
    type: String,
    enum: [
      'contact', 'non_contact', 'overuse', 'equipment_failure',
      'surface_related', 'environmental', 'other'
    ]
  },
  activity: {
    type: String,
    enum: [
      'practice', 'game', 'weight_training', 'conditioning',
      'skill_work', 'recovery', 'other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  symptoms: [String],
  initialTreatment: String,
  medicalProfessional: String,
  diagnosis: String,
  treatment: {
    type: {
      type: String,
      enum: ['rest', 'physical_therapy', 'surgery', 'medication', 'other']
    },
    duration: Number, // days
    details: String
  },
  returnToPlay: {
    date: Date,
    protocol: String,
    restrictions: [String]
  },
  recurrence: {
    type: Boolean,
    default: false
  },
  previousInjuryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Injury'
  },
  riskFactors: [String],
  prevention: [String],
  notes: String,
  status: {
    type: String,
    enum: ['active', 'recovered', 'chronic', 'season_ending'],
    default: 'active'
  },
  followUp: [{
    date: Date,
    notes: String,
    status: String
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

// Calculate injury severity score
injurySchema.methods.calculateSeverityScore = function() {
  const severityScores = {
    'minor': 1,
    'moderate': 2,
    'serious': 3,
    'severe': 4
  };

  const baseScore = severityScores[this.severity] || 2;

  // Adjust for treatment duration
  if (this.treatment && this.treatment.duration) {
    if (this.treatment.duration > 30) baseScore += 1; // Long recovery
    if (this.treatment.duration > 90) baseScore += 1; // Very long recovery
  }

  // Adjust for surgery
  if (this.treatment && this.treatment.type === 'surgery') {
    baseScore += 2;
  }

  return Math.min(5, baseScore);
};

// Check if injury is chronic
injurySchema.methods.isChronic = function() {
  return this.status === 'chronic' ||
         (this.treatment && this.treatment.duration && this.treatment.duration > 90) ||
         this.recurrence === true;
};

// Get recovery time estimate
injurySchema.methods.getRecoveryEstimate = function() {
  const severityEstimates = {
    'minor': { min: 1, max: 7 },
    'moderate': { min: 7, max: 21 },
    'serious': { min: 21, max: 60 },
    'severe': { min: 60, max: 180 }
  };

  const estimate = severityEstimates[this.severity] || severityEstimates.moderate;

  // Adjust for treatment type
  if (this.treatment && this.treatment.type === 'surgery') {
    estimate.max *= 2;
  }

  return estimate;
};

const Injury = mongoose.model('Injury', injurySchema);

module.exports = Injury;
