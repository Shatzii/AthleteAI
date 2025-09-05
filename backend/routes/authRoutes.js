const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin, sanitizeInput } = require('../middleware/validation');

// Debug: Log that auth routes are being loaded
console.log('� Loading auth routes...');

// Authentication routes
router.post('/register', sanitizeInput, validateUserRegistration, userController.registerUser);
router.post('/login', sanitizeInput, validateUserLogin, userController.loginUser);
router.get('/profile', authMiddleware.verifyToken, userController.getUserProfile);
router.post('/logout', authMiddleware.verifyToken, userController.logoutUser);

// Password management
router.post('/forgot-password', sanitizeInput, userController.forgotPassword);
router.post('/reset-password', sanitizeInput, userController.resetPassword);
router.post('/change-password', authMiddleware.verifyToken, sanitizeInput, userController.changePassword);

// Token refresh
router.post('/refresh-token', userController.refreshToken);

// Debug: Log that auth routes are loaded
console.log('✅ Auth routes loaded successfully');

module.exports = router;
