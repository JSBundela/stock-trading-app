import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-surface-primary border-b border-stroke flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-6">
                {/* Market Status (Indices) Placeholder */}
                <div className="flex items-center gap-4 text-[11px] font-mono">
                    <div className="flex gap-2 items-center bg-surface-secondary px-3 py-1 rounded border border-stroke">
                        <span className="text-gray-500 uppercase">Nifty 50</span>
                        <span className="text-trading-profit">24,352.12</span>
                        <span className="text-trading-profit/80">+0.45%</span>
                    </div>
                    <div className="flex gap-2 items-center bg-surface-secondary px-3 py-1 rounded border border-stroke">
                        <span className="text-gray-500 uppercase">Sensex</span>
                        <span className="text-trading-loss">80,123.45</span>
                        <span className="text-trading-loss/80">-0.12%</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-500 hover:text-white transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border-2 border-surface-primary"></span>
                </button>

                <div className="h-8 w-px bg-stroke mx-2"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-white">{user?.id || 'Trader'}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Live Session</p>
                    </div>

                    <div className="relative group">
                        <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/50 flex items-center justify-center text-brand font-bold cursor-pointer transition-transform hover:scale-105">
                            {user?.id?.charAt(0) || <User size={16} />}
                        </div>

                        {/* Dropdown Placeholder */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-card border border-stroke shadow-2xl rounded-xl p-2 hidden group-hover:block slide-in-top">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => logout()}
                            >
                                <LogOut size={14} className="mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                    <ChevronDown size={14} className="text-gray-500" />
                </div>
            </div>
        </header>
    );
};
