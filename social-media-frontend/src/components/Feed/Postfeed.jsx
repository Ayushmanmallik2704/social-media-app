// src/components/Feed/Postfeed.jsx
import React, { useEffect, useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/Authcontext";
import CreatePost from "./Createpost";
import PostCard from "./Postcard";

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPosts(response.data.posts);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Home Feed</h1>

      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Posts */}
      {loading ? (
        <p>Loading posts...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : posts.length === 0 ? (
        <p>No posts yet. Be the first to create one!</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostFeed;
