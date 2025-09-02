// models/Conversation.js
const mongoose = require('mongoose');

// Define the Conversation Schema
const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId, // Array of User IDs participating in the conversation
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the last message in this conversation
        ref: 'Message',
        default: null
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        trim: true,
        default: null // Only applicable for group chats
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now // For easy sorting by most recent activity
    }
});

// Update `updatedAt` field on save
ConversationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);
