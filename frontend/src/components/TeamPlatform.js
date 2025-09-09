import React, { useState, useEffect } from 'react';
import './TeamPlatform.css';

const TeamPlatform = () => {
    const [teams, setTeams] = useState([]);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [newTeam, setNewTeam] = useState({
        name: '',
        description: '',
        settings: {
            allowPublicSharing: false,
            requireApproval: true,
            maxMembers: 50
        }
    });

    // Fetch user's teams
    const fetchUserTeams = async () => {
        try {
            const response = await fetch('/api/v1/team-platform/athlete-teams/current_user', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setTeams(data.data);
                if (data.data.length > 0 && !currentTeam) {
                    setCurrentTeam(data.data[0]);
                    fetchTeamDetails(data.data[0].teamId);
                }
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    // Fetch team details
    const fetchTeamDetails = async (teamId) => {
        try {
            const response = await fetch(`/api/v1/team-platform/team/${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setTeamMembers(data.data.members || []);
            }
        } catch (error) {
            console.error('Error fetching team details:', error);
        }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/v1/team-platform/notifications/current_user', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Create new team
    const createTeam = async () => {
        try {
            const response = await fetch('/api/v1/team-platform/create-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newTeam)
            });

            const data = await response.json();
            if (data.success) {
                setTeams([...teams, {
                    teamId: data.data.id,
                    teamName: data.data.name,
                    role: 'coach'
                }]);
                setCurrentTeam({
                    teamId: data.data.id,
                    teamName: data.data.name,
                    role: 'coach'
                });
                setShowCreateTeam(false);
                setNewTeam({
                    name: '',
                    description: '',
                    settings: {
                        allowPublicSharing: false,
                        requireApproval: true,
                        maxMembers: 50
                    }
                });
                fetchTeamDetails(data.data.id);
            }
        } catch (error) {
            console.error('Error creating team:', error);
        }
    };

    // Add team member
    const addTeamMember = async (athleteId) => {
        if (!currentTeam) return;

        try {
            const response = await fetch('/api/v1/team-platform/add-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    teamId: currentTeam.teamId,
                    athleteId,
                    role: 'member'
                })
            });

            const data = await response.json();
            if (data.success) {
                fetchTeamDetails(currentTeam.teamId);
            }
        } catch (error) {
            console.error('Error adding team member:', error);
        }
    };

    // Share workout
    const shareWorkout = async (workoutData) => {
        if (!currentTeam) return;

        try {
            const response = await fetch('/api/v1/team-platform/share-workout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    teamId: currentTeam.teamId,
                    workoutData
                })
            });

            const data = await response.json();
            if (data.success) {
                // Refresh team data or show success message
                console.log('Workout shared successfully');
            }
        } catch (error) {
            console.error('Error sharing workout:', error);
        }
    };

    // Mark notification as read
    const markNotificationAsRead = async (notificationId) => {
        try {
            await fetch('/api/v1/team-platform/mark-notification-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    athleteId: 'current_user',
                    notificationId
                })
            });

            setNotifications(notifications.map(notif =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'team_invitation': return '👥';
            case 'workout_shared': return '💪';
            case 'goal_achieved': return '🎯';
            case 'performance_update': return '📊';
            case 'team_announcement': return '📢';
            default: return '🔔';
        }
    };

    useEffect(() => {
        fetchUserTeams();
        fetchNotifications();
    }, []);

    return (
        <div className="team-platform">
            <div className="platform-header">
                <h2>Team Platform</h2>
                <button
                    className="create-team-btn"
                    onClick={() => setShowCreateTeam(true)}
                >
                    Create Team
                </button>
            </div>

            <div className="platform-content">
                <div className="teams-sidebar">
                    <h3>Your Teams</h3>
                    <div className="teams-list">
                        {teams.map(team => (
                            <div
                                key={team.teamId}
                                className={`team-item ${currentTeam?.teamId === team.teamId ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentTeam(team);
                                    fetchTeamDetails(team.teamId);
                                }}
                            >
                                <div className="team-name">{team.teamName}</div>
                                <div className="team-role">{team.role}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="main-content">
                    {currentTeam ? (
                        <>
                            <div className="team-header">
                                <h3>{currentTeam.teamName}</h3>
                                <div className="team-tabs">
                                    <button
                                        className={activeTab === 'overview' ? 'active' : ''}
                                        onClick={() => setActiveTab('overview')}
                                    >
                                        Overview
                                    </button>
                                    <button
                                        className={activeTab === 'members' ? 'active' : ''}
                                        onClick={() => setActiveTab('members')}
                                    >
                                        Members
                                    </button>
                                    <button
                                        className={activeTab === 'workouts' ? 'active' : ''}
                                        onClick={() => setActiveTab('workouts')}
                                    >
                                        Workouts
                                    </button>
                                    <button
                                        className={activeTab === 'goals' ? 'active' : ''}
                                        onClick={() => setActiveTab('goals')}
                                    >
                                        Goals
                                    </button>
                                </div>
                            </div>

                            <div className="tab-content">
                                {activeTab === 'overview' && (
                                    <div className="overview-tab">
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <h4>Total Members</h4>
                                                <div className="stat-value">{teamMembers.length}</div>
                                            </div>
                                            <div className="stat-card">
                                                <h4>Active Members</h4>
                                                <div className="stat-value">
                                                    {teamMembers.filter(m => m.status === 'active').length}
                                                </div>
                                            </div>
                                            <div className="stat-card">
                                                <h4>Shared Workouts</h4>
                                                <div className="stat-value">12</div>
                                            </div>
                                            <div className="stat-card">
                                                <h4>Goals Achieved</h4>
                                                <div className="stat-value">3</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'members' && (
                                    <div className="members-tab">
                                        <div className="members-header">
                                            <h4>Team Members</h4>
                                            <button className="add-member-btn">Add Member</button>
                                        </div>
                                        <div className="members-list">
                                            {teamMembers.map(member => (
                                                <div key={member.athleteId} className="member-card">
                                                    <div className="member-info">
                                                        <div className="member-name">{member.athleteId}</div>
                                                        <div className="member-role">{member.role}</div>
                                                        <div className="member-status">{member.status}</div>
                                                    </div>
                                                    <div className="member-actions">
                                                        <button className="action-btn">View Profile</button>
                                                        <button className="action-btn">Message</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'workouts' && (
                                    <div className="workouts-tab">
                                        <div className="workouts-header">
                                            <h4>Shared Workouts</h4>
                                            <button className="share-workout-btn">Share Workout</button>
                                        </div>
                                        <div className="workouts-list">
                                            {/* Mock workout data */}
                                            <div className="workout-card">
                                                <div className="workout-info">
                                                    <h5>High-Intensity Interval Training</h5>
                                                    <p>45 minutes • Shared by John Doe</p>
                                                    <div className="workout-tags">
                                                        <span className="tag">Cardio</span>
                                                        <span className="tag">HIIT</span>
                                                    </div>
                                                </div>
                                                <div className="workout-actions">
                                                    <button className="like-btn">👍 5</button>
                                                    <button className="comment-btn">💬 3</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'goals' && (
                                    <div className="goals-tab">
                                        <div className="goals-header">
                                            <h4>Team Goals</h4>
                                            <button className="create-goal-btn">Create Goal</button>
                                        </div>
                                        <div className="goals-list">
                                            {/* Mock goal data */}
                                            <div className="goal-card">
                                                <div className="goal-info">
                                                    <h5>Improve Team Sprint Times</h5>
                                                    <p>Target: 10% improvement in 40m sprint times</p>
                                                    <div className="goal-progress">
                                                        <div className="progress-bar">
                                                            <div className="progress-fill" style={{ width: '65%' }}></div>
                                                        </div>
                                                        <span className="progress-text">65% Complete</span>
                                                    </div>
                                                </div>
                                                <div className="goal-actions">
                                                    <button className="update-progress-btn">Update Progress</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-team-selected">
                            <h3>Select a team to get started</h3>
                            <p>Choose a team from the sidebar or create a new one</p>
                        </div>
                    )}
                </div>

                <div className="notifications-sidebar">
                    <h3>Notifications</h3>
                    <div className="notifications-list">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                            >
                                <div className="notification-icon">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-message">{notification.data.message}</div>
                                    <div className="notification-time">
                                        {new Date(notification.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showCreateTeam && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create New Team</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowCreateTeam(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Team Name</label>
                                <input
                                    type="text"
                                    value={newTeam.name}
                                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                                    placeholder="Enter team name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newTeam.description}
                                    onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                                    placeholder="Enter team description"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Max Members</label>
                                <input
                                    type="number"
                                    value={newTeam.settings.maxMembers}
                                    onChange={(e) => setNewTeam({
                                        ...newTeam,
                                        settings: {
                                            ...newTeam.settings,
                                            maxMembers: parseInt(e.target.value)
                                        }
                                    })}
                                    min="1"
                                    max="100"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowCreateTeam(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="create-btn"
                                onClick={createTeam}
                                disabled={!newTeam.name.trim()}
                            >
                                Create Team
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPlatform;
