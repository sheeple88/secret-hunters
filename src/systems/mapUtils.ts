
import { GameMap, TileType, Entity } from '../types';

export const uid = () => Math.random().toString(36).substr(2, 9);

export const generateInterior = (id: string, name: string, exitTo: {mapId: string, x: number, y: number, name: string}): GameMap => {
    const width = 10;
    const height = 8;
    const tiles: TileType[][] = [];
    
    for(let y=0; y<height; y++) {
        const row: TileType[] = [];
        for(let x=0; x<width; x++) {
            if (x===0 || x===width-1 || y===0 || y===height-1) row.push('WALL');
            else row.push('PLANK');
        }
        tiles.push(row);
    }
    // Door Exit
    tiles[height-1][5] = 'DOOR';
    
    const entities: Entity[] = [];
    
    entities.push({
        id: `exit_${id}`,
        name: 'Exit',
        type: 'OBJECT',
        subType: 'DOOR',
        symbol: '>',
        color: 'yellow',
        pos: {x: 5, y: height-1},
        destination: exitTo
    });

    entities.push({ id: `bed_${id}`, name: 'Bed', type: 'OBJECT', subType: 'BED', symbol: '=', color: 'red', pos: {x: 2, y: 2} });
    
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
        isTown: false,
        source: 'mapUtils.ts (Interior)'
    };
};
