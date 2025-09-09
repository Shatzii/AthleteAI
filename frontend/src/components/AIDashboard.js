import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import InjuryRiskDashboard from './InjuryRiskDashboard';
import PerformancePredictionDashboard from './PerformancePredictionDashboard';
import EnhancedNLPCoach from './EnhancedNLPCoach';
import './AIDashboard.css';

const AIDashboard = () => {
  const { user } = useAuth();
  const [activeComponent, setActiveComponent] = useState('overview');
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [athletes, setAthletes] = useState([]);

  useEffect(() => {
    // Load athlete data - in a real app, this would come from an API
    loadAthletes();
  }, []);

  const loadAthletes = () => {
    // Mock athlete data - replace with actual API call
    const mockAthletes = [
      {
        id: '1',
        name: 'John Smith',
        position: 'QB',
        year: 'Junior',
        garScore: 85,
        team: 'Tigers'
      },
      {
        id: '2',
        name: 'Mike Johnson',
        position: 'RB',
        year: 'Senior',
        garScore: 92,
        team: 'Tigers'
      },
      {
        id: '3',
        name: 'Sarah Davis',
        position: 'WR',
        year: 'Sophomore',
        garScore: 78,
        team: 'Tigers'
      }
    ];
    setAthletes(mockAthletes);
    setSelectedAthlete(mockAthletes[0]); // Default to first athlete
  };

  const handleAthleteChange = (athleteId) => {
    const athlete = athletes.find(a => a.id === athleteId);
    setSelectedAthlete(athlete);
  };

  const renderActiveComponent = () => {
    if (!selectedAthlete) {
      return (
        <div className="no-athlete-selected">
          <h3>Please select an athlete to view AI insights</h3>
        </div>
      );
    }

    switch (activeComponent) {
      case 'injury-risk':
        return <InjuryRiskDashboard athleteId={selectedAthlete.id} />;
      case 'performance':
        return <PerformancePredictionDashboard athleteId={selectedAthlete.id} />;
      case 'coach':
        return <EnhancedNLPCoach athleteId={selectedAthlete.id} />;
      case 'overview':
      default:
        return <AIOverview athletes={athletes} selectedAthlete={selectedAthlete} />;
    }
  };

  return (
    <div className="ai-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>🤖 AI Sports Analytics</h2>
          <p>Powered by Machine Learning</p>
        </div>

        <div className="athlete-selector">
          <h3>Select Athlete</h3>
          <select
            value={selectedAthlete?.id || ''}
            onChange={(e) => handleAthleteChange(e.target.value)}
          >
            {athletes.map(athlete => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.name} - {athlete.position} ({athlete.year})
              </option>
            ))}
          </select>

          {selectedAthlete && (
            <div className="athlete-info">
              <div className="athlete-stat">
                <span className="stat-label">GAR Score:</span>
                <span className="stat-value">{selectedAthlete.garScore}</span>
              </div>
              <div className="athlete-stat">
                <span className="stat-label">Position:</span>
                <span className="stat-value">{selectedAthlete.position}</span>
              </div>
              <div className="athlete-stat">
                <span className="stat-label">Year:</span>
                <span className="stat-value">{selectedAthlete.year}</span>
              </div>
            </div>
          )}
        </div>

        <nav className="dashboard-nav">
          <button
            className={activeComponent === 'overview' ? 'active' : ''}
            onClick={() => setActiveComponent('overview')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Overview</span>
          </button>

          <button
            className={activeComponent === 'injury-risk' ? 'active' : ''}
            onClick={() => setActiveComponent('injury-risk')}
          >
            <span className="nav-icon">🏥</span>
            <span className="nav-text">Injury Risk</span>
          </button>

          <button
            className={activeComponent === 'performance' ? 'active' : ''}
            onClick={() => setActiveComponent('performance')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Performance</span>
          </button>

          <button
            className={activeComponent === 'coach' ? 'active' : ''}
            onClick={() => setActiveComponent('coach')}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-text">AI Coach</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="ai-features">
            <h4>AI Features</h4>
            <ul>
              <li>✅ Injury Risk Prediction</li>
              <li>✅ Performance Forecasting</li>
              <li>✅ Training Optimization</li>
              <li>✅ Enhanced Coaching</li>
              <li>✅ Real-time Analytics</li>
            </ul>
          </div>

          <div className="tech-stack">
            <h4>Technology</h4>
            <div className="tech-tags">
              <span className="tech-tag">Machine Learning</span>
              <span className="tech-tag">Predictive Analytics</span>
              <span className="tech-tag">NLP</span>
              <span className="tech-tag">Real-time Processing</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="main-header">
          <h1>
            {activeComponent === 'overview' && 'AI Sports Analytics Overview'}
            {activeComponent === 'injury-risk' && 'Injury Risk Assessment'}
            {activeComponent === 'performance' && 'Performance Prediction & Analysis'}
            {activeComponent === 'coach' && 'Enhanced AI Football Coach'}
          </h1>

          <div className="header-actions">
            <button className="refresh-btn">
              🔄 Refresh Data
            </button>
            <button className="export-btn">
              📊 Export Report
            </button>
          </div>
        </div>

        <div className="main-content">
          {renderActiveComponent()}
        </div>
      </div>
    </div>
  );
};

// Overview component for the main dashboard
const AIOverview = ({ athletes, selectedAthlete }) => {
  const [overviewStats, setOverviewStats] = useState({
    totalAthletes: 0,
    avgRiskScore: 0,
    avgPerformance: 0,
    aiQueriesToday: 0
  });

  useEffect(() => {
    // Calculate overview statistics
    const stats = {
      totalAthletes: athletes.length,
      avgRiskScore: athletes.length > 0 ? athletes.reduce((sum, a) => sum + (a.garScore || 0), 0) / athletes.length : 0,
      avgPerformance: athletes.length > 0 ? athletes.reduce((sum, a) => sum + (a.garScore || 0), 0) / athletes.length : 0,
      aiQueriesToday: Math.floor(Math.random() * 50) + 10 // Mock data
    };
    setOverviewStats(stats);
  }, [athletes]);

  return (
    <div className="ai-overview">
      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{overviewStats.totalAthletes}</div>
            <div className="stat-label">Total Athletes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(overviewStats.avgPerformance)}</div>
            <div className="stat-label">Avg Performance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <div className="stat-value">{overviewStats.aiQueriesToday}</div>
            <div className="stat-label">AI Queries Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">98%</div>
            <div className="stat-label">AI Accuracy</div>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-section">
          <h3>🚀 Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary">
              <span className="action-icon">🏥</span>
              Check Injury Risk
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">📈</span>
              View Performance
            </button>
            <button className="action-btn tertiary">
              <span className="action-icon">🤖</span>
              Ask AI Coach
            </button>
          </div>
        </div>

        <div className="overview-section">
          <h3>📋 Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">💬</span>
              <div className="activity-content">
                <div className="activity-title">AI Coach Query</div>
                <div className="activity-desc">Asked about quarterback techniques</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📊</span>
              <div className="activity-content">
                <div className="activity-title">Performance Analysis</div>
                <div className="activity-desc">Generated training recommendations</div>
                <div className="activity-time">4 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🏥</span>
              <div className="activity-content">
                <div className="activity-title">Injury Risk Assessment</div>
                <div className="activity-desc">Completed risk evaluation</div>
                <div className="activity-time">1 day ago</div>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-section">
          <h3>🎯 AI Insights</h3>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-icon">📈</span>
              <div className="insight-content">
                <div className="insight-title">Performance Trending Up</div>
                <div className="insight-desc">Your training consistency has improved by 15%</div>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">🏥</span>
              <div className="insight-content">
                <div className="insight-title">Low Injury Risk</div>
                <div className="insight-desc">Current risk assessment shows low probability</div>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">💪</span>
              <div className="insight-content">
                <div className="insight-title">Strength Focus Recommended</div>
                <div className="insight-desc">AI suggests focusing on lower body strength</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
