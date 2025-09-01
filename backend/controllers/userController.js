const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create a new user
exports.createUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, email, password: hashedPassword });
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
};

// Register a new user
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// User login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user for authentication (includes password)
        const user = await User.findForAuth(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to too many failed login attempts'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Increment login attempts
            await user.incLoginAttempts();
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
};

// Get user statistics for admin dashboard
exports.getUserStats = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
        const newUsersThisMonth = await User.countDocuments({ 
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
        });

        res.json({
            totalUsers,
            activeUsers,
            newUsersThisMonth
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user stats', error: error.message });
    }
};