// src/contexts/AuthGlobalProvider.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authEvents } from '../utils/api';
import Swal from 'sweetalert2';

export const AuthGlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Handler for 401
        const handleSessionExpired = () => {
            Swal.fire({
                title: 'Session Expired',
                text: 'Your security token is no longer valid. Please log in again to continue.',
                icon: 'warning',
                confirmButtonText: 'Log In Again',
                confirmButtonColor: '#d33',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                navigate('/login');
            });
        };

        // Handler for 403
        const handleAccessDenied = () => {
            Swal.fire({
                title: 'Access Denied',
                text: 'You do not have permission to access this resource.',
                icon: 'error',
                confirmButtonText: 'Go Back'
            }).then(() => {
                navigate(-1);
            });
        };

        // Listeners
        authEvents.on('sessionExpired', handleSessionExpired);
        authEvents.on('accessDenied', handleAccessDenied);

        return () => {
            authEvents.off('sessionExpired', handleSessionExpired);
            authEvents.off('accessDenied', handleAccessDenied);
        };
    }, [navigate]);

    return (
        <>
            {children}
        </>
    );
};