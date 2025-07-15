import { useState } from 'react';

function Login() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Redirect to your backend auth endpoint
        window.location.href = 'https://pdfcontractanalyzer.com/auth/google';
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '2rem'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1>Directory Analyzer</h1>
                <p>Construction Document Analysis System</p>
            </div>

            <div style={{
                border: '1px solid #ccc',
                padding: '2rem',
                borderRadius: '4px',
                minWidth: '300px',
                textAlign: 'center',
                backgroundColor: '#fafafa'
            }}>
                <h3>Sign In Required</h3>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '1.5rem' }}>
                    Usage-based pricing. $1 free trial included.
                </p>

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        border: '1px solid #4285f4',
                        backgroundColor: '#4285f4',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        width: '100%'
                    }}
                >
                    {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </button>
            </div>
        </div>
    );
}

export default Login;