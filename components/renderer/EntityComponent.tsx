
import React from 'react';
import { Entity, AnimationType, WeaponType } from '../../types';
import { ASSETS } from '../../assets';
import clsx from 'clsx';

interface EntityProps {
  entity: Entity;
  isPlayer?: boolean;
  isActiveWaypoint?: boolean; 
  animation?: AnimationType;
  weaponType?: WeaponType;
  damageValue?: number; // New prop for floating numbers
}

export const EntityComponent: React.FC<EntityProps> = ({ entity, isPlayer, isActiveWaypoint, animation, weaponType, damageValue }) => {
  const { x, y } = entity.pos;
  
  // Asset Selection
  let sprite = ASSETS.SLIME; // Default fallback
  let zIndex = 30; // Standard Entity Z

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
      else if (entity.name.includes('Mimic')) sprite = ASSETS.MIMIC;
      else if (entity.name.includes('Fire Elemental')) sprite = ASSETS.FIRE_ELEMENTAL;
      else if (entity.name.includes('Cultist')) sprite = ASSETS.CULTIST;
      else if (entity.name.includes('Earth Golem')) sprite = ASSETS.EARTH_GOLEM;
      else if (entity.name.includes('Specter')) sprite = ASSETS.SPECTER;
      else sprite = ASSETS.SLIME;
  }
  else if (entity.type === 'OBJECT') {
      if (entity.subType === 'CHEST') sprite = ASSETS.CHEST;
      if (entity.subType === 'LOCKED_CHEST') sprite = ASSETS.LOCKED_CHEST;
      if (entity.subType === 'BED') sprite = ASSETS.BED;
      if (entity.subType === 'WAYPOINT') sprite = isActiveWaypoint ? ASSETS.WAYPOINT_ACTIVE : ASSETS.WAYPOINT;
      if (entity.subType === 'SIGNPOST') sprite = ASSETS.SIGNPOST;
      if (entity.subType === 'ANVIL') sprite = ASSETS.ANVIL;
      if (entity.subType === 'WORKBENCH') sprite = ASSETS.WORKBENCH;
      if (entity.subType === 'ALCHEMY_TABLE') sprite = ASSETS.ALCHEMY_TABLE;
      if (entity.subType === 'PRESSURE_PLATE') {
          sprite = ASSETS.PRESSURE_PLATE;
          zIndex = 10; // Below player
      }
      if (entity.subType === 'PUSH_BLOCK') sprite = ASSETS.PUSH_BLOCK;
      if (entity.subType === 'CRATE') sprite = ASSETS.CRATE;
      if (entity.subType === 'LOCKED_DOOR') sprite = ASSETS.LOCKED_DOOR;
      if (entity.subType === 'DOOR') sprite = ASSETS.DOOR;
      if (entity.subType === 'MOB_SPAWNER') sprite = ASSETS.MOB_SPAWNER;
  }
  else if (entity.type === 'COLLECTIBLE') {
      sprite = ASSETS.RELIC;
  }

  // Weapon Asset Selection
  let weaponSprite = null;
  if (isPlayer && weaponType) {
      if (weaponType === 'SWORD') weaponSprite = ASSETS.WEAPON_SWORD;
      else if (weaponType === 'AXE') weaponSprite = ASSETS.WEAPON_AXE;
      else if (weaponType === 'MACE') weaponSprite = ASSETS.WEAPON_MACE;
      else if (weaponType === 'DAGGER') weaponSprite = ASSETS.WEAPON_DAGGER;
      else if (weaponType === 'SPEAR') weaponSprite = ASSETS.WEAPON_SPEAR;
      else if (weaponType === 'BOW') weaponSprite = ASSETS.WEAPON_BOW;
      else if (weaponType === 'STAFF') weaponSprite = ASSETS.WEAPON_STAFF;
      else if (weaponType === 'ROD') weaponSprite = ASSETS.WEAPON_ROD;
  }

  // Animation Classes
  let animClass = "";
  let weaponAnimClass = "";
  
  if (animation === 'ATTACK' || animation === 'SHOOT' || animation === 'FISH_CAST') {
      if (animation === 'ATTACK' || animation === 'FISH_CAST') {
          animClass = entity.facing === 'LEFT' ? 'anim-attack-left' : 'anim-attack-right';
      }
      // Select Weapon Animation
      if (weaponType === 'BOW') weaponAnimClass = 'anim-shoot';
      else if (weaponType === 'DAGGER') weaponAnimClass = 'anim-stab-fast';
      else if (weaponType === 'SPEAR') weaponAnimClass = 'anim-stab-long';
      else if (weaponType === 'AXE') weaponAnimClass = 'anim-chop';
      else if (weaponType === 'MACE') weaponAnimClass = 'anim-bash';
      else if (weaponType === 'STAFF') weaponAnimClass = 'anim-thrust';
      else if (weaponType === 'ROD') weaponAnimClass = 'anim-swing';
      else weaponAnimClass = 'anim-swing'; 
  } else if (animation === 'HURT') {
      animClass = 'anim-hurt';
  } else if (animation === 'DODGE') {
      animClass = 'anim-dodge';
  } else if (animation === 'FISH_CATCH') {
      animClass = 'anim-bounce-slight'; // Simple feedback
  }

  const style: React.CSSProperties = {
    // Use translate3d for GPU acceleration
    transform: `translate3d(${x * 2}rem, ${y * 2}rem, 0)`,
    transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
    zIndex: zIndex,
    willChange: 'transform'
  };

  const isFlipped = entity.facing === 'LEFT';
  
  // Weapon Transform Calculation
  let weaponRotation = 0;
  let weaponTranslateX = 6;
  let weaponTranslateY = 4;
  let weaponScaleX = 1;
  let weaponZIndex = 31; 

  if (entity.facing === 'UP') {
      weaponRotation = -45;
      weaponTranslateX = 8;
      weaponTranslateY = -2;
      weaponScaleX = -1;
      weaponZIndex = 29;
  } else if (entity.facing === 'DOWN') {
      weaponRotation = 135;
      weaponTranslateX = -4; 
      weaponTranslateY = 8;
  } else if (entity.facing === 'LEFT') {
      weaponRotation = -45;
      weaponTranslateX = -6;
      weaponTranslateY = 6;
      weaponScaleX = -1; 
  } else { 
      weaponRotation = 45;
      weaponTranslateX = 6;
      weaponTranslateY = 6;
  }

  const weaponStyle: React.CSSProperties = {
      position: 'absolute',
      width: '16px',
      height: '16px',
      top: 0,
      left: 0,
      transform: `translate(${weaponTranslateX}px, ${weaponTranslateY}px) rotate(${weaponRotation}deg) scaleX(${weaponScaleX})`,
      zIndex: weaponZIndex,
      pointerEvents: 'none'
  };

  return (
    <div 
      className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center pointer-events-none"
      style={style}
    >
      <div className={clsx("relative w-8 h-8", isPlayer && "z-30", animClass)}>
        {/* Shadow */}
        {entity.subType !== 'PRESSURE_PLATE' && <div className="absolute bottom-1 left-2 w-4 h-1 bg-black/40 rounded-full blur-[1px]" />}
        
        {/* Name Tag for Doors/Important NPCs */}
        {(entity.type === 'NPC' || (entity.type === 'OBJECT' && entity.subType === 'DOOR')) && (
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
                <div className="bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded border border-stone-600/50 shadow-sm backdrop-blur-[1px]">
                    {entity.name}
                </div>
             </div>
        )}

        {/* Sprite */}
        <img 
          src={sprite} 
          className={clsx(
            "w-full h-full object-contain",
            isPlayer && "animate-bounce-slight", 
            entity.type === 'ENEMY' && "animate-pulse-slow",
            entity.name.includes('Bat') && "animate-bounce",
            entity.name.includes('Ghost') && "opacity-80 animate-pulse",
            entity.type === 'COLLECTIBLE' && "animate-bounce",
            entity.subType === 'MOB_SPAWNER' && "animate-pulse"
          )}
          style={{
            imageRendering: 'pixelated',
            transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
            filter: isPlayer ? 'drop-shadow(0 0 2px rgba(255,255,255,0.3))' : undefined,
            zIndex: 30
          }}
          alt={entity.name}
        />
        
        {/* Weapon Layer */}
        {weaponSprite && (
            <div style={weaponStyle}>
                <img src={weaponSprite} className={clsx("w-full h-full object-contain", weaponAnimClass)} alt="weapon" />
            </div>
        )}
        
        {/* HP Bar for enemies */}
        {(entity.type === 'ENEMY' || (entity.subType === 'MOB_SPAWNER' && entity.hp !== undefined && entity.hp < (entity.maxHp || 100))) && entity.hp !== undefined && entity.maxHp && (
            <div className="absolute -top-1 left-1 w-6 h-1 bg-red-900 border border-black/50 z-40">
                <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${(entity.hp / entity.maxHp) * 100}%` }}
                />
            </div>
        )}

        {/* Combat Floating Text */}
        {animation === 'DODGE' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-blue-300 font-bold animate-bounce z-50">MISS</div>
        )}
        {animation === 'HURT' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-bold animate-bounce z-50">
                {damageValue ? `-${damageValue}` : 'HIT'}
            </div>
        )}
        {animation === 'HEAL' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-green-400 font-bold anim-float-up z-50">
                {damageValue ? `+${damageValue}` : '+HP'}
            </div>
        )}
         {animation === 'FISH_CATCH' && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-blue-300 font-bold anim-float-up z-50 whitespace-nowrap">
                FISH!
            </div>
        )}

        {/* Quest/Interaction Indicator */}
        {(entity.type === 'NPC' || (entity.type === 'OBJECT' && entity.subType !== 'PRESSURE_PLATE' && entity.subType !== 'PUSH_BLOCK' && entity.subType !== 'DOOR' && entity.subType !== 'MOB_SPAWNER')) && (
           <div className={`absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce font-bold z-50 ${entity.questId ? 'text-yellow-400 text-lg' : 'text-stone-300 text-[10px]'}`}>
             {entity.questId ? '!' : entity.subType === 'LOCKED_DOOR' || entity.subType === 'LOCKED_CHEST' ? '🔒' : '?'}
           </div>
        )}
      </div>
    </div>
  );
};
