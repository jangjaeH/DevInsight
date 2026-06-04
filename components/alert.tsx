'use client';

import { useEffect } from "react";
import { Alert } from 'antd';

interface AlertProps {
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    onClose: () => void;
}

export default function CustomAlert({ message, type, onClose } : AlertProps) {
    useEffect(() => {
        if(message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);
    if (!message) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '999',
            maxWidth: '350px',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <Alert
                message={message}
                type={type}
                showIcon
                closable
                onClose={onClose}
            />
            <style jsx>{`
                @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
