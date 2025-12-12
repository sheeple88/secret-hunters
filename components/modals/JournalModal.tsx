
import React from 'react';
import { Star, X } from 'lucide-react';
import { GameState } from '../../types';
import { PERKS } from '../../constants';
import { SecretsList } from '../secrets/SecretsList';

interface JournalModalProps {
  gameState: GameState;
  onClose: () => void;
  onTogglePerk: (id: string) => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({ gameState, onClose, onTogglePerk }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col p-4 md:p-10 animate-fade-in">
        <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto w-full border-b border-stone-800 pb-4">
            <h2 className="text-3xl font-bold text-yellow-500 flex items-center gap-3"><Star className="fill-current"/> Hunter's Journal</h2>
            <button onClick={onClose} className="p-2 bg-stone-800 rounded-full hover:bg-stone-700 transition-colors"><X/></button>
        </div>
        
        <div className="flex-1 overflow-hidden max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
            {/* Left Column: Secrets List */}
            <div className="flex flex-col h-full min-h-0 bg-stone-900/50 rounded-xl p-4 border border-stone-800">
                <h3 className="text-stone-300 font-bold mb-4 flex items-center gap-2 text-lg">
                    <span>Secrets Unlocked</span>
                </h3>
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <SecretsList secrets={gameState.secrets} />
                </div>
            </div>

            {/* Right Column: Perks */}
            <div className="flex flex-col h-full min-h-0 bg-stone-900/50 rounded-xl p-4 border border-stone-800">
                <h3 className="text-stone-300 font-bold mb-4 text-lg">Equipped Perks ({gameState.equippedPerks.length}/3)</h3>
                <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {gameState.unlockedPerks.map(pid => {
                            const p = PERKS[pid];
                            if (!p) return null;
                            const equipped = gameState.equippedPerks.includes(pid);
                            return (
                                <button 
                                    key={pid} 
                                    onClick={() => onTogglePerk(pid)} 
                                    className={`relative p-3 rounded-lg border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                        equipped 
                                        ? 'bg-blue-900/50 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                        : 'bg-stone-800 border-stone-700 hover:border-stone-500 hover:bg-stone-750'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-3xl bg-stone-900 rounded-full w-10 h-10 flex items-center justify-center border border-stone-700">{p.icon}</div>
                                        {equipped && <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"/>}
                                    </div>
                                    <div className={`font-bold text-sm mb-1 ${equipped ? 'text-blue-100' : 'text-stone-300'}`}>{p.name}</div>
                                    <div className="text-xs text-stone-500 leading-tight">{p.description}</div>
                                </button>
                            );
                        })}
                        {gameState.unlockedPerks.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-48 text-stone-600 italic border-2 border-dashed border-stone-800 rounded-lg">
                                <Star className="w-12 h-12 mb-2 opacity-20"/>
                                <span>Unlock secrets to reveal perks.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
