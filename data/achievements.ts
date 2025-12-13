
import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
    // --- COMBAT ---
    { 
        id: 'novice_hunter', 
        title: 'Novice Hunter', 
        description: 'Kill 10 Enemies.', 
        reward: { gold: 50, xp: 100 }, 
        condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 10,
        progress: (gs) => Math.min(1, (gs.counters['enemies_killed'] || 0) / 10)
    },
    { 
        id: 'expert_hunter', 
        title: 'Expert Hunter', 
        description: 'Kill 100 Enemies.', 
        reward: { gold: 500, xp: 1000 }, 
        condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 100,
        progress: (gs) => Math.min(1, (gs.counters['enemies_killed'] || 0) / 100)
    },
    { 
        id: 'master_hunter', 
        title: 'Master Hunter', 
        description: 'Kill 1,000 Enemies.', 
        reward: { gold: 5000, xp: 10000 }, 
        condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 1000,
        progress: (gs) => Math.min(1, (gs.counters['enemies_killed'] || 0) / 1000)
    },

    // --- GATHERING ---
    { 
        id: 'lumberjack_1', 
        title: 'Wood Chopper', 
        description: 'Chop 50 Trees.', 
        reward: { gold: 100, xp: 200 }, 
        condition: (gs) => (gs.counters['trees_cut'] || 0) >= 50,
        progress: (gs) => Math.min(1, (gs.counters['trees_cut'] || 0) / 50)
    },
    { 
        id: 'miner_1', 
        title: 'Rock Breaker', 
        description: 'Mine 50 Rocks.', 
        reward: { gold: 100, xp: 200 }, 
        condition: (gs) => (gs.counters['rocks_mined'] || 0) >= 50,
        progress: (gs) => Math.min(1, (gs.counters['rocks_mined'] || 0) / 50)
    },
    { 
        id: 'angler_1', 
        title: 'Fisherman', 
        description: 'Catch 25 Fish.', 
        reward: { gold: 100, xp: 200 }, 
        condition: (gs) => (gs.counters['fish_caught'] || 0) >= 25,
        progress: (gs) => Math.min(1, (gs.counters['fish_caught'] || 0) / 25)
    },

    // --- PROGRESSION ---
    { 
        id: 'level_10', 
        title: 'Growing Stronger', 
        description: 'Reach Level 10.', 
        reward: { gold: 200 }, 
        condition: (gs) => gs.stats.level >= 10,
        progress: (gs) => Math.min(1, gs.stats.level / 10)
    },
    { 
        id: 'level_25', 
        title: 'Seasoned Adventurer', 
        description: 'Reach Level 25.', 
        reward: { gold: 1000 }, 
        condition: (gs) => gs.stats.level >= 25,
        progress: (gs) => Math.min(1, gs.stats.level / 25)
    },
    { 
        id: 'hoarder', 
        title: 'Hoarder', 
        description: 'Hold 1,000 Gold at once.', 
        reward: { xp: 500 }, 
        condition: (gs) => gs.stats.gold >= 1000,
        progress: (gs) => Math.min(1, gs.stats.gold / 1000)
    },
];
