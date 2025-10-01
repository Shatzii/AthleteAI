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
            <div className="min-h-screen flex items-center justify-center particle-container">
                <div className="glass card max-w-md w-full text-center animate-fade-in">
                    <div className="p-8">
                        <div className="spinner animate-rotate mb-4"></div>
                        <h2 className="text-2xl font-bold text-white mb-4 animate-pulse">Loading Performance Data</h2>
                        <p className="text-neutral-300">Analyzing your athletic metrics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center particle-container p-4">
                <div className="cyber card max-w-md w-full text-center animate-hologram">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Data Error</h2>
                        <p className="text-neutral-300 mb-6">{error}</p>
                        <button className="btn-neu">Retry</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen particle-container p-8">
            <div className="fluid-container">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-5xl font-bold text-white mb-4 animate-glow">
                        AthleteAI Dashboard
                    </h1>
                    <p className="text-neutral-300 text-xl max-w-2xl mx-auto">
                        Your comprehensive sports performance analytics platform
                    </p>
                </div>

                {/* Hero Stats Section */}
                <div className="fluid-grid mb-12">
                    {/* Platform Stats */}
                    <div className="glass card animate-slide-in-left">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-6 text-gradient">
                                Platform Statistics
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-electric-400 mb-2 animate-pulse">5,000+</div>
                                    <div className="text-neutral-400">Athletes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-cyber-500 mb-2 animate-pulse">22</div>
                                    <div className="text-neutral-400">Sports</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Profile Card */}
                    <div className="neu card animate-slide-in-right">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-gradient-electric rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                                <span className="text-2xl font-bold text-white">JD</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">John Doe</h3>
                            <p className="text-neutral-400 mb-4">Basketball • Point Guard</p>
                            <div className="inline-block px-4 py-2 bg-electric-500 text-white rounded-full text-sm font-semibold animate-glow">
                                Elite Score: 87
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Data */}
                {performanceData.length > 0 ? (
                    <div className="glass card animate-fade-in">
                        <div className="p-8">
                            <h2 className="text-3xl font-bold text-white mb-6">Your Performance Data</h2>
                            <div className="space-y-4">
                                {performanceData.map((item, index) => (
                                    <div key={index} className="neu p-4 rounded-lg animate-slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-white font-semibold">{item.sport || 'Sport'}</h3>
                                                <p className="text-neutral-400 text-sm">{item.date || 'Recent'}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-electric-400">{item.score || 'N/A'}</div>
                                                <div className="text-neutral-500 text-sm">Performance</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="cyber card animate-hologram text-center">
                        <div className="p-12">
                            <h2 className="text-2xl font-bold text-white mb-4">No Performance Data Yet</h2>
                            <p className="text-neutral-400 mb-6">Start tracking your athletic performance to see insights here.</p>
                            <button className="btn">Get Started</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;