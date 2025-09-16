// Voice-Activated AI Coach Component
// Interactive voice interface for real-time coaching conversations

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Settings, MessageCircle } from 'lucide-react';
import api from '../services/api';

const VoiceCoach = ({ athleteId }) => {
  const [session, setSession] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preferences, setPreferences] = useState({
    voice: '21m00Tcm4TlvDq8ikWAM',
    language: 'en-US',
    style: 'motivational',
    speed: 1.0
  });
  const [availableVoices, setAvailableVoices] = useState([]);
  const [error, setError] = useState(null);
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    loadAvailableVoices();
    return () => {
      // Cleanup on unmount
      if (session) {
        endSession();
      }
    };
  }, []);

  const loadAvailableVoices = async () => {
    try {
      const response = await api.get('/voice/voices');
      if (response.data.success) {
        setAvailableVoices(response.data.data);
      }
    } catch (err) {
      console.error('Error loading voices:', err);
    }
  };

  const startSession = async () => {
    try {
      setError(null);
      const response = await api.post('/voice/session/start', {
        athleteId,
        preferences
      });

      if (response.data.success) {
        setSession(response.data.data);
        setConversation([]);

        // Play welcome message
        if (response.data.data.welcomeMessage.audioUrl) {
          playAudio(response.data.data.welcomeMessage.audioUrl);
        }

        // Add welcome message to conversation
        setConversation([{
          type: 'coach',
          text: response.data.data.welcomeMessage.text,
          timestamp: new Date(),
          audioUrl: response.data.data.welcomeMessage.audioUrl
        }]);
      }
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start voice session');
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      await api.post(`/voice/session/${session.sessionId}/end`);
      setSession(null);
      setConversation([]);
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioInput(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioInput = async (audioBlob) => {
    if (!session) return;

    try {
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await api.post(
        `/voice/session/${session.sessionId}/process`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const data = response.data.data;

        // Add user message to conversation
        setConversation(prev => [...prev, {
          type: 'user',
          text: data.transcription,
          confidence: data.confidence,
          timestamp: new Date()
        }]);

        // Add coach response to conversation
        setConversation(prev => [...prev, {
          type: 'coach',
          text: data.response.text,
          timestamp: new Date(),
          audioUrl: data.response.audioUrl,
          responseType: data.responseType
        }]);

        // Auto-play coach response if audio is available
        if (data.response.audioUrl) {
          setTimeout(() => playAudio(data.response.audioUrl), 500);
        }
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process audio input');
    } finally {
      setIsProcessing(false);
    }
  };

  const processTextInput = async () => {
    if (!session || !textInput.trim()) return;

    try {
      setIsProcessing(true);

      const response = await api.post(`/voice/session/${session.sessionId}/text`, {
        text: textInput.trim()
      });

      if (response.data.success) {
        const data = response.data.data;

        // Add user message to conversation
        setConversation(prev => [...prev, {
          type: 'user',
          text: data.transcription,
          timestamp: new Date()
        }]);

        // Add coach response to conversation
        setConversation(prev => [...prev, {
          type: 'coach',
          text: data.response.text,
          timestamp: new Date(),
          audioUrl: data.response.audioUrl,
          responseType: data.responseType
        }]);

        // Auto-play coach response if audio is available
        if (data.response.audioUrl) {
          setTimeout(() => playAudio(data.response.audioUrl), 500);
        }
      }

      setTextInput('');
    } catch (err) {
      console.error('Error processing text:', err);
      setError('Failed to process text input');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (audioUrl) => {
    try {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();

        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  return (
    <div className="voice-coach-container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
              Voice AI Coach
            </h1>
            <p className="text-gray-600 mt-1">
              Interactive voice coaching powered by AI
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Voice/Text Mode Toggle */}
            <button
              onClick={() => setIsTextMode(!isTextMode)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isTextMode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isTextMode ? 'Text Mode' : 'Voice Mode'}
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Session Controls */}
      {!session ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Start a Voice Coaching Session
            </h2>

            {/* Voice Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice
                </label>
                <select
                  value={preferences.voice}
                  onChange={(e) => updatePreferences({ voice: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableVoices.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} ({voice.style})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coaching Style
                </label>
                <select
                  value={preferences.style}
                  onChange={(e) => updatePreferences({ style: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="motivational">Motivational</option>
                  <option value="technical">Technical</option>
                  <option value="encouraging">Encouraging</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
            </div>

            <button
              onClick={startSession}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Session
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">
                  Session Active
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Coach: {session.coach.name}
              </span>
            </div>

            <button
              onClick={endSession}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Session</span>
            </button>
          </div>

          {/* Voice Controls */}
          {!isTextMode && (
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    <span>Start Recording</span>
                  </>
                )}
              </button>

              {isProcessing && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>
          )}

          {/* Text Input Mode */}
          {isTextMode && (
            <div className="flex space-x-4 mb-6">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && processTextInput()}
                placeholder="Type your message to the coach..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={processTextInput}
                disabled={isProcessing || !textInput.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h2>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>

                  {message.type === 'coach' && message.audioUrl && (
                    <button
                      onClick={() => playAudio(message.audioUrl)}
                      className="mt-2 flex items-center space-x-1 text-xs opacity-75 hover:opacity-100"
                    >
                      {isPlaying ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                      <span>Play</span>
                    </button>
                  )}

                  {message.confidence && message.confidence < 0.8 && (
                    <p className="text-xs opacity-75 mt-1">
                      Confidence: {Math.round(message.confidence * 100)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

export default VoiceCoach;