
import { GameMap, TileType, Entity, Secret } from '../types';
import { uid } from './mapUtils';
import { generateHavensRest } from './maps/havensRest';
import { SCALE_FACTOR, MONSTER_TEMPLATES } from '../constants';

const TOWN_NAMES_PREFIX = ["North", "South", "East", "West", "New", "Old", "Great", "Little", "High", "Low", "Iron", "Gold", "Silver", "Crystal", "Dark", "Light", "Sun", "Moon", "Star", "River"];
const TOWN_NAMES_SUFFIX = ["haven", "shire", "grad", "wood", "field", "port", "ford", "mouth", "watch", "guard", "keep", "hold", "spire", "gate", "bridge", "fall", "peak", "valley", "dale", "stead"];

const MONSTER_PREFIXES = ["Angry", "Rabid", "Ancient", "Dark", "Cursed", "Giant", "Tiny", "Mutant", "Void", "Spectral", "Armored", "Savage", "Elite", "King", "Queen", "Lord", "Omega", "Alpha", "Primal", "Chaos"];
const MONSTER_BASES = ["Slime", "Rat", "Bat", "Wolf", "Bear", "Spider", "Snake", "Scorpion", "Goblin", "Skeleton", "Zombie", "Ghost", "Knight", "Mage", "Golem", "Drake", "Dragon", "Demon", "Beholder", "Lich", "Mimic", "Vampire", "Kraken", "Minotaur", "Specter"];

export const createWorld = (secrets: Secret[]): Record<string, GameMap> => {
    const maps: Record<string, GameMap> = {};
    
    // Generate Haven's Rest (Town)
    generateHavensRest(maps);
    
    // Generate World Grid 20x20
    for(let y=0; y<20; y++) {
        for(let x=0; x<20; x++) {
            const id = `map_${x}_${y}`;
            if (maps[id]) continue;
            
            let biome = 'GRASS';
            let difficulty = Math.floor(Math.sqrt(Math.pow(x-10, 2) + Math.pow(y-10, 2)));
            let name = 'Wilderness';

            if (y < 5) {
                biome = 'SNOW';
                difficulty += 10;
                name = 'Frostlands';
            } else if (y > 15) {
                biome = 'DESERT';
                difficulty += 10;
                name = 'Burning Sands';
            } else {
                 if (difficulty > 6) name = 'Deep Forest';
                 else name = 'Plains';
            }

            maps[id] = generateMap(id, `${name}`, biome, difficulty, false);
        }
    }

    // Connect Maps
    for(let y=0; y<20; y++) {
        for(let x=0; x<20; x++) {
            const id = `map_${x}_${y}`;
            const map = maps[id];
            if (!map || map.biome === 'INTERIOR' || map.biome === 'DUNGEON') continue;

            if (y > 0) map.neighbors.UP = `map_${x}_${y-1}`;
            if (y < 19) map.neighbors.DOWN = `map_${x}_${y+1}`;
            if (x > 0) map.neighbors.LEFT = `map_${x-1}_${y}`;
            if (x < 19) map.neighbors.RIGHT = `map_${x+1}_${y}`;
        }
    }

    return maps;
};

export const generateDungeon = (
    id: string, 
    zoneDifficulty: number, 
    type: 'CRYPT' | 'CAVE' | 'MAGMA', 
    parentId: string, 
    entryPos: {x:number, y:number}, 
    playerLevel: number,
    worldTier: number = 0 // New Parameter
): GameMap => {
    const width = 25;
    const height = 25;
    const tiles: TileType[][] = [];
    const entities: Entity[] = [];

    // Scale Difficulty: Ensure dungeon is always relevant to player level, but at least as hard as the zone * 1.5
    // Add World Tier scaling (Tier 1 = +5 levels effectively in terms of base challenge)
    const tierBonus = worldTier * 5;
    const dungeonDifficulty = Math.max(Math.floor(zoneDifficulty * 1.5), playerLevel + 1) + tierBonus;

    // Stat Multiplier based on Tier (Simple linear scalar on top of exponential level scaling)
    const tierMult = 1 + (worldTier * 0.5); // Tier 1 = 1.5x stats, Tier 2 = 2.0x stats

    // Base Tile Setup
    const wallTile = type === 'CRYPT' ? 'STONE_BRICK' : type === 'MAGMA' ? 'OBSIDIAN' : 'WALL';
    const floorTile = type === 'CRYPT' ? 'FLOOR' : type === 'MAGMA' ? 'LAVA' : 'MUD';
    
    // Fill with walls
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) row.push(wallTile);
        tiles.push(row);
    }

    // Drunkard's Walk / Digger for corridors
    let digX = 12;
    let digY = 12;
    tiles[digY][digX] = 'STAIRS_UP'; // Start
    
    // Add return exit
    entities.push({
        id: `exit_dungeon_${uid()}`,
        name: 'Exit to Surface',
        type: 'OBJECT',
        subType: 'DOOR',
        symbol: '<',
        color: 'white',
        pos: {x: digX, y: digY},
        destination: { mapId: parentId, x: entryPos.x, y: entryPos.y, name: 'Surface' }
    });

    let floorCount = 1;
    let steps = 0;
    const targetFloors = 200;

    while (floorCount < targetFloors && steps < 1000) {
        const dir = Math.floor(Math.random() * 4);
        if (dir === 0) digY--;
        else if (dir === 1) digY++;
        else if (dir === 2) digX--;
        else digX++;

        // Clamp
        digX = Math.max(1, Math.min(width-2, digX));
        digY = Math.max(1, Math.min(height-2, digY));

        if (tiles[digY][digX] === wallTile) {
            // If magma dungeon, some floors are islands in lava, but we need walkable paths
            // For simplicity, just regular floors for now, lava borders
            tiles[digY][digX] = (type === 'MAGMA' && Math.random() > 0.9) ? 'LAVA' : 'FLOOR';
            if (tiles[digY][digX] === 'FLOOR') floorCount++;
        }
        steps++;
    }

    // Decorate & Populate
    for(let y=1; y<height-1; y++) {
        for(let x=1; x<width-1; x++) {
            if (tiles[y][x] === 'FLOOR') {
                 // Enemies
                 if (Math.random() < 0.08) {
                    const level = dungeonDifficulty + Math.floor(Math.random() * 5);
                    let base = "Skeleton";
                    if (type === 'CRYPT') base = Math.random() > 0.5 ? 'Skeleton' : 'Ghost';
                    if (type === 'CAVE') base = Math.random() > 0.5 ? 'Bat' : 'Spider';
                    if (type === 'MAGMA') base = Math.random() > 0.5 ? 'Fire Elemental' : 'Imp'; // Imp maps to goblin/small monster
                    
                    if (level > 20) base = type === 'CRYPT' ? 'Lich' : type === 'MAGMA' ? 'Dragon' : 'Beholder';

                    // Exponential HP Scaling via Templates + Tier Multiplier
                    const template = MONSTER_TEMPLATES[base] || MONSTER_TEMPLATES['Slime'];
                    const hp = Math.floor(template.baseHp * Math.pow(SCALE_FACTOR, level) * tierMult);
                    
                    entities.push({
                        id: `dungeon_mob_${uid()}`,
                        name: `Dungeon ${base}`,
                        type: 'ENEMY',
                        symbol: base[0],
                        color: 'red',
                        pos: {x, y},
                        hp, maxHp: hp, level,
                        aiType: 'MELEE',
                        aggroRange: 6
                    });
                 }
                 // Decor
                 if (type === 'CRYPT' && Math.random() < 0.05) tiles[y][x] = 'BONES';
            }
        }
    }

    // BOSS ROOM GENERATION
    let bx = digX, by = digY; // End of dig is the boss room
    // Clear area around boss
    for(let dy=-1; dy<=1; dy++) {
        for(let dx=-1; dx<=1; dx++) {
            if (tiles[by+dy]?.[bx+dx]) tiles[by+dy][bx+dx] = 'FLOOR';
        }
    }

    // Generate Boss Entity
    const bossLevel = dungeonDifficulty + 5;
    let bossName = "Dungeon Boss";
    if (type === 'CRYPT') bossName = "Crypt Lord";
    if (type === 'CAVE') bossName = "Brood Mother";
    if (type === 'MAGMA') bossName = "Molten King";
    
    // Tier Prefix
    if (worldTier > 0) bossName = `Awakened ${bossName}`;
    if (worldTier > 1) bossName = `Ascended ${bossName}`;

    // Use Template for Boss stats too
    const bossTemplate = MONSTER_TEMPLATES[bossName.replace(/Awakened |Ascended /g, '')] || MONSTER_TEMPLATES['Dragon']; // Strip prefix for lookup
    const bossHp = Math.floor(bossTemplate.baseHp * Math.pow(SCALE_FACTOR, bossLevel) * tierMult * 1.5); // Extra 1.5x boss HP boost

    entities.push({
        id: `dungeon_boss_${uid()}`,
        name: bossName,
        type: 'ENEMY',
        subType: 'BOSS',
        symbol: 'B',
        color: 'purple',
        pos: {x: bx, y: by},
        hp: bossHp, 
        maxHp: bossHp, 
        level: bossLevel,
        aiType: 'MELEE',
        aggroRange: 8,
        attackRange: 1
    });

    // Boss Chest (Locked)
    // Placed slightly behind boss
    const chestX = bx + (Math.random() > 0.5 ? 1 : -1);
    const chestY = by + (Math.random() > 0.5 ? 1 : -1);
    
    if (tiles[chestY]?.[chestX] === 'FLOOR') {
        entities.push({
            id: `boss_chest_${uid()}`,
            name: 'Ancient Chest',
            type: 'OBJECT',
            subType: 'BOSS_CHEST', 
            symbol: 'C',
            color: 'gold',
            pos: {x: chestX, y: chestY},
            loot: 'mob_spawner_item', // Placeholder
            keyId: 'boss_key' // Requires specific key dropped by boss
        });
    }

    return { 
        id, 
        name: `${type === 'CRYPT' ? 'Dark Crypt' : type === 'CAVE' ? 'Deep Cavern' : 'Magma Core'} ${worldTier > 0 ? '(Hard)' : ''}`,
        width, height, tiles, entities, neighbors: {}, exits: [], difficulty: dungeonDifficulty, biome: 'DUNGEON' 
    };
};

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
                     else if (!isEdge && r > 0.90) row.push('WATER'); // Add water pools
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

    // Generate Fishing Spots in Water
    if (!isTown) {
        for(let y=0; y<height; y++) {
            for(let x=0; x<width; x++) {
                if (tiles[y][x] === 'WATER' || tiles[y][x] === 'DEEP_WATER') {
                    if (Math.random() < 0.15) { // 15% chance per water tile
                        entities.push({
                            id: `fish_spot_${id}_${uid()}`,
                            name: 'Fishing Spot',
                            type: 'OBJECT',
                            subType: 'FISHING_SPOT',
                            symbol: '~',
                            color: 'blue',
                            pos: {x, y}
                        });
                    }
                }
            }
        }
    }

    // Procedural Enemy Generation
    const maxEnemies = isTown ? 0 : Math.min(8, 2 + Math.floor(difficulty / 2));
    
    if (!isTown) {
        for(let i=0; i < maxEnemies; i++) {
            let rx = Math.floor(Math.random() * (width - 4)) + 2; // Avoid exact edges
            let ry = Math.floor(Math.random() * (height - 4)) + 2;
            if (['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'DEEP_WATER'].includes(tiles[ry][rx] as any) || (Math.abs(rx-10) < 2 && Math.abs(ry-7) < 2)) continue;
            
            // Calculate Level based on location stats
            let levelMod = 1.0;
            if (biome === 'SNOW') levelMod = 1.2; 
            if (biome === 'DESERT') levelMod = 1.5; 
            
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

            // Stat Scaling: Exponential HP using Templates
            const template = MONSTER_TEMPLATES[base] || MONSTER_TEMPLATES['Slime'];
            const eliteMod = ['Elite', 'King', 'Alpha', 'Omega'].includes(prefix) ? 2 : 1;
            
            // BaseHP * Multiplier ^ Level
            let hp = Math.floor((template.baseHp * Math.pow(SCALE_FACTOR, level)) * eliteMod);
            
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

        // Generate Dungeon Entrance (25% Chance)
        if (Math.random() < 0.25) {
             let rx = Math.floor(Math.random() * (width - 4)) + 2;
             let ry = Math.floor(Math.random() * (height - 4)) + 2;
             if (!['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'LAVA'].includes(tiles[ry][rx])) {
                 // Determine Type
                 let type: TileType = 'ENTRANCE_CAVE';
                 let nameType = 'Cavern';
                 
                 if (biome === 'SNOW' || (biome === 'GRASS' && Math.random() > 0.5)) {
                     type = 'ENTRANCE_CRYPT';
                     nameType = 'Crypt';
                 }
                 if (biome === 'DESERT' || difficulty > 15) {
                     type = 'ENTRANCE_MAGMA';
                     nameType = 'Magma Core';
                 }

                 tiles[ry][rx] = type;
                 
                 // Signpost for difficulty warning
                 // Check adjacent tile for sign
                 if (rx + 1 < width - 1 && !['WALL', 'ROCK'].includes(tiles[ry][rx+1])) {
                     const recLevel = Math.max(5, difficulty * 2);
                     entities.push({
                         id: `sign_dungeon_${uid()}`,
                         name: 'Warning Sign',
                         type: 'OBJECT',
                         subType: 'SIGNPOST',
                         symbol: 'S',
                         color: 'red',
                         pos: {x: rx + 1, y: ry},
                         destination: { mapId: '', x: 0, y: 0, name: `DANGER: ${nameType} (Lv.${recLevel}+)`}
                     });
                 }
             }
        }

        // Generate Mob Spawners (5% Chance + Difficulty bonus)
        // More likely in Snow/Desert
        if (Math.random() < 0.05 + (difficulty * 0.005)) {
             let rx = Math.floor(Math.random() * (width - 4)) + 2;
             let ry = Math.floor(Math.random() * (height - 4)) + 2;
             if (!['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'LAVA'].includes(tiles[ry][rx])) {
                 const spawnerLevel = Math.max(1, difficulty);
                 // Spawners are tanky: 50 base * scale
                 const hp = Math.floor(50 * Math.pow(SCALE_FACTOR, spawnerLevel));
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
