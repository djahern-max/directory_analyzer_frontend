// src/components/layout/ChatArea.jsx
import React from 'react';
import styles from './ChatArea.module.css';

function ChatArea({ selectedContract, user }) {
    if (!selectedContract) {
        return (
            <div className={styles.welcomeArea}>
                <div className={styles.welcomeContent}>
                    <h1 className={styles.welcomeTitle}>Select a document to get started</h1>
                    <p>Choose a document from the sidebar to analyze it with AI.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chatArea}>
            <div className={styles.chatHeader}>
                <div className={styles.contractTitle}>{selectedContract.name}</div>
                <div className={styles.contractMeta}>
                    Job #{selectedContract.jobNumber} • Ready for analysis
                </div>
            </div>

            <div className={styles.messagesArea}>
                <div className={styles.initialMessage}>
                    <div className={styles.messageAvatar}>🤖</div>
                    <div className={styles.messageContent}>
                        Document loaded: "{selectedContract.name}"
                        <br /><br />
                        AI analysis coming soon...
                    </div>
                </div>
            </div>

            <div className={styles.inputArea}>
                <div className={styles.inputContainer}>
                    <textarea
                        placeholder="AI chat will be available here soon..."
                        className={styles.messageInput}
                        rows={1}
                        disabled
                    />
                    <button
                        className={styles.sendButton}
                        disabled
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatArea;