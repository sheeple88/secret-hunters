
import React from 'react';
import { LogEntry } from '../../types';

interface ActionLogProps {
  logs: LogEntry[];
}

export const ActionLog: React.FC<ActionLogProps> = ({ logs }) => {
  return (
    <div className="fixed bottom-6 left-6 z-40 w-64 md:w-80 h-48 pointer-events-none">
        <div className="w-full h-full flex flex-col justify-end overflow-hidden mask-image-gradient">
            {logs.filter(l => l.type !== 'DEBUG').slice(0, 8).map((log, i) => (
                <div key={log.id} className={`text-xs md:text-sm mb-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-[1px] animate-slide-in ${
                    log.type === 'COMBAT' ? 'text-red-300 border-l-2 border-red-500' :
                    log.type === 'SECRET' ? 'text-yellow-300 border-l-2 border-yellow-500 font-bold' :
                    log.type === 'LOOT' ? 'text-green-300 border-l-2 border-green-500' :
                    log.type === 'QUEST' ? 'text-orange-300 border-l-2 border-orange-500' :
                    'text-stone-300'
                }`} style={{ opacity: 1 - (i * 0.1) }}>
                    {log.message}
                </div>
            ))}
        </div>
    </div>
  );
};
