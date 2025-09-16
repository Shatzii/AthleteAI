// Voice-Activated AI Coach Service
// Speech recognition and synthesis integration for interactive coaching

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { SpeechClient } = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const mongoose = require('mongoose');

class VoiceCoachService {
  constructor() {
    this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.elevenlabsVoiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default voice
    this.googleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Initialize Google Cloud clients
    this.speechClient = null;
    this.ttsClient = null;

    // Voice session tracking
    this.activeSessions = new Map();
    this.conversationHistory = new Map();

    // Voice coach personality and responses
    this.coachPersonality = {
      name: 'Coach Alex',
      style: 'motivational',
      expertise: ['football', 'conditioning', 'motivation', 'technique'],
      tone: 'encouraging',
      language: 'en-US'
    };

    // Predefined voice responses
    this.voiceResponses = {
      greeting: [
        "Hey there, champion! Ready to crush some goals today?",
        "Welcome back, athlete! Let's make today legendary.",
        "Good to see you fired up! What's our mission today?"
      ],
      encouragement: [
        "That's the spirit! Keep pushing forward!",
        "Outstanding effort! You're building something special.",
        "I can see the determination in your voice. That's what winners are made of!",
        "Every champion was once a beginner. You're on the right path!"
      ],
      motivation: [
        "Remember, the only way to fail is to stop trying.",
        "Your body can do it. It's your mind you have to convince.",
        "Pain is temporary. Pride is forever.",
        "The harder you work, the luckier you get."
      ],
      technique: [
        "Focus on your form. Quality over quantity.",
        "Breathe through the movement. Control is key.",
        "Stay balanced and explosive. That's the winning combination.",
        "Visualize success before you execute."
      ]
    };

    this.metrics = {
      sessions: 0,
      messages: 0,
      audioGenerated: 0,
      speechRecognized: 0
    };
  }

  /**
   * Initialize the voice coach service
   */
  async initialize() {
    try {
      // Initialize Google Cloud Speech-to-Text
      if (this.googleCredentials) {
        this.speechClient = new SpeechClient();
        this.ttsClient = new textToSpeech.TextToSpeechClient();
        console.log('🎤 Google Cloud Speech services initialized');
      } else {
        console.warn('⚠️  Google Cloud credentials not found. Speech recognition disabled.');
      }

      // Test ElevenLabs connection
      if (this.elevenlabsApiKey) {
        await this.testElevenLabsConnection();
        console.log('🔊 ElevenLabs TTS service connected');
      } else {
        console.warn('⚠️  ElevenLabs API key not found. Voice synthesis disabled.');
      }

      console.log('✅ Voice Coach service initialized');
      console.log(`🎯 Coach: ${this.coachPersonality.name} (${this.coachPersonality.style} style)`);

    } catch (error) {
      console.error('❌ Failed to initialize voice coach:', error);
      throw error;
    }
  }

  /**
   * Test ElevenLabs API connection
   */
  async testElevenLabsConnection() {
    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.elevenlabsApiKey
        }
      });

      if (response.status === 200) {
        console.log('✅ ElevenLabs API connection successful');
        return true;
      }
    } catch (error) {
      console.error('❌ ElevenLabs API connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Start a new voice coaching session
   * @param {string} athleteId - Athlete's ID
   * @param {Object} preferences - Voice preferences
   * @returns {Object} Session information
   */
  async startSession(athleteId, preferences = {}) {
    try {
      const sessionId = `voice_${athleteId}_${Date.now()}`;

      const session = {
        sessionId,
        athleteId,
        startTime: new Date(),
        preferences: {
          voice: preferences.voice || this.elevenlabsVoiceId,
          language: preferences.language || 'en-US',
          style: preferences.style || this.coachPersonality.style,
          speed: preferences.speed || 1.0,
          ...preferences
        },
        conversation: [],
        metrics: {
          messages: 0,
          audioGenerated: 0,
          duration: 0
        }
      };

      this.activeSessions.set(sessionId, session);
      this.conversationHistory.set(athleteId, []);

      this.metrics.sessions++;

      // Generate welcome message
      const welcomeMessage = await this.generateWelcomeMessage(athleteId);

      return {
        sessionId,
        coach: this.coachPersonality,
        welcomeMessage,
        preferences: session.preferences
      };

    } catch (error) {
      console.error('Error starting voice session:', error);
      throw error;
    }
  }

  /**
   * Process voice input and generate response
   * @param {string} sessionId - Voice session ID
   * @param {Buffer} audioData - Audio data buffer
   * @param {Object} context - Additional context
   * @returns {Object} Voice response with audio
   */
  async processVoiceInput(sessionId, audioData, context = {}) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Voice session not found');
      }

      this.metrics.messages++;

      // Transcribe speech to text
      const transcription = await this.transcribeSpeech(audioData, session.preferences.language);

      if (!transcription || transcription.confidence < 0.7) {
        // Low confidence transcription - ask for clarification
        const clarificationResponse = await this.generateVoiceResponse(
          "I'm sorry, I didn't catch that clearly. Could you please repeat what you said?",
          session.preferences
        );

        session.conversation.push({
          type: 'clarification_request',
          transcription: transcription?.text || 'unintelligible',
          confidence: transcription?.confidence || 0,
          response: clarificationResponse.text,
          timestamp: new Date()
        });

        return {
          transcription: transcription?.text || 'unintelligible',
          confidence: transcription?.confidence || 0,
          response: clarificationResponse,
          needsClarification: true
        };
      }

      // Process the transcribed text
      const response = await this.generateCoachingResponse(
        transcription.text,
        session,
        context
      );

      // Generate voice response
      const voiceResponse = await this.generateVoiceResponse(
        response.text,
        session.preferences
      );

      // Update session
      session.conversation.push({
        type: 'interaction',
        input: transcription.text,
        inputConfidence: transcription.confidence,
        response: response.text,
        responseType: response.type,
        timestamp: new Date()
      });

      session.metrics.messages++;
      session.metrics.audioGenerated++;

      // Update conversation history
      const history = this.conversationHistory.get(session.athleteId) || [];
      history.push({
        input: transcription.text,
        response: response.text,
        timestamp: new Date()
      });

      // Keep only last 50 interactions
      if (history.length > 50) {
        history.shift();
      }

      this.conversationHistory.set(session.athleteId, history);

      return {
        transcription: transcription.text,
        confidence: transcription.confidence,
        response: voiceResponse,
        responseType: response.type,
        context: response.context
      };

    } catch (error) {
      console.error('Error processing voice input:', error);
      throw error;
    }
  }

  /**
   * Transcribe speech to text using Google Cloud Speech-to-Text
   * @param {Buffer} audioData - Audio data buffer
   * @param {string} language - Language code
   * @returns {Object} Transcription result
   */
  async transcribeSpeech(audioData, language = 'en-US') {
    try {
      if (!this.speechClient) {
        throw new Error('Speech recognition not available');
      }

      this.metrics.speechRecognized++;

      const request = {
        audio: {
          content: audioData.toString('base64'),
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: language,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
        },
      };

      const [response] = await this.speechClient.recognize(request);

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const alternative = result.alternatives[0];

        return {
          text: alternative.transcript,
          confidence: alternative.confidence || 0.8
        };
      }

      return null;

    } catch (error) {
      console.error('Error transcribing speech:', error);
      return null;
    }
  }

  /**
   * Generate coaching response based on input
   * @param {string} input - User's spoken input
   * @param {Object} session - Voice session
   * @param {Object} context - Additional context
   * @returns {Object} Coaching response
   */
  async generateCoachingResponse(input, session, context = {}) {
    try {
      const input_lower = input.toLowerCase();

      // Analyze input for keywords and intent
      const intent = this.analyzeIntent(input_lower);
      const sentiment = this.analyzeSentiment(input_lower);

      let response = {
        text: '',
        type: intent,
        context: {}
      };

      // Generate response based on intent
      switch (intent) {
        case 'motivation':
          response.text = this.getRandomResponse('motivation');
          break;

        case 'technique':
          response.text = this.getRandomResponse('technique');
          response.context.drill = this.suggestDrill(input_lower);
          break;

        case 'progress':
          response.text = await this.generateProgressResponse(session.athleteId);
          break;

        case 'question':
          response.text = await this.answerQuestion(input_lower, context);
          break;

        case 'encouragement':
          response.text = this.getRandomResponse('encouragement');
          break;

        default:
          // General coaching response
          response.text = this.generateGeneralResponse(input_lower, sentiment);
          break;
      }

      // Personalize based on conversation history
      response.text = this.personalizeResponse(response.text, session);

      return response;

    } catch (error) {
      console.error('Error generating coaching response:', error);
      return {
        text: "I'm here to help you succeed. What would you like to work on today?",
        type: 'general',
        context: {}
      };
    }
  }

  /**
   * Analyze user intent from speech input
   */
  analyzeIntent(input) {
    const motivationKeywords = ['motivate', 'inspire', 'pump up', 'energy', 'excited'];
    const techniqueKeywords = ['technique', 'form', 'how to', 'drill', 'practice', 'skill'];
    const progressKeywords = ['progress', 'improvement', 'better', 'stats', 'performance'];
    const questionKeywords = ['what', 'how', 'why', 'when', 'where', 'can you'];

    if (motivationKeywords.some(keyword => input.includes(keyword))) {
      return 'motivation';
    }
    if (techniqueKeywords.some(keyword => input.includes(keyword))) {
      return 'technique';
    }
    if (progressKeywords.some(keyword => input.includes(keyword))) {
      return 'progress';
    }
    if (questionKeywords.some(keyword => input.includes(keyword))) {
      return 'question';
    }

    return 'general';
  }

  /**
   * Analyze sentiment from speech input
   */
  analyzeSentiment(input) {
    const positiveWords = ['great', 'good', 'awesome', 'excellent', 'proud', 'happy', 'excited'];
    const negativeWords = ['tired', 'frustrated', 'struggling', 'hard', 'difficult', 'worried'];

    const positiveCount = positiveWords.filter(word => input.includes(word)).length;
    const negativeCount = negativeWords.filter(word => input.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Get random response from category
   */
  getRandomResponse(category) {
    const responses = this.voiceResponses[category] || this.voiceResponses.encouragement;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate progress-based response
   */
  async generateProgressResponse(athleteId) {
    // This would typically fetch real progress data
    const progressIndicators = [
      "You're showing great improvement in your consistency!",
      "Your technique work is really paying off.",
      "I can see your strength gains in your performance.",
      "Your dedication to training is inspiring."
    ];

    return progressIndicators[Math.floor(Math.random() * progressIndicators.length)];
  }

  /**
   * Answer questions based on input
   */
  async answerQuestion(input, context) {
    // Simple Q&A logic - could be enhanced with NLP
    if (input.includes('warm up') || input.includes('warm-up')) {
      return "A good warm-up should include dynamic stretches, light cardio, and sport-specific movements. Start with 5-10 minutes of light activity, then move to dynamic stretches focusing on the muscles you'll use.";
    }

    if (input.includes('recovery') || input.includes('rest')) {
      return "Recovery is crucial for performance. Make sure to get 7-9 hours of sleep, stay hydrated, eat nutrient-rich foods, and include rest days in your training schedule.";
    }

    if (input.includes('nutrition') || input.includes('diet')) {
      return "Focus on whole foods: lean proteins, complex carbohydrates, healthy fats, and plenty of vegetables. Stay hydrated and time your meals around your training sessions.";
    }

    return "That's a great question! I'm here to help you with training techniques, motivation, and performance optimization. What specific area would you like to focus on?";
  }

  /**
   * Suggest a drill based on input
   */
  suggestDrill(input) {
    const drills = {
      'passing': 'Work on your drop-back mechanics: step with your back foot first, keep your eyes downfield, and follow through completely.',
      'running': 'Focus on your footwork: quick feet drills, ladder work, and hill sprints will improve your speed and agility.',
      'defense': 'Practice your backpedal and break: keep your eyes on the receiver, stay balanced, and explode to the ball.',
      'strength': 'Incorporate compound movements: squats, deadlifts, bench press, and overhead press for overall athletic development.'
    };

    for (const [key, drill] of Object.entries(drills)) {
      if (input.includes(key)) {
        return drill;
      }
    }

    return 'Let\'s work on fundamental movement patterns. Start with bodyweight exercises focusing on proper form.';
  }

  /**
   * Generate general response based on sentiment
   */
  generateGeneralResponse(input, sentiment) {
    if (sentiment === 'positive') {
      return "I love hearing that positive energy! Keep that momentum going. What are you working on today?";
    } else if (sentiment === 'negative') {
      return "I hear you. Every athlete faces challenges. Remember, these are the moments that build champions. How can I support you right now?";
    } else {
      return "I'm here to help you reach your goals. Whether it's technique, motivation, or strategy, let's work together to make you better.";
    }
  }

  /**
   * Personalize response based on conversation history
   */
  personalizeResponse(response, session) {
    const history = this.conversationHistory.get(session.athleteId) || [];

    // Simple personalization - could be enhanced with ML
    if (history.length > 3) {
      // Athlete has been talking about technique
      if (history.some(h => h.input.toLowerCase().includes('technique'))) {
        response += " Since we've been working on technique, let's make sure you're staying consistent with those fundamentals.";
      }
    }

    return response;
  }

  /**
   * Generate voice response using ElevenLabs TTS
   * @param {string} text - Text to convert to speech
   * @param {Object} preferences - Voice preferences
   * @returns {Object} Voice response with audio data
   */
  async generateVoiceResponse(text, preferences) {
    try {
      if (!this.elevenlabsApiKey) {
        return {
          text,
          audioUrl: null,
          audioData: null,
          duration: 0
        };
      }

      this.metrics.audioGenerated++;

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${preferences.voice}`,
        {
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenlabsApiKey
          },
          responseType: 'arraybuffer'
        }
      );

      const audioData = Buffer.from(response.data);
      const audioUrl = await this.saveAudioFile(audioData, `voice_${Date.now()}.mp3`);

      return {
        text,
        audioUrl,
        audioData,
        duration: this.estimateAudioDuration(text),
        format: 'mp3'
      };

    } catch (error) {
      console.error('Error generating voice response:', error);
      return {
        text,
        audioUrl: null,
        audioData: null,
        duration: 0,
        error: 'Voice synthesis failed'
      };
    }
  }

  /**
   * Save audio file to disk
   */
  async saveAudioFile(audioData, filename) {
    try {
      const audioDir = path.join(__dirname, '../uploads/audio');
      await fs.mkdir(audioDir, { recursive: true });

      const filePath = path.join(audioDir, filename);
      await fs.writeFile(filePath, audioData);

      return `/uploads/audio/${filename}`;
    } catch (error) {
      console.error('Error saving audio file:', error);
      return null;
    }
  }

  /**
   * Estimate audio duration based on text length
   */
  estimateAudioDuration(text) {
    // Rough estimate: 150 words per minute, average 5 characters per word
    const wordsPerMinute = 150;
    const charactersPerWord = 5;
    const estimatedWords = text.length / charactersPerWord;
    const durationMinutes = estimatedWords / wordsPerMinute;

    return Math.round(durationMinutes * 60 * 1000); // Convert to milliseconds
  }

  /**
   * Generate welcome message for new session
   */
  async generateWelcomeMessage(athleteId) {
    const greeting = this.getRandomResponse('greeting');

    return await this.generateVoiceResponse(greeting, {
      voice: this.elevenlabsVoiceId,
      language: 'en-US',
      style: this.coachPersonality.style
    });
  }

  /**
   * End voice coaching session
   * @param {string} sessionId - Session ID to end
   * @returns {Object} Session summary
   */
  async endSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const endTime = new Date();
      const duration = endTime - session.startTime;

      session.endTime = endTime;
      session.metrics.duration = duration;

      // Generate session summary
      const summary = {
        sessionId,
        athleteId: session.athleteId,
        duration,
        messages: session.metrics.messages,
        audioGenerated: session.metrics.audioGenerated,
        conversationLength: session.conversation.length,
        startTime: session.startTime,
        endTime
      };

      // Clean up session data
      this.activeSessions.delete(sessionId);

      return summary;

    } catch (error) {
      console.error('Error ending voice session:', error);
      throw error;
    }
  }

  /**
   * Get voice coach statistics
   */
  getStats() {
    return {
      totalSessions: this.metrics.sessions,
      totalMessages: this.metrics.messages,
      totalAudioGenerated: this.metrics.audioGenerated,
      totalSpeechRecognized: this.metrics.speechRecognized,
      activeSessions: this.activeSessions.size,
      coachPersonality: this.coachPersonality,
      lastUpdated: new Date()
    };
  }

  /**
   * Update coach personality settings
   */
  updateCoachPersonality(settings) {
    this.coachPersonality = {
      ...this.coachPersonality,
      ...settings
    };

    console.log('🎭 Coach personality updated:', this.coachPersonality);
  }

  /**
   * Clean up old audio files
   */
  async cleanupOldAudioFiles(maxAgeHours = 24) {
    try {
      const audioDir = path.join(__dirname, '../uploads/audio');
      const files = await fs.readdir(audioDir);
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

      let cleanedCount = 0;
      for (const file of files) {
        const filePath = path.join(audioDir, file);
        const stats = await fs.stat(filePath);

        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} old audio files`);
      return cleanedCount;

    } catch (error) {
      console.error('Error cleaning up audio files:', error);
      return 0;
    }
  }
}

// Export singleton instance
const voiceCoachService = new VoiceCoachService();
module.exports = voiceCoachService;