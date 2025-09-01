import React from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player }) => {
  const renderStars = (stars) => {
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const getGARColor = (gar) => {
    if (gar >= 90) return '#00BFFF'; // Electric blue for elite
    if (gar >= 80) return '#0DFEFF'; // Cyber aqua for excellent
    if (gar >= 70) return '#FFD700'; // Gold for good
    if (gar >= 60) return '#FFA500'; // Orange for average
    return '#FF6B6B'; // Red for below average
  };

  const getPositionColor = (position) => {
    const colors = {
      QB: '#FF6B6B', // Red
      RB: '#4ECDC4', // Teal
      WR: '#45B7D1', // Blue
      TE: '#96CEB4', // Green
      OL: '#FFEAA7', // Yellow
      DL: '#DDA0DD', // Plum
      LB: '#98D8C8', // Mint
      CB: '#F7DC6F', // Light yellow
      S: '#BB8FCE', // Light purple
      K: '#85C1E9', // Light blue
      P: '#F8C471' // Light orange
    };
    return colors[position] || '#00BFFF';
  };

  return (
    <div className="player-card glassmorphic-card glow-electric-hover">
      <div className="player-card-header">
        <div className="player-image-container">
          <img
            src={player.profileImage || '/default-player.png'}
            alt={player.name}
            className="player-image"
            onError={(e) => {
              e.target.src = '/default-player.png';
            }}
          />
          <div className="image-glow"></div>
          <div
            className="position-badge glow-aqua"
            style={{ backgroundColor: getPositionColor(player.position) }}
          >
            {player.position}
          </div>
        </div>
        <div className="player-info">
          <h3 className="player-name font-orbitron">{player.name}</h3>
          <div className="player-school font-rajdhani">{player.school || 'High School'}</div>
          <div className="star-rating">
            {renderStars(player.stars || 3)}
          </div>
        </div>
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <div className="stat-label">GAR Score</div>
          <div className="stat-value" style={{ color: getGARColor(player.garScore || 85) }}>
            {player.garScore || 85}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min((player.garScore || 85), 100)}%`,
                backgroundColor: getGARColor(player.garScore || 85)
              }}
            ></div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Height</div>
          <div className="stat-value">{player.height || "6'2\""}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Weight</div>
          <div className="stat-value">{player.weight || '210 lbs'}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Class</div>
          <div className="stat-value">{player.class || '2025'}</div>
        </div>
      </div>

      <div className="player-badges">
        {player.badges && player.badges.map((badge, index) => (
          <span key={index} className="badge badge-glow">
            {badge}
          </span>
        ))}
      </div>

      <div className="player-actions">
        <button className="btn-primary glow-electric-hover">
          View Profile
        </button>
        <button className="btn-secondary">
          Compare
        </button>
      </div>
    </div>
  );
};

export default PlayerCard;
