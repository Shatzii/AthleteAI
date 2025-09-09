import React, { useState, useEffect, useRef } from 'react';
import { askEnhancedCoach, getCoachSuggestions, getCoachTopics, getCoachStats } from '../utils/api';
import './EnhancedNLPCoach.css';

const EnhancedNLPCoach = ({ athleteId }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your enhanced AI football coach. I can help with techniques, strategies, performance improvement, and injury prevention. What would you like to discuss?',
      timestamp: new Date(),
      suggestions: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [topics, setTopics] = useState({});
  const [stats, setStats] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCoachData();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCoachData = async () => {
    try {
      const [suggestionsResponse, topicsResponse, statsResponse] = await Promise.all([
        getCoachSuggestions(athleteId),
        getCoachTopics(),
        getCoachStats()
      ]);

      if (suggestionsResponse.success) {
        setSuggestions(suggestionsResponse.data.suggestions);
      }
      if (topicsResponse.success) {
        setTopics(topicsResponse.data.topics);
      }
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading coach data:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send to enhanced coach
      const response = await askEnhancedCoach(message, athleteId);

      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.response,
          timestamp: new Date(),
          intent: response.data.intent,
          confidence: response.data.confidence,
          suggestions: response.data.suggestions || [],
          followUp: response.data.followUp || []
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Error message
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: 'I apologize, but I encountered an error processing your question. Please try again.',
          timestamp: new Date(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I\'m having trouble connecting right now. Please check your internet connection and try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion.question);
    handleSendMessage(suggestion.question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getIntentIcon = (intent) => {
    const icons = {
      technique_question: '🎯',
      strategy_question: '📋',
      performance_question: '📈',
      injury_question: '🏥',
      motivation_question: '💪',
      general_question: '💬'
    };
    return icons[intent] || '💬';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#27ae60';
    if (confidence >= 0.6) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="enhanced-nlp-coach">
      <div className="coach-header">
        <div className="coach-info">
          <h2>🤖 Enhanced AI Football Coach</h2>
          <div className="coach-stats">
            {stats && (
              <>
                <span className="stat-item">
                  <span className="stat-icon">💬</span>
                  {stats.totalQuestionsAnswered} questions answered
                </span>
                <span className="stat-item">
                  <span className="stat-icon">⚡</span>
                  {stats.averageResponseTime} response time
                </span>
              </>
            )}
          </div>
        </div>

        <div className="topic-selector">
          <select
            value={activeTopic || ''}
            onChange={(e) => setActiveTopic(e.target.value || null)}
          >
            <option value="">All Topics</option>
            {Object.entries(topics).map(([key, topic]) => (
              <option key={key} value={key}>{topic.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="coach-content">
        <div className="messages-container">
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.type} ${message.isError ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {message.type === 'ai' ? '🤖' : '👤'}
                </div>

                <div className="message-content">
                  <div className="message-text">{message.content}</div>

                  {message.intent && (
                    <div className="message-meta">
                      <span className="intent-badge">
                        {getIntentIcon(message.intent)}
                        {message.intent.replace('_', ' ')}
                      </span>
                      <span
                        className="confidence-badge"
                        style={{ backgroundColor: getConfidenceColor(message.confidence) }}
                      >
                        {Math.round(message.confidence * 100)}% confident
                      </span>
                    </div>
                  )}

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="message-suggestions">
                      <div className="suggestions-label">💡 Suggestions:</div>
                      <div className="suggestions-list">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="suggestion-chip"
                            onClick={() => handleSuggestionClick({ question: suggestion })}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.followUp && message.followUp.length > 0 && (
                    <div className="message-followup">
                      <div className="followup-label">🔍 Follow-up questions:</div>
                      <ul className="followup-list">
                        {message.followUp.map((question, index) => (
                          <li key={index}>
                            <button
                              className="followup-link"
                              onClick={() => handleSuggestionClick({ question })}
                            >
                              {question}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message ai typing">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about football techniques, strategies, or performance..."
              rows={1}
              disabled={isTyping}
            />
            <button
              className="send-button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
            >
              {isTyping ? '⏳' : '📤'}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="quick-suggestions">
              <div className="suggestions-label">💡 Quick suggestions:</div>
              <div className="suggestions-grid">
                {suggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={index}
                    className="quick-suggestion"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isTyping}
                  >
                    {suggestion.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="coach-footer">
        <div className="topics-overview">
          <h4>Available Topics:</h4>
          <div className="topics-list">
            {Object.entries(topics).map(([key, topic]) => (
              <div key={key} className="topic-item">
                <span className="topic-icon">
                  {key === 'technique' ? '🎯' :
                   key === 'strategy' ? '📋' :
                   key === 'performance' ? '📈' :
                   key === 'injury' ? '🏥' :
                   key === 'motivation' ? '💪' : '💬'}
                </span>
                <span className="topic-name">{topic.name}</span>
                <span className="topic-examples">{topic.examples?.length || 0} examples</span>
              </div>
            ))}
          </div>
        </div>

        <div className="coach-disclaimer">
          <p>
            This AI coach provides general guidance based on football knowledge and best practices.
            Always consult with qualified coaches and medical professionals for personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNLPCoach;
