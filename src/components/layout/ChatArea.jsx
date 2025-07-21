// src/components/layout/ChatArea.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatArea.module.css';

function ChatArea({ selectedContract, user }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasStartedChat, setHasStartedChat] = useState(false);
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

    // Reset chat when contract changes
    useEffect(() => {
        if (selectedContract) {
            setMessages([]);
            setHasStartedChat(false);
            setInputValue('');
        }
    }, [selectedContract]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || !selectedContract) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        // Add user message and start chat
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setHasStartedChat(true);

        try {
            // TODO: Replace with actual API call to your backend
            // Simulated API response for now
            setTimeout(() => {
                const assistantMessage = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `I've analyzed your question about ${selectedContract.name}. Here's what I found based on the contract documents:\n\nThis is a placeholder response. The actual implementation would analyze the selected contract documents and provide relevant insights based on your question: "${userMessage.content}"\n\nKey contract details I can help with:\n• Contract terms and conditions\n• Important dates and deadlines\n• Payment schedules\n• Scope of work\n• Risk factors`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
            }, 1500);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsLoading(false);
        }
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

    return (
        <div className={styles.chatArea}>
            {/* Contract Header */}
            <div className={styles.chatHeader}>
                <div className={styles.contractInfo}>
                    <h2 className={styles.contractTitle}>{selectedContract.name}</h2>
                    <p className={styles.contractMeta}>
                        Job {selectedContract.job_number} • {selectedContract.document_count || 1} document{(selectedContract.document_count || 1) !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className={styles.messagesArea}>
                {!hasStartedChat && (
                    <div className={styles.initialPrompt}>
                        <div className={styles.promptIcon}>💬</div>
                        <h3>Ask me anything about this contract</h3>
                        <p>I can help you understand terms, find important dates, analyze clauses, and more.</p>
                        <div className={styles.suggestedQuestions}>
                            <button
                                className={styles.suggestionButton}
                                onClick={() => setInputValue("What are the key terms and conditions in this contract?")}
                            >
                                What are the key terms and conditions?
                            </button>
                            <button
                                className={styles.suggestionButton}
                                onClick={() => setInputValue("What are the important dates and deadlines?")}
                            >
                                What are the important dates and deadlines?
                            </button>
                            <button
                                className={styles.suggestionButton}
                                onClick={() => setInputValue("What is the payment schedule?")}
                            >
                                What is the payment schedule?
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
                        <div className={styles.messageAvatar}>
                            {message.role === 'user' ? (
                                <div className={styles.userAvatar}>{user?.name?.charAt(0) || 'U'}</div>
                            ) : (
                                <div className={styles.assistantAvatar}>🤖</div>
                            )}
                        </div>
                        <div className={styles.messageContent}>
                            <div className={styles.messageText}>
                                {formatMessage(message.content)}
                            </div>
                            <div className={styles.messageTime}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

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
                            placeholder={`Ask a question about ${selectedContract.name}...`}
                            className={styles.messageInput}
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className={styles.sendButton}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChatArea;