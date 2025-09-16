// Real-Time Collaboration Service
// Live coaching sessions with virtual whiteboards and real-time communication

const { Server } = require('socket.io');
const mongoose = require('mongoose');

class RealTimeCollaborationService {
  constructor() {
    this.io = null;
    this.activeSessions = new Map();
    this.whiteboards = new Map();
    this.participants = new Map();
    this.recordings = new Map();

    this.metrics = {
      activeSessions: 0,
      totalParticipants: 0,
      messagesSent: 0,
      whiteboardActions: 0
    };
  }

  /**
   * Initialize the real-time collaboration service
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    try {
      this.io = new Server(server, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        }
      });

      this.setupSocketHandlers();
      console.log('✅ Real-time collaboration service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize real-time collaboration:', error);
      throw error;
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 User connected: ${socket.id}`);

      // Join session
      socket.on('join-session', (data) => {
        this.handleJoinSession(socket, data);
      });

      // Leave session
      socket.on('leave-session', (data) => {
        this.handleLeaveSession(socket, data);
      });

      // Send message
      socket.on('send-message', (data) => {
        this.handleSendMessage(socket, data);
      });

      // Whiteboard events
      socket.on('whiteboard-draw', (data) => {
        this.handleWhiteboardDraw(socket, data);
      });

      socket.on('whiteboard-clear', (data) => {
        this.handleWhiteboardClear(socket, data);
      });

      socket.on('whiteboard-undo', (data) => {
        this.handleWhiteboardUndo(socket, data);
      });

      // Screen sharing
      socket.on('start-screen-share', (data) => {
        this.handleStartScreenShare(socket, data);
      });

      socket.on('stop-screen-share', (data) => {
        this.handleStopScreenShare(socket, data);
      });

      // Recording
      socket.on('start-recording', (data) => {
        this.handleStartRecording(socket, data);
      });

      socket.on('stop-recording', (data) => {
        this.handleStopRecording(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle user joining a session
   */
  handleJoinSession(socket, data) {
    const { sessionId, userId, userName, role = 'participant' } = data;

    // Create session if it doesn't exist
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, {
        id: sessionId,
        host: userId,
        participants: new Map(),
        whiteboard: {
          id: `wb_${sessionId}`,
          strokes: [],
          background: null,
          undoStack: []
        },
        screenSharing: {
          active: false,
          presenter: null,
          streamId: null
        },
        recording: {
          active: false,
          startedAt: null,
          data: []
        },
        chat: [],
        createdAt: new Date(),
        settings: {
          allowDrawing: true,
          allowChat: true,
          allowScreenShare: true,
          maxParticipants: 10
        }
      });

      this.whiteboards.set(sessionId, this.activeSessions.get(sessionId).whiteboard);
      this.metrics.activeSessions++;
    }

    const session = this.activeSessions.get(sessionId);

    // Check participant limit
    if (session.participants.size >= session.settings.maxParticipants) {
      socket.emit('session-full', { sessionId });
      return;
    }

    // Add participant
    const participant = {
      id: userId,
      name: userName,
      role,
      socketId: socket.id,
      joinedAt: new Date(),
      isActive: true
    };

    session.participants.set(userId, participant);
    socket.join(sessionId);

    // Store participant mapping
    if (!this.participants.has(socket.id)) {
      this.participants.set(socket.id, { sessionId, userId });
    }

    this.metrics.totalParticipants++;

    // Notify others in session
    socket.to(sessionId).emit('participant-joined', {
      participant: {
        id: participant.id,
        name: participant.name,
        role: participant.role
      }
    });

    // Send session data to new participant
    socket.emit('session-joined', {
      session: {
        id: sessionId,
        host: session.host,
        participants: Array.from(session.participants.values()).map(p => ({
          id: p.id,
          name: p.name,
          role: p.role
        })),
        whiteboard: session.whiteboard,
        screenSharing: session.screenSharing,
        chat: session.chat.slice(-50), // Last 50 messages
        settings: session.settings
      }
    });

    console.log(`👥 ${userName} joined session ${sessionId}`);
  }

  /**
   * Handle user leaving a session
   */
  handleLeaveSession(socket, data) {
    const { sessionId, userId } = data;
    this.removeParticipant(socket.id, sessionId, userId);
  }

  /**
   * Handle sending chat messages
   */
  handleSendMessage(socket, data) {
    const { sessionId, userId, message, type = 'text' } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (!participant) return;

    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: participant.name,
      message,
      type,
      timestamp: new Date()
    };

    // Add to session chat history
    session.chat.push(chatMessage);

    // Keep only last 1000 messages
    if (session.chat.length > 1000) {
      session.chat = session.chat.slice(-1000);
    }

    this.metrics.messagesSent++;

    // Broadcast to all participants in session
    this.io.to(sessionId).emit('new-message', chatMessage);
  }

  /**
   * Handle whiteboard drawing
   */
  handleWhiteboardDraw(socket, data) {
    const { sessionId, userId, stroke } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Add stroke to whiteboard
    const whiteboardStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...stroke,
      timestamp: new Date()
    };

    session.whiteboard.strokes.push(whiteboardStroke);
    session.whiteboard.undoStack = []; // Clear redo stack

    // Keep only last 1000 strokes
    if (session.whiteboard.strokes.length > 1000) {
      session.whiteboard.strokes = session.whiteboard.strokes.slice(-1000);
    }

    this.metrics.whiteboardActions++;

    // Broadcast to all participants except sender
    socket.to(sessionId).emit('whiteboard-draw', whiteboardStroke);

    // Record for session recording
    if (session.recording.active) {
      session.recording.data.push({
        type: 'whiteboard-draw',
        data: whiteboardStroke,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle whiteboard clear
   */
  handleWhiteboardClear(socket, data) {
    const { sessionId, userId } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Save current strokes to undo stack
    session.whiteboard.undoStack.push([...session.whiteboard.strokes]);

    // Clear whiteboard
    session.whiteboard.strokes = [];

    // Keep only last 50 undo states
    if (session.whiteboard.undoStack.length > 50) {
      session.whiteboard.undoStack = session.whiteboard.undoStack.slice(-50);
    }

    this.metrics.whiteboardActions++;

    // Broadcast to all participants
    this.io.to(sessionId).emit('whiteboard-clear', { userId });

    // Record for session recording
    if (session.recording.active) {
      session.recording.data.push({
        type: 'whiteboard-clear',
        data: { userId },
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle whiteboard undo
   */
  handleWhiteboardUndo(socket, data) {
    const { sessionId, userId } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Restore from undo stack
    if (session.whiteboard.undoStack.length > 0) {
      session.whiteboard.strokes = session.whiteboard.undoStack.pop();

      this.metrics.whiteboardActions++;

      // Broadcast to all participants
      this.io.to(sessionId).emit('whiteboard-undo', {
        userId,
        strokes: session.whiteboard.strokes
      });

      // Record for session recording
      if (session.recording.active) {
        session.recording.data.push({
          type: 'whiteboard-undo',
          data: { userId, strokes: session.whiteboard.strokes },
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Handle start screen sharing
   */
  handleStartScreenShare(socket, data) {
    const { sessionId, userId, streamId } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Only allow one screen share at a time
    if (session.screenSharing.active) {
      socket.emit('screen-share-error', { message: 'Screen sharing already active' });
      return;
    }

    session.screenSharing.active = true;
    session.screenSharing.presenter = userId;
    session.screenSharing.streamId = streamId;

    // Broadcast to all participants
    this.io.to(sessionId).emit('screen-share-started', {
      presenter: userId,
      streamId
    });

    console.log(`📺 Screen sharing started in session ${sessionId} by ${userId}`);
  }

  /**
   * Handle stop screen sharing
   */
  handleStopScreenShare(socket, data) {
    const { sessionId, userId } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Only presenter can stop sharing
    if (session.screenSharing.presenter !== userId) {
      return;
    }

    session.screenSharing.active = false;
    session.screenSharing.presenter = null;
    session.screenSharing.streamId = null;

    // Broadcast to all participants
    this.io.to(sessionId).emit('screen-share-stopped', { presenter: userId });

    console.log(`📺 Screen sharing stopped in session ${sessionId}`);
  }

  /**
   * Handle start recording
   */
  handleStartRecording(socket, data) {
    const { sessionId, userId } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Only host can start recording
    if (session.host !== userId) {
      socket.emit('recording-error', { message: 'Only session host can start recording' });
      return;
    }

    if (session.recording.active) {
      socket.emit('recording-error', { message: 'Recording already active' });
      return;
    }

    session.recording.active = true;
    session.recording.startedAt = new Date();
    session.recording.data = [];

    // Broadcast to all participants
    this.io.to(sessionId).emit('recording-started', {
      startedBy: userId,
      startedAt: session.recording.startedAt
    });

    console.log(`🎬 Recording started in session ${sessionId}`);
  }

  /**
   * Handle stop recording
   */
  handleStopRecording(socket, data) {
    const { sessionId, userId } = data;

    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Only host can stop recording
    if (session.host !== userId) {
      return;
    }

    if (!session.recording.active) {
      return;
    }

    const recordingData = {
      sessionId,
      startedAt: session.recording.startedAt,
      stoppedAt: new Date(),
      duration: new Date() - session.recording.startedAt,
      data: session.recording.data,
      participants: Array.from(session.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        role: p.role
      }))
    };

    // Save recording
    const recordingId = `rec_${sessionId}_${Date.now()}`;
    this.recordings.set(recordingId, recordingData);

    session.recording.active = false;
    session.recording.startedAt = null;
    session.recording.data = [];

    // Broadcast to all participants
    this.io.to(sessionId).emit('recording-stopped', {
      stoppedBy: userId,
      recordingId,
      duration: recordingData.duration
    });

    console.log(`🎬 Recording stopped in session ${sessionId}, saved as ${recordingId}`);
  }

  /**
   * Handle user disconnect
   */
  handleDisconnect(socket) {
    const participantInfo = this.participants.get(socket.id);
    if (participantInfo) {
      const { sessionId, userId } = participantInfo;
      this.removeParticipant(socket.id, sessionId, userId);
    }

    this.participants.delete(socket.id);
    console.log(`🔌 User disconnected: ${socket.id}`);
  }

  /**
   * Remove participant from session
   */
  removeParticipant(socketId, sessionId, userId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (!participant) return;

    session.participants.delete(userId);

    // If screen sharing presenter left, stop sharing
    if (session.screenSharing.presenter === userId) {
      session.screenSharing.active = false;
      session.screenSharing.presenter = null;
      session.screenSharing.streamId = null;

      this.io.to(sessionId).emit('screen-share-stopped', { presenter: userId });
    }

    // If host left, assign new host or end session
    if (session.host === userId && session.participants.size > 0) {
      const newHost = Array.from(session.participants.values())[0];
      session.host = newHost.id;

      this.io.to(sessionId).emit('host-changed', {
        newHost: {
          id: newHost.id,
          name: newHost.name
        }
      });
    }

    // Notify remaining participants
    this.io.to(sessionId).emit('participant-left', {
      participant: {
        id: participant.id,
        name: participant.name
      }
    });

    // Clean up empty sessions
    if (session.participants.size === 0) {
      this.activeSessions.delete(sessionId);
      this.whiteboards.delete(sessionId);
      this.metrics.activeSessions = Math.max(0, this.metrics.activeSessions - 1);
    }

    console.log(`👋 ${participant.name} left session ${sessionId}`);
  }

  /**
   * Create a new collaboration session
   * @param {string} hostId - Host user ID
   * @param {Object} settings - Session settings
   * @returns {Object} Session information
   */
  createSession(hostId, settings = {}) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = {
      id: sessionId,
      host: hostId,
      createdAt: new Date(),
      settings: {
        allowDrawing: settings.allowDrawing ?? true,
        allowChat: settings.allowChat ?? true,
        allowScreenShare: settings.allowScreenShare ?? true,
        maxParticipants: settings.maxParticipants ?? 10,
        isPrivate: settings.isPrivate ?? false,
        password: settings.password || null,
        title: settings.title || 'Live Coaching Session',
        description: settings.description || '',
        scheduledFor: settings.scheduledFor || null
      }
    };

    // Store session info (in production, this would be in database)
    this.sessionInfo = this.sessionInfo || new Map();
    this.sessionInfo.set(sessionId, session);

    return {
      sessionId,
      joinUrl: `/collaborate/${sessionId}`,
      settings: session.settings
    };
  }

  /**
   * Get session information
   * @param {string} sessionId - Session ID
   * @returns {Object} Session information
   */
  getSessionInfo(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      return {
        id: sessionId,
        active: true,
        participants: session.participants.size,
        host: session.host,
        createdAt: session.createdAt,
        settings: session.settings
      };
    }

    // Check stored session info
    const storedSession = this.sessionInfo?.get(sessionId);
    if (storedSession) {
      return {
        id: sessionId,
        active: false,
        participants: 0,
        host: storedSession.host,
        createdAt: storedSession.createdAt,
        settings: storedSession.settings
      };
    }

    return null;
  }

  /**
   * Get session recording
   * @param {string} recordingId - Recording ID
   * @returns {Object} Recording data
   */
  getRecording(recordingId) {
    return this.recordings.get(recordingId);
  }

  /**
   * Get collaboration service statistics
   */
  getStats() {
    return {
      activeSessions: this.metrics.activeSessions,
      totalParticipants: this.metrics.totalParticipants,
      messagesSent: this.metrics.messagesSent,
      whiteboardActions: this.metrics.whiteboardActions,
      totalRecordings: this.recordings.size,
      uptime: process.uptime(),
      lastUpdated: new Date()
    };
  }

  /**
   * Clean up inactive sessions and old recordings
   */
  cleanup(maxSessionAge = 24 * 60 * 60 * 1000, maxRecordingAge = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();

    // Clean up old inactive sessions
    for (const [sessionId, session] of this.activeSessions) {
      if (session.participants.size === 0 && (now - session.createdAt.getTime()) > maxSessionAge) {
        this.activeSessions.delete(sessionId);
        this.whiteboards.delete(sessionId);
        this.metrics.activeSessions = Math.max(0, this.metrics.activeSessions - 1);
      }
    }

    // Clean up old recordings
    for (const [recordingId, recording] of this.recordings) {
      if ((now - recording.stoppedAt.getTime()) > maxRecordingAge) {
        this.recordings.delete(recordingId);
      }
    }

    console.log('🧹 Collaboration service cleanup completed');
  }

  /**
   * Broadcast message to all participants in a session
   */
  broadcastToSession(sessionId, event, data) {
    this.io.to(sessionId).emit(event, data);
  }

  /**
   * Send message to specific participant
   */
  sendToParticipant(sessionId, userId, event, data) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (!participant) return;

    this.io.to(participant.socketId).emit(event, data);
  }
}

// Export singleton instance
const realTimeCollaborationService = new RealTimeCollaborationService();
module.exports = realTimeCollaborationService;