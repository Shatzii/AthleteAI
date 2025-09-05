const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: function() {
            // Password is required only if no OAuth provider is set
            return !this.googleId && !this.githubId && !this.facebookId;
        },
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    // OAuth provider fields
    googleId: {
        type: String,
        sparse: true
    },
    githubId: {
        type: String,
        sparse: true
    },
    facebookId: {
        type: String,
        sparse: true
    },
    oauthProvider: {
        type: String,
        enum: ['local', 'google', 'github', 'facebook'],
        default: 'local'
    },
    profilePicture: {
        type: String
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: 'Role must be either user or admin'
        },
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Virtual for account lock
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new) and it's a local user
    if (!this.isModified('password') || this.oauthProvider !== 'local') return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!candidatePassword || !this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
        };
    }

    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { lastLogin: new Date() }
    });
};

// Static method to find user for authentication
userSchema.statics.findForAuth = function(email) {
    return this.findOne({ email, isActive: true }).select('+password');
};

// Static method to find or create OAuth user
userSchema.statics.findOrCreateOAuthUser = async function(provider, profile) {
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value;
    const displayName = profile.displayName;
    const firstName = profile.name?.givenName;
    const lastName = profile.name?.familyName;
    const profilePicture = profile.photos?.[0]?.value;

    if (!email) {
        throw new Error('Email is required for OAuth registration');
    }

    // Try to find existing user by provider ID
    let user = await this.findOne({ [`${provider}Id`]: providerId });

    if (user) {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        return user;
    }

    // Try to find existing user by email
    user = await this.findOne({ email });

    if (user) {
        // Link OAuth provider to existing user
        user[`${provider}Id`] = providerId;
        user.oauthProvider = provider;
        if (profilePicture && !user.profilePicture) {
            user.profilePicture = profilePicture;
        }
        if (firstName && !user.firstName) {
            user.firstName = firstName;
        }
        if (lastName && !user.lastName) {
            user.lastName = lastName;
        }
        user.lastLogin = new Date();
        await user.save();
        return user;
    }

    // Create new OAuth user
    const username = await this.generateUniqueUsername(displayName || email.split('@')[0]);

    user = new this({
        username,
        email,
        [`${provider}Id`]: providerId,
        oauthProvider: provider,
        profilePicture,
        firstName,
        lastName,
        lastLogin: new Date()
    });

    await user.save();
    return user;
};

// Static method to generate unique username
userSchema.statics.generateUniqueUsername = async function(baseUsername) {
    let username = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (username.length < 3) username = username + 'user';
    if (username.length > 30) username = username.substring(0, 30);

    let counter = 0;
    let uniqueUsername = username;

    while (await this.findOne({ username: uniqueUsername })) {
        counter++;
        uniqueUsername = username + counter;
        if (uniqueUsername.length > 30) {
            uniqueUsername = username.substring(0, 27) + counter;
        }
    }

    return uniqueUsername;
};

const User = mongoose.model('User', userSchema);

module.exports = User;