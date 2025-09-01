import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import { getPlayers } from '../utils/api';
import './Players.css';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('gar');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await getPlayers();
      setPlayers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    if (filter === 'all') return true;
    return player.position === filter;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'gar') {
      return b.garScore - a.garScore;
    } else if (sortBy === 'stars') {
      return b.stars - a.stars;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const positions = ['all', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'];

  if (loading) {
    return (
      <div className="players-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading player profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="players-container">
        <div className="error">
          <h2>Error Loading Players</h2>
          <p>{error}</p>
          <button onClick={fetchPlayers} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="players-container">
      <div className="players-header">
        <h1 className="players-title">Player Profiles</h1>
        <p className="players-subtitle">
          Official athlete profiles with GAR scores and star ratings
        </p>
      </div>

      <div className="players-controls">
        <div className="filter-section">
          <label htmlFor="position-filter">Position:</label>
          <select
            id="position-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            {positions.map(position => (
              <option key={position} value={position}>
                {position === 'all' ? 'All Positions' : position}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-section">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="gar">GAR Score</option>
            <option value="stars">Star Rating</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="players-stats">
        <div className="stat-item">
          <span className="stat-number">{sortedPlayers.length}</span>
          <span className="stat-label">Total Players</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {sortedPlayers.length > 0 ? Math.round(sortedPlayers.reduce((sum, p) => sum + p.garScore, 0) / sortedPlayers.length) : 0}
          </span>
          <span className="stat-label">Avg GAR</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {sortedPlayers.filter(p => p.stars >= 4).length}
          </span>
          <span className="stat-label">4+ Stars</span>
        </div>
      </div>

      {sortedPlayers.length === 0 ? (
        <div className="no-players">
          <h3>No players found</h3>
          <p>Try adjusting your filters or check back later for new player profiles.</p>
        </div>
      ) : (
        <div className="players-grid">
          {sortedPlayers.map(player => (
            <PlayerCard key={player._id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Players;
