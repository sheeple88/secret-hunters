
import React from 'react';
import { Scroll, CheckCircle, Circle } from 'lucide-react';
import { Quest } from '../../types';

interface QuestTrackerProps {
  quest: Quest | null;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ quest }) => {
  if (!quest) return null;

  return (
    <div className="fixed top-24 left-4 z-40 bg-stone-900/90 p-3 rounded-lg border-2 border-orange-700/50 shadow-xl backdrop-blur-sm max-w-[200px] animate-slide-in-left pointer-events-none">
        <div className="flex items-center gap-2 mb-1 border-b border-stone-700 pb-1">
            <Scroll className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-200">Current Quest</span>
        </div>
        <div className="text-xs font-bold text-stone-300 mb-1">{quest.title}</div>
        <div className="text-[10px] text-stone-400 mb-2 italic leading-tight">{quest.description}</div>
        
        <div className="flex items-center justify-between text-xs bg-black/40 p-1 rounded">
            <span className="text-stone-400 truncate max-w-[80px]" title={quest.targetId}>{quest.targetId}</span>
            <div className="flex items-center gap-1 font-mono text-orange-300">
                {quest.currentCount >= quest.targetCount ? <CheckCircle className="w-3 h-3 text-green-500"/> : <Circle className="w-3 h-3"/>}
                {quest.currentCount}/{quest.targetCount}
            </div>
        </div>
    </div>
  );
};
