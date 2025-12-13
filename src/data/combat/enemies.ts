
import { DamageType } from '../../types';
import { SCALE_FACTOR } from '../../constants';

export interface EnemyTemplate {
    baseHp: number;
    baseDmg: number;
    defence: number;
    weakness?: DamageType;
    xpMod: number;
    attackSound?: string;
}

export const ENEMY_TEMPLATES: Record<string, EnemyTemplate> = {
    'Slime': { baseHp: 30, baseDmg: 2, defence: 2, weakness: 'SLASH', xpMod: 0.8 },
    'Rat': { baseHp: 20, baseDmg: 3, defence: 1, weakness: 'STAB', xpMod: 0.8 },
    'Bat': { baseHp: 15, baseDmg: 2, defence: 5, weakness: 'RANGED', xpMod: 0.8 },
    'Snake': { baseHp: 25, baseDmg: 4, defence: 3, weakness: 'SLASH', xpMod: 1.0 },
    'Spider': { baseHp: 30, baseDmg: 3, defence: 3, weakness: 'CRUSH', xpMod: 1.0 },
    'Wolf': { baseHp: 60, baseDmg: 6, defence: 5, weakness: 'STAB', xpMod: 1.3 },
    'Goblin': { baseHp: 50, baseDmg: 4, defence: 5, weakness: 'SLASH', xpMod: 1.2 },
    'Skeleton': { baseHp: 60, baseDmg: 5, defence: 10, weakness: 'CRUSH', xpMod: 1.3 },
    'Zombie': { baseHp: 80, baseDmg: 3, defence: 2, weakness: 'SLASH', xpMod: 1.3 },
    'Ghost': { baseHp: 40, baseDmg: 6, defence: 50, weakness: 'MAGIC', xpMod: 1.5 },
    'Bear': { baseHp: 120, baseDmg: 8, defence: 15, weakness: 'MAGIC', xpMod: 1.8 },
    'Ice Golem': { baseHp: 160, baseDmg: 8, defence: 30, weakness: 'CRUSH', xpMod: 2.0 },
    'Dragon': { baseHp: 600, baseDmg: 25, defence: 60, weakness: 'STAB', xpMod: 5.0 },
};

export const getEnemyStats = (name: string, level: number, tier: number) => {
    // Find matching template or partial match
    let key = Object.keys(ENEMY_TEMPLATES).find(k => name.includes(k)) || 'Slime';
    const tmpl = ENEMY_TEMPLATES[key];
    
    // Scaling Logic
    const tierMult = 1 + (tier * 0.5);
    const hp = Math.floor(tmpl.baseHp * Math.pow(SCALE_FACTOR, level) * tierMult);
    const maxHit = Math.max(1, Math.floor(tmpl.baseDmg * Math.pow(SCALE_FACTOR, level)));
    const accuracy = Math.floor(level * (1 + tier * 0.2) * 50); // Raw accuracy roll base

    return { ...tmpl, hp, maxHp: hp, maxHit, accuracy };
};
