// src/components/layout/ChatArea.jsx - Enhanced with real API integration
import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatArea.module.css';
import { buildApiUrl } from '../../config/api';

function ChatArea({ selectedContract, user }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const [suggestedQuestions, setSuggestedQuestions] = useState([]);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [loadingDocument, setLoadingDocument] = useState(false);
    const [documentInfo, setDocumentInfo] = useState(null);
    const [error, setError] = useState(null);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll to bottom when new messages are added
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputValue]);

    // Reset chat state
    const resetChat = () => {
        setMessages([]);
        setHasStartedChat(false);
        setInputValue('');
        setDocumentLoaded(false);
        setSuggestedQuestions([]);
        setDocumentInfo(null);
        setError(null);
    };

    // Get auth headers with validation
    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            console.error('❌ No auth token found in localStorage');
            throw new Error('Authentication token not found. Please log in again.');
        }

        console.log('✅ Auth token found, length:', token.length);

        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Validate contract data
    const validateContractData = (contract) => {
        if (!contract) {
            return { valid: false, error: 'No contract provided' };
        }

        const jobNumber = contract.jobNumber || contract.job_number;
        const documentId = contract.fileKey || contract.file_key || contract.id;

        if (!jobNumber) {
            return { valid: false, error: 'Job number is missing from contract data' };
        }

        if (!documentId) {
            return { valid: false, error: 'Document ID is missing from contract data' };
        }

        return { valid: true };
    };

    // Debug contract data
    const debugContractData = () => {
        console.group('🔍 Contract Debug Info');
        console.log('selectedContract:', selectedContract);
        console.log('Contract keys:', selectedContract ? Object.keys(selectedContract) : 'No contract');

        if (selectedContract) {
            console.log('jobNumber:', selectedContract.jobNumber);
            console.log('job_number:', selectedContract.job_number);
            console.log('fileKey:', selectedContract.fileKey);
            console.log('file_key:', selectedContract.file_key);
            console.log('id:', selectedContract.id);
            console.log('name:', selectedContract.name);
        }
        console.groupEnd();
    };

    // Enhanced error display component
    const ErrorDisplay = ({ error, onRetry }) => (
        <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Unable to Load Document</h3>
            <div className={styles.errorDetails}>
                <p><strong>Error:</strong> {error}</p>
                <details style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    <summary>Debug Information</summary>
                    <pre style={{
                        background: '#f5f5f5',
                        padding: '10px',
                        borderRadius: '4px',
                        marginTop: '5px',
                        overflow: 'auto',
                        maxHeight: '200px'
                    }}>
                        {JSON.stringify({
                            selectedContract: selectedContract,
                            jobNumber: selectedContract?.jobNumber || selectedContract?.job_number,
                            documentId: selectedContract?.fileKey || selectedContract?.file_key || selectedContract?.id,
                            apiUrl: buildApiUrl('/documents/load'),
                            hasAuthToken: !!localStorage.getItem('auth_token')
                        }, null, 2)}
                    </pre>
                </details>
            </div>
            <div className={styles.errorActions}>
                <button onClick={onRetry} className={styles.retryButton}>
                    Try Again
                </button>
                <button onClick={debugContractData} className={styles.debugButton}>
                    Debug Contract Data
                </button>
            </div>
        </div>
    );

    // Load document function
    const loadDocument = async () => {
        if (!selectedContract) {
            console.error('No contract selected');
            return;
        }

        setLoadingDocument(true);
        setError(null);

        try {
            // Extract job number and document ID with more robust checking
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;
            const documentId = selectedContract.fileKey || selectedContract.file_key || selectedContract.id;

            console.log('Selected contract object:', selectedContract);
            console.log('Extracted job number:', jobNumber);
            console.log('Extracted document ID:', documentId);

            // Validate required fields
            if (!jobNumber) {
                throw new Error('Job number not found in contract data');
            }
            if (!documentId) {
                throw new Error('Document ID not found in contract data');
            }

            const requestData = {
                job_number: jobNumber,
                document_id: documentId
            };

            console.log('Sending request to /documents/load with data:', requestData);

            const response = await fetch(buildApiUrl('/documents/load'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);

            // Get response text for better error debugging
            const responseText = await response.text();
            console.log('Response body:', responseText);

            if (!response.ok) {
                let errorMessage = `Failed to load document: ${response.status}`;

                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.detail || errorMessage;
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                    errorMessage = `Server error: ${response.status} - ${responseText}`;
                }

                if (response.status === 403) {
                    errorMessage = 'Premium subscription required for document chat';
                }

                throw new Error(errorMessage);
            }

            // Parse successful response
            const data = JSON.parse(responseText);
            console.log('Parsed response data:', data);

            setDocumentInfo(data.document_info);
            setDocumentLoaded(true);

            // Load suggested questions
            if (data.suggested_questions && data.suggested_questions.length > 0) {
                setSuggestedQuestions(data.suggested_questions);
            } else {
                await generateSuggestedQuestions();
            }

            console.log('Document loaded successfully:', data.document_info);

        } catch (err) {
            console.error('Error loading document:', err);
            setError(err.message);
        } finally {
            setLoadingDocument(false);
        }
    };

    // Generate suggested questions
    const generateSuggestedQuestions = async () => {
        try {
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;
            const documentId = selectedContract.fileKey || selectedContract.file_key || selectedContract.id;

            const requestData = {
                job_number: jobNumber,
                document_id: documentId
            };

            const response = await fetch(buildApiUrl('/documents/suggest-questions'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.suggested_questions) {
                    setSuggestedQuestions(data.suggested_questions);
                }
            }
        } catch (err) {
            console.error('Error generating suggested questions:', err);
            setSuggestedQuestions([
                "What are the key terms and conditions?",
                "What are the important dates and deadlines?",
                "What is the payment schedule?"
            ]);
        }
    };

    // Load chat history
    const loadChatHistory = async () => {
        if (!selectedContract) return;

        try {
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;
            const documentId = selectedContract.fileKey || selectedContract.file_key || selectedContract.id;

            const response = await fetch(buildApiUrl('/documents/chat-history'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    job_number: jobNumber,
                    document_id: documentId,
                    hours_back: 24
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.chat_history && data.chat_history.length > 0) {
                    const formattedMessages = data.chat_history.map((msg, index) => ({
                        id: index,
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date(msg.timestamp)
                    }));
                    setMessages(formattedMessages);
                    setHasStartedChat(true);
                    console.log(`Loaded ${data.message_count} messages from last ${data.time_window_hours} hours`);
                }
            }
        } catch (err) {
            console.error('Error loading chat history:', err);
        }
    };

    // Load document and chat history when contract changes
    useEffect(() => {
        if (selectedContract) {
            const validation = validateContractData(selectedContract);

            if (!validation.valid) {
                setError(validation.error);
                console.error('Contract validation failed:', validation.error);
                debugContractData();
                return;
            }

            resetChat();
            loadDocument();
            loadChatHistory();
        }
    }, [selectedContract]);

    // Debug contract changes
    useEffect(() => {
        if (selectedContract) {
            console.log('🔄 Contract changed, debugging...');
            debugContractData();
        }
    }, [selectedContract]);

    // Send message function
    const sendMessage = async (messageText) => {
        if (!selectedContract || !documentLoaded) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setHasStartedChat(true);

        try {
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;
            const documentId = selectedContract.fileKey || selectedContract.file_key || selectedContract.id;

            const requestData = {
                job_number: jobNumber,
                document_id: documentId,
                message: messageText,
                chat_history: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp
                }))
            };

            const response = await fetch(buildApiUrl('/documents/chat'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Premium subscription required');
                }
                throw new Error(`Chat failed: ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.message,
                timestamp: new Date(data.timestamp),
                confidence: data.confidence,
                source: data.response_source
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (err) {
            console.error('Error sending message:', err);

            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const messageText = inputValue.trim();
        setInputValue('');
        await sendMessage(messageText);
    };

    const handleSuggestedQuestion = async (question) => {
        setInputValue('');
        await sendMessage(question);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const formatMessage = (content) => {
        return content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    // Welcome screen when no contract is selected
    if (!selectedContract) {
        return (
            <div className={styles.welcomeArea}>
                <div className={styles.welcomeContent}>
                    <h1 className={styles.welcomeTitle}>Contract Analyzer</h1>
                    <p className={styles.welcomeSubtitle}>
                        Select a contract from the sidebar to start asking questions about your documents.
                    </p>
                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>📄</div>
                            <h3>Document Analysis</h3>
                            <p>Ask questions about contract terms, clauses, and conditions</p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>🔍</div>
                            <h3>Quick Insights</h3>
                            <p>Get instant answers about deadlines, payments, and obligations</p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>⚡</div>
                            <h3>Smart Search</h3>
                            <p>Find specific information across all contract documents</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state - NOW USING THE ErrorDisplay COMPONENT
    if (error) {
        return (
            <div className={styles.chatArea}>
                <div className={styles.chatHeader}>
                    <div className={styles.contractInfo}>
                        <h2 className={styles.contractTitle}>{selectedContract.name}</h2>
                        <p className={styles.contractMeta}>
                            Job {selectedContract.jobNumber || selectedContract.job_number}
                        </p>
                    </div>
                </div>
                <ErrorDisplay error={error} onRetry={loadDocument} />
            </div>
        );
    }

    return (
        <div className={styles.chatArea}>
            {/* Contract Header */}
            <div className={styles.chatHeader}>
                <div className={styles.contractInfo}>
                    <h2 className={styles.contractTitle}>{selectedContract.name}</h2>
                    <p className={styles.contractMeta}>
                        Job {selectedContract.jobNumber || selectedContract.job_number} • {selectedContract.document_count || 1} document{(selectedContract.document_count || 1) !== 1 ? 's' : ''}
                    </p>
                    {documentInfo && (
                        <div className={styles.documentStatus}>
                            <span className={styles.statusBadge}>
                                {documentInfo.document_type || 'Contract'}
                            </span>
                            {loadingDocument && (
                                <span className={styles.loadingBadge}>Loading...</span>
                            )}
                            {documentLoaded && (
                                <span className={styles.readyBadge}>Ready</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className={styles.messagesArea}>
                {/* Loading document state */}
                {loadingDocument && (
                    <div className={styles.loadingDocument}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading contract document...</p>
                    </div>
                )}

                {/* Initial prompt with suggested questions */}
                {!hasStartedChat && documentLoaded && (
                    <div className={styles.initialPrompt}>
                        <div className={styles.promptIcon}>💬</div>
                        <h3>Ask me anything about this contract</h3>
                        <p>I can help you understand terms, find important dates, analyze clauses, and more.</p>

                        {suggestedQuestions.length > 0 && (
                            <div className={styles.suggestedQuestions}>
                                {suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        className={styles.suggestionButton}
                                        onClick={() => handleSuggestedQuestion(question)}
                                        disabled={isLoading}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Chat messages - with full width container */}
                <div style={{ width: '100%' }}>
                    {messages.map((message) => (
                        <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
                            <div className={styles.messageAvatar}>
                                {message.role === 'user' ? (
                                    <div className={styles.userAvatar}>
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                ) : (
                                    <div className={styles.assistantAvatar}>⚖️</div>
                                )}
                            </div>
                            <div className={styles.messageContent}>
                                <div className={`${styles.messageText} ${message.isError ? styles.errorMessage : ''}`}>
                                    {formatMessage(message.content)}
                                </div>
                                <div className={styles.messageFooter}>
                                    <div className={styles.messageTime}>
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    {message.confidence && (
                                        <div className={`${styles.confidenceBadge} ${styles[message.confidence.toLowerCase()]}`}>
                                            {message.confidence}
                                        </div>
                                    )}
                                    {message.source && (
                                        <div className={styles.sourceBadge}>
                                            {message.source}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isLoading && (
                    <div className={`${styles.message} ${styles.assistant}`}>
                        <div className={styles.messageAvatar}>
                            <div className={styles.assistantAvatar}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    {/* Head */}
                                    <rect x="7" y="5" width="10" height="8" rx="2" fill="currentColor" stroke="white" strokeWidth="0.5" />

                                    {/* Antenna */}
                                    <circle cx="12" cy="3" r="1" fill="#4ade80">
                                        <animate attributeName="fill" values="#4ade80;#22d3ee;#4ade80" dur="2s" repeatCount="indefinite" />
                                    </circle>
                                    <line x1="12" y1="4" x2="12" y2="5" stroke="currentColor" strokeWidth="1" />

                                    {/* Eyes */}
                                    <circle cx="9.5" cy="8" r="1" fill="white" />
                                    <circle cx="14.5" cy="8" r="1" fill="white" />
                                    <circle cx="9.5" cy="8" r="0.4" fill="#333" />
                                    <circle cx="14.5" cy="8" r="0.4" fill="#333" />

                                    {/* Smile */}
                                    <path d="M 9 10.5 Q 12 12 15 10.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                                    {/* Body */}
                                    <rect x="8" y="13" width="8" height="6" rx="1" fill="currentColor" opacity="0.8" />

                                    {/* Simple details */}
                                    <rect x="10" y="15" width="4" height="1" rx="0.5" fill="white" opacity="0.4" />
                                    <circle cx="12" cy="17" r="0.5" fill="white" opacity="0.6" />
                                </svg>
                            </div>
                        </div>
                        <div className={styles.messageContent}>
                            <div className={styles.loadingDots}>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>



            {/* Input Area */}
            <div className={styles.inputArea}>
                <form onSubmit={handleSubmit} className={styles.inputForm}>
                    <div className={styles.inputContainer}>
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                !documentLoaded
                                    ? "Loading document..."
                                    : `Ask a question about ${selectedContract.name}...`
                            }
                            className={styles.messageInput}
                            rows={1}
                            disabled={isLoading || !documentLoaded}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading || !documentLoaded}
                            className={styles.sendButton}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M7 11L12 6L17 11M12 18V7"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChatArea;