const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const Post = require('../models/Post'); // Import the Post model to get user's posts
const { protect } = require('../middleware/auth'); // Import the protect middleware

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Private
router.get('/:username', protect, async (req, res) => {
    try {
        // Find user by username
        const user = await User.findOne({ username: req.params.username }).select('-password');

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch posts by this user
        const posts = await Post.find({ user: user._id })
                                .sort({ createdAt: -1 })
                                .populate('user', 'username profilePicture')
                                .populate({
                                    path: 'comments.user',
                                    select: 'username profilePicture'
                                });

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followers: user.followers.length, // Only return count for security/simplicity
                following: user.following.length, // Only return count
                isFollowing: user.followers.includes(req.user.id), // Check if current user is following this user
                createdAt: user.createdAt
            },
            posts
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update authenticated user's profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const { username, email, bio, profilePicture } = req.body;

    try {
        const user = await User.findById(req.user.id); // Get user from protected route

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for duplicate username or email if they are changed
        if (username && username !== user.username) {
            const usernameExists = await User.findOne({ username });
            if (usernameExists) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            user.username = username;
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            user.email = email;
        }

        user.bio = bio !== undefined ? bio : user.bio; // Allow empty string for bio
        user.profilePicture = profilePicture || user.profilePicture; // Update profile picture

        await user.save(); // Save the updated user

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                followers: user.followers,
                following: user.following,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

// @route   PUT /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.put('/:id/follow', protect, async (req, res) => {
    try {
        // User to follow
        const userToFollow = await User.findById(req.params.id);
        // Current authenticated user
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User to follow not found' });
        }

        if (userToFollow._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        // Check if already following
        if (currentUser.following.includes(userToFollow._id)) {
            return res.status(400).json({ message: 'You are already following this user' });
        }

        // Add to following list of current user
        currentUser.following.push(userToFollow._id);
        await currentUser.save();

        // Add to followers list of the user being followed
        userToFollow.followers.push(currentUser._id);
        await userToFollow.save();

        res.json({ message: `You are now following ${userToFollow.username}` });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid User ID' });
        }
        res.status(500).json({ message: 'Server error following user' });
    }
});

// @route   PUT /api/users/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.put('/:id/unfollow', protect, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToUnfollow) {
            return res.status(404).json({ message: 'User to unfollow not found' });
        }

        if (userToUnfollow._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({ message: 'You cannot unfollow yourself' });
        }

        // Check if not following
        if (!currentUser.following.includes(userToUnfollow._id)) {
            return res.status(400).json({ message: 'You are not following this user' });
        }

        // Remove from following list of current user
        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== userToUnfollow._id.toString()
        );
        await currentUser.save();

        // Remove from followers list of the user being unfollowed
        userToUnfollow.followers = userToUnfollow.followers.filter(
            (id) => id.toString() !== currentUser._id.toString()
        );
        await userToUnfollow.save();

        res.json({ message: `You have unfollowed ${userToUnfollow.username}` });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid User ID' });
        }
        res.status(500).json({ message: 'Server error unfollowing user' });
    }
});

module.exports = router;
