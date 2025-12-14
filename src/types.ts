
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
  xp: number; // General Level XP
  level: number;
  gold: number;
  unspentStatPoints: number;
};

export type MagicType = 'FIRE' | 'WATER' | 'EARTH' | 'AIR' | 'LIGHTNING' | 'ICE' | 'NATURE' | 'POISON' | 'LIGHT' | 'DARK' | 'ARCANE' | 'VOID' | 'TIME' | 'SPACE' | 'GRAVITY' | 'BLOOD' | 'SOUL' | 'CHAOS' | 'ORDER' | 'METAL';

export type SkillName = 'Attack' | 'Strength' | 'Defence' | 'Constitution' | 'Dexterity' | 'Agility' | 'Logging' | 'Mining' | 'Smithing' | 'Herblore' | 'Crafting' | 'Fletching' | 'Carving' | 'Alchemy' | 'Fishing' | 'Cooking';

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
    station?: 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE' | 'CAMPFIRE' | 'FURNACE';
}

export type ItemType = 'MATERIAL' | 'CONSUMABLE' | 'EQUIPMENT' | 'JUNK' | 'KEY' | 'COLLECTIBLE' | 'GADGET' | 'BLUEPRINT';
export type EquipmentSlot = 'HEAD' | 'BODY' | 'LEGS' | 'WEAPON' | 'OFFHAND' | 'ACCESSORY';
export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'GODLY' | 'DIVINE' | 'COSMIC' | 'ETERNAL';
export type WeaponType = 'SWORD' | 'AXE' | 'MACE' | 'DAGGER' | 'SPEAR' | 'BOW' | 'STAFF' | 'ROD';
export type DamageType = 'SLASH' | 'STAB' | 'CRUSH' | 'MAGIC' | 'RANGED';

export interface WeaponStats {
    type: WeaponType;
    damageType: DamageType;
    power: number;
    accuracy: number;
    critChance: number;
    critMult: number;
    range: number;
    cleave?: boolean;
    multiHitChance?: number;
    magicType?: MagicType;
    attackSpeed?: number;
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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  reward: { gold?: number; xp?: number; itemId?: string };
  condition: (gameState: GameState) => boolean;
  progress?: (gameState: GameState) => number;
}

export interface Secret {
  id: string;
  type: 'COMBAT' | 'WORLD' | 'INTERACTION' | 'ARTISAN' | 'SILLY';
  title: string;
  hint: string;
  description: string;
  statBonus?: Partial<Stats>;
  perkId?: string;
  cosmeticUnlock?: string; // New: Reward ID for visuals
  titleReward?: string;    // New: Reward Title
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

export type AiType = 'MELEE' | 'RANGED' | 'FLEE' | 'STATIC' | 'PASSIVE';

export interface Entity {
  id: string;
  name: string;
  type: 'PLAYER' | 'NPC' | 'ENEMY' | 'OBJECT' | 'COLLECTIBLE' | 'ITEM_DROP';
  subType?: 'CHEST' | 'BED' | 'WAYPOINT' | 'SIGNPOST' | 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE' | 'CAMPFIRE' | 'PRESSURE_PLATE' | 'PUSH_BLOCK' | 'CRATE' | 'LOCKED_DOOR' | 'LOCKED_CHEST' | 'DOOR' | 'MOB_SPAWNER' | 'BOSS' | 'BOSS_CHEST' | 'OPEN_CHEST' | 'FISHING_SPOT' | 'FOUNTAIN' | 'LAMP' | 'PLANT'; 
  symbol: string;
  color: string;
  pos: Position;
  hp?: number;
  maxHp?: number;
  defence?: number; 
  weakness?: DamageType; 
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
  schedule?: { dayPos: Position, nightPos: Position }; 
}

export type TileType = 'GRASS' | 'WALL' | 'WATER' | 'FLOOR' | 'TREE' | 'OAK_TREE' | 'BIRCH_TREE' | 'PINE_TREE' | 'STUMP' | 'ROCK' | 'SHRINE' | 'PLANK' | 'DOOR' | 'LAVA' | 'VOID' | 'SAND' | 'MUD' | 'FLOWER' | 'WATERFALL' | 'SNOW' | 'ICE' | 'CACTUS' | 'STONE_BRICK' | 'GRAVESTONE' | 'DEEP_WATER' | 'BONES' | 'OBSIDIAN' | 'DIRT_PATH' | 'STAIRS_UP' | 'STAIRS_DOWN' | 'CRACKED_WALL' | 'ROOF' | 'ENTRANCE_CRYPT' | 'ENTRANCE_CAVE' | 'ENTRANCE_MAGMA' | 'WOOD_TABLE';

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][] | string[][];
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
  
  unlockedSecretIds: string[];
  unlockedAchievementIds: string[];
  completedQuestIds: string[];
  
  unlockedPerks: string[];
  equippedPerks: string[];
  
  // NEW: Cosmetics & Titles
  unlockedCosmetics: string[];
  equippedCosmetic: string | null;
  activeTitle: string | null;

  bestiary: string[];
  counters: Record<string, number>;
  logs: LogEntry[];
  flags: Record<string, boolean>;
  lastAction: string | null;
  
  isCombat: boolean;
  lastCombatTime: number; 
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
