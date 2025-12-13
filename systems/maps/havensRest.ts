
import { GameMap, TileType, Entity } from '../../types';
import { generateInterior } from '../mapUtils';

export const generateHavensRest = (maps: Record<string, GameMap>) => {
    const width = 40;
    const height = 30;
    const tiles: TileType[][] = [];
    const entities: Entity[] = [];
    const id = 'map_10_10';
    
    // 1. Initialize Grass Canvas
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) {
             row.push('GRASS');
        }
        tiles.push(row);
    }

    // 2. Gateways (Connections to world)
    // Clear borders to prevent sticking
    // Top Gate (North)
    for(let x=18; x<=22; x++) tiles[0][x] = 'DIRT_PATH';
    // Bottom Gate (South)
    for(let x=18; x<=22; x++) tiles[29][x] = 'DIRT_PATH';
    // Left Gate (West)
    for(let y=14; y<=18; y++) tiles[y][0] = 'DIRT_PATH';
    // Right Gate (East)
    for(let y=14; y<=18; y++) tiles[y][39] = 'DIRT_PATH';

    // 3. Main Roads
    // Vertical Main Road (x=20) - Runs full length
    for(let y=1; y<29; y++) tiles[y][20] = 'DIRT_PATH';
    
    // Horizontal Main Road (y=16) - Shifted down to allow building porches
    for(let x=1; x<39; x++) tiles[16][x] = 'DIRT_PATH';

    // Town Square (Intersection)
    for(let y=13; y<=19; y++) {
        for(let x=17; x<=23; x++) {
            tiles[y][x] = 'STONE_BRICK';
        }
    }
    tiles[16][20] = 'SHRINE'; // Central Shrine
    entities.push({ id: `wp_${id}`, name: 'Town Waypoint', type: 'OBJECT', subType: 'WAYPOINT', symbol: 'O', color: 'cyan', pos: {x: 18, y: 14} });

    // --- Helper for Buildings ---
    const buildBuilding = (bx: number, by: number, w: number, h: number, title: string, interiorId?: string) => {
        // Roof (Top h-1 rows)
        for(let y=by; y<by+h-1; y++) {
            for(let x=bx; x<bx+w; x++) {
                 tiles[y][x] = 'ROOF';
            }
        }
        // Walls (Bottom row)
        const wallY = by + h - 1;
        for(let x=bx; x<bx+w; x++) {
             tiles[wallY][x] = 'WALL';
        }
        
        // Door (Center of bottom row)
        const dx = bx + Math.floor(w/2);
        const dy = wallY;
        tiles[dy][dx] = 'DOOR';

        // Add Door Entity
        if (interiorId) {
             entities.push({
                 id: `door_${interiorId}`,
                 name: title,
                 type: 'OBJECT',
                 subType: 'DOOR',
                 pos: {x: dx, y: dy},
                 symbol: '.',
                 color: 'white',
                 destination: { mapId: interiorId, x: 5, y: 6, name: title } // Updated to y: 6 (Inside room)
             });
        } else {
             entities.push({
                 id: `door_${bx}_${by}`,
                 name: title,
                 type: 'OBJECT',
                 subType: 'DOOR',
                 pos: {x: dx, y: dy},
                 symbol: '.',
                 color: 'white'
             });
        }
        return {x: dx, y: dy};
    };

    // --- WEST DISTRICT (Residential) ---
    // Player Home: x=4, y=10. Size 6x5.
    // Occupies y=10,11,12,13(Roof), 14(Wall). Door at 14. Road at 16.
    const intHome = generateInterior('interior_home', "Hero's Home", { mapId: id, x: 0, y: 0, name: "Haven's Rest" }); 
    intHome.entities.push({ id: 'start_chest', name: 'Old Chest', type: 'OBJECT', subType: 'CHEST', symbol: 'C', color: 'brown', pos: {x: 7, y: 2}, loot: 'potion_small' });
    maps[intHome.id] = intHome;
    
    const homeDoor = buildBuilding(4, 10, 6, 5, "My Home", intHome.id);
    
    // Update Exit using ID lookup instead of index for safety
    const homeExit = intHome.entities.find(e => e.id === `exit_interior_home`);
    if (homeExit && homeExit.destination) {
        homeExit.destination.x = homeDoor.x;
        homeExit.destination.y = homeDoor.y + 1;
    }
    
    // Path to road
    tiles[15][homeDoor.x] = 'DIRT_PATH';

    // Neighbor North (Old Shack): x=4, y=3.
    const neighbor1 = buildBuilding(4, 3, 5, 5, "Old Shack");
    // Path down to horizontal road? Too far. Path right to Vertical road?
    // Let's make a small side road at y=8
    for(let x=6; x<20; x++) tiles[8][x] = 'DIRT_PATH';
    tiles[8][neighbor1.x] = 'DIRT_PATH'; // Connect door to side road

    // Neighbor South (Empty House): x=4, y=22.
    const neighbor2 = buildBuilding(4, 22, 5, 5, "Empty House");
    // Side road at y=21?
    for(let x=6; x<20; x++) tiles[21][x] = 'DIRT_PATH';
    tiles[21][neighbor2.x] = 'DIRT_PATH';

    // --- EAST DISTRICT (Commercial) ---
    
    // General Store: x=30, y=10.
    const intShop = generateInterior('interior_shop', "General Store", { mapId: id, x: 0, y: 0, name: "Haven's Rest" });
    intShop.entities.push({ id: 'npc_merch', name: 'Merchant', type: 'NPC', symbol: '$', color: 'yellow', pos: {x: 5, y: 3}, dialogue: ["We have the best prices."] });
    maps[intShop.id] = intShop;
    
    const shopDoor = buildBuilding(30, 10, 6, 5, "General Store", intShop.id);
    
    // Update Exit
    const shopExit = intShop.entities.find(e => e.id === `exit_interior_shop`);
    if (shopExit && shopExit.destination) {
        shopExit.destination.x = shopDoor.x;
        shopExit.destination.y = shopDoor.y + 1;
    }

    // Path
    tiles[15][shopDoor.x] = 'DIRT_PATH';

    // Smithy (North East): x=30, y=3
    const intSmith = generateInterior('interior_smith', "The Anvil", { mapId: id, x: 0, y: 0, name: "Haven's Rest" });
    intSmith.entities.push({ id: 'anvil_shop', name: 'Anvil', type: 'OBJECT', subType: 'ANVIL', symbol: 'T', color: 'gray', pos: {x: 5, y: 4} });
    intSmith.entities.push({ id: 'npc_smith', name: 'Blacksmith', type: 'NPC', symbol: 'B', color: 'gray', pos: {x: 3, y: 4}, dialogue: ["Need weapons forged?"] });
    maps[intSmith.id] = intSmith;

    const smithDoor = buildBuilding(30, 3, 6, 5, "Blacksmith", intSmith.id);
    
    const smithExit = intSmith.entities.find(e => e.id === `exit_interior_smith`);
    if (smithExit && smithExit.destination) {
        smithExit.destination.x = smithDoor.x;
        smithExit.destination.y = smithDoor.y + 1;
    }

    // Side road y=8 connection
    for(let x=20; x<33; x++) tiles[8][x] = 'DIRT_PATH';
    tiles[8][smithDoor.x] = 'DIRT_PATH';

    // Magic Shop (South East): x=30, y=22
    const intMagic = generateInterior('interior_magic', "Arcane Tower", { mapId: id, x: 0, y: 0, name: "Haven's Rest" });
    intMagic.entities.push({ id: 'alchemy_table', name: 'Alchemy Table', type: 'OBJECT', subType: 'ALCHEMY_TABLE', symbol: 'A', color: 'purple', pos: {x: 5, y: 3} });
    maps[intMagic.id] = intMagic;

    const magicDoor = buildBuilding(30, 22, 5, 5, "Arcane Tower", intMagic.id);
    
    const magicExit = intMagic.entities.find(e => e.id === `exit_interior_magic`);
    if (magicExit && magicExit.destination) {
        magicExit.destination.x = magicDoor.x;
        magicExit.destination.y = magicDoor.y + 1;
    }

    // Side road y=21 connection
    for(let x=20; x<33; x++) tiles[21][x] = 'DIRT_PATH';
    tiles[21][magicDoor.x] = 'DIRT_PATH';

    // --- NORTH DISTRICT (Government) ---
    // Mayor's Estate: Moved to x=6, y=3 to avoid the main road at x=20.
    // Actually, let's put it at x=8, y=2 to be fancy.
    const mayorDoor = buildBuilding(8, 2, 8, 6, "Mayor's Estate");
    // Garden in front
    for(let y=2; y<8; y++) tiles[y][7] = 'OAK_TREE';
    for(let y=2; y<8; y++) tiles[y][16] = 'OAK_TREE';
    
    // Path from Mayor to center
    // Door at x=12, y=7.
    // Connect to side road at y=8.
    tiles[8][mayorDoor.x] = 'DIRT_PATH';

    // Guardhouse / Barracks (Opposite Mayor)
    const guardDoor = buildBuilding(24, 2, 8, 6, "Barracks");
    tiles[8][guardDoor.x] = 'DIRT_PATH';

    // --- DECORATION ---
    // Market Stalls in SE quadrant of Square
    entities.push(
        { id: 'stall_1', name: 'Market Stall', type: 'OBJECT', subType: 'CRATE', symbol: '#', color: 'brown', pos: {x: 25, y: 17}, loot: 'apple' },
        { id: 'stall_2', name: 'Market Stall', type: 'OBJECT', subType: 'CRATE', symbol: '#', color: 'brown', pos: {x: 25, y: 18}, loot: 'wood' },
        { id: 'bench_sq', name: 'Public Bench', type: 'OBJECT', subType: 'WORKBENCH', symbol: 'W', color: 'brown', pos: {x: 18, y: 18} }
    );

    // NPCs
    entities.push(
        { id: 'mayor_start', name: 'Mayor', type: 'NPC', symbol: 'M', color: 'blue', pos: {x: 20, y: 10}, dialogue: ["Welcome to Haven's Rest!", "The roads are clear now."] },
        { id: 'guard_n', name: 'Town Guard', type: 'NPC', symbol: 'G', color: 'red', pos: {x: 21, y: 2}, dialogue: ["North lies the Frostlands."] },
        { id: 'guard_s', name: 'Town Guard', type: 'NPC', symbol: 'G', color: 'red', pos: {x: 19, y: 27}, dialogue: ["South lies the Desert."] },
        { id: 'citizen_1', name: 'Villager', type: 'NPC', symbol: 'V', color: 'green', pos: {x: 16, y: 16}, dialogue: ["Lovely weather."] },
        { id: 'sign_square', name: 'Town Square', type: 'OBJECT', subType: 'SIGNPOST', symbol: 'S', color: 'brown', pos: {x: 19, y: 15}, destination: { mapId: '', x:0, y:0, name: 'Market East, Homes West'} }
    );

    // Fill empty space with nature
    for(let y=1; y<29; y++) {
        for(let x=1; x<39; x++) {
            if (tiles[y][x] === 'GRASS') {
                const r = Math.random();
                if (r > 0.97) tiles[y][x] = 'OAK_TREE';
                else if (r > 0.95) tiles[y][x] = 'FLOWER';
            }
        }
    }

    // Preserving existing map neighbors if they exist
    const existingMap = maps[id];

    maps[id] = { 
        id, 
        name: "Haven's Rest", 
        width, 
        height, 
        tiles, 
        entities, 
        neighbors: existingMap ? existingMap.neighbors : {}, 
        exits: [], 
        difficulty: 0, 
        biome: 'GRASS', 
        isTown: true 
    };
    
    return maps[id];
};
