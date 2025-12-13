
import { Item, Stats, WeaponStats, EquipmentSlot } from '../types';
import { LOOT_TIERS, EQUIPMENT_TYPES, WEAPON_TEMPLATES, ITEM_PREFIXES, ITEM_SUFFIXES, ITEMS, uid } from '../constants';

export const generateLoot = (level: number, sourceName: string, rarityBoost: number = 0): Item | null => {
    // 1. Drop Chance Calculation
    let dropChance = 0.4;
    if (sourceName.includes('Mimic') || sourceName.includes('Dragon') || sourceName.includes('Lich') || sourceName.includes('Kraken')) {
        dropChance = 1.0;
    }
    if (Math.random() > dropChance) return null;

    // 2. Determine Tier (Infinite Scaling)
    // Find highest tier available for this level
    const availableTiers = LOOT_TIERS.filter(t => level >= t.minLvl);
    let tier = availableTiers.length > 0 ? availableTiers[availableTiers.length - 1] : LOOT_TIERS[0];
    
    // Bosses drop +1 Tier
    if (sourceName.includes('Mimic') || sourceName.includes('Dragon')) {
        const nextTierIndex = LOOT_TIERS.findIndex(t => t.name === tier.name) + 1;
        if (nextTierIndex < LOOT_TIERS.length) tier = LOOT_TIERS[nextTierIndex];
    }

    // 3. Contextual Slot Selection
    const slots = Object.keys(EQUIPMENT_TYPES);
    let slot = slots[Math.floor(Math.random() * slots.length)] as keyof typeof EQUIPMENT_TYPES;

    // 4. Contextual Weapon Type
    const typeData = EQUIPMENT_TYPES[slot];
    let baseName = typeData.names[Math.floor(Math.random() * typeData.names.length)];
    
    if (slot === 'WEAPON') {
        const weaponKeys = Object.keys(WEAPON_TEMPLATES);
        baseName = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
    }

    // 5. Rarity Roll
    // boost pushes the roll higher
    const rarityRoll = Math.min(1.0, Math.random() + rarityBoost);
    
    let rarity = 'COMMON';
    if (rarityRoll > 0.99) rarity = 'COSMIC';
    else if (rarityRoll > 0.98) rarity = 'DIVINE';
    else if (rarityRoll > 0.95) rarity = 'GODLY';
    else if (rarityRoll > 0.90) rarity = 'MYTHIC';
    else if (rarityRoll > 0.85) rarity = 'LEGENDARY';
    else if (rarityRoll > 0.70) rarity = 'EPIC';
    else if (rarityRoll > 0.50) rarity = 'RARE';
    else if (rarityRoll > 0.30) rarity = 'UNCOMMON';

    // 6. Stats Generation with Affixes (Robust System)
    const stats: Partial<Stats> = {};
    let fullName = `${tier.name} ${baseName}`;
    
    // Apply Tier Multiplier
    const multiplier = tier.mult;

    // Prefix (Primary Stat Booster)
    if (rarity !== 'COMMON') {
        const prefix = ITEM_PREFIXES[Math.floor(Math.random() * ITEM_PREFIXES.length)];
        fullName = `${prefix.name} ${fullName}`;
        
        // @ts-ignore
        const currentVal = stats[prefix.stat] || 0;
        const addedVal = Math.floor((multiplier * 10) * prefix.mod);
        // @ts-ignore
        stats[prefix.stat] = currentVal + addedVal;
    }

    // Suffix (Secondary Stat)
    if (['RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'GODLY', 'DIVINE', 'COSMIC'].includes(rarity)) {
        const suffix = ITEM_SUFFIXES[Math.floor(Math.random() * ITEM_SUFFIXES.length)];
        fullName = `${fullName} ${suffix.name}`;
        
        // @ts-ignore
        const currentVal = stats[suffix.stat] || 0;
        const addedVal = Math.floor(multiplier * 5); 
        // @ts-ignore
        stats[suffix.stat] = currentVal + addedVal;
    }

    // Base Slot Stats
    const numBaseStats = Math.max(1, Math.floor(multiplier));
    for(let i=0; i<numBaseStats; i++) {
        const statKey = typeData.statBias[Math.floor(Math.random() * typeData.statBias.length)];
        // @ts-ignore
        stats[statKey] = (stats[statKey] || 0) + Math.floor(multiplier * 3);
    }

    // 7. Weapon Specifics
    let weaponStats: WeaponStats | undefined = undefined;
    if (slot === 'WEAPON') {
        const baseWeapon = WEAPON_TEMPLATES[baseName] || WEAPON_TEMPLATES['Sword'];
        weaponStats = {
            ...baseWeapon,
            power: Math.ceil(baseWeapon.power * multiplier),
        };
        
        if (['RARE', 'EPIC', 'LEGENDARY'].includes(rarity)) {
            weaponStats.power = Math.floor(weaponStats.power * 1.2);
            weaponStats.critChance += 0.05;
        }
        if (['MYTHIC', 'GODLY', 'DIVINE', 'COSMIC'].includes(rarity)) {
            weaponStats.power = Math.floor(weaponStats.power * 2);
            weaponStats.critMult += 1.0;
            weaponStats.multiHitChance = 0.5;
        }
    }

    return {
        id: uid(),
        name: fullName,
        type: 'EQUIPMENT',
        slot: slot as any,
        description: `A ${rarity.toLowerCase()} item of great power.`,
        count: 1,
        stats,
        weaponStats,
        rarity: rarity as any,
        value: Math.floor(level * 10 * multiplier)
    };
};

export const generateBossRewards = (level: number): Item[] => {
    const rewards: Item[] = [];

    // 1. Two Guaranteed High-Tier Equipments (0.5 boost guarantees at least Rare)
    const eq1 = generateLoot(level, 'Boss Chest', 0.5);
    if (eq1) rewards.push(eq1);
    
    const eq2 = generateLoot(level, 'Boss Chest', 0.5);
    if (eq2) rewards.push(eq2);

    // 2. High Value Resource (Dark Gem or Diamond)
    const resource = Math.random() > 0.5 ? ITEMS['dark_gem'] : ITEMS['diamond'];
    rewards.push({ ...resource, id: uid(), count: 1 + Math.floor(Math.random() * 3) });

    // 3. Special Gadget or Blueprint
    if (Math.random() > 0.5) {
        rewards.push({ ...ITEMS['mob_spawner_item'], id: uid() });
    } else {
        // Fallback to gold ore stack if no gadget rolled or specific blueprints not handled here
        rewards.push({ ...ITEMS['gold_ore'], id: uid(), count: 10 + Math.floor(Math.random() * 20) });
    }

    // 4. Massive Gold/Currency Item (Ancient Coin stack)
    rewards.push({ ...ITEMS['ancient_coin'], id: uid(), count: 5 + Math.floor(Math.random() * 5) });

    return rewards;
};
