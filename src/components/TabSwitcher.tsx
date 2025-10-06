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

// Example usage:
// export default function App() {
//   const [selectedTab, setSelectedTab] = useState(0);

//   return (
//     <div className="min-h-screen bg-gray-50 p-8 space-y-8">
//       <div>
//         <h2 className="text-lg font-semibold mb-2">Basic Example</h2>
//         <TabSwitcher />
//       </div>

//       <div>
//         <h2 className="text-lg font-semibold mb-2">Custom Tabs with Callback</h2>
//         <TabSwitcher 
//           tabs={['Option A', 'Option B', 'Option C']}
//           onChange={(idx, label) => setSelectedTab(idx)}
//         />
//         <p className="mt-2 text-gray-600">Selected: Tab {selectedTab}</p>
//       </div>

//       <div>
//         <h2 className="text-lg font-semibold mb-2">Custom Colors</h2>
//         <TabSwitcher 
//           tabs={['Profile', 'Settings']}
//           ativeTab={1}
//           activeColor="bg-green-500"
//           bgColor="bg-gray-300"
//         />
//       </div>

//       <div>
//         <h2 className="text-lg font-semibold mb-2">Four Tabs</h2>
//         <TabSwitcher 
//           tabs={['Home', 'About', 'Services', 'Contact']}
//           className="max-w-2xl"
//         />
//       </div>
//     </div>
//   );
// }