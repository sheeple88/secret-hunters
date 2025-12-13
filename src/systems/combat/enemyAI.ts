
import { Entity, GameState, Position, GameMap, Item } from '../../types';
import { getEnemyStats } from '../../data/combat/enemies';
import { calculateHitChance } from './combatCore';
import { hasLineOfSight } from '../ai'; // Reuse existing LOS
import { uid } from '../../constants';

// Simple types for the result
export interface TurnResult {
    updatedEntities: Entity[];
    damageToPlayer: number;
    logs: any[];
    animations: Record<string, string>;
}

export const processEnemyTurn = (gameState: GameState, map: GameMap): TurnResult => {
    const { playerPos, stats: playerStats, equipment, skills, worldTier } = gameState;
    let damageToPlayer = 0;
    const logs: any[] = [];
    const animations: Record<string, string> = {};
    const updatedEntities = [...map.entities];

    // Player defence roll
    const defLvl = skills['Defence']?.level || 1;
    
    const equipmentItems = Object.values(equipment) as (Item | null)[];
    const armorBonus = equipmentItems.reduce((acc: number, item: Item | null) => {
        if (!item || !item.stats || typeof item.stats.hp !== 'number') return acc;
        return acc + Math.floor(item.stats.hp / 5);
    }, 0);

    // Occupied tiles map
    const occupied = new Set<string>();
    occupied.add(`${playerPos.x},${playerPos.y}`);
    updatedEntities.forEach(e => occupied.add(`${e.pos.x},${e.pos.y}`));

    for (let i = 0; i < updatedEntities.length; i++) {
        let ent = updatedEntities[i];
        if (ent.type !== 'ENEMY') continue;

        const dist = Math.abs(ent.pos.x - playerPos.x) + Math.abs(ent.pos.y - playerPos.y);
        const enemyStats = getEnemyStats(ent.name, ent.level || 1, worldTier);
        const aggro = ent.aggroRange || 6;

        // Remove self from occupied to allow move
        occupied.delete(`${ent.pos.x},${ent.pos.y}`);

        // 1. Attack if adjacent
        if (dist === 1) {
            const hitChance = calculateHitChance(enemyStats.accuracy / 2, 0, defLvl, armorBonus);
            const isHit = Math.random() < hitChance;
            let dmg = 0;
            
            animations[ent.id] = 'ATTACK';

            if (isHit) {
                // Scale enemy max hit by 4x to match the 100 HP baseline of the player
                const rawMaxHit = enemyStats.maxHit * 4;
                dmg = Math.floor(Math.random() * (rawMaxHit + 1));
                
                if (gameState.equippedPerks.includes('iron_skin')) dmg = Math.max(0, dmg - 2); // Buffed Iron Skin slightly
                
                if (dmg > 0) {
                    damageToPlayer += dmg;
                    logs.push({ id: uid(), message: `${ent.name} hit you for ${dmg}!`, type: 'COMBAT', timestamp: Date.now() });
                    animations['player'] = 'HURT';
                } else {
                    animations['player'] = 'DODGE';
                }
            } else {
                animations['player'] = 'DODGE';
            }
            // Turn used attacking
            occupied.add(`${ent.pos.x},${ent.pos.y}`);
            continue;
        }

        // 2. Chase if in range and LOS
        if (dist <= aggro && hasLineOfSight(ent.pos, playerPos, map)) {
            let dx = playerPos.x - ent.pos.x;
            let dy = playerPos.y - ent.pos.y;
            let targetX = ent.pos.x + (dx !== 0 ? Math.sign(dx) : 0);
            let targetY = ent.pos.y + (dy !== 0 ? Math.sign(dy) : 0);

            // Simple Axis Check (Try X, then Y)
            let moved = false;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (!occupied.has(`${targetX},${ent.pos.y}`) && !isBlocked(targetX, ent.pos.y, map)) {
                    ent.pos.x = targetX;
                    moved = true;
                }
            }
            
            if (!moved) {
                // Try Y
                targetY = ent.pos.y + (dy !== 0 ? Math.sign(dy) : 0);
                if (!occupied.has(`${ent.pos.x},${targetY}`) && !isBlocked(ent.pos.x, targetY, map)) {
                    ent.pos.y = targetY;
                    moved = true;
                }
            }
        }
        // 3. Roam randomly
        else {
             if (Math.random() < 0.2) {
                 const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                 const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
                 const nx = ent.pos.x + dx;
                 const ny = ent.pos.y + dy;
                 if (!occupied.has(`${nx},${ny}`) && !isBlocked(nx, ny, map)) {
                     ent.pos.x = nx;
                     ent.pos.y = ny;
                 }
             }
        }

        occupied.add(`${ent.pos.x},${ent.pos.y}`);
        updatedEntities[i] = ent;
    }

    return { updatedEntities, damageToPlayer, logs, animations };
};

const isBlocked = (x: number, y: number, map: GameMap) => {
    const tile = map.tiles[y]?.[x];
    if (!tile) return true;
    return ['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'LAVA'].includes(tile);
};

export const processSpawners = (map: GameMap, currentEntities: Entity[]): Entity[] => {
    const now = Date.now();
    let newEntities = [...currentEntities];
    
    currentEntities.forEach(e => {
        if (e.subType === 'MOB_SPAWNER') {
            if (now - (e.lastSpawnTime || 0) > 30000) {
                // Try Spawn
                const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                for (const [dx, dy] of dirs) {
                    const nx = e.pos.x + dx;
                    const ny = e.pos.y + dy;
                    if (!isBlocked(nx, ny, map) && !newEntities.some(ent => ent.pos.x === nx && ent.pos.y === ny)) {
                        newEntities.push({
                            id: `spawn_${uid()}`,
                            name: `Spawned ${e.spawnType || 'Skeleton'}`,
                            type: 'ENEMY',
                            symbol: (e.spawnType || 'S')[0],
                            color: 'red',
                            pos: {x: nx, y: ny},
                            hp: e.maxHp || 20,
                            maxHp: e.maxHp || 20,
                            level: e.level || 1,
                            aiType: 'MELEE'
                        });
                        e.lastSpawnTime = now;
                        break;
                    }
                }
            }
        }
    });
    return newEntities;
};
