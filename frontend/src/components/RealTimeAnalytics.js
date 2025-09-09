import React, { useState, useEffect, useRef } from 'react';
import './RealTimeAnalytics.css';

const RealTimeAnalytics = () => {
    const [session, setSession] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [metrics, setMetrics] = useState({
        heartRate: 0,
        fatigue: 0,
        recovery: 100,
        performance: 0
    });
    const [isActive, setIsActive] = useState(false);
    const [dashboard, setDashboard] = useState(null);
    const intervalRef = useRef(null);

    // Initialize real-time session
    const startSession = async () => {
        try {
            const response = await fetch('/api/v1/real-time-analytics/start-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    athleteId: 'current_user', // Replace with actual athlete ID
                    sport: 'football',
                    initialMetrics: metrics
                })
            });

            const data = await response.json();
            if (data.success) {
                setSession(data.data);
                setIsActive(true);
                startMetricsUpdate();
            }
        } catch (error) {
            console.error('Error starting session:', error);
        }
    };

    // End real-time session
    const endSession = async () => {
        try {
            const response = await fetch('/api/v1/real-time-analytics/end-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    athleteId: 'current_user'
                })
            });

            const data = await response.json();
            if (data.success) {
                setSession(null);
                setIsActive(false);
                stopMetricsUpdate();
            }
        } catch (error) {
            console.error('Error ending session:', error);
        }
    };

    // Start periodic metrics update
    const startMetricsUpdate = () => {
        intervalRef.current = setInterval(async () => {
            // Simulate real-time metrics (in real app, this would come from sensors)
            const newMetrics = {
                heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
                fatigue: Math.floor(Math.random() * 30) + 20, // 20-50%
                recovery: Math.floor(Math.random() * 30) + 70, // 70-100%
                performance: Math.floor(Math.random() * 20) + 80 // 80-100%
            };

            setMetrics(newMetrics);

            // Update session metrics
            if (session) {
                await updateSessionMetrics(newMetrics);
            }

            // Fetch dashboard data
            await fetchDashboardData();
        }, 5000); // Update every 5 seconds
    };

    // Stop metrics update
    const stopMetricsUpdate = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Update session metrics
    const updateSessionMetrics = async (newMetrics) => {
        try {
            await fetch('/api/v1/real-time-analytics/update-metrics', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    athleteId: 'current_user',
                    metrics: newMetrics
                })
            });
        } catch (error) {
            console.error('Error updating metrics:', error);
        }
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/v1/real-time-analytics/dashboard/current_user', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setDashboard(data.data);
                setAlerts(data.data.alerts || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        }
    };

    // Acknowledge alert
    const acknowledgeAlert = async (alertId) => {
        try {
            await fetch('/api/v1/real-time-analytics/acknowledge-alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    athleteId: 'current_user',
                    alertId
                })
            });

            // Update alerts list
            setAlerts(alerts.map(alert =>
                alert.id === alertId ? { ...alert, acknowledged: true } : alert
            ));
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    // Get alert severity color
    const getAlertSeverityColor = (type) => {
        if (type.includes('CRITICAL')) return '#ff4444';
        if (type.includes('HIGH')) return '#ff8800';
        if (type.includes('LOW')) return '#44aa44';
        return '#666666';
    };

    // Get metric status color
    const getMetricStatusColor = (value, thresholds) => {
        if (thresholds && value >= thresholds.good) return '#44aa44';
        if (thresholds && value >= thresholds.warning) return '#ff8800';
        if (thresholds && value < thresholds.warning) return '#ff4444';
        return '#666666';
    };

    useEffect(() => {
        // Fetch initial dashboard data
        fetchDashboardData();

        // Cleanup on unmount
        return () => {
            stopMetricsUpdate();
        };
    }, []);

    return (
        <div className="real-time-analytics">
            <div className="analytics-header">
                <h2>Real-Time Analytics</h2>
                <div className="session-controls">
                    {!isActive ? (
                        <button
                            className="start-session-btn"
                            onClick={startSession}
                        >
                            Start Session
                        </button>
                    ) : (
                        <button
                            className="end-session-btn"
                            onClick={endSession}
                        >
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {isActive && (
                <div className="session-info">
                    <div className="session-status">
                        <span className="status-indicator active"></span>
                        Session Active
                    </div>
                    <div className="session-time">
                        Started: {session ? new Date(session.startTime).toLocaleTimeString() : ''}
                    </div>
                </div>
            )}

            <div className="analytics-content">
                <div className="metrics-grid">
                    <div className="metric-card">
                        <h3>Heart Rate</h3>
                        <div className="metric-value" style={{
                            color: getMetricStatusColor(metrics.heartRate, { good: 70, warning: 85 })
                        }}>
                            {metrics.heartRate} bpm
                        </div>
                        <div className="metric-bar">
                            <div
                                className="metric-fill"
                                style={{
                                    width: `${Math.min((metrics.heartRate / 100) * 100, 100)}%`,
                                    backgroundColor: getMetricStatusColor(metrics.heartRate, { good: 70, warning: 85 })
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="metric-card">
                        <h3>Fatigue Level</h3>
                        <div className="metric-value" style={{
                            color: getMetricStatusColor(metrics.fatigue, { good: 30, warning: 60 })
                        }}>
                            {metrics.fatigue}%
                        </div>
                        <div className="metric-bar">
                            <div
                                className="metric-fill"
                                style={{
                                    width: `${metrics.fatigue}%`,
                                    backgroundColor: getMetricStatusColor(metrics.fatigue, { good: 30, warning: 60 })
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="metric-card">
                        <h3>Recovery</h3>
                        <div className="metric-value" style={{
                            color: getMetricStatusColor(metrics.recovery, { good: 80, warning: 60 })
                        }}>
                            {metrics.recovery}%
                        </div>
                        <div className="metric-bar">
                            <div
                                className="metric-fill"
                                style={{
                                    width: `${metrics.recovery}%`,
                                    backgroundColor: getMetricStatusColor(metrics.recovery, { good: 80, warning: 60 })
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="metric-card">
                        <h3>Performance</h3>
                        <div className="metric-value" style={{
                            color: getMetricStatusColor(metrics.performance, { good: 85, warning: 70 })
                        }}>
                            {metrics.performance}%
                        </div>
                        <div className="metric-bar">
                            <div
                                className="metric-fill"
                                style={{
                                    width: `${metrics.performance}%`,
                                    backgroundColor: getMetricStatusColor(metrics.performance, { good: 85, warning: 70 })
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="alerts-section">
                    <h3>Active Alerts</h3>
                    <div className="alerts-list">
                        {alerts.length === 0 ? (
                            <div className="no-alerts">No active alerts</div>
                        ) : (
                            alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''}`}
                                    style={{ borderLeftColor: getAlertSeverityColor(alert.type) }}
                                >
                                    <div className="alert-content">
                                        <div className="alert-type">{alert.type.replace(/_/g, ' ')}</div>
                                        <div className="alert-message">{alert.message}</div>
                                        <div className="alert-time">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    {!alert.acknowledged && (
                                        <button
                                            className="acknowledge-btn"
                                            onClick={() => acknowledgeAlert(alert.id)}
                                        >
                                            Acknowledge
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {dashboard && (
                    <div className="performance-summary">
                        <h3>Performance Summary</h3>
                        <div className="summary-stats">
                            <div className="stat">
                                <span className="stat-label">Active Users:</span>
                                <span className="stat-value">{dashboard.performance?.activeUsers || 0}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Data Points:</span>
                                <span className="stat-value">{dashboard.performance?.dataPointsProcessed || 0}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">Alerts Today:</span>
                                <span className="stat-value">{dashboard.performance?.alertsTriggered || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RealTimeAnalytics;
