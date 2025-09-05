// Example Usage: AI Coach Voice Integration for AthleteAI
// This file demonstrates how to integrate ElevenLabs voice synthesis
// with AthleteAI's workout and coaching features

const aiCoachVoice = require('./ai-coach-voice');

class AthleteAIWorkoutSession {
  constructor(athleteId) {
    this.athleteId = athleteId;
    this.sessionData = {
      startTime: null,
      exercises: [],
      performance: {
        accuracy: 0,
        intensity: 0,
        consistency: 0
      }
    };
  }

  // Start workout session with voice greeting
  async startWorkout() {
    this.sessionData.startTime = Date.now();

    const greeting = await aiCoachVoice.generateCoachResponse(
      this.sessionData,
      'workout_start'
    );

    return {
      message: "Workout session started!",
      voiceResponse: greeting,
      sessionId: this.generateSessionId()
    };
  }

  // Provide real-time feedback during exercise
  async provideFeedback(exerciseData) {
    const { exercise, reps, formAccuracy, heartRate } = exerciseData;

    // Update performance metrics
    this.updatePerformance(formAccuracy, heartRate);

    let feedbackType = 'encouragement';

    if (formAccuracy < 70) {
      feedbackType = 'correction';
    } else if (this.shouldRemindRest(reps)) {
      feedbackType = 'rest_reminder';
    }

    const feedback = await aiCoachVoice.generateCoachResponse(
      {
        ...this.sessionData,
        currentExercise: exercise,
        performance: this.sessionData.performance
      },
      feedbackType
    );

    return {
      exercise: exercise,
      reps: reps,
      feedback: feedback,
      performance: this.sessionData.performance
    };
  }

  // Complete workout with summary
  async completeWorkout() {
    const duration = Date.now() - this.sessionData.startTime;
    const summary = this.generateWorkoutSummary();

    const completionMessage = await aiCoachVoice.generateCoachResponse(
      {
        ...this.sessionData,
        duration: duration,
        summary: summary
      },
      'workout_complete'
    );

    return {
      duration: Math.round(duration / 1000 / 60), // minutes
      summary: summary,
      voiceResponse: completionMessage,
      performance: this.sessionData.performance
    };
  }

  // Update performance metrics
  updatePerformance(formAccuracy, heartRate) {
    this.sessionData.performance.accuracy =
      (this.sessionData.performance.accuracy + formAccuracy) / 2;

    // Estimate intensity based on heart rate (simplified)
    const intensity = Math.min(100, (heartRate - 60) * 2);
    this.sessionData.performance.intensity =
      (this.sessionData.performance.intensity + intensity) / 2;

    this.sessionData.performance.consistency += 5; // Simplified consistency tracking
  }

  // Check if rest reminder is needed
  shouldRemindRest(reps) {
    return reps > 0 && reps % 10 === 0; // Every 10 reps
  }

  // Generate workout summary
  generateWorkoutSummary() {
    const { accuracy, intensity, consistency } = this.sessionData.performance;

    let summary = "Great session! ";
    if (accuracy > 85) summary += "Your form was excellent. ";
    if (intensity > 80) summary += "You maintained high intensity. ";
    if (consistency > 80) summary += "You were very consistent throughout.";

    return summary;
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${this.athleteId}_${Date.now()}`;
  }
}

// Example usage in AthleteAI application
async function exampleWorkoutSession() {
  console.log("🚀 Starting AthleteAI Workout Session with Voice Coach");

  const session = new AthleteAIWorkoutSession('athlete_123');

  try {
    // Start workout
    const startResult = await session.startWorkout();
    console.log("🎯 Workout started:", startResult.message);
    console.log("🔊 Voice response generated for workout start");

    // Simulate exercise feedback
    const exerciseData = {
      exercise: 'squats',
      reps: 5,
      formAccuracy: 92,
      heartRate: 145
    };

    const feedbackResult = await session.provideFeedback(exerciseData);
    console.log(`💪 Exercise: ${feedbackResult.exercise}, Reps: ${feedbackResult.reps}`);
    console.log("🔊 Personalized voice feedback generated");
    console.log("📊 Performance metrics:", feedbackResult.performance);

    // Complete workout
    const completionResult = await session.completeWorkout();
    console.log(`✅ Workout completed in ${completionResult.duration} minutes`);
    console.log("🏆 Summary:", completionResult.summary);
    console.log("🔊 Completion voice message generated");

  } catch (error) {
    console.error("❌ Workout session error:", error.message);
  }
}

// Test voice generation independently
async function testVoiceGeneration() {
  console.log("🧪 Testing ElevenLabs Voice Generation");

  try {
    // Test different voices
    const voices = ['coach_male', 'coach_female', 'coach_motivational'];

    for (const voice of voices) {
      const result = await aiCoachVoice.generateVoice(
        `Hello from ${voice}!`,
        voice
      );
      console.log(`✅ Generated voice for ${voice}: ${result.voice}`);
    }

    // Test cache functionality
    const cacheStats = aiCoachVoice.getCacheStats();
    console.log(`📊 Cache contains ${cacheStats.size} audio responses`);

  } catch (error) {
    console.error("❌ Voice generation test failed:", error.message);
  }
}

// Export for use in AthleteAI
module.exports = {
  AthleteAIWorkoutSession,
  exampleWorkoutSession,
  testVoiceGeneration
};

// Run example if executed directly
if (require.main === module) {
  exampleWorkoutSession().then(() => {
    console.log("\n🎉 Example completed!");
    testVoiceGeneration();
  });
}
