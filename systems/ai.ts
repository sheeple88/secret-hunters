
import { GameState, GameMap, Position, Entity, LogEntry, AnimationType } from '../types';
import { uid } from '../constants';
import { playSound } from '../services/audioService';

const BLOCKED_TILES = ['WALL', 'TREE', 'ROCK', 'SHRINE', 'VOID', 'WATER', 'CACTUS', 'DEEP_WATER', 'OBSIDIAN', 'CRACKED_WALL', 'ROOF'];

// Helper for Line of Sight
export const hasLineOfSight = (p1: Position, p2: Position, map: GameMap): boolean => {
    let x0 = p1.x;
    let y0 = p1.y;
    const x1 = p2.x;
    const y1 = p2.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        if (x0 === x1 && y0 === y1) return true;
        // Bounds Check
        if (y0 < 0 || y0 >= map.height || x0 < 0 || x0 >= map.width) return false;
        
        // If the current tile is blocked, and it's NOT the start tile, LOS is broken
        // Note: We check if the TILE is blocked. If we are AT the tile, we can see it (it's the wall itself)
        // But we can't see PAST it. 
        // This loop checks tiles along the path. 
        if (BLOCKED_TILES.includes(map.tiles[y0][x0]) && !(x0 === p1.x && y0 === p1.y)) {
             // If we hit a wall, we can see the wall, but not past it.
             // If this tile IS the target (x1,y1), return true (we see the wall).
             // If this tile is NOT the target, we are trying to look through it -> return false.
             if (x0 === x1 && y0 === y1) return true;
             return false;
        }
        
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
};

export const processEnemyTurns = (
    currentState: GameState, 
    currentMap: GameMap, 
    nextPlayerPos: Position
): { 
    entities: Entity[], 
    damageToPlayer: number, 
    logs: LogEntry[], 
    anims: Record<string, AnimationType>, 
    numbers: Record<string, number> 
} => {
    let entities = [...currentMap.entities];
    let damageToPlayer = 0;
    let logs: LogEntry[] = [];
    let anims: Record<string, AnimationType> = {};
    let numbers: Record<string, number> = {};
    
    // 1. Initialize Occupied Tiles with ALL entities to prevent stacking
    const occupied = new Set<string>();
    
    // Add player next position
    occupied.add(`${nextPlayerPos.x},${nextPlayerPos.y}`);

    // Add all entities initially
    entities.forEach(e => {
        occupied.add(`${e.pos.x},${e.pos.y}`);
    });

    entities = entities.map(entity => {
        if (entity.type !== 'ENEMY') return entity;
        
        // Remove SELF from occupied temporarily so we can move (or decide to stay)
        occupied.delete(`${entity.pos.x},${entity.pos.y}`);

        const dist = Math.abs(entity.pos.x - nextPlayerPos.x) + Math.abs(entity.pos.y - nextPlayerPos.y);
        const aggro = entity.aggroRange || 5;
        const range = entity.attackRange || 1;
        
        // Idle behavior if player is far
        if (dist > aggro) {
            occupied.add(`${entity.pos.x},${entity.pos.y}`); // Add back current pos
            return entity;
        }

        // Attack Check
        let canAttack = false;
        if (dist <= range) {
            if (range === 1) {
                canAttack = true;
            } else {
                if (hasLineOfSight(entity.pos, nextPlayerPos, currentMap)) {
                    canAttack = true;
                }
            }
        }

        if (canAttack) {
            playSound('HIT');
            // Damage Scaling: Level * 1.2 + 1 (e.g. Lvl 1 = 2dmg, Lvl 10 = 13dmg)
            const eDmg = Math.max(1, Math.floor((entity.level || 1) * 1.2) + 1);
            damageToPlayer += eDmg;
            anims[entity.id] = range > 1 ? 'SHOOT' : 'ATTACK';
            anims['player'] = 'HURT';
            numbers['player'] = (numbers['player'] || 0) + eDmg;
            logs.push({ id: uid(), message: `${entity.name} hit you for ${eDmg}!`, type: 'COMBAT', timestamp: Date.now() });
            
            // Stay in place if attacking
            occupied.add(`${entity.pos.x},${entity.pos.y}`);
            return entity;
        } else {
            // Chase Logic
            let dx = nextPlayerPos.x - entity.pos.x;
            let dy = nextPlayerPos.y - entity.pos.y;
            let nextX = entity.pos.x;
            let nextY = entity.pos.y;

            // Simple pathfinding: try to reduce largest difference
            const tryX = Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && Math.random() > 0.5);
            
            if (tryX) {
                nextX += dx > 0 ? 1 : -1;
            } else {
                nextY += dy > 0 ? 1 : -1;
            }

            // Check Collision (Walls OR Occupied by other entity)
            // Added Bounds Check
            let blocked = false;
            if (nextY < 0 || nextY >= currentMap.height || nextX < 0 || nextX >= currentMap.width) {
                blocked = true;
            } else {
                blocked = BLOCKED_TILES.includes(currentMap.tiles[nextY][nextX]);
            }
            
            if (!blocked && occupied.has(`${nextX},${nextY}`)) blocked = true;

            // If blocked, try the other axis
            if (blocked) {
                nextX = entity.pos.x;
                nextY = entity.pos.y;
                if (!tryX) {
                     nextX += dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
                } else {
                     nextY += dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
                }
                
                // Added Bounds Check for second attempt
                if (nextY < 0 || nextY >= currentMap.height || nextX < 0 || nextX >= currentMap.width) {
                    blocked = true;
                } else {
                    blocked = BLOCKED_TILES.includes(currentMap.tiles[nextY][nextX]);
                }
                
                if (!blocked && occupied.has(`${nextX},${nextY}`)) blocked = true;
            }

            if (!blocked) {
                occupied.add(`${nextX},${nextY}`);
                const facing = nextX > entity.pos.x ? 'RIGHT' : nextX < entity.pos.x ? 'LEFT' : entity.facing;
                return { ...entity, pos: { x: nextX, y: nextY }, facing };
            } else {
                // Cannot move, stay put
                occupied.add(`${entity.pos.x},${entity.pos.y}`);
                return entity;
            }
        }
    });

    return { entities, damageToPlayer, logs, anims, numbers };
};
