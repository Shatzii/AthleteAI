import React, { useState, useEffect } from 'react';
import './AthleteDiscovery.css';

const AthleteDiscovery = () => {
  const [athletes, setAthletes] = useState([]);
  const [highlightedAthletes, setHighlightedAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    sport: 'football',
    year: new Date().getFullYear(),
    location: '',
    limit: 50,
    minScore: 0
  });
  const [activeTab, setActiveTab] = useState('discover');

  // Fetch highlighted athletes on component mount
  useEffect(() => {
    fetchHighlightedAthletes();
    fetchStats();
  }, []);

  const fetchHighlightedAthletes = async () => {
    try {
      const response = await fetch('/api/v1/discovery/highlighted', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHighlightedAthletes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch highlighted athletes:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/discovery/stats/scraping', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const queryParams = new URLSearchParams({
        sport: filters.sport,
        year: filters.year,
        location: filters.location,
        limit: filters.limit,
        includeHighlights: 'true'
      });

      const response = await fetch(`/api/v1/discovery/scrape?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAthletes(data.data.athletes);
        alert(`Successfully scraped ${data.data.metadata.saved} athletes!`);
        fetchStats(); // Refresh stats
      } else {
        alert(`Scraping failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Scraping failed:', error);
      alert('Scraping failed. Please try again.');
    } finally {
      setScraping(false);
    }
  };

  const handleHighlight = async (athleteId, shouldHighlight = true) => {
    try {
      const url = `/api/v1/discovery/${athleteId}/highlight`;
      const method = shouldHighlight ? 'POST' : 'DELETE';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: 'manual' })
      });

      const data = await response.json();
      if (data.success) {
        fetchHighlightedAthletes();
        alert(`Athlete ${shouldHighlight ? 'highlighted' : 'unhighlighted'} successfully!`);
      }
    } catch (error) {
      console.error('Highlight action failed:', error);
      alert('Action failed. Please try again.');
    }
  };

  const handleAutoHighlight = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/discovery/auto-highlight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          criteria: {
            minRating: 80,
            minStars: 3,
            hasHighlights: true
          },
          limit: 25
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Auto-highlighted ${data.data.stats.highlighted} athletes!`);
        fetchHighlightedAthletes();
      }
    } catch (error) {
      console.error('Auto-highlight failed:', error);
      alert('Auto-highlight failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const AthleteCard = ({ athlete, showActions = true }) => (
    <div className="athlete-card">
      <div className="athlete-header">
        <img
          src={athlete.profileImage || '/default-player.png'}
          alt={athlete.name}
          className="athlete-image"
        />
        <div className="athlete-info">
          <h3 className="athlete-name">{athlete.name}</h3>
          <p className="athlete-position">{athlete.position}</p>
          <p className="athlete-school">{athlete.school}</p>
        </div>
        <div className="athlete-scores">
          <div className="score-item">
            <span className="score-label">GAR</span>
            <span className="score-value">{athlete.garScore}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Stars</span>
            <span className="score-stars">
              {'★'.repeat(athlete.stars)}{'☆'.repeat(5 - athlete.stars)}
            </span>
          </div>
          {athlete.recruitingData?.rating && (
            <div className="score-item">
              <span className="score-label">Rating</span>
              <span className="score-value">{athlete.recruitingData.rating}</span>
            </div>
          )}
        </div>
      </div>

      <div className="athlete-details">
        {athlete.height && <span className="detail-item">Height: {athlete.height}</span>}
        {athlete.weight && <span className="detail-item">Weight: {athlete.weight}lbs</span>}
        {athlete.year && <span className="detail-item">Year: {athlete.year}</span>}
        {athlete.recruitingData?.location && (
          <span className="detail-item">Location: {athlete.recruitingData.location}</span>
        )}
      </div>

      {athlete.highlights && athlete.highlights.length > 0 && (
        <div className="athlete-highlights">
          <h4>Highlights ({athlete.highlights.length})</h4>
          <div className="highlights-list">
            {athlete.highlights.slice(0, 3).map((highlight, index) => (
              <a
                key={index}
                href={highlight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="highlight-link"
              >
                {highlight.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {athlete.socialMedia && Object.keys(athlete.socialMedia).length > 0 && (
        <div className="athlete-social">
          <h4>Social Media</h4>
          <div className="social-links">
            {Object.entries(athlete.socialMedia).map(([platform, url]) => (
              url && (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  {platform}
                </a>
              )
            ))}
          </div>
        </div>
      )}

      {showActions && (
        <div className="athlete-actions">
          <button
            onClick={() => handleHighlight(athlete._id, !athlete.isHighlighted)}
            className={`btn ${athlete.isHighlighted ? 'btn-secondary' : 'btn-primary'}`}
          >
            {athlete.isHighlighted ? 'Unhighlight' : 'Highlight'}
          </button>
          <button
            onClick={() => window.open(`/api/v1/discovery/${athlete._id}/highlights`, '_blank')}
            className="btn btn-outline"
          >
            View Highlights
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="athlete-discovery">
      <div className="discovery-header">
        <h1>Athlete Discovery</h1>
        <p>Find and highlight top athletes from recruiting sites</p>
      </div>

      <div className="discovery-tabs">
        <button
          className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover Athletes
        </button>
        <button
          className={`tab ${activeTab === 'highlighted' ? 'active' : ''}`}
          onClick={() => setActiveTab('highlighted')}
        >
          Highlighted Athletes ({highlightedAthletes.length})
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'discover' && (
          <div className="discover-section">
            <div className="scrape-controls">
              <h2>Scrape Recruiting Sites</h2>
              <div className="filter-grid">
                <div className="filter-group">
                  <label>Sport:</label>
                  <select
                    value={filters.sport}
                    onChange={(e) => setFilters({...filters, sport: e.target.value})}
                  >
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="baseball">Baseball</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Year:</label>
                  <input
                    type="number"
                    value={filters.year}
                    onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                    min="2020"
                    max="2030"
                  />
                </div>

                <div className="filter-group">
                  <label>Location:</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    placeholder="City, State"
                  />
                </div>

                <div className="filter-group">
                  <label>Limit:</label>
                  <input
                    type="number"
                    value={filters.limit}
                    onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
                    min="10"
                    max="500"
                  />
                </div>
              </div>

              <div className="action-buttons">
                <button
                  onClick={handleScrape}
                  disabled={scraping}
                  className="btn btn-primary"
                >
                  {scraping ? 'Scraping...' : 'Scrape Athletes'}
                </button>
                <button
                  onClick={handleAutoHighlight}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Processing...' : 'Auto Highlight Top Athletes'}
                </button>
              </div>
            </div>

            {athletes.length > 0 && (
              <div className="scraped-athletes">
                <h3>Recently Scraped Athletes ({athletes.length})</h3>
                <div className="athletes-grid">
                  {athletes.map((athlete) => (
                    <AthleteCard key={athlete._id} athlete={athlete} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'highlighted' && (
          <div className="highlighted-section">
            <div className="section-header">
              <h2>Highlighted Athletes</h2>
              <p>Top prospects and rising stars</p>
            </div>

            {highlightedAthletes.length > 0 ? (
              <div className="athletes-grid">
                {highlightedAthletes.map((athlete) => (
                  <AthleteCard key={athlete._id} athlete={athlete} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No highlighted athletes yet. Start by scraping recruiting sites or manually highlighting athletes.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-section">
            <h2>Discovery Statistics</h2>

            {stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Database</h3>
                  <div className="stat-item">
                    <span>Total Athletes:</span>
                    <span>{stats.database.totalAthletes}</span>
                  </div>
                  <div className="stat-item">
                    <span>Highlighted:</span>
                    <span>{stats.database.highlightedAthletes}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Rate Limiting</h3>
                  {Object.entries(stats.scraping).map(([site, data]) => (
                    <div key={site} className="stat-item">
                      <span>{site}:</span>
                      <span>{data.requestsInWindow}/{data.limit}</span>
                    </div>
                  ))}
                </div>

                <div className="stat-card">
                  <h3>Source Breakdown</h3>
                  {stats.database.sourceBreakdown.map((source) => (
                    <div key={source._id} className="stat-item">
                      <span>{source._id}:</span>
                      <span>{source.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="loading">Loading statistics...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteDiscovery;
