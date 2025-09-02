import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        console.log('AuthContext: Attempting to load user...');
        if (token) {
            console.log('AuthContext: Token found in localStorage. Token:', token);
            try {
                const response = await api.get('/auth/me');
                console.log('AuthContext: User data fetched successfully:', response.data.user);
                setUser(response.data.user);
            } catch (error) {
                console.error('AuthContext: Failed to load user with token. Error:', error.response?.data || error.message);
                // If token is invalid or expired, clear it
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
                console.log('AuthContext: Token cleared and user state reset due to error.');
            }
        } else {
            console.log('AuthContext: No token found in localStorage. User is not authenticated.');
        }
        setLoading(false);
        console.log('AuthContext: Loading state set to false.');
    };

    useEffect(() => {
        console.log('AuthContext: useEffect triggered (token changed or initial load).');
        loadUser();
    }, [token]);

    const login = async (email, password) => {
        setLoading(true);
        console.log('AuthContext: Attempting login for email:', email);
        try {
            const response = await api.post('/auth/login', { email, password });
            console.log('AuthContext: Login successful, received token:', response.data.token);
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
            await loadUser(); // Ensure user details are loaded immediately
            console.log('AuthContext: Login process completed, user should be set.');
            return response.data;
        } catch (error) {
            console.error('AuthContext: Login error:', error.response?.data || error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        console.log('AuthContext: Attempting registration for username:', userData.username);
        try {
            const response = await api.post('/auth/register', userData);
            console.log('AuthContext: Registration successful, received token:', response.data.token);
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
            await loadUser(); // Ensure user details are loaded immediately
            console.log('AuthContext: Registration process completed, user should be set.');
            return response.data;
        } catch (error) {
            console.error('AuthContext: Registration error:', error.response?.data || error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        console.log('AuthContext: User logging out.');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const authContextValue = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        loadUser
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
