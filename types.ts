
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Position = {
  x: number;
  y: number;
};

export type Stats = {
  str: number;
  dex: number;
  int: number;
  regeneration: number;
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  gold: number;
};

export type MagicType = 'FIRE' | 'WATER' | 'EARTH' | 'AIR' | 'LIGHTNING' | 'ICE' | 'NATURE' | 'POISON' | 'LIGHT' | 'DARK' | 'ARCANE' | 'VOID' | 'TIME' | 'SPACE' | 'GRAVITY' | 'BLOOD' | 'SOUL' | 'CHAOS' | 'ORDER' | 'METAL';

export type SkillName = 'Strength' | 'Dexterity' | 'Agility' | 'Woodcutting' | 'Mining' | 'Crafting' | 'Fletching' | 'Carving' | 'Alchemy' | 'Fishing';

export interface Skill {
  name: SkillName;
  level: number;
  xp: number;
}

export interface Recipe {
    id: string;
    name: string;
    resultItemId: string;
    yield: number;
    skill: SkillName;
    levelReq: number;
    xpReward: number;
    ingredients: { itemId: string; count: number }[];
    station?: 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE'; // Requirement
}

export type ItemType = 'MATERIAL' | 'CONSUMABLE' | 'EQUIPMENT' | 'JUNK' | 'KEY' | 'COLLECTIBLE';
export type EquipmentSlot = 'HEAD' | 'BODY' | 'LEGS' | 'WEAPON' | 'OFFHAND' | 'ACCESSORY';
export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'GODLY' | 'DIVINE' | 'COSMIC' | 'ETERNAL';
export type WeaponType = 'SWORD' | 'AXE' | 'MACE' | 'DAGGER' | 'SPEAR' | 'BOW' | 'STAFF' | 'ROD';

export interface WeaponStats {
    type: WeaponType;
    minDmg: number;
    maxDmg: number;
    critChance: number; // 0.0 to 1.0
    critMult: number; // e.g. 1.5
    range: number;
    cleave?: boolean; // Hits enemies adjacent to target
    multiHitChance?: number; // Chance to hit twice
    magicType?: MagicType;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  count: number;
  healAmount?: number; // For consumables
  // Equipment specific
  slot?: EquipmentSlot;
  stats?: Partial<Stats>;
  weaponStats?: WeaponStats; // New field for weapons
  rarity?: Rarity;
  levelReq?: number;
  value?: number;
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or short symbol
  statBonus?: Partial<Stats>; // Passive stat increase
  specialEffect?: 'VISION_PLUS' | 'LAVA_RESIST' | 'XP_BOOST' | 'GOLD_BOOST' | 'AUTO_HEAL' | 'SECRET_SENSE' | 'NIGHT_VISION';
}

export interface Secret {
  id: string;
  title: string;
  description: string;
  hint: string; // Static hint, AI will generate better ones
  statBonus: Partial<Stats>;
  unlocked: boolean;
  perkId: string; // The perk unlocked by this secret
  condition: (gameState: GameState) => boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'KILL' | 'COLLECT';
  targetId: string; // Enemy Name or Item ID
  targetCount: number;
  currentCount: number;
  reward: { xp: number; gold?: number; itemId?: string; itemCount?: number };
  completed: boolean;
  giverId: string; // NPC ID who gave it
}

export type AiType = 'MELEE' | 'RANGED' | 'FLEE' | 'STATIC';

export interface Entity {
  id: string;
  name: string;
  type: 'PLAYER' | 'NPC' | 'ENEMY' | 'OBJECT' | 'COLLECTIBLE';
  subType?: 'CHEST' | 'BED' | 'WAYPOINT' | 'SIGNPOST' | 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE' | 'PRESSURE_PLATE' | 'PUSH_BLOCK' | 'CRATE' | 'LOCKED_DOOR' | 'LOCKED_CHEST' | 'DOOR'; 
  symbol: string; // Emoji or char
  color: string;
  pos: Position;
  hp?: number;
  maxHp?: number;
  level?: number; // Enemy level
  dialogue?: string[];
  facing?: Direction; // Visual only
  loot?: string; // Item ID for chests
  destination?: { mapId: string, x: number, y: number, name: string }; // For signposts or teleporters
  questId?: string; // If this NPC gives a quest
  
  // AI Props
  aiType?: AiType;
  aggroRange?: number; // How far they can see player
  attackRange?: number; // How far they can hit (1 for melee)
  magicType?: MagicType;
}

export type TileType = 'GRASS' | 'WALL' | 'WATER' | 'FLOOR' | 'TREE' | 'ROCK' | 'SHRINE' | 'PLANK' | 'DOOR' | 'LAVA' | 'VOID' | 'SAND' | 'MUD' | 'FLOWER' | 'WATERFALL' | 'SNOW' | 'ICE' | 'CACTUS' | 'STONE_BRICK' | 'GRAVESTONE' | 'DEEP_WATER' | 'BONES' | 'OBSIDIAN' | 'DIRT_PATH' | 'STAIRS_UP' | 'STAIRS_DOWN' | 'CRACKED_WALL';

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  entities: Entity[];
  neighbors: { UP?: string; DOWN?: string; LEFT?: string; RIGHT?: string; }; // Neighbors IDs
  exits: { pos: Position; targetMapId: string; targetPos: Position }[]; // Legacy specific exits (teleporters)
  difficulty: number; // Multiplier for enemy levels
  biome: string;
  isTown?: boolean;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'INFO' | 'COMBAT' | 'SECRET' | 'DIALOGUE' | 'SKILL' | 'LOOT' | 'QUEST';
  timestamp: number;
}

export type AnimationType = 'ATTACK' | 'HURT' | 'DODGE' | 'HEAL' | 'SHOOT' | 'INTERACT' | 'FISH_CAST' | 'FISH_CATCH';

export interface GameState {
  playerPos: Position;
  playerFacing: Direction;
  currentMapId: string;
  stats: Stats; // Base stats
  equipment: Record<EquipmentSlot, Item | null>; // Equipped items
  skills: Record<SkillName, Skill>;
  inventory: Item[];
  secrets: Secret[];
  // Perks System
  unlockedPerks: string[]; // List of Perk IDs
  equippedPerks: string[]; // Max 3 IDs
  bestiary: string[]; // List of unlocked enemy names
  counters: Record<string, number>; // Generic counters for tracking actions
  logs: LogEntry[];
  flags: Record<string, boolean>; // Boolean flags for one-off events
  lastAction: string | null;
  isCombat: boolean;
  combatTargetId: string | null;
  activeQuest: Quest | null; // Currently active quest
  // Exploration & World State
  exploration: Record<string, number[][]>; // 0=Hidden, 1=Revealed per map
  worldModified: Record<string, Record<string, TileType>>; // mapId -> "y,x" -> TileType (For persistent trees/rocks cut)
  knownWaypoints: string[]; // List of mapIds with unlocked waypoints
  knownLocations: string[]; // List of mapIds revealed by signs/lore
  animations: Record<string, AnimationType>; // Transient animations
  time: number; // 0 to 2400 (Day/Night cycle)
}
