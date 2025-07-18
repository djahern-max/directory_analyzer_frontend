// Add this to your App.jsx to handle premium status refresh

import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import ChatLayout from './components/layout/ChatLayout';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const paymentStatus = urlParams.get('payment');

    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, '/');
      loadUser(token);
    } else if (paymentStatus === 'success') {
      // Payment was successful, refresh user data
      console.log('Payment successful, refreshing user data...');
      const existingToken = localStorage.getItem('auth_token');
      if (existingToken) {
        refreshUserPremiumStatus(existingToken);
      } else {
        // Clean up URL and show login
        window.history.replaceState({}, document.title, '/');
        setLoading(false);
      }
    } else {
      // Check for existing token
      const existingToken = localStorage.getItem('auth_token');
      if (existingToken) {
        loadUser(existingToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const loadUser = async (token) => {
    try {
      const response = await fetch('https://pdfcontractanalyzer.com/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('Loaded user data:', userData);
        setUser(userData);
      } else {
        console.log('Auth failed, removing token');
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('auth_token');
    }
    setLoading(false);
  };

  const refreshUserPremiumStatus = async (token) => {
    try {
      console.log('Refreshing premium status...');
      const response = await fetch('https://pdfcontractanalyzer.com/api/auth/refresh-premium-status', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const refreshData = await response.json();
        console.log('Premium status refreshed:', refreshData);

        // Update token if new one provided
        if (refreshData.token) {
          localStorage.setItem('auth_token', refreshData.token);
        }

        // Load fresh user data
        loadUser(refreshData.token || token);
      } else {
        console.log('Premium refresh failed, loading user normally');
        loadUser(token);
      }
    } catch (error) {
      console.error('Premium refresh error:', error);
      loadUser(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ChatLayout user={user} onLogout={handleLogout} />
  );
}

export default App;