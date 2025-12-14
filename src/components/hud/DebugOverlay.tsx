
import React from 'react';
import { LogEntry, GameState } from '../../types';
import { MAPS } from '../../constants';

interface DebugOverlayProps {
  logs: LogEntry[];
  gameState: GameState;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ logs, gameState }) => {
  const currentMap = MAPS[gameState.currentMapId];

  return (
    <div className="fixed top-2 right-2 z-[100] pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
        <div className="bg-black/80 text-green-400 font-mono text-[10px] p-2 rounded border border-green-900 shadow-xl max-w-xs">
            <div className="font-bold border-b border-green-900 mb-1 pb-1">DEV MONITOR (v6)</div>
            <div><span className="text-stone-500">Map ID:</span> {gameState.currentMapId}</div>
            <div><span className="text-stone-500">Size:</span> <span className="text-yellow-400">{currentMap?.width}x{currentMap?.height}</span></div>
            <div><span className="text-stone-500">Pos:</span> {gameState.playerPos.x}, {gameState.playerPos.y}</div>
            <div className="mt-1 pt-1 border-t border-green-900 text-stone-600">
                Mem: {Object.keys(MAPS).length} maps loaded
            </div>
        </div>
    </div>
  );
};
