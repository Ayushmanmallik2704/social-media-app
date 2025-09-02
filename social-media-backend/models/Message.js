// models/Message.js
const mongoose = require('mongoose');

// Define the Message Schema
const MessageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the conversation this message belongs to
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId, // User who sent the message
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Message text cannot be empty'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);
