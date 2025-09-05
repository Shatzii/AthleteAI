const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const token = generateToken(req.user);
            // Redirect to frontend with token
            const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${redirectUrl}/auth/callback?token=${token}&provider=google`);
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
        }
    }
);

// GitHub OAuth routes
router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const token = generateToken(req.user);
            const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${redirectUrl}/auth/callback?token=${token}&provider=github`);
        } catch (error) {
            console.error('GitHub OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
        }
    }
);

// Facebook OAuth routes
router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const token = generateToken(req.user);
            const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${redirectUrl}/auth/callback?token=${token}&provider=facebook`);
        } catch (error) {
            console.error('Facebook OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
        }
    }
);

// Get current user info
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture,
                role: user.role,
                oauthProvider: user.oauthProvider,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
