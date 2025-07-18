// src/components/layout/ChatLayout.jsx - Updated to pass refresh function
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import styles from './ChatLayout.module.css';

function ChatLayout({ user, onLogout, refreshPremiumStatus }) {
    const [selectedContract, setSelectedContract] = useState(null);
    const [contracts, setContracts] = useState([
        // Sample contracts - you'll replace this with real data
        {
            id: 1,
            name: "Bridge Construction - Main Contract",
            jobNumber: "2315",
            uploadDate: "2024-01-15",
            status: "analyzed"
        },
        {
            id: 2,
            name: "Highway Expansion - Amendment 3",
            jobNumber: "2316",
            uploadDate: "2024-01-16",
            status: "analyzing"
        }
    ]);

    return (
        <div className={styles.layout}>
            <Sidebar
                user={user}
                onLogout={onLogout}
                contracts={contracts}
                selectedContract={selectedContract}
                onSelectContract={setSelectedContract}
                refreshPremiumStatus={refreshPremiumStatus}
            />
            <ChatArea
                selectedContract={selectedContract}
                user={user}
            />
        </div>
    );
}

export default ChatLayout;