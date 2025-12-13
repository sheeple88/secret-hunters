
import { GameState, Entity, SkillName } from '../../types';
import { MAPS, calculateSkillLevel, SCALE_FACTOR } from '../../constants';
import { resolvePlayerAttack } from '../../services/combatService';
import { generateLoot } from '../../services/itemService';
import { playSound } from '../../services/audioService';
import { uid } from '../../constants';

// Helper to add inventory
const addToInv = (item: any, inventory: any[]) => {
    if (['MATERIAL', 'CONSUMABLE'].includes(item.type)) {
        const exist = inventory.find(i => i.id === item.id);
        if (exist) return inventory.map(i => i.id === item.id ? {...i, count: i.count + 1} : i);
    }
    return [...inventory, item];
};

export const handlePlayerAttack = (gameState: GameState): { newState: GameState, damageEvents: Record<string, number> } => {
    const { playerPos, playerFacing, currentMapId } = gameState;
    const map = MAPS[currentMapId];
    const damageEvents: Record<string, number> = {};
    
    // 1. Determine Target Tile
    let tx = playerPos.x;
    let ty = playerPos.y;
    if (playerFacing === 'UP') ty--;
    if (playerFacing === 'DOWN') ty++;
    if (playerFacing === 'LEFT') tx--;
    if (playerFacing === 'RIGHT') tx++;

    // 2. Find Target
    const targetIndex = map.entities.findIndex(e => e.pos.x === tx && e.pos.y === ty);
    if (targetIndex === -1) {
        playSound('ATTACK');
        return {
            newState: {
                ...gameState,
                animations: { ...gameState.animations, player: 'ATTACK' },
                lastCombatTime: Date.now()
            },
            damageEvents
        };
    }

    const target = map.entities[targetIndex];
    if (target.type !== 'ENEMY' && target.subType !== 'MOB_SPAWNER') {
        return { newState: gameState, damageEvents };
    }

    // 3. Resolve Combat
    const result = resolvePlayerAttack(gameState, target);
    
    playSound(result.isHit ? 'HIT' : 'ATTACK');
    if (result.isHit) {
        damageEvents[target.id] = result.damage;
    }
    
    let newLogs = [...gameState.logs, ...result.logs];
    let newSkills = { ...gameState.skills };
    let newStats = { ...gameState.stats };
    let newCounters = { ...gameState.counters };
    let newInventory = [...gameState.inventory];
    let newEntities = [...map.entities];
    let newBestiary = [...gameState.bestiary];

    // Apply XP
    result.xpGained.forEach(xp => {
        if (!newSkills[xp.skill]) newSkills[xp.skill] = { name: xp.skill, level: 1, xp: 0 };
        const skill = newSkills[xp.skill];
        const newXpVal = skill.xp + xp.amount;
        const newLvl = calculateSkillLevel(newXpVal);
        
        if (newLvl > skill.level) {
            playSound('LEVEL_UP');
            newLogs.push({ id: uid(), message: `${xp.skill} leveled up to ${newLvl}!`, type: 'SKILL', timestamp: Date.now() });
            
            // Const HP Gain
            if (xp.skill === 'Constitution') {
                const bonus = Math.floor(10 * Math.pow(SCALE_FACTOR, newLvl));
                newStats.maxHp += bonus;
                newStats.hp += bonus;
            }
        }
        newSkills[xp.skill] = { ...skill, xp: newXpVal, level: newLvl };
    });

    // Apply Damage
    const newTargetHp = (target.hp || 0) - result.damage;
    
    // Counter Stats
    if (result.damage > (newCounters['max_hit_dealt'] || 0)) {
        newCounters['max_hit_dealt'] = result.damage;
    }

    if (newTargetHp <= 0) {
        // Kill Logic
        playSound('KILL');
        newEntities.splice(targetIndex, 1);
        newCounters['enemies_killed'] = (newCounters['enemies_killed'] || 0) + 1;
        
        // Loot
        const loot = generateLoot(target.level || 1, target.name);
        if (loot) {
            newInventory = addToInv(loot, newInventory);
            newLogs.push({ id: uid(), message: `Looted ${loot.name}`, type: 'LOOT', timestamp: Date.now() });
        }
        
        if (!newBestiary.includes(target.name)) newBestiary.push(target.name);
        
        newLogs.push({ id: uid(), message: `Slain: ${target.name}`, type: 'COMBAT', timestamp: Date.now() });
    } else {
        newEntities[targetIndex] = { ...target, hp: newTargetHp };
    }

    // Update Map
    MAPS[currentMapId].entities = newEntities;

    return {
        newState: {
            ...gameState,
            skills: newSkills,
            stats: newStats,
            counters: newCounters,
            inventory: newInventory,
            logs: newLogs,
            bestiary: newBestiary,
            animations: { ...gameState.animations, player: 'ATTACK', [target.id]: 'HURT' },
            lastCombatTime: Date.now(),
        },
        damageEvents
    };
};
