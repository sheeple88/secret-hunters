
import { GameState, GameMap, Position, Entity, LogEntry, AnimationType } from '../types';
import { uid, SCALE_FACTOR, MONSTER_TEMPLATES } from '../constants';
import { playSound } from '../services/audioService';

const BLOCKED_TILES = ['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'SHRINE', 'VOID', 'WATER', 'CACTUS', 'DEEP_WATER', 'OBSIDIAN', 'CRACKED_WALL', 'ROOF'];

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
        
        if (BLOCKED_TILES.includes(map.tiles[y0][x0]) && !(x0 === p1.x && y0 === p1.y)) {
             if (x0 === x1 && y0 === y1) return true;
             return false;
        }
        
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
};

export const processSpawners = (
    entities: Entity[],
    currentMap: GameMap,
    playerPos: Position,
    currentStep: number // Added step tracker
): Entity[] => {
    const now = Date.now();
    let newEntities = [...entities];

    entities.forEach((entity, index) => {
        if (entity.subType !== 'MOB_SPAWNER') return;

        // Check cooldown (Spawn every 3s OR 5 steps)
        const timeDiff = now - (entity.lastSpawnTime || 0);
        const stepDiff = currentStep - (entity.lastSpawnStep || 0);
        
        const isTimeReady = timeDiff >= 3000;
        const isStepReady = stepDiff >= 5;

        if (!isTimeReady && !isStepReady) return;

        // Find empty adjacent spot
        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
        let spawnPos: Position | null = null;
        
        for (const [dx, dy] of dirs) {
            const nx = entity.pos.x + dx;
            const ny = entity.pos.y + dy;
            
            // Check bounds
            if (nx < 0 || ny < 0 || nx >= currentMap.width || ny >= currentMap.height) continue;
            
            // Check block
            if (BLOCKED_TILES.includes(currentMap.tiles[ny][nx])) continue;
            
            // Check occupied
            if (newEntities.some(e => e.pos.x === nx && e.pos.y === ny) || (playerPos.x === nx && playerPos.y === ny)) continue;
            
            spawnPos = { x: nx, y: ny };
            break;
        }

        if (spawnPos) {
            const type = entity.spawnType || 'Slime';
            // Update lastSpawnTime and lastSpawnStep in the original array reference through newEntities logic
            newEntities[index] = { ...entity, lastSpawnTime: now, lastSpawnStep: currentStep };
            
            const level = entity.level || 1;
            
            // Base Stat Scaling for Spawns
            const template = MONSTER_TEMPLATES[type] || MONSTER_TEMPLATES['Slime'];
            const hp = Math.floor(template.baseHp * Math.pow(SCALE_FACTOR, level));

            newEntities.push({
                id: `spawned_${uid()}`,
                name: `Spawned ${type}`,
                type: 'ENEMY',
                symbol: type[0],
                color: 'red',
                pos: spawnPos,
                hp,
                maxHp: hp,
                level,
                aiType: 'MELEE',
                isSpawned: true // Flags for reduced rewards
            });
        }
    });

    return newEntities;
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
    
    const occupied = new Set<string>();
    occupied.add(`${nextPlayerPos.x},${nextPlayerPos.y}`);
    entities.forEach(e => {
        occupied.add(`${e.pos.x},${e.pos.y}`);
    });

    entities = entities.map(entity => {
        if (entity.type !== 'ENEMY') return entity;
        
        occupied.delete(`${entity.pos.x},${entity.pos.y}`);

        const dist = Math.abs(entity.pos.x - nextPlayerPos.x) + Math.abs(entity.pos.y - nextPlayerPos.y);
        const aggro = entity.aggroRange || 5;
        const range = entity.attackRange || 1;
        
        if (dist > aggro) {
            occupied.add(`${entity.pos.x},${entity.pos.y}`);
            return entity;
        }

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
            
            // --- ENEMY DAMAGE CALCULATION ---
            // 1. Identify Base Type from Name (e.g. "Angry Rat" -> "Rat")
            let baseName = entity.name.split(' ').pop() || 'Slime'; // Basic heuristics
            if (['King', 'Lord', 'Mother', 'Dragon', 'Beholder', 'Lich'].some(k => entity.name.includes(k))) {
                // Keep full name for bosses if mapped
                if (MONSTER_TEMPLATES[entity.name]) baseName = entity.name;
                // Otherwise try finding partial match in keys
                else {
                    const match = Object.keys(MONSTER_TEMPLATES).find(k => entity.name.includes(k));
                    if (match) baseName = match;
                }
            }
            
            const template = MONSTER_TEMPLATES[baseName] || MONSTER_TEMPLATES['Slime'];
            const level = entity.level || 1;
            
            // Formula: BaseDamage * (1.15 ^ Level)
            // Minimum 1 damage
            const eDmg = Math.max(1, Math.floor(template.baseDmg * Math.pow(SCALE_FACTOR, level)));
            
            damageToPlayer += eDmg;
            anims[entity.id] = range > 1 ? 'SHOOT' : 'ATTACK';
            anims['player'] = 'HURT';
            numbers['player'] = (numbers['player'] || 0) + eDmg;
            logs.push({ id: uid(), message: `${entity.name} hit you for ${eDmg}!`, type: 'COMBAT', timestamp: Date.now() });
            
            occupied.add(`${entity.pos.x},${entity.pos.y}`);
            return entity;
        } else {
            let dx = nextPlayerPos.x - entity.pos.x;
            let dy = nextPlayerPos.y - entity.pos.y;
            let nextX = entity.pos.x;
            let nextY = entity.pos.y;

            const tryX = Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && Math.random() > 0.5);
            
            if (tryX) {
                nextX += dx > 0 ? 1 : -1;
            } else {
                nextY += dy > 0 ? 1 : -1;
            }

            let blocked = false;
            if (nextY < 0 || nextY >= currentMap.height || nextX < 0 || nextX >= currentMap.width) {
                blocked = true;
            } else {
                blocked = BLOCKED_TILES.includes(currentMap.tiles[nextY][nextX]);
            }
            
            if (!blocked && occupied.has(`${nextX},${nextY}`)) blocked = true;

            if (blocked) {
                nextX = entity.pos.x;
                nextY = entity.pos.y;
                if (!tryX) {
                     nextX += dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
                } else {
                     nextY += dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
                }
                
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
                occupied.add(`${entity.pos.x},${entity.pos.y}`);
                return entity;
            }
        }
    });

    return { entities, damageToPlayer, logs, anims, numbers };
};
