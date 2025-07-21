// src/components/layout/Sidebar.jsx - Updated with document click handlers
import React, { useState, useEffect } from 'react';
import DirectoryAnalyzer from '../DirectoryAnalyzer';
import { buildApiUrl } from '../../config/api';

import styles from './Sidebar.module.css';

function Sidebar({ user, onLogout, contracts, selectedContract, onSelectContract, refreshPremiumStatus }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showDirectoryAnalyzer, setShowDirectoryAnalyzer] = useState(false);

    // Jobs state
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobDocuments, setJobDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);

    // State for expanded classifications
    const [expandedClassifications, setExpandedClassifications] = useState({});

    // Extract just the job number from job_number field
    const extractJobNumber = (jobNumber) => {
        const match = jobNumber.match(/^(\d+)/);
        return match ? match[1] : jobNumber;
    };

    // Extract filename from file path
    const extractFilename = (doc) => {
        if (doc.id) {
            // The id contains the full path, extract just the filename
            const parts = doc.id.split('/');
            const filename = parts[parts.length - 1]; // Get the last part

            console.log('Processing filename:', filename);

            // Remove the timestamp prefix pattern: 20250721_002410_23c00187_
            let cleanName = filename.replace(/^\d{8}_\d{6}_[a-f0-9]+_/, '');
            console.log('After timestamp removal:', cleanName);

            // Remove job number prefix like "2215 - PNSY DD2 Cassion - KUNJ_"
            cleanName = cleanName.replace(/^\d{4}\s*-\s*[^_]*_/, '');
            console.log('After job prefix removal:', cleanName);

            return cleanName;
        }
        return `Document ${Math.random()}`;
    };

    // Group documents by classification
    const groupDocumentsByClassification = (documents) => {
        const grouped = {};
        documents.forEach(doc => {
            // Extract classification from the file path
            const pathParts = doc.id.split('/');
            const classification = pathParts[pathParts.length - 2]; // The folder before the filename

            if (!grouped[classification]) {
                grouped[classification] = [];
            }
            grouped[classification].push(doc);
        });
        return grouped;
    };

    // Handle classification toggle
    const handleClassificationToggle = (jobNumber, classification) => {
        const key = `${jobNumber}-${classification}`;
        setExpandedClassifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Fetch jobs from API
    const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(buildApiUrl('/directories/jobs'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setJobs(data.jobs || []);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoadingJobs(false);
        }
    };

    // Fetch documents for a specific job
    const fetchJobDocuments = async (jobNumber) => {
        setLoadingDocuments(true);
        try {
            const token = localStorage.getItem('auth_token');
            const encodedJobNumber = encodeURIComponent(jobNumber);
            const response = await fetch(buildApiUrl(`/directories/jobs/${encodedJobNumber}/contracts`), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Documents API response:', data);
                console.log('Contracts array:', data.contracts);
                setJobDocuments(data.contracts || []);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
        } finally {
            setLoadingDocuments(false);
        }
    };

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

    // Fetch jobs when user is available
    useEffect(() => {
        if (user) {
            fetchJobs();
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

    // Handle job click
    const handleJobClick = async (job) => {
        if (selectedJob?.job_number === job.job_number) {
            // If clicking the same job, collapse it
            setSelectedJob(null);
            setJobDocuments([]);
        } else {
            // Select new job and fetch its documents
            setSelectedJob(job);
            await fetchJobDocuments(job.job_number);
        }
    };

    // NEW: Handle document click
    const handleDocumentClick = (doc) => {
        // Create a contract object in the format expected by ChatArea
        const contractData = {
            id: doc.id,
            name: extractFilename(doc),
            job_number: selectedJob.job_number,
            document_count: 1,
            isMainContract: doc.is_main_contract,
            fileKey: doc.file_key || doc.id,
            // Add any other properties your ChatArea component expects
        };
        console.log('Document clicked:', contractData);
        handleContractSelect(contractData);
    };

    const handleAnalysisComplete = (results) => {
        console.log('Directory analysis results:', results);
        // Refresh jobs after upload
        fetchJobs();
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
                    <button
                        className={styles.newButton}
                        onClick={() => setShowDirectoryAnalyzer(true)}
                    >
                        📄 Upload Documents
                    </button>
                </div>

                {/* Jobs List */}
                <div className={styles.contractsSection}>
                    <div className={styles.sectionLabel}>JOBS</div>

                    <div className={styles.contractsList}>
                        {loadingJobs ? (
                            <div style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                                Loading jobs...
                            </div>
                        ) : jobs.length === 0 ? (
                            <div style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                                No jobs found.
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id || job.job_number}>
                                    {/* Job Item */}
                                    <div
                                        className={`${styles.contractItem} ${selectedJob?.job_number === job.job_number ? styles.selected : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            console.log('Clicked job:', job.job_number);
                                            handleJobClick(job);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.contractName}>
                                            {extractJobNumber(job.job_number)}
                                        </div>
                                        <div className={styles.contractMeta}>
                                            <span>{job.total_contracts || 0} docs</span>
                                            <span style={{ fontSize: '12px' }}>
                                                {selectedJob?.job_number === job.job_number ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Documents List grouped by classification (show when job is selected) */}
                                    {selectedJob?.job_number === job.job_number && (
                                        <div style={{ marginLeft: '10px', borderLeft: '2px solid #e5e5e5', paddingLeft: '10px' }}>
                                            {loadingDocuments ? (
                                                <div style={{ padding: '8px', color: '#666', fontSize: '12px' }}>
                                                    Loading documents...
                                                </div>
                                            ) : jobDocuments.length === 0 ? (
                                                <div style={{ padding: '8px', color: '#666', fontSize: '12px' }}>
                                                    No documents found.
                                                </div>
                                            ) : (
                                                (() => {
                                                    const groupedDocs = groupDocumentsByClassification(jobDocuments);
                                                    return Object.entries(groupedDocs).map(([classification, docs]) => (
                                                        <div key={classification} style={{ marginBottom: '8px' }}>
                                                            {/* Classification Header */}
                                                            <div
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#e9ecef',
                                                                    borderRadius: '4px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 'bold',
                                                                    cursor: 'pointer',
                                                                    textTransform: 'uppercase',
                                                                    color: '#495057'
                                                                }}
                                                                onClick={() => handleClassificationToggle(job.job_number, classification)}
                                                            >
                                                                <span style={{ marginRight: '4px' }}>
                                                                    {expandedClassifications[`${job.job_number}-${classification}`] ? '▼' : '▶'}
                                                                </span>
                                                                {classification.replace('_', ' ')} ({docs.length})
                                                            </div>

                                                            {/* Documents in this classification - FIXED WITH CLICK HANDLERS */}
                                                            {expandedClassifications[`${job.job_number}-${classification}`] && (
                                                                <div style={{ marginLeft: '15px', marginTop: '4px' }}>
                                                                    {docs.map((doc, index) => (
                                                                        <div
                                                                            key={doc.id || index}
                                                                            onClick={() => handleDocumentClick(doc)}  // ← ADDED CLICK HANDLER
                                                                            style={{
                                                                                padding: '4px 6px',
                                                                                margin: '2px 0',
                                                                                backgroundColor: '#f8f9fa',
                                                                                borderRadius: '3px',
                                                                                fontSize: '11px',
                                                                                cursor: 'pointer',
                                                                                transition: 'background-color 0.2s'  // ← ADDED TRANSITION
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.target.style.backgroundColor = '#e9ecef';
                                                                            }}
                                                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                                            title={extractFilename(doc)}
                                                                        >
                                                                            <div style={{ fontWeight: '500', marginBottom: '1px' }}>
                                                                                {(() => {
                                                                                    const filename = extractFilename(doc);
                                                                                    return filename.length > 20 ?
                                                                                        filename.substring(0, 17) + '...' : filename;
                                                                                })()}
                                                                            </div>
                                                                            {doc.is_main_contract && (
                                                                                <div style={{ color: '#28a745', fontSize: '9px', fontWeight: 'bold' }}>
                                                                                    Main Contract
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ));
                                                })()
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
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
                    user={user}
                    refreshPremiumStatus={refreshPremiumStatus}
                />
            )}
        </>
    );
}

export default Sidebar;