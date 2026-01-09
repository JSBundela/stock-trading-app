import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { OrderBookTable } from '../components/trading/OrderBookTable';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, LayoutList, History, AlertCircle } from 'lucide-react';

const TABS = [
    { id: 'ALL', label: 'All Orders', icon: LayoutList },
    { id: 'OPEN', label: 'Open / Pending', icon: RefreshCw },
    { id: 'EXECUTED', label: 'Executed', icon: History },
    { id: 'REJECTED', label: 'Failed / Rejected', icon: AlertCircle },
];

const OrderBook: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const fetchOrders = async (silent = false) => {
        if (!isAuthenticated) return;
        if (!silent) setLoading(true);
        try {
            const response = await orderService.getOrderBook(3);
            if (response.data) {
                setOrders(response.data);
                setLastUpdated(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('[OrderBook] Fetch failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(true), 10000); // Sync every 10s
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const filteredOrders = orders.filter(order => {
        const s = order.ordSt.toLowerCase();
        if (activeTab === 'ALL') return true;
        if (activeTab === 'OPEN') return ['open', 'pending', 'amo', 'trigger pending'].includes(s);
        if (activeTab === 'EXECUTED') return ['traded', 'complete', 'executed'].includes(s);
        if (activeTab === 'REJECTED') return ['rejected', 'cancelled'].includes(s);
        return true;
    });

    const handleCancel = async (order: any) => {
        if (!window.confirm(`Confirm cancellation for ${order.trdSym}?`)) return;
        try {
            await orderService.cancelOrder(order.nOrdNo);
            fetchOrders(true);
        } catch (err) {
            console.error('Cancel failed', err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-secondary/30 p-1 rounded-xl border border-stroke/50">
                <div className="flex flex-wrap gap-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-surface-card text-brand border border-stroke shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-brand' : 'text-gray-600'} />
                            {tab.label}
                            <span className="ml-2 bg-gray-900 border border-stroke/30 px-1.5 py-0.5 rounded text-[8px] text-gray-500 font-mono">
                                {orders.filter(o => {
                                    const s = o.ordSt.toLowerCase();
                                    if (tab.id === 'ALL') return true;
                                    if (tab.id === 'OPEN') return ['open', 'pending', 'amo', 'trigger pending'].includes(s);
                                    if (tab.id === 'EXECUTED') return ['traded', 'complete', 'executed'].includes(s);
                                    if (tab.id === 'REJECTED') return ['rejected', 'cancelled'].includes(s);
                                    return true;
                                }).length}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 px-4 py-2">
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Syncing: Every 10s • Last: {lastUpdated}</span>
                    <button onClick={() => fetchOrders()} className="text-gray-500 hover:text-brand transition-colors">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main Table View */}
            <Card className="p-0 overflow-hidden border-stroke">
                <OrderBookTable
                    orders={filteredOrders}
                    loading={loading}
                    onCancel={handleCancel}
                />
            </Card>

            <div className="flex items-center justify-center gap-2 p-6 border border-brand/10 bg-brand/5 rounded-2xl italic text-[11px] text-gray-500">
                <LayoutList size={14} className="text-brand/50" />
                Architecture: All orders are synchronized with the Kotak Neo Central Order Repository in real-time.
            </div>
        </div>
    );
};

export default OrderBook;
