import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { useAuth } from '../../context/Authcontext';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL.replace('/api', ''));

const ChatWindow = ({ conversation, onCloseChat }) => {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newMessageText, setNewMessageText] = useState('');
    const messagesEndRef = useRef(null);

    const receiver = conversation.participants.find(p => p._id !== currentUser.id);
    const chatTitle = conversation.isGroup ? conversation.groupName : receiver?.username || 'Unknown Chat';

    const fetchMessages = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/messages/conversations/${conversation._id}`);
            setMessages(response.data.messages);
            socket.emit('joinConversation', conversation._id);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch messages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();

        socket.on('newMessage', (message) => {
            if (message.conversationId === conversation._id) {
                setMessages((prevMessages) => [...prevMessages, message]);
            }
        });

        return () => {
            socket.off('newMessage');
            socket.emit('leaveConversation', conversation._id);
        };
    }, [conversation._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        setError('');
        if (!newMessageText.trim()) return;

        try {
            const response = await api.post('/messages', {
                conversationId: conversation._id,
                text: newMessageText,
            });

            setMessages((prevMessages) => [...prevMessages, response.data.message]);
            setNewMessageText('');

            socket.emit('sendMessage', {
                conversationId: conversation._id,
                sender: {
                    _id: currentUser.id,
                    username: currentUser.username,
                    profilePicture: currentUser.profilePicture
                },
                text: newMessageText,
                createdAt: new Date().toISOString()
            });

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message.');
            console.error(err);
        }
    };

    if (loading) return <div className="flex-grow p-4 text-center text-gray-600">Loading chat...</div>;
    if (error) return <div className="flex-grow p-4 text-center text-red-600">{error}</div>;

    return (
        <div className="flex-grow flex flex-col bg-gray-50 border border-gray-200 rounded-lg shadow-inner m-4 font-inter">
            <div className="flex items-center p-4 bg-white border-b border-gray-200 rounded-t-lg shadow-sm">
                <button onClick={onCloseChat} className="mr-3 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <img
                    src={conversation.isGroup ? 'https://placehold.co/50x50/cccccc/000000?text=Group' : receiver?.profilePicture || 'https://placehold.co/50x50/cccccc/000000?text=User'}
                    alt="Chat avatar"
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-800">{chatTitle}</h3>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-500">No messages yet. Say hello!</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.sender._id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`flex items-start max-w-[70%] p-3 rounded-lg shadow-sm ${
                                    msg.sender._id === currentUser.id
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                                }`}
                            >
                                {msg.sender._id !== currentUser.id && (
                                    <img
                                        src={msg.sender.profilePicture || 'https://placehold.co/30x30/cccccc/000000?text=P'}
                                        alt="Sender"
                                        className="w-7 h-7 rounded-full mr-2 object-cover flex-shrink-0"
                                    />
                                )}
                                <div>
                                    <p className="text-xs font-semibold mb-1">
                                        {msg.sender._id === currentUser.id ? 'You' : msg.sender.username}
                                    </p>
                                    <p className="text-base break-words">{msg.text}</p>
                                    <p className="text-right text-xs mt-1 opacity-80">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {msg.sender._id === currentUser.id && (
                                    <img
                                        src={currentUser.profilePicture || 'https://placehold.co/30x30/cccccc/000000?text=P'}
                                        alt="You"
                                        className="w-7 h-7 rounded-full ml-2 object-cover flex-shrink-0"
                                    />
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex space-x-3 rounded-b-lg">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 transition duration-200"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white p-3 rounded-full font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;