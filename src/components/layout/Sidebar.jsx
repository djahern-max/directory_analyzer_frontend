// src/components/layout/Sidebar.jsx - Updated with Jobs List
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

    // Extract just the job number from job_number field
    const extractJobNumber = (jobNumber) => {
        const match = jobNumber.match(/^(\d+)/);
        return match ? match[1] : jobNumber;
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

                                    {/* Documents List (show when job is selected) */}
                                    {selectedJob?.job_number === job.job_number && (
                                        <div style={{ marginLeft: '20px', borderLeft: '2px solid #e5e5e5', paddingLeft: '10px' }}>
                                            {loadingDocuments ? (
                                                <div style={{ padding: '8px', color: '#666', fontSize: '12px' }}>
                                                    Loading documents...
                                                </div>
                                            ) : jobDocuments.length === 0 ? (
                                                <div style={{ padding: '8px', color: '#666', fontSize: '12px' }}>
                                                    No documents found.
                                                </div>
                                            ) : (
                                                jobDocuments.map((doc, index) => (
                                                    <div
                                                        key={doc.id || index}
                                                        style={{
                                                            padding: '6px 8px',
                                                            margin: '2px 0',
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                    >
                                                        <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                                                            {doc.filename || doc.original_filename || `Document ${index + 1}`}
                                                        </div>
                                                        {doc.is_main_contract && (
                                                            <div style={{ color: '#28a745', fontSize: '10px', fontWeight: 'bold' }}>
                                                                Main Contract
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
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