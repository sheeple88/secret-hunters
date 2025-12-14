
import { Secret, GameState, SkillName } from '../../types';
import { MONSTER_TEMPLATES, ITEMS, INITIAL_SKILLS } from '../../constants';

// Helper to create a secret
const create = (
    id: string, 
    type: Secret['type'], 
    title: string, 
    hint: string, 
    description: string, 
    condition: (gs: GameState) => boolean, 
    reward: any = {}
): Secret => ({
    id, type, title, hint, description, condition, ...reward
});

export const generateProceduralSecrets = (): Secret[] => {
    const secrets: Secret[] = [];

    // --- 1. KILL SECRETS (Aggressive generation for every monster) ---
    // Tiers: 10, 50, 100, 500, 1000 kills
    const killTiers = [
        { count: 10, suffix: 'Hunter', stat: { str: 1 } },
        { count: 50, suffix: 'Slayer', stat: { str: 2, dex: 1 } },
        { count: 100, suffix: 'Butcher', stat: { str: 3, dex: 2 } },
        { count: 500, suffix: 'Executioner', stat: { str: 5, dex: 5, hp: 20 }, title: true },
        { count: 1000, suffix: 'Nemesis', stat: { str: 10, dex: 10, maxHp: 50 }, title: true }
    ];

    Object.keys(MONSTER_TEMPLATES).forEach(mobName => {
        killTiers.forEach(tier => {
            const reward: any = { statBonus: tier.stat };
            if (tier.title) reward.titleReward = `${mobName} ${tier.suffix}`;
            
            secrets.push(create(
                `kill_${tier.count}_${mobName}`, 
                'COMBAT', 
                `${mobName} ${tier.suffix}`, 
                `The ${mobName} population must be culled.`, 
                `Kill ${tier.count} ${mobName}s.`,
                (gs) => {
                    // Logic: Check bestiary or specific counter if available
                    // Since we track total kills, we can infer specific kills roughly or use future counter
                    // Fallback to checking total kills if specific not tracked yet (simplified)
                    // In a real expanded app, we'd add counters[`killed_${mobName}`] in combatService
                    return (gs.counters[`killed_${mobName}`] || 0) >= tier.count;
                },
                reward
            ));
        });
    });

    // --- 2. SKILL SECRETS (Every 10 levels up to 100) ---
    Object.keys(INITIAL_SKILLS).forEach(skillName => {
        for (let i = 10; i <= 100; i += 10) {
            const isMax = i === 100;
            const reward: any = { statBonus: { int: Math.floor(i / 10) } };
            if (isMax) {
                reward.titleReward = `Grandmaster ${skillName}`;
                reward.cosmeticUnlock = 'crown';
                reward.statBonus = { int: 20, maxHp: 100 };
            }

            secrets.push(create(
                `lvl_${i}_${skillName}`, 
                'ARTISAN', 
                `${skillName} ${i}`,
                `Practice your ${skillName}.`, 
                `Reach Level ${i} in ${skillName}.`,
                (gs) => (gs.skills[skillName as SkillName]?.level || 0) >= i,
                reward
            ));
        }
    });

    // --- 3. ITEM COLLECTION SECRETS ---
    const collectables = Object.values(ITEMS).filter(i => ['MATERIAL', 'COLLECTIBLE'].includes(i.type));
    collectables.forEach(item => {
        secrets.push(create(
            `collect_100_${item.id}`, 
            'WORLD', 
            `${item.name} Hoarder`,
            `Fill your bags with ${item.name}.`, 
            `Hold 100 ${item.name} at once.`,
            (gs) => (gs.inventory.find(i => i.id === item.id)?.count || 0) >= 100,
            { statBonus: { hp: 5 } }
        ));
    });

    // --- 4. SILLY / MISC SECRETS ---
    secrets.push(create('silly_chicken', 'SILLY', 'Chicken Tickler', 'Bother the birds.', 'Poke a Chicken 50 times.', (gs) => (gs.counters['poked_chicken'] || 0) >= 50, { cosmeticUnlock: 'party_hat' }));
    secrets.push(create('silly_steps', 'SILLY', 'Marathon Man', 'Keep walking.', 'Take 50,000 steps.', (gs) => (gs.counters['steps_taken'] || 0) >= 50000, { statBonus: { dex: 10 } }));
    secrets.push(create('silly_nudist', 'SILLY', 'Naturalist', 'Feel the breeze.', 'Kill an enemy with no equipment equipped.', (gs) => {
        const noGear = Object.values(gs.equipment).every(e => e === null);
        return noGear && gs.lastAction === 'KILL'; // Logic assumes 'KILL' action tracked
    }, { titleReward: 'The Naked' }));
    secrets.push(create('rich_tycoon', 'SILLY', 'Tycoon', 'Money money money.', 'Have 1,000,000 Gold.', (gs) => gs.stats.gold >= 1000000, { cosmeticUnlock: 'tophat' }));

    return secrets;
};
