import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, Trophy, Target, Zap, TrendingUp, Award, Play } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span className="highlight">Go4It Sports</span>
            </h1>
            <p className="hero-subtitle">
              Your AI-powered athletic performance platform. Train smarter, perform better, achieve greatness.
            </p>
            <div className="hero-buttons">
              <Link to="/starpath" className="btn-primary">
                <Star className="btn-icon" />
                Start Your Journey
              </Link>
              <Link to="/players" className="btn-secondary">
                <Users className="btn-icon" />
                Explore Players
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Athletes</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Sports</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">AI</div>
                <div className="stat-label">Powered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Unlock Your Potential</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Target />
              </div>
              <h3>StarPath Training</h3>
              <p>Personalized skill development paths with gamification and progress tracking.</p>
              <Link to="/starpath" className="feature-link">
                Start Training <Play className="link-icon" />
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap />
              </div>
              <h3>AI Football Coach</h3>
              <p>Get instant feedback and personalized coaching from our advanced AI system.</p>
              <Link to="/ai-football-coach" className="feature-link">
                Try AI Coach <Play className="link-icon" />
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users />
              </div>
              <h3>Player Database</h3>
              <p>Discover and analyze top athletes across all major sports and competitions.</p>
              <Link to="/players" className="feature-link">
                Browse Players <Play className="link-icon" />
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Trophy />
              </div>
              <h3>NCAA Tracker</h3>
              <p>Track eligibility, requirements, and opportunities for collegiate athletics.</p>
              <Link to="/ncaa-tracker" className="feature-link">
                Check Eligibility <Play className="link-icon" />
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp />
              </div>
              <h3>Recruiting Hub</h3>
              <p>Connect with coaches, scouts, and discover recruitment opportunities.</p>
              <Link to="/recruiting-hub" className="feature-link">
                Start Recruiting <Play className="link-icon" />
              </Link>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Award />
              </div>
              <h3>International Sports</h3>
              <p>Access global competitions, international opportunities, and worldwide sports news.</p>
              <Link to="/international-sports" className="feature-link">
                Go Global <Play className="link-icon" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Elevate Your Game?</h2>
            <p>Join thousands of athletes who are already using Go4It Sports to achieve their goals.</p>
            <Link to="/starpath" className="btn-primary-large">
              Begin Your StarPath Journey
              <Star className="btn-icon" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
