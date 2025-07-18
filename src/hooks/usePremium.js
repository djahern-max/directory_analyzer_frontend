// src/hooks/usePremium.js - Clean version without console logs
import { useState, useEffect, useCallback, useRef } from 'react';

export function usePremiumStatus(user, setUser) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const refreshInProgress = useRef(false);

    const refreshPremiumStatus = useCallback(async () => {
        // Prevent multiple simultaneous refresh attempts
        if (refreshInProgress.current) {
            return false;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            return false;
        }

        refreshInProgress.current = true;
        setIsRefreshing(true);

        try {
            // First, try to refresh the premium status
            const refreshResponse = await fetch('https://pdfcontractanalyzer.com/api/auth/refresh-premium-status', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();

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
                    setUser(freshUserData);

                    return freshUserData.hasPremiumSubscription ||
                        freshUserData.has_premium ||
                        freshUserData.subscription_status === 'active';
                }
            }

            return false;
        } catch (error) {
            console.error('Premium status refresh failed:', error);
            return false;
        } finally {
            setIsRefreshing(false);
            refreshInProgress.current = false;
        }
    }, [setUser]);

    const checkPremiumStatus = useCallback(() => {
        // Check current user premium status with multiple field names for compatibility
        return user?.hasPremiumSubscription ||
            user?.has_premium ||
            (user?.subscription_status === 'active');
    }, [user]);

    return {
        hasPremium: checkPremiumStatus(),
        refreshPremiumStatus,
        isRefreshing
    };
}