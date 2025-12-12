
import { GameMap, Secret, TileType, Entity, Item, Position, SkillName, Skill, Recipe, GameState, Quest, EquipmentSlot, Stats, Perk, WeaponStats, MagicType } from './types';
import { ASSETS } from './assets';

export const uid = () => Math.random().toString(36).substr(2, 9);

export { ASSETS };

// --- INFINITE NUMBER SCALING ---
// Supports up to DuoDecillion (Dc) and beyond
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

export const calculateXpForLevel = (level: number) => 50 * Math.pow(level, 2.2); // Steeper curve for infinite scaling
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
  gold: 0
};

export const INITIAL_SKILLS: Record<SkillName, Skill> = {
  Strength: { name: 'Strength', level: 1, xp: 0 },
  Dexterity: { name: 'Dexterity', level: 1, xp: 0 },
  Agility: { name: 'Agility', level: 1, xp: 0 },
  Woodcutting: { name: 'Woodcutting', level: 1, xp: 0 },
  Mining: { name: 'Mining', level: 1, xp: 0 },
  Crafting: { name: 'Crafting', level: 1, xp: 0 },
  Fletching: { name: 'Fletching', level: 1, xp: 0 },
  Carving: { name: 'Carving', level: 1, xp: 0 },
  Alchemy: { name: 'Alchemy', level: 1, xp: 0 },
  Fishing: { name: 'Fishing', level: 1, xp: 0 },
};

export const MAGIC_TYPES: MagicType[] = ['FIRE', 'WATER', 'EARTH', 'AIR', 'LIGHTNING', 'ICE', 'NATURE', 'POISON', 'LIGHT', 'DARK', 'ARCANE', 'VOID', 'TIME', 'SPACE', 'GRAVITY', 'BLOOD', 'SOUL', 'CHAOS', 'ORDER', 'METAL'];

export const EQUIPMENT_TYPES: Record<string, { names: string[], statBias: string[] }> = {
    HEAD: { names: ['Helmet', 'Cap', 'Hood', 'Crown', 'Visor', 'Greathelm', 'Circlet', 'Diadem'], statBias: ['hp', 'regeneration'] },
    BODY: { names: ['Armor', 'Vest', 'Robe', 'Plate', 'Tunic', 'Cuirass', 'Mail', 'Cloak'], statBias: ['hp', 'str'] },
    LEGS: { names: ['Boots', 'Greaves', 'Pants', 'Leggings', 'Sabatons', 'Sandals'], statBias: ['dex', 'hp'] },
    WEAPON: { names: ['Sword', 'Axe', 'Mace', 'Dagger', 'Spear', 'Bow', 'Staff', 'Wand', 'Hammer', 'Scythe', 'Katana', 'Claymore'], statBias: ['str', 'dex', 'int'] },
    OFFHAND: { names: ['Shield', 'Buckler', 'Orb', 'Tome', 'Idol', 'Grimoire', 'Relic', 'Talisman'], statBias: ['hp', 'int'] },
    ACCESSORY: { names: ['Ring', 'Amulet', 'Talisman', 'Charm', 'Necklace', 'Band', 'Pendant', 'Brooch'], statBias: ['str', 'dex', 'int', 'regeneration'] },
};

// Expanded Tiers for Infinite Scaling (0-99)
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
    'stone': { id: 'stone', name: 'Stone', type: 'MATERIAL', description: 'Used for crafting.', count: 1, value: 1 },
    'iron_ore': { id: 'iron_ore', name: 'Iron Ore', type: 'MATERIAL', description: 'Can be smelted.', count: 1, value: 5 },
    'gold_ore': { id: 'gold_ore', name: 'Gold Ore', type: 'MATERIAL', description: 'Sparkly.', count: 1, value: 20 },
    'diamond': { id: 'diamond', name: 'Diamond', type: 'MATERIAL', description: 'Very hard.', count: 1, value: 100 },
    'iron_ingot': { id: 'iron_ingot', name: 'Iron Ingot', type: 'MATERIAL', description: 'Used for smithing.', count: 1, value: 15 },
    'herb': { id: 'herb', name: 'Herb', type: 'MATERIAL', description: 'Medicinal plant.', count: 1, value: 2 },
    'potion_small': { id: 'potion_small', name: 'Small Potion', type: 'CONSUMABLE', description: 'Heals 20 HP.', count: 1, healAmount: 20, value: 10 },
    'potion_medium': { id: 'potion_medium', name: 'Medium Potion', type: 'CONSUMABLE', description: 'Heals 100 HP.', count: 1, healAmount: 100, value: 50 },
    'potion_large': { id: 'potion_large', name: 'Large Potion', type: 'CONSUMABLE', description: 'Heals 500 HP.', count: 1, healAmount: 500, value: 200 },
    'raw_fish': { id: 'raw_fish', name: 'Raw Fish', type: 'CONSUMABLE', description: 'Slimy but nutritious. Heals 10 HP.', count: 1, healAmount: 10, value: 5 },
    'iron_key': { id: 'iron_key', name: 'Iron Key', type: 'KEY', description: 'Opens basic locked doors and chests.', count: 1, value: 25 },
    
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
    { id: 'wood_plank', name: 'Wood Plank', resultItemId: 'wood', yield: 2, skill: 'Woodcutting', levelReq: 1, xpReward: 5, ingredients: [{itemId: 'wood', count: 1}], station: 'WORKBENCH' },
    { id: 'fishing_rod', name: 'Fishing Rod', resultItemId: 'fishing_rod', yield: 1, skill: 'Crafting', levelReq: 1, xpReward: 15, ingredients: [{itemId: 'wood', count: 3}], station: 'WORKBENCH' },
    { id: 'iron_ingot', name: 'Iron Ingot', resultItemId: 'iron_ingot', yield: 1, skill: 'Crafting', levelReq: 2, xpReward: 20, ingredients: [{itemId: 'iron_ore', count: 2}], station: 'ANVIL' },
    { id: 'iron_key', name: 'Iron Key', resultItemId: 'iron_key', yield: 1, skill: 'Crafting', levelReq: 2, xpReward: 25, ingredients: [{itemId: 'iron_ingot', count: 1}], station: 'ANVIL' },
    { id: 'sword_iron', name: 'Iron Sword', resultItemId: 'sword_iron', yield: 1, skill: 'Crafting', levelReq: 3, xpReward: 50, ingredients: [{itemId: 'iron_ingot', count: 2}, {itemId: 'wood', count: 1}], station: 'ANVIL' },
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
    
    // Gathering
    { id: 'lumberjack', title: 'Lumberjack', description: 'Chop 20 Trees.', hint: 'Timber!', statBonus: { str: 2 }, unlocked: false, perkId: 'gatherer', condition: (gs) => (gs.counters['trees_cut'] || 0) >= 20 },
    { id: 'miner', title: 'Miner', description: 'Mine 20 Rocks.', hint: 'Dig deep.', statBonus: { str: 2 }, unlocked: false, perkId: 'gatherer', condition: (gs) => (gs.counters['rocks_mined'] || 0) >= 20 },
    { id: 'angler', title: 'Angler', description: 'Catch 10 Fish.', hint: 'Patience by the water.', statBonus: { dex: 2 }, unlocked: false, perkId: 'fish_friend', condition: (gs) => (gs.counters['fish_caught'] || 0) >= 10 },
    
    // Crafting
    { id: 'blacksmith', title: 'Blacksmith', description: 'Craft 10 Items.', hint: 'Forge your destiny.', statBonus: { str: 1, int: 1 }, unlocked: false, perkId: 'titan_grip', condition: (gs) => (gs.counters['items_crafted'] || 0) >= 10 },
    
    // Interaction
    { id: 'scholar', title: 'Bookworm', description: 'Read 5 signs or books.', hint: 'Knowledge is power.', statBonus: { int: 3 }, unlocked: false, perkId: 'scholar', condition: (gs) => (gs.counters['lore_read'] || 0) >= 5 },
];

export const LOOT_TABLE = {};

export const TOWN_NAMES_PREFIX = ["North", "South", "East", "West", "New", "Old", "Great", "Little", "High", "Low", "Iron", "Gold", "Silver", "Crystal", "Dark", "Light", "Sun", "Moon", "Star", "River"];
export const TOWN_NAMES_SUFFIX = ["haven", "shire", "grad", "wood", "field", "port", "ford", "mouth", "watch", "guard", "keep", "hold", "spire", "gate", "bridge", "fall", "peak", "valley", "dale", "stead"];

export const MONSTER_PREFIXES = ["Angry", "Rabid", "Ancient", "Dark", "Cursed", "Giant", "Tiny", "Mutant", "Void", "Spectral", "Armored", "Savage", "Elite", "King", "Queen", "Lord", "Omega", "Alpha", "Primal", "Chaos"];
export const MONSTER_BASES = ["Slime", "Rat", "Bat", "Wolf", "Bear", "Spider", "Snake", "Scorpion", "Goblin", "Skeleton", "Zombie", "Ghost", "Knight", "Mage", "Golem", "Drake", "Dragon", "Demon", "Beholder", "Lich", "Mimic", "Vampire", "Kraken", "Minotaur", "Specter"];

const generateMap = (id: string, name: string, biome: string, difficulty: number, isTown: boolean): GameMap => {
    const width = 20;
    const height = 15;
    const tiles: TileType[][] = [];

    // Base terrain generation
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) {
            if (isTown) {
                 const r = Math.random();
                 if (r > 0.95) row.push('TREE');
                 else if (r > 0.90) row.push('FLOWER');
                 else if (r > 0.8) row.push('DIRT_PATH');
                 else row.push('GRASS');
            } else {
                const r = Math.random();
                if (biome === 'DESERT') {
                     if (r > 0.98) row.push('CACTUS'); 
                     else if (r > 0.9) row.push('SAND');
                     else row.push('SAND');
                } else if (biome === 'SNOW') {
                     if (r > 0.98) row.push('ICE'); 
                     else row.push('SNOW');
                } else { // FOREST/GRASS
                     if (r > 0.85) row.push('TREE'); 
                     else if (r > 0.95) row.push('ROCK');
                     else if (r > 0.80) row.push('FLOWER');
                     else row.push('GRASS');
                }
            }
        }
        tiles.push(row);
    }
    
    // Clear Paths for Town
    if (isTown) {
        for(let i=1; i<19; i++) tiles[7][i] = 'DIRT_PATH';
        for(let i=1; i<14; i++) tiles[i][10] = 'DIRT_PATH';
        tiles[7][10] = 'SHRINE';
    } else {
        tiles[7][10] = biome === 'DESERT' ? 'SAND' : biome === 'SNOW' ? 'SNOW' : 'GRASS';
    }
    
    const entities: Entity[] = [];
    
    // Town Entites
    if (isTown) {
        entities.push({ 
            id: `mayor_${id}`, 
            name: `${name} Mayor`, 
            type: 'NPC', 
            symbol: 'M', 
            color: 'blue', 
            pos: {x: 10, y: 6}, 
            dialogue: [`Welcome to ${name}!`, "We have fine goods."] 
        });
        
        entities.push({ 
            id: `merch_${id}`, 
            name: `Merchant`, 
            type: 'NPC', 
            symbol: '$', 
            color: 'green', 
            pos: {x: 12, y: 8}, 
            dialogue: ["Buy my stuff!"] 
        });

        entities.push({ id: `anvil_${id}`, name: 'Anvil', type: 'OBJECT', subType: 'ANVIL', symbol: 'T', color: 'gray', pos: {x: 8, y: 8} });
        entities.push({ id: `bench_${id}`, name: 'Workbench', type: 'OBJECT', subType: 'WORKBENCH', symbol: 'W', color: 'brown', pos: {x: 8, y: 10} });
    }

    // Procedural Enemy Generation
    const maxEnemies = isTown ? 0 : Math.min(8, 1 + Math.floor(difficulty / 1.5));
    if (!isTown) {
        for(let i=0; i < maxEnemies; i++) {
            let rx = Math.floor(Math.random() * (width - 2)) + 1;
            let ry = Math.floor(Math.random() * (height - 2)) + 1;
            if (tiles[ry][rx] === 'WALL' || (rx === 10 && ry === 7)) continue;
            
            const level = difficulty || 1;
            
            // Procedural Name: Prefix + Base
            const base = MONSTER_BASES[Math.floor(Math.random() * MONSTER_BASES.length)];
            const prefix = MONSTER_PREFIXES[Math.floor(Math.random() * MONSTER_PREFIXES.length)];
            const fullName = `${prefix} ${base}`;

            let aiType: 'MELEE' | 'RANGED' = 'MELEE';
            let aggroRange = 5;
            let attackRange = 1;
            
            if (['Skeleton', 'Lich', 'Mage', 'Beholder', 'Dragon', 'Ghost'].some(t => base.includes(t))) {
                aiType = 'RANGED';
                attackRange = 3 + Math.floor(Math.random() * 3);
            }
            if (prefix === 'Giant' || prefix === 'King') {
                aggroRange += 3;
            }

            let hp = Math.floor((20 + level * 10) * (prefix === 'Elite' ? 2 : 1));

            entities.push({ 
                id: `enemy_${id}_${uid()}`, 
                name: fullName, 
                type: 'ENEMY', 
                symbol: base[0], 
                color: 'red', 
                pos: {x: rx, y: ry}, 
                hp, 
                maxHp: hp, 
                level,
                aiType,
                aggroRange,
                attackRange
            });
        }
    }

    if (Math.random() > 0.6 && !isTown) {
        let rx = Math.floor(Math.random() * (width - 2)) + 1;
        let ry = Math.floor(Math.random() * (height - 2)) + 1;
        if (!['WALL', 'TREE', 'ROCK', 'CACTUS', 'WATER', 'LAVA'].includes(tiles[ry][rx])) {
            entities.push({ id: `crate_${id}_${uid()}`, name: 'Old Crate', type: 'OBJECT', subType: 'CRATE', symbol: '#', color: 'brown', pos: {x: rx, y: ry} });
        }
    }

    return { id, name, width, height, tiles, entities, neighbors: {}, exits: [], difficulty, biome, isTown };
};

const generateInterior = (id: string, name: string, exitTo: {mapId: string, x: number, y: number, name: string}): GameMap => {
    const width = 10;
    const height = 8;
    const tiles: TileType[][] = [];
    
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) {
            if (x===0 || x===width-1 || y===0 || y===height-1) row.push('WALL');
            else row.push('PLANK');
        }
        tiles.push(row);
    }
    // Door Exit
    tiles[height-1][5] = 'DOOR';
    
    const entities: Entity[] = [];
    
    // Add Exit Teleport
    entities.push({
        id: `exit_${id}`,
        name: 'Exit',
        type: 'OBJECT',
        subType: 'DOOR',
        symbol: '>',
        color: 'yellow',
        pos: {x: 5, y: height-1},
        destination: exitTo
    });

    // Add Random Decor
    entities.push({ id: `bed_${id}`, name: 'Bed', type: 'OBJECT', subType: 'BED', symbol: '=', color: 'red', pos: {x: 2, y: 2} });
    
    return { id, name, width, height, tiles, entities, neighbors: {}, exits: [], difficulty: 0, biome: 'INTERIOR', isTown: false };
}

const createWorld = () => {
    const maps: Record<string, GameMap> = {};
    const worldSize = 20;
    
    // Pick 20 Random Locations for Towns
    const townLocations: string[] = [];
    while(townLocations.length < 20) {
        const x = Math.floor(Math.random() * worldSize);
        const y = Math.floor(Math.random() * worldSize);
        const key = `map_${x}_${y}`;
        if (!townLocations.includes(key) && key !== 'map_10_10') townLocations.push(key);
    }
    townLocations.push('map_10_10'); // Ensure starter town is town

    // 1. Generate Maps
    for(let x=0; x<worldSize; x++) {
        for(let y=0; y<worldSize; y++) {
            const id = `map_${x}_${y}`;
            let biome = 'GRASS';
            if (y > 15) biome = 'DESERT';
            if (y < 5) biome = 'SNOW';
            
            const isTown = townLocations.includes(id);
            const difficulty = Math.floor(Math.abs(x-10) + Math.abs(y-10));
            
            let name = `Zone ${x}-${y}`;
            if (isTown) {
                const p = TOWN_NAMES_PREFIX[Math.floor(Math.random() * TOWN_NAMES_PREFIX.length)];
                const s = TOWN_NAMES_SUFFIX[Math.floor(Math.random() * TOWN_NAMES_SUFFIX.length)];
                name = `${p}${s}`;
            }

            maps[id] = generateMap(id, name, biome, difficulty, isTown);
        }
    }

    // 2. Link Neighbors
    for(let x=0; x<worldSize; x++) {
        for(let y=0; y<worldSize; y++) {
            const id = `map_${x}_${y}`;
            const map = maps[id];
            
            if (y > 0) map.neighbors.UP = `map_${x}_${y-1}`;
            if (y < worldSize - 1) map.neighbors.DOWN = `map_${x}_${y+1}`;
            if (x > 0) map.neighbors.LEFT = `map_${x-1}_${y}`;
            if (x < worldSize - 1) map.neighbors.RIGHT = `map_${x+1}_${y}`;

            if (!map.neighbors.UP) for(let i=0; i<map.width; i++) map.tiles[0][i] = 'WALL';
            if (!map.neighbors.DOWN) for(let i=0; i<map.width; i++) map.tiles[map.height-1][i] = 'WALL';
            if (!map.neighbors.LEFT) for(let i=0; i<map.height; i++) map.tiles[i][0] = 'WALL';
            if (!map.neighbors.RIGHT) for(let i=0; i<map.height; i++) map.tiles[i][map.width-1] = 'WALL';
        }
    }

    // --- MANUALLY OVERRIDE STARTER TOWN (map_10_10) ---
    // Custom layout for the starting area
    const startMap = maps['map_10_10'];
    startMap.name = "Haven's Rest";
    // Clear tiles
    startMap.tiles = Array(15).fill(null).map(() => Array(20).fill('GRASS'));
    // Add Paths
    for(let i=1; i<19; i++) startMap.tiles[7][i] = 'DIRT_PATH';
    for(let i=1; i<14; i++) startMap.tiles[i][10] = 'DIRT_PATH';
    startMap.tiles[7][10] = 'SHRINE';
    // Clear Borders
    if (startMap.neighbors.UP) startMap.tiles[0][10] = 'DIRT_PATH';
    if (startMap.neighbors.DOWN) startMap.tiles[14][10] = 'DIRT_PATH';
    if (startMap.neighbors.LEFT) startMap.tiles[7][0] = 'DIRT_PATH';
    if (startMap.neighbors.RIGHT) startMap.tiles[7][19] = 'DIRT_PATH';
    // Ensure walls on borders
    if (!startMap.neighbors.UP) for(let i=0; i<20; i++) startMap.tiles[0][i] = 'WALL';
    if (!startMap.neighbors.DOWN) for(let i=0; i<20; i++) startMap.tiles[14][i] = 'WALL';
    if (!startMap.neighbors.LEFT) for(let i=0; i<15; i++) startMap.tiles[i][0] = 'WALL';
    if (!startMap.neighbors.RIGHT) for(let i=0; i<15; i++) startMap.tiles[i][19] = 'WALL';
    
    // BUILD BUILDINGS
    const buildHouse = (bx: number, by: number, w: number, h: number) => {
        for(let y=by; y<by+h; y++) {
            for(let x=bx; x<bx+w; x++) {
                 startMap.tiles[y][x] = 'WALL';
            }
        }
        // Door
        const dx = bx + Math.floor(w/2);
        const dy = by + h - 1;
        startMap.tiles[dy][dx] = 'DOOR';
        return {x: dx, y: dy};
    };

    const house1Door = buildHouse(2, 2, 5, 4); // Top Left
    const house2Door = buildHouse(13, 2, 5, 4); // Top Right
    const shopDoor = buildHouse(13, 9, 5, 4); // Bottom Right

    // Create Interiors
    const int1 = generateInterior('interior_home', "Hero's Home", { mapId: 'map_10_10', x: house1Door.x, y: house1Door.y + 1, name: "Haven's Rest" });
    // Add Starter Chest
    int1.entities.push({ id: 'start_chest', name: 'Old Chest', type: 'OBJECT', subType: 'CHEST', symbol: 'C', color: 'brown', pos: {x: 7, y: 2}, loot: 'potion_small' });
    
    const int2 = generateInterior('interior_neighbor', "Neighbor's House", { mapId: 'map_10_10', x: house2Door.x, y: house2Door.y + 1, name: "Haven's Rest" });
    int2.entities.push({ id: 'npc_neighbor', name: 'Neighbor', type: 'NPC', symbol: 'N', color: 'green', pos: {x: 4, y: 3}, dialogue: ["Lovely day!"] });

    const int3 = generateInterior('interior_shop', "General Store", { mapId: 'map_10_10', x: shopDoor.x, y: shopDoor.y + 1, name: "Haven's Rest" });
    int3.entities.push({ id: 'npc_merch', name: 'Merchant', type: 'NPC', symbol: '$', color: 'yellow', pos: {x: 5, y: 3}, dialogue: ["We have the best prices."] });
    int3.entities.push({ id: 'anvil_shop', name: 'Anvil', type: 'OBJECT', subType: 'ANVIL', symbol: 'T', color: 'gray', pos: {x: 2, y: 4} });
    int3.entities.push({ id: 'bench_shop', name: 'Workbench', type: 'OBJECT', subType: 'WORKBENCH', symbol: 'W', color: 'brown', pos: {x: 8, y: 4} });

    maps[int1.id] = int1;
    maps[int2.id] = int2;
    maps[int3.id] = int3;

    // Add Teleporters to Main Map
    startMap.entities = [
        // Entities for Warps
        { id: 'door_1', name: 'Door', type: 'OBJECT', subType: 'DOOR', pos: house1Door, symbol: '.', color: 'white', destination: { mapId: int1.id, x: 5, y: 7, name: 'Home' } },
        { id: 'door_2', name: 'Door', type: 'OBJECT', subType: 'DOOR', pos: house2Door, symbol: '.', color: 'white', destination: { mapId: int2.id, x: 5, y: 7, name: 'Neighbor' } },
        { id: 'door_3', name: 'Door', type: 'OBJECT', subType: 'DOOR', pos: shopDoor, symbol: '.', color: 'white', destination: { mapId: int3.id, x: 5, y: 7, name: 'Shop' } },
        
        // Town NPCs outside
        { id: 'mayor_start', name: 'Mayor', type: 'NPC', symbol: 'M', color: 'blue', pos: {x: 9, y: 6}, dialogue: ["Welcome to Haven's Rest!", "Explore the world, Hunter."] },
    ];
    
    // 3. Generate 1000 Procedural Secrets
    for(let i=0; i < 1000; i++) {
        const type = Math.random();
        if (type > 0.6) {
             const targetGold = Math.floor(Math.random() * 1000000) + 1000;
             SECRETS_DATA.push({
                 id: `sec_gold_${i}`,
                 title: `Hoarder ${i}`,
                 description: `Amass ${formatNumber(targetGold)} Gold.`,
                 hint: 'Greed is infinite.',
                 statBonus: { gold: 10 },
                 unlocked: false,
                 perkId: 'midas_touch',
                 condition: (gs) => gs.stats.gold >= targetGold
             });
        } else if (type > 0.3) {
             const targetLevel = Math.floor(Math.random() * 500) + 10;
             SECRETS_DATA.push({
                 id: `sec_lvl_${i}`,
                 title: `Ascension ${i}`,
                 description: `Reach Level ${targetLevel}.`,
                 hint: 'Power grows.',
                 statBonus: { str: 1, int: 1, dex: 1 },
                 unlocked: false,
                 perkId: 'titan_grip',
                 condition: (gs) => gs.stats.level >= targetLevel
             });
        }
    }

    return maps;
};

export const MAPS = createWorld();
