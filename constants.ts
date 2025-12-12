
import { GameMap, Secret, TileType, Entity, Item, Position, SkillName, Skill, Recipe, GameState, Quest, EquipmentSlot, Stats } from './types';

// Helper for pixel art assets
const createAsset = (svgContent: string) => 
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${svgContent}</svg>`)}`;

// --- PIXEL ART ASSETS ---
export const ASSETS = {
  // Tiles
  GRASS: createAsset(`
    <rect width="16" height="16" fill="#4ade80"/>
    <rect x="2" y="3" width="1" height="1" fill="#22c55e" opacity="0.5"/>
    <rect x="8" y="12" width="1" height="1" fill="#22c55e" opacity="0.5"/>
    <rect x="12" y="5" width="1" height="1" fill="#22c55e" opacity="0.5"/>
  `),
  DIRT_PATH: createAsset(`
    <rect width="16" height="16" fill="#a8a29e"/>
    <rect x="0" y="0" width="16" height="16" fill="#d6d3d1"/>
    <rect x="2" y="2" width="2" height="1" fill="#a8a29e" opacity="0.5"/>
    <rect x="10" y="5" width="1" height="2" fill="#a8a29e" opacity="0.5"/>
    <rect x="6" y="12" width="2" height="1" fill="#a8a29e" opacity="0.5"/>
  `),
  WALL: createAsset(`
    <rect width="16" height="16" fill="#57534e"/>
    <rect x="0" y="3" width="16" height="1" fill="#292524" opacity="0.4"/>
    <rect x="0" y="8" width="16" height="1" fill="#292524" opacity="0.4"/>
    <rect x="0" y="13" width="16" height="1" fill="#292524" opacity="0.4"/>
    <rect x="8" y="4" width="1" height="4" fill="#292524" opacity="0.4"/>
    <rect x="4" y="9" width="1" height="4" fill="#292524" opacity="0.4"/>
  `),
  WATER: createAsset(`
    <rect width="16" height="16" fill="#3b82f6"/>
    <rect x="2" y="4" width="4" height="1" fill="#93c5fd" opacity="0.6"/>
    <rect x="9" y="9" width="5" height="1" fill="#93c5fd" opacity="0.6"/>
  `),
  DEEP_WATER: createAsset(`
    <rect width="16" height="16" fill="#1e3a8a"/>
    <rect x="3" y="5" width="3" height="1" fill="#3b82f6" opacity="0.4"/>
    <rect x="10" y="10" width="4" height="1" fill="#3b82f6" opacity="0.4"/>
  `),
  FLOOR: createAsset(`
    <rect width="16" height="16" fill="#a8a29e"/>
    <rect x="0" y="0" width="16" height="1" fill="#78716c"/>
    <rect x="0" y="0" width="1" height="16" fill="#78716c"/>
    <rect x="4" y="4" width="1" height="1" fill="#78716c" opacity="0.5"/>
  `),
  PLANK: createAsset(`
    <rect width="16" height="16" fill="#92400e"/>
    <rect x="0" y="3" width="16" height="1" fill="#713f12"/>
    <rect x="0" y="7" width="16" height="1" fill="#713f12"/>
    <rect x="0" y="11" width="16" height="1" fill="#713f12"/>
    <rect x="0" y="15" width="16" height="1" fill="#713f12"/>
  `),
  LAVA: createAsset(`
    <rect width="16" height="16" fill="#ea580c"/>
    <rect x="2" y="3" width="2" height="2" fill="#facc15" opacity="0.8"/>
    <rect x="10" y="10" width="3" height="2" fill="#facc15" opacity="0.8"/>
    <rect x="6" y="6" width="2" height="2" fill="#f87171"/>
  `),
  DOOR: createAsset(`
    <rect x="2" y="1" width="12" height="14" fill="#78350f"/>
    <rect x="3" y="2" width="10" height="12" fill="#92400e"/>
    <circle cx="11" cy="9" r="1" fill="#facc15"/>
    <rect x="3" y="14" width="10" height="1" fill="#000" opacity="0.3"/>
  `),
  VOID: createAsset(`
    <rect width="16" height="16" fill="#000"/>
  `),
  SAND: createAsset(`
    <rect width="16" height="16" fill="#fde047"/>
    <rect x="2" y="2" width="1" height="1" fill="#d97706" opacity="0.3"/>
    <rect x="12" y="10" width="1" height="1" fill="#d97706" opacity="0.3"/>
  `),
  MUD: createAsset(`
    <rect width="16" height="16" fill="#573a2e"/>
    <rect x="3" y="3" width="2" height="2" fill="#3e2921" opacity="0.5"/>
  `),
  SNOW: createAsset(`
    <rect width="16" height="16" fill="#f8fafc"/>
    <rect x="3" y="3" width="1" height="1" fill="#cbd5e1"/>
    <rect x="12" y="8" width="1" height="1" fill="#cbd5e1"/>
  `),
  ICE: createAsset(`
    <rect width="16" height="16" fill="#cffafe"/>
    <path d="M4,4 L12,12 M12,4 L4,12" stroke="#a5f3fc" stroke-width="1" opacity="0.7"/>
  `),
  STONE_BRICK: createAsset(`
    <rect width="16" height="16" fill="#44403c"/>
    <rect x="0" y="4" width="16" height="1" fill="#292524"/>
    <rect x="0" y="9" width="16" height="1" fill="#292524"/>
    <rect x="0" y="14" width="16" height="1" fill="#292524"/>
    <rect x="8" y="0" width="1" height="4" fill="#292524"/>
    <rect x="4" y="5" width="1" height="4" fill="#292524"/>
  `),
  OBSIDIAN: createAsset(`
    <rect width="16" height="16" fill="#1c1917"/>
    <path d="M4,4 L10,2 L14,8 L8,14 L2,10 Z" fill="#292524"/>
    <path d="M10,2 L12,6 M14,8 L10,10" stroke="#44403c" stroke-width="0.5"/>
  `),

  // Objects (Overlays)
  TREE: createAsset(`
    <rect x="6" y="10" width="4" height="6" fill="#78350f"/>
    <rect x="4" y="2" width="8" height="8" fill="#15803d"/>
    <rect x="3" y="4" width="10" height="4" fill="#15803d"/>
    <rect x="5" y="3" width="1" height="1" fill="#4ade80" opacity="0.5"/>
  `),
  ROCK: createAsset(`
    <rect x="4" y="8" width="8" height="6" fill="#78716c" rx="1"/>
    <rect x="5" y="9" width="2" height="1" fill="#d6d3d1" opacity="0.5"/>
  `),
  CACTUS: createAsset(`
    <rect x="7" y="4" width="2" height="12" fill="#166534"/>
    <rect x="4" y="6" width="3" height="2" fill="#166534"/>
    <rect x="4" y="6" width="2" height="4" fill="#166534"/>
    <rect x="9" y="8" width="3" height="2" fill="#166534"/>
    <rect x="10" y="5" width="2" height="5" fill="#166534"/>
  `),
  GRAVESTONE: createAsset(`
    <path d="M4,16 L4,6 Q8,2 12,6 L12,16 Z" fill="#525252"/>
    <rect x="6" y="8" width="4" height="1" fill="#262626"/>
    <rect x="7.5" y="6.5" width="1" height="4" fill="#262626"/>
  `),
  SHRINE: createAsset(`
    <rect x="2" y="12" width="12" height="3" fill="#581c87"/>
    <rect x="4" y="10" width="8" height="2" fill="#6b21a8"/>
    <rect x="6" y="4" width="4" height="6" fill="#a855f7"/>
    <circle cx="8" cy="2" r="2" fill="#facc15" opacity="0.5"/>
  `),
  CHEST: createAsset(`
    <rect x="2" y="5" width="12" height="10" fill="#a16207" stroke="#422006" stroke-width="1"/>
    <rect x="2" y="8" width="12" height="1" fill="#422006" opacity="0.3"/>
    <rect x="7" y="8" width="2" height="2" fill="#facc15"/>
  `),
  BED: createAsset(`
    <rect x="2" y="4" width="12" height="11" fill="#dc2626"/>
    <rect x="2" y="4" width="12" height="3" fill="#fef2f2"/>
  `),
  FLOWER: createAsset(`
    <rect x="6" y="8" width="1" height="4" fill="#166534"/>
    <circle cx="5" cy="7" r="2" fill="#f472b6"/>
    <circle cx="8" cy="7" r="2" fill="#f472b6"/>
    <circle cx="6.5" cy="5" r="2" fill="#f472b6"/>
    <circle cx="6.5" cy="7" r="1" fill="#fef08a"/>
  `),
  WATERFALL: createAsset(`
    <rect width="16" height="16" fill="#3b82f6"/>
    <rect x="3" y="0" width="2" height="16" fill="#bfdbfe" opacity="0.7"/>
    <rect x="8" y="0" width="2" height="16" fill="#bfdbfe" opacity="0.5"/>
  `),
  BONES_DECOR: createAsset(`
    <rect x="6" y="6" width="4" height="1" fill="#e5e5e5"/>
    <circle cx="5" cy="6.5" r="1" fill="#e5e5e5"/>
    <circle cx="11" cy="6.5" r="1" fill="#e5e5e5"/>
  `),
  WAYPOINT: createAsset(`
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#60a5fa"/>
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#93c5fd" opacity="0.5" transform="scale(0.8) translate(1.6, 2)"/>
    <circle cx="8" cy="8" r="1" fill="#fff" class="animate-pulse"/>
  `),
  WAYPOINT_ACTIVE: createAsset(`
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#a855f7"/>
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#d8b4fe" opacity="0.5" transform="scale(0.8) translate(1.6, 2)"/>
    <circle cx="8" cy="8" r="2" fill="#fff" class="animate-ping"/>
  `),
  SIGNPOST: createAsset(`
    <rect x="7" y="8" width="2" height="8" fill="#78350f"/>
    <rect x="2" y="4" width="12" height="5" fill="#a16207" stroke="#422006"/>
    <path d="M3,5 L13,5 M3,7 L13,7" stroke="#713f12" opacity="0.5"/>
  `),
  ANVIL: createAsset(`
    <rect x="2" y="6" width="12" height="4" fill="#374151"/>
    <rect x="4" y="10" width="8" height="6" fill="#1f2937"/>
    <path d="M2,6 L0,4 L2,4" fill="#374151"/>
  `),
  WORKBENCH: createAsset(`
    <rect x="1" y="6" width="14" height="4" fill="#92400e"/>
    <rect x="2" y="10" width="2" height="6" fill="#78350f"/>
    <rect x="12" y="10" width="2" height="6" fill="#78350f"/>
    <rect x="3" y="5" width="4" height="1" fill="#fcd34d"/>
  `),
  ALCHEMY_TABLE: createAsset(`
    <rect x="2" y="6" width="12" height="8" fill="#5D4037"/>
    <rect x="1" y="6" width="14" height="2" fill="#8D6E63"/>
    <circle cx="4" cy="4" r="2" fill="#E91E63" opacity="0.8"/>
    <rect x="3" y="3" width="2" height="3" fill="#E91E63" opacity="0.8"/>
    <rect x="8" y="2" width="2" height="4" fill="#2196F3" opacity="0.8"/>
    <circle cx="12" cy="5" r="1.5" fill="#4CAF50" opacity="0.8"/>
  `),

  // Entities
  PLAYER: createAsset(`
    <rect x="5" y="11" width="2" height="4" fill="#1e3a8a"/>
    <rect x="9" y="11" width="2" height="4" fill="#1e3a8a"/>
    <rect x="4" y="6" width="8" height="5" fill="#3b82f6"/>
    <rect x="4" y="1" width="8" height="5" fill="#fca5a5"/>
    <rect x="4" y="0" width="8" height="2" fill="#451a03"/>
    <rect x="6" y="3" width="1" height="1" fill="#000"/>
    <rect x="10" y="3" width="1" height="1" fill="#000"/>
  `),
  SLIME: createAsset(`<rect x="3" y="6" width="10" height="8" fill="#4ade80" rx="1"/><rect x="5" y="8" width="1" height="1" fill="#000"/><rect x="9" y="8" width="1" height="1" fill="#000"/>`),
  RAT: createAsset(`<rect x="2" y="10" width="10" height="5" fill="#78716c"/><rect x="12" y="11" width="3" height="1" fill="#ea580c"/>`),
  SPIDER: createAsset(`<rect x="6" y="6" width="4" height="4" fill="#171717"/><path d="M4,4 L6,6 M12,4 L10,6 M4,12 L6,10 M12,12 L10,10" stroke="#171717" stroke-width="1"/>`),
  GOBLIN: createAsset(`<rect x="5" y="5" width="6" height="6" fill="#166534"/><rect x="4" y="6" width="1" height="2" fill="#166534"/><rect x="11" y="6" width="1" height="2" fill="#166534"/>`),
  GHOST: createAsset(`<path d="M4,14 L4,6 Q4,2 8,2 Q12,2 12,6 L12,14 L10,12 L8,14 L6,12 L4,14 Z" fill="#e5e7eb" opacity="0.8"/><rect x="6" y="6" width="1" height="2" fill="#000"/><rect x="9" y="6" width="1" height="2" fill="#000"/>`),
  BAT: createAsset(`<path d="M2,6 Q8,10 14,6 L12,10 L8,12 L4,10 Z" fill="#171717"/><circle cx="6" cy="9" r="0.5" fill="#ef4444"/><circle cx="10" cy="9" r="0.5" fill="#ef4444"/>`),
  SKELETON: createAsset(`<rect x="6" y="2" width="4" height="4" fill="#e5e5e5"/><rect x="7" y="6" width="2" height="6" fill="#e5e5e5"/><rect x="5" y="7" width="6" height="1" fill="#e5e5e5"/>`),
  
  // New Enemies
  SNAKE: createAsset(`<path d="M2,12 Q4,8 6,12 Q8,16 10,12 L14,10" fill="none" stroke="#65a30d" stroke-width="2"/><circle cx="14" cy="10" r="1" fill="#65a30d"/>`),
  SCORPION: createAsset(`<rect x="5" y="8" width="6" height="4" fill="#a16207"/><path d="M4,8 L2,6 M12,8 L14,6 M11,8 L13,4" stroke="#a16207" stroke-width="2"/>`),
  WOLF: createAsset(`<rect x="4" y="6" width="8" height="6" fill="#94a3b8"/><rect x="2" y="4" width="4" height="4" fill="#94a3b8"/><rect x="3" y="5" width="1" height="1" fill="#000"/>`),
  BEAR: createAsset(`<rect x="3" y="5" width="10" height="8" fill="#5c3a21"/><rect x="4" y="3" width="4" height="4" fill="#5c3a21"/><rect x="11" y="13" width="2" height="2" fill="#5c3a21"/><rect x="3" y="13" width="2" height="2" fill="#5c3a21"/>`),
  ZOMBIE: createAsset(`<rect x="5" y="4" width="6" height="10" fill="#4d7c0f"/><rect x="2" y="6" width="4" height="2" fill="#4d7c0f"/><rect x="6" y="2" width="4" height="4" fill="#4d7c0f"/><rect x="7" y="3" width="1" height="1" fill="#000"/>`),
  VAMPIRE: createAsset(`<rect x="6" y="2" width="4" height="4" fill="#fecaca"/><rect x="5" y="6" width="6" height="8" fill="#000"/><rect x="6" y="6" width="4" height="2" fill="#fff"/><rect x="4" y="2" width="8" height="4" fill="#000" opacity="0.3"/>`),
  KNIGHT: createAsset(`<rect x="5" y="2" width="6" height="12" fill="#9ca3af"/><rect x="6" y="3" width="4" height="1" fill="#000"/><rect x="7" y="3" width="2" height="4" fill="#000" opacity="0.3"/>`),
  ICE_GOLEM: createAsset(`<rect x="4" y="4" width="8" height="10" fill="#bae6fd"/><rect x="2" y="6" width="3" height="6" fill="#bae6fd"/><rect x="11" y="6" width="3" height="6" fill="#bae6fd"/><rect x="6" y="6" width="1" height="1" fill="#0284c7"/><rect x="9" y="6" width="1" height="1" fill="#0284c7"/>`),
  MINOTAUR: createAsset(`<rect x="4" y="4" width="8" height="10" fill="#573a2e"/><path d="M4,4 L2,2 M12,4 L14,2" stroke="#e5e5e5" stroke-width="2"/><circle cx="6" cy="7" r="1" fill="red"/><circle cx="10" cy="7" r="1" fill="red"/><rect x="6" y="10" width="4" height="4" fill="#000" opacity="0.3"/>`),
  BEHOLDER: createAsset(`<circle cx="8" cy="8" r="6" fill="#4c1d95"/><circle cx="8" cy="8" r="3" fill="#fef08a"/><circle cx="8" cy="8" r="1" fill="#000"/><path d="M8,2 L8,0 M14,8 L16,8 M8,14 L8,16 M2,8 L0,8" stroke="#a78bfa"/>`),
  
  // Bosses
  DRAGON: createAsset(`<rect x="4" y="6" width="10" height="6" fill="#b91c1c"/><path d="M2,6 L6,2 L10,6" fill="#b91c1c"/><rect x="0" y="4" width="4" height="4" fill="#b91c1c"/><rect x="1" y="5" width="1" height="1" fill="#facc15"/>`),
  KRAKEN: createAsset(`<rect x="4" y="4" width="8" height="6" fill="#7e22ce"/><path d="M4,10 Q2,14 4,16 M8,10 Q8,16 8,16 M12,10 Q14,14 12,16" stroke="#7e22ce" stroke-width="2" fill="none"/>`),
  LICH: createAsset(`<rect x="5" y="2" width="6" height="12" fill="#312e81"/><circle cx="8" cy="4" r="2" fill="#fef9c3"/><circle cx="7" cy="4" r="0.5" fill="#3b82f6"/><circle cx="9" cy="4" r="0.5" fill="#3b82f6"/>`),

  NPC: createAsset(`<rect x="4" y="6" width="8" height="9" fill="#b91c1c"/><rect x="5" y="1" width="6" height="5" fill="#fca5a5"/><polygon points="3,1 8,-3 13,1" fill="#7f1d1d"/>`),
  MAYOR: createAsset(`<rect x="4" y="6" width="8" height="9" fill="#1e3a8a"/><rect x="5" y="3" width="6" height="4" fill="#fca5a5"/><rect x="3" y="0" width="10" height="3" fill="#000"/><rect x="4" y="3" width="8" height="1" fill="#000"/>`),
  MERCHANT: createAsset(`<rect x="4" y="6" width="8" height="9" fill="#166534"/><rect x="5" y="2" width="6" height="5" fill="#fca5a5"/><rect x="3" y="1" width="10" height="2" fill="#facc15"/>`),
};

// --- ENEMY DATABASE ---
export const ENEMY_INFO: Record<string, {
    description: string;
    assetKey: keyof typeof ASSETS;
}> = {
    'Slime': { description: "A mindless blob of gelatinous acidity. Eats anything.", assetKey: 'SLIME' },
    'Rat': { description: "An unusually large rodent found in dark places.", assetKey: 'RAT' },
    'Bat': { description: "A flying nuisance that drains blood.", assetKey: 'BAT' },
    'Spider': { description: "Eight legs, many eyes, and venomous fangs.", assetKey: 'SPIDER' },
    'Goblin': { description: "A small, green, greedy humanoid.", assetKey: 'GOBLIN' },
    'Ghost': { description: "A restless spirit that chills the air.", assetKey: 'GHOST' },
    'Skeleton': { description: "A pile of bones animated by dark magic.", assetKey: 'SKELETON' },
    'Snake': { description: "A slithering reptile with a deadly bite.", assetKey: 'SNAKE' },
    'Scorpion': { description: "Armed with claws and a venomous stinger.", assetKey: 'SCORPION' },
    'Wolf': { description: "A wild hunter that travels in packs.", assetKey: 'WOLF' },
    'Bear': { description: "A massive beast with crushing strength.", assetKey: 'BEAR' },
    'Zombie': { description: "A rotting corpse that hungers for flesh.", assetKey: 'ZOMBIE' },
    'Vampire': { description: "An immortal bloodsucker of the night.", assetKey: 'VAMPIRE' },
    'Knight': { description: "A fallen warrior in rusted armor.", assetKey: 'KNIGHT' },
    'Ice Golem': { description: "A construct of living ice and frost.", assetKey: 'ICE_GOLEM' },
    'Minotaur': { description: "Half-man, half-bull, full of rage.", assetKey: 'MINOTAUR' },
    'Beholder': { description: "A floating eye that sees all.", assetKey: 'BEHOLDER' },
    'Dragon': { description: "The apex predator of the skies. Breaths fire.", assetKey: 'DRAGON' },
    'Kraken': { description: "A legendary horror from the deep ocean.", assetKey: 'KRAKEN' },
    'Lich': { description: "A powerful undead wizard who cheated death.", assetKey: 'LICH' },
};

// Initial Player Stats
export const INITIAL_STATS = {
  str: 10,
  dex: 10,
  int: 10,
  regeneration: 1,
  hp: 100,
  maxHp: 100,
  xp: 0,
  level: 1,
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
};

// --- Items & Procedural Generation Data ---

export const LOOT_TIERS = [
    { name: 'Wooden', minLvl: 1, mult: 1 },
    { name: 'Copper', minLvl: 5, mult: 1.5 },
    { name: 'Iron', minLvl: 10, mult: 2.5 },
    { name: 'Steel', minLvl: 20, mult: 4 },
    { name: 'Mithril', minLvl: 35, mult: 6.5 },
    { name: 'Adamant', minLvl: 50, mult: 10 },
    { name: 'Rune', minLvl: 70, mult: 15 },
    { name: 'Dragon', minLvl: 90, mult: 25 },
    { name: 'Crystal', minLvl: 120, mult: 40 },
    { name: 'Obsidian', minLvl: 150, mult: 60 },
    { name: 'Void', minLvl: 200, mult: 90 },
    { name: 'Starlight', minLvl: 300, mult: 150 },
    { name: 'Cosmic', minLvl: 500, mult: 300 },
];

export const EQUIPMENT_TYPES: Record<EquipmentSlot, { names: string[], statBias: (keyof Stats)[] }> = {
    'WEAPON': { names: ['Sword', 'Axe', 'Mace', 'Dagger', 'Spear'], statBias: ['str', 'dex'] },
    'HEAD': { names: ['Helm', 'Coif', 'Hat', 'Hood'], statBias: ['maxHp', 'int'] },
    'BODY': { names: ['Platebody', 'Chainmail', 'Robe', 'Tunic'], statBias: ['maxHp', 'regeneration'] },
    'LEGS': { names: ['Platelegs', 'Skirt', 'Chaps', 'Greaves'], statBias: ['maxHp', 'dex'] },
    'OFFHAND': { names: ['Shield', 'Buckler', 'Tome', 'Orb'], statBias: ['maxHp', 'int'] },
    'ACCESSORY': { names: ['Ring', 'Amulet', 'Charm', 'Talisman'], statBias: ['str', 'dex', 'int', 'maxHp', 'regeneration'] } // Random
};

export const STAT_SUFFIXES: { stat: keyof Stats, name: string }[] = [
    { stat: 'str', name: 'of Power' },
    { stat: 'str', name: 'of Giants' },
    { stat: 'str', name: 'of Smashing' },
    { stat: 'dex', name: 'of Speed' },
    { stat: 'dex', name: 'of the Hawk' },
    { stat: 'dex', name: 'of Precision' },
    { stat: 'int', name: 'of Magic' },
    { stat: 'int', name: 'of the Mind' },
    { stat: 'int', name: 'of Wisdom' },
    { stat: 'maxHp', name: 'of Vitality' },
    { stat: 'maxHp', name: 'of the Bear' },
    { stat: 'maxHp', name: 'of Life' },
    { stat: 'regeneration', name: 'of Mending' },
    { stat: 'regeneration', name: 'of Trolls' },
    { stat: 'regeneration', name: 'of Regrowth' },
];

// Static items for crafting/questing reference
export const ITEMS: Record<string, Item> = {
  // Existing
  SLIME_GOO: { id: 'SLIME_GOO', name: 'Slime Goo', type: 'MATERIAL', description: 'Sticky.', count: 0 },
  PEBBLE: { id: 'PEBBLE', name: 'Pebble', type: 'MATERIAL', description: 'Just a small rock.', count: 0 },
  THE_ROCK: { id: 'THE_ROCK', name: 'The Rock', type: 'JUNK', description: 'It is literally just a bigger rock.', count: 0 },
  OLD_BOOT: { id: 'OLD_BOOT', name: 'Old Boot', type: 'JUNK', description: 'Smells fishy.', count: 0 },
  POTION: { id: 'POTION', name: 'Red Potion', type: 'CONSUMABLE', description: 'Smells like cherries. Heals 15 HP.', count: 0, healAmount: 15 },
  BONE: { id: 'BONE', name: 'Bone', type: 'MATERIAL', description: 'Spooky.', count: 0 },
  BAT_WING: { id: 'BAT_WING', name: 'Bat Wing', type: 'MATERIAL', description: 'Leathery.', count: 0 },
  RAT_TAIL: { id: 'RAT_TAIL', name: 'Rat Tail', type: 'MATERIAL', description: 'Gross.', count: 0 },
  SPIDER_SILK: { id: 'SPIDER_SILK', name: 'Spider Silk', type: 'MATERIAL', description: 'Strong thread.', count: 0 },
  GOBLIN_EAR: { id: 'GOBLIN_EAR', name: 'Goblin Ear', type: 'MATERIAL', description: 'Waxy.', count: 0 },
  ECTOPLASM: { id: 'ECTOPLASM', name: 'Ectoplasm', type: 'MATERIAL', description: 'Slimy ghost residue.', count: 0 },
  // Alchemy
  SAND: { id: 'SAND', name: 'Sand', type: 'MATERIAL', description: 'Grains of earth.', count: 0 },
  EMPTY_VIAL: { id: 'EMPTY_VIAL', name: 'Empty Vial', type: 'MATERIAL', description: 'Holds liquids.', count: 0 },
  RED_HERB: { id: 'RED_HERB', name: 'Red Herb', type: 'MATERIAL', description: 'Medicinal plant.', count: 0 },
  // New
  SNAKE_SKIN: { id: 'SNAKE_SKIN', name: 'Snake Skin', type: 'MATERIAL', description: 'Scaly and dry.', count: 0 },
  SCORPION_TAIL: { id: 'SCORPION_TAIL', name: 'Stinger', type: 'MATERIAL', description: 'Still dripping venom.', count: 0 },
  WOLF_FUR: { id: 'WOLF_FUR', name: 'Wolf Fur', type: 'MATERIAL', description: 'Warm and soft.', count: 0 },
  BEAR_CLAW: { id: 'BEAR_CLAW', name: 'Bear Claw', type: 'MATERIAL', description: 'Sharp.', count: 0 },
  ICE_CORE: { id: 'ICE_CORE', name: 'Ice Core', type: 'MATERIAL', description: 'Never melts.', count: 0 },
  ROTTEN_FLESH: { id: 'ROTTEN_FLESH', name: 'Rotten Flesh', type: 'JUNK', description: 'Smells terrible.', count: 0 },
  VAMPIRE_DUST: { id: 'VAMPIRE_DUST', name: 'Vampire Dust', type: 'MATERIAL', description: 'Sparkles in the sun.', count: 0 },
  IRON_INGOT: { id: 'IRON_INGOT', name: 'Iron Ingot', type: 'MATERIAL', description: 'Heavy metal.', count: 0 },
  DRAGON_SCALE: { id: 'DRAGON_SCALE', name: 'Dragon Scale', type: 'MATERIAL', description: 'Hot to the touch.', count: 0 },
  KRAKEN_INK: { id: 'KRAKEN_INK', name: 'Kraken Ink', type: 'MATERIAL', description: 'Stains everything.', count: 0 },
  LICH_SKULL: { id: 'LICH_SKULL', name: 'Lich Skull', type: 'KEY', description: 'Radiates evil.', count: 0 },
  OBSIDIAN_SHARD: { id: 'OBSIDIAN_SHARD', name: 'Obsidian Shard', type: 'MATERIAL', description: 'Sharp and dark.', count: 0 },
  MINOTAUR_HORN: { id: 'MINOTAUR_HORN', name: 'Minotaur Horn', type: 'MATERIAL', description: 'Huge and heavy.', count: 0 },
  // Skills Items
  LOG: { id: 'LOG', name: 'Log', type: 'MATERIAL', description: 'Wood from a tree.', count: 0 },
  COPPER_ORE: { id: 'COPPER_ORE', name: 'Copper Ore', type: 'MATERIAL', description: 'Raw copper.', count: 0 },
  // Craftables
  WOODEN_SWORD: { id: 'WOODEN_SWORD', name: 'Wooden Sword', type: 'EQUIPMENT', slot: 'WEAPON', description: 'A practice weapon.', count: 0, stats: { str: 5 } },
  IRON_SWORD: { id: 'IRON_SWORD', name: 'Iron Sword', type: 'EQUIPMENT', slot: 'WEAPON', description: 'Standard issue.', count: 0, stats: { str: 10, dex: 2 }, rarity: 'UNCOMMON' },
  SHORTBOW: { id: 'SHORTBOW', name: 'Shortbow', type: 'EQUIPMENT', slot: 'WEAPON', description: 'Simple ranged weapon.', count: 0, stats: { dex: 5 } },
  TOTEM: { id: 'TOTEM', name: 'Wooden Totem', type: 'JUNK', description: 'A carved face.', count: 0 },
};

export const LOOT_TABLE: Record<string, string> = {
  'Slime': 'SLIME_GOO',
  'Rat': 'RAT_TAIL',
  'Bat': 'BAT_WING',
  'Spider': 'SPIDER_SILK',
  'Goblin': 'GOBLIN_EAR',
  'Skeleton': 'BONE',
  'Ghost': 'ECTOPLASM',
  'Snake': 'SNAKE_SKIN',
  'Scorpion': 'SCORPION_TAIL',
  'Wolf': 'WOLF_FUR',
  'Bear': 'BEAR_CLAW',
  'Zombie': 'ROTTEN_FLESH',
  'Vampire': 'VAMPIRE_DUST',
  'Ice Golem': 'ICE_CORE',
  'Dragon': 'DRAGON_SCALE',
  'Kraken': 'KRAKEN_INK',
  'Lich': 'LICH_SKULL',
  'Minotaur': 'MINOTAUR_HORN',
  'Beholder': 'OBSIDIAN_SHARD'
};

export const RECIPES: Recipe[] = [
    { id: 'the_rock', name: 'The Rock', resultItemId: 'THE_ROCK', yield: 1, skill: 'Crafting', levelReq: 1, xpReward: 10, ingredients: [{itemId: 'PEBBLE', count: 5}] },
    { id: 'wooden_sword', name: 'Wooden Sword', resultItemId: 'WOODEN_SWORD', yield: 1, skill: 'Carving', levelReq: 1, xpReward: 25, ingredients: [{itemId: 'LOG', count: 2}], station: 'WORKBENCH' },
    { id: 'shortbow', name: 'Shortbow', resultItemId: 'SHORTBOW', yield: 1, skill: 'Fletching', levelReq: 5, xpReward: 50, ingredients: [{itemId: 'LOG', count: 3}, {itemId: 'SPIDER_SILK', count: 1}], station: 'WORKBENCH' },
    { id: 'totem', name: 'Totem', resultItemId: 'TOTEM', yield: 1, skill: 'Carving', levelReq: 3, xpReward: 30, ingredients: [{itemId: 'LOG', count: 1}] },
    { id: 'iron_ingot', name: 'Iron Ingot', resultItemId: 'IRON_INGOT', yield: 1, skill: 'Crafting', levelReq: 10, xpReward: 100, ingredients: [{itemId: 'COPPER_ORE', count: 5}], station: 'ANVIL' },
    { id: 'iron_sword', name: 'Iron Sword', resultItemId: 'IRON_SWORD', yield: 1, skill: 'Crafting', levelReq: 15, xpReward: 200, ingredients: [{itemId: 'IRON_INGOT', count: 2}, {itemId: 'LOG', count: 1}], station: 'ANVIL' },
    // Alchemy
    { id: 'empty_vial', name: 'Empty Vial', resultItemId: 'EMPTY_VIAL', yield: 1, skill: 'Crafting', levelReq: 1, xpReward: 5, ingredients: [{itemId: 'SAND', count: 2}], station: 'WORKBENCH' },
    { id: 'red_potion_craft', name: 'Red Potion', resultItemId: 'POTION', yield: 1, skill: 'Alchemy', levelReq: 1, xpReward: 15, ingredients: [{itemId: 'EMPTY_VIAL', count: 1}, {itemId: 'RED_HERB', count: 2}], station: 'ALCHEMY_TABLE' },
];

export const QUESTS: Record<string, Quest> = {
    'q_slime_hunt': {
        id: 'q_slime_hunt',
        title: 'Slime Control',
        description: 'The slimes are getting out of hand. Thin their numbers.',
        type: 'KILL',
        targetId: 'Slime',
        targetCount: 5,
        currentCount: 0,
        reward: { xp: 100, gold: 50, itemId: 'POTION', itemCount: 3 },
        completed: false,
        giverId: 'mayor'
    },
    'q_rat_problem': {
        id: 'q_rat_problem',
        title: 'Rat Problem',
        description: 'Big rats are infesting the cellars. Kill them!',
        type: 'KILL',
        targetId: 'Rat',
        targetCount: 3,
        currentCount: 0,
        reward: { xp: 150, gold: 100 },
        completed: false,
        giverId: 'blacksmith'
    }
};

export const SECRETS_DATA: Omit<Secret, 'unlocked'>[] = [
    {
        id: 'first_kill',
        title: 'First Blood',
        description: 'Defeated your first enemy.',
        hint: 'Kill something.',
        statBonus: { str: 1, xp: 50 },
        condition: (gs: GameState) => (gs.counters['kills_total'] || 0) >= 1
    },
    {
        id: 'veteran',
        title: 'Veteran',
        description: 'Defeated 50 enemies.',
        hint: 'A trail of bodies.',
        statBonus: { str: 5, dex: 5, xp: 500 },
        condition: (gs: GameState) => (gs.counters['kills_total'] || 0) >= 50
    },
    {
        id: 'explorer',
        title: 'Explorer',
        description: 'Discovered 10 locations.',
        hint: 'Travel the world.',
        statBonus: { int: 5, xp: 200 },
        condition: (gs: GameState) => gs.knownLocations.length >= 10
    },
    {
        id: 'lava_born',
        title: 'Lava Born',
        description: 'Stepped in lava 20 times.',
        hint: 'The floor is hot.',
        statBonus: { maxHp: 20, xp: 100 },
        condition: (gs: GameState) => (gs.counters['step_lava'] || 0) >= 20
    },
    {
        id: 'survivor',
        title: 'Survivor',
        description: 'Won a battle with critical HP.',
        hint: 'Close call.',
        statBonus: { maxHp: 50, xp: 200 },
        condition: (gs: GameState) => !!gs.flags['win_low_hp']
    },
    {
        id: 'collector',
        title: 'Collector',
        description: 'Have 5 different materials in inventory.',
        hint: 'Hoarder.',
        statBonus: { int: 2, xp: 50 },
        condition: (gs: GameState) => gs.inventory.filter(i => i.type === 'MATERIAL').length >= 5
    },
    {
        id: 'lumberjack',
        title: 'Timber!',
        description: 'You have chopped down an entire forest\'s worth of wood.',
        hint: 'Deforest the land.',
        statBonus: { str: 2, xp: 100 },
        condition: (gs: GameState) => gs.skills['Woodcutting'].level >= 5
    },
    {
        id: 'stone_cold',
        title: 'Stone Cold',
        description: 'Your pickaxe has struck the earth hundreds of times.',
        hint: 'Mining makes you strong.',
        statBonus: { str: 2, xp: 100 },
        condition: (gs: GameState) => gs.skills['Mining'].level >= 5
    },
    {
        id: 'slime_nightmare',
        title: 'Slime Nightmare',
        description: 'The slime population has significantly decreased due to your actions.',
        hint: 'Green jelly hates you.',
        statBonus: { dex: 3, xp: 150 },
        condition: (gs: GameState) => (gs.counters['kill_slime'] || 0) >= 20
    },
    {
        id: 'boss_dragon',
        title: 'Dragonslayer',
        description: 'You faced the beast of the volcano and emerged victorious.',
        hint: 'Seek the hottest place on the map.',
        statBonus: { str: 10, maxHp: 100, xp: 5000 },
        condition: (gs: GameState) => !!gs.flags['dead_BOSS_DRAGON']
    },
    {
        id: 'boss_lich',
        title: 'Undead Bane',
        description: 'The ancient Lich has been put to rest, again.',
        hint: 'Find the ruins in the northeast.',
        statBonus: { int: 10, maxHp: 50, xp: 4000 },
        condition: (gs: GameState) => !!gs.flags['dead_BOSS_LICH']
    },
    {
        id: 'boss_kraken',
        title: 'Sushi Chef',
        description: 'The horror of the deep is now dinner.',
        hint: 'The desert hides a watery secret in the southwest.',
        statBonus: { dex: 10, maxHp: 50, xp: 4000 },
        condition: (gs: GameState) => !!gs.flags['dead_BOSS_KRAKEN']
    },
    {
        id: 'boss_golem',
        title: 'Ice Breaker',
        description: 'You shattered the frozen guardian.',
        hint: 'The northwest tundra holds a giant.',
        statBonus: { str: 5, maxHp: 150, xp: 3000 },
        condition: (gs: GameState) => !!gs.flags['dead_BOSS_GOLEM']
    },
    {
        id: 'full_kit',
        title: 'Fully Suited',
        description: 'You have equipped an item in every slot.',
        hint: 'Cover your shame.',
        statBonus: { maxHp: 20, xp: 200 },
        condition: (gs: GameState) => Object.values(gs.equipment).every(i => i !== null)
    },
    {
        id: 'legendary_hero',
        title: 'Legendary Hero',
        description: 'You found an item of Legendary rarity.',
        hint: 'Get lucky with loot.',
        statBonus: { int: 5, xp: 1000 },
        condition: (gs: GameState) => gs.inventory.some(i => i.rarity === 'LEGENDARY') || Object.values(gs.equipment).some(i => i?.rarity === 'LEGENDARY')
    },
    {
        id: 'headbanger',
        title: 'Headbanger',
        description: 'You ran into walls 50 times. Are you okay?',
        hint: 'Watch where you are walking.',
        statBonus: { int: -1, maxHp: 10 },
        condition: (gs: GameState) => (gs.counters['bump_wall'] || 0) >= 50
    },
    {
        id: 'party_animal',
        title: 'Party Animal',
        description: 'You danced 20 times in the Secret Village.',
        hint: 'Dance like everyone is watching at home.',
        statBonus: { dex: 2, xp: 50 },
        condition: (gs: GameState) => (gs.counters['dance_town'] || 0) >= 20
    },
    {
        id: 'globetrotter',
        title: 'Globetrotter',
        description: 'You have visited every major town.',
        hint: 'Visit all 5 settlements.',
        statBonus: { int: 5, xp: 500 },
        condition: (gs: GameState) => gs.knownWaypoints.length >= 5
    },
    {
        id: 'flower_child',
        title: 'Flower Child',
        description: 'You trampled 50 flowers. You monster.',
        hint: 'Stop smelling the roses.',
        statBonus: { int: 2, xp: 50 },
        condition: (gs: GameState) => (gs.counters['step_flower'] || 0) >= 50
    }
];

// --- WORLD GENERATOR ---
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const WORLD_SIZE = 20; // 20x20 = 400 Zones!
const CENTER_X = 10;
const CENTER_Y = 10;

const TOWNS = [
  { x: 10, y: 10, name: 'Secret Village', biome: 'TOWN', desc: 'Home.' },
  { x: 10, y: 2, name: 'Frosthold', biome: 'TOWN_ICE', desc: 'A frozen outpost.' },
  { x: 10, y: 17, name: 'Sunfire Oasis', biome: 'TOWN_DESERT', desc: 'A refuge in the sands.' },
  { x: 18, y: 10, name: 'Iron Deep', biome: 'TOWN_VOLCANO', desc: 'Forged in fire.' },
  { x: 2, y: 10, name: 'Roothaven', biome: 'TOWN_SWAMP', desc: 'One with nature.' }
];

const generateMap = (width: number, height: number, fill: TileType): TileType[][] => 
  Array(height).fill(null).map(() => Array(width).fill(fill));

const createWorld = () => {
  const worldMaps: Record<string, GameMap> = {};
  
  // 1. Static Interiors
  const createInterior = (id: string, name: string) => {
      const tiles = generateMap(8, 8, 'PLANK');
      for(let i=0; i<8; i++) { tiles[0][i] = 'WALL'; tiles[7][i] = 'WALL'; }
      for(let i=0; i<8; i++) { tiles[i][0] = 'WALL'; tiles[i][7] = 'WALL'; }
      tiles[7][4] = 'DOOR'; 
      return { id, name, width: 8, height: 8, tiles, entities: [], exits: [], difficulty: 1, biome: 'INTERIOR' };
  };
  
  const housePlayer = createInterior('house_player', "My Home");
  housePlayer.entities = [
      { id: 'bed', name: 'Bed', type: 'OBJECT', subType: 'BED', symbol: '=', color: 'red', pos: { x: 1, y: 1 } },
      { id: 'chest1', name: 'Old Chest', type: 'OBJECT', subType: 'CHEST', symbol: 'H', color: 'brown', pos: { x: 6, y: 1 }, loot: 'POTION' },
      { id: 'wb1', name: 'Workbench', type: 'OBJECT', subType: 'WORKBENCH', symbol: 'T', color: 'brown', pos: { x: 3, y: 1 } },
      { id: 'alch1', name: 'Alchemy Table', type: 'OBJECT', subType: 'ALCHEMY_TABLE', symbol: 'A', color: 'purple', pos: { x: 5, y: 1 } }
  ];
  worldMaps['house_player'] = housePlayer;

  const houseElder = createInterior('house_elder', "Elder's Hut");
  houseElder.entities = [
       { id: 'elder', name: 'Elder Sage', type: 'NPC', symbol: '☺', color: 'text-yellow-400', pos: { x: 4, y: 2 }, dialogue: ['The roads are safe... mostly.', 'Follow the dirt paths to reach other settlements.', 'Frosthold lies far to the North.'] },
       { id: 'chest_elder', name: 'Gilded Chest', type: 'OBJECT', subType: 'CHEST', symbol: 'H', color: 'gold', pos: { x: 1, y: 1 }, loot: 'POTION' }
  ];
  worldMaps['house_elder'] = houseElder;

  // New Interiors for Secret Village
  const interiorBlacksmith = createInterior('interior_blacksmith', "Blacksmith's Forge");
  // Fix Blacksmith Door (Right Side)
  interiorBlacksmith.tiles[7][4] = 'WALL'; // Remove default
  interiorBlacksmith.tiles[4][7] = 'DOOR'; // Add new
  // Add Cellar Hatch
  interiorBlacksmith.tiles[6][6] = 'VOID'; // Hatch
  
  interiorBlacksmith.entities = [
      { id: 'npc_blacksmith', name: 'Blacksmith', type: 'NPC', symbol: 'B', color: 'grey', pos: {x: 3, y: 3}, dialogue: ["Need something forged?", "The rats in my cellar are eating my leather straps."], questId: 'q_rat_problem' },
      { id: 'anvil1', name: 'Anvil', type: 'OBJECT', subType: 'ANVIL', symbol: 'A', color: 'grey', pos: {x: 4, y: 3} },
      { id: 'chest_bs', name: 'Smithy Chest', type: 'OBJECT', subType: 'CHEST', symbol: 'H', color: 'brown', pos: {x: 1, y: 1}, loot: 'IRON_INGOT' }
  ];
  worldMaps['interior_blacksmith'] = interiorBlacksmith;

  const interiorTownHall = createInterior('interior_townhall', "Town Hall");
  interiorTownHall.entities = [
      { id: 'npc_mayor', name: 'Mayor', type: 'NPC', symbol: 'M', color: 'blue', pos: {x: 4, y: 2}, dialogue: ["Welcome to our village.", "We have a slime problem."], questId: 'q_slime_hunt' },
  ];
  worldMaps['interior_townhall'] = interiorTownHall;

  const interiorShop = createInterior('interior_shop', "General Store");
  // Fix Shop Door (Left Side)
  interiorShop.tiles[7][4] = 'WALL'; // Remove default
  interiorShop.tiles[4][0] = 'DOOR'; // Add new
  interiorShop.entities = [
      { id: 'npc_merchant', name: 'Merchant', type: 'NPC', symbol: '$', color: 'gold', pos: {x: 4, y: 3}, dialogue: ["Finest goods!", "No refunds."] },
      { id: 'chest_shop', name: 'Goods', type: 'OBJECT', subType: 'CHEST', symbol: 'H', color: 'brown', pos: {x: 6, y: 1}, loot: 'POTION' }
  ];
  worldMaps['interior_shop'] = interiorShop;

  // New Cellar
  const interiorCellar = createInterior('interior_cellar', "Musty Cellar");
  interiorCellar.tiles = generateMap(8, 8, 'STONE_BRICK');
  for(let i=0; i<8; i++) { interiorCellar.tiles[0][i] = 'WALL'; interiorCellar.tiles[7][i] = 'WALL'; }
  for(let i=0; i<8; i++) { interiorCellar.tiles[i][0] = 'WALL'; interiorCellar.tiles[i][7] = 'WALL'; }
  interiorCellar.tiles[7][4] = 'WALL'; // Remove default door
  interiorCellar.tiles[1][1] = 'DIRT_PATH'; // Entrance
  interiorCellar.entities = [
      { id: 'rat1', name: 'Rat', type: 'ENEMY', symbol: 'r', color: 'gray', pos: { x: 3, y: 3 }, level: 2, hp: 15, maxHp: 15 },
      { id: 'rat2', name: 'Rat', type: 'ENEMY', symbol: 'r', color: 'gray', pos: { x: 5, y: 5 }, level: 2, hp: 15, maxHp: 15 },
      { id: 'rat3', name: 'Rat', type: 'ENEMY', symbol: 'r', color: 'gray', pos: { x: 2, y: 6 }, level: 3, hp: 20, maxHp: 20 },
      { id: 'chest_cellar', name: 'Old Chest', type: 'OBJECT', subType: 'CHEST', symbol: 'H', color: 'brown', pos: { x: 6, y: 6 }, loot: 'OLD_BOOT' }
  ];
  worldMaps['interior_cellar'] = interiorCellar;

  // Link Blacksmith <-> Cellar
  interiorBlacksmith.exits.push({ pos: { x: 6, y: 6 }, targetMapId: 'interior_cellar', targetPos: { x: 1, y: 2 } });
  interiorCellar.exits.push({ pos: { x: 1, y: 1 }, targetMapId: 'interior_blacksmith', targetPos: { x: 5, y: 6 } });


  // 2. Generate Grid
  for (let wy = 0; wy < WORLD_SIZE; wy++) {
    for (let wx = 0; wx < WORLD_SIZE; wx++) {
      const mapId = `map_${wx}_${wy}`;
      let name = "Wilderness";
      let baseTile: TileType = 'GRASS';
      let entities: Entity[] = [];
      let tiles: TileType[][] = [];
      const exits: { pos: Position; targetMapId: string; targetPos: Position }[] = [];

      // BIOME LOGIC based on coordinates
      const distCenter = Math.sqrt((wx-CENTER_X)**2 + (wy-CENTER_Y)**2);
      const difficulty = Math.max(1, Math.floor(distCenter * 5)); // Difficulty multiplier
      
      let biome = 'MEADOW';
      
      // Determine Biome
      if (wy < 4) biome = 'TUNDRA';
      else if (wy > 16) biome = 'DESERT';
      else if (wx < 4) biome = 'GRAVEYARD';
      else if (wx > 16) biome = 'VOLCANO';
      else if (wx > 14 && wx < 18 && wy > 14 && wy < 18) biome = 'LABYRINTH'; // The Labyrinth
      else if (wx > 12 && wy > 12) biome = 'RUINS'; // South-East Corner
      else if (wx < 7 && wy < 7) biome = 'FOREST';
      else if (wx > 13 && wy < 6) biome = 'MOUNTAIN';
      else if (wx > 14 && wy > 8 && wy < 12) biome = 'SWAMP';
      else if (distCenter < 3) biome = 'MEADOW';

      // Check for Towns
      const specialTown = TOWNS.find(t => t.x === wx && t.y === wy);

      // Check for Paths (Highways)
      // Vertical path at x=10 from y=2 to y=17
      const isPathV = wx === 10 && wy >= 2 && wy <= 17;
      // Horizontal path at y=10 from x=2 to x=18
      const isPathH = wy === 10 && wx >= 2 && wx <= 18;

      if (specialTown) {
          name = specialTown.name;
          biome = specialTown.biome;
          
          let floorTile: TileType = 'GRASS';
          if (biome === 'TOWN_ICE') floorTile = 'SNOW';
          if (biome === 'TOWN_DESERT') floorTile = 'SAND';
          if (biome === 'TOWN_VOLCANO') floorTile = 'STONE_BRICK';
          if (biome === 'TOWN_SWAMP') floorTile = 'MUD';
          
          tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, floorTile);

          // Standard Town Layout Base
          for(let y=3; y<8; y++) for(let x=7; x<13; x++) tiles[y][x] = 'FLOOR';
          tiles[4][10] = 'SHRINE';
          
          // Walls
          for(let i=0; i<MAP_WIDTH; i++) { tiles[0][i] = 'WALL'; tiles[MAP_HEIGHT-1][i] = 'WALL'; }
          for(let i=0; i<MAP_HEIGHT; i++) { tiles[i][0] = 'WALL'; tiles[i][MAP_WIDTH-1] = 'WALL'; }
          
          // Gates
          tiles[4][0] = floorTile; tiles[4][1] = floorTile; // West
          tiles[4][MAP_WIDTH-1] = floorTile; tiles[4][MAP_WIDTH-2] = floorTile; // East
          tiles[0][10] = floorTile; tiles[1][10] = floorTile; // North
          tiles[MAP_HEIGHT-1][10] = floorTile; tiles[MAP_HEIGHT-2][10] = floorTile; // South

          // Unique Town Features
          if (biome === 'TOWN') { // Secret Village (Center)
              // Override layout for better town
              // Clear center
              tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'GRASS');
              for(let i=0; i<MAP_WIDTH; i++) { tiles[0][i] = 'WALL'; tiles[MAP_HEIGHT-1][i] = 'WALL'; }
              for(let i=0; i<MAP_HEIGHT; i++) { tiles[i][0] = 'WALL'; tiles[i][MAP_WIDTH-1] = 'WALL'; }
              
              // New Road Layout: Horizontal at y=7 (center), Vertical at x=10 (center)
              // Gates - Align with road
              tiles[7][0] = 'DIRT_PATH'; tiles[7][MAP_WIDTH-1] = 'DIRT_PATH';
              tiles[0][10] = 'DIRT_PATH'; tiles[MAP_HEIGHT-1][10] = 'DIRT_PATH';
              
              // Roads
              for(let x=1; x<MAP_WIDTH-1; x++) tiles[7][x] = 'DIRT_PATH';
              for(let y=1; y<MAP_HEIGHT-1; y++) tiles[y][10] = 'DIRT_PATH';
              
              // Helper to build house
              const buildHouse = (bx: number, by: number, w: number, h: number, doorRelX: number, doorRelY: number) => {
                  for(let y=by; y<by+h; y++) {
                      for(let x=bx; x<bx+w; x++) {
                          if (y===by || y===by+h-1 || x===bx || x===bx+w-1) tiles[y][x] = 'WALL';
                          else tiles[y][x] = 'PLANK';
                      }
                  }
                  tiles[by+doorRelY][bx+doorRelX] = 'DOOR';
                  return { x: bx+doorRelX, y: by+doorRelY };
              };

              // Player House (Top Left)
              let d = buildHouse(2, 2, 6, 5, 3, 4); // door at bottom
              worldMaps['house_player'].exits = [{ pos: { x: 4, y: 7 }, targetMapId: mapId, targetPos: { x: d.x, y: d.y + 1 } }];
              exits.push({ pos: { x: d.x, y: d.y }, targetMapId: 'house_player', targetPos: { x: 4, y: 6 } });

              // Elder House (Top Right)
              d = buildHouse(13, 2, 6, 5, 2, 4);
              worldMaps['house_elder'].exits = [{ pos: { x: 4, y: 7 }, targetMapId: mapId, targetPos: { x: d.x, y: d.y + 1 } }];
              exits.push({ pos: { x: d.x, y: d.y }, targetMapId: 'house_elder', targetPos: { x: 4, y: 6 } });

              // Blacksmith (Bottom Left)
              d = buildHouse(2, 9, 6, 5, 5, 2); // door right
              worldMaps['interior_blacksmith'].exits = [{ pos: { x: 7, y: 4 }, targetMapId: mapId, targetPos: { x: d.x + 1, y: d.y } }];
              // IMPORTANT: Keep existing cellar link
              exits.push({ pos: { x: d.x, y: d.y }, targetMapId: 'interior_blacksmith', targetPos: { x: 6, y: 4 } }); 

              // Shop (Bottom Right)
              d = buildHouse(13, 9, 6, 5, 0, 2); // door left
              worldMaps['interior_shop'].exits = [{ pos: { x: 0, y: 4 }, targetMapId: mapId, targetPos: { x: d.x - 1, y: d.y } }];
              exits.push({ pos: { x: d.x, y: d.y }, targetMapId: 'interior_shop', targetPos: { x: 1, y: 4 } }); 

              // Shrine
              tiles[7][10] = 'SHRINE'; // Intersection
              entities.push({ id: `wp_${wx}_${wy}`, name: `${specialTown.name} Waypoint`, type: 'OBJECT', subType: 'WAYPOINT', symbol: '♦', color: 'cyan', pos: { x: 10, y: 7 } });

          } else {
              // Generic NPC for other towns
              entities.push({ 
                  id: `npc_${wx}_${wy}`, 
                  name: `${specialTown.name} Guard`, 
                  type: 'NPC', 
                  symbol: '☺', 
                  color: 'cyan', 
                  pos: { x: 9, y: 5 }, 
                  dialogue: [`Welcome to ${specialTown.name}.`, specialTown.desc] 
              });
              entities.push({ id: `wp_${wx}_${wy}`, name: `${specialTown.name} Waypoint`, type: 'OBJECT', subType: 'WAYPOINT', symbol: '♦', color: 'cyan', pos: { x: 10, y: 5 } });
          }

      } else if (biome === 'LABYRINTH') {
          name = "The Labyrinth";
          baseTile = 'STONE_BRICK';
          tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'STONE_BRICK');
          // Maze-like structure
          for(let i=0; i<MAP_WIDTH; i++) { tiles[0][i] = 'OBSIDIAN'; tiles[MAP_HEIGHT-1][i] = 'OBSIDIAN'; }
          for(let i=0; i<MAP_HEIGHT; i++) { tiles[i][0] = 'OBSIDIAN'; tiles[i][MAP_WIDTH-1] = 'OBSIDIAN'; }
          // Random internal walls
          for(let y=2; y<MAP_HEIGHT-2; y+=2) {
              for(let x=2; x<MAP_WIDTH-2; x+=2) {
                  tiles[y][x] = 'OBSIDIAN';
                  if(Math.random()>0.5) tiles[y][x+1] = 'OBSIDIAN';
                  else tiles[y+1][x] = 'OBSIDIAN';
              }
          }
          if (wx === 15 && wy === 15) {
              // Labyrinth Entrance Waypoint
              tiles[7][10] = 'FLOOR';
              entities.push({ id: 'wp_labyrinth', name: 'Labyrinth Entrance', type: 'OBJECT', subType: 'WAYPOINT', symbol: '♦', color: 'purple', pos: { x: 10, y: 7 } });
          }
      } else {
          // Standard Wilderness Generation
          if (biome === 'TUNDRA') {
              name = "Frozen Wastes"; baseTile = 'SNOW'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'SNOW');
              for(let i=0; i<50; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'ICE';
              for(let i=0; i<20; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'ROCK';
          } else if (biome === 'DESERT') {
              name = "Scorched Sands"; baseTile = 'SAND'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'SAND');
              for(let i=0; i<30; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'CACTUS';
          } else if (biome === 'GRAVEYARD') {
              name = "Cursed Earth"; baseTile = 'MUD'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'MUD');
              for(let i=0; i<40; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'GRAVESTONE';
          } else if (biome === 'VOLCANO') {
              name = "Magma Fields"; baseTile = 'LAVA'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'LAVA');
              for(let i=0; i<60; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'ROCK';
          } else if (biome === 'RUINS') {
              name = "Ancient Ruins"; baseTile = 'FLOOR'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'FLOOR');
              for(let i=0; i<50; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'STONE_BRICK';
              for(let i=0; i<30; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'WALL';
          } else if (biome === 'SWAMP') {
              name = "Bog"; baseTile = 'MUD'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'MUD');
              for(let i=0; i<40; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'DEEP_WATER';
          } else if (biome === 'MOUNTAIN') {
              name = "High Peaks"; baseTile = 'ROCK'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'ROCK');
              for(let i=0; i<100; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'FLOOR';
          } else {
              name = "Grasslands"; baseTile = 'GRASS'; tiles = generateMap(MAP_WIDTH, MAP_HEIGHT, 'GRASS');
              for(let i=0; i<30; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'TREE';
              for(let i=0; i<20; i++) tiles[Math.floor(Math.random()*MAP_HEIGHT)][Math.floor(Math.random()*MAP_WIDTH)] = 'FLOWER';
          }

          // Apply Paths (Highways)
          if (isPathV) {
              for (let y = 0; y < MAP_HEIGHT; y++) {
                  tiles[y][10] = 'DIRT_PATH';
                  tiles[y][11] = 'DIRT_PATH';
              }
          }
          if (isPathH) {
              for (let x = 0; x < MAP_WIDTH; x++) {
                  tiles[7][x] = 'DIRT_PATH';
                  tiles[8][x] = 'DIRT_PATH';
              }
          }
          // Fix Intersection center
          if (isPathV && isPathH) {
              tiles[7][10] = 'DIRT_PATH'; tiles[7][11] = 'DIRT_PATH';
              tiles[8][10] = 'DIRT_PATH'; tiles[8][11] = 'DIRT_PATH';
          }
      }

      // Signposts in Wilderness (Updated to point to closest town)
      if (!specialTown && biome !== 'LABYRINTH' && Math.random() < 0.1) {
          const sx = Math.floor(Math.random()*(MAP_WIDTH-2))+1;
          const sy = Math.floor(Math.random()*(MAP_HEIGHT-2))+1;
          if (tiles[sy][sx] !== 'WALL' && tiles[sy][sx] !== 'WATER' && tiles[sy][sx] !== 'LAVA') {
              // Find closest town
              let closest = TOWNS[0];
              let minDist = 999;
              for (const t of TOWNS) {
                  const d = Math.sqrt((t.x - wx)**2 + (t.y - wy)**2);
                  if (d < minDist) { minDist = d; closest = t; }
              }
              
              entities.push({
                  id: `${mapId}_sign`,
                  name: `Signpost to ${closest.name}`,
                  type: 'OBJECT',
                  subType: 'SIGNPOST',
                  symbol: '⚑',
                  color: 'brown',
                  pos: { x: sx, y: sy },
                  destination: { mapId: `map_${closest.x}_${closest.y}`, x: closest.x, y: closest.y, name: closest.name }
              });
          }
      }

      // Populate Enemies
      const numEntities = Math.floor(Math.random() * 4) + 2;
      for(let i=0; i<numEntities; i++) {
          const ex = Math.floor(Math.random() * (MAP_WIDTH-2)) + 1;
          const ey = Math.floor(Math.random() * (MAP_HEIGHT-2)) + 1;
          
          if (!specialTown && tiles[ey][ex] !== 'WALL' && tiles[ey][ex] !== 'WATER' && tiles[ey][ex] !== 'LAVA' && tiles[ey][ex] !== 'OBSIDIAN') {
              let enemyType = 'Slime';
              let symbol = 's';
              let level = Math.max(1, Math.floor(difficulty + (Math.random() * 5)));
              let elite = false;

              if (biome === 'LABYRINTH') {
                  enemyType = Math.random() > 0.5 ? 'Minotaur' : 'Beholder';
                  symbol = enemyType === 'Minotaur' ? 'M' : 'O';
                  level += 50; // Elite levels
                  elite = true;
              }
              else if (biome === 'TUNDRA') {
                 const r = Math.random();
                 if (r > 0.8) { enemyType = 'Ice Golem'; symbol = 'I'; }
                 else if (r > 0.4) { enemyType = 'Bear'; symbol = 'B'; }
                 else { enemyType = 'Wolf'; symbol = 'w'; }
              }
              else if (biome === 'DESERT') {
                 const r = Math.random();
                 if (r > 0.5) { enemyType = 'Snake'; symbol = 'S'; }
                 else { enemyType = 'Scorpion'; symbol = 'c'; }
              }
              else if (biome === 'GRAVEYARD') {
                 const r = Math.random();
                 if (r > 0.6) { enemyType = 'Vampire'; symbol = 'V'; }
                 else { enemyType = 'Zombie'; symbol = 'Z'; }
              }
              else if (biome === 'RUINS') {
                 enemyType = 'Knight'; symbol = 'K';
              }
              else if (biome === 'VOLCANO') {
                 enemyType = 'Skeleton'; symbol = 'S';
              }
              else if (biome === 'SWAMP') {
                  enemyType = 'Rat'; symbol = 'r';
              }
              else if (biome === 'MOUNTAIN') {
                  enemyType = 'Bat'; symbol = 'b';
              }
              else if (biome === 'FOREST') {
                  enemyType = Math.random() > 0.5 ? 'Goblin' : 'Spider'; symbol = 'g';
              }

              const baseHp = 10;
              const hp = Math.floor(baseHp * Math.pow(1.2, level) * (elite ? 2 : 1));

              entities.push({
                  id: `${mapId}_e${i}`,
                  name: elite ? `Elite ${enemyType}` : enemyType,
                  type: 'ENEMY',
                  symbol,
                  color: elite ? 'purple' : 'white',
                  pos: { x: ex, y: ey },
                  level: level,
                  hp: hp,
                  maxHp: hp
              });
          }
      }
      
      // BOSSES
      if (wx === 0 && wy === 0) { // Top Left Tundra
          const lvl = 500;
          entities.push({id: 'BOSS_GOLEM', name: 'Ice Golem', type: 'ENEMY', symbol: 'I', color:'cyan', pos: {x:10, y:7}, level: lvl, hp: 1000 * lvl, maxHp: 1000 * lvl});
      }
      if (wx === 19 && wy === 19) { // Bottom Right Volcano
          const lvl = 2000;
          entities.push({id: 'BOSS_DRAGON', name: 'Dragon', type: 'ENEMY', symbol: 'D', color:'red', pos: {x:10, y:7}, level: lvl, hp: 10000 * lvl, maxHp: 10000 * lvl});
      }
      if (wx === 0 && wy === 19) { // Bottom Left Desert
          const lvl = 1000;
          entities.push({id: 'BOSS_KRAKEN', name: 'Kraken', type: 'ENEMY', symbol: 'K', color:'purple', pos: {x:10, y:7}, level: lvl, hp: 5000 * lvl, maxHp: 5000 * lvl});
      }
      if (wx === 19 && wy === 0) { // Top Right Ruins
           const lvl = 1500;
           entities.push({id: 'BOSS_LICH', name: 'Lich', type: 'ENEMY', symbol: 'L', color:'green', pos: {x:10, y:7}, level: lvl, hp: 8000 * lvl, maxHp: 8000 * lvl});
      }

      // Add Exits - Connect maps to neighbors
      const midX = Math.floor(MAP_WIDTH / 2);
      const midY = Math.floor(MAP_HEIGHT / 2);

      if (wy > 0) exits.push({ pos: { x: midX, y: 0 }, targetMapId: `map_${wx}_${wy-1}`, targetPos: { x: midX, y: MAP_HEIGHT-2 } });
      if (wy < WORLD_SIZE - 1) exits.push({ pos: { x: midX, y: MAP_HEIGHT-1 }, targetMapId: `map_${wx}_${wy+1}`, targetPos: { x: midX, y: 1 } });
      if (wx > 0) exits.push({ pos: { x: 0, y: midY }, targetMapId: `map_${wx-1}_${wy}`, targetPos: { x: MAP_WIDTH-2, y: midY } });
      if (wx < WORLD_SIZE - 1) exits.push({ pos: { x: MAP_WIDTH-1, y: midY }, targetMapId: `map_${wx+1}_${wy}`, targetPos: { x: 1, y: midY } });

      worldMaps[mapId] = { id: mapId, name, width: MAP_WIDTH, height: MAP_HEIGHT, tiles, entities, exits, difficulty, biome };
    }
  }

  return worldMaps;
}

export const MAPS: Record<string, GameMap> = createWorld();
