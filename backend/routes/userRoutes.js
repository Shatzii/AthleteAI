const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin, sanitizeInput } = require('../middleware/validation');

// Route for user registration
router.post('/register', sanitizeInput, validateUserRegistration, userController.registerUser);

// Route for user login
router.post('/login', sanitizeInput, validateUserLogin, userController.loginUser);

// Route for fetching user profile
router.get('/profile', authMiddleware.verifyToken, userController.getUserProfile);

// Route for user statistics (admin only)
router.get('/stats', authMiddleware.verifyToken, userController.getUserStats);

module.exports = router;