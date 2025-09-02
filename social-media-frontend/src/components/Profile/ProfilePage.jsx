import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/Authcontext';
import PostCard from '../Feed/Postcard';

const ProfilePage = () => {
    const { username } = useParams();
    const { user: currentUser, loadUser: reloadCurrentUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editProfilePicture, setEditProfilePicture] = useState('');
    const [message, setMessage] = useState('');

    const isOwner = currentUser?.username === username;

    const fetchProfileData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/users/${username}`);
            setProfileUser(response.data.user);
            setUserPosts(response.data.posts);
            setEditBio(response.data.user.bio);
            setEditProfilePicture(response.data.user.profilePicture);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch profile.');
            setProfileUser(null);
            setUserPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [username, currentUser?.following]);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            setError('Please log in to follow users.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (profileUser.isFollowing) {
                await api.put(`/users/${profileUser.id}/unfollow`);
                setMessage(`Unfollowed ${profileUser.username}.`);
            } else {
                await api.put(`/users/${profileUser.id}/follow`);
                setMessage(`Now following ${profileUser.username}.`);
            }
            await fetchProfileData();
            await reloadCurrentUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update follow status.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await api.put('/users/profile', { bio: editBio, profilePicture: editProfilePicture });
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            await fetchProfileData();
            await reloadCurrentUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handlePostUpdated = (updatedPost) => {
        setUserPosts((prevPosts) =>
            prevPosts.map((p) => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    const handlePostDeleted = (deletedPostId) => {
        setUserPosts((prevPosts) => prevPosts.filter((p) => p._id !== deletedPostId));
    };


    if (loading) return <div className="text-center p-8 font-inter">Loading profile...</div>;
    if (error && !profileUser) return <div className="text-center p-8 text-red-600 font-inter">{error}</div>;
    if (!profileUser) return <div className="text-center p-8 text-gray-600 font-inter">Profile not found.</div>;

    return (
        <div className="container mx-auto p-4 font-inter max-w-2xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">{error}</div>}
            {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm">{message}</div>}

            <div className="bg-white p-8 rounded-lg shadow-md mb-6 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
                <img
                    src={profileUser.profilePicture || 'https://placehold.co/150x150/cccccc/000000?text=Profile'}
                    alt={`${profileUser.username}'s profile`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-sm"
                />
                <div className="text-center md:text-left flex-grow">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">{profileUser.username}</h2>
                    <p className="text-gray-700 text-lg mb-3">{profileUser.bio || 'No bio yet.'}</p>
                    <div className="flex justify-center md:justify-start space-x-6 text-gray-600 mb-4">
                        <span className="font-medium">{profileUser.followers} Followers</span>
                        <span className="font-medium">{profileUser.following} Following</span>
                    </div>

                    {!isOwner && currentUser && (
                        <button
                            onClick={handleFollowToggle}
                            className={`px-6 py-2 rounded-full font-semibold transition duration-300 ease-in-out
                                ${profileUser.isFollowing
                                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            disabled={loading}
                        >
                            {loading ? '...' : (profileUser.isFollowing ? 'Unfollow' : 'Follow')}
                        </button>
                    )}

                    {isOwner && (
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="px-6 py-2 rounded-full font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition duration-300 ease-in-out"
                        >
                            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                        </button>
                    )}
                </div>
            </div>

            {isOwner && isEditing && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6 font-inter">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Edit Your Profile</h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label htmlFor="editBio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea
                                id="editBio"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-y"
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                rows="3"
                                maxLength="200"
                            ></textarea>
                            <p className="text-right text-xs text-gray-500">{editBio.length}/200</p>
                        </div>
                        <div>
                            <label htmlFor="editProfilePicture" className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                            <input
                                id="editProfilePicture"
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                value={editProfilePicture}
                                onChange={(e) => setEditProfilePicture(e.target.value)}
                                placeholder="Enter image URL"
                            />
                            {editProfilePicture && (
                                <div className="mt-2 flex justify-center">
                                    <img src={editProfilePicture} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border" onError={(e) => e.target.src='https://placehold.co/100x100/cccccc/000000?text=Error'} />
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            className={`w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            )}

            <h3 className="text-2xl font-bold text-gray-800 mb-5 mt-8 border-b pb-2">Posts by {profileUser.username}</h3>
            <div className="space-y-6">
                {userPosts.length > 0 ? (
                    userPosts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            onPostUpdated={handlePostUpdated}
                            onPostDeleted={handlePostDeleted}
                        />
                    ))
                ) : (
                    <p className="text-center text-gray-500 text-lg">No posts from {profileUser.username} yet.</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
