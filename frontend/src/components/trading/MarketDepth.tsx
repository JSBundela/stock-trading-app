import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface DepthLevel {
    price: string | number;
    quantity: string | number;
    orders: string | number;
}

interface MarketDepthProps {
    buy: DepthLevel[];
    sell: DepthLevel[];
    loading?: boolean;
}

export const MarketDepth: React.FC<MarketDepthProps> = ({ buy, sell, loading }) => {
    if (loading) return <div className="h-64 animate-pulse bg-surface-card/50 rounded-xl" />;

    const maxQty = Math.max(
        ...buy.map(l => Number(l.quantity) || 0),
        ...sell.map(l => Number(l.quantity) || 0),
        1
    );

    const DepthRow = ({ level, type }: { level: DepthLevel, type: 'buy' | 'sell' }) => {
        const qty = Number(level.quantity) || 0;
        const percentage = (qty / maxQty) * 100;
        const colorClass = type === 'buy' ? 'bg-trading-profit/10' : 'bg-trading-loss/10';
        const textColor = type === 'buy' ? 'text-trading-profit' : 'text-trading-loss';

        return (
            <div className="relative flex items-center justify-between py-1 px-2 text-[11px] font-mono group hover:bg-surface-hover transition-colors">
                <div
                    className={`absolute inset-y-0 ${type === 'buy' ? 'right-0' : 'left-0'} ${colorClass} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
                <div className="relative flex-1 flex justify-between items-center z-10 w-full">
                    <span className={`font-bold ${textColor}`}>{formatCurrency(level.price)}</span>
                    <span className="text-white font-bold">{level.quantity}</span>
                    <span className="text-gray-600 text-[9px]">{level.orders}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-2 gap-px bg-stroke/30 rounded-lg overflow-hidden border border-stroke">
            {/* Buy Side */}
            <div className="bg-surface-card">
                <div className="px-2 py-1.5 bg-surface-secondary/50 border-b border-stroke flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Bid</span>
                    <span>Qty</span>
                    <span>Orders</span>
                </div>
                <div className="divide-y divide-stroke/10">
                    {buy.slice(0, 5).map((l, i) => <DepthRow key={i} level={l} type="buy" />)}
                </div>
            </div>

            {/* Sell Side */}
            <div className="bg-surface-card">
                <div className="px-2 py-1.5 bg-surface-secondary/50 border-b border-stroke flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">
                    <span>Ask</span>
                    <span>Qty</span>
                    <span>Orders</span>
                </div>
                <div className="divide-y divide-stroke/10">
                    {sell.slice(0, 5).map((l, i) => <DepthRow key={i} level={l} type="sell" />)}
                </div>
            </div>
        </div>
    );
};
