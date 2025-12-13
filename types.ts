
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
  unspentStatPoints: number;
};

export type MagicType = 'FIRE' | 'WATER' | 'EARTH' | 'AIR' | 'LIGHTNING' | 'ICE' | 'NATURE' | 'POISON' | 'LIGHT' | 'DARK' | 'ARCANE' | 'VOID' | 'TIME' | 'SPACE' | 'GRAVITY' | 'BLOOD' | 'SOUL' | 'CHAOS' | 'ORDER' | 'METAL';

export type SkillName = 'Strength' | 'Dexterity' | 'Agility' | 'Logging' | 'Mining' | 'Crafting' | 'Fletching' | 'Carving' | 'Alchemy' | 'Fishing' | 'Cooking';

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
    station?: 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE' | 'CAMPFIRE';
}

export type ItemType = 'MATERIAL' | 'CONSUMABLE' | 'EQUIPMENT' | 'JUNK' | 'KEY' | 'COLLECTIBLE' | 'GADGET' | 'BLUEPRINT';
export type EquipmentSlot = 'HEAD' | 'BODY' | 'LEGS' | 'WEAPON' | 'OFFHAND' | 'ACCESSORY';
export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'GODLY' | 'DIVINE' | 'COSMIC' | 'ETERNAL';
export type WeaponType = 'SWORD' | 'AXE' | 'MACE' | 'DAGGER' | 'SPEAR' | 'BOW' | 'STAFF' | 'ROD';

export interface WeaponStats {
    type: WeaponType;
    minDmg: number;
    maxDmg: number;
    critChance: number;
    critMult: number;
    range: number;
    cleave?: boolean;
    multiHitChance?: number;
    magicType?: MagicType;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  count: number;
  healAmount?: number;
  slot?: EquipmentSlot;
  stats?: Partial<Stats>;
  weaponStats?: WeaponStats;
  rarity?: Rarity;
  levelReq?: number;
  value?: number;
  recipeId?: string;
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  icon: string;
  statBonus?: Partial<Stats>;
  specialEffect?: 'VISION_PLUS' | 'LAVA_RESIST' | 'XP_BOOST' | 'GOLD_BOOST' | 'AUTO_HEAL' | 'SECRET_SENSE' | 'NIGHT_VISION';
}

// --- NEW DATA STRUCTURES ---

export interface Achievement {
  id: string;
  title: string;
  description: string; // Explicit instruction (e.g., "Kill 100 Skeletons")
  reward: { gold?: number; xp?: number; itemId?: string };
  condition: (gameState: GameState) => boolean;
  progress?: (gameState: GameState) => number; // 0.0 to 1.0 for progress bar
}

export interface Secret {
  id: string;
  type: 'COMBAT' | 'WORLD' | 'INTERACTION';
  title: string;
  hint: string; // Cryptic clue (e.g., "The dead fear the light")
  description: string; // Revealed ONLY after unlock
  statBonus?: Partial<Stats>;
  perkId?: string;
  condition: (gameState: GameState) => boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'KILL' | 'COLLECT';
  targetId: string;
  targetCount: number;
  currentCount: number;
  reward: { xp: number; gold?: number; itemId?: string; itemCount?: number };
  completed: boolean;
  giverId: string;
  dialogueStart: string[];
  dialogueEnd: string[];
}

export type AiType = 'MELEE' | 'RANGED' | 'FLEE' | 'STATIC';

export interface Entity {
  id: string;
  name: string;
  type: 'PLAYER' | 'NPC' | 'ENEMY' | 'OBJECT' | 'COLLECTIBLE' | 'ITEM_DROP';
  subType?: 'CHEST' | 'BED' | 'WAYPOINT' | 'SIGNPOST' | 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE' | 'CAMPFIRE' | 'PRESSURE_PLATE' | 'PUSH_BLOCK' | 'CRATE' | 'LOCKED_DOOR' | 'LOCKED_CHEST' | 'DOOR' | 'MOB_SPAWNER' | 'BOSS' | 'BOSS_CHEST' | 'OPEN_CHEST' | 'FISHING_SPOT'; 
  symbol: string;
  color: string;
  pos: Position;
  hp?: number;
  maxHp?: number;
  level?: number;
  dialogue?: string[];
  facing?: Direction;
  loot?: string;
  destination?: { mapId: string, x: number, y: number, name: string };
  questId?: string;
  keyId?: string;
  aiType?: AiType;
  aggroRange?: number;
  attackRange?: number;
  magicType?: MagicType;
  isSpawned?: boolean;
  lastSpawnTime?: number;
  lastSpawnStep?: number;
  spawnType?: string;
}

export type TileType = 'GRASS' | 'WALL' | 'WATER' | 'FLOOR' | 'TREE' | 'OAK_TREE' | 'BIRCH_TREE' | 'PINE_TREE' | 'STUMP' | 'ROCK' | 'SHRINE' | 'PLANK' | 'DOOR' | 'LAVA' | 'VOID' | 'SAND' | 'MUD' | 'FLOWER' | 'WATERFALL' | 'SNOW' | 'ICE' | 'CACTUS' | 'STONE_BRICK' | 'GRAVESTONE' | 'DEEP_WATER' | 'BONES' | 'OBSIDIAN' | 'DIRT_PATH' | 'STAIRS_UP' | 'STAIRS_DOWN' | 'CRACKED_WALL' | 'ROOF' | 'ENTRANCE_CRYPT' | 'ENTRANCE_CAVE' | 'ENTRANCE_MAGMA';

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  entities: Entity[];
  neighbors: { UP?: string; DOWN?: string; LEFT?: string; RIGHT?: string; };
  exits: { pos: Position; targetMapId: string; targetPos: Position }[];
  difficulty: number;
  biome: string;
  isTown?: boolean;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'INFO' | 'COMBAT' | 'SECRET' | 'DIALOGUE' | 'SKILL' | 'LOOT' | 'QUEST' | 'DEBUG' | 'TRADE' | 'ACHIEVEMENT';
  timestamp: number;
}

export type AnimationType = 'ATTACK' | 'HURT' | 'DODGE' | 'HEAL' | 'SHOOT' | 'INTERACT' | 'FISH_CAST' | 'FISH_CATCH';

export interface GameState {
  playerPos: Position;
  playerFacing: Direction;
  currentMapId: string;
  stats: Stats;
  equipment: Record<EquipmentSlot, Item | null>;
  skills: Record<SkillName, Skill>;
  inventory: Item[];
  knownRecipes: string[];
  
  // Refactored Progress Tracking
  unlockedSecretIds: string[]; // List of IDs
  unlockedAchievementIds: string[]; // List of IDs
  completedQuestIds: string[]; // List of IDs
  
  unlockedPerks: string[];
  equippedPerks: string[];
  bestiary: string[];
  counters: Record<string, number>;
  logs: LogEntry[];
  flags: Record<string, boolean>;
  lastAction: string | null;
  isCombat: boolean;
  combatTargetId: string | null;
  activeQuest: Quest | null;
  exploration: Record<string, number[][]>;
  worldModified: Record<string, Record<string, TileType>>;
  knownWaypoints: string[];
  knownLocations: string[];
  animations: Record<string, AnimationType>;
  time: number;
  autoDistributeStats: boolean;
  statAllocation: {
      str: number;
      dex: number;
      int: number;
      hp: number;
      regeneration: number;
  };
  worldTier: number;
}
