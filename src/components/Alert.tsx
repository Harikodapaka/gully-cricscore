import React, { ReactNode } from 'react';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
    variant?: AlertVariant;
    title: ReactNode;
    message?: ReactNode;
    icon?: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

const VARIANT_STYLES = {
    error: {
        border: 'border-red-700',
        background: 'bg-red-50',
        text: 'text-red-700',
    },
    warning: {
        border: 'border-yellow-600',
        background: 'bg-yellow-50',
        text: 'text-yellow-700',
    },
    success: {
        border: 'border-green-600',
        background: 'bg-green-50',
        text: 'text-green-700',
    },
    info: {
        border: 'border-blue-600',
        background: 'bg-blue-50',
        text: 'text-blue-700',
    },
} as const;

const DefaultIcons = {
    error: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
            />
        </svg>
    ),
    warning: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
            />
        </svg>
    ),
    success: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
            />
        </svg>
    ),
    info: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
            />
        </svg>
    ),
};

export default function Alert({
    variant = 'error',
    title,
    message,
    icon,
    onClose,
    className = '',
}: AlertProps) {
    const styles = VARIANT_STYLES[variant];
    const displayIcon = icon ?? DefaultIcons[variant];

    return (
        <div
            role="alert"
            className={`border-s-4 ${styles.border} ${styles.background} p-4 ${className}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className={`flex items-center gap-2 ${styles.text}`}>
                    {displayIcon}
                    <strong className="font-medium">{title}</strong>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className={`${styles.text} opacity-70 hover:opacity-100 transition-opacity`}
                        aria-label="Close alert"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {message && (
                <p className={`mt-2 text-sm ${styles.text}`}>
                    {message}
                </p>
            )}
        </div>
    );
}