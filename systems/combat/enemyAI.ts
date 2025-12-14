
import { Entity, GameState, GameMap, AnimationType, Item } from '../../types';
import { MONSTER_TEMPLATES, SCALE_FACTOR, uid } from '../../constants';
import { hasLineOfSight } from '../ai'; 

export interface TurnResult {
    updatedEntities: Entity[];
    damageToPlayer: number;
    logs: any[];
    animations: Record<string, AnimationType>;
    numbers: Record<string, number>;
}

export const processEnemyTurn = (gameState: GameState, map: GameMap): TurnResult => {
    const { playerPos, stats: playerStats, equipment, skills, worldTier } = gameState;
    let damageToPlayer = 0;
    const logs: any[] = [];
    const animations: Record<string, AnimationType> = {};
    const numbers: Record<string, number> = {};
    const updatedEntities = [...map.entities];

    // Player defence
    const defLvl = skills['Defence']?.level || 1;
    const equipmentItems = Object.values(equipment) as (Item | null)[];
    const armorBonus = equipmentItems.reduce((acc: number, item: Item | null) => {
        if (!item || !item.stats || typeof item.stats.hp !== 'number') return acc;
        return acc + Math.floor(item.stats.hp / 5);
    }, 0);

    const occupied = new Set<string>();
    occupied.add(`${playerPos.x},${playerPos.y}`);
    updatedEntities.forEach(e => occupied.add(`${e.pos.x},${e.pos.y}`));

    for (let i = 0; i < updatedEntities.length; i++) {
        let ent = updatedEntities[i];
        if (ent.type !== 'ENEMY') continue;

        const dist = Math.abs(ent.pos.x - playerPos.x) + Math.abs(ent.pos.y - playerPos.y);
        const aggro = ent.aggroRange || 6;

        occupied.delete(`${ent.pos.x},${ent.pos.y}`);

        // Attack
        if (dist === 1) {
            // Simplified hit chance
            const hitChance = 0.5 + (ent.level || 1) * 0.02;
            const isHit = Math.random() < hitChance;
            let dmg = 0;
            
            animations[ent.id] = 'ATTACK';

            if (isHit) {
                // Find Template
                let baseName = ent.name.split(' ').pop() || 'Slime';
                const template = MONSTER_TEMPLATES[baseName] || MONSTER_TEMPLATES['Slime'];
                const baseDmg = Math.max(1, Math.floor(template.baseDmg * Math.pow(SCALE_FACTOR, ent.level || 1)));
                
                dmg = Math.floor(Math.random() * baseDmg) + 1;
                
                // Armor Mitigation
                dmg = Math.max(0, dmg - Math.floor(armorBonus / 10));

                if (gameState.equippedPerks.includes('iron_skin')) dmg = Math.max(0, dmg - 1); 
                
                if (dmg > 0) {
                    damageToPlayer += dmg;
                    logs.push({ id: uid(), message: `${ent.name} hit you for ${dmg}!`, type: 'COMBAT', timestamp: Date.now() });
                    animations['player'] = 'HURT';
                    numbers['player'] = (numbers['player'] || 0) + dmg;
                } else {
                    animations['player'] = 'DODGE';
                }
            } else {
                animations['player'] = 'DODGE';
            }
            occupied.add(`${ent.pos.x},${ent.pos.y}`);
            continue;
        }

        // Chase
        if (dist <= aggro && hasLineOfSight(ent.pos, playerPos, map)) {
            let dx = playerPos.x - ent.pos.x;
            let dy = playerPos.y - ent.pos.y;
            let targetX = ent.pos.x + (dx !== 0 ? Math.sign(dx) : 0);
            let targetY = ent.pos.y + (dy !== 0 ? Math.sign(dy) : 0);

            let moved = false;
            // Try X
            if (Math.abs(dx) > Math.abs(dy)) {
                if (!occupied.has(`${targetX},${ent.pos.y}`) && !isBlocked(targetX, ent.pos.y, map)) {
                    ent.pos.x = targetX;
                    moved = true;
                }
            }
            // Try Y
            if (!moved) {
                targetY = ent.pos.y + (dy !== 0 ? Math.sign(dy) : 0);
                if (!occupied.has(`${ent.pos.x},${targetY}`) && !isBlocked(ent.pos.x, targetY, map)) {
                    ent.pos.y = targetY;
                    moved = true;
                }
            }
        }

        occupied.add(`${ent.pos.x},${ent.pos.y}`);
        updatedEntities[i] = ent;
    }

    return { updatedEntities, damageToPlayer, logs, animations, numbers };
};

const isBlocked = (x: number, y: number, map: GameMap) => {
    const tile = map.tiles[y]?.[x];
    if (!tile) return true;
    return ['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'LAVA'].includes(tile);
};
