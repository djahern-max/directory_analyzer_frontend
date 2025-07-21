import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api';

const JobsBrowser = ({ user }) => {
    const [currentView, setCurrentView] = useState('jobs'); // 'jobs' or 'documents'
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Extract just the job number from job_number field
    const extractJobNumber = (jobNumber) => {
        // For "2217 - Cambridge St. D6 Sched..." return "2217"
        // For "2506 - Washington St. Girders..." return "2506"
        const match = jobNumber.match(/^(\d+)/);
        return match ? match[1] : jobNumber;
    };

    // Fetch jobs from API
    const fetchJobs = async () => {
        setLoading(true);
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
            setLoading(false);
        }
    };

    // Fetch documents for a job
    const fetchJobDocuments = async (jobNumber) => {
        setLoading(true);
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
                setDocuments(data.contracts || []);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchJobs();
        }
    }, [user]);

    const handleJobClick = async (job) => {
        setSelectedJob(job);
        setCurrentView('documents');
        await fetchJobDocuments(job.job_number);
    };

    const handleBackToJobs = () => {
        setCurrentView('jobs');
        setSelectedJob(null);
        setDocuments([]);
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }

    // Jobs View
    if (currentView === 'jobs') {
        return (
            <div style={{ padding: '20px' }}>
                <h1 style={{ marginBottom: '20px' }}>Jobs</h1>

                {jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No jobs found.
                    </div>
                ) : (
                    <div>
                        {jobs.map((job) => (
                            <div
                                key={job.id || job.job_number}
                                onClick={() => handleJobClick(job)}
                                style={{
                                    padding: '15px',
                                    margin: '10px 0',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                            >
                                {extractJobNumber(job.job_number)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Documents View
    return (
        <div style={{ padding: '20px' }}>
            {/* Back button */}
            <button
                onClick={handleBackToJobs}
                style={{
                    marginBottom: '20px',
                    padding: '10px 15px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                ← Back to Jobs
            </button>

            <h1 style={{ marginBottom: '20px' }}>
                Job {extractJobNumber(selectedJob?.job_number)} - Documents
            </h1>

            {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No documents found for this job.
                </div>
            ) : (
                <div>
                    {documents.map((doc, index) => (
                        <div
                            key={doc.id || index}
                            style={{
                                padding: '15px',
                                margin: '10px 0',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                {doc.filename || `Document ${index + 1}`}
                            </div>
                            {doc.is_main_contract && (
                                <div style={{ color: '#28a745', fontSize: '12px', fontWeight: 'bold' }}>
                                    Main Contract
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JobsBrowser;