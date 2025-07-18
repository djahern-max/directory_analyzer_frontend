// src/components/DirectoryAnalyzer.jsx - Clean version without console logs
import React, { useState } from 'react';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import PremiumPricingModal from './PremiumPricingModal';
import styles from './DirectoryAnalyzer.module.css';

function DirectoryAnalyzer({ onClose, onAnalysisComplete, user, refreshPremiumStatus }) {
    const [files, setFiles] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [showPricingModal, setShowPricingModal] = useState(false);

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

    const checkPremiumStatus = () => {
        // Multiple ways to check premium status for compatibility
        const hasPremium = user?.hasPremiumSubscription ||
            user?.has_premium ||
            (user?.subscription_status === 'active');

        return hasPremium;
    };

    const analyzeDirectory = async () => {
        if (selectedFiles.size === 0) {
            alert('Please select at least one file to analyze');
            return;
        }

        // First check premium status from user object
        if (!checkPremiumStatus()) {
            // Try to refresh premium status first
            if (refreshPremiumStatus) {
                const hasPremium = await refreshPremiumStatus();
                if (!hasPremium) {
                    setShowPricingModal(true);
                    return;
                }
                // If premium status was refreshed successfully, continue with analysis
            } else {
                setShowPricingModal(true);
                return;
            }
        }

        setIsAnalyzing(true);

        try {
            // Step 1: Upload files to server
            const formData = new FormData();
            const selectedFileArray = Array.from(selectedFiles).map(index => files[index]);

            selectedFileArray.forEach((file, index) => {
                formData.append('files', file);
            });

            const directoryName = files[0]?.webkitRelativePath?.split('/')[0] || 'uploaded-folder';
            formData.append('directory_name', directoryName);

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
                const errorData = await uploadResponse.json().catch(() => ({}));

                // Try refreshing premium status one more time
                if (refreshPremiumStatus) {
                    const hasPremium = await refreshPremiumStatus();
                    if (hasPremium) {
                        // Retry the request with refreshed status
                        setIsAnalyzing(false);
                        return analyzeDirectory(); // Recursive call with fresh status
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

            // Step 2: Analyze using the uploaded directory path
            const serverDirectoryPath = uploadResult.directory_path || directoryName;

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
                const errorData = await analyzeResponse.json().catch(() => ({}));
                setShowPricingModal(true);
                return;
            }

            if (!analyzeResponse.ok) {
                const errorData = await analyzeResponse.text();
                throw new Error(`Analysis failed: ${analyzeResponse.status} - ${errorData}`);
            }

            const results = await analyzeResponse.json();
            setAnalysisResults(results);

        } catch (error) {
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
            alert('Failed to start checkout. Please try again.');
        }
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
                                        {checkPremiumStatus() && (
                                            <div style={{ fontSize: '12px', color: '#10a37f', marginTop: '4px' }}>
                                                ✓ Premium subscription active
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={analyzeDirectory}
                                        disabled={selectedFiles.size === 0 || isAnalyzing}
                                        className={styles.primaryButton}
                                    >
                                        {isAnalyzing ? 'Analyzing...' : `Analyze ${selectedFiles.size} Files`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showPricingModal && (
                <PremiumPricingModal
                    onClose={() => setShowPricingModal(false)}
                    onSubscribe={handleSubscribe}
                    user={user}
                />
            )}
        </>
    );
}

export default DirectoryAnalyzer;