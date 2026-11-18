import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Use sessionStorage to isolate authentication sessions per browser tab.
  // This allows Student, Librarian, and Admin to be used simultaneously in separate tabs!
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('lms_user') || localStorage.getItem('lms_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('lms_token') || localStorage.getItem('lms_token') || null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected', 'disconnected', 'error'
  const [dbMessage, setDbMessage] = useState('');

  // Verify server health and database status
  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      setDbMessage(res.data?.message || '');
      if (res.data?.database === 'connected') {
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setDbStatus('disconnected');
        setDbMessage('MongoDB Atlas connection timed out. Please check your Atlas IP Whitelist (add 0.0.0.0/0).');
      } else {
        setDbStatus('error');
        setDbMessage(err.message || 'Cannot reach API server at http://localhost:5000');
      }
    }
  };

  // Re-validate token on application mount
  useEffect(() => {
    const initializeAuth = async () => {
      checkHealth();
      const storedToken = sessionStorage.getItem('lms_token') || localStorage.getItem('lms_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          sessionStorage.setItem('lms_user', JSON.stringify(res.data.user));
        } catch {
          // Token is expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    const handleLogoutEvent = () => logout();
    window.addEventListener('lms_auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('lms_auth_logout', handleLogoutEvent);
  }, []);

  const login = async (email, password, portalRole) => {
    const res = await api.post('/auth/login', { email, password, portalRole });
    const { token: receivedToken, user: receivedUser } = res.data;

    // Store in tab-isolated sessionStorage so tabs don't overwrite each other
    sessionStorage.setItem('lms_token', receivedToken);
    sessionStorage.setItem('lms_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const registerStudent = async (data) => {
    // Only register - do not set session immediately so student signs in manually
    const res = await api.post('/auth/register-student', data);
    return res.data;
  };

  const logout = () => {
    sessionStorage.removeItem('lms_token');
    sessionStorage.removeItem('lms_user');
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('lms_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        dbStatus,
        dbMessage,
        login,
        registerStudent,
        logout,
        updateUserProfile,
        checkHealth,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
