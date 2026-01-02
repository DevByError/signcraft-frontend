// src/contexts/AuthGlobalProvider.tsx
import React, { useEffect, useState } from 'react';
import { authEvents } from '../utils/api';
import SessionExpiredModal, { AuthModalType } from '../components/SessionExpiredModal';

export const AuthGlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modalType, setModalType] = useState<AuthModalType>(null);

    useEffect(() => {
        // Handler for 401
        const handleSessionExpired = () => setModalType('session_expired');

        // Handler for 403
        const handleAccessDenied = () => setModalType('access_denied');

        // Listeners
        authEvents.on('sessionExpired', handleSessionExpired);
        authEvents.on('accessDenied', handleAccessDenied);

        return () => {
            authEvents.off('sessionExpired', handleSessionExpired);
            authEvents.off('accessDenied', handleAccessDenied);
        };
    }, []);

    return (
        <>
            {children}
            <SessionExpiredModal
                type={modalType}
                onClose={() => setModalType(null)}
            />
        </>
    );
};