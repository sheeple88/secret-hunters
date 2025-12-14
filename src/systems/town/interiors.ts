
import { GameMap, TileType, Entity } from '../../types';
import { uid } from '../mapUtils';

export const generateHouseInterior = (
    id: string, 
    name: string, 
    owner: string,
    exitTo: {mapId: string, x: number, y: number, name: string}
): GameMap => {
    const width = 12;
    const height = 10;
    const tiles: TileType[][] = [];
    const entities: Entity[] = [];

    // Floor plan
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) {
            if (x===0 || x===width-1 || y===0 || y===height-1) row.push('WALL');
            else row.push('PLANK');
        }
        tiles.push(row);
    }

    // Door
    tiles[height-1][6] = 'DOOR';
    
    // Exit Entity
    entities.push({
        id: `exit_${id}`,
        name: 'Exit',
        type: 'OBJECT',
        subType: 'DOOR',
        symbol: '>',
        color: 'yellow',
        pos: {x: 6, y: height-1},
        destination: exitTo
    });

    entities.push({ id: `bed_${id}`, name: `${owner}'s Bed`, type: 'OBJECT', subType: 'BED', symbol: '=', color: 'red', pos: {x: 2, y: 2} });
    entities.push({ id: `table_${id}`, name: 'Table', type: 'OBJECT', subType: 'CRATE', symbol: 'T', color: 'brown', pos: {x: 3, y: 4} });

    if (Math.random() > 0.5) {
        entities.push({ 
            id: `chest_${id}`, 
            name: 'Drawer', 
            type: 'OBJECT', 
            subType: 'CHEST', 
            symbol: 'C', 
            color: 'brown', 
            pos: {x: width-2, y: 2},
            loot: Math.random() > 0.8 ? 'gold_ore' : 'potion_small'
        });
    }

    return { 
        id, 
        name, 
        width, 
        height, 
        tiles, 
        entities, 
        neighbors: {}, 
        difficulty: 0, 
        biome: 'INTERIOR', 
        isTown: false 
    };
};
