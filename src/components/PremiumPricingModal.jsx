// src/components/PremiumPricingModal.jsx
import React, { useState } from 'react';
import styles from './PremiumPricingModal.module.css';

function PremiumPricingModal({ onClose, onSubscribe, user }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubscribe = async () => {
        setIsProcessing(true);
        try {
            // This would integrate with your payment processor (Stripe, etc.)
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

                <div className={styles.header}>
                    <div className={styles.icon}>🔒</div>
                    <h2>Premium Contract Analysis</h2>
                </div>

                <div className={styles.content}>
                    <div className={styles.securityBadge}>
                        <span className={styles.shieldIcon}>🛡️</span>
                        <span>Enterprise-Grade Security</span>
                    </div>

                    <div className={styles.description}>
                        <p>
                            To provide the highest level of security and AI-powered contract analysis,
                            we use enterprise-grade cloud infrastructure and advanced AI processing.
                        </p>
                    </div>

                    <div className={styles.features}>
                        <h3>What's Included:</h3>
                        <ul>
                            <li>
                                <span className={styles.checkmark}>✓</span>
                                <div>
                                    <strong>Secure Cloud Storage</strong>
                                    <p>Your contracts are encrypted and stored on secure servers with enterprise-grade security</p>
                                </div>
                            </li>
                            <li>
                                <span className={styles.checkmark}>✓</span>
                                <div>
                                    <strong>Advanced AI Analysis</strong>
                                    <p>Powered by Claude AI for intelligent contract analysis and insights</p>
                                </div>
                            </li>
                            <li>
                                <span className={styles.checkmark}>✓</span>
                                <div>
                                    <strong>Unlimited Analysis</strong>
                                    <p>Analyze as many contracts as you need without per-document fees</p>
                                </div>
                            </li>
                            <li>
                                <span className={styles.checkmark}>✓</span>
                                <div>
                                    <strong>Priority Support</strong>
                                    <p>Direct access to our technical support team</p>
                                </div>
                            </li>
                            <li>
                                <span className={styles.checkmark}>✓</span>
                                <div>
                                    <strong>Data Retention</strong>
                                    <p>Your analyzed contracts remain accessible for the duration of your subscription</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.pricing}>
                        <div className={styles.priceBox}>
                            <div className={styles.price}>
                                <span className={styles.currency}>$</span>
                                <span className={styles.amount}>149</span>
                                <span className={styles.period}>/month</span>
                            </div>
                            <div className={styles.priceNote}>
                                Professional-grade contract analysis platform
                            </div>
                        </div>
                    </div>

                    <div className={styles.security}>
                        <h4>🔐 Security Features:</h4>
                        <div className={styles.securityGrid}>
                            <div className={styles.securityItem}>
                                <strong>Encryption</strong>
                                <span>AES-256 encryption at rest and in transit</span>
                            </div>
                            <div className={styles.securityItem}>
                                <strong>Compliance</strong>
                                <span>SOC 2 Type II certified infrastructure</span>
                            </div>
                            <div className={styles.securityItem}>
                                <strong>Access Control</strong>
                                <span>Your data is isolated and only accessible to you</span>
                            </div>
                            <div className={styles.securityItem}>
                                <strong>Backup</strong>
                                <span>Automated backups with point-in-time recovery</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.guarantee}>
                        <p>
                            <strong>30-Day Money-Back Guarantee</strong><br />
                            Not satisfied? Get a full refund within 30 days, no questions asked.
                        </p>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button onClick={onClose} className={styles.cancelButton}>
                        Maybe Later
                    </button>
                    <button
                        onClick={handleSubscribe}
                        disabled={isProcessing}
                        className={styles.subscribeButton}
                    >
                        {isProcessing ? 'Processing...' : 'Start Premium Service'}
                    </button>
                </div>

                <div className={styles.footer}>
                    <small>
                        By subscribing, you agree to our Terms of Service and Privacy Policy.
                        You can cancel anytime from your account settings.
                    </small>
                </div>
            </div>
        </div>
    );
}

export default PremiumPricingModal;