const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation'); // Import Conversation model
const Message = require('../models/Message'); // Import Message model
const User = require('../models/User'); // Import User model for population
const { protect } = require('../middleware/auth'); // Import protect middleware

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the authenticated user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
    try {
        // Find conversations where the current user is a participant
        const conversations = await Conversation.find({ participants: req.user.id })
            .populate('participants', 'username profilePicture') // Populate participants' details
            .populate('lastMessage') // Populate the last message for a quick preview
            .sort({ updatedAt: -1 }); // Sort by most recent activity

        res.json({ conversations });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching conversations' });
    }
});

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get messages within a specific conversation
// @access  Private
router.get('/conversations/:conversationId', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);

        // Check if conversation exists
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Check if the current user is a participant in this conversation
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }

        // Fetch all messages for this conversation, sorted by creation date
        const messages = await Message.find({ conversation: req.params.conversationId })
            .populate('sender', 'username profilePicture') // Populate sender's details
            .sort({ createdAt: 1 }); // Sort oldest first

        res.json({ messages });

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Conversation ID' });
        }
        res.status(500).json({ message: 'Server error fetching messages' });
    }
});

// @route   POST /api/messages
// @desc    Send a new message (either start new conversation or add to existing)
// @access  Private
router.post('/', protect, async (req, res) => {
    const { recipientId, text, conversationId, groupName, participantIds } = req.body; // recipientId for DM, conversationId for existing, participantIds for new group

    if (!text) {
        return res.status(400).json({ message: 'Message text cannot be empty.' });
    }

    try {
        let conversation;

        // Existing conversation
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ message: 'Conversation not found.' });
            }
            // Ensure current user is a participant
            if (!conversation.participants.includes(req.user.id)) {
                return res.status(403).json({ message: 'Not authorized to send message to this conversation.' });
            }
        } else if (recipientId) {
            // New direct message conversation
            const recipientUser = await User.findById(recipientId);
            if (!recipientUser) {
                return res.status(404).json({ message: 'Recipient user not found.' });
            }

            // Check if a conversation already exists between these two users
            conversation = await Conversation.findOne({
                isGroup: false,
                participants: { $all: [req.user.id, recipientId], $size: 2 }
            });

            if (!conversation) {
                conversation = new Conversation({
                    participants: [req.user.id, recipientId],
                    isGroup: false
                });
                await conversation.save();
            }
        } else if (participantIds && groupName) {
            // New group message conversation
            const allParticipants = [...new Set([req.user.id, ...participantIds])]; // Ensure current user is included and unique
            if (allParticipants.length < 2) {
                return res.status(400).json({ message: 'Group conversation needs at least two participants.' });
            }
            // Check if all provided participant IDs are valid users
            const validUsers = await User.find({ _id: { $in: allParticipants } });
            if (validUsers.length !== allParticipants.length) {
                return res.status(400).json({ message: 'One or more participant IDs are invalid.' });
            }

            conversation = new Conversation({
                participants: allParticipants,
                isGroup: true,
                groupName
            });
            await conversation.save();
        } else {
            return res.status(400).json({ message: 'Invalid message parameters. Provide recipientId, conversationId, or participantIds/groupName.' });
        }

        // Create the new message
        const newMessage = new Message({
            conversation: conversation._id,
            sender: req.user.id,
            text
        });

        const message = await newMessage.save();

        // Update the lastMessage field in the conversation
        conversation.lastMessage = message._id;
        await conversation.save(); // This will also update the `updatedAt` timestamp

        // Populate sender details for the response
        await message.populate('sender', 'username profilePicture');

        res.status(201).json({
            message: 'Message sent successfully',
            message: message,
            conversationId: conversation._id
        });

        // TODO: Emit message via Socket.IO for real-time update

    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid ID provided.' });
        }
        res.status(500).json({ message: 'Server error sending message' });
    }
});

module.exports = router;
