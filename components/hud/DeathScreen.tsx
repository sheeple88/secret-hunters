
import React from 'react';
import { Skull } from 'lucide-react';

interface DeathScreenProps {
  onRespawn: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({ onRespawn }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-center animate-fade-in">
        <Skull className="w-32 h-32 text-red-600 mb-6 animate-pulse"/>
        <h1 className="text-6xl font-bold text-red-600 mb-4 font-vt323">YOU DIED</h1>
        <button onClick={onRespawn} className="px-8 py-4 bg-stone-800 border-2 border-red-800 text-red-500 text-2xl hover:bg-stone-700 hover:text-red-400 transition-all rounded">RESPAWN</button>
    </div>
  );
};
