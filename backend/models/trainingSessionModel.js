const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // minutes
    required: true
  },
  type: {
    type: String,
    enum: ['strength', 'conditioning', 'skill', 'recovery', 'competition'],
    required: true
  },
  intensity: {
    type: Number, // 1-10 scale
    required: true,
    min: 1,
    max: 10
  },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number, // lbs
    duration: Number, // seconds
    restTime: Number, // seconds
    notes: String
  }],
  metrics: {
    heartRate: {
      average: Number,
      max: Number,
      zones: {
        fatBurn: Number, // minutes
        cardio: Number,
        peak: Number
      }
    },
    calories: Number,
    distance: Number, // miles/km
    speed: Number, // mph/kmh
    power: Number, // watts
  },
  perceivedExertion: {
    type: Number, // 1-10 scale (RPE)
    min: 1,
    max: 10
  },
  fatigue: {
    type: Number, // 1-10 scale
    min: 1,
    max: 10
  },
  sleep: {
    hours: Number,
    quality: {
      type: Number, // 1-10 scale
      min: 1,
      max: 10
    }
  },
  nutrition: {
    calories: Number,
    protein: Number, // grams
    carbs: Number, // grams
    fat: Number, // grams
    hydration: Number // ml
  },
  environment: {
    temperature: Number, // fahrenheit
    humidity: Number, // percentage
    altitude: Number, // feet
    surface: {
      type: String,
      enum: ['grass', 'turf', 'track', 'gym', 'field']
    }
  },
  notes: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate training load based on session data
trainingSessionSchema.methods.calculateTrainingLoad = function() {
  const duration = this.duration || 0;
  const intensity = this.intensity || 5;
  const perceivedExertion = this.perceivedExertion || 5;

  // Training load formula: duration × intensity × perceived exertion
  return duration * intensity * perceivedExertion;
};

// Calculate recovery time needed
trainingSessionSchema.methods.calculateRecoveryTime = function() {
  const load = this.calculateTrainingLoad();
  const fatigue = this.fatigue || 5;

  // Base recovery time in hours
  let recoveryHours = (load / 100) * (fatigue / 5);

  // Adjust for age, fitness level, etc. (would need athlete data)
  return Math.max(24, Math.min(168, recoveryHours)); // 1-7 days
};

const TrainingSession = mongoose.model('TrainingSession', trainingSessionSchema);

module.exports = TrainingSession;
