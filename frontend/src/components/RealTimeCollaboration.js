// Real-Time Collaboration Component
// Live coaching sessions with virtual whiteboard and real-time communication

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Users, Settings, Share2, Square, Play, Pause, Download, Pen, Eraser, Undo, Redo, ZoomIn, ZoomOut, Move, Save } from 'lucide-react';
import api from '../services/api';

const RealTimeCollaboration = ({ sessionId, user }) => {
  const [socket, setSocket] = useState(null);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('whiteboard');
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [whiteboardData, setWhiteboardData] = useState({
    strokes: [],
    background: null
  });

  // Whiteboard refs and state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState('pen');
  const [brushSize, setBrushSize] = useState(2);
  const [brushColor, setBrushColor] = useState('#000000');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Chat ref
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeSocket();
    loadSessionData();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      newSocket.emit('join-session', {
        sessionId,
        userId: user.id,
        userName: user.name,
        role: user.role || 'participant'
      });
    });

    // Session events
    newSocket.on('session-joined', (data) => {
      setSession(data.session);
      setParticipants(data.participants);
      setWhiteboardData(data.whiteboard);
      setMessages(data.chat);
    });

    newSocket.on('participant-joined', (data) => {
      setParticipants(prev => [...prev, data.participant]);
    });

    newSocket.on('participant-left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.participant.id));
    });

    newSocket.on('host-changed', (data) => {
      setSession(prev => prev ? { ...prev, host: data.newHost.id } : null);
    });

    newSocket.on('session-ended', (data) => {
      alert(`Session ended: ${data.reason}`);
      // Redirect or close component
    });

    // Chat events
    newSocket.on('new-message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // Whiteboard events
    newSocket.on('whiteboard-draw', (data) => {
      setWhiteboardData(prev => ({
        ...prev,
        strokes: [...prev.strokes, data]
      }));
      redrawCanvas();
    });

    newSocket.on('whiteboard-clear', () => {
      setWhiteboardData(prev => ({
        ...prev,
        strokes: []
      }));
      redrawCanvas();
    });

    newSocket.on('whiteboard-undo', (data) => {
      setWhiteboardData(prev => ({
        ...prev,
        strokes: data.strokes
      }));
      redrawCanvas();
    });

    // Screen sharing events
    newSocket.on('screen-share-started', (data) => {
      setIsScreenSharing(true);
      // Handle screen share display
    });

    newSocket.on('screen-share-stopped', () => {
      setIsScreenSharing(false);
    });

    // Recording events
    newSocket.on('recording-started', (data) => {
      setIsRecording(true);
    });

    newSocket.on('recording-stopped', (data) => {
      setIsRecording(false);
    });

    setSocket(newSocket);
  };

  const loadSessionData = async () => {
    try {
      const response = await api.get(`/collaboration/sessions/${sessionId}`);
      if (response.data.success) {
        setSession(response.data.data);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send-message', {
      sessionId,
      userId: user.id,
      message: newMessage.trim(),
      type: 'text'
    });

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Whiteboard functions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);

    // Draw background
    if (whiteboardData.background) {
      // Draw background image or pattern
    }

    // Draw strokes
    whiteboardData.strokes.forEach(stroke => {
      if (stroke.type === 'path') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        stroke.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [whiteboardData, zoom, panOffset]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const startDrawing = (e) => {
    if (currentTool !== 'pen' || !socket) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    setIsDrawing(true);

    const newStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'path',
      points: [{ x, y }],
      color: brushColor,
      size: brushSize,
      userId: user.id
    };

    setWhiteboardData(prev => ({
      ...prev,
      strokes: [...prev.strokes, newStroke]
    }));
  };

  const draw = (e) => {
    if (!isDrawing || currentTool !== 'pen' || !socket) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    setWhiteboardData(prev => {
      const newStrokes = [...prev.strokes];
      const currentStroke = newStrokes[newStrokes.length - 1];
      currentStroke.points.push({ x, y });

      return {
        ...prev,
        strokes: newStrokes
      };
    });

    redrawCanvas();
  };

  const stopDrawing = () => {
    if (!isDrawing || !socket) return;

    setIsDrawing(false);

    // Send the completed stroke to other participants
    const currentStroke = whiteboardData.strokes[whiteboardData.strokes.length - 1];
    socket.emit('whiteboard-draw', {
      sessionId,
      userId: user.id,
      stroke: currentStroke
    });
  };

  const clearWhiteboard = () => {
    if (!socket) return;

    socket.emit('whiteboard-clear', {
      sessionId,
      userId: user.id
    });
  };

  const undoLastStroke = () => {
    if (!socket) return;

    socket.emit('whiteboard-undo', {
      sessionId,
      userId: user.id
    });
  };

  const toggleRecording = () => {
    if (!socket || session?.host !== user.id) return;

    if (isRecording) {
      socket.emit('stop-recording', {
        sessionId,
        userId: user.id
      });
    } else {
      socket.emit('start-recording', {
        sessionId,
        userId: user.id
      });
    }
  };

  const toggleScreenShare = () => {
    if (!socket) return;

    if (isScreenSharing) {
      socket.emit('stop-screen-share', {
        sessionId,
        userId: user.id
      });
    } else {
      // Request screen sharing permission
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
          socket.emit('start-screen-share', {
            sessionId,
            userId: user.id,
            streamId: stream.id
          });
        })
        .catch(error => {
          console.error('Error starting screen share:', error);
          alert('Screen sharing permission denied');
        });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {session?.settings?.title || 'Live Coaching Session'}
            </h1>
            <p className="text-sm text-gray-600">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
              {isRecording && <span className="ml-2 text-red-600">● Recording</span>}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {session?.host === user.id && (
              <button
                onClick={toggleRecording}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  isRecording ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
            )}

            <button
              onClick={toggleScreenShare}
              className={`flex items-center px-3 py-2 rounded-lg ${
                isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Whiteboard */}
          <div className="flex-1 bg-white relative">
            {/* Whiteboard Toolbar */}
            <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
              <button
                onClick={() => setCurrentTool('pen')}
                className={`p-2 rounded ${currentTool === 'pen' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                <Pen className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentTool('eraser')}
                className={`p-2 rounded ${currentTool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                <Eraser className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentTool('move')}
                className={`p-2 rounded ${currentTool === 'move' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
              >
                <Move className="h-4 w-4" />
              </button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded border"
              />

              <select
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="1">1px</option>
                <option value="2">2px</option>
                <option value="4">4px</option>
                <option value="8">8px</option>
                <option value="12">12px</option>
              </select>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              <button onClick={undoLastStroke} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                <Undo className="h-4 w-4" />
              </button>
              <button onClick={clearWhiteboard} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                Clear
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
              <button
                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              className="w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ cursor: currentTool === 'move' ? 'grab' : 'crosshair' }}
            />
          </div>

          {/* Side Panel */}
          <div className="w-80 bg-white border-l flex flex-col">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                }`}
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3 px-4 text-sm font-medium ${
                  activeTab === 'participants' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Participants
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {message.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {message.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{message.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                        <p className="text-xs text-gray-600 capitalize">{participant.role}</p>
                      </div>
                      {participant.id === session?.host && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Host
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeCollaboration;