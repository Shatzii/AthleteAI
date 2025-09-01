import React, { useState, useEffect, useRef } from 'react';
import { askAICoach, getVideoPlaylist } from '../utils/api';
import './AIFootballCoach.css';

const AIFootballCoach = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [transcript, setTranscript] = useState([
    { speaker: 'AI', text: 'Hello! I\'m your AI Football Coach. Ask me anything about football strategies or techniques.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videos, setVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const transcriptRef = useRef(null);

  const footballVideos = {
    "cover2": {
      title: "Cover 2 Defense Explained",
      url: "https://example.com/videos/cover2.mp4",
      description: "Learn how the Cover 2 defense works with two deep safeties splitting the field into halves."
    },
    "westcoast": {
      title: "West Coast Offense Basics",
      url: "https://example.com/videos/westcoast.mp4",
      description: "The West Coast offense emphasizes short, horizontal passing routes to stretch defenses horizontally."
    },
    "qbdrills": {
      title: "Quarterback Footwork Drills",
      url: "https://example.com/videos/qbdrills.mp4",
      description: "Improve your quarterback skills with these essential footwork drills for better pocket presence."
    }
  };

  const exampleQuestions = [
    "What's a Cover 2 defense?",
    "Show me quarterback drills",
    "Explain the West Coast offense",
    "How to read a defense?"
  ];

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await getVideoPlaylist();
        if (response.success) {
          setVideos(response.data);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    loadVideos();
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setIsProcessing(true);
    simulateVoiceInput();
  };

  const stopRecording = () => {
    setIsRecording(false);
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const speakResponse = () => {
    const responses = [
      "The Cover 2 defense is a zone defense with two deep safeties, each responsible for half of the deep zone.",
      "Quarterback footwork is essential for accuracy and timing in the passing game.",
      "The West Coast offense uses short, quick passes to control the ball and methodically move down the field."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addToTranscript('AI', randomResponse);

    // Load corresponding video based on response
    if (randomResponse.toLowerCase().includes('cover 2')) {
      loadVideo('Cover 2 Defense Explanation');
    } else if (randomResponse.toLowerCase().includes('quarterback') ||
              randomResponse.toLowerCase().includes('footwork')) {
      loadVideo('Quarterback Footwork Drills');
    } else if (randomResponse.toLowerCase().includes('west coast')) {
      loadVideo('West Coast Offense Basics');
    }
  };

  const simulateQuestion = async (question) => {
    addToTranscript('User', question);
    setIsProcessing(true);

    try {
      const response = await askAICoach(question);
      if (response.success) {
        addToTranscript('AI', response.response);

        // If there's a video suggestion, load it
        if (response.videoSuggestion) {
          loadVideo(response.videoSuggestion.name || 'Football Strategy Video');
        }
      } else {
        addToTranscript('AI', 'I\'m sorry, I couldn\'t process that question. Please try asking about football strategies or techniques.');
      }
    } catch (error) {
      console.error('Error asking AI coach:', error);
      addToTranscript('AI', 'I\'m having trouble connecting to my knowledge base. Please try again in a moment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateVoiceInput = () => {
    const questions = [
      "What's a Cover 2 defense?",
      "Show me quarterback drills",
      "Explain the West Coast offense",
      "How do I read a defense?"
    ];

    setTimeout(() => {
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      addToTranscript('User', randomQuestion);
      stopRecording();

      setTimeout(() => {
        simulateQuestion(randomQuestion);
      }, 1500);
    }, 3000);
  };

  const addToTranscript = (speaker, text) => {
    setTranscript(prev => [...prev, { speaker, text }]);
  };

  const loadVideo = (title) => {
    setCurrentVideo({ title, loading: true });

    setTimeout(() => {
      setCurrentVideo({
        title,
        loading: false,
        description: getVideoDescription(title)
      });
    }, 1500);
  };

  const getVideoDescription = (title) => {
    if (title.includes('Cover 2')) {
      return footballVideos.cover2.description;
    } else if (title.includes('West Coast')) {
      return footballVideos.westcoast.description;
    } else if (title.includes('Quarterback')) {
      return footballVideos.qbdrills.description;
    }
    return "Football strategy demonstration";
  };

  const getStatusText = () => {
    if (isRecording) return "Listening...";
    if (isProcessing) return "Processing...";
    return "Ready to listen";
  };

  const getStatusClass = () => {
    if (isRecording) return "recording";
    return "";
  };

  return (
    <div className="ai-football-coach">
      <div className="container">
        <header>
          <div className="logo">
            <i className="fas fa-football-ball fa-2x"></i>
            <h1>AI Football Coach</h1>
          </div>
          <div className="connection-status">
            <div className="connection-dot"></div>
            <span>Connected to ElevenLabs</span>
          </div>
        </header>

        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-video"></i>
            Video Demonstration
          </h2>
          <div className="video-container">
            <div className="video-placeholder">
              {currentVideo ? (
                currentVideo.loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin fa-2x"></i>
                    <p>Loading: {currentVideo.title}</p>
                  </>
                ) : (
                  <>
                    <i className="fas fa-play-circle fa-3x"></i>
                    <p>Now Playing: {currentVideo.title}</p>
                    <p style={{fontSize: '0.8rem', marginTop: '10px'}}>
                      {currentVideo.description}
                    </p>
                  </>
                )
              ) : (
                <>
                  <i className="fas fa-football-ball fa-4x"></i>
                  <p>Video will appear here when requested</p>
                </>
              )}
            </div>
          </div>
          <div className="playlist">
            {isLoadingVideos ? (
              <div className="playlist-item">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Loading videos...</span>
              </div>
            ) : (
              videos.map((video, index) => (
                <div
                  key={video.id || index}
                  className="playlist-item"
                  onClick={() => loadVideo(video.title)}
                >
                  <i className="fas fa-play-circle"></i>
                  <span>{video.title}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <i className="fas fa-microphone-alt"></i>
            Voice Interaction
          </h2>
          <div className={`status ${getStatusClass()}`}>
            <div className="status-indicator"></div>
            <span>{getStatusText()}</span>
          </div>
          <div className="transcript" ref={transcriptRef}>
            {transcript.map((message, index) => (
              <p key={index} className={message.speaker.toLowerCase()}>
                <strong>{message.speaker}:</strong> {message.text}
              </p>
            ))}
          </div>
          <div className="controls">
            <button
              className={`btn-record ${isRecording ? 'btn-stop' : ''}`}
              onClick={startRecording}
              disabled={isRecording}
            >
              <i className="fas fa-microphone"></i>
              Start Recording
            </button>
            <button
              className="btn-stop"
              onClick={stopRecording}
              disabled={!isRecording}
            >
              <i className="fas fa-stop"></i>
              Stop
            </button>
            <button className="btn-example" onClick={speakResponse}>
              <i className="fas fa-bullhorn"></i>
              Speak
            </button>
          </div>
          <div className="volume-control">
            <i className="fas fa-volume-down"></i>
            <input
              type="range"
              min="0"
              max="100"
              value={audioVolume * 100}
              onChange={(e) => setAudioVolume(e.target.value / 100)}
            />
            <i className="fas fa-volume-up"></i>
          </div>

          <h3 className="card-title" style={{fontSize: '1.2rem', marginTop: '20px'}}>
            <i className="fas fa-lightbulb"></i>
            Try Asking About:
          </h3>
          <div className="examples">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                className="example-btn"
                onClick={() => simulateQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>

          <div className="tips">
            <p><strong>Pro Tip:</strong> Use specific football terms for better results:</p>
            <ul>
              <li>"Show me [technique] drills"</li>
              <li>"Explain [defense/offense] strategy"</li>
              <li>"What is [football term]?"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFootballCoach;
