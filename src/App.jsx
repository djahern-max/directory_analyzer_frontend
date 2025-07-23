// src/App.jsx - Clean version without console logs
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
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, '/');
      loadUser(token);
    } else if (paymentStatus === 'success') {
      handlePaymentSuccess(sessionId);
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
        setUser(userData);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      localStorage.removeItem('auth_token');
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async (sessionId) => {
    const existingToken = localStorage.getItem('auth_token');

    if (!existingToken) {
      window.history.replaceState({}, document.title, '/');
      setLoading(false);
      return;
    }

    setPaymentProcessing(true);

    try {
      // Clean up URL first
      window.history.replaceState({}, document.title, '/');

      if (sessionId) {
        // ✅ NEW: Handle the response from verification
        const verificationResult = await verifyPaymentSession(sessionId, existingToken);

        if (verificationResult.success) {
          // Show success message
          alert('Subscription activated successfully! You now have premium access.');

          // Optionally refresh the page to reload with new premium status
          window.location.reload();
        } else {
          // Handle verification failure
          alert('Payment was processed but verification failed. Please contact support.');
        }
      } else {
        // Fallback: refresh premium status if no session ID
        await refreshPremiumStatus();
      }

    } catch (error) {
      console.error('Error handling payment success:', error);
      alert('Payment was processed but there was an error. Please refresh the page.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const verifyPaymentSession = async (sessionId, token) => {
    try {
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

        // ✅ NEW: Handle the premium token returned from the backend
        if (result.success && result.token) {
          // Store the new premium token
          localStorage.setItem('auth_token', result.token);

          // Update user state with premium status (if you have a setUser function)
          if (setUser && result.user) {
            setUser(result.user);
          }

          // Log success for debugging
          console.log('✅ Premium subscription activated!', {
            has_premium: result.user?.has_premium,
            subscription_status: result.user?.subscription_status
          });

          return {
            success: true,
            user: result.user,
            message: result.message
          };
        }

        return { success: true };
      } else {
        console.error('❌ Payment verification failed:', response.status);
        return { success: false, error: 'Payment verification failed' };
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      return { success: false, error: error.message };
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