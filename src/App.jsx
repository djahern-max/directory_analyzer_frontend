// src/App.jsx - Updated with better premium status management
import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import ChatLayout from './components/layout/ChatLayout';
import { usePremiumStatus } from './hooks/usePremiumStatus';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the premium status hook
  const { hasPremium, refreshPremiumStatus, isRefreshing } = usePremiumStatus(user, setUser);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, '/');
      loadUser(token);
    } else if (paymentStatus === 'success') {
      // Payment was successful
      console.log('Payment successful, handling...');
      const existingToken = localStorage.getItem('auth_token');

      if (existingToken) {
        if (sessionId) {
          // Verify the payment session first
          verifyPaymentSession(sessionId, existingToken);
        } else {
          // Just refresh premium status
          refreshPremiumStatus();
        }
      } else {
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
  }, [refreshPremiumStatus]);

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

  const verifyPaymentSession = async (sessionId, token) => {
    try {
      console.log('Verifying payment session:', sessionId);

      const response = await fetch('https://pdfcontractanalyzer.com/api/payments/verify-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Payment verification successful:', result);

        // Clean up URL
        window.history.replaceState({}, document.title, '/');

        // Refresh user data
        await refreshPremiumStatus();

        // Show success message
        alert('Subscription activated successfully!');
      } else {
        console.error('Payment verification failed');
        // Fall back to just refreshing status
        await refreshPremiumStatus();
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      // Fall back to refreshing status
      await refreshPremiumStatus();
    } finally {
      // Clean up URL regardless
      window.history.replaceState({}, document.title, '/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  if (loading || isRefreshing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: '1rem'
      }}>
        <div>Loading...</div>
        {isRefreshing && <div style={{ fontSize: '14px', color: '#666' }}>
          Updating subscription status...
        </div>}
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Pass the computed premium status to ChatLayout
  const userWithPremiumStatus = {
    ...user,
    hasPremiumSubscription: hasPremium,
    has_premium: hasPremium
  };

  return (
    <ChatLayout
      user={userWithPremiumStatus}
      onLogout={handleLogout}
      refreshPremiumStatus={refreshPremiumStatus}
    />
  );
}

export default App;