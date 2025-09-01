import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecruitingMatches, getRecruitingConversations, getRecruitingAnalytics } from '../utils/api';
import { Users, Search, MessageSquare, TrendingUp, Target, Award, Calendar, MapPin, Star } from 'lucide-react';
import './RecruitingHub.css';

const RecruitingHub = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const history = useHistory();

  useEffect(() => {
    loadRecruitingData();
  }, []);

  const loadRecruitingData = async () => {
    try {
      const [matchesData, conversationsData, analyticsData] = await Promise.all([
        getRecruitingMatches(),
        getRecruitingConversations(),
        getRecruitingAnalytics()
      ]);

      setMatches(matchesData.matches || []);
      setConversations(conversationsData.conversations || []);
      setAnalytics(analyticsData.analytics || {});
    } catch (error) {
      console.error('Error loading recruiting data:', error);
    }
  };

  const renderDashboard = () => (
    <div className="recruiting-dashboard">
      <div className="dashboard-header">
        <h1>AI-Powered Recruiting Hub</h1>
        <p>Connect athletes with their perfect college fit using advanced AI matching</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>{analytics.totalMatches || 0}</h3>
            <p>AI Matches Found</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">💬</div>
          <div className="metric-content">
            <h3>{conversations.length}</h3>
            <p>Active Conversations</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>{analytics.successRate || 0}%</h3>
            <p>Match Success Rate</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <h3>{analytics.offers || 0}</h3>
            <p>Scholarship Offers</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="action-btn primary"
          onClick={() => setActiveTab('find-matches')}
        >
          <Search className="btn-icon" />
          Find New Matches
        </button>
        <button
          className="action-btn secondary"
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare className="btn-icon" />
          View Messages
        </button>
        <button
          className="action-btn success"
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp className="btn-icon" />
          View Analytics
        </button>
      </div>

      {/* Recent Matches */}
      <div className="recent-matches">
        <h2>Top AI Matches</h2>
        <div className="matches-list">
          {matches.slice(0, 3).map(match => (
            <div key={match.id} className="match-card">
              <div className="match-header">
                <img src={match.schoolLogo} alt={match.schoolName} className="school-logo" />
                <div className="match-info">
                  <h3>{match.schoolName}</h3>
                  <p>{match.program} • {match.location}</p>
                  <div className="match-score">
                    <Star className="star-icon" />
                    <span>{match.matchScore}% Match</span>
                  </div>
                </div>
              </div>
              <div className="match-details">
                <p>{match.reasoning}</p>
                <div className="match-tags">
                  {match.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="match-actions">
                <button className="btn-outline">View Profile</button>
                <button className="btn-primary">Connect</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFindMatches = () => (
    <div className="find-matches">
      <div className="section-header">
        <h1>Find Your Perfect Match</h1>
        <p>Our AI analyzes your profile, performance data, and preferences to find the best college programs</p>
      </div>

      {/* Match Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Sport</label>
          <select>
            <option>All Sports</option>
            <option>Football</option>
            <option>Basketball</option>
            <option>Soccer</option>
            <option>Baseball</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Division</label>
          <select>
            <option>All Divisions</option>
            <option>Division I</option>
            <option>Division II</option>
            <option>Division III</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Location Preference</label>
          <select>
            <option>Any Location</option>
            <option>Northeast</option>
            <option>Southeast</option>
            <option>Midwest</option>
            <option>Southwest</option>
            <option>West Coast</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Academic Focus</label>
          <select>
            <option>Any</option>
            <option>Academic Excellence</option>
            <option>Balanced</option>
            <option>Athletic Focus</option>
          </select>
        </div>
      </div>

      {/* AI Match Results */}
      <div className="match-results">
        <h2>AI-Powered Matches</h2>
        <div className="results-grid">
          {matches.map(match => (
            <div key={match.id} className="result-card">
              <div className="school-header">
                <img src={match.schoolLogo} alt={match.schoolName} />
                <div className="school-info">
                  <h3>{match.schoolName}</h3>
                  <p>{match.mascot} • {match.conference}</p>
                  <div className="match-percentage">
                    {match.matchScore}% Match
                  </div>
                </div>
              </div>

              <div className="match-insights">
                <h4>Why This Match?</h4>
                <ul>
                  {match.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>

              <div className="program-details">
                <div className="detail-item">
                  <Award className="detail-icon" />
                  <span>{match.programDetails}</span>
                </div>
                <div className="detail-item">
                  <MapPin className="detail-icon" />
                  <span>{match.location}</span>
                </div>
                <div className="detail-item">
                  <Users className="detail-icon" />
                  <span>{match.teamSize} athletes</span>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn-outline">View Full Profile</button>
                <button className="btn-primary">Start Conversation</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="messages-section">
      <div className="section-header">
        <h1>Recruitment Conversations</h1>
        <p>Manage your communications with coaches and programs</p>
      </div>

      <div className="conversations-container">
        <div className="conversations-list">
          {conversations.map(conv => (
            <div key={conv.id} className="conversation-item">
              <div className="conv-avatar">
                <img src={conv.coachAvatar} alt={conv.coachName} />
              </div>
              <div className="conv-info">
                <h3>{conv.coachName}</h3>
                <p>{conv.schoolName} • {conv.program}</p>
                <span className="last-message">{conv.lastMessage}</span>
              </div>
              <div className="conv-meta">
                <span className="timestamp">{conv.timestamp}</span>
                {conv.unread > 0 && (
                  <span className="unread-badge">{conv.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="message-thread">
          <div className="thread-header">
            <h2>Conversation with Coach Johnson</h2>
            <p>University of Excellence • Basketball Program</p>
          </div>

          <div className="messages-list">
            <div className="message received">
              <div className="message-content">
                <p>Hi! I saw your profile and I'm very interested in your potential. Would you be available for a call this week?</p>
                <span className="message-time">2 hours ago</span>
              </div>
            </div>

            <div className="message sent">
              <div className="message-content">
                <p>Hi Coach! Thank you for reaching out. I'd love to schedule a call. I'm available Thursday afternoon or Friday morning.</p>
                <span className="message-time">1 hour ago</span>
              </div>
            </div>
          </div>

          <div className="message-input">
            <input type="text" placeholder="Type your message..." />
            <button className="send-btn">Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h1>Recruitment Analytics</h1>
        <p>Track your recruitment progress and optimize your strategy</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Match Quality Over Time</h3>
          <div className="chart-placeholder">
            <TrendingUp className="chart-icon" />
            <p>Match quality chart would go here</p>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Response Rates by Division</h3>
          <div className="chart-placeholder">
            <Target className="chart-icon" />
            <p>Response rates chart would go here</p>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Geographic Interest</h3>
          <div className="chart-placeholder">
            <MapPin className="chart-icon" />
            <p>Geographic map would go here</p>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Timeline to Offers</h3>
          <div className="chart-placeholder">
            <Calendar className="chart-icon" />
            <p>Timeline chart would go here</p>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h2>AI Insights & Recommendations</h2>
        <div className="insights-list">
          <div className="insight-item">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Target Division I Programs</h4>
              <p>Based on your performance metrics, you have a 78% chance of receiving Division I offers. Focus on these programs first.</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">📍</div>
            <div className="insight-content">
              <h4>Geographic Advantage</h4>
              <p>Programs in your region respond 40% faster. Consider prioritizing local schools for quicker responses.</p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h4>Academic Profile Strength</h4>
              <p>Your 3.8 GPA and strong test scores make you competitive for academic-focused programs. Highlight this in communications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="recruiting-hub">
      {/* Navigation Tabs */}
      <div className="hub-navigation">
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'find-matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('find-matches')}
        >
          Find Matches
        </button>
        <button
          className={`nav-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
        <button
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Content Area */}
      <div className="hub-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'find-matches' && renderFindMatches()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};

export default RecruitingHub;
