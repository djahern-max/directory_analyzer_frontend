// src/config/api.js

// API Configuration
const API_CONFIG = {
    // Use environment variable or fallback to production URL
    BASE_URL: import.meta.env.VITE_API_URL || 'https://pdfcontractanalyzer.com/api',

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

// API endpoints
export const API_ENDPOINTS = {
    DIRECTORIES: {
        LIST: '/directories/list',
        ANALYZE: '/directories/analyze',
        UPLOAD: '/directories/upload',
        IDENTIFY_MAIN: '/directories/identify-main-contract',
        SERVICE_STATUS: '/directories/service-status'
    },
    AUTH: {
        ME: '/auth/me',
        GOOGLE: '/auth/google'
    }
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint) => {
    return `${API_CONFIG.getBaseUrl()}${endpoint}`;
};

export default API_CONFIG;