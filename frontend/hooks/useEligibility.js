import { useState, useEffect, useCallback } from 'react';

// Custom hook for eligibility management
export const useEligibility = (athleteId) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch eligibility data
  const fetchEligibility = useCallback(async () => {
    if (!athleteId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/eligibility/${athleteId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEligibility(data);
    } catch (err) {
      console.error('Error fetching eligibility:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  // Update academic standing
  const updateAcademic = useCallback(async (athleteId, academicData) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/academic`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(academicData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh eligibility data
      await fetchEligibility();

      return result;
    } catch (err) {
      console.error('Error updating academic standing:', err);
      throw err;
    }
  }, [fetchEligibility]);

  // Record competition
  const recordCompetition = useCallback(async (athleteId, competitionData) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/competition`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(competitionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh eligibility data
      await fetchEligibility();

      return result;
    } catch (err) {
      console.error('Error recording competition:', err);
      throw err;
    }
  }, [fetchEligibility]);

  // Record amateurism activity
  const recordAmateurism = useCallback(async (athleteId, earningsData) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/amateurism`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(earningsData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh eligibility data
      await fetchEligibility();

      return result;
    } catch (err) {
      console.error('Error recording amateurism activity:', err);
      throw err;
    }
  }, [fetchEligibility]);

  // Get eligibility report
  const getEligibilityReport = useCallback(async (athleteId) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/report`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const report = await response.json();
      return report;
    } catch (err) {
      console.error('Error fetching eligibility report:', err);
      throw err;
    }
  }, []);

  // Initialize eligibility for new athlete
  const initializeEligibility = useCallback(async (athleteId) => {
    try {
      const response = await fetch(`/api/eligibility/initialize/${athleteId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refresh eligibility data
      await fetchEligibility();

      return result;
    } catch (err) {
      console.error('Error initializing eligibility:', err);
      throw err;
    }
  }, [fetchEligibility]);

  // Fetch data on mount and when athleteId changes
  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  return {
    eligibility,
    loading,
    error,
    updateAcademic,
    recordCompetition,
    recordAmateurism,
    getEligibilityReport,
    initializeEligibility,
    refetch: fetchEligibility
  };
};

// Custom hook for AI Coach functionality
export const useAICoach = () => {
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [audioContext, setAudioContext] = useState(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContext) {
      setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
    }
  }, [audioContext]);

  // Generate voice response
  const generateVoice = useCallback(async (message, voiceType = 'coach_motivational', options = {}) => {
    try {
      setVoiceLoading(true);
      setVoiceError(null);

      const response = await fetch('/api/eligibility/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          voiceType,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const voiceData = await response.json();
      return voiceData;
    } catch (err) {
      console.error('Error generating voice:', err);
      setVoiceError(err.message);
      throw err;
    } finally {
      setVoiceLoading(false);
    }
  }, []);

  // Play voice audio
  const playVoice = useCallback(async (audioBase64) => {
    try {
      if (!audioContext) {
        throw new Error('Audio context not available');
      }

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Convert base64 to audio buffer
      const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const audioData = await audioContext.decodeAudioData(audioBuffer.buffer.slice());

      // Create and play audio
      const source = audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(audioContext.destination);
      source.start(0);

      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (err) {
      console.error('Error playing voice:', err);
      throw err;
    }
  }, [audioContext]);

  // Get eligibility-aware coaching
  const getEligibilityCoaching = useCallback(async (athleteId, workoutType, workoutData = {}) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/coach/eligibility/${workoutType}?${new URLSearchParams(workoutData)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const coaching = await response.json();
      return coaching;
    } catch (err) {
      console.error('Error getting eligibility coaching:', err);
      throw err;
    }
  }, []);

  // Get academic coaching
  const getAcademicCoaching = useCallback(async (athleteId, academicData = {}) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/coach/academic?${new URLSearchParams(academicData)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const coaching = await response.json();
      return coaching;
    } catch (err) {
      console.error('Error getting academic coaching:', err);
      throw err;
    }
  }, []);

  // Get recruiting coaching
  const getRecruitingCoaching = useCallback(async (athleteId, recruitingData = {}) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/coach/recruiting?${new URLSearchParams(recruitingData)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const coaching = await response.json();
      return coaching;
    } catch (err) {
      console.error('Error getting recruiting coaching:', err);
      throw err;
    }
  }, []);

  // Get performance coaching
  const getPerformanceCoaching = useCallback(async (athleteId, performanceData) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/coach/performance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(performanceData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const coaching = await response.json();
      return coaching;
    } catch (err) {
      console.error('Error getting performance coaching:', err);
      throw err;
    }
  }, []);

  // Get workout coaching
  const getWorkoutCoaching = useCallback(async (athleteId, workoutData) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/coach/workout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workoutData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const coaching = await response.json();
      return coaching;
    } catch (err) {
      console.error('Error getting workout coaching:', err);
      throw err;
    }
  }, []);

  // Get coach statistics
  const getCoachStats = useCallback(async (athleteId) => {
    try {
      const response = await fetch(`/api/eligibility/${athleteId}/coach/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const stats = await response.json();
      return stats;
    } catch (err) {
      console.error('Error getting coach stats:', err);
      throw err;
    }
  }, []);

  return {
    voiceLoading,
    voiceError,
    generateVoice,
    playVoice,
    getEligibilityCoaching,
    getAcademicCoaching,
    getRecruitingCoaching,
    getPerformanceCoaching,
    getWorkoutCoaching,
    getCoachStats
  };
};

// Hook for managing eligibility alerts
export const useEligibilityAlerts = (athleteId) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!athleteId) return;

    try {
      const response = await fetch(`/api/eligibility/${athleteId}/alerts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const alertsData = await response.json();
      setAlerts(alertsData);
      setUnreadCount(alertsData.filter(alert => !alert.read).length);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, [athleteId]);

  // Mark alert as read
  const markAsRead = useCallback(async (alertId) => {
    try {
      const response = await fetch(`/api/eligibility/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback(async (alertId) => {
    try {
      const response = await fetch(`/api/eligibility/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  }, []);

  // Fetch alerts on mount and when athleteId changes
  useEffect(() => {
    fetchAlerts();

    // Set up polling for new alerts (every 5 minutes)
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    unreadCount,
    markAsRead,
    dismissAlert,
    refetch: fetchAlerts
  };
};
