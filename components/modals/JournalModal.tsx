
import React, { useState } from 'react';
import { Star, X, Trophy, Lock, Unlock, HelpCircle } from 'lucide-react';
import { GameState } from '../../types';
import { PERKS } from '../../constants';
import { ALL_SECRETS } from '../../data/secrets/index';
import { ACHIEVEMENTS } from '../../data/achievements';

interface JournalModalProps {
  gameState: GameState;
  onClose: () => void;
  onTogglePerk: (id: string) => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({ gameState, onClose, onTogglePerk }) => {
  const [tab, setTab] = useState<'SECRETS' | 'ACHIEVEMENTS' | 'PERKS'>('SECRETS');

  const unlockedSecretCount = gameState.unlockedSecretIds.length;
  const unlockedAchievementCount = gameState.unlockedAchievementIds.length;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col p-4 md:p-10 animate-fade-in">
        <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto w-full border-b border-stone-800 pb-4">
            <h2 className="text-3xl font-bold text-yellow-500 flex items-center gap-3"><Star className="fill-current"/> Hunter's Journal</h2>
            <button onClick={onClose} className="p-2 bg-stone-800 rounded-full hover:bg-stone-700 transition-colors"><X/></button>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-center mb-4 max-w-5xl mx-auto w-full gap-2">
            <button onClick={() => setTab('SECRETS')} className={`px-4 py-2 rounded-t-lg font-bold flex items-center gap-2 ${tab === 'SECRETS' ? 'bg-stone-800 text-yellow-400' : 'bg-stone-900 text-stone-500 hover:text-stone-300'}`}>
                <Star size={16}/> Secrets ({unlockedSecretCount})
            </button>
            <button onClick={() => setTab('ACHIEVEMENTS')} className={`px-4 py-2 rounded-t-lg font-bold flex items-center gap-2 ${tab === 'ACHIEVEMENTS' ? 'bg-stone-800 text-purple-400' : 'bg-stone-900 text-stone-500 hover:text-stone-300'}`}>
                <Trophy size={16}/> Achievements ({unlockedAchievementCount})
            </button>
            <button onClick={() => setTab('PERKS')} className={`px-4 py-2 rounded-t-lg font-bold flex items-center gap-2 ${tab === 'PERKS' ? 'bg-stone-800 text-blue-400' : 'bg-stone-900 text-stone-500 hover:text-stone-300'}`}>
                <Lock size={16}/> Perks ({gameState.equippedPerks.length}/3)
            </button>
        </div>

        <div className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full min-h-0 bg-stone-900/50 rounded-xl p-4 border border-stone-800">
            
            {/* SECRETS TAB */}
            {tab === 'SECRETS' && (
                <div className="grid grid-cols-1 gap-3">
                    {ALL_SECRETS.map(secret => {
                        const unlocked = gameState.unlockedSecretIds.includes(secret.id);
                        const perk = secret.perkId ? PERKS[secret.perkId] : null;
                        
                        return (
                            <div key={secret.id} className={`relative p-4 rounded-lg border-2 transition-all duration-300 group ${unlocked ? 'bg-stone-800 border-yellow-600/50 shadow-lg shadow-yellow-900/10' : 'bg-stone-900 border-stone-800 opacity-80'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 p-2 rounded-full ${unlocked ? 'bg-yellow-900/30 text-yellow-400' : 'bg-stone-950 text-stone-600'}`}>
                                            {unlocked ? <Unlock size={18} /> : <Lock size={18} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg leading-none mb-1 ${unlocked ? 'text-yellow-100' : 'text-stone-500'}`}>
                                                {unlocked ? secret.title : '???'}
                                            </h4>
                                            <p className="text-sm text-stone-400 italic">
                                                {unlocked ? secret.description : secret.hint}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono text-stone-600 uppercase tracking-widest">{secret.type}</div>
                                </div>

                                {unlocked && perk && (
                                    <div className="mt-3 pt-3 border-t border-stone-700/50 flex items-center gap-2">
                                        <span className="text-xs text-stone-500 uppercase font-bold tracking-wider">Reward:</span>
                                        <div className="flex items-center gap-1 bg-stone-900 px-2 py-0.5 rounded text-xs text-blue-300 border border-stone-700">
                                            <span>{perk.icon}</span>
                                            <span>{perk.name}</span>
                                        </div>
                                    </div>
                                )}
                                
                                {!unlocked && (
                                    <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center backdrop-blur-[1px] rounded-lg transition-all">
                                        <div className="bg-stone-900 px-3 py-1 rounded border border-stone-700 flex items-center gap-2 text-xs text-stone-300">
                                            <HelpCircle size={12}/> Hint: {secret.hint}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {tab === 'ACHIEVEMENTS' && (
                <div className="grid grid-cols-1 gap-3">
                    {ACHIEVEMENTS.map(ach => {
                        const unlocked = gameState.unlockedAchievementIds.includes(ach.id);
                        const progress = ach.progress ? ach.progress(gameState) : (unlocked ? 1 : 0);
                        
                        return (
                            <div key={ach.id} className={`p-4 rounded-lg border-2 flex flex-col gap-2 ${unlocked ? 'bg-stone-800 border-purple-600/50' : 'bg-stone-950 border-stone-800'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${unlocked ? 'bg-purple-900/30 text-purple-400' : 'bg-stone-900 text-stone-600'}`}>
                                            <Trophy size={18}/>
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${unlocked ? 'text-purple-100' : 'text-stone-400'}`}>{ach.title}</h4>
                                            <p className="text-xs text-stone-500">{ach.description}</p>
                                        </div>
                                    </div>
                                    {unlocked && <div className="text-purple-400 text-xs font-bold px-2 py-1 bg-purple-900/20 rounded">COMPLETED</div>}
                                </div>
                                
                                <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden mt-1 border border-stone-800">
                                    <div className="bg-purple-600 h-full transition-all duration-1000" style={{ width: `${progress * 100}%` }}/>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-stone-500 uppercase font-mono">
                                    <span>Reward: {ach.reward.gold ? `${ach.reward.gold}g ` : ''}{ach.reward.xp ? `${ach.reward.xp}xp` : ''}</span>
                                    <span>{(progress * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* PERKS TAB */}
            {tab === 'PERKS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
            )}
        </div>
    </div>
  );
};
