
const express = require('express');
const router = express.Router(); // Create an Express router
const bcrypt = require('bcryptjs'); // For comparing passwords
const jwt = require('jsonwebtoken'); // For generating JWTs
const User = require('../models/User'); // Import the User model
const { protect } = require('../middleware/auth'); // Import the protect middleware


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};


router.post('/register', async (req, res) => {
    const { username, email, password, bio, profilePicture } = req.body;

    try {
        // Check if a user with the provided email or username already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User with that email or username already exists' });
        }

        // Create a new user instance
        user = new User({
            username,
            email,
            password, // Password will be hashed by the pre-save hook in the User model
            bio,
            profilePicture
        });

        // Save the user to the database
        await user.save();

        // Generate a JWT token for the new user
        const token = generateToken(user._id);

        // Respond with success message and user data (excluding password)
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followers: user.followers,
                following: user.following,
                createdAt: user.createdAt
            },
            token
        });

    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Server error during registration' }); // Respond with a server error
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email, and explicitly include the password for comparison
        const user = await User.findOne({ email }).select('+password');

        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the provided password matches the hashed password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token for the authenticated user
        const token = generateToken(user._id);

        // Respond with success message and user data (excluding password)
        res.json({
            message: 'Logged in successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followers: user.followers,
                following: user.following,
                createdAt: user.createdAt
            },
            token
        });

    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: 'Server error during login' }); // Respond with a server error
    }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user's profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        // req.user is populated by the protect middleware
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                bio: req.user.bio,
                profilePicture: req.user.profilePicture,
                followers: req.user.followers,
                following: req.user.following,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error(error); // Log the error
        res.status(500).json({ message: 'Server error fetching user profile' }); // Respond with error
    }
});


module.exports = router; // Export the router
