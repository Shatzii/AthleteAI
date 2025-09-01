const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

// User management routes (non-auth)
router.get('/', authMiddleware.verifyToken, userController.getAllUsers);
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);
router.put('/:id', authMiddleware.verifyToken, sanitizeInput, userController.updateUser);
router.delete('/:id', authMiddleware.verifyToken, userController.deleteUser);

// User statistics (admin only)
router.get('/admin/stats', authMiddleware.verifyToken, userController.getUserStats);

// User preferences
router.get('/:id/preferences', authMiddleware.verifyToken, userController.getUserPreferences);
router.put('/:id/preferences', authMiddleware.verifyToken, sanitizeInput, userController.updateUserPreferences);

module.exports = router;