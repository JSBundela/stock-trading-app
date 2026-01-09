import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { portfolioService } from '../../services/portfolioService';
import { orderService } from '../../services/orderService';
import { wsService } from '../../services/websocket';
import { parseSymbol } from '../../utils/symbolDecoder';
import { formatCurrency } from '../../utils/formatters';
import { Info, Clock, ShieldCheck, Zap } from 'lucide-react';

interface OrderFormProps {
    symbol: string;
    scrip?: any;
    onOrderPlaced?: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ symbol, scrip, onOrderPlaced }) => {
    const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
    const [productType, setProductType] = useState('MIS');
    const [orderType, setOrderType] = useState('LIMIT');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [funds, setFunds] = useState('0.00');
    const [ltp, setLtp] = useState(0);

    const parsed = parseSymbol(symbol, scrip);

    useEffect(() => {
        const unsubscribe = wsService.subscribeQuotes(symbol, (data) => {
            if (data.ltp) {
                setLtp(data.ltp);
                if (price === 0) setPrice(data.ltp);
            }
        });

        portfolioService.getLimits().then(l => setFunds(l.netCash || l.cashBal || '0'));

        return () => unsubscribe();
    }, [symbol]);

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            await orderService.placeOrder({
                trading_symbol: symbol,
                transaction_type: transactionType,
                order_type: orderType,
                product_type: productType,
                quantity,
                price: orderType === 'MARKET' ? 0 : price,
            });
            onOrderPlaced?.();
        } catch (error) {
            console.error('Order failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Execution Form" className="p-0 border-stroke shadow-2xl sticky top-20">
            {/* Header / Tabs */}
            <div className={`p-4 flex justify-between items-center bg-surface-secondary/50 border-b border-stroke ${transactionType === 'BUY' ? 'bg-trading-profit/5' : 'bg-trading-loss/5'}`}>
                <div className="flex gap-2">
                    <button
                        onClick={() => setTransactionType('BUY')}
                        className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${transactionType === 'BUY' ? 'bg-trading-profit text-white shadow-lg' : 'text-gray-500'}`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setTransactionType('SELL')}
                        className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${transactionType === 'SELL' ? 'bg-trading-loss text-white shadow-lg' : 'text-gray-500'}`}
                    >
                        Sell
                    </button>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">LTP</p>
                    <p className="text-sm font-mono font-bold text-white">{formatCurrency(ltp)}</p>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Product & Order Types */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase">Product</label>
                        <select
                            value={productType}
                            onChange={(e) => setProductType(e.target.value)}
                            className="w-full bg-surface-primary border border-stroke rounded-lg p-2 text-xs font-bold outline-none focus:border-brand"
                        >
                            <option value="MIS">Intraday (MIS)</option>
                            <option value="CNC">Investment (CNC)</option>
                            <option value="NRML">Carryover (NRML)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase">Type</label>
                        <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                            className="w-full bg-surface-primary border border-stroke rounded-lg p-2 text-xs font-bold outline-none focus:border-brand"
                        >
                            <option value="LIMIT">Limit</option>
                            <option value="MARKET">Market</option>
                        </select>
                    </div>
                </div>

                {/* Qty & Price */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full bg-surface-primary border border-stroke rounded-lg p-2 text-sm font-mono font-bold outline-none focus:border-brand text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase">Price</label>
                        <input
                            type="number"
                            disabled={orderType === 'MARKET'}
                            value={orderType === 'MARKET' ? '' : price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            placeholder="MKT"
                            className="w-full bg-surface-primary border border-stroke rounded-lg p-2 text-sm font-mono font-bold outline-none focus:border-brand disabled:opacity-50 text-white"
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-surface-secondary/50 rounded-xl p-4 border border-stroke/50 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-500 uppercase">Available Funds</span>
                        <span className="text-white font-mono">{formatCurrency(funds)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-500 uppercase">Approx. Margin</span>
                        <span className="text-white font-mono uppercase tracking-tighter">{formatCurrency(quantity * (price || ltp))}*</span>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <Button
                        variant={transactionType === 'BUY' ? 'primary' : 'danger'}
                        className="w-full py-4 text-xs font-bold tracking-[0.2em] uppercase shadow-2xl"
                        onClick={handlePlaceOrder}
                        isLoading={loading}
                    >
                        {transactionType === 'BUY' ? <Zap size={14} className="mr-2" /> : <ShieldCheck size={14} className="mr-2" />}
                        Execute {transactionType}
                    </Button>
                    <p className="text-[9px] text-gray-600 text-center uppercase tracking-widest flex items-center justify-center gap-1">
                        <Info size={10} /> Orders are routed through Kotak Neo Broker Bridge
                    </p>
                </div>
            </div>
        </Card>
    );
};
