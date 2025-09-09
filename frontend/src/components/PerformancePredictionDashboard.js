import React, { useState, useEffect } from 'react';
import { getPerformancePrediction, getPerformanceAnalysis, getTrainingOptimization } from '../utils/api';
import './PerformancePredictionDashboard.css';

const PerformancePredictionDashboard = ({ athleteId }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prediction');

  useEffect(() => {
    loadPerformanceData();
  }, [athleteId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [predictionResponse, analysisResponse, optimizationResponse] = await Promise.all([
        getPerformancePrediction(athleteId),
        getPerformanceAnalysis(athleteId),
        getTrainingOptimization(athleteId)
      ]);

      if (predictionResponse.success) setPredictionData(predictionResponse.data);
      if (analysisResponse.success) setAnalysisData(analysisResponse.data);
      if (optimizationResponse.success) setOptimizationData(optimizationResponse.data);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return '#27ae60';
      case 'declining': return '#e74c3c';
      case 'stable': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div className="performance-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Analyzing performance data...</p>
      </div>
    );
  }

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h2>Performance Prediction & Analysis</h2>
        <div className="prediction-summary">
          {predictionData && (
            <div className="prediction-badge">
              <span className="prediction-score">{predictionData.prediction.predictedPerformance}</span>
              <span className="prediction-label">Predicted GAR</span>
              <div className="trend-indicator">
                {getTrendIcon(predictionData.prediction.trend)}
                <span style={{ color: getTrendColor(predictionData.prediction.trend) }}>
                  {predictionData.prediction.trend}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'prediction' ? 'active' : ''}
          onClick={() => setActiveTab('prediction')}
        >
          Prediction
        </button>
        <button
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button
          className={activeTab === 'optimization' ? 'active' : ''}
          onClick={() => setActiveTab('optimization')}
        >
          Optimization
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'prediction' && predictionData && (
          <div className="prediction-tab">
            <div className="prediction-overview">
              <div className="prediction-card">
                <h3>Performance Forecast</h3>
                <div className="forecast-value">{predictionData.prediction.predictedPerformance}</div>
                <div className="forecast-label">Predicted GAR Score</div>
                <div className="confidence-meter">
                  <div className="confidence-label">Confidence: {Math.round(predictionData.prediction.confidence * 100)}%</div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${predictionData.prediction.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="prediction-card">
                <h3>Trend Analysis</h3>
                <div className="trend-display">
                  <span className="trend-icon">{getTrendIcon(predictionData.prediction.trend)}</span>
                  <span className="trend-text">{predictionData.prediction.trend}</span>
                </div>
                <div className="trend-strength">
                  Strength: {Math.round(predictionData.prediction.trendStrength * 100)}%
                </div>
              </div>

              <div className="prediction-card">
                <h3>Time Horizon</h3>
                <div className="horizon-value">{predictionData.prediction.timeHorizon} days</div>
                <div className="horizon-label">Prediction period</div>
              </div>
            </div>

            <div className="performance-factors">
              <h3>Key Performance Factors</h3>
              <div className="factors-breakdown">
                {predictionData.prediction.factors && Object.entries(predictionData.prediction.factors).map(([factor, value]) => (
                  <div key={factor} className="factor-breakdown">
                    <div className="factor-header">
                      <span className="factor-name">{factor.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      <span className="factor-percentage">{Math.round(value * 100)}%</span>
                    </div>
                    <div className="factor-progress">
                      <div
                        className="factor-progress-fill"
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && analysisData && (
          <div className="analysis-tab">
            <div className="analysis-grid">
              <div className="analysis-card">
                <h3>Training Consistency</h3>
                <div className="analysis-value">{Math.round(analysisData.analysis.trainingConsistency * 100)}%</div>
                <div className="analysis-description">
                  {analysisData.analysis.trainingConsistency > 0.7 ? 'Excellent consistency' :
                   analysisData.analysis.trainingConsistency > 0.5 ? 'Good consistency' :
                   'Needs improvement'}
                </div>
              </div>

              <div className="analysis-card">
                <h3>Improvement Rate</h3>
                <div className="analysis-value">{Math.round(analysisData.analysis.improvementRate * 100)}%</div>
                <div className="analysis-description">
                  {analysisData.analysis.improvementRate > 0 ? 'Improving' : 'Declining'}
                </div>
              </div>

              <div className="analysis-card">
                <h3>Recovery Quality</h3>
                <div className="analysis-value">{Math.round(analysisData.analysis.recoveryQuality * 100)}%</div>
                <div className="analysis-description">
                  {analysisData.analysis.recoveryQuality > 0.7 ? 'Excellent recovery' :
                   analysisData.analysis.recoveryQuality > 0.5 ? 'Good recovery' :
                   'Needs attention'}
                </div>
              </div>
            </div>

            <div className="workload-analysis">
              <h3>Training Load Distribution</h3>
              <div className="workload-bars">
                {Object.entries(analysisData.analysis.workloadDistribution).map(([level, count]) => (
                  <div key={level} className="workload-bar">
                    <div className="workload-label">{level}</div>
                    <div className="workload-visual">
                      <div
                        className="workload-fill"
                        style={{ width: `${(count / analysisData.analysis.sessionsCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="workload-count">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="peak-performance">
              <h3>Peak Performance Analysis</h3>
              {analysisData.analysis.peakPerformance ? (
                <div className="peak-details">
                  <div className="peak-metric">
                    <span className="peak-label">Date:</span>
                    <span className="peak-value">{new Date(analysisData.analysis.peakPerformance.date).toLocaleDateString()}</span>
                  </div>
                  <div className="peak-metric">
                    <span className="peak-label">Performance:</span>
                    <span className="peak-value">{analysisData.analysis.peakPerformance.performance}</span>
                  </div>
                  <div className="peak-conditions">
                    <h4>Optimal Conditions:</h4>
                    <ul>
                      {Object.entries(analysisData.analysis.peakPerformance.conditions).map(([condition, value]) => (
                        <li key={condition}>
                          {condition.replace(/([A-Z])/g, ' $1').toLowerCase()}: {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>No peak performance data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'optimization' && optimizationData && (
          <div className="optimization-tab">
            <div className="optimization-recommendations">
              <h3>Training Optimization Recommendations</h3>
              <div className="recommendations-list">
                {optimizationData.optimization && Object.entries(optimizationData.optimization).map(([category, recommendation]) => (
                  <div key={category} className="optimization-item">
                    <div className="optimization-header">
                      <h4>{category.replace(/([A-Z])/g, ' $1').toLowerCase()}</h4>
                      <span className="optimization-target">{recommendation.target}</span>
                    </div>
                    <p className="optimization-reasoning">{recommendation.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="focus-areas">
              <h3>Areas to Focus On</h3>
              <div className="focus-list">
                {optimizationData.optimization?.focusAreas?.map((area, index) => (
                  <div key={index} className={`focus-item priority-${area.priority}`}>
                    <div className="focus-header">
                      <span className="priority-indicator">{area.priority}</span>
                      <span className="focus-area">{area.area.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    </div>
                    <p className="focus-action">{area.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="periodization-plan">
              <h3>Periodization Plan</h3>
              {optimizationData.optimization?.periodizationPlan ? (
                <div className="periodization-card">
                  <div className="periodization-phase">{optimizationData.optimization.periodizationPlan.phase}</div>
                  <div className="periodization-details">
                    <div className="periodization-duration">{optimizationData.optimization.periodizationPlan.duration}</div>
                    <div className="periodization-focus">{optimizationData.optimization.periodizationPlan.focus}</div>
                    <div className="periodization-intensity">{optimizationData.optimization.periodizationPlan.intensity}</div>
                  </div>
                </div>
              ) : (
                <p>No periodization plan available</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <p className="disclaimer">
          Performance predictions are based on historical data and current trends.
          Individual results may vary based on training consistency and external factors.
        </p>
        <button className="refresh-btn" onClick={loadPerformanceData}>
          🔄 Refresh Analysis
        </button>
      </div>
    </div>
  );
};

export default PerformancePredictionDashboard;
