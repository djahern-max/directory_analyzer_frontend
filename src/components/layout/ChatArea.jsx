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

    // Load document and chat history when contract changes
    useEffect(() => {
        if (selectedContract) {
            resetChat();
            loadDocument();
            loadChatHistory();
        }
    }, [selectedContract]);

    const resetChat = () => {
        setMessages([]);
        setHasStartedChat(false);
        setInputValue('');
        setDocumentLoaded(false);
        setSuggestedQuestions([]);
        setDocumentInfo(null);
        setError(null);
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const loadDocument = async () => {
        if (!selectedContract) return;

        setLoadingDocument(true);
        setError(null);

        try {
            // Fix field mapping AND extract simple document ID
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;

            // Extract simple document ID - use filename instead of full path
            let documentId = selectedContract.id || selectedContract.document_id || selectedContract.fileKey;

            // If it's a full path, extract just the filename
            if (documentId && documentId.includes('/')) {
                documentId = documentId.split('/').pop();
            }

            // Remove timestamp prefix if present (20250723_001344_8ef313c9_)
            if (documentId && documentId.match(/^\d{8}_\d{6}_[a-f0-9]+_/)) {
                documentId = documentId.replace(/^\d{8}_\d{6}_[a-f0-9]+_/, '');
            }

            const requestData = {
                job_number: jobNumber,
                document_id: documentId
            };

            console.log('Loading document with data:', requestData);
            console.log('Original selected contract:', selectedContract);

            const response = await fetch(buildApiUrl('/documents/load'), {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Premium subscription required for document chat');
                }
                throw new Error(`Failed to load document: ${response.status}`);
            }

            const data = await response.json();

            setDocumentInfo(data.document_info);
            setDocumentLoaded(true);

            // Load suggested questions
            if (data.suggested_questions && data.suggested_questions.length > 0) {
                setSuggestedQuestions(data.suggested_questions);
            } else {
                // Fallback to generating suggestions
                await generateSuggestedQuestions();
            }

        } catch (err) {
            console.error('Error loading document:', err);
            setError(err.message);
        } finally {
            setLoadingDocument(false);
        }
    };

    const generateSuggestedQuestions = async () => {
        try {
            // Fix field mapping and document ID extraction
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;

            let documentId = selectedContract.id || selectedContract.document_id || selectedContract.fileKey;
            if (documentId && documentId.includes('/')) {
                documentId = documentId.split('/').pop();
            }
            if (documentId && documentId.match(/^\d{8}_\d{6}_[a-f0-9]+_/)) {
                documentId = documentId.replace(/^\d{8}_\d{6}_[a-f0-9]+_/, '');
            }

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
            // Use fallback questions
            setSuggestedQuestions([
                "What are the key terms and conditions?",
                "What are the important dates and deadlines?",
                "What is the payment schedule?"
            ]);
        }
    };

    const loadChatHistory = async () => {
        if (!selectedContract) return;

        try {
            // Fix field mapping and document ID extraction for chat history
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;

            let documentId = selectedContract.id || selectedContract.document_id || selectedContract.fileKey;
            if (documentId && documentId.includes('/')) {
                documentId = documentId.split('/').pop();
            }
            if (documentId && documentId.match(/^\d{8}_\d{6}_[a-f0-9]+_/)) {
                documentId = documentId.replace(/^\d{8}_\d{6}_[a-f0-9]+_/, '');
            }

            const response = await fetch(
                buildApiUrl(`/documents/chat-history/${jobNumber}/${encodeURIComponent(documentId)}`),
                {
                    headers: getAuthHeaders()
                }
            );

            if (response.ok) {
                const chatHistory = await response.json();
                if (chatHistory && chatHistory.length > 0) {
                    const formattedMessages = chatHistory.map((msg, index) => ({
                        id: index,
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date(msg.timestamp)
                    }));
                    setMessages(formattedMessages);
                    setHasStartedChat(true);
                }
            }
        } catch (err) {
            console.error('Error loading chat history:', err);
        }
    };

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
            // Fix field mapping and document ID extraction for chat messages
            const jobNumber = selectedContract.jobNumber || selectedContract.job_number;

            let documentId = selectedContract.id || selectedContract.document_id || selectedContract.fileKey;
            if (documentId && documentId.includes('/')) {
                documentId = documentId.split('/').pop();
            }
            if (documentId && documentId.match(/^\d{8}_\d{6}_[a-f0-9]+_/)) {
                documentId = documentId.replace(/^\d{8}_\d{6}_[a-f0-9]+_/, '');
            }

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

    // Error state
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
                <div className={styles.errorState}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h3>Unable to Load Document</h3>
                    <p>{error}</p>
                    <button
                        onClick={loadDocument}
                        className={styles.retryButton}
                    >
                        Try Again
                    </button>
                </div>
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

                {/* Chat messages */}
                {messages.map((message) => (
                    <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
                        <div className={styles.messageAvatar}>
                            {message.role === 'user' ? (
                                <div className={styles.userAvatar}>
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            ) : (
                                <div className={styles.assistantAvatar}>🤖</div>
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

                {/* Loading indicator */}
                {isLoading && (
                    <div className={`${styles.message} ${styles.assistant}`}>
                        <div className={styles.messageAvatar}>
                            <div className={styles.assistantAvatar}>🤖</div>
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