import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" className="logo-link">
            <img src="/Go4it Logo.jpeg" alt="Go4It Sports Logo" className="logo-image" />
            <span>Go4It Sports</span>
          </Link>
        </div>

        <nav className="nav">
          <Link to="/" className="nav-link starpath-link primary-link">
            <i className="fas fa-home"></i>
            Home
          </Link>
          <Link to="/starpath" className="nav-link">
            <i className="fas fa-star"></i>
            StarPath
          </Link>
          <Link to="/players" className="nav-link">Players</Link>
          <Link to="/rankings" className="nav-link rankings-link">
            <i className="fas fa-trophy"></i>
            Rankings
          </Link>
          <Link to="/ai-football-coach" className="nav-link">AI Coach</Link>
          <Link to="/ncaa-tracker" className="nav-link">NCAA Tracker</Link>
          <Link to="/international-sports" className="nav-link">International</Link>
          <Link to="/recruiting-hub" className="nav-link recruiting-link">Recruiting Hub</Link>
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin" className="nav-link admin-link">Admin</Link>
          )}
        </nav>

        <div className="auth-section">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">
                Welcome, {user?.username || user?.email || 'User'}
              </span>
              <button onClick={logout} className="logout-btn">
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button className="login-btn" onClick={handleLoginClick}>
                <i className="fas fa-sign-in-alt"></i>
                Login
              </button>
              <button className="register-btn" onClick={handleLoginClick}>
                <i className="fas fa-user-plus"></i>
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseModal}
      />
    </header>
  );
};

export default Header;
