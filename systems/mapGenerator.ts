
import { GameMap, TileType, Entity, Secret } from '../types';
import { uid } from './mapUtils';
import { generateHavensRest } from './maps/havensRest';

const TOWN_NAMES_PREFIX = ["North", "South", "East", "West", "New", "Old", "Great", "Little", "High", "Low", "Iron", "Gold", "Silver", "Crystal", "Dark", "Light", "Sun", "Moon", "Star", "River"];
const TOWN_NAMES_SUFFIX = ["haven", "shire", "grad", "wood", "field", "port", "ford", "mouth", "watch", "guard", "keep", "hold", "spire", "gate", "bridge", "fall", "peak", "valley", "dale", "stead"];

const MONSTER_PREFIXES = ["Angry", "Rabid", "Ancient", "Dark", "Cursed", "Giant", "Tiny", "Mutant", "Void", "Spectral", "Armored", "Savage", "Elite", "King", "Queen", "Lord", "Omega", "Alpha", "Primal", "Chaos"];
const MONSTER_BASES = ["Slime", "Rat", "Bat", "Wolf", "Bear", "Spider", "Snake", "Scorpion", "Goblin", "Skeleton", "Zombie", "Ghost", "Knight", "Mage", "Golem", "Drake", "Dragon", "Demon", "Beholder", "Lich", "Mimic", "Vampire", "Kraken", "Minotaur", "Specter"];

export const generateMap = (id: string, name: string, biome: string, difficulty: number, isTown: boolean): GameMap => {
    // Standard procedural size for wilderness
    const width = 20;
    const height = 15;
    const tiles: TileType[][] = [];

    // Base terrain generation
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) {
            // Force edges to be clear of obstacles
            const isEdge = x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2;

            if (isTown) {
                 const r = Math.random();
                 if (!isEdge && r > 0.95) row.push('OAK_TREE');
                 else if (!isEdge && r > 0.90) row.push('FLOWER');
                 else if (!isEdge && r > 0.8) row.push('DIRT_PATH');
                 else row.push('GRASS');
            } else {
                const r = Math.random();
                if (biome === 'DESERT') {
                     if (!isEdge && r > 0.98) row.push('CACTUS'); 
                     else if (!isEdge && r > 0.9) row.push('SAND');
                     else row.push('SAND');
                } else if (biome === 'SNOW') {
                     if (!isEdge && r > 0.9) row.push('PINE_TREE'); 
                     else if (!isEdge && r > 0.98) row.push('ICE'); 
                     else row.push('SNOW');
                } else { // FOREST/GRASS
                     if (!isEdge && r > 0.85) row.push(Math.random() > 0.5 ? 'OAK_TREE' : 'BIRCH_TREE'); 
                     else if (!isEdge && r > 0.95) row.push('ROCK');
                     else if (!isEdge && r > 0.80) row.push('FLOWER');
                     else row.push('GRASS');
                }
            }
        }
        tiles.push(row);
    }
    
    // Clear Paths for Town (Internal town structure) - simplified for non-starter towns
    if (isTown) {
        for(let i=1; i<19; i++) tiles[7][i] = 'DIRT_PATH';
        for(let i=1; i<14; i++) tiles[i][10] = 'DIRT_PATH';
        tiles[7][10] = 'SHRINE';
    } else {
        tiles[7][10] = biome === 'DESERT' ? 'SAND' : biome === 'SNOW' ? 'SNOW' : 'GRASS';
    }
    
    const entities: Entity[] = [];
    
    // Random Town Entites
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
    const maxEnemies = isTown ? 0 : Math.min(8, 2 + Math.floor(difficulty / 2));
    
    if (!isTown) {
        for(let i=0; i < maxEnemies; i++) {
            let rx = Math.floor(Math.random() * (width - 4)) + 2; // Avoid exact edges
            let ry = Math.floor(Math.random() * (height - 4)) + 2;
            if (['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK'].includes(tiles[ry][rx] as any) || (Math.abs(rx-10) < 2 && Math.abs(ry-7) < 2)) continue;
            
            // Calculate Level based on location stats
            // Difficulty is roughly Manhattan distance from start (0 to 20)
            // Biomes add multipliers
            let levelMod = 1.0;
            if (biome === 'SNOW') levelMod = 1.2; // Harder
            if (biome === 'DESERT') levelMod = 1.5; // Even Harder (End game zone)
            
            // Random variation +/- 2 levels
            let level = Math.max(1, Math.floor((difficulty * levelMod) + (Math.random() * 4 - 2)));
            
            // Select Monster Base based on Level
            let availableBases = MONSTER_BASES;
            if (level < 5) availableBases = ["Slime", "Rat", "Bat", "Wolf", "Spider"];
            else if (level < 10) availableBases = ["Wolf", "Bear", "Goblin", "Skeleton", "Snake"];
            else if (level < 15) availableBases = ["Bear", "Skeleton", "Zombie", "Ghost", "Knight", "Scorpion"];
            else availableBases = ["Knight", "Mage", "Golem", "Drake", "Dragon", "Demon", "Lich", "Vampire"];
            
            const base = availableBases[Math.floor(Math.random() * availableBases.length)];
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

            // Stat Scaling
            // HP: Base 20 + Level * 8. Elite/King doubles it.
            let hp = Math.floor((20 + level * 8) * (['Elite', 'King', 'Alpha', 'Omega'].includes(prefix) ? 2 : 1));
            
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

        // Generate Mob Spawners (5% Chance + Difficulty bonus)
        // More likely in Snow/Desert
        if (Math.random() < 0.05 + (difficulty * 0.005)) {
             let rx = Math.floor(Math.random() * (width - 4)) + 2;
             let ry = Math.floor(Math.random() * (height - 4)) + 2;
             if (!['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'LAVA'].includes(tiles[ry][rx])) {
                 const spawnerLevel = Math.max(1, difficulty);
                 const hp = 50 + (spawnerLevel * 10);
                 const type = biome === 'SNOW' ? 'Ice Golem' : biome === 'DESERT' ? 'Scorpion' : 'Spider';
                 
                 entities.push({
                     id: `spawner_${id}_${uid()}`,
                     name: `${type} Cage`,
                     type: 'OBJECT',
                     subType: 'MOB_SPAWNER',
                     symbol: '#',
                     color: 'darkred',
                     pos: {x: rx, y: ry},
                     hp,
                     maxHp: hp,
                     level: spawnerLevel,
                     spawnType: type,
                     lastSpawnTime: 0
                 });
             }
        }
    }

    if (Math.random() > 0.6 && !isTown) {
        let rx = Math.floor(Math.random() * (width - 2)) + 1;
        let ry = Math.floor(Math.random() * (height - 2)) + 1;
        if (!['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'CACTUS', 'WATER', 'LAVA'].includes(tiles[ry][rx])) {
            entities.push({ id: `crate_${id}_${uid()}`, name: 'Old Crate', type: 'OBJECT', subType: 'CRATE', symbol: '#', color: 'brown', pos: {x: rx, y: ry} });
        }
    }

    return { id, name, width, height, tiles, entities, neighbors: {}, exits: [], difficulty, biome, isTown };
};

export const createWorld = (secrets: Secret[]): Record<string, GameMap> => {
    const maps: Record<string, GameMap> = {};
    
    // Generate Town (Center)
    // Map ID for town is usually fixed 'map_10_10'
    generateHavensRest(maps);

    // Generate Wilderness
    const WORLD_WIDTH = 20;
    const WORLD_HEIGHT = 20;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const id = `map_${x}_${y}`;
            if (maps[id]) continue; // Skip existing (Town)

            // Determine Biome based on coordinates (simple gradient)
            let biome = 'GRASS';
            if (y < 5) biome = 'SNOW';
            else if (y > 15) biome = 'DESERT';
            
            // Difficulty increases from center (10, 10)
            const dist = Math.abs(x - 10) + Math.abs(y - 10);
            const difficulty = Math.floor(dist / 2);

            // Name generation
            const prefix = TOWN_NAMES_PREFIX[Math.floor(Math.random() * TOWN_NAMES_PREFIX.length)];
            const suffix = TOWN_NAMES_SUFFIX[Math.floor(Math.random() * TOWN_NAMES_SUFFIX.length)];
            const name = biome === 'GRASS' ? `${prefix}${suffix}` : biome === 'SNOW' ? `Frozen ${suffix}` : `Burning ${suffix}`;

            maps[id] = generateMap(id, name, biome, difficulty, false);
        }
    }

    // Link Neighbors
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const id = `map_${x}_${y}`;
            const map = maps[id];
            if (!map) continue;

            if (y > 0) map.neighbors.UP = `map_${x}_${y - 1}`;
            if (y < WORLD_HEIGHT - 1) map.neighbors.DOWN = `map_${x}_${y + 1}`;
            if (x > 0) map.neighbors.LEFT = `map_${x - 1}_${y}`;
            if (x < WORLD_WIDTH - 1) map.neighbors.RIGHT = `map_${x + 1}_${y}`;
        }
    }

    return maps;
};
