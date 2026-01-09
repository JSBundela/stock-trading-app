import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { ChartContainer } from '../components/ChartContainer';
import { MarketDepth } from '../components/trading/MarketDepth';
import { OrderForm } from '../components/trading/OrderForm';
import { wsService } from '../services/websocket';
import { fetchQuotes, parseNumericField } from '../api/quotes';
import { parseSymbol } from '../utils/symbolDecoder';
import { scripService } from '../services/scripService';
import { ArrowLeft, Plus, Bell, Activity } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const InstrumentPage: React.FC = () => {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const [quote, setQuote] = useState<any>(null);
    const [scrip, setScrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!symbol) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Determine token and exchange for Quotes API
                const searchRes = await scripService.search(symbol);
                const match = searchRes.data.find(s => s.tradingSymbol === symbol) || searchRes.data[0];

                if (match) {
                    setScrip(match);
                    const qRes = await fetchQuotes(match.instrumentToken, match.exchangeSegment);
                    if (qRes && qRes.length > 0) setQuote(qRes[0]);
                }
            } catch (error) {
                console.error('[InstrumentPage] Load failed', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const unsubscribe = wsService.subscribeQuotes(symbol, (tick) => {
            setQuote((prev: any) => prev ? ({
                ...prev,
                ltp: tick.ltp.toString(),
                change: tick.change?.toString() || prev.change,
                per_change: tick.per_change?.toString() || prev.per_change
            }) : prev);
        });

        return () => unsubscribe();
    }, [symbol]);

    const parsed = symbol ? parseSymbol(symbol, scrip) : null;
    const ltp = parseNumericField(quote?.ltp);
    const change = parseNumericField(quote?.change);
    const isProfit = change >= 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface-card p-6 rounded-2xl border border-stroke shadow-2xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-surface-secondary border border-stroke rounded-xl text-gray-400 hover:text-white transition-all hover:bg-surface-hover"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{parsed?.displayName}</h1>
                            <Badge variant="info">{parsed?.exchange}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">{symbol} · {scrip?.instrumentName}</p>
                    </div>
                </div>

                <div className="flex items-end gap-10">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Last Traded Price</p>
                        <div className="flex items-baseline gap-3 justify-end">
                            <span className="text-4xl font-mono font-black text-white tracking-tighter">{formatCurrency(ltp)}</span>
                            <span className={`text-sm font-bold font-mono ${isProfit ? 'text-trading-profit' : 'text-trading-loss'}`}>
                                {isProfit ? '+' : ''}{change.toFixed(2)} ({parseNumericField(quote?.per_change).toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-surface-secondary border border-stroke rounded-xl text-gray-500 hover:text-brand transition-all"><Plus size={18} /></button>
                        <button className="p-3 bg-surface-secondary border border-stroke rounded-xl text-gray-500 hover:text-brand transition-all"><Bell size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Main Execution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Analysis Center */}
                <div className="lg:col-span-8 space-y-6">
                    <Card title="Live Technical Analysis" className="p-0 border-stroke overflow-hidden shadow-2xl">
                        <ChartContainer symbol={symbol!} height={550} />
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Volume" value={quote?.last_volume || '0'} trend="neutral" />
                        <StatCard label="Avg Price" value={formatCurrency(quote?.avg_price)} />
                        <StatCard label="Open Interest" value={quote?.oi || 'N/A'} trend={parseFloat(quote?.oi_change) >= 0 ? 'up' : 'down'} />
                        <StatCard label="Turnover" value={formatCurrency(quote?.turnover)} />
                    </div>
                </div>

                {/* Execution & Depth Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <OrderForm symbol={symbol!} scrip={scrip} />

                    <Card title="Market Depth" className="border-stroke bg-surface-card/30">
                        <MarketDepth
                            buy={quote?.depth?.buy || []}
                            sell={quote?.depth?.sell || []}
                            loading={loading}
                        />
                        <div className="mt-4 pt-4 border-t border-stroke/30 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-gray-600 font-bold uppercase mb-1">Total Bid Qty</p>
                                <p className="text-xs font-mono font-bold text-trading-profit">
                                    {quote?.depth?.buy?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-gray-600 font-bold uppercase mb-1">Total Ask Qty</p>
                                <p className="text-xs font-mono font-bold text-trading-loss">
                                    {quote?.depth?.sell?.reduce((acc: number, l: any) => acc + (Number(l.quantity) || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Performance Context */}
            <Card title="Market Day Context" className="border-stroke">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Activity size={10} className="text-brand" /> OHLC Snapshot
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div><span className="text-[9px] text-gray-600 block uppercase">Open</span> <span className="text-xs font-mono font-bold">{formatCurrency(quote?.ohlc?.open)}</span></div>
                            <div><span className="text-[9px] text-gray-600 block uppercase">Close</span> <span className="text-xs font-mono font-bold">{formatCurrency(quote?.ohlc?.close)}</span></div>
                            <div><span className="text-[9px] text-gray-600 block uppercase">High</span> <span className="text-xs font-mono font-bold text-trading-profit">{formatCurrency(quote?.ohlc?.high)}</span></div>
                            <div><span className="text-[9px] text-gray-600 block uppercase">Low</span> <span className="text-xs font-mono font-bold text-trading-loss">{formatCurrency(quote?.ohlc?.low)}</span></div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            52 Week Ranges
                        </p>
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[9px] text-gray-600 uppercase">High</span>
                                <span className="text-xs font-mono font-bold text-trading-profit">{formatCurrency(quote?.year_high)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[9px] text-gray-600 uppercase">Low</span>
                                <span className="text-xs font-mono font-bold text-trading-loss">{formatCurrency(quote?.year_low)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex items-center justify-center p-6 border border-brand/10 bg-brand/5 rounded-2xl italic text-[11px] text-gray-500 text-center">
                        <Activity size={14} className="mr-2 text-brand/50" />
                        Infrastructure: Real-time ticker stream active. Price updates are derived from Kotak Neo WebSocket clusters with sub-50ms latency.
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InstrumentPage;
