// src/components/PremiumPricingModal.jsx
import React, { useState } from 'react';
import styles from './PremiumPricingModal.module.css';

function PremiumPricingModal({ onClose, onSubscribe, user }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubscribe = async () => {
        setIsProcessing(true);
        try {
            await onSubscribe();
        } catch (error) {
            console.error('Subscription failed:', error);
            alert('Subscription failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={onClose} className={styles.closeButton}>✕</button>

                <div className={styles.content}>
                    <div className={styles.icon}>🔒</div>
                    <h2>Upgrade to Premium</h2>
                    <p>Advanced contract analysis requires a premium subscription.</p>

                    <div className={styles.price}>
                        <span className={styles.amount}>$149</span>
                        <span className={styles.period}>/month</span>
                    </div>

                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span>✓</span> Unlimited contract analysis
                        </div>
                        <div className={styles.feature}>
                            <span>✓</span> AI-powered insights
                        </div>
                        <div className={styles.feature}>
                            <span>✓</span> Secure cloud storage
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button onClick={onClose} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button
                            onClick={handleSubscribe}
                            disabled={isProcessing}
                            className={styles.upgradeButton}
                        >
                            {isProcessing ? 'Processing...' : 'Upgrade'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PremiumPricingModal;