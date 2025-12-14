
import { GameState, Entity } from '../../types';
import { MAPS, calculateSkillLevel, SCALE_FACTOR, uid, MONSTER_TEMPLATES, WEAPON_TEMPLATES } from '../../constants';
import { playSound } from '../../services/audioService';
import { generateLoot } from '../../services/itemService';

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

    // 3. Resolve Combat (Simplified Inline for robustness)
    const weapon = gameState.equipment.WEAPON?.weaponStats || WEAPON_TEMPLATES['Sword'];
    const strengthLvl = gameState.skills.Strength.level;
    const attackLvl = gameState.skills.Attack.level;
    
    // Simple Hit Calc
    const hitChance = 0.7 + (attackLvl * 0.01);
    const isHit = Math.random() < hitChance;
    let damage = 0;

    if (isHit) {
        // Max Hit = (Str / 10) + WeaponPower
        const maxHit = Math.max(1, Math.floor(strengthLvl / 5) + weapon.power);
        damage = Math.floor(Math.random() * maxHit) + 1;
        
        if (Math.random() < weapon.critChance) {
            damage = Math.floor(damage * weapon.critMult);
        }
    }

    playSound(isHit ? 'HIT' : 'ATTACK');
    if (isHit) {
        damageEvents[target.id] = damage;
    }
    
    let newLogs = [...gameState.logs];
    let newSkills = { ...gameState.skills };
    let newStats = { ...gameState.stats };
    let newCounters = { ...gameState.counters };
    let newInventory = [...gameState.inventory];
    let newEntities = [...map.entities];
    let newBestiary = [...gameState.bestiary];

    if (isHit) {
        newLogs.push({ id: uid(), message: `Hit ${target.name} for ${damage}`, type: 'COMBAT', timestamp: Date.now() });
    } else {
        newLogs.push({ id: uid(), message: `Missed ${target.name}`, type: 'COMBAT', timestamp: Date.now() });
    }

    // Apply XP
    const xpAmount = damage * 2;
    ['Strength', 'Attack', 'Constitution'].forEach(skillName => {
        const skill = newSkills[skillName as any];
        const newXpVal = skill.xp + Math.floor(xpAmount/3);
        const newLvl = calculateSkillLevel(newXpVal);
        
        if (newLvl > skill.level) {
            playSound('LEVEL_UP');
            newLogs.push({ id: uid(), message: `${skillName} leveled up to ${newLvl}!`, type: 'SKILL', timestamp: Date.now() });
            
            if (skillName === 'Constitution') {
                const bonus = Math.floor(10 * Math.pow(SCALE_FACTOR, newLvl));
                newStats.maxHp += bonus;
                newStats.hp += bonus;
            }
        }
        newSkills[skillName as any] = { ...skill, xp: newXpVal, level: newLvl };
    });

    // Apply Damage
    const newTargetHp = (target.hp || 0) - damage;
    
    if (damage > (newCounters['max_hit_dealt'] || 0)) {
        newCounters['max_hit_dealt'] = damage;
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
