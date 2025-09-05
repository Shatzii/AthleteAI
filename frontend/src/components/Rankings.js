import React, { useState, useEffect } from 'react';
import { getGARRanks } from '../utils/api';
import './Rankings.css';

const Rankings = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('football-usa-men');
  const [selectedSport, setSelectedSport] = useState('football');
  const [selectedRegion, setSelectedRegion] = useState('USA');
  const [selectedGender, setSelectedGender] = useState('men');

  const rankingCategories = [
    // American Football
    { id: 'football-usa-men', name: 'USA Top 100', sport: 'football', region: 'USA', gender: 'men' },
    { id: 'football-europe-men', name: 'Europe Top 30', sport: 'football', region: 'Europe', gender: 'men' },
    { id: 'football-global-men', name: 'Global Top 100', sport: 'football', region: 'Global', gender: 'men' },

    // Basketball
    { id: 'basketball-usa-men', name: 'Men\'s USA Top 100', sport: 'basketball', region: 'USA', gender: 'men' },
    { id: 'basketball-europe-men', name: 'Men\'s Europe Top 100', sport: 'basketball', region: 'Europe', gender: 'men' },
    { id: 'basketball-global-men', name: 'Men\'s Global Top 100', sport: 'basketball', region: 'Global', gender: 'men' },
    { id: 'basketball-usa-women', name: 'Women\'s USA Top 100', sport: 'basketball', region: 'USA', gender: 'women' },
    { id: 'basketball-europe-women', name: 'Women\'s Europe Top 100', sport: 'basketball', region: 'Europe', gender: 'women' },
    { id: 'basketball-global-women', name: 'Women\'s Global Top 100', sport: 'basketball', region: 'Global', gender: 'women' },

    // Soccer
    { id: 'soccer-usa-men', name: 'Men\'s USA Top 100', sport: 'soccer', region: 'USA', gender: 'men' },
    { id: 'soccer-europe-men', name: 'Men\'s Europe Top 100', sport: 'soccer', region: 'Europe', gender: 'men' },
    { id: 'soccer-global-men', name: 'Men\'s Global Top 100', sport: 'soccer', region: 'Global', gender: 'men' },
    { id: 'soccer-usa-women', name: 'Women\'s USA Top 100', sport: 'soccer', region: 'USA', gender: 'women' },
    { id: 'soccer-europe-women', name: 'Women\'s Europe Top 100', sport: 'soccer', region: 'Europe', gender: 'women' },
    { id: 'soccer-global-women', name: 'Women\'s Global Top 100', sport: 'soccer', region: 'Global', gender: 'women' }
  ];

  useEffect(() => {
    fetchRankings();
  }, [selectedSport, selectedRegion, selectedGender]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const data = await getGARRanks({
        sport: selectedSport,
        region: selectedRegion,
        gender: selectedGender,
        maxResults: 100
      });
      setRankings(data.athletes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = rankingCategories.find(cat => cat.id === categoryId);
    if (category) {
      setSelectedCategory(categoryId);
      setSelectedSport(category.sport);
      setSelectedRegion(category.region);
      setSelectedGender(category.gender);
    }
  };

  const getGARColor = (gar) => {
    if (gar >= 90) return '#00BFFF'; // Electric blue for elite
    if (gar >= 80) return '#0DFEFF'; // Cyber aqua for excellent
    if (gar >= 70) return '#FFD700'; // Gold for good
    if (gar >= 60) return '#FFA500'; // Orange for average
    return '#FF6B6B'; // Red for below average
  };

  const renderStars = (stars) => {
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  if (loading) {
    return (
      <div className="rankings-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading athlete rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rankings-container">
        <div className="error">
          <h2>Error Loading Rankings</h2>
          <p>{error}</p>
          <button onClick={fetchRankings} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rankings-container">
      <div className="rankings-header">
        <h1 className="rankings-title">Athlete Rankings</h1>
        <p className="rankings-subtitle">
          Global Athlete Rating (GAR) Rankings - Real-time athlete evaluation
        </p>
      </div>

      <div className="rankings-controls">
        <div className="category-selector">
          <label htmlFor="category-select">Ranking Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="category-select"
          >
            {rankingCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rankings-stats">
          <div className="stat-item">
            <span className="stat-number">{rankings.length}</span>
            <span className="stat-label">Ranked Athletes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {rankings.length > 0 ? Math.round(rankings.reduce((sum, r) => sum + r.garScore, 0) / rankings.length) : 0}
            </span>
            <span className="stat-label">Avg GAR</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {rankings.filter(r => r.garScore >= 90).length}
            </span>
            <span className="stat-label">Elite (90+)</span>
          </div>
        </div>
      </div>

      <div className="rankings-table-container">
        <table className="rankings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Athlete</th>
              <th>Position</th>
              <th>School</th>
              <th>GAR Score</th>
              <th>Breakdown</th>
              <th>Stars</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((athlete, index) => (
              <tr key={athlete.id} className="ranking-row">
                <td className="rank-cell">
                  <span className="rank-number">#{athlete.ranking?.overall || index + 1}</span>
                </td>
                <td className="athlete-cell">
                  <div className="athlete-info">
                    <div className="athlete-name">{athlete.name}</div>
                    <div className="athlete-country">{athlete.country}</div>
                  </div>
                </td>
                <td className="position-cell">
                  <span className="position-badge">{athlete.position}</span>
                </td>
                <td className="school-cell">{athlete.school || 'High School'}</td>
                <td className="gar-cell">
                  <div className="gar-score" style={{ color: getGARColor(athlete.garScore) }}>
                    {athlete.garScore}
                  </div>
                  <div className="gar-bar">
                    <div
                      className="gar-fill"
                      style={{
                        width: `${Math.min(athlete.garScore, 100)}%`,
                        backgroundColor: getGARColor(athlete.garScore)
                      }}
                    ></div>
                  </div>
                </td>
                <td className="breakdown-cell">
                  <div className="gar-breakdown">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Tech:</span>
                      <span className="breakdown-value">{athlete.garBreakdown?.technical || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Phys:</span>
                      <span className="breakdown-value">{athlete.garBreakdown?.physical || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Tact:</span>
                      <span className="breakdown-value">{athlete.garBreakdown?.tactical || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Ment:</span>
                      <span className="breakdown-value">{athlete.garBreakdown?.mental || 0}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Cons:</span>
                      <span className="breakdown-value">{athlete.garBreakdown?.consistency || 0}</span>
                    </div>
                  </div>
                </td>
                <td className="stars-cell">
                  <div className="star-rating">
                    {renderStars(athlete.stars || 3)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rankings.length === 0 && (
        <div className="no-rankings">
          <h3>No rankings available</h3>
          <p>Rankings for this category will be available soon.</p>
        </div>
      )}
    </div>
  );
};

export default Rankings;
