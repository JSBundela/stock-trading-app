import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, headerAction }) => {
    return (
        <div className={`bg-surface-card border border-stroke rounded-xl overflow-hidden ${className}`}>
            {(title || headerAction) && (
                <div className="px-4 py-3 border-b border-stroke flex justify-between items-center bg-surface-secondary/50">
                    {title && <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">{title}</h3>}
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className="p-4">{children}</div>
        </div>
    );
};
