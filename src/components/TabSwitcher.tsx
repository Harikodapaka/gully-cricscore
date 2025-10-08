'use client'

import { ReactNode, useState } from 'react';

interface TabSwitcherProps {
    tabs: string[];
    ativeTab?: number;
    onChange: (index: number, label: string) => void;
    className?: string;
    activeColor?: string;
    inactiveTextColor?: string;
    activeTextColor?: string;
    bgColor?: string;
}

export function TabSwitcher({
    tabs,
    ativeTab = 0,
    onChange,
    className = '',
    activeColor = 'bg-blue-600',
    inactiveTextColor = 'text-gray-700',
    activeTextColor = 'text-white',
    bgColor = 'bg-gray-200'
}: TabSwitcherProps) {
    const [active, setActive] = useState(ativeTab);

    const handleTabClick = (idx: number) => {
        setActive(idx);
        onChange?.(idx, tabs[idx]);
    };

    return (
        <div className={`relative w-full max-w-lg h-10 rounded-full ${bgColor} flex p-1 ${className}`}>
            <span
                className={`absolute top-1 h-8 ${activeColor} rounded-full shadow transition-all duration-300`}
                style={{
                    left: `${(active * (100 / tabs.length) + 2)}%`,
                    width: `${(100 / tabs.length) - 4}%`
                }}
            />

            {tabs.map((tab: ReactNode, idx: number) => (
                <button
                    key={idx}
                    className={`flex-1 relative z-10 text-center font-medium transition-colors ${active === idx ? activeTextColor : inactiveTextColor
                        }`}
                    onClick={() => handleTabClick(idx)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
