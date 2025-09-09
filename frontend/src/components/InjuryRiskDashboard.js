import React, { useState, useEffect } from 'react';
import { getInjuryRisk, getInjuryRiskTrends, getInjuryPreventionRecommendations } from '../utils/api';
import './InjuryRiskDashboard.css';

const InjuryRiskDashboard = ({ athleteId }) => {
  const [riskData, setRiskData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadInjuryRiskData();
  }, [athleteId]);

  const loadInjuryRiskData = async () => {
    try {
      setLoading(true);
      const [riskResponse, trendsResponse, recResponse] = await Promise.all([
        getInjuryRisk(athleteId),
        getInjuryRiskTrends(athleteId),
        getInjuryPreventionRecommendations(athleteId)
      ]);

      if (riskResponse.success) setRiskData(riskResponse.data);
      if (trendsResponse.success) setTrendsData(trendsResponse.data);
      if (recResponse.success) setRecommendations(recResponse.data);
    } catch (error) {
      console.error('Error loading injury risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return '#e74c3c';
      case 'MODERATE': return '#f39c12';
      case 'LOW': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'HIGH': return '⚠️';
      case 'MODERATE': return '🟡';
      case 'LOW': return '✅';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="injury-risk-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Analyzing injury risk...</p>
      </div>
    );
  }

  return (
    <div className="injury-risk-dashboard">
      <div className="dashboard-header">
        <h2>Injury Risk Assessment</h2>
        <div className="risk-summary">
          {riskData && (
            <div
              className="risk-badge"
              style={{ backgroundColor: getRiskColor(riskData.assessment.riskLevel) }}
            >
              {getRiskIcon(riskData.assessment.riskLevel)}
              <span>{riskData.assessment.riskLevel} RISK</span>
              <span className="risk-score">{riskData.assessment.riskScore}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'trends' ? 'active' : ''}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button
          className={activeTab === 'recommendations' ? 'active' : ''}
          onClick={() => setActiveTab('recommendations')}
        >
          Prevention
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && riskData && (
          <div className="overview-tab">
            <div className="risk-metrics">
              <div className="metric-card">
                <h3>Risk Score</h3>
                <div className="metric-value">{riskData.assessment.riskScore}%</div>
                <div className="metric-label">Current Risk Level</div>
              </div>

              <div className="metric-card">
                <h3>Confidence</h3>
                <div className="metric-value">{Math.round(riskData.assessment.confidence * 100)}%</div>
                <div className="metric-label">Assessment Accuracy</div>
              </div>

              <div className="metric-card">
                <h3>Data Points</h3>
                <div className="metric-value">{riskData.dataPoints.sessionsAnalyzed}</div>
                <div className="metric-label">Training Sessions</div>
              </div>

              <div className="metric-card">
                <h3>Prior Injuries</h3>
                <div className="metric-value">{riskData.dataPoints.injuriesFound}</div>
                <div className="metric-label">Historical Records</div>
              </div>
            </div>

            <div className="risk-factors">
              <h3>Key Risk Factors</h3>
              <div className="factors-list">
                {riskData.assessment.factors && Object.entries(riskData.assessment.factors).map(([factor, value]) => (
                  <div key={factor} className="factor-item">
                    <span className="factor-name">{factor.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    <div className="factor-bar">
                      <div
                        className="factor-fill"
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                    <span className="factor-value">{Math.round(value * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && trendsData && (
          <div className="trends-tab">
            <h3>Risk Trends Over Time</h3>
            <div className="trends-chart">
              {trendsData.trends.map((trend, index) => (
                <div key={index} className="trend-point">
                  <div className="trend-month">{trend.month}</div>
                  <div className="trend-bar">
                    <div
                      className="trend-fill"
                      style={{
                        width: `${trend.riskScore}%`,
                        backgroundColor: getRiskColor(trend.riskLevel)
                      }}
                    ></div>
                  </div>
                  <div className="trend-value">{trend.riskScore}%</div>
                  <div className="trend-level">{trend.riskLevel}</div>
                </div>
              ))}
            </div>

            <div className="trends-stats">
              <div className="stat-item">
                <span className="stat-label">Average Risk</span>
                <span className="stat-value">
                  {Math.round(trendsData.trends.reduce((sum, t) => sum + t.riskScore, 0) / trendsData.trends.length)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Highest Risk</span>
                <span className="stat-value">
                  {Math.max(...trendsData.trends.map(t => t.riskScore))}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Risk Trend</span>
                <span className="stat-value">
                  {trendsData.trends[trendsData.trends.length - 1].riskScore >
                   trendsData.trends[0].riskScore ? 'Increasing' : 'Decreasing'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && recommendations && (
          <div className="recommendations-tab">
            <div className="recommendations-list">
              {recommendations.recommendations.map((rec, index) => (
                <div key={index} className={`recommendation-card priority-${rec.priority.toLowerCase()}`}>
                  <div className="recommendation-header">
                    <span className="priority-badge">{rec.priority}</span>
                    <span className="category">{rec.category}</span>
                  </div>
                  <p className="recommendation-text">{rec.message}</p>
                  {rec.actions && (
                    <ul className="action-list">
                      {rec.actions.map((action, actionIndex) => (
                        <li key={actionIndex}>{action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="prevention-tips">
              <h3>General Prevention Tips</h3>
              <div className="tips-grid">
                {recommendations.preventionTips.map((tip, index) => (
                  <div key={index} className="tip-item">
                    <span className="tip-icon">💡</span>
                    <span className="tip-text">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <p className="disclaimer">
          This assessment is for informational purposes only and should not replace professional medical advice.
          Always consult with qualified medical professionals for injury concerns.
        </p>
        <button className="refresh-btn" onClick={loadInjuryRiskData}>
          🔄 Refresh Assessment
        </button>
      </div>
    </div>
  );
};

export default InjuryRiskDashboard;
