
// OSRS-inspired simplified formulas adapted for 10x HP Scale

export const calculateMaxHit = (strengthLvl: number, weaponPower: number): number => {
    // Effective Strength = Level + 8 (Stance hidden bonus approximation)
    const effectiveStr = strengthLvl + 8;
    
    // Max Hit = 0.5 + A * (B+64) / 96
    // Adjusted divisor to 96 (Targeting ~10 dmg at lvl 1 with starter gear vs 15 HP enemies)
    // A = Effective Strength
    // B = Equipment Strength (Weapon Power)
    const maxHit = Math.floor(0.5 + (effectiveStr * (weaponPower + 64)) / 96);
    return Math.max(1, maxHit);
};

export const calculateHitChance = (attackLvl: number, weaponAccuracy: number, targetDefenceLvl: number, targetDefenceBonus: number): number => {
    const effectiveAtk = attackLvl + 8;
    const maxAttackRoll = effectiveAtk * (weaponAccuracy + 64);
    
    const effectiveDef = targetDefenceLvl + 8;
    const maxDefenceRoll = effectiveDef * (targetDefenceBonus + 64);

    let hitChance = 0;
    if (maxAttackRoll > maxDefenceRoll) {
        hitChance = 1 - (maxDefenceRoll + 2) / (2 * (maxAttackRoll + 1));
    } else {
        hitChance = maxAttackRoll / (2 * (maxDefenceRoll + 1));
    }
    
    return Math.max(0.05, Math.min(0.95, hitChance));
};

export const calculateXpDrop = (damage: number): { hpXp: number, combatXp: number } => {
    // XP adjusted for damage scale
    // Total 2.0 XP per damage (Damage is higher, so ratio is lower than OSRS 4.0)
    const hpXp = Math.floor(damage * 0.7);
    const combatXp = Math.floor(damage * 1.3);
    return { hpXp, combatXp };
};
