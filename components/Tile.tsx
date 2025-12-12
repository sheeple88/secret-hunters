
import React from 'react';
import { TileType } from '../types';
import { ASSETS } from '../constants';
import clsx from 'clsx';

interface TileProps {
  type: TileType;
  x: number;
  y: number;
}

export const Tile: React.FC<TileProps> = React.memo(({ type, x, y }) => {
  // Determine base texture and overlay texture
  let baseAsset = ASSETS.GRASS;
  let overlayAsset = null;

  switch (type) {
    case 'WALL': baseAsset = ASSETS.WALL; break;
    case 'WATER': baseAsset = ASSETS.WATER; break;
    case 'FLOOR': baseAsset = ASSETS.FLOOR; break;
    case 'PLANK': baseAsset = ASSETS.PLANK; break;
    case 'LAVA': baseAsset = ASSETS.LAVA; break;
    case 'DOOR': baseAsset = ASSETS.FLOOR; overlayAsset = ASSETS.DOOR; break;
    case 'TREE': overlayAsset = ASSETS.TREE; break;
    case 'ROCK': overlayAsset = ASSETS.ROCK; break;
    case 'SHRINE': baseAsset = ASSETS.FLOOR; overlayAsset = ASSETS.SHRINE; break;
    case 'VOID': baseAsset = ASSETS.VOID; break;
    case 'SAND': baseAsset = ASSETS.SAND; break;
    case 'MUD': baseAsset = ASSETS.MUD; break;
    case 'FLOWER': overlayAsset = ASSETS.FLOWER; break; 
    case 'WATERFALL': baseAsset = ASSETS.WATER; overlayAsset = ASSETS.WATERFALL; break;
    
    // New Types
    case 'SNOW': baseAsset = ASSETS.SNOW; break;
    case 'ICE': baseAsset = ASSETS.ICE; break;
    case 'STONE_BRICK': baseAsset = ASSETS.STONE_BRICK; break;
    case 'DEEP_WATER': baseAsset = ASSETS.DEEP_WATER; break;
    case 'CACTUS': baseAsset = ASSETS.SAND; overlayAsset = ASSETS.CACTUS; break;
    case 'GRAVESTONE': baseAsset = ASSETS.MUD; overlayAsset = ASSETS.GRAVESTONE; break;
    case 'BONES': baseAsset = ASSETS.FLOOR; overlayAsset = ASSETS.BONES_DECOR; break;
    case 'OBSIDIAN': baseAsset = ASSETS.OBSIDIAN; break;
    case 'DIRT_PATH': baseAsset = ASSETS.DIRT_PATH; break;
  }

  return (
    <div
      className="w-8 h-8 relative"
      style={{
          imageRendering: 'pixelated',
      }}
    >
      {/* Base Layer */}
      <img src={baseAsset} className={clsx("absolute inset-0 w-full h-full object-cover", type === 'LAVA' && "animate-pulse")} alt="" />
      
      {/* Object Layer */}
      {overlayAsset && (
        <img 
          src={overlayAsset} 
          className={clsx(
            "absolute inset-0 w-full h-full object-cover z-10",
            type === 'WATERFALL' && "animate-pulse" 
          )} 
          alt="" 
        />
      )}

      {/* Grid Border Subtle */}
      <div className="absolute inset-0 border-[0.5px] border-black/10 pointer-events-none" />
    </div>
  );
});
