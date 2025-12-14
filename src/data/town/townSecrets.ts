
import { Secret } from '../../types';

export const TOWN_SECRETS: Secret[] = [
    { 
        id: 'town_gossip', 
        type: 'INTERACTION',
        title: 'Town Gossip', 
        hint: 'Listen to the people. Everyone has a story.',
        description: 'Talk to 10 different NPCs in Town.', 
        statBonus: { int: 2 }, 
        condition: (gs) => {
            const uniqueTalks = Object.keys(gs.flags).filter(k => k.startsWith('talked_to_')).length;
            return uniqueTalks >= 10;
        }
    },
    { 
        id: 'chicken_chaser', 
        type: 'INTERACTION',
        title: 'Chicken Chaser', 
        hint: 'Do chickens like being poked?',
        description: 'Interact with a Chicken.', 
        statBonus: { dex: 1 }, 
        condition: (gs) => gs.lastAction === 'POKE_CHICKEN'
    },
    { 
        id: 'night_owl', 
        type: 'WORLD',
        title: 'Night Watch', 
        hint: 'The town changes when the sun goes down.',
        description: 'Be in town at midnight (Time 0).', 
        statBonus: { int: 3 }, 
        perkId: 'night_vision',
        condition: (gs) => gs.currentMapId === 'map_10_10' && gs.time === 0
    },
    { 
        id: 'fountain_wish', 
        type: 'INTERACTION',
        title: 'Well Wisher', 
        hint: 'Toss a coin to your... water source.',
        description: 'Interact with the Town Fountain.', 
        statBonus: { luck: 1 } as any, // Luck implicitly handled or just flavor
        perkId: 'midas_touch',
        condition: (gs) => gs.lastAction === 'USE_FOUNTAIN'
    }
];
