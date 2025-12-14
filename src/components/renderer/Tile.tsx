
import React from 'react';
import { TileType } from '../../types';
import { ASSETS } from '../../assets';
import clsx from 'clsx';

interface TileProps {
  type: TileType;
  x: number;
  y: number;
  isExit?: boolean;
}

export const Tile: React.FC<TileProps> = React.memo(({ type, x, y, isExit }) => {
  // Determine base texture and overlay texture
  let baseAsset = ASSETS.GRASS;
  let overlayAsset = null;
  let bgColor = "bg-green-500"; // Default fallback

  switch (type) {
    case 'WALL': baseAsset = ASSETS.WALL; bgColor = "bg-stone-800"; break;
    case 'ROOF': baseAsset = ASSETS.ROOF; bgColor = "bg-orange-900"; break;
    case 'CRACKED_WALL': baseAsset = ASSETS.CRACKED_WALL; bgColor = "bg-stone-800"; break;
    case 'WATER': baseAsset = ASSETS.WATER; bgColor = "bg-blue-500"; break;
    case 'FLOOR': baseAsset = ASSETS.FLOOR; bgColor = "bg-stone-400"; break;
    case 'PLANK': baseAsset = ASSETS.PLANK; bgColor = "bg-amber-900"; break;
    case 'LAVA': baseAsset = ASSETS.LAVA; bgColor = "bg-orange-600"; break;
    case 'DOOR': baseAsset = ASSETS.FLOOR; overlayAsset = ASSETS.DOOR; bgColor = "bg-amber-800"; break;
    case 'TREE': overlayAsset = ASSETS.TREE; bgColor = "bg-green-600"; break;
    case 'OAK_TREE': overlayAsset = ASSETS.OAK_TREE; bgColor = "bg-green-700"; break;
    case 'BIRCH_TREE': overlayAsset = ASSETS.BIRCH_TREE; bgColor = "bg-lime-200"; break;
    case 'PINE_TREE': baseAsset = ASSETS.GRASS; overlayAsset = ASSETS.PINE_TREE; bgColor = "bg-emerald-800"; break;
    case 'STUMP': baseAsset = ASSETS.GRASS; overlayAsset = ASSETS.STUMP; bgColor = "bg-amber-800"; break;
    case 'ROCK': overlayAsset = ASSETS.ROCK; bgColor = "bg-stone-500"; break;
    case 'SHRINE': baseAsset = ASSETS.FLOOR; overlayAsset = ASSETS.SHRINE; bgColor = "bg-purple-800"; break;
    case 'VOID': baseAsset = ASSETS.VOID; bgColor = "bg-black"; break;
    case 'SAND': baseAsset = ASSETS.SAND; bgColor = "bg-yellow-200"; break;
    case 'MUD': baseAsset = ASSETS.MUD; bgColor = "bg-amber-900"; break;
    case 'FLOWER': overlayAsset = ASSETS.FLOWER; bgColor = "bg-pink-400"; break; 
    case 'WATERFALL': baseAsset = ASSETS.WATER; overlayAsset = ASSETS.WATERFALL; bgColor = "bg-blue-400"; break;
    
    // New Types
    case 'SNOW': baseAsset = ASSETS.SNOW; bgColor = "bg-white"; break;
    case 'ICE': baseAsset = ASSETS.ICE; bgColor = "bg-cyan-200"; break;
    case 'STONE_BRICK': baseAsset = ASSETS.STONE_BRICK; bgColor = "bg-stone-600"; break;
    case 'DEEP_WATER': baseAsset = ASSETS.DEEP_WATER; bgColor = "bg-blue-900"; break;
    case 'CACTUS': baseAsset = ASSETS.SAND; overlayAsset = ASSETS.CACTUS; bgColor = "bg-green-700"; break;
    case 'GRAVESTONE': baseAsset = ASSETS.MUD; overlayAsset = ASSETS.GRAVESTONE; bgColor = "bg-stone-700"; break;
    case 'BONES': baseAsset = ASSETS.FLOOR; overlayAsset = ASSETS.BONES_DECOR; bgColor = "bg-stone-200"; break;
    case 'OBSIDIAN': baseAsset = ASSETS.OBSIDIAN; bgColor = "bg-stone-900"; break;
    case 'DIRT_PATH': baseAsset = ASSETS.DIRT_PATH; bgColor = "bg-amber-700"; break;
    case 'STAIRS_DOWN': baseAsset = ASSETS.STAIRS_DOWN; bgColor = "bg-black"; break;
    case 'STAIRS_UP': baseAsset = ASSETS.STAIRS_UP; bgColor = "bg-stone-500"; break;

    // Dungeons
    case 'ENTRANCE_CRYPT': baseAsset = ASSETS.ENTRANCE_CRYPT; bgColor = "bg-stone-950"; break;
    case 'ENTRANCE_CAVE': baseAsset = ASSETS.ENTRANCE_CAVE; bgColor = "bg-stone-800"; break;
    case 'ENTRANCE_MAGMA': baseAsset = ASSETS.ENTRANCE_MAGMA; bgColor = "bg-red-950"; break;
  }

  return (
    <div
      className={clsx("w-full h-full relative", bgColor)}
      style={{
          imageRendering: 'pixelated',
          width: '32px',
          height: '32px'
      }}
    >
      {/* Base Layer - scaled slightly up to overlap gaps */}
      <img 
        src={baseAsset} 
        className={clsx("absolute inset-0 w-full h-full object-cover", type === 'LAVA' && "animate-pulse")} 
        style={{ transform: 'scale(1.05)' }}
        alt="" 
      />
      
      {/* Object Layer */}
      {overlayAsset && (
        <img 
          src={overlayAsset} 
          className={clsx(
            "absolute inset-0 w-full h-full object-cover z-10",
            type === 'WATERFALL' && "animate-pulse" 
          )} 
          style={{ transform: 'scale(1.05)' }}
          alt="" 
        />
      )}
      
      {/* Exit Indicator */}
      {isExit && (
        <>
           <div className="absolute inset-0 bg-yellow-400/20 animate-pulse z-0" />
           <div className="absolute inset-0 border-2 border-yellow-400/50 animate-pulse z-10" />
        </>
      )}
    </div>
  );
});
