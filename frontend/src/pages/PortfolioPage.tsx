import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { portfolioService } from '../services/portfolioService';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Briefcase, PieChart, Wallet } from 'lucide-react';
import { PositionsTable, HoldingsTable } from '../components/trading/PortfolioTables';
import { FundsView } from '../components/trading/FundsView';

const TABS = [
    { id: 'POSITIONS', label: 'Positions', icon: Briefcase },
    { id: 'HOLDINGS', label: 'Holdings', icon: PieChart },
    { id: 'FUNDS', label: 'Funds', icon: Wallet },
];

const PortfolioPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('POSITIONS');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        positions: [],
        holdings: [],
        limits: null
    });
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchPortfolio = async (silent = false) => {
        if (!isAuthenticated) return;
        if (!silent) setLoading(true);
        try {
            const [pos, hold, lim] = await Promise.all([
                portfolioService.getPositions().catch(() => ({ data: [] })),
                portfolioService.getHoldings().catch(() => ({ data: [] })),
                portfolioService.getLimits().catch(() => null)
            ]);

            setData({
                positions: pos.data || [],
                holdings: hold.data || [],
                limits: lim
            });
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('[Portfolio] Sync failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
        const interval = setInterval(() => fetchPortfolio(true), 15000); // 15s sync
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-1 p-1 bg-surface-secondary/50 rounded-xl border border-stroke/50 max-w-sm">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-surface-card text-brand border border-stroke shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-brand' : 'text-gray-600'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-600 font-bold uppercase font-mono tracking-tighter">Real-time Cloud Sync • {lastUpdated}</span>
                    <button onClick={() => fetchPortfolio()} className="text-gray-500 hover:text-brand transition-colors">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Tab Content Rendering */}
            <div className="transition-all duration-300">
                {activeTab === 'POSITIONS' && (
                    <Card title="Current Day Exposure" className="p-0 border-stroke overflow-hidden">
                        <PositionsTable positions={data.positions} loading={loading} />
                    </Card>
                )}

                {activeTab === 'HOLDINGS' && (
                    <Card title="Long-term Assets" className="p-0 border-stroke overflow-hidden">
                        <HoldingsTable holdings={data.holdings} loading={loading} />
                    </Card>
                )}

                {activeTab === 'FUNDS' && (
                    <div className="animate-in slide-in-from-bottom-4">
                        <FundsView limits={data.limits} loading={loading} />
                    </div>
                )}
            </div>

            {/* Footer Analytics Placeholder */}
            <div className="p-4 bg-surface-secondary/20 rounded-2xl border border-stroke/30 flex items-center justify-between">
                <div className="flex gap-6">
                    <div>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Exposure Factor</p>
                        <p className="text-sm font-mono text-white">0.00x</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Portfolio Beta</p>
                        <p className="text-sm font-mono text-white">1.02</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Architecture Mode</p>
                    <p className="text-[10px] text-brand font-bold uppercase tracking-tighter">Execution Grade • Low Latency Enabled</p>
                </div>
            </div>
        </div>
    );
};

export default PortfolioPage;
