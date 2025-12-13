
import React from 'react';
import { Heart, Zap, Coins, Sun, Moon, MapPin, Compass } from 'lucide-react';
import { GameState, Stats } from '../../types';
import { formatNumber, calculateXpForLevel } from '../../constants';

interface StatusBarProps {
  gameState: GameState;
  playerStats: Stats;
  formatTime: (t: number) => string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ gameState, playerStats, formatTime }) => {
  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none font-vt323 transform scale-75 origin-top-left md:scale-100 transition-transform">
        {/* HP & Level Row */}
        <div className="flex items-center gap-2 pointer-events-auto">
            {/* Health Bar */}
            <div className="bg-stone-900/90 p-1.5 pr-3 rounded-xl border-2 border-stone-700 flex items-center gap-3 shadow-xl backdrop-blur-sm min-w-[160px] group transition-all hover:scale-105 hover:border-red-900">
                <div className="bg-stone-950 p-1.5 rounded-lg border border-stone-800 group-hover:border-red-900/50 transition-colors">
                    <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse-slow"/>
                </div>
                <div className="flex flex-col w-full gap-0.5">
                    <div className="flex justify-between items-end">
                        <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Health</span>
                        <span className="text-xs text-stone-200 font-mono">{formatNumber(gameState.stats.hp)}/{formatNumber(playerStats.maxHp)}</span>
                    </div>
                    <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
                        <div className="bg-gradient-to-r from-red-600 to-red-500 h-full transition-all duration-500 relative" style={{ width: `${Math.min(100, (gameState.stats.hp / playerStats.maxHp) * 100)}%` }}>
                             <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/30" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Level Badge */}
            <div className="bg-stone-900/90 p-1.5 pr-3 rounded-xl border-2 border-stone-700 flex items-center gap-3 shadow-xl backdrop-blur-sm group transition-all hover:scale-105 hover:border-yellow-900">
                <div className="bg-stone-950 p-1.5 rounded-lg border border-stone-800 group-hover:border-yellow-900/50 transition-colors">
                     <Zap className="w-5 h-5 text-yellow-400 fill-current"/>
                </div>
                <div className="flex flex-col w-full gap-0.5">
                     <div className="flex justify-between items-end">
                        <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Lvl {gameState.stats.level}</span>
                        <span className="text-[10px] text-stone-500 font-mono">{(gameState.stats.xp / calculateXpForLevel(gameState.stats.level + 1) * 100).toFixed(0)}%</span>
                     </div>
                    <div className="w-24 bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
                        <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full transition-all duration-500" style={{ width: `${Math.min(100, (gameState.stats.xp / calculateXpForLevel(gameState.stats.level + 1)) * 100)}%` }}/>
                    </div>
                </div>
            </div>
        </div>

        {/* Currency, Time & GPS Row */}
        <div className="flex gap-2 pointer-events-auto">
             <div className="bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-2 shadow-lg backdrop-blur-sm text-amber-400 font-bold font-mono tracking-wide text-lg min-w-[80px] justify-center">
                <Coins className="w-4 h-4 text-amber-500"/> {formatNumber(gameState.stats.gold)}
             </div>
             
             <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 shadow-lg backdrop-blur-sm font-bold font-mono tracking-wide text-lg transition-colors duration-1000 ${gameState.time > 600 && gameState.time < 1900 ? 'bg-sky-900/80 border-sky-700 text-sky-200' : 'bg-slate-900/90 border-slate-700 text-slate-300'}`}>
                {gameState.time > 600 && gameState.time < 1900 ? <Sun className="w-4 h-4 text-yellow-300 animate-spin-slow"/> : <Moon className="w-4 h-4 text-slate-400"/>}
                {formatTime(gameState.time)}
             </div>

             {/* Debug / GPS Info */}
             <div className="bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-2 shadow-lg backdrop-blur-sm text-stone-400 font-mono text-xs">
                <Compass className="w-3 h-3 text-cyan-500"/>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-stone-500">{gameState.currentMapId}</span>
                    <span className="text-cyan-200 font-bold">X:{gameState.playerPos.x} Y:{gameState.playerPos.y}</span>
                </div>
             </div>
        </div>
    </div>
  );
};
