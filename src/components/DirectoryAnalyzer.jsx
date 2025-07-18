// src/components/DirectoryAnalyzer.jsx - With State Persistence
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

    // State persistence key
    const STORAGE_KEY = 'directoryAnalyzer_savedState';

    // Load saved state on component mount
    useEffect(() => {
        loadSavedState();
    }, []);

    // Save state to localStorage
    const saveState = () => {
        if (files.length > 0) {
            const stateToSave = {
                files: files.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    webkitRelativePath: file.webkitRelativePath,
                    lastModified: file.lastModified
                })),
                selectedFiles: Array.from(selectedFiles),
                timestamp: Date.now()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('Saved directory analyzer state before checkout');
        }
    };

    // Load saved state from localStorage
    const loadSavedState = () => {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const state = JSON.parse(savedState);

                // Only restore if the state is recent (within last 30 minutes)
                const thirtyMinutes = 30 * 60 * 1000;
                if (Date.now() - state.timestamp < thirtyMinutes) {
                    console.log('Restoring saved directory analyzer state');

                    // Create File objects from saved data (note: these won't be perfect File objects)
                    const restoredFiles = state.files.map(fileData => {
                        // Create a mock file object with the essential properties
                        return {
                            name: fileData.name,
                            size: fileData.size,
                            type: fileData.type,
                            webkitRelativePath: fileData.webkitRelativePath,
                            lastModified: fileData.lastModified
                        };
                    });

                    setFiles(restoredFiles);
                    setSelectedFiles(new Set(state.selectedFiles));

                    // Clear the saved state since we've restored it
                    localStorage.removeItem(STORAGE_KEY);

                    // Show a notification that state was restored
                    setTimeout(() => {
                        alert('Welcome back! Your previous file selection has been restored.');
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Failed to load saved state:', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    // Clear saved state
    const clearSavedState = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    const hasValidPremium = () => {
        return user?.has_premium === true && user?.subscription_status === 'active';
    };

    const handleDirectorySelect = (event) => {
        const fileList = Array.from(event.target.files);
        setFiles(fileList);
        setSelectedFiles(new Set(fileList.map((_, index) => index)));
        // Clear any previously saved state when user selects new files
        clearSavedState();
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

        if (!hasValidPremium()) {
            // Save state before showing pricing modal
            saveState();
            setShowPricingModal(true);
            return;
        }

        // Clear saved state since we're proceeding with analysis
        clearSavedState();
        setIsAnalyzing(true);

        try {
            // For restored files that aren't real File objects, we need to handle them differently
            const hasRealFiles = files.length > 0 && files[0] instanceof File;

            if (!hasRealFiles) {
                alert('Please reselect your files to proceed with analysis. Your selection has been restored but the files need to be reloaded.');
                setFiles([]);
                setSelectedFiles(new Set());
                return;
            }

            // Upload files (existing code)
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

            if (uploadResponse.status === 401) {
                alert('Please log in to continue');
                return;
            }

            if (uploadResponse.status === 402 || uploadResponse.status === 403) {
                // Save state before showing pricing modal
                saveState();
                setShowPricingModal(true);
                return;
            }

            if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.text();
                throw new Error(`File upload failed: ${uploadResponse.status} - ${uploadError}`);
            }

            const uploadResult = await uploadResponse.json();

            // Analyze the uploaded files
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

            if (analyzeResponse.status === 402 || analyzeResponse.status === 403) {
                // Save state before showing pricing modal
                saveState();
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
        // Clear saved state when successfully completing
        clearSavedState();
        if (analysisResults && onAnalysisComplete) {
            onAnalysisComplete(analysisResults);
        }
        onClose();
    };

    const handleClose = () => {
        // Clear saved state when manually closing
        clearSavedState();
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
            // Save state before redirecting to checkout
            saveState();

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

            // The user will be redirected to Stripe checkout
            // When they return, the saved state will be restored
            window.location.href = checkout_url;

        } catch (error) {
            alert('Failed to start checkout. Please try again.');
        }
    };

    const handlePricingModalClose = () => {
        setShowPricingModal(false);
        // Don't clear saved state here - they might open it again
    };

    // Check if files are restored (not real File objects)
    const areFilesRestored = files.length > 0 && !(files[0] instanceof File);

    return (
        <>
            <div className={styles.overlay}>
                <div className={styles.modal}>
                    <div className={styles.header}>
                        <h2>Analyze Directory</h2>
                        <button onClick={handleClose} className={styles.closeButton}>✕</button>
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
                                {/* Show restoration notice */}
                                {areFilesRestored && (
                                    <div style={{
                                        background: '#fff3cd',
                                        border: '1px solid #ffeaa7',
                                        borderRadius: '4px',
                                        padding: '12px',
                                        marginBottom: '16px',
                                        fontSize: '14px',
                                        color: '#856404'
                                    }}>
                                        📁 Your file selection has been restored! To proceed with analysis, please reselect your folder.
                                    </div>
                                )}

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
                                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                            {hasValidPremium() ? (
                                                <span style={{ color: '#10a37f' }}>✓ Premium subscription active</span>
                                            ) : (
                                                <span style={{ color: '#ef4444' }}>⚠ Premium subscription required</span>
                                            )}
                                        </div>
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
                    onClose={handlePricingModalClose}
                    onSubscribe={handleSubscribe}
                    user={user}
                />
            )}
        </>
    );
}

export default DirectoryAnalyzer;