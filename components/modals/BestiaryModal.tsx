
import React from 'react';
import { Ghost, X } from 'lucide-react';
import { GameState } from '../../types';
import { ASSETS } from '../../assets';

interface BestiaryModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ gameState, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col p-4 animate-fade-in">
         <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-purple-400 flex items-center gap-3"><Ghost/> Bestiary</h2>
                <button onClick={onClose} className="p-2 bg-stone-800 rounded-full"><X/></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 overflow-y-auto">
                {gameState.bestiary.map(name => (
                    <div key={name} className="bg-stone-800 p-4 rounded-xl border border-stone-700 flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center text-4xl">
                            {/* Simple asset mapping based on name match */}
                            <img 
                                src={Object.entries(ASSETS).find(([k]) => name.toUpperCase().includes(k))?.[1] || ASSETS.SLIME} 
                                className="w-12 h-12 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                                alt={name}
                            />
                        </div>
                        <div className="text-sm font-bold text-stone-300 leading-tight">{name}</div>
                    </div>
                ))}
                {gameState.bestiary.length === 0 && <div className="text-stone-500 col-span-full text-center py-20 text-xl">Explore the world to find monsters.</div>}
            </div>
         </div>
    </div>
  );
};
