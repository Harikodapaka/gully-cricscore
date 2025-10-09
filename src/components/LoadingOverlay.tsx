import React from 'react';

interface LoadingOverlayProps { }

const LoadingOverlay: React.FC<LoadingOverlayProps> = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-auto">
        <div
            className="
                h-12 w-12 
                border-4 border-t-4 border-gray-200 
                border-t-orange-500 
                rounded-full 
                animate-spin
                dark:border-t-blue-900
            "
        />
    </div>
);

export default LoadingOverlay;
