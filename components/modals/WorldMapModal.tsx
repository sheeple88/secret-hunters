
import React, { useMemo } from 'react';
import { Map as MapIcon, X, MapPin } from 'lucide-react';
import { GameState } from '../../types';

interface WorldMapModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({ gameState, onClose }) => {
    // Generate grid 20x20
    const grid = useMemo(() => {
        const g = [];
        for(let y=0; y<20; y++) {
            const row = [];
            for(let x=0; x<20; x++) {
                const id = `map_${x}_${y}`;
                const isVisited = !!gameState.exploration[id];
                const isCurrent = gameState.currentMapId === id;
                const isTown = id === 'map_10_10';
                
                // Determine color
                let color = "bg-stone-900"; // Hidden
                if (isVisited) {
                    if (y < 5) color = "bg-cyan-100"; // Snow
                    else if (y > 15) color = "bg-yellow-200"; // Desert
                    else color = "bg-green-600"; // Grass
                    
                    if (isTown) color = "bg-blue-600";
                }
                
                row.push({ id, x, y, isVisited, isCurrent, isTown, color });
            }
            g.push(row);
        }
        return g;
    }, [gameState.exploration, gameState.currentMapId]);

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col p-4 animate-fade-in items-center justify-center">
             <div className="bg-stone-800 p-6 rounded-xl border-4 border-stone-600 shadow-2xl w-full max-w-2xl aspect-square flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-3xl font-bold text-stone-200 flex items-center gap-3"><MapIcon/> World Map</h2>
                    <button onClick={onClose} className="p-2 bg-stone-700 rounded-full hover:bg-stone-600"><X/></button>
                </div>
                
                <div className="flex-1 bg-stone-950 border-2 border-stone-700 rounded p-2 relative overflow-hidden">
                    <div className="w-full h-full grid grid-rows-[repeat(20,minmax(0,1fr))] gap-[1px] bg-stone-900">
                        {grid.map((row, y) => (
                            <div key={y} className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[1px]">
                                {row.map(cell => (
                                    <div 
                                        key={cell.id} 
                                        className={`relative w-full h-full ${cell.isVisited ? cell.color : 'bg-stone-900 opacity-20'} transition-colors`}
                                        title={cell.isVisited ? (cell.isTown ? "Haven's Rest" : `Zone ${cell.x}-${cell.y}`) : "Unknown"}
                                    >
                                        {cell.isCurrent && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }} />
                                            </div>
                                        )}
                                        {cell.isTown && cell.isVisited && !cell.isCurrent && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"/>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="mt-4 flex gap-4 text-sm text-stone-400 shrink-0 justify-center">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-600 rounded"/> Grasslands</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-100 rounded"/> Snow</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-200 rounded"/> Desert</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded"/> Town</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-stone-900 border border-stone-700 rounded opacity-50"/> Unknown</div>
                </div>
             </div>
        </div>
    );
};
