// src/App.jsx - Fixed version with better payment flow handling
import { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import ChatLayout from './components/layout/ChatLayout';
import { usePremiumStatus } from './hooks/usePremium';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Use the premium status hook
  const { hasPremium, refreshPremiumStatus, isRefreshing } = usePremiumStatus(user, setUser);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (token) {
      console.log('OAuth token found, loading user...');
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, '/');
      loadUser(token);
    } else if (paymentStatus === 'success') {
      console.log('Payment success detected, handling...');
      handlePaymentSuccess(sessionId);
    } else {
      // Check for existing token
      const existingToken = localStorage.getItem('auth_token');
      if (existingToken) {
        console.log('Existing token found, loading user...');
        loadUser(existingToken);
      } else {
        console.log('No token found, showing login...');
        setLoading(false);
      }
    }
  }, []); // Remove refreshPremiumStatus dependency to avoid loops

  const loadUser = async (token) => {
    try {
      console.log('Loading user with token...');
      const response = await fetch('https://pdfcontractanalyzer.com/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User loaded successfully:', {
          email: userData.email,
          has_premium: userData.has_premium,
          subscription_status: userData.subscription_status
        });
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

  const handlePaymentSuccess = async (sessionId) => {
    const existingToken = localStorage.getItem('auth_token');

    if (!existingToken) {
      console.log('No auth token for payment success, redirecting to login');
      window.history.replaceState({}, document.title, '/');
      setLoading(false);
      return;
    }

    setPaymentProcessing(true);

    try {
      // Clean up URL first
      window.history.replaceState({}, document.title, '/');

      if (sessionId) {
        console.log('Verifying payment session:', sessionId);
        await verifyPaymentSession(sessionId, existingToken);
      } else {
        console.log('No session ID, just refreshing premium status...');
        await refreshPremiumStatus();
      }

      // Load fresh user data
      await loadUser(existingToken);

      // Show success message
      setTimeout(() => {
        alert('Subscription activated successfully!');
      }, 500);

    } catch (error) {
      console.error('Payment success handling failed:', error);
      // Still try to load user data
      await loadUser(existingToken);
    } finally {
      setPaymentProcessing(false);
    }
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
        return true;
      } else {
        const errorText = await response.text();
        console.error('Payment verification failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  // Show loading state
  if (loading || paymentProcessing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '18px' }}>
          {paymentProcessing ? 'Processing payment...' : 'Loading...'}
        </div>
        {(isRefreshing || paymentProcessing) && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            {paymentProcessing ? 'Activating subscription...' : 'Updating subscription status...'}
          </div>
        )}
        {/* Add a spinner */}
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f0f0f0',
          borderTop: '3px solid #10a37f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
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