// src/components/SessionExpiredModal.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, Lock, ArrowLeft } from 'lucide-react';

export type AuthModalType = 'session_expired' | 'access_denied' | null;

interface Props {
    type: AuthModalType; // Accepts 'session_expired' or 'access_denied'
    onClose: () => void;
}

const SessionExpiredModal: React.FC<Props> = ({ type, onClose }) => {
    const navigate = useNavigate();

    if (!type) return null;

    const isSessionError = type === 'session_expired';

    // Dynamic Content Configuration
    const content = {
        title: isSessionError ? 'Session Expired' : 'Access Denied',
        message: isSessionError
            ? 'Your security token is no longer valid. Please log in again to continue.'
            : 'You do not have permission to access this resource or perform this action.',
        icon: isSessionError ? <ShieldAlert className="w-12 h-12 text-red-600" /> : <Lock className="w-12 h-12 text-orange-600" />,
        bgColor: isSessionError ? 'bg-red-100' : 'bg-orange-100',
        primaryBtnText: isSessionError ? 'Log In Again' : 'Go Back',
        primaryBtnIcon: isSessionError ? <LogIn size={20} /> : <ArrowLeft size={20} />,
        primaryAction: () => {
            onClose();
            if (isSessionError) navigate('/login');
            else navigate(-1); // Go back to previous page
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-100 mx-4">

                <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-full ${content.bgColor}`}>
                        {content.icon}
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
                    <p className="text-gray-500">{content.message}</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={content.primaryAction}
                        className="w-full py-3 px-4 bg-primary hover:bg-primaryLight text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                    >
                        {content.primaryBtnIcon}
                        {content.primaryBtnText}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionExpiredModal;