
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
    currentStep: number 
): Entity[] => {
    const now = Date.now();
    let newEntities = [...entities];

    entities.forEach((entity, index) => {
        if (entity.subType !== 'MOB_SPAWNER') return;

        // Check cooldown (Spawn every 30s)
        const timeDiff = now - (entity.lastSpawnTime || 0);
        
        if (timeDiff < 30000) return;

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
            // Update lastSpawnTime
            newEntities[index] = { ...entity, lastSpawnTime: now };
            
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
                isSpawned: true,
                defence: template.defence,
                weakness: template.weakness
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

    // Player Defence Roll
    const playerDef = currentState.skills.Defence.level; 
    const armorBonus = Object.values(currentState.equipment).reduce((acc, item) => acc + (item?.stats?.hp ? Math.floor(item.stats.hp / 10) : 0), 0); 
    const effectivePlayerDef = playerDef + armorBonus;

    entities = entities.map(entity => {
        if (entity.type !== 'ENEMY' && entity.type !== 'NPC') return entity;
        
        occupied.delete(`${entity.pos.x},${entity.pos.y}`);

        // --- NPC AI (Schedule / Passive) ---
        if (entity.type === 'NPC') {
            // Passive wandering animals
            if (entity.aiType === 'PASSIVE') {
                if (Math.random() < 0.2) {
                    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                    const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
                    const nx = entity.pos.x + dx;
                    const ny = entity.pos.y + dy;
                    if (nx >= 0 && nx < currentMap.width && ny >= 0 && ny < currentMap.height && !BLOCKED_TILES.includes(currentMap.tiles[ny][nx]) && !occupied.has(`${nx},${ny}`)) {
                        occupied.add(`${nx},${ny}`);
                        return { ...entity, pos: { x: nx, y: ny } };
                    }
                }
                occupied.add(`${entity.pos.x},${entity.pos.y}`);
                return entity;
            }

            // Scheduled Commuters
            if (entity.schedule) {
                const isNight = currentState.time > 1800 || currentState.time < 600;
                const targetPos = isNight ? entity.schedule.nightPos : entity.schedule.dayPos;
                
                if (targetPos && (entity.pos.x !== targetPos.x || entity.pos.y !== targetPos.y)) {
                    let dx = targetPos.x - entity.pos.x;
                    let dy = targetPos.y - entity.pos.y;
                    let nextX = entity.pos.x + (dx !== 0 ? Math.sign(dx) : 0);
                    let nextY = entity.pos.y + (dy !== 0 ? Math.sign(dy) : 0);
                    
                    // Prioritize Axis
                    let moved = false;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (!occupied.has(`${nextX},${entity.pos.y}`) && !BLOCKED_TILES.includes(currentMap.tiles[entity.pos.y][nextX])) {
                            entity.pos.x = nextX;
                            moved = true;
                        }
                    } 
                    if (!moved) {
                        if (!occupied.has(`${entity.pos.x},${nextY}`) && !BLOCKED_TILES.includes(currentMap.tiles[nextY][entity.pos.x])) {
                            entity.pos.y = nextY;
                            moved = true;
                        }
                    }
                }
                occupied.add(`${entity.pos.x},${entity.pos.y}`);
                return entity;
            }
            
            occupied.add(`${entity.pos.x},${entity.pos.y}`);
            return entity;
        }

        // --- ENEMY AI ---
        const dist = Math.abs(entity.pos.x - nextPlayerPos.x) + Math.abs(entity.pos.y - nextPlayerPos.y);
        const aggro = entity.aggroRange || 6; 
        const range = entity.attackRange || 1;
        
        // Passive Roam vs Chase
        if (dist > aggro) {
            // Roam randomly (10% chance)
            if (Math.random() < 0.1) {
                const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
                const nx = entity.pos.x + dx;
                const ny = entity.pos.y + dy;
                
                if (nx >= 0 && nx < currentMap.width && ny >= 0 && ny < currentMap.height && !BLOCKED_TILES.includes(currentMap.tiles[ny][nx]) && !occupied.has(`${nx},${ny}`)) {
                    occupied.add(`${nx},${ny}`);
                    return { ...entity, pos: { x: nx, y: ny } };
                }
            }
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
            
            // --- ENEMY DAMAGE CALCULATION (Simplified RS Style) ---
            let baseName = entity.name.split(' ').pop() || 'Slime';
            if (['King', 'Lord', 'Mother', 'Dragon', 'Beholder', 'Lich'].some(k => entity.name.includes(k))) {
                if (MONSTER_TEMPLATES[entity.name]) baseName = entity.name;
                else {
                    const match = Object.keys(MONSTER_TEMPLATES).find(k => entity.name.includes(k));
                    if (match) baseName = match;
                }
            }
            
            const template = MONSTER_TEMPLATES[baseName] || MONSTER_TEMPLATES['Slime'];
            const level = entity.level || 1;
            
            // Enemy Max Hit
            const eMaxHit = Math.max(1, Math.floor(template.baseDmg * Math.pow(SCALE_FACTOR, level)));
            
            // Enemy Accuracy (Levels + World Tier)
            const eAcc = Math.floor(level * (1 + currentState.worldTier * 0.2) * 50);
            const pDefRoll = Math.floor(effectivePlayerDef * 64);
            
            let hitChance = 0;
            if (eAcc > pDefRoll) {
                hitChance = 1 - (pDefRoll + 2) / (2 * (eAcc + 1));
            } else {
                hitChance = eAcc / (2 * (pDefRoll + 1));
            }
            
            const isHit = Math.random() < hitChance;
            let dmg = 0;
            
            if (isHit) {
                dmg = Math.floor(Math.random() * (eMaxHit + 1));
                if (dmg === 0) dmg = 1;
                
                // Iron Skin perk check
                if (currentState.equippedPerks.includes('iron_skin')) dmg = Math.max(0, dmg - 1);
            }

            if (dmg > 0) {
                damageToPlayer += dmg;
                anims[entity.id] = range > 1 ? 'SHOOT' : 'ATTACK';
                anims['player'] = 'HURT';
                numbers['player'] = (numbers['player'] || 0) + dmg;
                logs.push({ id: uid(), message: `${entity.name} hit you for ${dmg}!`, type: 'COMBAT', timestamp: Date.now() });
            } else {
                anims[entity.id] = range > 1 ? 'SHOOT' : 'ATTACK';
                anims['player'] = 'DODGE'; // Show Miss
            }
            
            occupied.add(`${entity.pos.x},${entity.pos.y}`);
            return entity;
        } else {
            // CHASE LOGIC
            let dx = nextPlayerPos.x - entity.pos.x;
            let dy = nextPlayerPos.y - entity.pos.y;
            let nextX = entity.pos.x;
            let nextY = entity.pos.y;

            const tryX = Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && Math.random() > 0.5);
            
            // Attempt to move towards player
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

            // Simple pathfinding fallback: try other axis
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
