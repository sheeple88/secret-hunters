
import { Secret } from '../../types';

export const INTERACTION_SECRETS: Secret[] = [
    { 
        id: 'relic_hunter', 
        type: 'INTERACTION',
        title: 'Relic Hunter', 
        hint: 'Ancient orbs hold ancient power. Find them.',
        description: 'Collect 3 Ancient Relics.', 
        statBonus: { int: 2 }, 
        perkId: 'midas_touch', // Swapped
        condition: (gs) => (gs.counters['relics_found'] || 0) >= 3 
    },
    { 
        id: 'puzzle_master', 
        type: 'INTERACTION',
        title: 'Puzzle Master', 
        hint: 'Use your brain, not your sword.',
        description: 'Solve a Puzzle.', 
        statBonus: { str: 2 }, 
        perkId: 'puzzle_mind', 
        condition: (gs) => (gs.counters['puzzles_solved'] || 0) >= 1 
    },
    { 
        id: 'rich_hunter', 
        type: 'INTERACTION',
        title: 'Tycoon', 
        hint: 'Greed is good. Amass wealth.',
        description: 'Amass 500 Gold.', 
        statBonus: { gold: 100 }, 
        perkId: 'midas_touch', 
        condition: (gs) => gs.stats.gold >= 500 
    },
    { 
        id: 'glutton', 
        type: 'INTERACTION',
        title: 'Glutton', 
        hint: 'A warrior marches on their stomach.',
        description: 'Consume 50 items.', 
        statBonus: { maxHp: 50 }, 
        perkId: 'tank', 
        condition: (gs) => (gs.counters['consumables_used'] || 0) >= 50 
    },
    { 
        id: 'scholar', 
        type: 'INTERACTION',
        title: 'Bookworm', 
        hint: 'Knowledge is hidden in plain sight. Read the signs.',
        description: 'Read 5 signs or books.', 
        statBonus: { int: 3 }, 
        perkId: 'scholar', 
        condition: (gs) => (gs.counters['lore_read'] || 0) >= 5 
    },
];
