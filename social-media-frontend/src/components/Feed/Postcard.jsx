// src/components/Feed/Postcard.jsx
import React, { useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/Authcontext";

const PostCard = ({ post }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(
    post.likes?.includes(user?._id) || false
  );
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");

  // 👉 Like/Unlike a post
  const handleLike = async () => {
    try {
      const response = await api.put(
        `/posts/${post._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setLikes(response.data.likes);
      setIsLiked(!isLiked);
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // 👉 Add a comment
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await api.post(
        `/posts/${post._id}/comment`,
        { text: commentText },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setComments(response.data.post.comments);
      setCommentText("");
    } catch (err) {
      console.error("Error commenting:", err);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      {/* User Info */}
      <div className="flex items-center space-x-3 mb-3">
        <img
          src={post.user?.profilePicture}
          alt={post.user?.username}
          className="w-10 h-10 rounded-full"
        />
        <span className="font-semibold">{post.user?.username}</span>
      </div>

      {/* Text */}
      <p className="text-gray-800">{post.text}</p>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post"
          className="mt-3 rounded-md max-h-80 object-cover"
        />
      )}

      {/* Date */}
      <p className="text-sm text-gray-500 mt-2">
        {new Date(post.createdAt).toLocaleString()}
      </p>

      {/* Like + Comment Buttons */}
      <div className="flex items-center space-x-6 mt-3">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 ${
            isLiked ? "text-red-600" : "text-gray-600"
          }`}
        >
          <span>❤️</span>
          <span>{likes}</span>
        </button>
        <span>💬 {comments.length}</span>
      </div>

      {/* Comment List */}
      <div className="mt-3 space-y-2">
        {comments.slice(0, 3).map((c, i) => (
          <div key={i} className="flex items-center space-x-2 text-sm">
            <img
              src={c.user?.profilePicture}
              alt={c.user?.username}
              className="w-6 h-6 rounded-full"
            />
            <p>
              <span className="font-semibold">{c.user?.username}:</span>{" "}
              {c.text}
            </p>
          </div>
        ))}
        {comments.length > 3 && (
          <p className="text-gray-500 text-sm">
            View all {comments.length} comments...
          </p>
        )}
      </div>

      {/* Add Comment */}
      <form onSubmit={handleComment} className="mt-3 flex items-center">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 p-2 border rounded-md text-sm"
          placeholder="Write a comment..."
        />
        <button
          type="submit"
          className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md"
        >
          Post
        </button>
      </form>
    </div>
  );
};

export default PostCard;
