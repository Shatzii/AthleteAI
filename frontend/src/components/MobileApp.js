import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './MobileApp.css';

const MobileApp = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [accelerometerData, setAccelerometerData] = useState(null);
  const [workoutData, setWorkoutData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    // Initialize mobile features
    initializeGeolocation();
    initializeAccelerometer();
    initializeNotifications();

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setLocationData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  };

  const initializeAccelerometer = () => {
    if ('DeviceMotionEvent' in window) {
      const handleMotion = (event) => {
        setAccelerometerData({
          x: event.acceleration.x,
          y: event.acceleration.y,
          z: event.acceleration.z,
          timestamp: Date.now()
        });
      };

      window.addEventListener('devicemotion', handleMotion);
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  };

  const initializeNotifications = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Add some sample notifications
          setNotifications([
            {
              id: 1,
              title: 'Workout Reminder',
              message: 'Time for your daily training session!',
              timestamp: new Date(),
              type: 'reminder'
            },
            {
              id: 2,
              title: 'Performance Alert',
              message: 'Your recovery score is improving!',
              timestamp: new Date(Date.now() - 3600000),
              type: 'alert'
            }
          ]);
        }
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });

      videoRef.current.srcObject = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo({ blob, url });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecordedVideo = async () => {
    if (!recordedVideo) return;

    try {
      const formData = new FormData();
      formData.append('video', recordedVideo.blob, 'mobile-recording.webm');
      formData.append('sport', 'football'); // Default sport
      formData.append('position', 'QB'); // Default position
      formData.append('athleteId', user?.id);

      const response = await fetch('/api/computer-vision/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Video uploaded and analysis started!');
        setRecordedVideo(null);
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please check your connection.');
    }
  };

  const logWorkout = () => {
    const workout = {
      id: Date.now(),
      type: 'Training Session',
      duration: 60, // minutes
      location: locationData,
      timestamp: new Date(),
      metrics: {
        distance: Math.random() * 5 + 1, // km
        averageHeartRate: Math.floor(Math.random() * 40) + 120,
        calories: Math.floor(Math.random() * 300) + 200
      }
    };

    setWorkoutData(prev => [workout, ...prev]);
    alert('Workout logged successfully!');
  };

  const sendNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  const renderDashboard = () => (
    <div className="mobile-dashboard">
      <div className="status-bar">
        <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
        <div className="battery">🔋 85%</div>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <div className="stat-value">
              {locationData ? `${locationData.latitude.toFixed(2)}, ${locationData.longitude.toFixed(2)}` : 'Location unavailable'}
            </div>
            <div className="stat-label">Current Location</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏃</div>
          <div className="stat-info">
            <div className="stat-value">{workoutData.length}</div>
            <div className="stat-label">Workouts Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <div className="stat-value">{notifications.length}</div>
            <div className="stat-label">Notifications</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button onClick={() => setCurrentView('record')} className="action-btn record">
          <div className="action-icon">📹</div>
          <div className="action-text">Record Video</div>
        </button>

        <button onClick={logWorkout} className="action-btn workout">
          <div className="action-icon">💪</div>
          <div className="action-text">Log Workout</div>
        </button>

        <button onClick={() => setCurrentView('analysis')} className="action-btn analysis">
          <div className="action-icon">📊</div>
          <div className="action-text">View Analysis</div>
        </button>

        <button onClick={() => setCurrentView('notifications')} className="action-btn notifications">
          <div className="action-icon">🔔</div>
          <div className="action-text">Notifications</div>
        </button>
      </div>

      <div className="recent-workouts">
        <h3>Recent Workouts</h3>
        {workoutData.length > 0 ? (
          <div className="workout-list">
            {workoutData.slice(0, 3).map(workout => (
              <div key={workout.id} className="workout-item">
                <div className="workout-type">{workout.type}</div>
                <div className="workout-metrics">
                  <span>{workout.metrics.distance.toFixed(1)} km</span>
                  <span>{workout.duration} min</span>
                  <span>{workout.metrics.calories} cal</span>
                </div>
                <div className="workout-time">
                  {workout.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-workouts">No recent workouts</p>
        )}
      </div>
    </div>
  );

  const renderRecording = () => (
    <div className="recording-view">
      <div className="recording-header">
        <button onClick={() => setCurrentView('dashboard')} className="back-btn">
          ← Back
        </button>
        <h2>Video Recording</h2>
      </div>

      <div className="camera-view">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-preview"
        />

        {recordedVideo && (
          <div className="recorded-video">
            <video src={recordedVideo.url} controls className="recorded-preview" />
            <div className="video-actions">
              <button onClick={uploadRecordedVideo} className="upload-btn">
                📤 Upload for Analysis
              </button>
              <button onClick={() => setRecordedVideo(null)} className="discard-btn">
                🗑️ Discard
              </button>
            </div>
          </div>
        )}

        <div className="recording-controls">
          {!isRecording ? (
            <button onClick={startRecording} className="record-btn">
              <div className="record-icon">⏺️</div>
              <div className="record-text">Start Recording</div>
            </button>
          ) : (
            <button onClick={stopRecording} className="stop-btn">
              <div className="stop-icon">⏹️</div>
              <div className="stop-text">Stop Recording</div>
            </button>
          )}
        </div>
      </div>

      <div className="recording-info">
        <div className="info-item">
          <span className="info-label">Location:</span>
          <span className="info-value">
            {locationData ? '📍 Available' : '📍 Not available'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Motion:</span>
          <span className="info-value">
            {accelerometerData ? '📱 Detected' : '📱 Not available'}
          </span>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="notifications-view">
      <div className="notifications-header">
        <button onClick={() => setCurrentView('dashboard')} className="back-btn">
          ← Back
        </button>
        <h2>Notifications</h2>
      </div>

      <div className="notifications-list">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-item">
            <div className="notification-icon">
              {notification.type === 'reminder' ? '⏰' : '🚨'}
            </div>
            <div className="notification-content">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
              <div className="notification-time">
                {notification.timestamp.toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => sendNotification(notification.title, notification.message)}
              className="notify-btn"
            >
              🔔
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="analysis-view">
      <div className="analysis-header">
        <button onClick={() => setCurrentView('dashboard')} className="back-btn">
          ← Back
        </button>
        <h2>Performance Analysis</h2>
      </div>

      <div className="analysis-content">
        <div className="live-metrics">
          <h3>Live Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">📍</div>
              <div className="metric-value">
                {locationData ? `${locationData.speed || 0} m/s` : 'N/A'}
              </div>
              <div className="metric-label">Speed</div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📱</div>
              <div className="metric-value">
                {accelerometerData ? `${accelerometerData.x?.toFixed(1) || 0}` : 'N/A'}
              </div>
              <div className="metric-label">Acceleration</div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">❤️</div>
              <div className="metric-value">142</div>
              <div className="metric-label">Heart Rate</div>
            </div>
          </div>
        </div>

        <div className="workout-summary">
          <h3>Today's Summary</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Workouts:</span>
              <span className="summary-value">{workoutData.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Distance:</span>
              <span className="summary-value">
                {workoutData.reduce((sum, w) => sum + w.metrics.distance, 0).toFixed(1)} km
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Calories:</span>
              <span className="summary-value">
                {workoutData.reduce((sum, w) => sum + w.metrics.calories, 0)} cal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mobile-app">
      <div className="mobile-container">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'record' && renderRecording()}
        {currentView === 'notifications' && renderNotifications()}
        {currentView === 'analysis' && renderAnalysis()}
      </div>

      {/* Mobile-style bottom navigation */}
      <div className="mobile-nav">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
        >
          <div className="nav-icon">🏠</div>
          <div className="nav-label">Home</div>
        </button>

        <button
          onClick={() => setCurrentView('record')}
          className={`nav-item ${currentView === 'record' ? 'active' : ''}`}
        >
          <div className="nav-icon">📹</div>
          <div className="nav-label">Record</div>
        </button>

        <button
          onClick={() => setCurrentView('analysis')}
          className={`nav-item ${currentView === 'analysis' ? 'active' : ''}`}
        >
          <div className="nav-icon">📊</div>
          <div className="nav-label">Analysis</div>
        </button>

        <button
          onClick={() => setCurrentView('notifications')}
          className={`nav-item ${currentView === 'notifications' ? 'active' : ''}`}
        >
          <div className="nav-icon">🔔</div>
          <div className="nav-label">Alerts</div>
        </button>
      </div>
    </div>
  );
};

export default MobileApp;
