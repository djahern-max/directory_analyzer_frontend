// src/components/DirectoryAnalyzer.jsx
import React, { useState } from 'react';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import styles from './DirectoryAnalyzer.module.css';

function DirectoryAnalyzer({ onClose, onAnalysisComplete }) {
    const [files, setFiles] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState(new Set());

    const handleDirectorySelect = (event) => {
        const fileList = Array.from(event.target.files);
        setFiles(fileList);
        // Initially select all files
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

        setIsAnalyzing(true);

        try {
            // Get the directory path from the first file's webkitRelativePath
            const firstFile = files[0];
            const directoryPath = firstFile.webkitRelativePath
                ? firstFile.webkitRelativePath.split('/')[0]
                : 'uploaded-folder';

            console.log('Sending request with directory_path:', directoryPath);

            // Try the list endpoint first to see what format is expected
            const listResponse = await fetch(buildApiUrl(API_ENDPOINTS.DIRECTORIES.LIST), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    directory_path: directoryPath
                })
            });

            if (listResponse.ok) {
                const listData = await listResponse.json();
                console.log('List response:', listData);
            } else {
                console.log('List endpoint failed:', await listResponse.text());
            }

            // Call the analyze endpoint with the correct format
            const analyzeResponse = await fetch(buildApiUrl(API_ENDPOINTS.DIRECTORIES.ANALYZE), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    directory_path: directoryPath
                })
            });

            if (!analyzeResponse.ok) {
                const errorData = await analyzeResponse.text();
                console.log('Analyze error response:', errorData);
                throw new Error(`Analysis failed: ${analyzeResponse.status} - ${errorData}`);
            }

            const results = await analyzeResponse.json();
            setAnalysisResults(results);

        } catch (error) {
            console.error('Analysis error:', error);
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

    return (
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
    );
}

export default DirectoryAnalyzer;