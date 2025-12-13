
import { Secret } from '../../types';

export const NEW_COMBAT_SECRETS: Secret[] = [
    { 
        id: 'first_blood', 
        type: 'COMBAT',
        title: 'First Blood', 
        hint: 'Strike down your first foe.',
        description: 'Kill 1 Enemy.', 
        statBonus: { str: 1 }, 
        condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 1 
    },
    { 
        id: 'slayer', 
        type: 'COMBAT',
        title: 'Slayer', 
        hint: 'Make the world safer, one monster at a time.',
        description: 'Kill 50 Enemies.', 
        statBonus: { str: 2, dex: 2 }, 
        condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 50 
    },
    {
        id: 'tank_master',
        type: 'COMBAT',
        title: 'Iron Will',
        hint: 'What does not kill you makes you stronger.',
        description: 'Take 500 damage total.',
        statBonus: { maxHp: 50 },
        perkId: 'tank',
        condition: (gs) => (gs.counters['damage_taken'] || 0) >= 500
    },
    {
        id: 'weapon_master',
        type: 'COMBAT',
        title: 'Weapon Master',
        hint: 'Become proficient in the art of war.',
        description: 'Reach Level 10 in Attack.',
        statBonus: { str: 5 },
        condition: (gs) => gs.skills['Attack'] && gs.skills['Attack'].level >= 10
    },
    {
        id: 'glass_cannon',
        type: 'COMBAT',
        title: 'Glass Cannon',
        hint: 'Hit hard, strike true.',
        description: 'Deal a hit of 20+ damage.',
        statBonus: { str: 3 },
        perkId: 'berserker',
        condition: (gs) => gs.counters['max_hit_dealt'] !== undefined && gs.counters['max_hit_dealt'] >= 20
    }
];
