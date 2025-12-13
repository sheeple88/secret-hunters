
import { GameState, Entity, LogEntry, AnimationType, SkillName } from '../types';
import { calculateSkillLevel, SCALE_FACTOR, uid, WEAPON_TEMPLATES, MONSTER_TEMPLATES } from '../constants';
import { generateLoot } from '../services/itemService';

interface CombatResult {
    damage: number;
    isHit: boolean;
    logs: LogEntry[];
    xpGained: { skill: SkillName, amount: number }[];
    loot?: any;
}

// Formula: Max hit based on Strength and Weapon Power
// Max Hit = 1.3 + (Strength / 10) + (WeaponPower / 8) + (Str * Power / 64)
const calculateMaxHit = (strengthLvl: number, weaponPower: number): number => {
    return Math.floor(1.3 + (strengthLvl / 10) + (weaponPower / 8) + ((strengthLvl * weaponPower) / 64));
};

// Formula: Accuracy Roll = Attack Level * (WeaponAccuracy + 64)
const calculateAttackRoll = (attackLvl: number, weaponAccuracy: number): number => {
    return Math.floor(attackLvl * (weaponAccuracy + 64));
};

// Formula: Defence Roll = Defence Level * (Armor + 64) + Weakness Penalty
const calculateDefenceRoll = (defenceLvl: number, weaknessMultiplier: number = 1.0): number => {
    // Weakness reduces effective defense
    return Math.floor((defenceLvl * 64) * weaknessMultiplier); 
};

export const resolveCombat = (attacker: GameState, target: Entity, worldTier: number): CombatResult => {
    const logs: LogEntry[] = [];
    const xpGained: { skill: SkillName, amount: number }[] = [];
    
    // 1. Get Attacker Stats
    const weapon = attacker.equipment.WEAPON?.weaponStats || WEAPON_TEMPLATES['Sword']; // Default to Sword stats if unarmed (fists)
    
    // Determine skills used
    let attackSkill: SkillName = 'Attack';
    let strengthSkill: SkillName = 'Strength';
    
    if (weapon.damageType === 'RANGED') {
        attackSkill = 'Dexterity';
        strengthSkill = 'Dexterity'; // Ranged uses Dex for both in this simplified model
    } else if (weapon.damageType === 'MAGIC') {
        attackSkill = 'Alchemy'; // Using Alchemy as proxy for Int/Magic skill for now
        strengthSkill = 'Alchemy'; 
    }

    const attackLvl = attacker.skills[attackSkill].level;
    const strengthLvl = attacker.skills[strengthSkill].level;
    
    // 2. Get Defender Stats (Target)
    // Scale enemy stats based on world tier and level
    const enemyLevel = target.level || 1;
    // Base Defence from template + Level Scaling + Tier Scaling
    const templateDef = target.defence || 0;
    const effectiveEnemyDef = Math.floor((templateDef + enemyLevel) * (1 + worldTier * 0.5));
    
    // Check Weakness
    let weaknessMult = 1.0;
    if (target.weakness && target.weakness === weapon.damageType) {
        weaknessMult = 0.5; // 50% reduced defence roll if using correct style
        logs.push({ id: uid(), message: "Hit Weakness!", type: 'COMBAT', timestamp: Date.now() });
    }

    // 3. Rolls
    const atkRoll = calculateAttackRoll(attackLvl, weapon.accuracy);
    const defRoll = calculateDefenceRoll(effectiveEnemyDef, weaknessMult);
    
    let hitChance = 0;
    if (atkRoll > defRoll) {
        hitChance = 1 - (defRoll + 2) / (2 * (atkRoll + 1));
    } else {
        hitChance = atkRoll / (2 * (defRoll + 1));
    }
    
    // Cap hit chance
    hitChance = Math.max(0.05, Math.min(0.95, hitChance)); // Always 5% chance to hit or miss

    // 4. Resolve
    const isHit = Math.random() < hitChance;
    let damage = 0;

    if (isHit) {
        const maxHit = calculateMaxHit(strengthLvl, weapon.power);
        // Roll damage 0 to Max
        damage = Math.floor(Math.random() * (maxHit + 1));
        
        // Crit Check
        if (Math.random() < weapon.critChance) {
            damage = Math.floor(damage * weapon.critMult);
            logs.push({ id: uid(), message: "Critical Hit!", type: 'COMBAT', timestamp: Date.now() });
        }
        
        // Min damage 1 on successful hit calculation unless roll was 0
        if (damage === 0) damage = 1;
    }

    // 5. Rewards (XP)
    // 4 XP per damage dealt
    const damageXp = damage * 4;
    // Split: 1.33 HP, 2.66 Style
    xpGained.push({ skill: 'Constitution', amount: Math.floor(damageXp / 3) });
    xpGained.push({ skill: attackSkill, amount: Math.floor((damageXp * 2) / 3) });

    return {
        damage,
        isHit,
        logs,
        xpGained
    };
};
