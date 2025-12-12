
import React from 'react';
import { Entity, AnimationType } from '../types';
import { ASSETS } from '../constants';
import clsx from 'clsx';

interface EntityProps {
  entity: Entity;
  isPlayer?: boolean;
  isActiveWaypoint?: boolean; // New prop for visual state
  animation?: AnimationType; // New prop for combat animations
}

export const EntityComponent: React.FC<EntityProps> = ({ entity, isPlayer, isActiveWaypoint, animation }) => {
  const { x, y } = entity.pos;
  
  // Asset Selection
  let sprite = ASSETS.SLIME; // Default fallback
  
  if (isPlayer) sprite = ASSETS.PLAYER;
  else if (entity.type === 'NPC') {
      if (entity.name.includes('Mayor')) sprite = ASSETS.MAYOR;
      else if (entity.name.includes('Merchant') || entity.name.includes('Blacksmith')) sprite = ASSETS.MERCHANT;
      else sprite = ASSETS.NPC;
  }
  else if (entity.type === 'ENEMY') {
      if (entity.name.includes('Bat')) sprite = ASSETS.BAT;
      else if (entity.name.includes('Skeleton')) sprite = ASSETS.SKELETON;
      else if (entity.name.includes('Rat')) sprite = ASSETS.RAT;
      else if (entity.name.includes('Spider')) sprite = ASSETS.SPIDER;
      else if (entity.name.includes('Goblin')) sprite = ASSETS.GOBLIN;
      else if (entity.name.includes('Ghost')) sprite = ASSETS.GHOST;
      else if (entity.name.includes('Minotaur')) sprite = ASSETS.MINOTAUR;
      else if (entity.name.includes('Beholder')) sprite = ASSETS.BEHOLDER;
      else if (entity.name.includes('Dragon')) sprite = ASSETS.DRAGON;
      else if (entity.name.includes('Kraken')) sprite = ASSETS.KRAKEN;
      else if (entity.name.includes('Lich')) sprite = ASSETS.LICH;
      else if (entity.name.includes('Ice Golem')) sprite = ASSETS.ICE_GOLEM;
      else if (entity.name.includes('Bear')) sprite = ASSETS.BEAR;
      else if (entity.name.includes('Wolf')) sprite = ASSETS.WOLF;
      else if (entity.name.includes('Snake')) sprite = ASSETS.SNAKE;
      else if (entity.name.includes('Scorpion')) sprite = ASSETS.SCORPION;
      else if (entity.name.includes('Zombie')) sprite = ASSETS.ZOMBIE;
      else if (entity.name.includes('Vampire')) sprite = ASSETS.VAMPIRE;
      else if (entity.name.includes('Knight')) sprite = ASSETS.KNIGHT;
      else sprite = ASSETS.SLIME;
  }
  else if (entity.type === 'OBJECT') {
      if (entity.subType === 'CHEST') sprite = ASSETS.CHEST;
      if (entity.subType === 'BED') sprite = ASSETS.BED;
      if (entity.subType === 'WAYPOINT') sprite = isActiveWaypoint ? ASSETS.WAYPOINT_ACTIVE : ASSETS.WAYPOINT;
      if (entity.subType === 'SIGNPOST') sprite = ASSETS.SIGNPOST;
      if (entity.subType === 'ANVIL') sprite = ASSETS.ANVIL;
      if (entity.subType === 'WORKBENCH') sprite = ASSETS.WORKBENCH;
      if (entity.subType === 'ALCHEMY_TABLE') sprite = ASSETS.ALCHEMY_TABLE;
  }

  // Animation Classes
  let animClass = "";
  if (animation === 'ATTACK') {
      animClass = entity.facing === 'LEFT' ? 'anim-attack-left' : 'anim-attack-right';
  } else if (animation === 'HURT') {
      animClass = 'anim-hurt';
  } else if (animation === 'DODGE') {
      animClass = 'anim-dodge';
  }

  const style: React.CSSProperties = {
    transform: `translate(${x * 2}rem, ${y * 2}rem)`,
    transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
  };

  const isFlipped = entity.facing === 'LEFT';

  return (
    <div 
      className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center z-20 pointer-events-none"
      style={style}
    >
      <div className={clsx("relative w-8 h-8", isPlayer && "z-30", animClass)}>
        {/* Shadow */}
        <div className="absolute bottom-1 left-2 w-4 h-1 bg-black/40 rounded-full blur-[1px]" />
        
        {/* Sprite */}
        <img 
          src={sprite} 
          className={clsx(
            "w-full h-full object-contain",
            isPlayer && "animate-bounce-slight", 
            entity.type === 'ENEMY' && "animate-pulse-slow",
            entity.name.includes('Bat') && "animate-bounce", // Bats fly
            entity.name.includes('Ghost') && "opacity-80 animate-pulse" // Ghosts fade
          )}
          style={{
            imageRendering: 'pixelated',
            transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
            filter: isPlayer ? 'drop-shadow(0 0 2px rgba(255,255,255,0.3))' : undefined
          }}
          alt={entity.name}
        />
        
        {/* HP Bar for enemies */}
        {entity.type === 'ENEMY' && entity.hp !== undefined && entity.maxHp && (
            <div className="absolute -top-1 left-1 w-6 h-1 bg-red-900 border border-black/50">
                <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${(entity.hp / entity.maxHp) * 100}%` }}
                />
            </div>
        )}

        {/* Combat Floating Text (Simplified) */}
        {animation === 'DODGE' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-blue-300 font-bold animate-bounce">MISS</div>
        )}
        {animation === 'HURT' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-bold animate-bounce">HIT</div>
        )}
        {animation === 'HEAL' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-green-400 font-bold anim-float-up">+HP</div>
        )}

        {/* Quest/Interaction Indicator */}
        {(entity.type === 'NPC' || entity.type === 'OBJECT') && (
           <div className={`absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce font-bold ${entity.questId ? 'text-yellow-400 text-lg' : 'text-stone-300 text-[10px]'}`}>
             {entity.questId ? '!' : '?'}
           </div>
        )}
      </div>
    </div>
  );
};
