
import { Secret } from '../../types';

export const COMBAT_SECRETS: Secret[] = [
    { 
        id: 'survivor', 
        type: 'COMBAT',
        title: 'Survivor', 
        hint: 'Endurance is key. Pain is a lesson.',
        description: 'Take 100 damage total.', 
        statBonus: { maxHp: 10 }, 
        perkId: 'iron_skin', 
        condition: (gs) => (gs.counters['damage_taken'] || 0) >= 100 
    },
    { 
        id: 'dragon_slayer', 
        type: 'COMBAT',
        title: 'Dragon Slayer', 
        hint: 'Find the beast of legend in the deepest fires.',
        description: 'Kill a Dragon.', 
        statBonus: { str: 50, dex: 20 }, 
        perkId: 'xp_boost', 
        condition: (gs) => gs.bestiary.some(n => n.includes('Dragon')) 
    },
    { 
        id: 'mimic_hunter', 
        type: 'COMBAT',
        title: 'Trap Master', 
        hint: 'Not all treasures are what they seem.',
        description: 'Kill a Mimic.', 
        statBonus: { dex: 10 }, 
        perkId: 'secret_sense', 
        condition: (gs) => gs.bestiary.some(n => n.includes('Mimic')) 
    },
    {
        id: 'ironclad',
        type: 'COMBAT',
        title: 'Ironclad',
        hint: 'Become an anvil that cannot be broken.',
        description: 'Take 5,000 damage total.',
        statBonus: { maxHp: 100 },
        perkId: 'tank',
        condition: (gs) => (gs.counters['damage_taken'] || 0) >= 5000
    },
    {
        id: 'combat_apprentice',
        type: 'COMBAT',
        title: 'Combat Apprentice',
        hint: 'Train your arm to strike true.',
        description: 'Reach Level 10 Attack.',
        statBonus: { str: 2 },
        condition: (gs) => gs.skills['Attack'] && gs.skills['Attack'].level >= 10
    },
    {
        id: 'heavy_hitter',
        type: 'COMBAT',
        title: 'Heavy Hitter',
        hint: 'True power comes from within.',
        description: 'Reach Level 20 Strength.',
        statBonus: { str: 5 },
        perkId: 'titan_grip',
        condition: (gs) => gs.skills['Strength'] && gs.skills['Strength'].level >= 20
    }
];
