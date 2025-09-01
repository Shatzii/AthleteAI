import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, fetchUserProfile } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await fetchUserProfile(storedToken);
          setUser(userData.user);
          setToken(storedToken);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      if (response.success) {
        const { token: newToken, user: userData } = response;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      if (response.success) {
        const { token: newToken, user: newUser } = response;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
