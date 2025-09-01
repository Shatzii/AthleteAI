const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.user) return res.sendStatus(403); // Forbidden
    next();
};

module.exports = {
    verifyToken: authenticateToken,
    authenticateToken,
    isAuthenticated,
};