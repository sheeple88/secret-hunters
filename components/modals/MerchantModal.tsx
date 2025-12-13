
import React, { useState } from 'react';
import { Coins, ShoppingBag, X } from 'lucide-react';
import { GameState, Item } from '../../types';
import { ITEMS, MERCHANT_STOCK, formatNumber } from '../../constants';

interface MerchantModalProps {
  gameState: GameState;
  onClose: () => void;
  onBuy: (itemId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
}

export const MerchantModal: React.FC<MerchantModalProps> = ({ gameState, onClose, onBuy, onSell }) => {
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');

  const getSellPrice = (item: Item) => Math.max(1, Math.floor((item.value || 1) * 0.5));

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-stone-900 w-full max-w-4xl h-[70vh] flex flex-col rounded-xl border-4 border-amber-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-stone-950 p-4 border-b border-amber-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-900/50 p-2 rounded-lg border border-amber-700">
                        <ShoppingBag className="w-6 h-6 text-amber-400"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-amber-200">Merchant</h2>
                        <div className="text-xs text-stone-400 flex items-center gap-1">
                            Your Gold: <span className="text-amber-400 font-bold flex items-center"><Coins className="w-3 h-3 mr-1"/>{formatNumber(gameState.stats.gold)}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full transition-colors"><X className="text-stone-400 hover:text-red-400"/></button>
            </div>

            {/* Tabs */}
            <div className="flex bg-stone-950 border-b border-stone-800">
                <button 
                    onClick={() => setTab('BUY')}
                    className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${tab === 'BUY' ? 'bg-stone-900 text-green-400 border-b-2 border-green-500' : 'text-stone-500 hover:bg-stone-900/50'}`}
                >
                    Buy Goods
                </button>
                <button 
                    onClick={() => setTab('SELL')}
                    className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${tab === 'SELL' ? 'bg-stone-900 text-blue-400 border-b-2 border-blue-500' : 'text-stone-500 hover:bg-stone-900/50'}`}
                >
                    Sell Items
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-900">
                {tab === 'BUY' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {MERCHANT_STOCK.map((stock, idx) => {
                            const item = ITEMS[stock.itemId];
                            if (!item) return null;
                            const canAfford = gameState.stats.gold >= stock.price;
                            const isKnownRecipe = item.type === 'BLUEPRINT' && item.recipeId && gameState.knownRecipes.includes(item.recipeId);

                            return (
                                <div key={`stock-${idx}`} className={`bg-stone-800 border-2 ${isKnownRecipe ? 'border-green-900 opacity-50' : 'border-stone-700'} p-3 rounded-lg flex flex-col gap-2 relative group`}>
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-stone-200">{item.name}</div>
                                        <div className="text-amber-400 text-sm font-mono flex items-center gap-1">
                                            <Coins className="w-3 h-3"/> {stock.price}
                                        </div>
                                    </div>
                                    <div className="text-xs text-stone-500 italic">{item.description}</div>
                                    <div className="mt-auto pt-2">
                                        {isKnownRecipe ? (
                                            <button disabled className="w-full py-1.5 bg-stone-700 text-stone-500 text-xs font-bold rounded cursor-not-allowed">
                                                Purchased
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onBuy(stock.itemId, stock.price)}
                                                disabled={!canAfford}
                                                className={`w-full py-1.5 text-xs font-bold rounded transition-colors ${canAfford ? 'bg-green-800 hover:bg-green-700 text-green-100' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}
                                            >
                                                {canAfford ? 'Buy' : 'Not Enough Gold'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'SELL' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {gameState.inventory.filter(i => i.value && i.value > 0).map((item, idx) => {
                            const sellPrice = getSellPrice(item);
                            return (
                                <div key={`sell-${item.id}-${idx}`} className="bg-stone-800 border-2 border-stone-700 p-3 rounded-lg flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-stone-200">{item.name} <span className="text-xs text-stone-500">x{item.count}</span></div>
                                        <div className="text-blue-300 text-sm font-mono flex items-center gap-1">
                                            <Coins className="w-3 h-3"/> {sellPrice}
                                        </div>
                                    </div>
                                    <div className="text-xs text-stone-500 italic">{item.description}</div>
                                    <div className="mt-auto pt-2">
                                        <button 
                                            onClick={() => onSell(item, sellPrice)}
                                            className="w-full py-1.5 bg-blue-900 hover:bg-blue-800 text-blue-100 text-xs font-bold rounded transition-colors"
                                        >
                                            Sell (1)
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {gameState.inventory.filter(i => i.value && i.value > 0).length === 0 && (
                            <div className="col-span-full text-center py-10 text-stone-500 italic">
                                You have nothing of value to sell.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
