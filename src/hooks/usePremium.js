// src/hooks/usePremium.js - Fixed version with better state management
import { useState, useEffect, useCallback, useRef } from 'react';

export function usePremiumStatus(user, setUser) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const refreshInProgress = useRef(false);

    const refreshPremiumStatus = useCallback(async () => {
        // Prevent multiple simultaneous refresh attempts
        if (refreshInProgress.current) {
            console.log('Premium refresh already in progress, skipping...');
            return false;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.log('No auth token for premium refresh');
            return false;
        }

        refreshInProgress.current = true;
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
                console.log('Premium status refreshed:', {
                    has_premium: refreshData.has_premium,
                    subscription_status: refreshData.subscription_status
                });

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
                    console.log('Fresh user data loaded:', {
                        email: freshUserData.email,
                        has_premium: freshUserData.has_premium,
                        hasPremiumSubscription: freshUserData.hasPremiumSubscription,
                        subscription_status: freshUserData.subscription_status
                    });

                    setUser(freshUserData);

                    return freshUserData.hasPremiumSubscription ||
                        freshUserData.has_premium ||
                        freshUserData.subscription_status === 'active';
                }
            } else {
                console.error('Premium refresh failed:', refreshResponse.status);
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
        const hasPremium = user?.hasPremiumSubscription ||
            user?.has_premium ||
            (user?.subscription_status === 'active');

        console.log('Premium status check:', {
            user_email: user?.email,
            hasPremiumSubscription: user?.hasPremiumSubscription,
            has_premium: user?.has_premium,
            subscription_status: user?.subscription_status,
            result: hasPremium
        });

        return hasPremium;
    }, [user]);

    // Remove the auto-refresh effect to prevent loops
    // The App component will handle payment success detection

    return {
        hasPremium: checkPremiumStatus(),
        refreshPremiumStatus,
        isRefreshing
    };
}