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
    const sessionId = urlParams.get('session_id');

    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, '/');
      loadUser(token);
    } else if (paymentStatus === 'success' && sessionId) {
      // Handle successful payment
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

  const handlePaymentSuccess = async (sessionId) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found after payment success');
      setLoading(false);
      return;
    }

    try {
      console.log('Processing payment success for session:', sessionId);

      // Call backend to verify and update subscription status
      const response = await fetch('https://pdfcontractanalyzer.com/api/payments/verify-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (response.ok) {
        console.log('Payment verification successful');
        // Clean up URL
        window.history.replaceState({}, document.title, '/?payment_success=true');
        // Reload user data to get updated premium status
        loadUser(token);
      } else {
        console.error('Payment verification failed:', response.status);
        // Still try to load user in case webhook worked
        loadUser(token);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      // Still try to load user in case webhook worked
      loadUser(token);
    }
  };

  const loadUser = async (token) => {
    try {
      console.log('Loading user data...');
      const response = await fetch('https://pdfcontractanalyzer.com/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User data loaded:', userData);
        setUser(userData);

        // Show success message if payment just completed
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_success') === 'true') {
          // You could show a success toast here
          console.log('Payment successful! Premium features unlocked.');
          // Clean up URL
          window.history.replaceState({}, document.title, '/');
        }
      } else {
        console.error('Failed to load user data:', response.status);
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('auth_token');
    }
    setLoading(false);
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