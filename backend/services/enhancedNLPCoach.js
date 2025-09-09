// Enhanced NLP Coach for AthleteAI
// Advanced natural language processing for football coaching
// Uses pattern recognition and context awareness

const mongoose = require('mongoose');

class EnhancedNLPCoach {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.conversationHistory = new Map();
    this.contextMemory = new Map();
    this.intentPatterns = this.initializeIntentPatterns();
  }

  /**
   * Process a coaching question and provide intelligent response
   * @param {string} question - Athlete's question
   * @param {string} athleteId - Athlete's ID for context
   * @param {Object} context - Additional context data
   * @returns {Object} Coaching response with analysis
   */
  async processQuestion(question, athleteId = null, context = {}) {
    try {
      const analysis = this.analyzeQuestion(question);
      const intent = this.classifyIntent(question, analysis);
      const contextData = this.getContextData(athleteId, context);
      const response = this.generateResponse(intent, analysis, contextData);

      // Store conversation for context
      this.updateConversationHistory(athleteId, question, response);

      return {
        response: response.text,
        intent: intent.name,
        confidence: intent.confidence,
        suggestions: response.suggestions,
        followUp: response.followUp,
        analysis: analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error processing coaching question:', error);
      return this.generateFallbackResponse(question);
    }
  }

  /**
   * Analyze question structure and extract key elements
   * @param {string} question - Input question
   * @returns {Object} Analysis results
   */
  analyzeQuestion(question) {
    const analysis = {
      tokens: [],
      keywords: [],
      entities: [],
      sentiment: 'neutral',
      complexity: 'simple',
      topics: []
    };

    // Tokenize and normalize
    analysis.tokens = this.tokenize(question.toLowerCase());

    // Extract keywords
    analysis.keywords = this.extractKeywords(analysis.tokens);

    // Identify entities (techniques, positions, etc.)
    analysis.entities = this.extractEntities(analysis.tokens);

    // Analyze sentiment
    analysis.sentiment = this.analyzeSentiment(analysis.tokens);

    // Determine complexity
    analysis.complexity = this.assessComplexity(analysis.tokens);

    // Identify topics
    analysis.topics = this.identifyTopics(analysis.keywords, analysis.entities);

    return analysis;
  }

  /**
   * Classify the intent behind the question
   * @param {string} question - Original question
   * @param {Object} analysis - Question analysis
   * @returns {Object} Intent classification
   */
  classifyIntent(question, analysis) {
    const question_lower = question.toLowerCase();

    // Check against intent patterns
    for (const [intentName, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (this.matchPattern(question_lower, pattern)) {
          return {
            name: intentName,
            confidence: this.calculatePatternConfidence(question_lower, pattern),
            matchedPattern: pattern
          };
        }
      }
    }

    // Fallback to keyword-based classification
    return this.classifyByKeywords(analysis.keywords);
  }

  /**
   * Generate contextual response based on intent and analysis
   * @param {Object} intent - Classified intent
   * @param {Object} analysis - Question analysis
   * @param {Object} contextData - Athlete context
   * @returns {Object} Generated response
   */
  generateResponse(intent, analysis, contextData) {
    const response = {
      text: '',
      suggestions: [],
      followUp: []
    };

    switch (intent.name) {
      case 'technique_question':
        response.text = this.generateTechniqueResponse(analysis.entities, contextData);
        response.suggestions = this.getTechniqueSuggestions(analysis.entities);
        break;

      case 'strategy_question':
        response.text = this.generateStrategyResponse(analysis.topics, contextData);
        response.suggestions = this.getStrategySuggestions(analysis.topics);
        break;

      case 'performance_question':
        response.text = this.generatePerformanceResponse(analysis, contextData);
        response.followUp = ['What specific aspect would you like to improve?'];
        break;

      case 'injury_question':
        response.text = this.generateInjuryResponse(analysis, contextData);
        response.followUp = ['Have you consulted a medical professional?'];
        break;

      case 'motivation_question':
        response.text = this.generateMotivationResponse(analysis.sentiment, contextData);
        break;

      default:
        response.text = this.generateGeneralResponse(analysis);
    }

    return response;
  }

  /**
   * Get contextual data for athlete
   * @param {string} athleteId - Athlete's ID
   * @param {Object} context - Additional context
   * @returns {Object} Context data
   */
  getContextData(athleteId, context) {
    if (!athleteId) return {};

    // Get from memory or database
    const memory = this.contextMemory.get(athleteId) || {};
    const conversation = this.conversationHistory.get(athleteId) || [];

    return {
      ...memory,
      ...context,
      recentTopics: this.extractRecentTopics(conversation),
      skillLevel: memory.skillLevel || 'intermediate',
      position: memory.position || 'unknown',
      experience: memory.experience || 'moderate'
    };
  }

  /**
   * Update conversation history for context
   * @param {string} athleteId - Athlete's ID
   * @param {string} question - Original question
   * @param {Object} response - Generated response
   */
  updateConversationHistory(athleteId, question, response) {
    if (!athleteId) return;

    const history = this.conversationHistory.get(athleteId) || [];
    history.push({
      timestamp: new Date(),
      question,
      response: response.text,
      intent: response.intent,
      topics: response.analysis?.topics || []
    });

    // Keep only last 10 conversations
    if (history.length > 10) {
      history.shift();
    }

    this.conversationHistory.set(athleteId, history);
  }

  // Core NLP methods
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  extractKeywords(tokens) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'what', 'how', 'why', 'when', 'where', 'who', 'which']);

    return tokens.filter(token =>
      token.length > 2 &&
      !stopWords.has(token) &&
      !/^\d+$/.test(token)
    );
  }

  extractEntities(tokens) {
    const entities = [];
    const techniques = ['cover 2', 'man to man', 'zone', 'blitz', 'screen', 'sweep', 'counter', 'slant', 'out', 'curl', 'fade'];
    const positions = ['quarterback', 'qb', 'running back', 'rb', 'wide receiver', 'wr', 'tight end', 'te', 'offensive line', 'ol', 'defensive line', 'dl', 'linebacker', 'lb', 'cornerback', 'cb', 'safety', 's'];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const nextToken = tokens[i + 1];

      // Check for compound terms
      if (nextToken) {
        const compound = `${token} ${nextToken}`;
        if (techniques.includes(compound)) {
          entities.push({ type: 'technique', value: compound });
          i++; // Skip next token
          continue;
        }
        if (positions.includes(compound)) {
          entities.push({ type: 'position', value: compound });
          i++;
          continue;
        }
      }

      // Check single terms
      if (techniques.includes(token)) {
        entities.push({ type: 'technique', value: token });
      } else if (positions.includes(token)) {
        entities.push({ type: 'position', value: token });
      }
    }

    return entities;
  }

  analyzeSentiment(tokens) {
    const positiveWords = new Set(['good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'love', 'enjoy', 'improve', 'better', 'best']);
    const negativeWords = new Set(['bad', 'terrible', 'awful', 'hate', 'worst', 'difficult', 'hard', 'struggle', 'problem', 'issue', 'worry']);

    let positiveCount = 0;
    let negativeCount = 0;

    tokens.forEach(token => {
      if (positiveWords.has(token)) positiveCount++;
      if (negativeWords.has(token)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  assessComplexity(tokens) {
    const complexIndicators = ['explain', 'understand', 'difference', 'compare', 'analyze', 'strategy', 'technique', 'advanced'];

    const complexityScore = tokens.filter(token => complexIndicators.includes(token)).length;

    if (complexityScore >= 2) return 'complex';
    if (complexityScore === 1) return 'moderate';
    return 'simple';
  }

  identifyTopics(keywords, entities) {
    const topics = [];

    // Technique-related topics
    if (keywords.some(k => ['technique', 'form', 'mechanics', 'drill'].includes(k))) {
      topics.push('technique');
    }

    // Strategy-related topics
    if (keywords.some(k => ['strategy', 'play', 'defense', 'offense', 'coverage'].includes(k))) {
      topics.push('strategy');
    }

    // Performance-related topics
    if (keywords.some(k => ['performance', 'improve', 'better', 'speed', 'strength'].includes(k))) {
      topics.push('performance');
    }

    // Injury-related topics
    if (keywords.some(k => ['injury', 'pain', 'hurt', 'recovery'].includes(k))) {
      topics.push('injury');
    }

    // Add entity-based topics
    entities.forEach(entity => {
      if (!topics.includes(entity.type)) {
        topics.push(entity.type);
      }
    });

    return topics;
  }

  matchPattern(text, pattern) {
    // Simple pattern matching - could be enhanced with regex
    return text.includes(pattern.toLowerCase());
  }

  calculatePatternConfidence(text, pattern) {
    // Simple confidence based on pattern match quality
    const patternWords = pattern.toLowerCase().split(' ');
    const textWords = text.split(' ');

    let matches = 0;
    patternWords.forEach(word => {
      if (textWords.includes(word)) matches++;
    });

    return matches / patternWords.length;
  }

  classifyByKeywords(keywords) {
    // Fallback classification based on keywords
    if (keywords.some(k => ['technique', 'form', 'drill'].includes(k))) {
      return { name: 'technique_question', confidence: 0.6 };
    }
    if (keywords.some(k => ['strategy', 'play', 'defense'].includes(k))) {
      return { name: 'strategy_question', confidence: 0.6 };
    }
    if (keywords.some(k => ['injury', 'pain', 'hurt'].includes(k))) {
      return { name: 'injury_question', confidence: 0.6 };
    }

    return { name: 'general_question', confidence: 0.4 };
  }

  // Response generation methods
  generateTechniqueResponse(entities, context) {
    const technique = entities.find(e => e.type === 'technique')?.value || 'general technique';

    if (technique === 'cover 2') {
      return "The Cover 2 defense is a zone defense where two safeties split the field into deep halves. Each safety is responsible for half of the deep zone, while cornerbacks play man-to-man underneath. This defense is effective against vertical passing attacks but can be vulnerable to short routes.";
    }

    if (technique === 'man to man') {
      return "Man-to-man defense assigns each defensive player to cover a specific offensive player. It requires athletic defenders and strong one-on-one skills. The key is maintaining leverage and using proper footwork to mirror your opponent's movements.";
    }

    return `For ${technique}, focus on proper fundamentals and consistent practice. Would you like me to break down the key components or suggest specific drills?`;
  }

  generateStrategyResponse(topics, context) {
    if (topics.includes('defense')) {
      return "Defensive strategy depends on your opponent's tendencies and your team's strengths. Consider mixing coverages to keep the offense guessing, and focus on taking away their primary threats while creating opportunities for turnovers.";
    }

    if (topics.includes('offense')) {
      return "Offensive strategy should maximize your team's strengths while exploiting defensive weaknesses. Balance between running and passing, and be prepared to adjust based on what the defense is giving you.";
    }

    return "Football strategy involves understanding both your team's capabilities and your opponent's tendencies. The key is preparation, adaptability, and execution under pressure.";
  }

  generatePerformanceResponse(analysis, context) {
    if (analysis.sentiment === 'negative') {
      return "Performance challenges are normal in sports. Focus on the process rather than the outcome. Break down your goals into smaller, achievable steps and track your progress consistently.";
    }

    return "Performance improvement comes from consistent, focused training. Identify your strengths and weaknesses, then create a plan to address each area systematically.";
  }

  generateInjuryResponse(analysis, context) {
    return "Safety is the top priority in sports. If you're dealing with an injury or pain, stop the activity immediately and consult a medical professional. Prevention through proper warm-up, technique, and recovery is key to long-term success.";
  }

  generateMotivationResponse(sentiment, context) {
    if (sentiment === 'negative') {
      return "Every athlete faces challenges and setbacks. Remember why you started and focus on the progress you've made. Break through mental barriers by setting small goals and celebrating each achievement.";
    }

    return "Great attitude! Motivation comes from within, but it's fueled by preparation and purpose. Stay focused on your goals and trust the process.";
  }

  generateGeneralResponse(analysis) {
    return "I'm here to help with football strategies, techniques, performance improvement, and injury prevention. What specific aspect of the game would you like to discuss?";
  }

  getTechniqueSuggestions(entities) {
    const suggestions = [];

    if (entities.some(e => e.value === 'cover 2')) {
      suggestions.push("Practice deep zone drops with your safeties");
      suggestions.push("Work on cornerback man-to-man drills");
      suggestions.push("Study film of successful Cover 2 teams");
    }

    return suggestions;
  }

  getStrategySuggestions(topics) {
    const suggestions = [];

    if (topics.includes('defense')) {
      suggestions.push("Analyze opponent's tendencies from game film");
      suggestions.push("Practice multiple defensive looks");
      suggestions.push("Focus on communication and assignments");
    }

    return suggestions;
  }

  extractRecentTopics(conversation) {
    const recent = conversation.slice(-3);
    const topics = new Set();

    recent.forEach(entry => {
      (entry.topics || []).forEach(topic => topics.add(topic));
    });

    return Array.from(topics);
  }

  generateFallbackResponse(question) {
    return {
      response: "I can help with football strategies, defensive schemes, offensive plays, training techniques, and performance improvement. Try asking about specific techniques like 'Cover 2 defense' or 'quarterback footwork'.",
      intent: 'fallback',
      confidence: 0.3,
      suggestions: [],
      followUp: [],
      analysis: { tokens: [], keywords: [], entities: [], sentiment: 'neutral', complexity: 'simple', topics: [] },
      timestamp: new Date()
    };
  }

  initializeKnowledgeBase() {
    return {
      techniques: {
        'cover 2': {
          description: 'Zone defense with two deep safeties',
          keyPoints: ['Deep coverage', 'Underneath man coverage', 'Blitz packages'],
          drills: ['Zone drops', 'Man-to-man transitions']
        },
        'man to man': {
          description: 'Each defender covers specific offensive player',
          keyPoints: ['Leverage', 'Footwork', 'Jam technique'],
          drills: ['One-on-one coverage', 'Mirror drills']
        }
      },
      strategies: {
        defense: ['Coverage principles', 'Blitz timing', 'Disguises'],
        offense: ['Route combinations', 'Protection schemes', 'Play-action']
      }
    };
  }

  initializeIntentPatterns() {
    return {
      technique_question: [
        'how do i',
        'what is the proper',
        'technique for',
        'form for',
        'drill for'
      ],
      strategy_question: [
        'how to play',
        'strategy for',
        'against',
        'defense against',
        'offense against'
      ],
      performance_question: [
        'how can i improve',
        'better at',
        'performance',
        'getting better'
      ],
      injury_question: [
        'injury',
        'pain',
        'hurt',
        'recovery',
        'prevention'
      ],
      motivation_question: [
        'motivation',
        'confidence',
        'mental',
        'focus'
      ]
    };
  }

  /**
   * Get coach statistics
   * @returns {Object} Coach statistics
   */
  getStats() {
    return {
      conversationsHandled: this.conversationHistory.size,
      knowledgeBaseSize: Object.keys(this.knowledgeBase).length,
      intentPatterns: Object.keys(this.intentPatterns).length,
      version: '1.0.0'
    };
  }
}

module.exports = EnhancedNLPCoach;
