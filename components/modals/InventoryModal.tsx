
import React, { useState } from 'react';
import { Backpack, X, PlusCircle, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { GameState, Item, Stats } from '../../types';
import { formatNumber } from '../../constants';

interface InventoryModalProps {
  gameState: GameState;
  playerStats: Stats;
  onClose: () => void;
  onEquip: (item: Item) => void;
  onConsume: (item: Item) => void;
  onStatIncrease: (stat: keyof Stats) => void;
  onAutoConfigChange: (enabled: boolean, allocation: any) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ 
    gameState, 
    playerStats, 
    onClose, 
    onEquip, 
    onConsume,
    onStatIncrease,
    onAutoConfigChange
}) => {
  const [showAutoConfig, setShowAutoConfig] = useState(false);
  const { autoDistributeStats, statAllocation } = gameState;
  const unspent = gameState.stats.unspentStatPoints || 0;

  // Local state for sliders to avoid constant re-renders of parent
  const [alloc, setAlloc] = useState(statAllocation || { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 });

  const handleSliderChange = (stat: string, val: number) => {
      const newAlloc = { ...alloc, [stat]: val };
      setAlloc(newAlloc);
      onAutoConfigChange(autoDistributeStats, newAlloc);
  };

  const toggleAuto = () => {
      onAutoConfigChange(!autoDistributeStats, alloc);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-stone-900 w-full max-w-4xl h-[80vh] flex flex-col md:flex-row rounded-xl border-4 border-stone-700 shadow-2xl overflow-hidden">
            {/* Sidebar: Stats & Equipment */}
            <div className="w-full md:w-1/3 bg-stone-950 p-4 border-b md:border-b-0 md:border-r border-stone-800 flex flex-col gap-4 overflow-y-auto">
                <div className="border-b border-stone-800 pb-2">
                    <h2 className="text-xl font-bold text-stone-200 flex justify-between items-center">
                        <span>Hero Stats</span>
                        <button onClick={onClose} className="md:hidden"><X/></button>
                    </h2>
                    {unspent > 0 && (
                        <div className="text-yellow-400 text-sm font-bold animate-pulse mt-1">
                            {unspent} Points Available!
                        </div>
                    )}
                </div>

                {/* Auto Distribute Toggle Button */}
                <button 
                    onClick={() => setShowAutoConfig(!showAutoConfig)}
                    className="flex items-center justify-between bg-stone-900 p-2 rounded border border-stone-700 hover:bg-stone-800 text-xs text-stone-400 transition-colors"
                >
                    <span className="flex items-center gap-1"><Settings className="w-3 h-3"/> Stat Automation</span>
                    {showAutoConfig ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                </button>

                {showAutoConfig ? (
                    <div className="bg-stone-900 p-3 rounded border border-stone-800 text-xs space-y-3 animate-slide-down">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-stone-300">Auto-Distribute</span>
                            <div 
                                onClick={toggleAuto}
                                className={`w-8 h-4 rounded-full cursor-pointer relative transition-colors ${autoDistributeStats ? 'bg-green-600' : 'bg-stone-600'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoDistributeStats ? 'left-4.5' : 'left-0.5'}`}/>
                            </div>
                        </div>
                        {['str', 'dex', 'int', 'hp', 'regeneration'].map((stat) => (
                            <div key={stat} className="flex flex-col gap-1">
                                <div className="flex justify-between uppercase text-[10px] text-stone-500 font-bold">
                                    <span>{stat}</span>
                                    <span>{alloc[stat as keyof typeof alloc]}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={alloc[stat as keyof typeof alloc]}
                                    onChange={(e) => handleSliderChange(stat, parseInt(e.target.value))}
                                    className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>
                        ))}
                        <div className="text-[10px] text-stone-600 text-center pt-1 border-t border-stone-800">
                            Total: {Object.values(alloc).reduce((a,b) => a+b, 0)}% (Weights)
                        </div>
                    </div>
                ) : (
                    /* Stat Grid */
                    <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                        {[
                            { label: 'Strength', key: 'str', color: 'text-red-400' },
                            { label: 'Dexterity', key: 'dex', color: 'text-green-400' },
                            { label: 'Intellect', key: 'int', color: 'text-blue-400' },
                            { label: 'Regen', key: 'regeneration', color: 'text-pink-400' },
                            { label: 'Max HP', key: 'maxHp', color: 'text-red-600', val: playerStats.maxHp }, // Special handling for display
                        ].map((s) => (
                            <div key={s.key} className="p-2 bg-stone-900 rounded border border-stone-800 relative group">
                                <div className="text-stone-500 text-xs uppercase flex justify-between">
                                    {s.label}
                                    {unspent > 0 && s.key !== 'maxHp' && !autoDistributeStats && (
                                        <button 
                                            onClick={() => onStatIncrease(s.key as keyof Stats)}
                                            className="text-yellow-500 hover:text-yellow-300 hover:scale-110 transition-transform"
                                        >
                                            <PlusCircle className="w-4 h-4 fill-yellow-900/50"/>
                                        </button>
                                    )}
                                    {/* Handle Max HP button separately to map to maxHp logic if needed, or just let regen/const handle it */}
                                    {unspent > 0 && s.key === 'maxHp' && !autoDistributeStats && (
                                         <button 
                                            onClick={() => onStatIncrease('maxHp')}
                                            className="text-yellow-500 hover:text-yellow-300 hover:scale-110 transition-transform"
                                        >
                                            <PlusCircle className="w-4 h-4 fill-yellow-900/50"/>
                                        </button>
                                    )}
                                </div>
                                <div className={`${s.color} text-lg`}>
                                    {formatNumber(s.val || playerStats[s.key as keyof Stats])}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="mt-2">
                    <div className="text-stone-500 text-xs uppercase mb-1">Equipment</div>
                    <div className="space-y-2">
                        {Object.entries(gameState.equipment).map(([slot, item]) => (
                            <div key={slot} className="flex items-center gap-2 p-2 bg-stone-900 rounded border border-stone-800 group">
                                <div className="w-8 h-8 bg-stone-950 flex items-center justify-center text-stone-700 text-xs border border-stone-800">
                                    {slot[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {item ? (
                                        <div className={`text-sm truncate font-bold ${item.rarity === 'LEGENDARY' ? 'text-orange-400' : 'text-stone-300'}`}>{item.name}</div>
                                    ) : (
                                        <div className="text-xs text-stone-600 italic">Empty</div>
                                    )}
                                </div>
                                {item && <button onClick={() => onEquip(item)} className="text-xs text-red-500 opacity-0 group-hover:opacity-100 px-2">X</button>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main: Grid */}
            <div className="flex-1 p-4 bg-stone-900 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-stone-200 flex items-center gap-2"><Backpack/> Inventory ({gameState.inventory.length})</h2>
                    <button onClick={onClose} className="hidden md:block hover:text-red-500"><X/></button>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 overflow-y-auto content-start flex-1 p-1">
                    {gameState.inventory.map(item => (
                        <div key={item.id} className="relative aspect-square bg-stone-950 border border-stone-800 rounded hover:border-stone-500 group cursor-pointer flex flex-col items-center justify-center p-1 text-center" title={item.name}>
                            <div className={`text-[10px] leading-tight font-bold mb-1 truncate w-full ${item.rarity === 'LEGENDARY' ? 'text-orange-400' : item.rarity === 'EPIC' ? 'text-purple-400' : item.rarity === 'RARE' ? 'text-blue-400' : 'text-stone-300'}`}>
                                {item.name}
                            </div>
                            <div className="text-2xl opacity-50 group-hover:opacity-100">
                                {item.type === 'EQUIPMENT' ? (item.slot === 'WEAPON' ? '⚔️' : '🛡️') : 
                                 item.type === 'CONSUMABLE' ? '🍷' : 
                                 item.type === 'MATERIAL' ? '🪵' : '📦'}
                            </div>
                            <div className="absolute bottom-1 right-1 text-[10px] text-stone-500">{item.count > 1 ? `x${item.count}` : ''}</div>
                            
                            <div className="absolute inset-0 bg-black/80 hidden group-hover:flex flex-col items-center justify-center gap-1 p-1 z-10 backdrop-blur-sm">
                                {item.type === 'EQUIPMENT' && <button onClick={() => onEquip(item)} className="text-[10px] bg-stone-700 w-full py-1 rounded hover:bg-stone-600">Equip</button>}
                                {item.healAmount && <button onClick={() => onConsume(item)} className="text-[10px] bg-green-800 w-full py-1 rounded hover:bg-green-700">Use</button>}
                            </div>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 30 - gameState.inventory.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-stone-950/30 border border-stone-800/50 rounded"/>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
