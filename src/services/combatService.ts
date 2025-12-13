
import { GameState, Entity, SkillName, LogEntry } from '../types';
import { uid } from '../constants';
import { calculateMaxHit, calculateHitChance, calculateXpDrop } from '../systems/combat/combatCore';
import { BASE_WEAPON_STATS } from '../data/combat/weapons';
import { getEnemyStats } from '../data/combat/enemies';

export interface CombatResult {
    damage: number;
    isHit: boolean;
    logs: LogEntry[];
    xpGained: { skill: SkillName, amount: number }[];
    isKill: boolean;
}

export const resolvePlayerAttack = (gameState: GameState, target: Entity): CombatResult => {
    const logs: LogEntry[] = [];
    const weapon = gameState.equipment.WEAPON?.weaponStats || BASE_WEAPON_STATS['SWORD'];
    
    // Determine Combat Style Skills
    let atkSkill: SkillName = 'Attack';
    let strSkill: SkillName = 'Strength';
    
    if (weapon.damageType === 'RANGED') {
        atkSkill = 'Dexterity';
        strSkill = 'Dexterity';
    } else if (weapon.damageType === 'MAGIC') {
        atkSkill = 'Alchemy'; // Using Alchemy as placeholder for Magic skill
        strSkill = 'Alchemy';
    }

    const atkLvl = gameState.skills[atkSkill]?.level || 1;
    const strLvl = gameState.skills[strSkill]?.level || 1;

    // Enemy Stats
    const enemyStats = getEnemyStats(target.name, target.level || 1, gameState.worldTier || 0);
    
    // Weakness Check
    let accMult = 1.0;
    if (enemyStats.weakness === weapon.damageType) {
        accMult = 1.2; // 20% Accuracy Bonus vs Weakness
        logs.push({ id: uid(), message: "Weakness hit!", type: 'COMBAT', timestamp: Date.now() });
    }

    // Roll
    const rawHitChance = calculateHitChance(atkLvl, weapon.accuracy, enemyStats.defence, 0); // 0 extra armor for mobs
    const hitChance = rawHitChance * accMult;
    const isHit = Math.random() < hitChance;

    let damage = 0;
    if (isHit) {
        const maxHit = calculateMaxHit(strLvl, weapon.power);
        damage = Math.floor(Math.random() * (maxHit + 1));
        
        // Crit Check
        if (Math.random() < weapon.critChance) {
            damage = Math.floor(damage * weapon.critMult);
            logs.push({ id: uid(), message: "Critical Hit!", type: 'COMBAT', timestamp: Date.now() });
        }
        
        // Min Damage 1 on hit
        if (damage === 0) damage = 1;
    }

    // XP
    const { hpXp, combatXp } = calculateXpDrop(damage);
    const xpGained = [
        { skill: 'Constitution' as SkillName, amount: hpXp },
        { skill: atkSkill, amount: combatXp }
    ];

    return {
        damage,
        isHit,
        logs,
        xpGained,
        isKill: (target.hp || 0) - damage <= 0
    };
};
