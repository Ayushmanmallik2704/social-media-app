import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/Authcontext';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL.replace('/api', ''));

const ConversationList = ({ onSelectConversation }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchConversations = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/messages/conversations');
            setConversations(response.data.conversations);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch conversations.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();

        if (user) {
            socket.emit('joinUser', user.id);

            socket.on('newMessage', (newMessage) => {
                setConversations(prevConvos => {
                    const updatedConvos = prevConvos.map(conv => {
                        if (conv._id === newMessage.conversationId) {
                            return { ...conv, lastMessage: newMessage, updatedAt: new Date() };
                        }
                        return conv;
                    });
                    const exists = updatedConvos.some(conv => conv._id === newMessage.conversationId);
                    if (!exists) {
                        fetchConversations();
                        return prevConvos;
                    }
                    return updatedConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });
            });
        }

        return () => {
            if (user) {
                socket.off('newMessage');
            }
        };
    }, [user]);


    if (loading) return <div className="p-4 text-center text-gray-600">Loading conversations...</div>;
    if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

    return (
        <div className="w-full md:w-1/3 bg-white border-r border-gray-200 font-inter">
            <h2 className="text-2xl font-bold p-4 border-b border-gray-200 text-gray-800">Chats</h2>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                {conversations.length === 0 ? (
                    <p className="p-4 text-gray-500">No conversations yet. Start a new chat!</p>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv._id}
                            onClick={() => onSelectConversation(conv)}
                            className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition duration-150"
                        >
                                                        <img
                                                                src={conv.isGroup
                                                                    ? 'https://placehold.co/50x50/cccccc/000000?text=Group'
                                                                    : conv.participants.find(p => p._id !== user.id)?.profilePicture || 'https://placehold.co/50x50/cccccc/000000?text=User'}
                                                                alt="Profile"
                                                                className="w-12 h-12 rounded-full mr-4 object-cover"
                                                        />
                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-900">
                                    {conv.isGroup ? conv.groupName : conv.participants.find(p => p._id !== user.id)?.username || 'Unknown User'}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                    {conv.lastMessage ? `${conv.lastMessage.sender === user.id ? 'You: ' : ''}${conv.lastMessage.text}` : 'No messages yet.'}
                                </p>
                            </div>
                            {conv.lastMessage && (
                                <span className="text-xs text-gray-500 ml-2">
                                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConversationList;
