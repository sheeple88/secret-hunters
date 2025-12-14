
import { GameMap, TileType, Entity } from '../types';
import { uid, ENEMIES, SCALE_FACTOR } from '../data/Registry';

export const generateWorld = (): Record<string, GameMap> => {
    const maps: Record<string, GameMap> = {};
    
    // 1. Generate Town (Haven's Rest)
    maps['map_10_10'] = generateTown('map_10_10');
    
    // 2. Generate Wilderness (Simple 5x5 grid around town for this demo)
    for(let y=8; y<=12; y++) {
        for(let x=8; x<=12; x++) {
            const id = `map_${x}_${y}`;
            if (maps[id]) continue;
            
            const difficulty = Math.abs(x-10) + Math.abs(y-10);
            const biome = y < 8 ? 'SNOW' : y > 12 ? 'DESERT' : 'GRASS';
            maps[id] = generateWilderness(id, biome, difficulty);
        }
    }
    
    // 3. Link Neighbors
    Object.keys(maps).forEach(id => {
        if(maps[id].biome === 'INTERIOR' || maps[id].biome === 'DUNGEON') return;
        const [_, x, y] = id.split('_').map(Number);
        const map = maps[id];
        
        const nId = `map_${x}_${y-1}`; if(maps[nId]) map.neighbors.UP = nId;
        const sId = `map_${x}_${y+1}`; if(maps[sId]) map.neighbors.DOWN = sId;
        const wId = `map_${x-1}_${y}`; if(maps[wId]) map.neighbors.LEFT = wId;
        const eId = `map_${x+1}_${y}`; if(maps[eId]) map.neighbors.RIGHT = eId;
    });

    return maps;
};

const generateTown = (id: string): GameMap => {
    const width = 60; const height = 50;
    const tiles: TileType[][] = Array(height).fill(null).map(() => Array(width).fill('GRASS'));
    const entities: Entity[] = [];

    // Simple Town Layout
    // Roads
    for(let y=0; y<height; y++) tiles[y][30] = 'DIRT_PATH'; // Vertical
    for(let x=0; x<width; x++) tiles[25][x] = 'DIRT_PATH'; // Horizontal
    
    // Plaza
    for(let y=20; y<30; y++) for(let x=25; x<35; x++) tiles[y][x] = 'STONE_BRICK';
    
    entities.push({ id: `wp_${id}`, name: 'Town Waypoint', type: 'OBJECT', subType: 'WAYPOINT', symbol: 'O', color: 'cyan', pos: {x: 30, y: 25} });
    
    // Buildings Helper
    const buildHouse = (bx: number, by: number, w: number, h: number, name: string) => {
        for(let y=by; y<by+h; y++) for(let x=bx; x<bx+w; x++) tiles[y][x] = 'ROOF';
        for(let x=bx; x<bx+w; x++) tiles[by+h-1][x] = 'WALL';
        tiles[by+h-1][bx+Math.floor(w/2)] = 'DOOR';
        
        entities.push({
            id: `door_${uid()}`, name, type: 'OBJECT', subType: 'DOOR', pos: {x: bx+Math.floor(w/2), y: by+h-1}, symbol: '.', color: 'white',
            destination: { mapId: 'interior_home', x: 6, y: 8, name } // Placeholder link
        });
    };

    buildHouse(10, 10, 8, 6, "Hero's Home");
    buildHouse(40, 10, 10, 8, "Blacksmith");
    
    // NPCs
    entities.push({ id: 'mayor', name: 'Mayor', type: 'NPC', symbol: 'M', color: 'blue', pos: {x: 32, y: 22}, dialogue: ["Welcome!"] });
    
    return { id, name: "Haven's Rest", width, height, tiles, entities, neighbors: {}, difficulty: 0, biome: 'GRASS', isTown: true };
};

const generateWilderness = (id: string, biome: string, difficulty: number): GameMap => {
    const width = 30; const height = 20;
    const tiles: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(biome === 'DESERT' ? 'SAND' : biome === 'SNOW' ? 'SNOW' : 'GRASS'));
    const entities: Entity[] = [];

    // Trees/Rocks
    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            if (x===0 || x===width-1 || y===0 || y===height-1) continue; // Leave edges clear
            if (Math.random() < 0.1) tiles[y][x] = 'TREE';
            if (Math.random() < 0.05) tiles[y][x] = 'ROCK';
        }
    }

    // Enemies
    const enemyCount = 3 + difficulty;
    for(let i=0; i<enemyCount; i++) {
        const x = Math.floor(Math.random() * (width-2)) + 1;
        const y = Math.floor(Math.random() * (height-2)) + 1;
        if (!['TREE', 'ROCK'].includes(tiles[y][x])) {
            const type = difficulty > 5 ? 'Bear' : 'Slime';
            const tmpl = ENEMIES[type] || ENEMIES['Slime'];
            const hp = Math.floor(tmpl.baseHp * Math.pow(SCALE_FACTOR, difficulty));
            
            entities.push({
                id: `enemy_${uid()}`, name: type, type: 'ENEMY', symbol: type[0], color: 'red', pos: {x,y},
                hp, maxHp: hp, level: difficulty, aiType: 'MELEE', aggroRange: 5
            });
        }
    }

    // Dungeon Entrance (Chance)
    if (Math.random() < 0.2) {
        tiles[10][15] = 'ENTRANCE_CAVE';
    }

    return { id, name: `Wilderness ${difficulty}`, width, height, tiles, entities, neighbors: {}, difficulty, biome };
};

export const generateDungeon = (id: string, difficulty: number): GameMap => {
    const width = 20; const height = 20;
    const tiles: TileType[][] = Array(height).fill(null).map(() => Array(width).fill('WALL'));
    const entities: Entity[] = [];
    
    // Simple Room
    for(let y=5; y<15; y++) for(let x=5; x<15; x++) tiles[y][x] = 'FLOOR';
    tiles[10][10] = 'STAIRS_UP';
    
    entities.push({
        id: `exit_${uid()}`, name: 'Exit', type: 'OBJECT', subType: 'DOOR', symbol: '<', color: 'white', pos: {x: 10, y: 10},
        destination: { mapId: 'map_10_10', x: 30, y: 25, name: 'Surface' } // Fallback
    });

    const bossHp = Math.floor(100 * Math.pow(SCALE_FACTOR, difficulty));
    entities.push({
        id: `boss_${uid()}`, name: 'Dungeon Boss', type: 'ENEMY', subType: 'BOSS', symbol: 'B', color: 'purple', pos: {x: 10, y: 8},
        hp: bossHp, maxHp: bossHp, level: difficulty+2, aiType: 'MELEE'
    });

    return { id, name: 'Dark Dungeon', width, height, tiles, entities, neighbors: {}, difficulty, biome: 'DUNGEON' };
};
