// AI Coach Voice System for AthleteAI
// Integration with ElevenLabs for voice synthesis
// Handles voice responses, audio generation, and coach interactions

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const elevenLabsConfig = require('../../elevenlabs-config');

class AICoachVoice {
  constructor() {
    this.apiKey = elevenLabsConfig.apiKey;
    this.baseUrl = elevenLabsConfig.baseUrl;
    this.audioCache = new Map(); // Cache for generated audio
  }

  /**
   * Generate voice audio for coach response
   * @param {string} text - The text to convert to speech
   * @param {string} voiceType - Type of voice ('coach_male', 'coach_female', 'coach_motivational')
   * @param {Object} options - Additional options for voice generation
   */
  async generateVoice(text, voiceType = 'coach_male', options = {}) {
    try {
      const voiceConfig = elevenLabsConfig.voices[voiceType];
      if (!voiceConfig) {
        throw new Error(`Voice type '${voiceType}' not found in configuration`);
      }

      // Check cache first
      const cacheKey = `${voiceType}_${text}`;
      if (this.audioCache.has(cacheKey)) {
        return this.audioCache.get(cacheKey);
      }

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceConfig.voiceId}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            ...voiceConfig.settings,
            ...options.voiceSettings
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      // Convert to base64 for easy handling
      const audioBuffer = Buffer.from(response.data);
      const audioBase64 = audioBuffer.toString('base64');

      // Cache the result
      const result = {
        audio: audioBase64,
        format: elevenLabsConfig.audio.format,
        voice: voiceConfig.name,
        timestamp: Date.now()
      };

      this.audioCache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('ElevenLabs API Error:', error.response?.data || error.message);
      throw new Error(`Failed to generate voice: ${error.message}`);
    }
  }

  /**
   * Generate personalized coach response based on athlete performance
   * @param {Object} athleteData - Athlete's current session data
   * @param {string} responseType - Type of response needed
   */
  async generateCoachResponse(athleteData, responseType = 'encouragement') {
    const { performance, workoutType, currentExercise } = athleteData;

    let text = '';
    let voiceType = 'coach_motivational';

    switch (responseType) {
      case 'workout_start':
        text = elevenLabsConfig.templates.workout_start;
        voiceType = 'coach_motivational';
        break;

      case 'workout_complete':
        text = elevenLabsConfig.templates.workout_complete;
        voiceType = 'coach_female';
        break;

      case 'encouragement':
        text = this.generateEncouragementText(performance);
        voiceType = 'coach_motivational';
        break;

      case 'correction':
        text = elevenLabsConfig.templates.correction;
        voiceType = 'coach_male';
        break;

      case 'rest_reminder':
        text = elevenLabsConfig.templates.rest_reminder;
        voiceType = 'coach_female';
        break;

      default:
        text = "Keep going! You're doing great!";
        voiceType = 'coach_motivational';
    }

    return await this.generateVoice(text, voiceType);
  }

  /**
   * Generate personalized encouragement based on performance
   * @param {Object} performance - Athlete's performance metrics
   */
  generateEncouragementText(performance) {
    const { accuracy, intensity, consistency } = performance;

    if (accuracy > 90) {
      return "Perfect form! You're executing with precision. Keep that focus!";
    } else if (intensity > 80) {
      return "Amazing intensity! You're pushing your limits. Stay strong!";
    } else if (consistency > 85) {
      return "Outstanding consistency! Your dedication is showing results!";
    } else {
      return "Great effort! Every workout builds your strength. Keep pushing!";
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices() {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data.voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error.message);
      return [];
    }
  }

  /**
   * Save audio file to disk (optional)
   * @param {Object} audioData - Audio data from generateVoice
   * @param {string} filename - Output filename
   */
  async saveAudioFile(audioData, filename) {
    const audioBuffer = Buffer.from(audioData.audio, 'base64');
    const filePath = path.join(__dirname, 'audio', filename);

    // Ensure audio directory exists
    const audioDir = path.dirname(filePath);
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    fs.writeFileSync(filePath, audioBuffer);
    return filePath;
  }

  /**
   * Clear audio cache to free memory
   */
  clearCache() {
    this.audioCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.audioCache.size,
      entries: Array.from(this.audioCache.keys())
    };
  }
}

// Export singleton instance
const aiCoachVoice = new AICoachVoice();
module.exports = aiCoachVoice;
