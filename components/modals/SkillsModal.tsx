
import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { GameState, Skill } from '../../types';
import { formatNumber } from '../../constants';

interface SkillsModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ gameState, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-stone-900 w-full max-w-lg p-6 rounded-xl border-4 border-stone-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-stone-200 flex items-center gap-2"><BookOpen/> Skills</h2>
                <button onClick={onClose}><X className="w-6 h-6 hover:text-red-400"/></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {(Object.values(gameState.skills) as Skill[]).map(skill => (
                    <div key={skill.name} className="bg-stone-950 p-3 rounded border border-stone-800">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-stone-300">{skill.name}</span>
                            <span className="text-yellow-500 font-mono">Lvl {skill.level}</span>
                        </div>
                        <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${(skill.xp % 10) * 10}%` }} />
                        </div>
                        <div className="text-xs text-stone-500 mt-1 text-right">Total XP: {formatNumber(skill.xp)}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};
