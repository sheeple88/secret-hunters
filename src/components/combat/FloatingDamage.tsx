
import React from 'react';

interface FloatingDamageProps {
    value: number;
    type?: 'HIT' | 'CRIT' | 'MISS' | 'HEAL';
}

export const FloatingDamage: React.FC<FloatingDamageProps> = ({ value, type = 'HIT' }) => {
    let color = 'text-red-500';
    let scale = 'scale-100';
    let text = `-${value}`;

    if (type === 'MISS') {
        color = 'text-stone-400';
        text = 'MISS';
    } else if (type === 'CRIT') {
        color = 'text-red-600';
        scale = 'scale-150';
        text = `!${value}!`;
    } else if (type === 'HEAL') {
        color = 'text-green-400';
        text = `+${value}`;
    }

    return (
        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 font-bold font-vt323 z-50 animate-bounce ${color} ${scale} drop-shadow-md text-sm pointer-events-none`}>
            {text}
        </div>
    );
};
