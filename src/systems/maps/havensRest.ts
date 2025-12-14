
import { GameMap, TileType, Entity } from '../../types';
import { generateHouseInterior } from '../town/interiors';
import { TOWN_NPC_ROSTER } from '../town/townNPCs';
import { uid } from '../mapUtils';

export const generateHavensRest = (maps: Record<string, GameMap>) => {
    const width = 60;
    const height = 50;
    const tiles: TileType[][] = [];
    const entities: Entity[] = [];
    const id = 'map_10_10';
    
    // 1. Base Terrain (Grass)
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) {
             row.push('GRASS');
        }
        tiles.push(row);
    }

    // --- HELPER FUNCTIONS ---
    const fillRect = (x: number, y: number, w: number, h: number, type: TileType) => {
        for(let iy=y; iy<y+h; iy++) {
            for(let ix=x; ix<x+w; ix++) {
                if (iy>=0 && iy<height && ix>=0 && ix<width) tiles[iy][ix] = type;
            }
        }
    };

    const buildHouse = (x: number, y: number, w: number, h: number, name: string, owner: string) => {
        // Roof
        fillRect(x, y, w, h-1, 'ROOF');
        // Walls
        fillRect(x, y+h-1, w, 1, 'WALL');
        // Door
        const dx = x + Math.floor(w/2);
        const dy = y+h-1;
        tiles[dy][dx] = 'DOOR';
        
        // Generate Interior
        const intId = `interior_${uid()}`;
        const interior = generateHouseInterior(intId, name, owner, { mapId: id, x: dx, y: dy+1, name: "Town" });
        maps[intId] = interior;

        // Door Entity
        entities.push({
            id: `door_${uid()}`,
            name: name,
            type: 'OBJECT',
            subType: 'DOOR',
            pos: {x: dx, y: dy},
            symbol: '.',
            color: 'white',
            destination: { mapId: intId, x: 6, y: 8, name: name }
        });
        
        return {x: dx, y: dy};
    };

    const addLamp = (x: number, y: number) => {
        entities.push({
            id: `lamp_${uid()}`,
            name: 'Street Lamp',
            type: 'OBJECT',
            subType: 'LAMP' as any,
            symbol: 'i',
            color: 'yellow',
            pos: {x, y}
        });
    };

    // --- DISTRICTS (60x50 Layout) ---

    // 1. Central Square (30, 25) - The Heart
    fillRect(25, 20, 10, 10, 'STONE_BRICK'); // Plaza 10x10
    entities.push({ id: 'fountain', name: 'Grand Fountain', type: 'OBJECT', subType: 'FOUNTAIN' as any, symbol: 'O', color: 'cyan', pos: {x: 30, y: 25} });
    entities.push({ id: `wp_${id}`, name: 'Town Waypoint', type: 'OBJECT', subType: 'WAYPOINT', symbol: 'O', color: 'cyan', pos: {x: 28, y: 22} });
    
    // 2. Mayor's Hall (North of Square)
    buildHouse(26, 5, 8, 6, "Mayor's Hall", "Mayor");
    fillRect(29, 11, 2, 9, 'STONE_BRICK'); // Path from Hall to Square
    addLamp(28, 11); addLamp(31, 11);

    // 3. Residential District (West)
    // Vertical Road
    fillRect(19, 10, 2, 30, 'DIRT_PATH');
    // Connecting Road to Square
    fillRect(21, 25, 4, 2, 'DIRT_PATH');

    // Houses
    const houses = [
        // Ensure "My Home" is one of these, specifically mapped to interior_home
        {x: 5, y: 10, w: 6, h: 5, owner: 'Citizen'},
        {x: 12, y: 10, w: 6, h: 5, owner: 'Citizen'},
        {x: 5, y: 18, w: 6, h: 5, owner: 'Kid'},
        {x: 12, y: 18, w: 6, h: 5, owner: 'Guard'},
        {x: 5, y: 26, w: 6, h: 5, owner: 'Citizen'},
        {x: 12, y: 26, w: 6, h: 5, owner: 'Citizen'},
    ];
    
    // Special handling for Player Home to link to fixed interior_home ID
    const homeX = 4; 
    const homeY = 35; // Put player home south west
    fillRect(homeX, homeY, 6, 4, 'ROOF');
    fillRect(homeX, homeY+4, 6, 1, 'WALL');
    tiles[homeY+4][homeX+3] = 'DOOR';
    
    // Create the interior_home map explicitly
    const intHome = generateHouseInterior('interior_home', "Hero's Home", "Hero", { mapId: id, x: homeX+3, y: homeY+5, name: "Haven's Rest" });
    maps['interior_home'] = intHome;
    
    entities.push({
        id: `door_home`,
        name: "My Home",
        type: 'OBJECT',
        subType: 'DOOR',
        pos: {x: homeX+3, y: homeY+4},
        symbol: '.',
        color: 'white',
        destination: { mapId: 'interior_home', x: 6, y: 8, name: "My Home" }
    });
    
    houses.forEach(h => {
        buildHouse(h.x, h.y, h.w, h.h, `${h.owner}'s House`, h.owner);
        fillRect(h.x + 3, h.y + h.h, 1, 2, 'DIRT_PATH'); // Path to road
    });

    // 4. Market Row (East)
    fillRect(40, 22, 15, 8, 'PLANK'); // Wood floor for market
    entities.push(
        { id: 'stall_1', name: 'Fruit Stall', type: 'OBJECT', subType: 'CRATE', symbol: '#', color: 'green', pos: {x: 42, y: 23}, loot: 'apple' },
        { id: 'stall_2', name: 'Weapon Stall', type: 'OBJECT', subType: 'ANVIL', symbol: 'T', color: 'gray', pos: {x: 46, y: 23} }, 
        { id: 'stall_3', name: 'Misc Stall', type: 'OBJECT', subType: 'CRATE', symbol: '#', color: 'brown', pos: {x: 50, y: 23} }
    );
    // Connect to Square
    fillRect(35, 25, 5, 2, 'STONE_BRICK');

    // 5. Crafting Corner (North East)
    buildHouse(45, 10, 8, 6, "The Anvil", "Blacksmith");
    entities.push({ id: 'town_anvil', name: 'Public Anvil', type: 'OBJECT', subType: 'ANVIL', symbol: 'T', color: 'gray', pos: {x: 48, y: 17} });
    entities.push({ id: 'town_furnace', name: 'Public Furnace', type: 'OBJECT', subType: 'FURNACE' as any, symbol: '#', color: 'orange', pos: {x: 50, y: 17} });
    fillRect(48, 16, 4, 4, 'stone' as any); // Work area

    // 6. Inn / Tavern (South of Square)
    buildHouse(26, 35, 10, 8, "The Sleepy Slime", "Innkeeper");
    entities.push({ id: 'inn_sign', name: 'Inn Sign', type: 'OBJECT', subType: 'SIGNPOST', symbol: 'S', color: 'brown', pos: {x: 32, y: 44} });

    // 7. Farm & River (South East)
    // River
    fillRect(45, 40, 15, 10, 'WATER');
    entities.push({ id: 'fish_spot_town', name: 'Town Fishing', type: 'OBJECT', subType: 'FISHING_SPOT', symbol: '~', color: 'blue', pos: {x: 50, y: 45} });
    
    // Farm
    for(let y=35; y<40; y++) {
        for(let x=50; x<58; x++) {
            tiles[y][x] = 'MUD'; // Tilled soil
            if (Math.random() > 0.5) entities.push({ id: `crop_${x}_${y}`, name: 'Wheat', type: 'OBJECT', subType: 'PLANT' as any, symbol: '"', color: 'yellow', pos: {x, y} });
        }
    }
    
    // --- AMBIENT LIFE ---
    for(let i=0; i<8; i++) {
        entities.push({
            id: `chicken_${i}`,
            name: 'Chicken',
            type: 'NPC', 
            symbol: 'c',
            color: 'white',
            pos: {x: 50 + Math.floor(Math.random()*5), y: 35 + Math.floor(Math.random()*5)},
            aiType: 'PASSIVE' as any
        });
    }
    entities.push({ id: 'cat_1', name: 'Stray Cat', type: 'NPC', symbol: 'f', color: 'orange', pos: {x: 10, y: 30}, aiType: 'PASSIVE' as any });

    // --- POPULATE NPCs ---
    TOWN_NPC_ROSTER.forEach(npc => {
        entities.push({
            id: npc.id,
            name: npc.name,
            type: 'NPC',
            symbol: npc.symbol,
            color: npc.color,
            pos: npc.dayPos,
            dialogue: npc.dialogue,
            schedule: { dayPos: npc.dayPos, nightPos: npc.nightPos },
            questId: npc.questId
        });
    });

    // --- EXITS TO WORLD ---
    fillRect(0, 25, 1, 4, 'DIRT_PATH'); // West
    fillRect(59, 25, 1, 4, 'DIRT_PATH'); // East
    fillRect(30, 0, 4, 1, 'DIRT_PATH'); // North
    fillRect(30, 49, 4, 1, 'DIRT_PATH'); // South

    // Fill empty spaces
    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            if (tiles[y][x] === 'GRASS' && Math.random() > 0.95) {
                tiles[y][x] = Math.random() > 0.5 ? 'OAK_TREE' : 'FLOWER';
            }
        }
    }

    maps[id] = { 
        id, 
        name: "Haven's Rest", 
        width, 
        height, 
        tiles, 
        entities, 
        neighbors: {}, 
        exits: [], 
        difficulty: 0, 
        biome: 'GRASS', 
        isTown: true,
        source: 'havensRest.ts (v7 - 60x50)'
    };
    
    return maps[id];
};
