// require('newrelic');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const footballRoutes = require('./routes/footballRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const ncaaRoutes = require('./routes/ncaaRoutes');
const playerRoutes = require('./routes/playerRoutes');
const articleRoutes = require('./routes/articleRoutes');
const pageRoutes = require('./routes/pageRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const starpathRoutes = require('./routes/starpathRoutes');
const recruitingRoutes = require('./routes/recruitingRoutes');
const authMiddleware = require('./middleware/auth');
const { securityHeaders, apiLimiter, authLimiter, corsOptions } = require('./middleware/security');
const backendMonitor = require('./utils/monitoring');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(securityHeaders); // Security headers first
app.use(cors(corsOptions)); // CORS with security options
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/go4it';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', authLimiter, userRoutes); // Stricter rate limiting for auth routes
app.use('/api/football', footballRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/ncaa', ncaaRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/starpath', starpathRoutes);
app.use('/api/recruiting', recruitingRoutes);

// Monitoring middleware
app.use(backendMonitor.requestLogger.bind(backendMonitor));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json(backendMonitor.getHealthStatus());
});

// Metrics endpoint (protected)
app.get('/metrics', authMiddleware.authenticateToken, (req, res) => {
    res.json(backendMonitor.getMetrics());
});

// Error handling middleware
app.use(backendMonitor.errorLogger.bind(backendMonitor));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});