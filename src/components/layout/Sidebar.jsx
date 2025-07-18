// src/components/layout/Sidebar.jsx - Auto-restore DirectoryAnalyzer after checkout
import React, { useState, useEffect } from 'react';
import DirectoryAnalyzer from '../DirectoryAnalyzer';
import styles from './Sidebar.module.css';

function Sidebar({ user, onLogout, contracts, selectedContract, onSelectContract, refreshPremiumStatus }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showDirectoryAnalyzer, setShowDirectoryAnalyzer] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsOpen(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Check if we should auto-restore DirectoryAnalyzer after successful checkout
    useEffect(() => {
        const checkForDirectoryAnalyzerRestore = () => {
            // Check if there's saved DirectoryAnalyzer state
            const savedState = localStorage.getItem('directoryAnalyzer_savedState');

            // Check URL params for successful payment
            const urlParams = new URLSearchParams(window.location.search);
            const paymentStatus = urlParams.get('payment');

            if (savedState && paymentStatus === 'success') {
                // User returned from successful checkout and has saved state
                // Wait a moment for the user object to be updated with premium status
                setTimeout(() => {
                    setShowDirectoryAnalyzer(true);
                    console.log('Auto-opening DirectoryAnalyzer after successful checkout');
                }, 1000);
            }
        };

        // Only check for restore if user has premium (means checkout was successful)
        if (user?.has_premium && user?.subscription_status === 'active') {
            checkForDirectoryAnalyzerRestore();
        }
    }, [user]);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const handleContractSelect = (contract) => {
        onSelectContract(contract);
        if (isMobile) {
            closeSidebar();
        }
    };

    const handleAnalysisComplete = (results) => {
        console.log('Directory analysis results:', results);
        // Here you would typically save the results and create new contract entries
        // For now, we'll just log them
    };

    const handleOpenDirectoryAnalyzer = () => {
        setShowDirectoryAnalyzer(true);
    };

    const handleCloseDirectoryAnalyzer = () => {
        setShowDirectoryAnalyzer(false);
    };

    return (
        <>
            {/* Mobile Hamburger Button */}
            {isMobile && (
                <button
                    className={`${styles.hamburgerButton} ${isOpen ? styles.hidden : ''}`}
                    onClick={toggleSidebar}
                    aria-label="Open menu"
                >
                    <div className={styles.hamburgerLine}></div>
                    <div className={styles.hamburgerLine}></div>
                    <div className={styles.hamburgerLine}></div>
                </button>
            )}

            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className={styles.overlay}
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`${styles.sidebar} ${isMobile ? styles.mobile : ''} ${isOpen ? styles.open : ''}`}>
                {/* Mobile Header with Close Button */}
                {isMobile && (
                    <div className={styles.mobileHeader}>
                        <button
                            className={styles.closeButton}
                            onClick={closeSidebar}
                            aria-label="Close menu"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Header Actions */}
                <div className={styles.header}>
                    <button className={styles.newButton}>
                        📄 Upload Contract
                    </button>
                    <button
                        className={styles.newButton}
                        onClick={handleOpenDirectoryAnalyzer}
                    >
                        📁 Analyze Directory
                    </button>
                </div>

                {/* Contracts List */}
                <div className={styles.contractsSection}>
                    <div className={styles.sectionLabel}>CONTRACTS</div>

                    <div className={styles.contractsList}>
                        {contracts.map(contract => (
                            <div
                                key={contract.id}
                                onClick={() => handleContractSelect(contract)}
                                className={`${styles.contractItem} ${selectedContract?.id === contract.id ? styles.selected : ''}`}
                            >
                                <div className={styles.contractName}>{contract.name}</div>
                                <div className={styles.contractMeta}>
                                    <span>#{contract.jobNumber}</span>
                                    <span className={`${styles.status} ${styles[contract.status]}`}>
                                        {contract.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Info */}
                <div className={styles.userSection}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userCredits}>
                        Credits: ${user.credits_remaining?.toFixed(2) || '0.00'}
                    </div>
                    <button onClick={onLogout} className={styles.logoutButton}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Directory Analyzer Modal */}
            {showDirectoryAnalyzer && (
                <DirectoryAnalyzer
                    onClose={handleCloseDirectoryAnalyzer}
                    onAnalysisComplete={handleAnalysisComplete}
                    user={user}
                    refreshPremiumStatus={refreshPremiumStatus}
                />
            )}
        </>
    );
}

export default Sidebar;