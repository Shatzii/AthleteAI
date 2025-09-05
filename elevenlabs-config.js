// ElevenLabs Configuration for AthleteAI AI Coaches
// This file contains the setup and configuration for ElevenLabs voice synthesis integration

const elevenLabsConfig = {
  // API Configuration
  apiKey: process.env.ELEVENLABS_API_KEY,
  baseUrl: 'https://api.elevenlabs.io/v1',

  // Voice Settings for AI Coaches
  voices: {
    coach_male: {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Replace with your preferred male coach voice
      name: 'Coach Marcus',
      description: 'Motivational male coach voice',
      settings: {
        stability: 0.75,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true
      }
    },
    coach_female: {
      voiceId: 'AZnzlk1XvdvUeBnXmlld', // Replace with your preferred female coach voice
      name: 'Coach Sarah',
      description: 'Encouraging female coach voice',
      settings: {
        stability: 0.8,
        similarity_boost: 0.75,
        style: 0.6,
        use_speaker_boost: true
      }
    },
    coach_motivational: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Replace with energetic voice
      name: 'Coach Max',
      description: 'High-energy motivational coach',
      settings: {
        stability: 0.7,
        similarity_boost: 0.9,
        style: 0.8,
        use_speaker_boost: true
      }
    }
  },

  // Audio Settings
  audio: {
    format: 'mp3',
    quality: 'high',
    sampleRate: 44100
  },

  // Coach Personality Settings
  personalities: {
    motivational: {
      tone: 'energetic',
      pace: 'fast',
      encouragement: 'high',
      technical_detail: 'medium'
    },
    technical: {
      tone: 'professional',
      pace: 'moderate',
      encouragement: 'medium',
      technical_detail: 'high'
    },
    supportive: {
      tone: 'warm',
      pace: 'moderate',
      encouragement: 'high',
      technical_detail: 'low'
    }
  },

  // Response Templates
  templates: {
    workout_start: "Alright team, let's crush this workout! Remember your form and stay hydrated.",
    workout_complete: "Excellent work! You've completed another great session. Your dedication is paying off.",
    encouragement: "Keep pushing! You're stronger than you think. One more rep!",
    correction: "Great effort, but let's adjust your form. Keep your core engaged and focus on controlled movements.",
    rest_reminder: "Take a moment to breathe and recover. This rest is just as important as the work."
  }
};

module.exports = elevenLabsConfig;
