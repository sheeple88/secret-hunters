
import { Item, Recipe, Perk, Quest, Secret, Achievement, MonsterStats, SkillName, Skill, Stats, WeaponStats, GameMap } from '../types';

// --- UTILS ---
export const uid = () => Math.random().toString(36).substr(2, 9);
export const SCALE_FACTOR = 1.15;
export const calculateXpForLevel = (level: number) => Math.floor(100 * Math.pow(SCALE_FACTOR, level));
export const calculateSkillLevel = (xp: number) => Math.max(1, Math.floor(Math.log(Math.max(xp, 10) / 10) / Math.log(1.12)) + 1);

// --- INITIAL STATE ---
export const INITIAL_STATS: Stats = { str: 5, dex: 5, int: 5, regeneration: 1, hp: 100, maxHp: 100, xp: 0, level: 1, gold: 0, unspentStatPoints: 0 };
export const INITIAL_SKILLS: Record<SkillName, Skill> = {
  Attack: { name: 'Attack', level: 1, xp: 0 }, Strength: { name: 'Strength', level: 1, xp: 0 }, Defence: { name: 'Defence', level: 1, xp: 0 }, Constitution: { name: 'Constitution', level: 10, xp: 1100 },
  Dexterity: { name: 'Dexterity', level: 1, xp: 0 }, Agility: { name: 'Agility', level: 1, xp: 0 }, Logging: { name: 'Logging', level: 1, xp: 0 }, Mining: { name: 'Mining', level: 1, xp: 0 },
  Smithing: { name: 'Smithing', level: 1, xp: 0 }, Herblore: { name: 'Herblore', level: 1, xp: 0 }, Crafting: { name: 'Crafting', level: 1, xp: 0 }, Fletching: { name: 'Fletching', level: 1, xp: 0 },
  Carving: { name: 'Carving', level: 1, xp: 0 }, Alchemy: { name: 'Alchemy', level: 1, xp: 0 }, Fishing: { name: 'Fishing', level: 1, xp: 0 }, Cooking: { name: 'Cooking', level: 1, xp: 0 },
};

// --- DATA: WEAPONS ---
export const WEAPON_STATS: Record<string, WeaponStats> = {
    'Sword': { type: 'SWORD', damageType: 'SLASH', power: 10, accuracy: 10, critChance: 0.05, critMult: 1.5, range: 1 },
    'Axe': { type: 'AXE', damageType: 'SLASH', power: 14, accuracy: 8, critChance: 0.1, critMult: 2.0, range: 1 },
    'Mace': { type: 'MACE', damageType: 'CRUSH', power: 15, accuracy: 8, critChance: 0.05, critMult: 1.8, range: 1 },
    'Dagger': { type: 'DAGGER', damageType: 'STAB', power: 6, accuracy: 20, critChance: 0.2, critMult: 2.5, range: 1, multiHitChance: 0.3 },
    'Spear': { type: 'SPEAR', damageType: 'STAB', power: 12, accuracy: 12, critChance: 0.05, critMult: 1.5, range: 2 },
    'Bow': { type: 'BOW', damageType: 'RANGED', power: 10, accuracy: 15, critChance: 0.1, critMult: 1.5, range: 4 },
    'Staff': { type: 'STAFF', damageType: 'MAGIC', power: 12, accuracy: 10, critChance: 0.05, critMult: 1.5, range: 3 },
    'Rod': { type: 'ROD', damageType: 'CRUSH', power: 5, accuracy: 5, critChance: 0.01, critMult: 1.2, range: 3 },
};

// --- DATA: ENEMIES ---
export const ENEMIES: Record<string, { baseHp: number, baseDmg: number, defence: number, weakness?: string, xpMod: number }> = {
    'Slime': { baseHp: 15, baseDmg: 2, defence: 2, weakness: 'SLASH', xpMod: 0.8 },
    'Rat': { baseHp: 10, baseDmg: 3, defence: 1, weakness: 'STAB', xpMod: 0.8 },
    'Bat': { baseHp: 8, baseDmg: 2, defence: 5, weakness: 'RANGED', xpMod: 0.8 },
    'Goblin': { baseHp: 25, baseDmg: 4, defence: 5, weakness: 'SLASH', xpMod: 1.2 },
    'Skeleton': { baseHp: 30, baseDmg: 5, defence: 10, weakness: 'CRUSH', xpMod: 1.3 },
    'Wolf': { baseHp: 30, baseDmg: 6, defence: 5, weakness: 'STAB', xpMod: 1.3 },
    'Bear': { baseHp: 60, baseDmg: 8, defence: 15, weakness: 'MAGIC', xpMod: 1.8 },
    'Ice Golem': { baseHp: 80, baseDmg: 8, defence: 30, weakness: 'CRUSH', xpMod: 2.0 },
    'Dragon': { baseHp: 300, baseDmg: 25, defence: 60, weakness: 'STAB', xpMod: 5.0 },
};

// --- DATA: ITEMS ---
export const ITEMS: Record<string, Item> = {
    'wood': { id: 'wood', name: 'Wood', type: 'MATERIAL', description: 'Basic crafting material.', count: 1, value: 1 },
    'stone': { id: 'stone', name: 'Stone', type: 'MATERIAL', description: 'Used for crafting.', count: 1, value: 1 },
    'potion_small': { id: 'potion_small', name: 'Small Potion', type: 'CONSUMABLE', description: 'Heals 20 HP.', count: 1, healAmount: 20, value: 10 },
    'sword_training': { id: 'sword_training', name: 'Training Sword', type: 'EQUIPMENT', slot: 'WEAPON', description: 'A dull sword.', count: 1, weaponStats: WEAPON_STATS['Sword'], value: 5 },
    'iron_ingot': { id: 'iron_ingot', name: 'Iron Ingot', type: 'MATERIAL', description: 'Refined iron.', count: 1, value: 15 },
    'iron_ore': { id: 'iron_ore', name: 'Iron Ore', type: 'MATERIAL', description: 'Raw iron.', count: 1, value: 5 },
    'coal_ore': { id: 'coal_ore', name: 'Coal', type: 'MATERIAL', description: 'Fuel.', count: 1, value: 10 },
    'campfire_kit': { id: 'campfire_kit', name: 'Campfire Kit', type: 'GADGET', description: 'Place to cook.', count: 1, value: 25 },
    'cooked_fish': { id: 'cooked_fish', name: 'Cooked Fish', type: 'CONSUMABLE', description: 'Heals 15 HP.', count: 1, healAmount: 15, value: 10 },
    'raw_fish': { id: 'raw_fish', name: 'Raw Fish', type: 'CONSUMABLE', description: 'Needs cooking.', count: 1, value: 5 },
};

// --- DATA: RECIPES ---
export const RECIPES: Recipe[] = [
    { id: 'potion_small', name: 'Small Potion', resultItemId: 'potion_small', yield: 1, skill: 'Alchemy', levelReq: 1, xpReward: 10, ingredients: [{itemId: 'wood', count: 1}], station: 'ALCHEMY_TABLE' }, // Simplified
    { id: 'iron_ingot', name: 'Iron Ingot', resultItemId: 'iron_ingot', yield: 1, skill: 'Smithing', levelReq: 5, xpReward: 15, ingredients: [{itemId: 'iron_ore', count: 1}], station: 'FURNACE' },
    { id: 'campfire_kit', name: 'Campfire Kit', resultItemId: 'campfire_kit', yield: 1, skill: 'Crafting', levelReq: 1, xpReward: 20, ingredients: [{itemId: 'wood', count: 5}, {itemId: 'stone', count: 5}], station: 'WORKBENCH' },
];

// --- DATA: PERKS ---
export const PERKS: Record<string, Perk> = {
    'vision_plus': { id: 'vision_plus', name: 'Eagle Eye', description: '+Vision Radius', icon: '👁️', specialEffect: 'VISION_PLUS' },
    'night_vision': { id: 'night_vision', name: 'Night Owl', description: 'See in dark', icon: '🦉', specialEffect: 'NIGHT_VISION' },
    'iron_skin': { id: 'iron_skin', name: 'Iron Skin', description: '-1 Dmg Taken', icon: '🛡️', statBonus: { hp: 10 } },
    'titan_grip': { id: 'titan_grip', name: 'Titan Grip', description: '+10 STR', icon: '💪', statBonus: { str: 10 } },
};

// --- DATA: QUESTS ---
export const QUESTS: Record<string, Quest> = {
    'rat_catcher': { id: 'rat_catcher', title: 'Rat Catcher', description: 'Kill 5 Rats.', type: 'KILL', targetId: 'Rat', targetCount: 5, currentCount: 0, reward: { xp: 100, gold: 50 }, completed: false, giverId: 'guard', dialogueStart: ["Kill 5 Rats."], dialogueEnd: ["Good job."] },
};

// --- DATA: SECRETS ---
export const SECRETS: Secret[] = [
    { id: 'explorer', type: 'WORLD', title: 'Explorer', hint: 'Explore.', description: 'Explore 100 tiles.', statBonus: { dex: 1 }, perkId: 'vision_plus', condition: (gs) => Object.values(gs.exploration).flat().flat().filter(x=>x).length > 100 },
    { id: 'combat_1', type: 'COMBAT', title: 'First Blood', hint: 'Kill.', description: 'Kill 1 enemy.', statBonus: { str: 1 }, condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 1 },
];

// --- DATA: ACHIEVEMENTS ---
export const ACHIEVEMENTS: Achievement[] = [
    { id: 'killer_1', title: 'Killer', description: 'Kill 10 Enemies', reward: { gold: 50 }, condition: (gs) => (gs.counters['enemies_killed'] || 0) >= 10 },
];

// --- DATA: RESOURCE NODES ---
export const RESOURCE_NODES: any[] = [
    { id: 'tree_normal', tileTypes: ['TREE'], type: 'TREE', requiredLevel: 1, loot: 'wood', xp: 25, hardness: 0 },
    { id: 'rock_normal', tileTypes: ['ROCK'], type: 'ROCK', requiredLevel: 1, loot: 'stone', xp: 25, hardness: 0 },
    { id: 'rock_iron', tileTypes: ['STONE_BRICK'], type: 'ROCK', requiredLevel: 15, loot: 'iron_ore', xp: 40, hardness: 15 },
];

// --- GLOBAL MAP STATE ---
// Singleton to ensure all systems modify the same object
export const MAPS: Record<string, GameMap> = {};
