
import React from 'react';
import { 
  Backpack, BookOpen, Star, Ghost, 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand 
} from 'lucide-react';

interface GameControlsProps {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onOpenModal: (modal: string) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ onMove, onInteract, onOpenModal }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-auto">
        {/* Menu Bar */}
        <div className="flex gap-2 bg-stone-900/90 p-2 rounded-xl border-2 border-stone-700 shadow-xl backdrop-blur-sm">
            <button onClick={() => onOpenModal('INVENTORY')} className="p-3 bg-stone-800 rounded-lg border border-stone-600 hover:bg-stone-700 active:scale-95 transition-all" title="Inventory (I)"><Backpack className="w-6 h-6 text-stone-300"/></button>
            <button onClick={() => onOpenModal('SKILLS')} className="p-3 bg-stone-800 rounded-lg border border-stone-600 hover:bg-stone-700 active:scale-95 transition-all" title="Skills (K)"><BookOpen className="w-6 h-6 text-stone-300"/></button>
            <button onClick={() => onOpenModal('SECRETS')} className="p-3 bg-stone-800 rounded-lg border border-stone-600 hover:bg-stone-700 active:scale-95 transition-all" title="Journal"><Star className="w-6 h-6 text-yellow-500"/></button>
            <button onClick={() => onOpenModal('BESTIARY')} className="p-3 bg-stone-800 rounded-lg border border-stone-600 hover:bg-stone-700 active:scale-95 transition-all" title="Bestiary"><Ghost className="w-6 h-6 text-purple-500"/></button>
        </div>

        {/* D-Pad & Interact */}
        <div className="bg-stone-900/90 p-3 rounded-full border-2 border-stone-700 shadow-xl backdrop-blur-sm">
             <div className="grid grid-cols-3 gap-2">
                  <div />
                  <button className="w-14 h-14 bg-stone-800 rounded-lg flex items-center justify-center active:bg-stone-700 border border-stone-600 shadow-inner" onPointerDown={() => onMove(0, -1)}><ArrowUp className="w-8 h-8 text-stone-400"/></button>
                  <div />
                  
                  <button className="w-14 h-14 bg-stone-800 rounded-lg flex items-center justify-center active:bg-stone-700 border border-stone-600 shadow-inner" onPointerDown={() => onMove(-1, 0)}><ArrowLeft className="w-8 h-8 text-stone-400"/></button>
                  <button className="w-14 h-14 bg-amber-900/80 rounded-full flex items-center justify-center active:bg-amber-800 border-2 border-amber-700 shadow-inner" onClick={onInteract} title="Interact (E)">
                      <Hand className="w-6 h-6 text-amber-200"/>
                  </button>
                  <button className="w-14 h-14 bg-stone-800 rounded-lg flex items-center justify-center active:bg-stone-700 border border-stone-600 shadow-inner" onPointerDown={() => onMove(1, 0)}><ArrowRight className="w-8 h-8 text-stone-400"/></button>
                  
                  <div />
                  <button className="w-14 h-14 bg-stone-800 rounded-lg flex items-center justify-center active:bg-stone-700 border border-stone-600 shadow-inner" onPointerDown={() => onMove(0, 1)}><ArrowDown className="w-8 h-8 text-stone-400"/></button>
                  <div />
             </div>
        </div>
    </div>
  );
};
