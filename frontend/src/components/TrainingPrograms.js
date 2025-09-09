import React, { useState, useEffect } from 'react';
import './TrainingPrograms.css';

const TrainingPrograms = () => {
    const [programs, setPrograms] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [activeTab, setActiveTab] = useState('programs');
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [newProgram, setNewProgram] = useState({
        name: '',
        description: '',
        sport: '',
        level: 'beginner',
        duration: 4,
        goals: [],
        athleteId: '',
        templateId: ''
    });

    const [newGoal, setNewGoal] = useState({
        name: '',
        target: '',
        unit: '',
        deadline: ''
    });

    useEffect(() => {
        loadPrograms();
        loadTemplates();
    }, []);

    const loadPrograms = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/training-programs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load training programs');
            }

            const data = await response.json();
            setPrograms(data.programs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const response = await fetch('/api/training-programs/templates', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load templates');
            }

            const data = await response.json();
            setTemplates(data.templates || []);
        } catch (err) {
            console.error('Error loading templates:', err);
        }
    };

    const createProgram = async () => {
        try {
            const response = await fetch('/api/training-programs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newProgram)
            });

            if (!response.ok) {
                throw new Error('Failed to create program');
            }

            const data = await response.json();
            setPrograms([...programs, data.program]);
            setShowCreateModal(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        }
    };

    const updateProgramProgress = async (programId, progress) => {
        try {
            const response = await fetch(`/api/training-programs/${programId}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(progress)
            });

            if (!response.ok) {
                throw new Error('Failed to update progress');
            }

            // Refresh programs
            loadPrograms();
        } catch (err) {
            setError(err.message);
        }
    };

    const addGoal = async (programId) => {
        try {
            const response = await fetch(`/api/training-programs/${programId}/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newGoal)
            });

            if (!response.ok) {
                throw new Error('Failed to add goal');
            }

            setNewGoal({ name: '', target: '', unit: '', deadline: '' });
            loadPrograms();
        } catch (err) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setNewProgram({
            name: '',
            description: '',
            sport: '',
            level: 'beginner',
            duration: 4,
            goals: [],
            athleteId: '',
            templateId: ''
        });
    };

    const getProgramAnalytics = async (programId) => {
        try {
            const response = await fetch(`/api/training-programs/${programId}/analytics`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load analytics');
            }

            const data = await response.json();
            return data.analytics;
        } catch (err) {
            console.error('Error loading analytics:', err);
            return null;
        }
    };

    const renderProgramsList = () => (
        <div className="programs-list">
            {programs.map(program => (
                <div key={program.id} className="program-card" onClick={() => setSelectedProgram(program)}>
                    <div className="program-header">
                        <h4>{program.name}</h4>
                        <span className={`program-status ${program.status}`}>{program.status}</span>
                    </div>
                    <p className="program-description">{program.description}</p>
                    <div className="program-meta">
                        <span className="program-sport">{program.sport}</span>
                        <span className="program-level">{program.level}</span>
                        <span className="program-duration">{program.duration} weeks</span>
                    </div>
                    <div className="program-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${program.progress || 0}%` }}
                            ></div>
                        </div>
                        <span className="progress-text">{program.progress || 0}% Complete</span>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderTemplatesList = () => (
        <div className="templates-list">
            {templates.map(template => (
                <div key={template.id} className="template-card">
                    <div className="template-header">
                        <h4>{template.name}</h4>
                        <span className="template-sport">{template.sport}</span>
                    </div>
                    <p className="template-description">{template.description}</p>
                    <div className="template-meta">
                        <span className="template-level">{template.level}</span>
                        <span className="template-duration">{template.duration} weeks</span>
                    </div>
                    <button
                        className="use-template-btn"
                        onClick={() => {
                            setNewProgram({
                                ...newProgram,
                                name: template.name,
                                description: template.description,
                                sport: template.sport,
                                level: template.level,
                                duration: template.duration,
                                templateId: template.id
                            });
                            setShowCreateModal(true);
                        }}
                    >
                        Use Template
                    </button>
                </div>
            ))}
        </div>
    );

    const renderProgramDetails = () => {
        if (!selectedProgram) return null;

        return (
            <div className="program-details">
                <div className="program-header">
                    <h3>{selectedProgram.name}</h3>
                    <button className="back-btn" onClick={() => setSelectedProgram(null)}>← Back</button>
                </div>

                <div className="program-overview">
                    <div className="overview-stats">
                        <div className="stat-card">
                            <h4>Progress</h4>
                            <div className="progress-circle">
                                <span>{selectedProgram.progress || 0}%</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h4>Duration</h4>
                            <span className="stat-value">{selectedProgram.duration} weeks</span>
                        </div>
                        <div className="stat-card">
                            <h4>Level</h4>
                            <span className="stat-value">{selectedProgram.level}</span>
                        </div>
                        <div className="stat-card">
                            <h4>Sport</h4>
                            <span className="stat-value">{selectedProgram.sport}</span>
                        </div>
                    </div>
                </div>

                <div className="program-sections">
                    <div className="section">
                        <h4>Goals</h4>
                        <div className="goals-list">
                            {selectedProgram.goals?.map(goal => (
                                <div key={goal.id} className="goal-item">
                                    <div className="goal-info">
                                        <h5>{goal.name}</h5>
                                        <p>Target: {goal.target} {goal.unit}</p>
                                        <p>Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>
                                    </div>
                                    <div className="goal-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${goal.progress || 0}%` }}
                                            ></div>
                                        </div>
                                        <span>{goal.progress || 0}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="add-goal-form">
                            <h5>Add New Goal</h5>
                            <div className="form-row">
                                <input
                                    type="text"
                                    placeholder="Goal name"
                                    value={newGoal.name}
                                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                                />
                                <input
                                    type="text"
                                    placeholder="Target value"
                                    value={newGoal.target}
                                    onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                                />
                                <input
                                    type="text"
                                    placeholder="Unit"
                                    value={newGoal.unit}
                                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                                />
                                <input
                                    type="date"
                                    value={newGoal.deadline}
                                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                                />
                                <button
                                    className="add-goal-btn"
                                    onClick={() => addGoal(selectedProgram.id)}
                                    disabled={!newGoal.name || !newGoal.target}
                                >
                                    Add Goal
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h4>Weekly Schedule</h4>
                        <div className="schedule-grid">
                            {selectedProgram.schedule?.map((week, index) => (
                                <div key={index} className="week-card">
                                    <h5>Week {index + 1}</h5>
                                    <div className="week-workouts">
                                        {week.workouts?.map((workout, wIndex) => (
                                            <div key={wIndex} className="workout-item">
                                                <span className="workout-day">{workout.day}</span>
                                                <span className="workout-name">{workout.name}</span>
                                                <span className="workout-duration">{workout.duration} min</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="training-programs"><div className="loading">Loading training programs...</div></div>;
    }

    if (error) {
        return <div className="training-programs"><div className="error">{error}</div></div>;
    }

    return (
        <div className="training-programs">
            <div className="platform-header">
                <h2>Training Programs</h2>
                <button className="create-program-btn" onClick={() => setShowCreateModal(true)}>
                    Create Program
                </button>
            </div>

            <div className="platform-content">
                <div className="main-content">
                    <div className="program-tabs">
                        <button
                            className={activeTab === 'programs' ? 'active' : ''}
                            onClick={() => setActiveTab('programs')}
                        >
                            My Programs
                        </button>
                        <button
                            className={activeTab === 'templates' ? 'active' : ''}
                            onClick={() => setActiveTab('templates')}
                        >
                            Templates
                        </button>
                    </div>

                    <div className="tab-content">
                        {selectedProgram ? renderProgramDetails() : (
                            activeTab === 'programs' ? renderProgramsList() : renderTemplatesList()
                        )}
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create Training Program</h3>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Program Name</label>
                                <input
                                    type="text"
                                    value={newProgram.name}
                                    onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                                    placeholder="Enter program name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newProgram.description}
                                    onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                                    placeholder="Describe your training program"
                                    rows="3"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sport</label>
                                    <select
                                        value={newProgram.sport}
                                        onChange={(e) => setNewProgram({...newProgram, sport: e.target.value})}
                                    >
                                        <option value="">Select sport</option>
                                        <option value="football">Football</option>
                                        <option value="basketball">Basketball</option>
                                        <option value="baseball">Baseball</option>
                                        <option value="soccer">Soccer</option>
                                        <option value="track">Track & Field</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Level</label>
                                    <select
                                        value={newProgram.level}
                                        onChange={(e) => setNewProgram({...newProgram, level: e.target.value})}
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="elite">Elite</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Duration (weeks)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="52"
                                        value={newProgram.duration}
                                        onChange={(e) => setNewProgram({...newProgram, duration: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button
                                className="create-btn"
                                onClick={createProgram}
                                disabled={!newProgram.name || !newProgram.sport}
                            >
                                Create Program
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainingPrograms;
