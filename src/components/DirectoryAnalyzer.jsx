// src/components/DirectoryAnalyzer.jsx - Fixed premium checking with better validation
import React, { useState, useEffect } from 'react';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import PremiumPricingModal from './PremiumPricingModal';
import styles from './DirectoryAnalyzer.module.css';

function DirectoryAnalyzer({ onClose, onAnalysisComplete, user, refreshPremiumStatus }) {
    const [files, setFiles] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [currentPremiumStatus, setCurrentPremiumStatus] = useState(null);
    const [isCheckingPremium, setIsCheckingPremium] = useState(false);

    // Check premium status on component mount and when user changes
    useEffect(() => {
        checkAndUpdatePremiumStatus();
    }, [user]);

    const checkPremiumStatus = (userObj = user) => {
        if (!userObj) return false;

        // Check multiple fields for premium status (various naming conventions)
        const hasPremium = userObj.hasPremiumSubscription ||
            userObj.has_premium ||
            (userObj.subscription_status === 'active') ||
            (userObj.subscription_status === 'trialing');

        console.log('Premium status check:', {
            hasPremiumSubscription: userObj.hasPremiumSubscription,
            has_premium: userObj.has_premium,
            subscription_status: userObj.subscription_status,
            computed: hasPremium
        });

        return hasPremium;
    };

    const checkAndUpdatePremiumStatus = async () => {
        // First check the user object we have
        const currentStatus = checkPremiumStatus();
        setCurrentPremiumStatus(currentStatus);

        // If we don't think the user has premium, refresh to be sure
        if (!currentStatus && refreshPremiumStatus) {
            setIsCheckingPremium(true);
            try {
                const refreshedStatus = await refreshPremiumStatus();
                setCurrentPremiumStatus(refreshedStatus);
                console.log('Refreshed premium status:', refreshedStatus);
            } catch (error) {
                console.error('Failed to refresh premium status:', error);
                // Keep the current status if refresh fails
            } finally {
                setIsCheckingPremium(false);
            }
        }
    };

    const verifyPremiumWithBackend = async () => {
        try {
            const response = await fetch('https://pdfcontractanalyzer.com/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                const backendPremiumStatus = checkPremiumStatus(userData);
                console.log('Backend premium verification:', {
                    userData,
                    hasPremium: backendPremiumStatus
                });
                return backendPremiumStatus;
            }
        } catch (error) {
            console.error('Backend premium verification failed:', error);
        }
        return false;
    };

    const handleDirectorySelect = (event) => {
        const fileList = Array.from(event.target.files);
        setFiles(fileList);
        setSelectedFiles(new Set(fileList.map((_, index) => index)));
    };

    const handleFileToggle = (index) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedFiles(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedFiles.size === files.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(files.map((_, index) => index)));
        }
    };

    const analyzeDirectory = async () => {
        if (selectedFiles.size === 0) {
            alert('Please select at least one file to analyze');
            return;
        }

        console.log('Starting analysis - checking premium status...');

        // Step 1: Check current premium status from state
        let hasPremium = currentPremiumStatus;
        console.log('Current premium status from state:', hasPremium);

        // Step 2: If we don't have premium, do a fresh check with backend
        if (!hasPremium) {
            console.log('No premium detected, verifying with backend...');
            setIsCheckingPremium(true);

            // Try to refresh premium status one more time
            if (refreshPremiumStatus) {
                try {
                    hasPremium = await refreshPremiumStatus();
                    setCurrentPremiumStatus(hasPremium);
                    console.log('Premium status after refresh:', hasPremium);
                } catch (error) {
                    console.error('Premium status refresh failed:', error);
                }
            }

            // Also verify directly with backend
            if (!hasPremium) {
                hasPremium = await verifyPremiumWithBackend();
                setCurrentPremiumStatus(hasPremium);
                console.log('Premium status after backend verification:', hasPremium);
            }

            setIsCheckingPremium(false);
        }

        // Step 3: If still no premium, show pricing modal
        if (!hasPremium) {
            console.log('No premium subscription found, showing pricing modal');
            setShowPricingModal(true);
            return;
        }

        console.log('Premium subscription confirmed, proceeding with analysis');
        setIsAnalyzing(true);

        try {
            // Step 4: Upload files to server
            const formData = new FormData();
            const selectedFileArray = Array.from(selectedFiles).map(index => files[index]);

            selectedFileArray.forEach((file, index) => {
                formData.append('files', file);
            });

            const directoryName = files[0]?.webkitRelativePath?.split('/')[0] || 'uploaded-folder';
            formData.append('directory_name', directoryName);

            console.log('Uploading files...');
            const uploadResponse = await fetch(buildApiUrl(API_ENDPOINTS.DIRECTORIES.UPLOAD), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: formData
            });

            // Handle authentication errors
            if (uploadResponse.status === 401) {
                alert('Please log in to continue');
                return;
            }

            // Handle premium subscription errors from backend
            if (uploadResponse.status === 402 || uploadResponse.status === 403) {
                console.log('Backend rejected request - premium required');

                // Backend says no premium - this means our status is stale
                setCurrentPremiumStatus(false);

                // Try one final refresh before showing pricing
                if (refreshPremiumStatus) {
                    try {
                        const finalRefresh = await refreshPremiumStatus();
                        setCurrentPremiumStatus(finalRefresh);

                        if (finalRefresh) {
                            console.log('Final refresh successful, retrying analysis...');
                            // Retry the analysis with fresh status
                            setIsAnalyzing(false);
                            return analyzeDirectory();
                        }
                    } catch (error) {
                        console.error('Final refresh failed:', error);
                    }
                }

                setShowPricingModal(true);
                return;
            }

            if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.text();
                throw new Error(`File upload failed: ${uploadResponse.status} - ${uploadError}`);
            }

            const uploadResult = await uploadResponse.json();
            console.log('Upload successful:', uploadResult);

            // Step 5: Analyze using the uploaded directory path
            const serverDirectoryPath = uploadResult.directory_path || directoryName;

            console.log('Starting analysis...');
            const analyzeResponse = await fetch(buildApiUrl(API_ENDPOINTS.DIRECTORIES.ANALYZE), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    directory_path: serverDirectoryPath
                })
            });

            // Handle premium subscription errors from analysis endpoint
            if (analyzeResponse.status === 402 || analyzeResponse.status === 403) {
                console.log('Analysis endpoint rejected request - premium required');
                setCurrentPremiumStatus(false);
                setShowPricingModal(true);
                return;
            }

            if (!analyzeResponse.ok) {
                const errorData = await analyzeResponse.text();
                throw new Error(`Analysis failed: ${analyzeResponse.status} - ${errorData}`);
            }

            const results = await analyzeResponse.json();
            console.log('Analysis completed successfully');
            setAnalysisResults(results);

        } catch (error) {
            console.error('Analysis failed:', error);
            alert(`Analysis failed: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUseResults = () => {
        if (analysisResults && onAnalysisComplete) {
            onAnalysisComplete(analysisResults);
        }
        onClose();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf': return '📄';
            case 'doc':
            case 'docx': return '📝';
            case 'xls':
            case 'xlsx': return '📊';
            case 'txt': return '📋';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return '🖼️';
            default: return '📁';
        }
    };

    const handleSubscribe = async () => {
        try {
            // Create checkout session
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
        }
    };

    const handlePricingModalClose = () => {
        setShowPricingModal(false);
        // Refresh premium status when modal closes in case user subscribed in another tab
        checkAndUpdatePremiumStatus();
    };

    return (
        <>
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.header}>
                        <h2>Analyze Directory</h2>
                        <button onClick={onClose} className={styles.closeButton}>✕</button>
                    </div>

                    <div className={styles.content}>
                        {!files.length ? (
                            <div className={styles.uploadSection}>
                                <div className={styles.uploadArea}>
                                    <div className={styles.uploadIcon}>📁</div>
                                    <h3>Select a folder to analyze</h3>
                                    <p>Choose a directory containing contracts and documents that need to be organized and analyzed.</p>

                                    <label className={styles.uploadButton}>
                                        <input
                                            type="file"
                                            webkitdirectory="true"
                                            multiple
                                            onChange={handleDirectorySelect}
                                            style={{ display: 'none' }}
                                        />
                                        Select Folder
                                    </label>

                                    <div className={styles.supportedTypes}>
                                        <small>Supported: PDF, DOC, DOCX, TXT, XLS, XLSX</small>
                                    </div>
                                </div>
                            </div>
                        ) : analysisResults ? (
                            <div className={styles.resultsSection}>
                                <h3>Analysis Results</h3>
                                <div className={styles.resultsContent}>
                                    <pre>{JSON.stringify(analysisResults, null, 2)}</pre>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => setFiles([])} className={styles.secondaryButton}>
                                        Start Over
                                    </button>
                                    <button onClick={handleUseResults} className={styles.primaryButton}>
                                        Use These Results
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.fileListSection}>
                                <div className={styles.fileListHeader}>
                                    <h3>Found {files.length} files</h3>
                                    <div className={styles.fileActions}>
                                        <button onClick={handleSelectAll} className={styles.selectAllButton}>
                                            {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <button onClick={() => setFiles([])} className={styles.secondaryButton}>
                                            Choose Different Folder
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.fileList}>
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.fileItem} ${selectedFiles.has(index) ? styles.selected : ''}`}
                                            onClick={() => handleFileToggle(index)}
                                        >
                                            <div className={styles.fileIcon}>
                                                {getFileIcon(file.name)}
                                            </div>
                                            <div className={styles.fileInfo}>
                                                <div className={styles.fileName}>{file.name}</div>
                                                <div className={styles.filePath}>
                                                    {file.webkitRelativePath || file.name}
                                                </div>
                                                <div className={styles.fileSize}>
                                                    {formatFileSize(file.size)}
                                                </div>
                                            </div>
                                            <div className={styles.checkbox}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFiles.has(index)}
                                                    onChange={() => handleFileToggle(index)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.actions}>
                                    <div className={styles.selectionInfo}>
                                        {selectedFiles.size} of {files.length} files selected
                                        {isCheckingPremium ? (
                                            <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
                                                ⏳ Checking subscription status...
                                            </div>
                                        ) : currentPremiumStatus ? (
                                            <div style={{ fontSize: '12px', color: '#10a37f', marginTop: '4px' }}>
                                                ✓ Premium subscription active
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                                                ⚠ Premium subscription required
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={analyzeDirectory}
                                        disabled={selectedFiles.size === 0 || isAnalyzing || isCheckingPremium}
                                        className={styles.primaryButton}
                                    >
                                        {isAnalyzing ? 'Analyzing...' :
                                            isCheckingPremium ? 'Checking Status...' :
                                                `Analyze ${selectedFiles.size} Files`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showPricingModal && (
                <PremiumPricingModal
                    onClose={handlePricingModalClose}
                    onSubscribe={handleSubscribe}
                    user={user}
                />
            )}
        </>
    );
}

export default DirectoryAnalyzer;