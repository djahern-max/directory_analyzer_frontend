// src/components/PremiumPricingModal.jsx
import React, { useState } from 'react';
import styles from './PremiumPricingModal.module.css';

function PremiumPricingModal({ onClose, onSubscribe, user }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubscribe = async () => {
        setIsProcessing(true);
        try {
            // Call backend to create Stripe checkout session
            const response = await fetch('https://pdfcontractanalyzer.com/api/payments/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { checkout_url } = await response.json();

            // Redirect to Stripe checkout
            window.location.href = checkout_url;

        } catch (error) {
            console.error('Subscription failed:', error);
            alert('Failed to start checkout. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeButton}>✕</button>

                <div className={styles.content}>
                    <div className={styles.icon}>📄</div>
                    <h2>Contract Analysis</h2>
                    <p>Store your contracts in one secure location and access AI analysis and interpretation on demand whenever you want.</p>

                    <div className={styles.price}>
                        <span className={styles.amount}>$149</span>
                        <span className={styles.period}>/month</span>
                    </div>

                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span>✓</span> Secure contract storage
                        </div>
                        <div className={styles.feature}>
                            <span>✓</span> On-demand AI analysis
                        </div>
                        <div className={styles.feature}>
                            <span>✓</span> Unlimited access
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button onClick={onClose} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button
                            onClick={handleSubscribe}
                            disabled={isProcessing}
                            className={styles.subscribeButton}
                        >
                            {isProcessing ? 'Loading...' : 'Subscribe'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PremiumPricingModal;