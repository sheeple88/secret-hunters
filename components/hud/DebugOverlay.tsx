
import React from 'react';
import { LogEntry, GameState } from '../../types';

interface DebugOverlayProps {
  logs: LogEntry[];
  gameState: GameState;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ logs, gameState }) => {
  const debugLogs = logs.filter(l => l.type === 'DEBUG' || l.message.startsWith('Teleport:')).slice(-10);

  return (
    <div className="fixed bottom-32 left-4 z-50 pointer-events-none opacity-80">
        <div className="bg-black/80 p-2 rounded border border-cyan-900/50 text-[10px] font-mono text-cyan-500 max-w-[300px]">
            <div className="border-b border-cyan-900/50 mb-1 pb-1 font-bold flex justify-between">
                <span>SYSTEM LOG</span>
                <span>POS: {gameState.playerPos.x}, {gameState.playerPos.y}</span>
            </div>
            <div className="flex flex-col gap-0.5">
                {debugLogs.map(log => (
                    <div key={log.id} className="whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="text-stone-500">[{new Date(log.timestamp).toISOString().split('T')[1].split('.')[0]}]</span> {log.message}
                    </div>
                ))}
                {debugLogs.length === 0 && <div className="text-stone-700 italic">No movement logs...</div>}
            </div>
        </div>
    </div>
  );
};
