import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartContainer } from '../components/ChartContainer';
import { OrderForm } from '../components/trading/OrderForm';
import { scripService } from '../services/scripService';
import type { Scrip } from '../services/scripService';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { parseSymbol } from '../utils/symbolDecoder';
import { Card } from '../components/ui/Card';

const OrderEntry: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Scrip[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedScrip, setSelectedScrip] = useState<Scrip | null>(null);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setLoading(true);
            try {
                const response = await scripService.search(searchTerm);
                if (response?.data) {
                    setSearchResults(response.data);
                    setShowResults(true);
                }
            } catch (err) {
                console.error('[OrderEntry] Search failed', err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search Shell */}
            <div className="relative max-w-3xl mx-auto" ref={searchRef}>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search Symbol (e.g. RELIANCE, NIFTY 09JAN 24000 CE)..."
                        className="w-full bg-surface-card border border-stroke rounded-2xl py-4 pl-12 pr-12 text-lg font-medium text-white outline-none focus:border-brand shadow-2xl transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
                    />
                    {loading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-brand" size={20} />
                        </div>
                    )}
                </div>

                {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-card border border-stroke rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden divide-y divide-stroke/50 max-h-[400px] overflow-y-auto">
                        {searchResults.map((res, i) => {
                            const parsed = parseSymbol(res.tradingSymbol, res);
                            return (
                                <div
                                    key={`${res.instrumentToken}-${i}`}
                                    className="p-4 flex items-center justify-between hover:bg-surface-hover cursor-pointer transition-colors group"
                                    onClick={() => {
                                        setSelectedScrip(res);
                                        setShowResults(false);
                                        setSearchTerm(res.tradingSymbol);
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white group-hover:text-brand transition-colors uppercase tracking-tight">
                                            {parsed.displayName}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {res.exchangeSegment.toUpperCase()} · {res.tradingSymbol}
                                        </span>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-700 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedScrip ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Chart */}
                    <Card className="lg:col-span-8 p-0 overflow-hidden min-h-[600px] border-stroke" title={`Market Chart: ${parseSymbol(selectedScrip.tradingSymbol).displayName}`}>
                        <ChartContainer symbol={selectedScrip.tradingSymbol} height={600} />
                    </Card>

                    {/* Right: Order Form */}
                    <div className="lg:col-span-4">
                        <OrderForm
                            symbol={selectedScrip.tradingSymbol}
                            scrip={selectedScrip}
                            onOrderPlaced={() => navigate('/order-book')}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-30 grayscale">
                    <Search size={64} className="text-gray-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-400">Trading Console</h2>
                        <p className="text-sm text-gray-500 tracking-wider uppercase font-medium">Select an instrument to begin execution</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderEntry;
