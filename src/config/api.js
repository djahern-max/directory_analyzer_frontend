// src/config/api.js

// API Configuration
const API_CONFIG = {
    // Use environment variable or fallback to production URL WITHOUT /api suffix
    BASE_URL: import.meta.env.VITE_API_URL || 'https://pdfcontractanalyzer.com',

    // Development override (when running locally)
    DEV_BASE_URL: 'http://159.65.177.29:8000',

    // Determine which URL to use
    getBaseUrl() {
        // If we're in development and the dev URL is available, use it
        if (import.meta.env.DEV && this.DEV_BASE_URL) {
            return this.DEV_BASE_URL;
        }
        return this.BASE_URL;
    }
};

// API endpoints - ALL CONSISTENT NOW (no /api prefix anywhere)
export const API_ENDPOINTS = {
    DIRECTORIES: {
        LIST: '/directories/list',
        CONTRACTS: (jobNumber) => `/directories/jobs/${jobNumber}/contracts`, // FIXED: removed /api
        ANALYZE: '/directories/analyze',
        UPLOAD: '/directories/upload',
        IDENTIFY_MAIN: '/directories/identify-main-contract',
        SERVICE_STATUS: '/directories/service-status'
    },
    AUTH: {
        ME: '/auth/me',
        GOOGLE: '/auth/google'
    },
    DOCUMENTS: {
        LOAD: '/documents/load',
        CHAT: '/documents/chat',
        CHAT_HISTORY: (jobNumber, documentId) => `/documents/chat-history/${jobNumber}/${documentId}`,
        SUGGEST_QUESTIONS: '/documents/suggest-questions'
    },
    PAYMENTS: {
        CREATE_CHECKOUT: '/payments/create-checkout-session',
        VERIFY_SESSION: '/payments/verify-session',
        SUBSCRIPTION_STATUS: '/payments/subscription-status',
        PORTAL_SESSION: '/payments/portal-session'
    }
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint) => {
    return `${API_CONFIG.getBaseUrl()}${endpoint}`;
};

export default API_CONFIG;