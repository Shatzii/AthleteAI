import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './VideoAnalysis.css';

const VideoAnalysis = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [sportsData, setSportsData] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSportsData();
    loadAnalysisHistory();
  }, []);

  const loadSportsData = async () => {
    try {
      const response = await fetch('/api/computer-vision/sports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSportsData(data.data);
      }
    } catch (error) {
      console.error('Error loading sports data:', error);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch(`/api/computer-vision/history/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAnalysisHistory(data.data.recentAnalyses || []);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid video file (MP4, AVI, MOV, or WMV)');
        return;
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setSuccess('');
    }
  };

  const handleAnalysis = async () => {
    if (!selectedFile || !selectedSport || !selectedPosition) {
      setError('Please select a video file, sport, and position');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('sport', selectedSport);
      formData.append('position', selectedPosition);
      formData.append('athleteId', user?.id);

      const response = await fetch('/api/computer-vision/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(data.data);
      setSuccess('Video analysis completed successfully!');
      loadAnalysisHistory(); // Refresh history

    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze video. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const getPositionsForSport = (sport) => {
    return sportsData[sport]?.positions || [];
  };

  const getTechniquesForPosition = (sport, position) => {
    return sportsData[sport]?.techniques?.[position] || [];
  };

  return (
    <div className="video-analysis">
      <div className="analysis-header">
        <h2>🎥 Computer Vision Technique Analysis</h2>
        <p>Upload videos for AI-powered technique analysis and performance insights</p>
      </div>

      <div className="analysis-content">
        <div className="upload-section">
          <div className="upload-card">
            <h3>Upload Video for Analysis</h3>

            <div className="form-group">
              <label>Sport:</label>
              <select
                value={selectedSport}
                onChange={(e) => {
                  setSelectedSport(e.target.value);
                  setSelectedPosition(''); // Reset position when sport changes
                }}
                className="sport-select"
              >
                <option value="">Select Sport</option>
                {Object.entries(sportsData).map(([key, sport]) => (
                  <option key={key} value={key}>{sport.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Position:</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                disabled={!selectedSport}
                className="position-select"
              >
                <option value="">Select Position</option>
                {getPositionsForSport(selectedSport).map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>

            <div className="file-upload">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="video/*"
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
                disabled={!selectedSport || !selectedPosition}
              >
                📁 Choose Video File
              </button>

              {selectedFile && (
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleAnalysis}
              disabled={!selectedFile || !selectedSport || !selectedPosition || isAnalyzing}
              className="analyze-btn"
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🚀 Analyze Video'}
            </button>

            {uploadProgress > 0 && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>

        <div className="results-section">
          {analysisResult && (
            <div className="analysis-results">
              <h3>Analysis Results</h3>

              <div className="overall-score">
                <div className="score-circle">
                  <span className="score-number">{analysisResult.analysis.overallScore}</span>
                  <span className="score-label">Overall Score</span>
                </div>
                <div className="score-details">
                  <div className="confidence">
                    Confidence: {analysisResult.confidence}%
                  </div>
                  <div className="sport-info">
                    {analysisResult.sport} - {analysisResult.position}
                  </div>
                </div>
              </div>

              <div className="technique-scores">
                <h4>Technique Scores</h4>
                <div className="scores-grid">
                  {Object.entries(analysisResult.analysis.techniqueAverages).map(([technique, score]) => (
                    <div key={technique} className="score-item">
                      <div className="technique-name">
                        {technique.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{ width: `${score}%` }}
                        ></div>
                        <span className="score-value">{score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recommendations">
                <h4>Recommendations</h4>
                <div className="recommendations-list">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation-item ${rec.priority}`}>
                      <div className="rec-header">
                        <span className="rec-priority">{rec.priority.toUpperCase()}</span>
                        <span className="rec-title">{rec.title}</span>
                      </div>
                      <p className="rec-description">{rec.description}</p>
                      <ul className="rec-actions">
                        {rec.actions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="analysis-history">
            <h3>Analysis History</h3>
            {analysisHistory.length > 0 ? (
              <div className="history-list">
                {analysisHistory.map((analysis, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <div className="history-sport">{analysis.sport} - {analysis.position}</div>
                      <div className="history-score">Score: {analysis.overallScore}</div>
                      <div className="history-date">
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="history-actions">
                      <button className="view-details-btn">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-history">No analysis history available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysis;
