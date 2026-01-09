import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, trend, loading }) => {
    return (
        <Card className="flex flex-col gap-1 hover:border-brand/40 transition-colors">
            <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
                {trend === 'up' && <TrendingUp size={14} className="text-trading-profit" />}
                {trend === 'down' && <TrendingDown size={14} className="text-trading-loss" />}
                {trend === 'neutral' && <Minus size={14} className="text-gray-600" />}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white leading-none">{value}</span>
                {subValue && <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-trading-profit' : trend === 'down' ? 'text-trading-loss' : 'text-gray-500'}`}>{subValue}</span>}
            </div>

            {loading && (
                <div className="absolute inset-0 bg-surface-card/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </Card>
    );
};
