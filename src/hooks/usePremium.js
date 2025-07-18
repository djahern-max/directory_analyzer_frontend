// src/hooks/usePremiumStatus.js
import { useState, useEffect, useCallback } from 'react';

export function usePremiumStatus(user, setUser) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshPremiumStatus = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;

        setIsRefreshing(true);
        try {
            console.log('Refreshing premium status...');

            // First, try to refresh the premium status
            const refreshResponse = await fetch('https://pdfcontractanalyzer.com/api/auth/refresh-premium-status', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                console.log('Premium status refreshed:', refreshData);

                // Update token if new one provided
                if (refreshData.token) {
                    localStorage.setItem('auth_token', refreshData.token);
                }

                // Load fresh user data
                const userResponse = await fetch('https://pdfcontractanalyzer.com/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${refreshData.token || token}` }
                });

                if (userResponse.ok) {
                    const freshUserData = await userResponse.json();
                    console.log('Fresh user data loaded:', freshUserData);
                    setUser(freshUserData);
                    return freshUserData.hasPremiumSubscription || freshUserData.has_premium;
                }
            }

            return false;
        } catch (error) {
            console.error('Premium status refresh failed:', error);
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [setUser]);

    const checkPremiumStatus = useCallback(() => {
        // Check current user premium status with multiple field names for compatibility
        return user?.hasPremiumSubscription ||
            user?.has_premium ||
            (user?.subscription_status === 'active');
    }, [user]);

    // Auto-refresh on payment success
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');

        if (paymentStatus === 'success' && user && !checkPremiumStatus()) {
            console.log('Payment success detected, refreshing premium status...');
            refreshPremiumStatus();
        }
    }, [user, checkPremiumStatus, refreshPremiumStatus]);

    return {
        hasPremium: checkPremiumStatus(),
        refreshPremiumStatus,
        isRefreshing
    };
}