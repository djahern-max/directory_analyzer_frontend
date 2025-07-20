// src/components/DirectoryAnalyzer.jsx - Enhanced version with scroll and upload button only
import React, { useState } from 'react';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import PremiumPricingModal from './PremiumPricingModal';
import styles from './DirectoryAnalyzer.module.css';

function DirectoryAnalyzer({ onClose, onAnalysisComplete, user, refreshPremiumStatus }) {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [showPricingModal, setShowPricingModal] = useState(false);

    const hasValidPremium = () => {
        return user?.has_premium === true && user?.subscription_status === 'active';
    };

    const handleDirectorySelect = (event) => {
        const fileList = Array.from(event.target.files);
        setFiles(fileList);
        setSelectedFiles(new Set(fileList.map((_, index) => index)));
        // Reset previous results when selecting new files
        setUploadResults(null);
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

    const detectContractType = (filename) => {
        const name = filename.toLowerCase();

        if (name.includes('executed') || name.includes('signed') || name.includes('complete_with_docusign')) {
            return { type: 'Main Contract', icon: '📋', color: '#10a37f' };
        } else if (name.includes('bond')) {
            return { type: 'Bond', icon: '🔒', color: '#f59e0b' };
        } else if (name.includes('cert_') || name.includes('certificate')) {
            return { type: 'Certificate', icon: '📜', color: '#3b82f6' };
        } else if (name.includes('proposal')) {
            return { type: 'Proposal', icon: '📊', color: '#8b5cf6' };
        } else if (name.includes('exhibit')) {
            return { type: 'Exhibit', icon: '📎', color: '#6b7280' };
        } else if (name.includes('affidavit')) {
            return { type: 'Affidavit', icon: '✍️', color: '#ef4444' };
        } else {
            return { type: 'General', icon: '📄', color: '#6b7280' };
        }
    };

    const uploadFiles = async () => {
        if (selectedFiles.size === 0) {
            alert('Please select at least one file to upload');
            return;
        }

        if (!hasValidPremium()) {
            setShowPricingModal(true);
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            const selectedFileArray = Array.from(selectedFiles).map(index => files[index]);

            selectedFileArray.forEach((file) => {
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
                setShowPricingModal(true);
                return;
            }

            if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.text();
                throw new Error(`File upload failed: ${uploadResponse.status} - ${uploadError}`);
            }

            const uploadResult = await uploadResponse.json();
            setUploadResults(uploadResult);

        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
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
            default: return '📁';
        }
    };

    const handleSubscribe = async () => {
        try {
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
                        <h2>Upload & Analyze Directory</h2>
                        <button onClick={onClose} className={styles.closeButton}>✕</button>
                    </div>

                    <div className={styles.content}>
                        {!files.length ? (
                            <div className={styles.uploadSection}>
                                <div className={styles.uploadArea}>
                                    <div className={styles.uploadIcon}>📁</div>
                                    <h3>Select a folder to upload & analyze</h3>
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
                        ) : uploadResults ? (
                            <div className={styles.uploadResultsSection}>
                                {/* Fixed Header */}
                                <div className={styles.uploadResultsHeader}>
                                    <div className={styles.successHeader}>
                                        <div className={styles.successIcon}>✅</div>
                                        <div>
                                            <h3>Upload Complete!</h3>
                                            <p className={styles.successSubtext}>
                                                Files have been securely uploaded and organized by type
                                            </p>
                                        </div>
                                    </div>

                                    {/* Job Summary Card */}
                                    <div className={styles.jobSummaryCard}>
                                        <div className={styles.jobIcon}>📁</div>
                                        <div className={styles.jobDetails}>
                                            <div className={styles.jobName}>{uploadResults.directory_name}</div>
                                            <div className={styles.jobMeta}>
                                                Job #{uploadResults.job_number} • {uploadResults.successful_uploads} of {uploadResults.total_files} files uploaded
                                            </div>
                                        </div>
                                        <div className={styles.uploadStats}>
                                            <div className={styles.statItem}>
                                                <span className={styles.statNumber}>{uploadResults.successful_uploads}</span>
                                                <span className={styles.statLabel}>Uploaded</span>
                                            </div>
                                            {uploadResults.failed_count > 0 && (
                                                <div className={styles.statItem}>
                                                    <span className={styles.statNumber} style={{ color: '#ef4444' }}>
                                                        {uploadResults.failed_count}
                                                    </span>
                                                    <span className={styles.statLabel}>Failed</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Failed Uploads Alert (if any) */}
                                    {uploadResults.failed_uploads.length > 0 && (
                                        <div className={styles.failedUploadsAlert}>
                                            <div className={styles.alertIcon}>⚠️</div>
                                            <div>
                                                <div className={styles.alertTitle}>Some files couldn't be uploaded</div>
                                                <div className={styles.alertMessage}>
                                                    {uploadResults.failed_uploads.join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Scrollable Content */}
                                <div className={styles.scrollableContent}>
                                    <div className={styles.uploadedFilesGrid}>
                                        <h4 className={styles.sectionTitle}>Uploaded Files by Type</h4>
                                        <div className={styles.filesGrid}>
                                            {uploadResults.uploaded_files.map((file, index) => {
                                                const typeInfo = detectContractType(file.filename);
                                                return (
                                                    <div key={index} className={styles.fileCard}>
                                                        <div className={styles.fileCardHeader}>
                                                            <div className={styles.fileTypeChip} style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>
                                                                <span className={styles.fileTypeIcon}>{typeInfo.icon}</span>
                                                                <span className={styles.fileTypeName}>{typeInfo.type}</span>
                                                            </div>
                                                            {file.is_main_contract && (
                                                                <div className={styles.mainContractBadge}>
                                                                    ⭐ Main Contract
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={styles.fileCardBody}>
                                                            <div className={styles.fileName} title={file.filename}>
                                                                {file.filename}
                                                            </div>
                                                            <div className={styles.fileSize}>
                                                                {formatFileSize(file.size)}
                                                            </div>
                                                        </div>
                                                        <div className={styles.fileCardFooter}>
                                                            <div className={styles.uploadStatus}>
                                                                <div className={styles.statusDot}></div>
                                                                <span>Uploaded successfully</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Fixed Footer */}
                                <div className={styles.uploadResultsFooter}>
                                    <div className={styles.actionButtons}>
                                        <button
                                            onClick={() => { setFiles([]); setUploadResults(null); }}
                                            className={styles.primaryButton}
                                        >
                                            <span className={styles.buttonIcon}>📁</span>
                                            Upload More Documents
                                        </button>
                                    </div>
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
                                    {files.map((file, index) => {
                                        const typeInfo = detectContractType(file.name);
                                        return (
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
                                                    <div className={styles.fileType} style={{ color: typeInfo.color }}>
                                                        {typeInfo.icon} {typeInfo.type}
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
                                        );
                                    })}
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
                                        onClick={uploadFiles}
                                        disabled={selectedFiles.size === 0 || isUploading}
                                        className={styles.primaryButton}
                                    >
                                        {isUploading ? 'Uploading...' : `Upload ${selectedFiles.size} Files`}
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