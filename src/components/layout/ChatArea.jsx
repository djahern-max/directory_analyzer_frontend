// src/components/layout/ChatArea.jsx
import React, { useState } from 'react';
import styles from './ChatArea.module.css';

function ChatArea({ selectedContract, user }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !selectedContract) return;

        const userMessage = { role: 'user', content: inputMessage };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        // Simulate AI response - you'll replace this with real API call
        setTimeout(() => {
            const aiResponse = {
                role: 'assistant',
                content: `Based on the ${selectedContract.name} contract, I can help with that. This is where the AI analysis would go for: "${inputMessage}"`
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!selectedContract) {
        return (
            <div className={styles.welcomeArea}>
                <div className={styles.welcomeContent}>
                    <h1 className={styles.welcomeTitle}>What contract can I help with?</h1>

                    <div className={styles.featureCards}>
                        <div className={styles.featureCard}>
                            <div className={styles.cardIcon}>📋</div>
                            <div className={styles.cardTitle}>Analyze Terms</div>
                            <div className={styles.cardDesc}>Review key contract terms and conditions</div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={styles.cardIcon}>💰</div>
                            <div className={styles.cardTitle}>Payment Analysis</div>
                            <div className={styles.cardDesc}>Understand payment schedules and amounts</div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={styles.cardIcon}>📅</div>
                            <div className={styles.cardTitle}>Important Dates</div>
                            <div className={styles.cardDesc}>Find deadlines and milestone dates</div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={styles.cardIcon}>⚠️</div>
                            <div className={styles.cardTitle}>Risk Assessment</div>
                            <div className={styles.cardDesc}>Identify potential risks and liabilities</div>
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
                <div className={styles.contractTitle}>{selectedContract.name}</div>
                <div className={styles.contractMeta}>
                    Job #{selectedContract.jobNumber} • Uploaded {selectedContract.uploadDate}
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
                {messages.length === 0 && (
                    <div className={styles.initialMessage}>
                        <div className={styles.messageAvatar}>🤖</div>
                        <div className={styles.messageContent}>
                            I've loaded "{selectedContract.name}" (Job #{selectedContract.jobNumber}).
                            I can help you analyze this contract. What would you like to know about it?

                            <br /><br />Some things I can help with:
                            <br />• Key terms and conditions
                            <br />• Important dates and deadlines
                            <br />• Payment terms and amounts
                            <br />• Parties involved
                            <br />• Risk assessment
                        </div>
                    </div>
                )}

                {messages.map((message, idx) => (
                    <div key={idx} className={styles.message}>
                        <div className={styles.messageAvatar}>
                            {message.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className={styles.messageContent}>
                            {message.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className={styles.message}>
                        <div className={styles.messageAvatar}>🤖</div>
                        <div className={styles.messageContent}>
                            <div className={styles.loadingDots}>
                                <div></div><div></div><div></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
                <div className={styles.inputContainer}>
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about this contract..."
                        className={styles.messageInput}
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className={styles.sendButton}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatArea;