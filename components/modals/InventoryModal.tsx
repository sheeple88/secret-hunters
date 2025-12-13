
import React, { useState, useRef, useEffect } from 'react';
import { Backpack, X, PlusCircle, Settings, ChevronRight, ChevronDown, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { GameState, Item, Stats, WeaponStats } from '../../types';
import { formatNumber } from '../../constants';

interface InventoryModalProps {
  gameState: GameState;
  playerStats: Stats;
  onClose: () => void;
  onEquip: (item: Item) => void;
  onConsume: (item: Item) => void;
  onStatIncrease: (stat: keyof Stats) => void;
  onAutoConfigChange: (enabled: boolean, allocation: any) => void;
  onResetStats: () => void;
}

// --- Tooltip Component ---
const ItemTooltip = ({ item, equippedItem }: { item: Item, equippedItem?: Item | null }) => {
    const isEquip = item.type === 'EQUIPMENT';
    
    // Helper to render stat comparison
    const renderStatDiff = (label: string, val: number, equippedVal: number = 0) => {
        const diff = val - equippedVal;
        if (diff === 0 && val === 0) return null;
        
        let color = "text-stone-400";
        let diffElem = null;

        if (isEquip && equippedItem) {
            if (diff > 0) diffElem = <span className="text-green-400 text-[10px] ml-1">(+{diff})</span>;
            else if (diff < 0) diffElem = <span className="text-red-400 text-[10px] ml-1">({diff})</span>;
        }

        return (
            <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 uppercase">{label}</span>
                <span className={`font-mono ${color}`}>{val > 0 ? '+' : ''}{val}{diffElem}</span>
            </div>
        );
    };

    return (
        <div className="bg-stone-950 border-2 border-stone-600 p-3 rounded-lg shadow-2xl w-64 pointer-events-none flex flex-col gap-2 z-[100]">
            {/* Header */}
            <div>
                <div className={`font-bold text-sm ${
                    item.rarity === 'LEGENDARY' ? 'text-orange-400' : 
                    item.rarity === 'EPIC' ? 'text-purple-400' : 
                    item.rarity === 'RARE' ? 'text-blue-400' : 
                    item.rarity === 'UNCOMMON' ? 'text-green-400' : 'text-stone-300'
                }`}>
                    {item.name}
                </div>
                <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{item.rarity || 'Common'} {item.type} {item.slot ? `[${item.slot}]` : ''}</div>
            </div>

            {/* Description */}
            <div className="text-xs text-stone-400 italic leading-snug border-b border-stone-800 pb-2">
                {item.description}
            </div>

            {/* Consumable Stats */}
            {item.healAmount && (
                <div className="text-xs text-green-400 font-bold flex items-center gap-1">
                    <span className="text-green-600">❤</span> Restores {item.healAmount} HP
                </div>
            )}

            {/* Equipment Stats */}
            {item.stats && (
                <div className="flex flex-col gap-0.5">
                    {Object.entries(item.stats).map(([key, val]) => {
                        if (!val) return null;
                        // @ts-ignore
                        const equippedVal = equippedItem?.stats?.[key] || 0;
                        return <div key={key}>{renderStatDiff(key, val as number, equippedVal)}</div>;
                    })}
                </div>
            )}

            {/* Weapon Stats */}
            {item.weaponStats && (
                <div className="border-t border-stone-800 pt-2 mt-1 flex flex-col gap-0.5">
                    <div className="text-[10px] text-stone-500 font-bold uppercase mb-1">Weapon Properties</div>
                    {(() => {
                        const ws = item.weaponStats;
                        const es = equippedItem?.weaponStats;
                        
                        const renderWepDiff = (label: string, v1: number, v2: number | undefined, isPercentage = false) => {
                            const diff = v1 - (v2 || 0);
                            let diffEl = null;
                            if (equippedItem && es && diff !== 0) {
                                diffEl = <span className={`ml-1 text-[10px] ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {diff > 0 ? '+' : ''}{isPercentage ? (diff*100).toFixed(0)+'%' : diff}
                                </span>;
                            }
                            return (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-stone-500">{label}</span>
                                    <span className="text-stone-300 font-mono">
                                        {isPercentage ? (v1*100).toFixed(0)+'%' : v1}
                                        {diffEl}
                                    </span>
                                </div>
                            );
                        };

                        return (
                            <>
                                {renderWepDiff('Damage', ws.maxDmg, es?.maxDmg)} 
                                {renderWepDiff('Range', ws.range, es?.range)}
                                {renderWepDiff('Crit %', ws.critChance, es?.critChance, true)}
                                {ws.cleave && <div className="text-xs text-yellow-500 font-bold">Cleave (AoE)</div>}
                            </>
                        );
                    })()}
                </div>
            )}
            
            {item.value && (
                <div className="text-xs text-amber-500 font-mono mt-1 pt-2 border-t border-stone-800 text-right">
                    Value: {item.value}g
                </div>
            )}
        </div>
    );
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ 
    gameState, 
    playerStats, 
    onClose, 
    onEquip, 
    onConsume,
    onStatIncrease,
    onAutoConfigChange,
    onResetStats
}) => {
  const [showAutoConfig, setShowAutoConfig] = useState(false);
  const { autoDistributeStats, statAllocation } = gameState;
  const unspent = gameState.stats.unspentStatPoints || 0;

  // Tooltip State
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Local state for sliders to avoid constant re-renders of parent
  const [alloc, setAlloc] = useState(statAllocation || { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 });

  const handleSliderChange = (stat: string, val: number) => {
      // Calculate sum of OTHER stats
      const others = Object.entries(alloc).reduce((acc, [key, v]) => {
          if (key !== stat) return acc + (v as number);
          return acc;
      }, 0);
      
      // Clamp value so total <= 100
      const maxVal = 100 - others;
      const clampedVal = Math.min(val, maxVal);

      const newAlloc = { ...alloc, [stat]: clampedVal };
      setAlloc(newAlloc);
      onAutoConfigChange(autoDistributeStats, newAlloc);
  };

  const toggleAuto = () => {
      onAutoConfigChange(!autoDistributeStats, alloc);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      // Adjust position to keep tooltip on screen
      const x = Math.min(e.clientX + 15, window.innerWidth - 270); // 270 approx width of tooltip
      const y = Math.min(e.clientY + 15, window.innerHeight - 300); // approx height
      setMousePos({ x, y });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in" onMouseMove={handleMouseMove}>
        
        {/* Tooltip Portal */}
        {hoveredItem && (
            <div className="fixed z-[110] pointer-events-none transition-opacity duration-150" style={{ top: mousePos.y, left: mousePos.x }}>
                <ItemTooltip 
                    item={hoveredItem} 
                    equippedItem={hoveredItem.slot ? gameState.equipment[hoveredItem.slot] : null} 
                />
            </div>
        )}

        <div className="bg-stone-900 w-full max-w-4xl h-[80vh] flex flex-col md:flex-row rounded-xl border-4 border-stone-700 shadow-2xl overflow-hidden relative">
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
                <div className="flex gap-1">
                    <button 
                        onClick={() => setShowAutoConfig(!showAutoConfig)}
                        className="flex-1 flex items-center justify-between bg-stone-900 p-2 rounded border border-stone-700 hover:bg-stone-800 text-xs text-stone-400 transition-colors"
                    >
                        <span className="flex items-center gap-1"><Settings className="w-3 h-3"/> Auto-Alloc</span>
                        {showAutoConfig ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                    </button>
                    
                    <button 
                        onClick={onResetStats}
                        className="bg-stone-900 p-2 rounded border border-stone-700 hover:bg-stone-800 hover:text-red-400 text-stone-500 transition-colors flex items-center justify-center"
                        title="Reset Stat Points"
                    >
                        <RotateCcw className="w-4 h-4"/>
                    </button>
                </div>

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
                            Total: {(Object.values(alloc) as number[]).reduce((a,b) => a+b, 0)}% (Weights)
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
                        {(Object.entries(gameState.equipment) as [string, Item | null][]).map(([slot, item]) => (
                            <div 
                                key={slot} 
                                className="flex items-center gap-2 p-2 bg-stone-900 rounded border border-stone-800 group hover:border-stone-600 cursor-pointer transition-colors"
                                onMouseEnter={(e) => { if(item) setHoveredItem(item); }}
                                onMouseLeave={() => setHoveredItem(null)}
                                onClick={() => item && onEquip(item)}
                            >
                                <div className="w-8 h-8 bg-stone-950 flex items-center justify-center text-stone-700 text-xs border border-stone-800">
                                    {slot[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {item ? (
                                        <div className={`text-sm truncate font-bold ${item.rarity === 'LEGENDARY' ? 'text-orange-400' : item.rarity === 'EPIC' ? 'text-purple-400' : item.rarity === 'RARE' ? 'text-blue-400' : 'text-stone-300'}`}>
                                            {item.name}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-stone-600 italic">Empty</div>
                                    )}
                                </div>
                                {item && <div className="text-xs text-red-500 opacity-0 group-hover:opacity-100 px-2 font-bold">UNEQUIP</div>}
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
                        <div 
                            key={item.id} 
                            className="relative aspect-square bg-stone-950 border border-stone-800 rounded hover:border-stone-500 group cursor-pointer flex flex-col items-center justify-center p-1 text-center" 
                            onMouseEnter={() => setHoveredItem(item)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <div className={`text-[10px] leading-tight font-bold mb-1 truncate w-full ${item.rarity === 'LEGENDARY' ? 'text-orange-400' : item.rarity === 'EPIC' ? 'text-purple-400' : item.rarity === 'RARE' ? 'text-blue-400' : 'text-stone-300'}`}>
                                {item.name}
                            </div>
                            <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                                {item.type === 'EQUIPMENT' ? (item.slot === 'WEAPON' ? '⚔️' : '🛡️') : 
                                 item.type === 'CONSUMABLE' ? '🍷' : 
                                 item.type === 'MATERIAL' ? '🪵' : '📦'}
                            </div>
                            <div className="absolute bottom-1 right-1 text-[10px] text-stone-500 font-mono">{item.count > 1 ? `x${item.count}` : ''}</div>
                            
                            {/* Mobile/Touch Actions Overlay (kept for click interactions) */}
                            <div className="absolute inset-0 bg-black/80 hidden group-hover:flex flex-col items-center justify-center gap-1 p-1 z-10 backdrop-blur-sm">
                                {item.type === 'EQUIPMENT' && <button onClick={() => onEquip(item)} className="text-[10px] bg-stone-700 w-full py-1 rounded hover:bg-stone-600 text-stone-200 font-bold border border-stone-600">Equip</button>}
                                {item.healAmount && <button onClick={() => onConsume(item)} className="text-[10px] bg-green-900 w-full py-1 rounded hover:bg-green-800 text-green-200 font-bold border border-green-800">Use</button>}
                                {item.type === 'GADGET' && <button onClick={() => onConsume(item)} className="text-[10px] bg-amber-900 w-full py-1 rounded hover:bg-amber-800 text-amber-200 font-bold border border-amber-800">Place</button>}
                                {item.type === 'BLUEPRINT' && <button onClick={() => onConsume(item)} className="text-[10px] bg-blue-900 w-full py-1 rounded hover:bg-blue-800 text-blue-200 font-bold border border-blue-800">Study</button>}
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
