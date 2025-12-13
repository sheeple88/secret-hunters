
import { Secret } from '../../types';

export const WORLD_SECRETS: Secret[] = [
    { 
        id: 'explorer', 
        type: 'WORLD',
        title: 'Explorer', 
        hint: 'The map is vast. Remove the fog.',
        description: 'Explore 100 tiles.', 
        statBonus: { dex: 1 }, 
        perkId: 'vision_plus', 
        condition: (gs) => Object.values(gs.exploration).flat().flat().filter(x=>x).length > 100 
    },
    { 
        id: 'frost_walker', 
        type: 'WORLD',
        title: 'Frost Walker', 
        hint: 'Seek the lands where water turns to stone.',
        description: 'Enter the Snow Biome.', 
        statBonus: { int: 2 }, 
        perkId: 'magic_blood', 
        condition: (gs) => gs.currentMapId.startsWith('map_') && parseInt(gs.currentMapId.split('_')[2]) < 5 
    },
    { 
        id: 'desert_nomad', 
        type: 'WORLD',
        title: 'Desert Nomad', 
        hint: 'Walk where the sun burns the hottest.',
        description: 'Enter the Desert Biome.', 
        statBonus: { regeneration: 2 }, 
        perkId: 'lava_resist', 
        condition: (gs) => gs.currentMapId.startsWith('map_') && parseInt(gs.currentMapId.split('_')[2]) > 15 
    },
    { 
        id: 'nocturnal', 
        type: 'WORLD',
        title: 'Nocturnal', 
        hint: 'Watch the clock strike the witching hour.',
        description: 'Stay awake until midnight (Time 2400).', 
        statBonus: { int: 2 }, 
        perkId: 'night_vision', 
        condition: (gs) => gs.time >= 2350 
    },
    { 
        id: 'marathon', 
        type: 'WORLD',
        title: 'Marathon Runner', 
        hint: 'A long journey begins with a single step. Take many.',
        description: 'Take 1,000 steps.', 
        statBonus: { dex: 2, hp: 10 }, 
        perkId: 'traveler', 
        condition: (gs) => (gs.counters['steps_taken'] || 0) >= 1000 
    },
];
