import { useState } from 'react';
import styles from './Login.module.css';

function Login() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        window.location.href = 'https://pdfcontractanalyzer.com/auth/google';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Contract Analyzer</h1>

            </div>

            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={styles.googleButton}
            >
                {isLoading ? (
                    <>
                        <div className={styles.loadingSpinner}></div>
                        Signing in...
                    </>
                ) : (
                    <>
                        <div className={styles.googleIcon}></div>
                        Sign in with Google
                    </>
                )}
            </button>
        </div>
    );
}

export default Login;