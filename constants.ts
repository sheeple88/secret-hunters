
import { GameMap, Secret, TileType, Entity, Item, Position, SkillName, Skill, Recipe, GameState, Quest, EquipmentSlot, Stats, Perk, WeaponStats, MagicType } from './types';
import { ASSETS } from './assets';
import { createWorld } from './systems/mapGenerator';
import { uid } from './systems/mapUtils';

export { uid };
export { ASSETS };

// --- INFINITE NUMBER SCALING ---
const SUFFIXES = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Ocd", "Nod", "Vg", "Uvg", "Dvg"];

export const formatNumber = (num: number): string => {
    if (num < 1000) return Math.floor(num).toString();
    const tier = Math.floor(Math.log10(num) / 3);
    if (tier === 0) return Math.floor(num).toString();
    const suffix = SUFFIXES[tier] || `e${tier*3}`;
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;
    return scaled.toFixed(1) + suffix;
};

// Reduced scaling factor from 2.2 to 1.75 for easier leveling
export const calculateXpForLevel = (level: number) => Math.floor(50 * Math.pow(level, 1.75));
export const calculateSkillLevel = (xp: number) => Math.floor(Math.pow(xp / 10, 0.45)) + 1;

export const INITIAL_STATS: Stats = {
  str: 5,
  dex: 5,
  int: 5,
  regeneration: 1,
  hp: 50,
  maxHp: 50,
  xp: 0,
  level: 1,
  gold: 0,
  unspentStatPoints: 0
};

export const INITIAL_SKILLS: Record<SkillName, Skill> = {
  Strength: { name: 'Strength', level: 1, xp: 0 },
  Dexterity: { name: 'Dexterity', level: 1, xp: 0 },
  Agility: { name: 'Agility', level: 1, xp: 0 },
  Logging: { name: 'Logging', level: 1, xp: 0 },
  Mining: { name: 'Mining', level: 1, xp: 0 },
  Crafting: { name: 'Crafting', level: 1, xp: 0 },
  Fletching: { name: 'Fletching', level: 1, xp: 0 },
  Carving: { name: 'Carving', level: 1, xp: 0 },
  Alchemy: { name: 'Alchemy', level: 1, xp: 0 },
  Fishing: { name: 'Fishing', level: 1, xp: 0 },
};

export const DEFAULT_RECIPES = [
    'potion_small', 
    'wood_plank', 
    'fishing_rod',
    'iron_ingot'
];

export const EQUIPMENT_TYPES: Record<string, { names: string[], statBias: string[] }> = {
    HEAD: { names: ['Helmet', 'Cap', 'Hood', 'Crown', 'Visor', 'Greathelm', 'Circlet', 'Diadem'], statBias: ['hp', 'regeneration'] },
    BODY: { names: ['Armor', 'Vest', 'Robe', 'Plate', 'Tunic', 'Cuirass', 'Mail', 'Cloak'], statBias: ['hp', 'str'] },
    LEGS: { names: ['Boots', 'Greaves', 'Pants', 'Leggings', 'Sabatons', 'Sandals'], statBias: ['dex', 'hp'] },
    WEAPON: { names: ['Sword', 'Axe', 'Mace', 'Dagger', 'Spear', 'Bow', 'Staff', 'Wand', 'Hammer', 'Scythe', 'Katana', 'Claymore'], statBias: ['str', 'dex', 'int'] },
    OFFHAND: { names: ['Shield', 'Buckler', 'Orb', 'Tome', 'Idol', 'Grimoire', 'Relic', 'Talisman'], statBias: ['hp', 'int'] },
    ACCESSORY: { names: ['Ring', 'Amulet', 'Talisman', 'Charm', 'Necklace', 'Band', 'Pendant', 'Brooch'], statBias: ['str', 'dex', 'int', 'regeneration'] },
};

export const LOOT_TIERS = Array.from({ length: 100 }, (_, i) => ({
    name: i === 0 ? 'Broken' : i === 1 ? 'Common' : i === 2 ? 'Uncommon' : i === 3 ? 'Rare' : i === 4 ? 'Epic' : i === 5 ? 'Legendary' : i === 6 ? 'Mythic' : i === 7 ? 'Godly' : i === 8 ? 'Divine' : i === 9 ? 'Cosmic' : `Tier ${i}`,
    mult: 0.5 + (i * 0.5),
    minLvl: i * 5
}));

export const ITEM_PREFIXES = [
    { name: 'Strong', stat: 'str', mod: 1.2 }, { name: 'Mighty', stat: 'str', mod: 1.5 }, { name: 'Titanic', stat: 'str', mod: 2.0 },
    { name: 'Swift', stat: 'dex', mod: 1.2 }, { name: 'Quick', stat: 'dex', mod: 1.4 }, { name: 'Flash', stat: 'dex', mod: 2.0 },
    { name: 'Wise', stat: 'int', mod: 1.2 }, { name: 'Brilliant', stat: 'int', mod: 1.5 }, { name: 'Omniscient', stat: 'int', mod: 2.0 },
    { name: 'Sturdy', stat: 'hp', mod: 1.2 }, { name: 'Durable', stat: 'hp', mod: 1.4 }, { name: 'Immortal', stat: 'hp', mod: 2.0 },
    { name: 'Vital', stat: 'regeneration', mod: 1.5 },
];

export const ITEM_SUFFIXES = [
    { name: 'of the Bear', stat: 'str' }, { name: 'of the Dragon', stat: 'str' },
    { name: 'of the Wolf', stat: 'dex' }, { name: 'of the Falcon', stat: 'dex' },
    { name: 'of the Owl', stat: 'int' }, { name: 'of the Void', stat: 'int' },
    { name: 'of the Whale', stat: 'hp' }, { name: 'of the Mountain', stat: 'hp' },
    { name: 'of the Troll', stat: 'regeneration' },
    { name: 'of Rage', stat: 'str' },
    { name: 'of Focus', stat: 'int' },
];

export const WEAPON_TEMPLATES: Record<string, WeaponStats> = {
    'Sword': { type: 'SWORD', minDmg: 3, maxDmg: 6, critChance: 0.05, critMult: 1.5, range: 1 },
    'Claymore': { type: 'SWORD', minDmg: 6, maxDmg: 12, critChance: 0.05, critMult: 1.8, range: 1 },
    'Katana': { type: 'SWORD', minDmg: 4, maxDmg: 8, critChance: 0.15, critMult: 2.0, range: 1 },
    'Axe': { type: 'AXE', minDmg: 4, maxDmg: 8, critChance: 0.1, critMult: 2.0, range: 1 },
    'Hammer': { type: 'MACE', minDmg: 8, maxDmg: 14, critChance: 0.05, critMult: 2.5, range: 1 },
    'Mace': { type: 'MACE', minDmg: 5, maxDmg: 9, critChance: 0.05, critMult: 1.8, range: 1 },
    'Dagger': { type: 'DAGGER', minDmg: 2, maxDmg: 4, critChance: 0.2, critMult: 2.5, range: 1, multiHitChance: 0.3 },
    'Spear': { type: 'SPEAR', minDmg: 3, maxDmg: 7, critChance: 0.05, critMult: 1.5, range: 2 },
    'Scythe': { type: 'SPEAR', minDmg: 5, maxDmg: 10, critChance: 0.1, critMult: 2.0, range: 2, cleave: true },
    'Bow': { type: 'BOW', minDmg: 2, maxDmg: 6, critChance: 0.1, critMult: 1.5, range: 4 },
    'Staff': { type: 'STAFF', minDmg: 2, maxDmg: 8, critChance: 0.05, critMult: 1.5, range: 3 },
    'Wand': { type: 'STAFF', minDmg: 4, maxDmg: 6, critChance: 0.1, critMult: 1.5, range: 4 },
    'Rod': { type: 'ROD', minDmg: 1, maxDmg: 3, critChance: 0.01, critMult: 1.2, range: 3 },
};

export const ITEMS: Record<string, Item> = {
    'wood': { id: 'wood', name: 'Wood', type: 'MATERIAL', description: 'Used for crafting.', count: 1, value: 1 },
    'oak_log': { id: 'oak_log', name: 'Oak Log', type: 'MATERIAL', description: 'Sturdy oak wood.', count: 1, value: 2 },
    'birch_log': { id: 'birch_log', name: 'Birch Log', type: 'MATERIAL', description: 'Pale birch wood.', count: 1, value: 2 },
    'pine_log': { id: 'pine_log', name: 'Pine Log', type: 'MATERIAL', description: 'Sticky pine wood.', count: 1, value: 3 },
    
    'stone': { id: 'stone', name: 'Stone', type: 'MATERIAL', description: 'Used for crafting.', count: 1, value: 1 },
    'iron_ore': { id: 'iron_ore', name: 'Iron Ore', type: 'MATERIAL', description: 'Can be smelted.', count: 1, value: 5 },
    'gold_ore': { id: 'gold_ore', name: 'Gold Ore', type: 'MATERIAL', description: 'Sparkly.', count: 1, value: 20 },
    'diamond': { id: 'diamond', name: 'Diamond', type: 'MATERIAL', description: 'Very hard.', count: 1, value: 100 },
    'dark_gem': { id: 'dark_gem', name: 'Dark Gem', type: 'MATERIAL', description: 'Pulsing with chaotic energy.', count: 1, value: 300, rarity: 'RARE' },
    'iron_ingot': { id: 'iron_ingot', name: 'Iron Ingot', type: 'MATERIAL', description: 'Used for smithing.', count: 1, value: 15 },
    'herb': { id: 'herb', name: 'Herb', type: 'MATERIAL', description: 'Medicinal plant.', count: 1, value: 2 },
    'potion_small': { id: 'potion_small', name: 'Small Potion', type: 'CONSUMABLE', description: 'Heals 20 HP.', count: 1, healAmount: 20, value: 10 },
    'potion_medium': { id: 'potion_medium', name: 'Medium Potion', type: 'CONSUMABLE', description: 'Heals 100 HP.', count: 1, healAmount: 100, value: 50 },
    'potion_large': { id: 'potion_large', name: 'Large Potion', type: 'CONSUMABLE', description: 'Heals 500 HP.', count: 1, healAmount: 500, value: 200 },
    'raw_fish': { id: 'raw_fish', name: 'Raw Fish', type: 'CONSUMABLE', description: 'Slimy but nutritious. Heals 10 HP.', count: 1, healAmount: 10, value: 5 },
    'iron_key': { id: 'iron_key', name: 'Iron Key', type: 'KEY', description: 'Opens basic locked doors and chests.', count: 1, value: 25 },
    
    // Gadgets / Placables
    'mob_spawner_item': { id: 'mob_spawner_item', name: 'Cage of Souls', type: 'GADGET', description: 'A captured spawner. Use to place.', count: 1, value: 500, rarity: 'EPIC' },

    // Blueprints
    'blueprint_potion_medium': { id: 'blueprint_potion_medium', name: 'Blueprint: Medium Potion', type: 'BLUEPRINT', description: 'Teaches how to brew medium potions.', count: 1, value: 100, recipeId: 'potion_medium', rarity: 'UNCOMMON' },
    'blueprint_iron_sword': { id: 'blueprint_iron_sword', name: 'Blueprint: Iron Sword', type: 'BLUEPRINT', description: 'Teaches how to forge iron swords.', count: 1, value: 150, recipeId: 'sword_iron', rarity: 'UNCOMMON' },

    // Equipment
    'fishing_rod': { id: 'fishing_rod', name: 'Old Fishing Rod', type: 'EQUIPMENT', slot: 'WEAPON', description: 'Use near water to catch fish.', count: 1, weaponStats: WEAPON_TEMPLATES['Rod'], value: 20 },
    'sword_training': { id: 'sword_training', name: 'Training Sword', type: 'EQUIPMENT', slot: 'WEAPON', description: 'A dull sword.', count: 1, weaponStats: WEAPON_TEMPLATES['Sword'], value: 5 },
    'sword_iron': { id: 'sword_iron', name: 'Iron Sword', type: 'EQUIPMENT', slot: 'WEAPON', description: 'A sturdy iron sword.', count: 1, weaponStats: { ...WEAPON_TEMPLATES['Sword'], minDmg: 5, maxDmg: 9 }, value: 50 },
    'relic': { id: 'relic', name: 'Ancient Relic', type: 'COLLECTIBLE', description: 'A glowing orb from the past.', count: 1, value: 100 },
    
    // Collectibles
    'golden_idol': { id: 'golden_idol', name: 'Golden Idol', type: 'COLLECTIBLE', description: 'A heavy gold statue.', count: 1, value: 200 },
    'ancient_coin': { id: 'ancient_coin', name: 'Ancient Coin', type: 'COLLECTIBLE', description: 'Currency from a lost era.', count: 1, value: 50 },
    'gemstone': { id: 'gemstone', name: 'Gemstone', type: 'COLLECTIBLE', description: 'Sparkles in the dark.', count: 1, value: 100 },
};

export const RECIPES: Recipe[] = [
    { id: 'potion_small', name: 'Small Potion', resultItemId: 'potion_small', yield: 1, skill: 'Alchemy', levelReq: 1, xpReward: 10, ingredients: [{itemId: 'herb', count: 2}], station: 'ALCHEMY_TABLE' },
    { id: 'potion_medium', name: 'Medium Potion', resultItemId: 'potion_medium', yield: 1, skill: 'Alchemy', levelReq: 10, xpReward: 50, ingredients: [{itemId: 'herb', count: 10}], station: 'ALCHEMY_TABLE' },
    { id: 'wood_plank', name: 'Wood Plank', resultItemId: 'wood', yield: 2, skill: 'Logging', levelReq: 1, xpReward: 5, ingredients: [{itemId: 'wood', count: 1}], station: 'WORKBENCH' },
    { id: 'fishing_rod', name: 'Fishing Rod', resultItemId: 'fishing_rod', yield: 1, skill: 'Crafting', levelReq: 1, xpReward: 15, ingredients: [{itemId: 'wood', count: 3}], station: 'WORKBENCH' },
    { id: 'iron_ingot', name: 'Iron Ingot', resultItemId: 'iron_ingot', yield: 1, skill: 'Crafting', levelReq: 2, xpReward: 20, ingredients: [{itemId: 'iron_ore', count: 2}], station: 'ANVIL' },
    { id: 'iron_key', name: 'Iron Key', resultItemId: 'iron_key', yield: 1, skill: 'Crafting', levelReq: 2, xpReward: 25, ingredients: [{itemId: 'iron_ingot', count: 1}], station: 'ANVIL' },
    { id: 'sword_iron', name: 'Iron Sword', resultItemId: 'sword_iron', yield: 1, skill: 'Crafting', levelReq: 3, xpReward: 50, ingredients: [{itemId: 'iron_ingot', count: 2}, {itemId: 'wood', count: 1}], station: 'ANVIL' },
];

export const MERCHANT_STOCK: { itemId: string, price: number }[] = [
    { itemId: 'potion_small', price: 25 }, // Markup from value 10
    { itemId: 'wood', price: 5 },
    { itemId: 'iron_ore', price: 15 },
    { itemId: 'blueprint_potion_medium', price: 250 },
    { itemId: 'blueprint_iron_sword', price: 300 },
];

export const PERKS: Record<string, Perk> = {
    'vision_plus': { id: 'vision_plus', name: 'Eagle Eye', description: 'Increases vision radius.', icon: '👁️', specialEffect: 'VISION_PLUS' },
    'night_vision': { id: 'night_vision', name: 'Night Owl', description: 'See clearly in the dark.', icon: '🦉', specialEffect: 'NIGHT_VISION' },
    'lava_resist': { id: 'lava_resist', name: 'Obsidian Skin', description: 'Resist lava damage.', icon: '🌋', specialEffect: 'LAVA_RESIST' },
    'secret_sense': { id: 'secret_sense', name: 'Relic Hunter', description: 'Nearby secrets chime.', icon: '🛎️', specialEffect: 'SECRET_SENSE' },
    'puzzle_mind': { id: 'puzzle_mind', name: 'Puzzle Mind', description: '+5 INT.', icon: '🧠', statBonus: { int: 5 } },
    'midas_touch': { id: 'midas_touch', name: 'Midas Touch', description: '+50% Gold found.', icon: '💰', specialEffect: 'GOLD_BOOST' },
    'iron_skin': { id: 'iron_skin', name: 'Iron Skin', description: '-1 Damage taken.', icon: '🛡️', statBonus: { hp: 10 } },
    'swift_step': { id: 'swift_step', name: 'Swift Step', description: '+5 DEX.', icon: '👟', statBonus: { dex: 5 } },
    'magic_blood': { id: 'magic_blood', name: 'Magic Blood', description: '+10 INT.', icon: '🩸', statBonus: { int: 10 } },
    'titan_grip': { id: 'titan_grip', name: 'Titan Grip', description: '+10 STR.', icon: '💪', statBonus: { str: 10 } },
    'gatherer': { id: 'gatherer', name: 'Gatherer', description: '+5 STR/DEX when gathering.', icon: '🪓', statBonus: { str: 2, dex: 2 } },
    'berserker': { id: 'berserker', name: 'Berserker', description: '+10% Crit Chance.', icon: '⚔️', statBonus: { str: 5 } },
    'fish_friend': { id: 'fish_friend', name: 'Aquatic', description: 'Regen in water.', icon: '🐟', statBonus: { regeneration: 2 } },
    'scholar': { id: 'scholar', name: 'Scholar', description: '+5 INT.', icon: '📜', statBonus: { int: 5 } },
    'traveler': { id: 'traveler', name: 'Traveler', description: 'Move faster (meta).', icon: '🌍', statBonus: { dex: 3 } },
};

// --- SECRETS DATA COVERING ALL ACTIVITIES ---
export const SECRETS_DATA: Secret[] = [
    // Exploration / Movement
    { id: 'explorer', title: 'Explorer', description: 'Explore 100 tiles.', hint: 'Walk around the world.', statBonus: { dex: 1 }, unlocked: false, perkId: 'vision_plus', condition: (gs) => Object.values(gs.exploration).flat().flat().filter(x=>x).length > 100 },
    { id: 'marathon', title: 'Marathon Runner', description: 'Take 1,000 steps.', hint: 'A long journey begins with a single step.', statBonus: { dex: 2, hp: 10 }, unlocked: false, perkId: 'traveler', condition: (gs) => (gs.counters['steps_taken'] || 0) >= 1000 },
    
    // Time
    { id: 'nocturnal', title: 'Nocturnal', description: 'Stay awake until midnight (Time 2400).', hint: 'Watch the moon rise.', statBonus: { int: 2 }, unlocked: false, perkId: 'night_vision', condition: (gs) => gs.time >= 2350 },
    
    // Collection
    { id: 'relic_hunter', title: 'Relic Hunter', description: 'Collect 3 Ancient Relics.', hint: 'Find glowing orbs.', statBonus: { int: 2 }, unlocked: false, perkId: 'secret_sense', condition: (gs) => (gs.counters['relics_found'] || 0) >= 3 },
    { id: 'collector', title: 'Curator', description: 'Hold 3 unique collectibles.', hint: 'Gather shiny things.', statBonus: { int: 2 }, unlocked: false, perkId: 'scholar', condition: (gs) => gs.inventory.filter(i => i.type === 'COLLECTIBLE').length >= 3 },
    { id: 'rich_hunter', title: 'Tycoon', description: 'Amass 500 Gold.', hint: 'Greed is good.', statBonus: { gold: 100 }, unlocked: false, perkId: 'midas_touch', condition: (gs) => gs.stats.gold >= 500 },

    // Puzzle
    { id: 'puzzle_master', title: 'Puzzle Master', description: 'Solve a Puzzle.', hint: 'Use your brain.', statBonus: { str: 2 }, unlocked: false, perkId: 'puzzle_mind', condition: (gs) => (gs.counters['puzzles_solved'] || 0) >= 1 },
    
    // Combat
    { id: 'survivor', title: 'Survivor', description: 'Take 100 damage total.', hint: 'What does not kill you...', statBonus: { maxHp: 10 }, unlocked: false, perkId: 'iron_skin', condition: (gs) => (gs.counters['damage_taken'] || 0) >= 100 },
    { id: 'butcher', title: 'Butcher', description: 'Kill 20 enemies.', hint: 'Violence is the answer.', statBonus: { str: 2 }, unlocked: false, perkId: 'berserker', condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 20 },
    
    // Gathering / Logging Secrets
    { id: 'lumberjack', title: 'Lumberjack', description: 'Chop 20 Trees.', hint: 'Timber!', statBonus: { str: 2 }, unlocked: false, perkId: 'gatherer', condition: (gs) => (gs.counters['trees_cut'] || 0) >= 20 },
    { id: 'miner', title: 'Miner', description: 'Mine 20 Rocks.', hint: 'Dig deep.', statBonus: { str: 2 }, unlocked: false, perkId: 'gatherer', condition: (gs) => (gs.counters['rocks_mined'] || 0) >= 20 },
    { id: 'angler', title: 'Angler', description: 'Catch 10 Fish.', hint: 'Patience by the water.', statBonus: { dex: 2 }, unlocked: false, perkId: 'fish_friend', condition: (gs) => (gs.counters['fish_caught'] || 0) >= 10 },
    
    // Crafting
    { id: 'blacksmith', title: 'Blacksmith', description: 'Craft 10 Items.', hint: 'Forge your destiny.', statBonus: { str: 1, int: 1 }, unlocked: false, perkId: 'titan_grip', condition: (gs) => (gs.counters['items_crafted'] || 0) >= 10 },
    
    // Interaction
    { id: 'scholar', title: 'Bookworm', description: 'Read 5 signs or books.', hint: 'Knowledge is power.', statBonus: { int: 3 }, unlocked: false, perkId: 'scholar', condition: (gs) => (gs.counters['lore_read'] || 0) >= 5 },
];

// Initialize Maps via Generator (The array is mutated by reference in generator to add dynamic secrets)
export const MAPS = createWorld(SECRETS_DATA);
