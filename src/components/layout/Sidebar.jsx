// src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import DirectoryAnalyzer from '../DirectoryAnalyzer';

import styles from './Sidebar.module.css';

function Sidebar({ user, onLogout, contracts, selectedContract, onSelectContract }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showDirectoryAnalyzer, setShowDirectoryAnalyzer] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsOpen(false); // Close mobile menu when switching to desktop
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

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
                        onClick={() => setShowDirectoryAnalyzer(true)}
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
                                className={`${styles.contractItem} ${selectedContract?.id === contract.id ? styles.selected : ''
                                    }`}
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
                    onClose={() => setShowDirectoryAnalyzer(false)}
                    onAnalysisComplete={handleAnalysisComplete}
                />
            )}


        </>
    );
}

export default Sidebar;