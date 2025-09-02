// routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Import the Post model
const User = require('../models/User'); // Import the User model (for population)
const { protect } = require('../middleware/auth'); // Import the protect middleware

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, async (req, res) => {
    const { text, imageUrl } = req.body; // Extract text and optional imageUrl from request body

    // Basic validation
    if (!text && !imageUrl) {
        return res.status(400).json({ message: 'A post must have either text or an image.' });
    }

    try {
        // Create a new post instance
        const newPost = new Post({
            user: req.user.id, // User ID is attached by the protect middleware
            text,
            imageUrl
        });

        // Save the post to the database
        const post = await newPost.save();

        // Populate the user field to return user details with the post
        await post.populate('user', 'username profilePicture');

        res.status(201).json({
            message: 'Post created successfully',
            post
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during post creation' });
    }
});

// @route   GET /api/posts
// @desc    Get all posts (for the feed)
// @access  Private (or Public if you want everyone to see posts)
router.get('/', protect, async (req, res) => {
    try {
        // Find all posts, sort by creation date (newest first), and populate user and comment user fields
        const posts = await Post.find()
            .sort({ createdAt: -1 }) // Sort by newest first
            .populate('user', 'username profilePicture') // Populate user details (username, profilePicture)
            .populate({
                path: 'comments.user', // Populate user for each comment
                select: 'username profilePicture'
            });

        res.json({ posts });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching posts' });
    }
});

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        // Find post by ID and populate user and comment user fields
        const post = await Post.findById(req.params.id)
            .populate('user', 'username profilePicture')
            .populate({
                path: 'comments.user',
                select: 'username profilePicture'
            });

        // Check if post exists
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({ post });

    } catch (error) {
        console.error(error);
        // Handle CastError for invalid ObjectId format
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Post ID' });
        }
        res.status(500).json({ message: 'Server error fetching post' });
    }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (only post owner)
router.put('/:id', protect, async (req, res) => {
    const { text, imageUrl } = req.body;

    try {
        let post = await Post.findById(req.params.id);

        // Check if post exists
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the authenticated user is the owner of the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to update this post' });
        }

        // Update post fields
        post.text = text || post.text; // Update text if provided, otherwise keep existing
        post.imageUrl = imageUrl !== undefined ? imageUrl : post.imageUrl; // Allow setting imageUrl to null

        await post.save(); // Save the updated post

        // Populate user for the updated post response
        await post.populate('user', 'username profilePicture');

        res.json({
            message: 'Post updated successfully',
            post
        });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Post ID' });
        }
        res.status(500).json({ message: 'Server error updating post' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (only post owner)
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if post exists
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the authenticated user is the owner of the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to delete this post' });
        }

        // Delete the post
        await Post.deleteOne({ _id: req.params.id });

        res.json({ message: 'Post removed successfully' });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Post ID' });
        }
        res.status(500).json({ message: 'Server error deleting post' });
    }
});

// @route   PUT /api/posts/:id/like
// @desc    Like or unlike a post
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the user has already liked the post
        const isLiked = post.likes.includes(req.user.id);

        if (isLiked) {
            // If already liked, unlike it (remove user from likes array)
            post.likes = post.likes.filter(
                (likeId) => likeId.toString() !== req.user.id
            );
        } else {
            // If not liked, like it (add user to likes array)
            post.likes.push(req.user.id);
        }

        await post.save(); // Save the updated post

        res.json({
            message: isLiked ? 'Post unliked' : 'Post liked',
            likes: post.likes.length, // Return the new like count
            post // Return the updated post object
        });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Post ID' });
        }
        res.status(500).json({ message: 'Server error liking/unliking post' });
    }
});

// @route   POST /api/posts/:id/comment
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
    const { text } = req.body;

    // Validate comment text
    if (!text) {
        return res.status(400).json({ message: 'Comment text cannot be empty.' });
    }

    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Create a new comment object
        const newComment = {
            user: req.user.id, // User ID from protect middleware
            text
        };

        // Add the new comment to the post's comments array
        post.comments.unshift(newComment); // Add to the beginning of the array

        await post.save(); // Save the updated post

        // To return the full user object for the new comment, we need to populate
        // the last added comment's user field.
        // A simpler approach for just the newly added comment:
        const addedComment = post.comments[0]; // Get the newly added comment
        await addedComment.populate('user', 'username profilePicture');

        res.status(201).json({
            message: 'Comment added successfully',
            post // Return the full post with all comments
        });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Post ID' });
        }
        res.status(500).json({ message: 'Server error adding comment' });
    }
});


module.exports = router;
