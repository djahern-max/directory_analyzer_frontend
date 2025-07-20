// src/components/layout/ChatLayout.jsx - Updated with real API data
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import styles from './ChatLayout.module.css';
import { buildApiUrl } from '../../config/api';

function ChatLayout({ user, onLogout, refreshPremiumStatus }) {
    const [selectedContract, setSelectedContract] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch jobs and contracts from API
    useEffect(() => {
        const fetchJobsAndContracts = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get user's authentication token
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Fetch user's jobs
                const jobsResponse = await fetch(buildApiUrl('/directories/jobs'), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!jobsResponse.ok) {
                    throw new Error(`Failed to fetch jobs: ${jobsResponse.status}`);
                }

                const jobsData = await jobsResponse.json();

                if (!jobsData.success) {
                    throw new Error('Failed to fetch jobs');
                }

                // Transform jobs into contract format for the UI
                const allContracts = [];

                // Process each job to get its contracts
                for (const job of jobsData.jobs) {
                    try {
                        // Fetch contracts for this job
                        const contractsResponse = await fetch(
                            buildApiUrl(`/directories/jobs/${job.job_number}/contracts`),
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );

                        if (contractsResponse.ok) {
                            const contractsData = await contractsResponse.json();

                            if (contractsData.success && contractsData.contracts) {
                                // Transform each contract for the UI
                                contractsData.contracts.forEach((contract, index) => {
                                    // Extract filename from the file_key or id
                                    const fileName = contract.id
                                        ? contract.id.split('/').pop()
                                        : `Contract ${index + 1}`;

                                    // Clean up the filename (remove timestamp prefix if present)
                                    const cleanFileName = fileName.replace(/^\d{8}_\d{6}_[a-f0-9]+_/, '');

                                    allContracts.push({
                                        id: contract.id || `${job.job_number}-${index}`,
                                        name: cleanFileName,
                                        jobNumber: job.job_number,
                                        jobName: job.job_name || `Job ${job.job_number}`,
                                        uploadDate: contract.upload_date || job.last_uploaded || new Date().toISOString(),
                                        status: contract.status || 'uploaded',
                                        contractType: contract.contract_type,
                                        isMainContract: contract.is_main_contract,
                                        fileSize: contract.file_size,
                                        publicUrl: contract.public_url,
                                        fileKey: contract.file_key
                                    });
                                });
                            }
                        } else {
                            console.warn(`Failed to fetch contracts for job ${job.job_number}`);
                        }
                    } catch (contractError) {
                        console.warn(`Error fetching contracts for job ${job.job_number}:`, contractError);
                    }
                }

                // Sort contracts by upload date (most recent first)
                allContracts.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

                setContracts(allContracts);

                // Auto-select the first contract if none selected
                if (allContracts.length > 0 && !selectedContract) {
                    setSelectedContract(allContracts[0]);
                }

            } catch (err) {
                console.error('Error fetching jobs and contracts:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if user is logged in
        if (user) {
            fetchJobsAndContracts();
        }
    }, [user, selectedContract]); // Re-fetch when user changes

    // Refresh function to reload data
    const refreshContracts = () => {
        if (user) {
            setContracts([]); // Clear current data
            setSelectedContract(null);
            // The useEffect will trigger and reload data
        }
    };

    return (
        <div className={styles.layout}>
            <Sidebar
                user={user}
                onLogout={onLogout}
                contracts={contracts}
                selectedContract={selectedContract}
                onSelectContract={setSelectedContract}
                refreshPremiumStatus={refreshPremiumStatus}
                loading={loading}
                error={error}
                onRefresh={refreshContracts}
            />
            <ChatArea
                selectedContract={selectedContract}
                user={user}
                loading={loading}
                error={error}
            />
        </div>
    );
}

export default ChatLayout;