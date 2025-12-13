
import React from 'react';

interface EnemyHPBarProps {
    hp: number;
    maxHp: number;
}

export const EnemyHPBar: React.FC<EnemyHPBarProps> = ({ hp, maxHp }) => {
    const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    return (
        <div className="absolute -top-2 left-0 w-full h-1 bg-black/60 border border-black/80 rounded-sm overflow-hidden z-40">
            <div 
                className="h-full bg-red-500 transition-all duration-200" 
                style={{ width: `${pct}%` }}
            />
        </div>
    );
};
