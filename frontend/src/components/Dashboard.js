import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserPerformance } from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p className="text-text-secondary font-rajdhani">Loading your performance data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
                <div className="athlete-card max-w-md w-full text-center">
                    <div className="p-6">
                        <h2 className="text-xl font-orbitron text-red-400 mb-4">Error Loading Data</h2>
                        <p className="text-text-secondary mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-electric"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-orbitron text-electric-blue mb-2 glow-text-electric">
                        GO4IT SPORTS PLATFORM
                    </h1>
                    <p className="text-text-secondary font-rajdhani text-lg">
                        Your AI-Powered Athletic Performance Hub
                    </p>
                </div>

                {/* Hero Stats Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Platform Stats */}
                    <div className="athlete-card">
                        <div className="athlete-card-header">
                            <h2 className="text-2xl font-orbitron text-electric-blue mb-4 glow-text-electric">
                                Platform Statistics
                            </h2>
                        </div>
                        <div className="px-6 pb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="stat-card">
                                    <div className="metric-value text-3xl">5,000+</div>
                                    <div className="metric-label">Athletes</div>
                                </div>
                                <div className="stat-card">
                                    <div className="metric-value text-3xl">22</div>
                                    <div className="metric-label">Sports</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Profile Card */}
                    <div className="athlete-card">
                        <div className="athlete-card-header">
                            <div className="absolute top-4 right-4 w-8 h-8 bg-electric-blue rounded-full flex items-center justify-center shadow-electric">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                        <div className="athlete-card-body">
                            <div className="athlete-avatar">
                                <div className="avatar-container">
                                    <div className="avatar-inner">
                                        <span className="text-2xl font-orbitron text-electric-blue">JD</span>
                                    </div>
                                </div>
                            </div>
                            <h3 className="athlete-name text-xl">John Doe</h3>
                            <p className="text-text-secondary font-rajdhani mb-2">Basketball • Point Guard</p>
                            <div className="badge-electric">Elite Score: 87</div>
                        </div>
                    </div>
                </div>

                {/* AI Coach Section */}
                <div className="athlete-card mb-8">
                    <div className="athlete-card-header">
                        <h3 className="text-2xl font-orbitron text-neon-aqua mb-2 glow-text-aqua">
                            AI Football Coach
                        </h3>
                        <p className="text-text-secondary font-rajdhani">
                            Get personalized football training and strategy insights with our advanced AI coach.
                        </p>
                    </div>
                    <div className="px-6 pb-6">
                        <Link to="/ai-football-coach" className="btn-aqua inline-flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                            </svg>
                            <span>Start AI Coaching Session</span>
                        </Link>
                    </div>
                </div>

                {/* Performance Dashboard */}
                <div className="athlete-card">
                    <div className="athlete-card-header">
                        <h2 className="text-2xl font-orbitron text-electric-blue mb-4 glow-text-electric">
                            Performance Dashboard
                        </h2>
                    </div>
                    <div className="px-6 pb-6">
                        {performanceData.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {performanceData.map((metric, index) => (
                                    <div key={metric.id || index} className="glass-panel">
                                        <h3 className="text-lg font-orbitron text-electric-blue mb-2">
                                            {metric.title}
                                        </h3>
                                        <div className="metric-value text-2xl mb-2">
                                            {metric.value}
                                        </div>
                                        {metric.change && (
                                            <div className={`text-sm font-rajdhani px-2 py-1 rounded-full inline-block ${
                                                metric.trend === 'positive'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : metric.trend === 'negative'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                                {metric.change}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-text-secondary font-rajdhani mb-4">
                                    No performance data available yet.
                                </p>
                                <p className="text-text-muted font-rajdhani text-sm">
                                    Start training to see your metrics here!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;