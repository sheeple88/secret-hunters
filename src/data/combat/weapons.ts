
import { WeaponStats, WeaponType, DamageType } from '../../types';

export const COMBAT_STYLES = {
    SLASH: { name: 'Slash', bonus: 'str' },
    CRUSH: { name: 'Crush', bonus: 'str' },
    STAB: { name: 'Stab', bonus: 'dex' },
    RANGED: { name: 'Ranged', bonus: 'dex' },
    MAGIC: { name: 'Magic', bonus: 'int' }
};

export const BASE_WEAPON_STATS: Record<WeaponType, WeaponStats> = {
    'SWORD': { type: 'SWORD', damageType: 'SLASH', power: 10, accuracy: 10, critChance: 0.05, critMult: 1.5, range: 1 },
    'AXE': { type: 'AXE', damageType: 'SLASH', power: 14, accuracy: 8, critChance: 0.1, critMult: 2.0, range: 1 },
    'MACE': { type: 'MACE', damageType: 'CRUSH', power: 15, accuracy: 8, critChance: 0.05, critMult: 1.8, range: 1 },
    'DAGGER': { type: 'DAGGER', damageType: 'STAB', power: 6, accuracy: 20, critChance: 0.2, critMult: 2.5, range: 1, multiHitChance: 0.3 },
    'SPEAR': { type: 'SPEAR', damageType: 'STAB', power: 12, accuracy: 12, critChance: 0.05, critMult: 1.5, range: 2 },
    'BOW': { type: 'BOW', damageType: 'RANGED', power: 10, accuracy: 15, critChance: 0.1, critMult: 1.5, range: 4 },
    'STAFF': { type: 'STAFF', damageType: 'MAGIC', power: 12, accuracy: 10, critChance: 0.05, critMult: 1.5, range: 3 },
    'ROD': { type: 'ROD', damageType: 'CRUSH', power: 5, accuracy: 5, critChance: 0.01, critMult: 1.2, range: 3 },
};
