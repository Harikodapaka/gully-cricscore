export const showToast = (message: string, type: 'success' | 'error') => {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(message, type);
    }
};

