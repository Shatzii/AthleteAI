import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserPerformance } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css'; // Assuming you have a CSS file for styling

const Dashboard = () => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const getPerformanceData = async () => {
            try {
                const response = await fetchUserPerformance(token);
                // Handle both old array format and new response format
                const data = response.data || response;
                setPerformanceData(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            getPerformanceData();
        } else {
            setLoading(false);
        }
    }, [token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Go4It Sports Platform Dashboard</h1>
                <p className="dashboard-subtitle">Welcome to your athletic performance hub</p>
            </div>

            {/* Hero Stats Section */}
            <div className="hero-stats">
                <div className="stats-container">
                    <div className="stat-item">
                        <div className="stat-value">5,000+</div>
                        <div className="stat-label">Athletes</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-value">22</div>
                        <div className="stat-label">Sports</div>
                    </div>
                </div>
                <div className="user-profile-card">
                    <div className="avatar">JD</div>
                    <h3 className="user-name">John Doe</h3>
                    <p className="user-title">Basketball • Point Guard</p>
                    <span className="user-score">Elite Score: 87</span>
                </div>
            </div>

            <div className="ai-coach-section">
                <h3>Try Our AI Football Coach</h3>
                <p>Get personalized football training and strategy insights with our advanced AI coach.</p>
                <Link to="/ai-football-coach" className="ai-coach-btn">
                    <i className="fas fa-football-ball"></i>
                    Start AI Coaching Session
                </Link>
            </div>

            <h2>Performance Dashboard</h2>
            <div className="performance-metrics">
                {performanceData.map((metric, index) => (
                    <div key={metric.id || index} className="metric-card">
                        <h3>{metric.title}</h3>
                        <p className="metric-value">{metric.value}</p>
                        {metric.change && (
                            <span className={`metric-change ${metric.trend}`}>
                                {metric.change}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;