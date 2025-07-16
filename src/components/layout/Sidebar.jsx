// src/components/layout/Sidebar.jsx
import React from 'react';
import styles from './Sidebar.module.css';

function Sidebar({ user, onLogout, contracts, selectedContract, onSelectContract }) {
    return (
        <div className={styles.sidebar}>
            {/* Header Actions */}
            <div className={styles.header}>
                <button className={styles.newButton}>
                    📄 Upload Contract
                </button>
                <button className={styles.newButton}>
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
                            onClick={() => onSelectContract(contract)}
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
    );
}

export default Sidebar;