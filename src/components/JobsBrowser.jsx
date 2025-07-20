import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api';

const JobsBrowser = ({ user }) => {
    const [currentView, setCurrentView] = useState('jobs'); // 'jobs' or 'documents'
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

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
            // URL encode the job number since it contains spaces and special characters
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }

    // Jobs View
    if (currentView === 'jobs') {
        return (
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Jobs</h1>

                {jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No jobs found. Upload documents to create your first job.
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                        Job Number
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                        Job Name
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                        Client
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                        Contracts
                                    </th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                        Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => (
                                    <tr
                                        key={job.id || job.job_number}
                                        onClick={() => handleJobClick(job)}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #eee'
                                        }}
                                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '12px', fontWeight: '500' }}>
                                            {job.job_number}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {job.job_name || `Job ${job.job_number}`}
                                        </td>
                                        <td style={{ padding: '12px', color: '#666' }}>
                                            {job.client_name || 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                backgroundColor: job.has_main_contract ? '#e6f7ff' : '#fff7e6',
                                                color: job.has_main_contract ? '#1890ff' : '#fa8c16',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px'
                                            }}>
                                                {job.total_contracts || 0} documents
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                                            {formatDate(job.updated_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    }

    // Documents View
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                <span
                    onClick={handleBackToJobs}
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                >
                    Jobs
                </span>
                <span style={{ margin: '0 8px' }}>›</span>
                <span>{selectedJob?.job_number}</span>
                <span style={{ margin: '0 8px' }}>›</span>
                <span>Documents</span>
            </div>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0' }}>
                        {selectedJob?.job_name || `Job ${selectedJob?.job_number}`}
                    </h1>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                        Job #{selectedJob?.job_number}
                    </p>
                </div>
                <button
                    onClick={handleBackToJobs}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    ← Back to Jobs
                </button>
            </div>

            {/* Documents */}
            {documents.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    No documents found for this job.
                </div>
            ) : (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                    Document
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                    Type
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                    Size
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '500', color: '#555' }}>
                                    Uploaded
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc, index) => (
                                <tr
                                    key={doc.id || index}
                                    style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #eee'
                                    }}
                                    onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ marginRight: '8px', fontSize: '16px' }}>📄</span>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {doc.filename || `Document ${index + 1}`}
                                                </div>
                                                {doc.is_main_contract && (
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#52c41a',
                                                        fontWeight: '500'
                                                    }}>
                                                        Main Contract
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {doc.contract_type || 'Unknown'}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {formatFileSize(doc.file_size)}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                                        {formatDate(doc.upload_date)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default JobsBrowser;