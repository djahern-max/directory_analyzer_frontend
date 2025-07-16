import { useState, useEffect } from 'react';
import ApiTest from './ApiTest';
import Login from './components/auth/Login';
import UserHeader from './components/UserHeader';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, '/');
      loadUser(token);
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
      const response = await fetch('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
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
    <>
      <UserHeader user={user} onLogout={handleLogout} />
      <div style={{ padding: '2rem' }}>
        <h1>Directory Analyzer</h1>
        <p>Construction Document Analysis System</p>
        <ApiTest user={user} />
      </div>
    </>
  );
}

export default App;