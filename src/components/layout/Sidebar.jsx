// src/components/layout/Sidebar.jsx - Updated to handle loading states
import React from 'react';
import styles from './Sidebar.module.css';

function Sidebar({
    user,
    onLogout,
    contracts,
    selectedContract,
    onSelectContract,
    refreshPremiumStatus,
    loading,
    error,
    onRefresh
}) {
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Unknown date';
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'uploaded': { text: 'Uploaded', class: styles.statusUploaded },
            'analyzing': { text: 'Analyzing', class: styles.statusAnalyzing },
            'analyzed': { text: 'Analyzed', class: styles.statusAnalyzed },
            'error': { text: 'Error', class: styles.statusError }
        };

        const statusInfo = statusMap[status] || { text: status, class: styles.statusDefault };

        return (
            <span className={`${styles.statusBadge} ${statusInfo.class}`}>
                {statusInfo.text}
            </span>
        );
    };

    return (
        <div className={styles.sidebar}>
            {/* User Profile Section */}
            <div className={styles.userSection}>
                <div className={styles.userInfo}>
                    {user.picture_url && (
                        <img
                            src={user.picture_url}
                            alt={user.name}
                            className={styles.userAvatar}
                        />
                    )}
                    <div className={styles.userDetails}>
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                        {user.has_premium && (
                            <span className={styles.premiumBadge}>Premium</span>
                        )}
                    </div>
                </div>
                <div className={styles.userActions}>
                    <button
                        onClick={refreshPremiumStatus}
                        className={styles.refreshButton}
                        title="Refresh Premium Status"
                    >
                        🔄
                    </button>
                    <button
                        onClick={onLogout}
                        className={styles.logoutButton}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Contracts Section */}
            <div className={styles.contractsSection}>
                <div className={styles.contractsHeader}>
                    <h3>Your Contracts</h3>
                    <button
                        onClick={onRefresh}
                        className={styles.refreshButton}
                        disabled={loading}
                        title="Refresh Contracts"
                    >
                        {loading ? '⏳' : '🔄'}
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading contracts...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className={styles.errorState}>
                        <p className={styles.errorMessage}>
                            ⚠️ Error loading contracts: {error}
                        </p>
                        <button
                            onClick={onRefresh}
                            className={styles.retryButton}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && contracts.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>No contracts found</p>
                        <p className={styles.emptyStateSubtext}>
                            Upload some contracts to get started
                        </p>
                    </div>
                )}

                {/* Contracts List */}
                {!loading && !error && contracts.length > 0 && (
                    <div className={styles.contractsList}>
                        {contracts.map((contract) => (
                            <div
                                key={contract.id}
                                className={`${styles.contractItem} ${selectedContract?.id === contract.id ? styles.selected : ''
                                    }`}
                                onClick={() => onSelectContract(contract)}
                            >
                                <div className={styles.contractHeader}>
                                    <h4 className={styles.contractName}>
                                        {contract.name}
                                    </h4>
                                    {contract.isMainContract && (
                                        <span className={styles.mainContractBadge}>
                                            Main
                                        </span>
                                    )}
                                </div>

                                <div className={styles.contractMeta}>
                                    <p className={styles.jobInfo}>
                                        Job: {contract.jobNumber}
                                        {contract.jobName && contract.jobName !== `Job ${contract.jobNumber}` && (
                                            <span className={styles.jobName}>
                                                {' - ' + contract.jobName}
                                            </span>
                                        )}
                                    </p>
                                    <p className={styles.uploadDate}>
                                        {formatDate(contract.uploadDate)}
                                    </p>
                                    {contract.fileSize && (
                                        <p className={styles.fileSize}>
                                            {formatFileSize(contract.fileSize)}
                                        </p>
                                    )}
                                </div>

                                <div className={styles.contractFooter}>
                                    {getStatusBadge(contract.status)}
                                    {contract.contractType && (
                                        <span className={styles.contractType}>
                                            {contract.contractType}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Sidebar;