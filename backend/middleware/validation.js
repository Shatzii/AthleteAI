const { body, validationResult } = require('express-validator');

// Enhanced input sanitization
const sanitizeInput = (req, res, next) => {
    // Recursively sanitize object properties
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potentially dangerous HTML/script content
                obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                obj[key] = obj[key].replace(/<[^>]*>/g, ''); // Remove HTML tags
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    handleValidationErrors
];

// User login validation
const validateUserLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// NCAA eligibility calculation validation
const validateNCAACalculation = [
    body('division')
        .isIn(['division1', 'division2', 'division3'])
        .withMessage('Invalid division'),

    body('gpa')
        .optional()
        .isFloat({ min: 0, max: 4.0 })
        .withMessage('GPA must be between 0 and 4.0'),

    body('testScore')
        .optional()
        .isInt({ min: 400, max: 1600 })
        .withMessage('SAT score must be between 400 and 1600'),

    body('gradeLevel')
        .optional()
        .isIn(['freshman', 'sophomore', 'junior', 'senior'])
        .withMessage('Invalid grade level'),

    handleValidationErrors
];

// Article creation validation
const validateArticleCreation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),

    body('content')
        .trim()
        .isLength({ min: 50 })
        .withMessage('Content must be at least 50 characters'),

    body('category')
        .optional()
        .isIn(['football', 'basketball', 'baseball', 'soccer', 'tennis', 'other'])
        .withMessage('Invalid category'),

    handleValidationErrors
];

// Performance data validation
const validatePerformanceData = [
    body('metrics')
        .isObject()
        .withMessage('Metrics must be an object'),

    body('workout')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Workout description must be less than 500 characters'),

    handleValidationErrors
];

// AI Coach question validation
const validateAICoachQuestion = [
    body('question')
        .trim()
        .isLength({ min: 3, max: 500 })
        .withMessage('Question must be between 3 and 500 characters')
        .matches(/^[a-zA-Z0-9\s\?\.\!\,\-\'\"]+$/)
        .withMessage('Question contains invalid characters'),

    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateNCAACalculation,
    validateArticleCreation,
    validatePerformanceData,
    validateAICoachQuestion,
    sanitizeInput,
    handleValidationErrors
};
