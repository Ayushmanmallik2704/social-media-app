import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/Authcontext";

// Auth
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

// App pages
import Postfeed from "./components/Feed/Postfeed";
import Createpost from "./components/Feed/Createpost";
import ProfilePage from "./components/Profile/ProfilePage";
import ChatWindow from "./components/Messaging/ChatWindow";

// Protect routes that require login
const ProtectedRoute = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return null; // or a loading spinner
  return token && user ? children : <Navigate to="/" replace />;
};

// If already logged in, keep users out of Login/Register
const RedirectIfAuthed = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return null; // or a loading spinner
  return token && user ? <Navigate to="/home" replace /> : children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <Register />
            </RedirectIfAuthed>
          }
        />

        {/* Protected */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Postfeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <Createpost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <ChatWindow />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
