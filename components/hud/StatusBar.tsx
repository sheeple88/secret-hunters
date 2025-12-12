
import React from 'react';
import { Heart, Zap, Coins, Sun, Moon } from 'lucide-react';
import { GameState, Stats } from '../../types';
import { formatNumber, calculateXpForLevel } from '../../constants';

interface StatusBarProps {
  gameState: GameState;
  playerStats: Stats;
  formatTime: (t: number) => string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ gameState, playerStats, formatTime }) => {
  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {/* HP & Level */}
        <div className="flex gap-2 pointer-events-auto">
            <div className="bg-stone-900/90 p-2 rounded-lg border-2 border-stone-700 flex items-center gap-3 shadow-lg min-w-[140px]">
                <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse-slow"/>
                <div className="flex flex-col w-full">
                    <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Health</span>
                    <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (gameState.stats.hp / playerStats.maxHp) * 100)}%` }}/>
                    </div>
                    <span className="text-xs text-stone-200 font-mono mt-1">{formatNumber(gameState.stats.hp)}/{formatNumber(playerStats.maxHp)}</span>
                </div>
            </div>
            
            <div className="bg-stone-900/90 p-2 rounded-lg border-2 border-stone-700 flex items-center gap-3 shadow-lg min-w-[120px]">
                <Zap className="w-5 h-5 text-yellow-400 fill-current"/>
                <div className="flex flex-col w-full">
                    <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Level {gameState.stats.level}</span>
                    <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (gameState.stats.xp / calculateXpForLevel(gameState.stats.level + 1)) * 100)}%` }}/>
                    </div>
                </div>
            </div>
        </div>

        {/* Gold & Time */}
        <div className="flex gap-2 pointer-events-auto">
             <div className="bg-stone-900/90 px-3 py-1 rounded-lg border border-stone-700 flex items-center gap-2 shadow-lg text-amber-400 font-bold font-mono">
                <Coins className="w-4 h-4"/> {formatNumber(gameState.stats.gold)}
             </div>
             <div className="bg-stone-900/90 px-3 py-1 rounded-lg border border-stone-700 flex items-center gap-2 shadow-lg text-blue-300 font-bold font-mono">
                {gameState.time > 600 && gameState.time < 1900 ? <Sun className="w-4 h-4 text-yellow-500"/> : <Moon className="w-4 h-4 text-blue-400"/>}
                {formatTime(gameState.time)}
             </div>
        </div>
    </div>
  );
};
