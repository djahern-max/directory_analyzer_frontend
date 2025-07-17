// TokenDebugger.jsx - Add this temporarily to your app to debug tokens

import React, { useState } from 'react';

function TokenDebugger() {
    const [debugInfo, setDebugInfo] = useState(null);

    const checkToken = () => {
        const token = localStorage.getItem('auth_token');
        const info = {
            tokenExists: !!token,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? token.substring(0, 50) + '...' : 'No token found'
        };

        // Try to decode JWT payload
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    info.payload = payload;
                    info.isValidJWT = true;
                    info.userInfo = {
                        userId: payload.user_id || payload.sub,
                        email: payload.email,
                        hasPremium: payload.has_premium || payload.hasPremiumSubscription,
                        subscriptionStatus: payload.subscription_status,
                        expires: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiration'
                    };
                }
            } catch (e) {
                info.decodeError = e.message;
                info.isValidJWT = false;
            }
        }

        // Check alternative storage locations
        info.alternativeTokens = {};
        ['token', 'access_token', 'jwt_token', 'authToken'].forEach(key => {
            const altToken = localStorage.getItem(key);
            if (altToken) {
                info.alternativeTokens[key] = altToken.substring(0, 30) + '...';
            }
        });

        setDebugInfo(info);
    };

    const testApiCall = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            alert('No token found - please log in first');
            return;
        }

        try {
            // Test the service status endpoint (should be free)
            const response = await fetch('https://pdfcontractanalyzer.com/api/directories/service-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('API Test Response Status:', response.status);
            console.log('API Test Response Headers:', [...response.headers.entries()]);

            if (response.ok) {
                const data = await response.json();
                alert('✅ API call successful! Token is working.');
                console.log('API Response:', data);
            } else {
                const errorText = await response.text();
                alert(`❌ API call failed: ${response.status} - ${errorText}`);
                console.log('API Error:', errorText);
            }
        } catch (error) {
            alert(`❌ API call error: ${error.message}`);
            console.error('API Error:', error);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'white',
            border: '2px solid #ccc',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '400px',
            zIndex: 9999,
            fontSize: '14px'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔍 Token Debugger</h3>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={checkToken}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    Check Token
                </button>

                <button
                    onClick={testApiCall}
                    style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Test API Call
                </button>
            </div>

            {debugInfo && (
                <div style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <div><strong>Token exists:</strong> {debugInfo.tokenExists ? '✅ Yes' : '❌ No'}</div>
                    {debugInfo.tokenExists && (
                        <>
                            <div><strong>Token length:</strong> {debugInfo.tokenLength}</div>
                            <div><strong>Valid JWT:</strong> {debugInfo.isValidJWT ? '✅ Yes' : '❌ No'}</div>

                            {debugInfo.userInfo && (
                                <div style={{ marginTop: '10px' }}>
                                    <strong>User Info:</strong>
                                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                        <li>Email: {debugInfo.userInfo.email || 'Not found'}</li>
                                        <li>User ID: {debugInfo.userInfo.userId || 'Not found'}</li>
                                        <li>Has Premium: {debugInfo.userInfo.hasPremium ? '✅ Yes' : '❌ No'}</li>
                                        <li>Status: {debugInfo.userInfo.subscriptionStatus || 'Not set'}</li>
                                        <li>Expires: {debugInfo.userInfo.expires}</li>
                                    </ul>
                                </div>
                            )}

                            <details style={{ marginTop: '10px' }}>
                                <summary style={{ cursor: 'pointer' }}>Show Full Payload</summary>
                                <pre style={{
                                    background: '#fff',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    overflow: 'auto',
                                    maxHeight: '150px'
                                }}>
                                    {JSON.stringify(debugInfo.payload, null, 2)}
                                </pre>
                            </details>
                        </>
                    )}

                    {Object.keys(debugInfo.alternativeTokens).length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <strong>Alternative tokens found:</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                {Object.entries(debugInfo.alternativeTokens).map(([key, value]) => (
                                    <li key={key}>{key}: {value}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TokenDebugger;