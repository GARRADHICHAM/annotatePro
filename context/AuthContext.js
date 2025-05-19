// frontend/context/AuthContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import Router from 'next/router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if there's a token in local storage
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
      // Only redirect if on a protected page
      if (Router.pathname !== '/login' && Router.pathname !== '/register') {
        Router.push('/login');
      }
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Cache user data in localStorage for quicker access
        localStorage.setItem('userData', JSON.stringify(userData));
        setError(null);
      } else {
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setError('Session expired. Please log in again.');
        if (Router.pathname !== '/login' && Router.pathname !== '/register') {
          Router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        await fetchUserData(data.access_token);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail);
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, fullName) => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.detail);
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    setError(null);
    Router.push('/login');
  };

  // Method to refresh user data when needed
  const refreshUserData = () => {
    const token = localStorage.getItem('token');
    if (token) {
      return fetchUserData(token);
    }
    return Promise.resolve(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      loading, 
      error,
      login, 
      logout, 
      register,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);