"use client";

import { useState, useCallback } from "react";

export type ToastType = "info" | "success" | "error";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let toastId = 0;

export function useToaster() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return { toasts, showToast };
}

export default function Toaster({ position = "top-center" }: { position?: "top-center" | "top-right" | "top-left" | "bottom-center" | "bottom-right" | "bottom-left" }) {
    const positions: Record<string, string> = {
        "top-center": "top-4 left-1/2 -translate-x-1/2",
        "top-right": "top-4 right-4",
        "top-left": "top-4 left-4",
        "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
        "bottom-right": "bottom-4 right-4",
        "bottom-left": "bottom-4 left-4",
    };
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Listen for custom events to show toasts
    if (typeof window !== "undefined") {
        window.showToast = (message: string, type: ToastType = "info") => {
            const id = ++toastId;
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 2000);
        };
    }

    return (
        <div className={`fixed z-50 ${positions[position]} flex flex-col gap-2 items-center pointer-events-none`}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`px-4 py-2 rounded shadow text-white font-semibold pointer-events-auto transition-all
            ${toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-500" : "bg-blue-500"}`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

declare global {
    interface Window {
        showToast?: (message: string, type?: ToastType) => void;
    }
}
