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
    <div className="player-card">
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
          <div
            className="position-badge"
            style={{ backgroundColor: getPositionColor(player.position) }}
          >
            {player.position}
          </div>
        </div>
      </div>

      <div className="player-card-body">
        <h3 className="player-name">{player.name}</h3>

        <div className="player-info">
          {player.team && <p className="player-team">{player.team}</p>}
          {player.school && <p className="player-school">{player.school}</p>}
          {player.year && <p className="player-year">{player.year}</p>}
          {player.height && player.weight && (
            <p className="player-physical">
              {player.height} • {player.weight} lbs
            </p>
          )}
        </div>

        <div className="player-stats">
          <div className="gar-score">
            <div className="gar-label">GAR Score</div>
            <div
              className="gar-value"
              style={{ color: getGARColor(player.garScore) }}
            >
              {player.garScore}
            </div>
          </div>

          <div className="star-rating">
            <div className="star-label">Rating</div>
            <div className="stars">
              {renderStars(player.stars)}
            </div>
            <div className="star-count">({player.stars}/5)</div>
          </div>
        </div>

        {player.achievements && player.achievements.length > 0 && (
          <div className="player-achievements">
            <h4>Achievements</h4>
            <ul>
              {player.achievements.slice(0, 3).map((achievement, index) => (
                <li key={index}>{achievement}</li>
              ))}
            </ul>
            {player.achievements.length > 3 && (
              <p className="more-achievements">
                +{player.achievements.length - 3} more
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
