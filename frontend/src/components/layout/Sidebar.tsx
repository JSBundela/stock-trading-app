import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ArrowLeftRight,
    BookOpen,
    Briefcase,
    Wallet,
    Settings,
    CircleDollarSign
} from 'lucide-react';

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ArrowLeftRight, label: 'Order Entry', path: '/order-entry' },
    { icon: BookOpen, label: 'Order Book', path: '/order-book' },
    { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
    { icon: Wallet, label: 'Funds', path: '/funds' },
];

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-surface-secondary border-r border-stroke flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/20">
                        <CircleDollarSign size={20} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">KOTAK<span className="text-brand">NEO</span></span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
              ${isActive
                                ? 'bg-brand/10 text-brand'
                                : 'text-gray-400 hover:text-white hover:bg-surface-hover'}
            `}
                    >
                        <item.icon size={18} className="transition-transform group-hover:scale-110" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-stroke space-y-1">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all rounded-lg
            ${isActive ? 'text-brand' : 'text-gray-500 hover:text-gray-300'}
          `}
                >
                    <Settings size={18} />
                    Settings
                </NavLink>
            </div>
        </aside>
    );
};
