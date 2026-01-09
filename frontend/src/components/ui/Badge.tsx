import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'info' | 'success' | 'danger' | 'warning' | 'neutral';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    className = ''
}) => {
    const styles = {
        info: 'bg-brand/10 text-brand border-brand/20',
        success: 'bg-trading-profit/10 text-trading-profit border-trading-profit/20',
        danger: 'bg-trading-loss/10 text-trading-loss border-trading-loss/20',
        warning: 'bg-trading-warning/10 text-trading-warning border-trading-warning/20',
        neutral: 'bg-gray-800 text-gray-400 border-gray-700',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[variant]} ${className}`}>
            {children}
        </span>
    );
};
