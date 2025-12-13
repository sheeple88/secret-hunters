
import React from 'react';
import { Secret } from '../../types';
import { PERKS } from '../../constants';
import { Lock, Unlock, HelpCircle } from 'lucide-react';

interface SecretsListProps {
  secrets: Secret[];
  unlockedSecretIds: string[];
}

export const SecretsList: React.FC<SecretsListProps> = ({ secrets, unlockedSecretIds }) => {
  const unlockedCount = secrets.filter(s => unlockedSecretIds.includes(s.id)).length;
  
  return (
    <div className="flex flex-col h-full min-h-0">
        <div className="mb-4 flex items-center justify-between bg-stone-950 p-3 rounded-lg border border-stone-800 shrink-0">
            <span className="text-stone-400 font-bold uppercase text-sm">Progress</span>
            <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full transition-all duration-1000" style={{ width: `${(unlockedCount / Math.max(1, secrets.length)) * 100}%` }}/>
                </div>
                <span className="text-yellow-500 font-mono text-sm">{unlockedCount}/{secrets.length}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 min-h-0">
            {secrets.map(secret => {
                const isUnlocked = unlockedSecretIds.includes(secret.id);
                const perk = secret.perkId ? PERKS[secret.perkId] : null;
                return (
                    <div key={secret.id} className={`relative p-4 rounded-lg border-2 transition-all duration-300 group ${isUnlocked ? 'bg-stone-800 border-yellow-600/50 shadow-lg shadow-yellow-900/10' : 'bg-stone-900 border-stone-800 opacity-80'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-2 rounded-full ${isUnlocked ? 'bg-yellow-900/30 text-yellow-400' : 'bg-stone-950 text-stone-600'}`}>
                                    {isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-lg leading-none mb-1 ${isUnlocked ? 'text-yellow-100' : 'text-stone-500'}`}>
                                        {isUnlocked ? secret.title : '???'}
                                    </h4>
                                    <p className="text-sm text-stone-400 italic">
                                        {isUnlocked ? secret.description : secret.hint}
                                    </p>
                                </div>
                            </div>
                            <div className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">{secret.type}</div>
                        </div>

                        {isUnlocked && perk && (
                            <div className="mt-3 pt-3 border-t border-stone-700/50 flex items-center gap-2">
                                <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Reward:</span>
                                <div className="flex items-center gap-1 bg-stone-900 px-2 py-0.5 rounded text-xs text-blue-300 border border-stone-700">
                                    <span>{perk.icon}</span>
                                    <span>{perk.name}</span>
                                </div>
                            </div>
                        )}
                        
                        {isUnlocked && secret.statBonus && (
                             <div className="mt-1 flex items-center gap-2 text-[10px] text-green-400 font-mono">
                                 <span>+STATS:</span>
                                 {Object.entries(secret.statBonus).map(([k,v]) => (
                                     <span key={k}>{k.toUpperCase()} +{v}</span>
                                 ))}
                             </div>
                        )}
                        
                        {!isUnlocked && (
                            <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center backdrop-blur-[1px] rounded-lg transition-all z-10 pointer-events-none">
                                <div className="bg-stone-900 px-3 py-1 rounded border border-stone-700 flex items-center gap-2 text-xs text-stone-300 shadow-xl">
                                    <HelpCircle size={12}/> Hint: {secret.hint}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};
