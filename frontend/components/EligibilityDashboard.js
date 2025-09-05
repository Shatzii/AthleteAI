import React, { useState, useEffect } from 'react';
import { Card, Progress, Alert, Button, Badge } from '../components/ui';
import { useEligibility } from '../hooks/useEligibility';
import { useAICoach } from '../hooks/useAICoach';
import './EligibilityDashboard.css';

const EligibilityDashboard = ({ athleteId }) => {
  const { eligibility, loading, error, updateAcademic, recordCompetition } = useEligibility(athleteId);
  const { generateVoice, voiceLoading, playVoice } = useAICoach();
  const [voiceResponse, setVoiceResponse] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (eligibility?.alerts?.length > 0) {
      // Show critical alerts
      const criticalAlerts = eligibility.alerts.filter(alert => alert.priority === 'critical');
      if (criticalAlerts.length > 0) {
        // Could integrate with notification system
        console.log('Critical eligibility alerts:', criticalAlerts);
      }
    }
  }, [eligibility]);

  const handleVoiceCoaching = async (coachingType, context = {}) => {
    try {
      const response = await generateVoice(
        `Provide ${coachingType} coaching for my current situation.`,
        'coach_motivational',
        { context: { ...context, athleteId } }
      );
      setVoiceResponse(response);
    } catch (error) {
      console.error('Failed to generate voice coaching:', error);
    }
  };

  const handlePlayVoice = async () => {
    if (voiceResponse) {
      await playVoice(voiceResponse.audio);
    }
  };

  if (loading) {
    return (
      <div className="eligibility-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading eligibility data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eligibility-dashboard error">
        <Alert type="error">
          <h3>Error Loading Eligibility Data</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Alert>
      </div>
    );
  }

  if (!eligibility) {
    return (
      <div className="eligibility-dashboard empty">
        <h2>Eligibility Not Initialized</h2>
        <p>Your eligibility tracking hasn't been set up yet.</p>
        <Button onClick={() => {/* Initialize eligibility */}}>
          Initialize Eligibility Tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="eligibility-dashboard">
      <div className="dashboard-header">
        <h1>NCAA Eligibility Center</h1>
        <div className="header-actions">
          <Button
            onClick={() => handleVoiceCoaching('eligibility')}
            disabled={voiceLoading}
            variant="secondary"
          >
            {voiceLoading ? 'Generating...' : '🎧 Get Voice Coaching'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'academic' ? 'active' : ''}
          onClick={() => setActiveTab('academic')}
        >
          Academic
        </button>
        <button
          className={activeTab === 'amateurism' ? 'active' : ''}
          onClick={() => setActiveTab('amateurism')}
        >
          Amateur Status
        </button>
        <button
          className={activeTab === 'recruiting' ? 'active' : ''}
          onClick={() => setActiveTab('recruiting')}
        >
          Recruiting
        </button>
      </div>

      {/* Alerts Section */}
      {eligibility.alerts && eligibility.alerts.length > 0 && (
        <div className="alerts-section">
          {eligibility.alerts.map((alert, index) => (
            <Alert key={index} type={alert.type}>
              <strong>{alert.title}</strong>: {alert.message}
            </Alert>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <EligibilityOverview eligibility={eligibility} />
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="tab-content">
          <AcademicEligibility
            academic={eligibility.academicStanding}
            onUpdate={updateAcademic}
            athleteId={athleteId}
          />
        </div>
      )}

      {activeTab === 'amateurism' && (
        <div className="tab-content">
          <AmateurStatus status={eligibility.amateurStatus} />
        </div>
      )}

      {activeTab === 'recruiting' && (
        <div className="tab-content">
          <RecruitingStatus status={eligibility.recruitingStatus} />
        </div>
      )}

      {/* Voice Response Modal/Player */}
      {voiceResponse && (
        <div className="voice-response-modal">
          <Card className="voice-card">
            <h3>AI Coach Response</h3>
            <div className="voice-controls">
              <Button onClick={handlePlayVoice}>🔊 Play Voice</Button>
              <Button
                onClick={() => setVoiceResponse(null)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
            <p className="voice-text">{voiceResponse.text}</p>
          </Card>
        </div>
      )}
    </div>
  );
};

// Overview Component
const EligibilityOverview = ({ eligibility }) => (
  <div className="eligibility-overview">
    {/* Five-Year Clock */}
    <Card className="clock-card">
      <h2>Five-Year Eligibility Clock</h2>
      <div className="clock-visual">
        <Progress
          value={eligibility.eligibilityUsedPercentage}
          className="clock-progress"
          color={eligibility.seasonsRemaining <= 1 ? 'warning' : 'success'}
        />
        <div className="clock-details">
          <div className="detail">
            <span className="label">Seasons Used</span>
            <span className="value">{eligibility.seasonsUsed}</span>
          </div>
          <div className="detail">
            <span className="label">Seasons Remaining</span>
            <span className="value">{eligibility.seasonsRemaining}</span>
          </div>
          <div className="detail">
            <span className="label">Clock Expires</span>
            <span className="value">
              {eligibility.clockExpiry
                ? new Date(eligibility.clockExpiry).toLocaleDateString()
                : 'Not started'
              }
            </span>
          </div>
        </div>
      </div>
    </Card>

    {/* Quick Stats */}
    <div className="stats-grid">
      <Card className="stat-card">
        <h3>Amateur Status</h3>
        <Badge variant={eligibility.amateurStatus?.isAmateur ? 'success' : 'danger'}>
          {eligibility.amateurStatus?.isAmateur ? 'Amateur' : 'Professional'}
        </Badge>
      </Card>

      <Card className="stat-card">
        <h3>Academic Eligibility</h3>
        <Badge variant={eligibility.academicStanding?.gpa >= 2.0 ? 'success' : 'warning'}>
          {eligibility.academicStanding?.gpa >= 2.0 ? 'Eligible' : 'At Risk'}
        </Badge>
      </Card>

      <Card className="stat-card">
        <h3>Compliance Score</h3>
        <div className="score-display">
          <span className="score">{eligibility.complianceScore || 100}</span>
          <span className="max">/100</span>
        </div>
      </Card>
    </div>
  </div>
);

// Academic Eligibility Component
const AcademicEligibility = ({ academic, onUpdate, athleteId }) => {
  const [formData, setFormData] = useState({
    gpa: academic?.gpa || 0,
    progressToDegree: academic?.progressToDegree || 0,
    eligibilityYear: academic?.eligibilityYear || 'FR'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onUpdate(athleteId, formData);
  };

  return (
    <Card className="academic-card">
      <h2>Academic Eligibility</h2>

      <div className="academic-metrics">
        <div className="metric">
          <label>GPA</label>
          <div className="metric-value">{academic?.gpa || 'Not set'}</div>
        </div>
        <div className="metric">
          <label>Progress to Degree</label>
          <div className="metric-value">{academic?.progressToDegree || 0}%</div>
        </div>
        <div className="metric">
          <label>Eligibility Year</label>
          <div className="metric-value">{academic?.eligibilityYear || 'FR'}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="academic-form">
        <h3>Update Academic Information</h3>
        <div className="form-group">
          <label htmlFor="gpa">Current GPA</label>
          <input
            type="number"
            id="gpa"
            min="0"
            max="4.0"
            step="0.01"
            value={formData.gpa}
            onChange={(e) => setFormData({...formData, gpa: parseFloat(e.target.value)})}
          />
        </div>

        <div className="form-group">
          <label htmlFor="progress">Progress to Degree (%)</label>
          <input
            type="number"
            id="progress"
            min="0"
            max="100"
            value={formData.progressToDegree}
            onChange={(e) => setFormData({...formData, progressToDegree: parseInt(e.target.value)})}
          />
        </div>

        <div className="form-group">
          <label htmlFor="year">Eligibility Year</label>
          <select
            id="year"
            value={formData.eligibilityYear}
            onChange={(e) => setFormData({...formData, eligibilityYear: e.target.value})}
          >
            <option value="FR">Freshman</option>
            <option value="SO">Sophomore</option>
            <option value="JR">Junior</option>
            <option value="SR">Senior</option>
            <option value="5TH">5th Year</option>
          </select>
        </div>

        <Button type="submit">Update Academic Info</Button>
      </form>
    </Card>
  );
};

// Amateur Status Component
const AmateurStatus = ({ status }) => (
  <Card className="amateur-card">
    <h2>Amateur Status</h2>

    <div className="status-header">
      <Badge variant={status?.isAmateur ? 'success' : 'danger'} className="status-badge">
        {status?.isAmateur ? '✅ Amateur' : '⚠️ Professional'}
      </Badge>
      <div className="earnings-info">
        <p>Total Earnings: ${status?.totalEarnings || 0}</p>
        <p>Last Updated: {status?.lastUpdated ? new Date(status.lastUpdated).toLocaleDateString() : 'Never'}</p>
      </div>
    </div>

    {status?.recentEarnings > 0 && (
      <Alert type="info">
        You have {status.recentEarnings} earnings activities in the last year that may affect your amateur status.
      </Alert>
    )}

    <div className="amateur-actions">
      <Button variant="secondary">Report New Earnings</Button>
      <Button variant="outline">View Earnings History</Button>
    </div>
  </Card>
);

// Recruiting Status Component
const RecruitingStatus = ({ status }) => (
  <Card className="recruiting-card">
    <h2>Recruiting Status</h2>

    <div className="recruiting-status">
      <div className="status-item">
        <span className="label">Current Period:</span>
        <Badge variant={status?.isDeadPeriod ? 'warning' : 'success'}>
          {status?.isDeadPeriod ? 'Dead Period' : 'Live Period'}
        </Badge>
      </div>

      <div className="status-item">
        <span className="label">Contacts This Week:</span>
        <span className="value">{status?.contactsThisWeek || 0} / {status?.weeklyLimit || 7}</span>
      </div>

      <div className="status-item">
        <span className="label">Contacts This Month:</span>
        <span className="value">{status?.contactsThisMonth || 0} / {status?.monthlyLimit || 30}</span>
      </div>

      {status?.nextLivePeriod && (
        <div className="status-item">
          <span className="label">Next Live Period:</span>
          <span className="value">{new Date(status.nextLivePeriod).toLocaleDateString()}</span>
        </div>
      )}
    </div>

    {status?.isDeadPeriod && (
      <Alert type="warning">
        <strong>Dead Period Active:</strong> Recruiting communication is restricted.
        Focus on your development and academics during this time.
      </Alert>
    )}
  </Card>
);

export default EligibilityDashboard;
