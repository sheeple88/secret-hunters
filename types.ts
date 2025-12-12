
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
};

export type SkillName = 'Strength' | 'Dexterity' | 'Agility' | 'Woodcutting' | 'Mining' | 'Crafting' | 'Fletching' | 'Carving' | 'Alchemy';

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

export type ItemType = 'MATERIAL' | 'CONSUMABLE' | 'EQUIPMENT' | 'JUNK' | 'KEY';
export type EquipmentSlot = 'HEAD' | 'BODY' | 'LEGS' | 'WEAPON' | 'OFFHAND' | 'ACCESSORY';
export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'GODLY';

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
  rarity?: Rarity;
  levelReq?: number;
  value?: number;
}

export interface Secret {
  id: string;
  title: string;
  description: string;
  hint: string; // Static hint, AI will generate better ones
  statBonus: Partial<Stats>;
  unlocked: boolean;
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

export interface Entity {
  id: string;
  name: string;
  type: 'PLAYER' | 'NPC' | 'ENEMY' | 'OBJECT';
  subType?: 'CHEST' | 'BED' | 'WAYPOINT' | 'SIGNPOST' | 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE'; // Specific object behaviors
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
}

export type TileType = 'GRASS' | 'WALL' | 'WATER' | 'FLOOR' | 'TREE' | 'ROCK' | 'SHRINE' | 'PLANK' | 'DOOR' | 'LAVA' | 'VOID' | 'SAND' | 'MUD' | 'FLOWER' | 'WATERFALL' | 'SNOW' | 'ICE' | 'CACTUS' | 'STONE_BRICK' | 'GRAVESTONE' | 'DEEP_WATER' | 'BONES' | 'OBSIDIAN' | 'DIRT_PATH';

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  entities: Entity[];
  exits: { pos: Position; targetMapId: string; targetPos: Position }[];
  difficulty: number; // Multiplier for enemy levels
  biome: string;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'INFO' | 'COMBAT' | 'SECRET' | 'DIALOGUE' | 'SKILL' | 'LOOT' | 'QUEST';
  timestamp: number;
}

export type AnimationType = 'ATTACK' | 'HURT' | 'DODGE' | 'HEAL';

export interface GameState {
  playerPos: Position;
  playerFacing: Direction;
  currentMapId: string;
  stats: Stats; // Base stats
  equipment: Record<EquipmentSlot, Item | null>; // Equipped items
  skills: Record<SkillName, Skill>;
  inventory: Item[];
  secrets: Secret[];
  bestiary: string[]; // List of unlocked enemy names
  counters: Record<string, number>; // Generic counters for tracking actions
  logs: LogEntry[];
  flags: Record<string, boolean>; // Boolean flags for one-off events
  lastAction: string | null;
  isCombat: boolean;
  combatTargetId: string | null;
  activeQuest: Quest | null; // Currently active quest
  // Exploration
  exploration: Record<string, number[][]>; // 0=Hidden, 1=Revealed per map
  knownWaypoints: string[]; // List of mapIds with unlocked waypoints
  knownLocations: string[]; // List of mapIds revealed by signs/lore
  animations: Record<string, AnimationType>; // Transient animations
}
