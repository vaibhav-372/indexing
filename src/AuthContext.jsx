import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on initial load
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    
    if (loggedIn && username) {
      setIsAuthenticated(true);
      setUser({ username });
    }
    setLoading(false);
  }, []);

  const login = (username) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
    setUser({ username });
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}