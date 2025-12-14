
import { GameState, Position, Entity, LogEntry, SkillName } from '../types';
import { MAPS, WEAPON_STATS, ENEMIES, ITEMS, RESOURCE_NODES, uid, SCALE_FACTOR, calculateSkillLevel } from '../data/Registry';
import { generateDungeon } from './WorldGen';

// --- HELPERS ---
const isBlocked = (map: any, x: number, y: number) => {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
    const tile = map.tiles[y][x];
    const blockedTiles = ['WALL', 'TREE', 'ROCK', 'WATER', 'LAVA', 'ROOF', 'CRACKED_WALL'];
    if (blockedTiles.includes(tile)) return true;
    const ent = map.entities.find((e: Entity) => e.pos.x === x && e.pos.y === y);
    if (ent && ['ENEMY', 'NPC', 'OBJECT'].includes(ent.type) && ent.subType !== 'DOOR') return true;
    return false;
};

// --- CORE LOGIC ---

export const handleInput = (state: GameState, dx: number, dy: number): { newState: GameState, events: any } => {
    if (state.stats.hp <= 0) return { newState: state, events: {} };

    let newState = { ...state };
    const map = MAPS[newState.currentMapId];
    const { x, y } = newState.playerPos;
    const nx = x + dx;
    const ny = y + dy;
    let events: any = {};
    let didAction = false;

    newState.playerFacing = dx > 0 ? 'RIGHT' : dx < 0 ? 'LEFT' : dy > 0 ? 'DOWN' : 'UP';

    // 1. Map Transition (Edges)
    if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) {
        let nextMapId = null;
        if (nx < 0) nextMapId = map.neighbors.LEFT;
        else if (nx >= map.width) nextMapId = map.neighbors.RIGHT;
        else if (ny < 0) nextMapId = map.neighbors.UP;
        else if (ny >= map.height) nextMapId = map.neighbors.DOWN;

        if (nextMapId && MAPS[nextMapId]) {
            newState.currentMapId = nextMapId;
            const nextMap = MAPS[nextMapId];
            newState.playerPos = { 
                x: nx < 0 ? nextMap.width - 1 : nx >= map.width ? 0 : nx, 
                y: ny < 0 ? nextMap.height - 1 : ny >= map.height ? 0 : ny 
            };
            return { newState, events: { transition: true } };
        }
        return { newState, events: {} };
    }

    // 2. Interaction / Combat
    const targetEntity = map.entities.find(e => e.pos.x === nx && e.pos.y === ny);
    
    if (targetEntity) {
        if (targetEntity.type === 'ENEMY') {
            // ATTACK
            const result = resolveCombat(newState, targetEntity);
            events.damage = result.damage;
            events.targetId = targetEntity.id;
            
            newState.logs = [...newState.logs, ...result.logs].slice(-50);
            
            // Apply XP
            result.xp.forEach(x => {
                const skill = newState.skills[x.skill] || { name: x.skill, level: 1, xp: 0 };
                skill.xp += x.amount;
                const newLvl = calculateSkillLevel(skill.xp);
                if (newLvl > skill.level) newState.logs.push({ id: uid(), message: `${x.skill} Lv.${newLvl}!`, type: 'SKILL', timestamp: Date.now() });
                skill.level = newLvl;
                newState.skills[x.skill] = skill;
            });

            if (result.killed) {
                map.entities = map.entities.filter(e => e.id !== targetEntity.id);
                newState.counters.enemies_killed = (newState.counters.enemies_killed || 0) + 1;
                // Simple Loot
                if (Math.random() > 0.5) newState.inventory.push({ ...ITEMS['potion_small'], id: uid() });
            } else {
                // Update Enemy HP
                const idx = map.entities.findIndex(e => e.id === targetEntity.id);
                if (idx !== -1) map.entities[idx].hp = (targetEntity.hp || 0) - result.damage;
            }
            didAction = true;
        } else if (targetEntity.destination) {
            // TELEPORT / DOOR
            const dest = targetEntity.destination;
            newState.currentMapId = dest.mapId;
            newState.playerPos = { x: dest.x, y: dest.y };
            return { newState, events: { transition: true } };
        }
    } else {
        // 3. Movement or Gathering
        const tile = map.tiles[ny][nx];
        const resource = RESOURCE_NODES.find(r => r.tileTypes.includes(tile));
        
        if (resource) {
            // GATHER
            const skill = newState.skills['Mining']; // Simplified
            if (Math.random() < 0.8) { // Success
                newState.inventory.push({ ...ITEMS[resource.loot], id: uid() });
                newState.logs.push({ id: uid(), message: `Gathered ${resource.loot}`, type: 'LOOT', timestamp: Date.now() });
                // Deplete logic would modify worldModified map
            }
            didAction = true;
        } else if (!isBlocked(map, nx, ny)) {
            // MOVE
            newState.playerPos = { x: nx, y: ny };
            didAction = true;
            newState.counters.steps_taken = (newState.counters.steps_taken || 0) + 1;
            
            // Check Dungeon Enter
            if (tile.startsWith('ENTRANCE')) {
                const dId = `dungeon_${newState.currentMapId}_${nx}_${ny}`;
                if (!MAPS[dId]) MAPS[dId] = generateDungeon(dId, map.difficulty);
                newState.currentMapId = dId;
                newState.playerPos = { x: 10, y: 10 };
            }
        }
    }

    // 4. Enemy Turn (AI)
    if (didAction) {
        const { damage, logs } = processAI(newState, map);
        if (damage > 0) {
            newState.stats.hp -= damage;
            newState.logs = [...newState.logs, ...logs];
            events.playerDamage = damage;
        }
    }

    // 5. Exploration Update
    if (!newState.exploration[newState.currentMapId]) {
        newState.exploration[newState.currentMapId] = Array(map.height).fill(null).map(() => Array(map.width).fill(0));
    }
    const rad = 5;
    for(let ry = -rad; ry <= rad; ry++) {
        for(let rx = -rad; rx <= rad; rx++) {
            const tx = newState.playerPos.x + rx;
            const ty = newState.playerPos.y + ry;
            if (tx >= 0 && tx < map.width && ty >= 0 && ty < map.height) {
                newState.exploration[newState.currentMapId][ty][tx] = 1;
            }
        }
    }

    return { newState, events };
};

const resolveCombat = (state: GameState, enemy: Entity): { damage: number, killed: boolean, logs: LogEntry[], xp: any[] } => {
    const weapon = state.equipment.WEAPON?.weaponStats || WEAPON_STATS['Sword'];
    const str = state.skills.Strength.level;
    const maxHit = Math.floor(1 + str/5 + weapon.power/2);
    const damage = Math.floor(Math.random() * maxHit) + 1;
    
    const logs = [{ id: uid(), message: `Hit ${enemy.name} for ${damage}`, type: 'COMBAT' as const, timestamp: Date.now() }];
    const xp = [{ skill: 'Strength' as SkillName, amount: damage * 4 }];
    
    return { damage, killed: (enemy.hp || 0) - damage <= 0, logs, xp };
};

const processAI = (state: GameState, map: any): { damage: number, logs: LogEntry[] } => {
    let damage = 0;
    const logs: LogEntry[] = [];
    
    map.entities.forEach((ent: Entity) => {
        if (ent.type !== 'ENEMY') return;
        const dist = Math.abs(ent.pos.x - state.playerPos.x) + Math.abs(ent.pos.y - state.playerPos.y);
        
        if (dist <= 1) {
            // Attack
            const dmg = Math.floor(Math.random() * 5); // Simplifed
            if (dmg > 0) {
                damage += dmg;
                logs.push({ id: uid(), message: `${ent.name} hits you for ${dmg}`, type: 'COMBAT', timestamp: Date.now() });
            }
        } else if (dist < 6) {
            // Move
            const dx = state.playerPos.x - ent.pos.x;
            const dy = state.playerPos.y - ent.pos.y;
            let nx = ent.pos.x + (dx !== 0 ? Math.sign(dx) : 0);
            let ny = ent.pos.y + (dy !== 0 ? Math.sign(dy) : 0);
            
            if (!isBlocked(map, nx, ent.pos.y)) ent.pos.x = nx;
            else if (!isBlocked(map, ent.pos.x, ny)) ent.pos.y = ny;
        }
    });
    
    return { damage, logs };
};
