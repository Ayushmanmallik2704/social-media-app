import React, { useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/Authcontext";

const CreatePost = ({ onPostCreated }) => {
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!postText && !imageUrl) {
      setError("Please enter text or an image URL to create a post.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/posts",
        { text: postText, imageUrl },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ send token
          },
        }
      );

      setMessage(response.data.message);
      setPostText("");
      setImageUrl("");

      if (onPostCreated) {
        onPostCreated(response.data.post); // notify feed
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6 w-full max-w-xl mx-auto font-inter">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Post</h3>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {message}
        </div>
      )}
      <form onSubmit={handleCreatePost} className="space-y-4">
        <div>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-y"
            placeholder="What's on your mind?"
            rows="3"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          ></textarea>
        </div>
        <div>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        {imageUrl && (
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="Post preview"
              className="max-w-full h-auto rounded-md shadow-sm"
              onError={(e) =>
                (e.target.src =
                  "https://placehold.co/300x200/cccccc/000000?text=Image+Load+Error")
              }
            />
          </div>
        )}
        <button
          type="submit"
          className={`w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Posting..." : "Create Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
