
import { GameState, Quest, LogEntry } from '../types';
import { uid } from './mapUtils';

export const checkQuestUpdate = (
    quest: Quest | null, 
    type: 'KILL' | 'COLLECT', 
    targetId: string, 
    amount: number = 1
): { newQuest: Quest, log?: LogEntry } | null => {
    
    if (!quest || quest.completed || quest.type !== type) return null;

    // For kills, we match partial names (e.g. "Giant Rat" counts for "Rat")
    const isMatch = type === 'KILL' 
        ? targetId.includes(quest.targetId) 
        : targetId === quest.targetId;

    if (!isMatch) return null;

    const newCount = Math.min(quest.targetCount, quest.currentCount + amount);
    
    if (newCount === quest.currentCount) return null; // No change

    const newQuest = { ...quest, currentCount: newCount };
    let log: LogEntry | undefined;

    if (newCount >= quest.targetCount && quest.currentCount < quest.targetCount) {
        // Just completed
        log = { 
            id: uid(), 
            message: `Quest Completed: ${quest.title}! Return to ${quest.giverId.split('_')[0]}`, 
            type: 'QUEST', 
            timestamp: Date.now() 
        };
    } else {
        // Progress update (optional: don't spam logs for every single item if we have a tracker)
        // Only log milestones or if tracker isn't enough? Tracker is good.
    }

    return { newQuest, log };
};
