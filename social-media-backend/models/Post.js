// models/Post.js
const mongoose = require('mongoose');

// Define the Comment Schema (sub-document)
const CommentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // User who made the comment
        ref: 'User', // Reference the User model
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: [280, 'Comment cannot be more than 280 characters'] // Twitter-like limit
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false // Do not create a separate _id for sub-documents by default, though Mongoose does this for arrays of sub-documents
});

// Define the Post Schema
const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // User who created the post
        ref: 'User', // Reference the User model
        required: true
    },
    text: {
        type: String,
        required: [true, 'Post text cannot be empty'], // Post text is required
        trim: true,
        maxlength: [500, 'Post text cannot be more than 500 characters'] // Example max length
    },
    imageUrl: {
        type: String, // URL to the generated image
        default: null // Can be null if the post is text-only
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId, // Array of Object IDs of users who liked the post
        ref: 'User' // Reference the User model
    }],
    comments: [CommentSchema], // Array of Comment sub-documents
    createdAt: {
        type: Date,
        default: Date.now // Automatically set creation date
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Export the Post model
module.exports = mongoose.model('Post', PostSchema);
