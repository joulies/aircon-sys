import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getStoredUser, verifyToken, logout as apiLogout } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize authentication state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = getToken();
      
      // If no token exists, user is not logged in
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verify the token with backend
      try {
        await verifyToken(token);
        // Token is valid, get the stored user
        const storedUser = getStoredUser();
        setUser(storedUser);
        setIsAuthenticated(true);
      } catch (error) {
        // Token is invalid or expired, clear localStorage
        console.log('Token verification failed, clearing authentication');
        apiLogout();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error during auth initialization:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
