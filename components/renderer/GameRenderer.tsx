
import React from 'react';
import { GameState, GameMap } from '../../types';
import { Tile } from './Tile';
import { EntityComponent } from './EntityComponent';
import { hasLineOfSight } from '../../systems/ai';

interface GameRendererProps {
  currentMap: GameMap;
  gameState: GameState;
  viewScale: number;
  visionRadius: number;
  lightingOpacity: number;
  combatNumbers: Record<string, number>;
  cameraPosition?: { x: number, y: number }; // Optional offset for mobile camera
}

export const GameRenderer: React.FC<GameRendererProps> = React.memo(({ 
  currentMap, 
  gameState, 
  viewScale, 
  visionRadius, 
  lightingOpacity,
  combatNumbers,
  cameraPosition
}) => {
  
  // Base map dimensions in pixels
  const TILE_SIZE = 32;
  const mapWidthPx = currentMap.width * TILE_SIZE;
  const mapHeightPx = currentMap.height * TILE_SIZE;

  // Camera Transform Logic
  const transformStyle = cameraPosition ? {
      transform: `translate3d(${cameraPosition.x}px, ${cameraPosition.y}px, 0) scale(${viewScale})`,
      transformOrigin: 'top left',
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
      willChange: 'transform'
  } : {
      transform: `scale(${viewScale})`,
      transformOrigin: 'center center',
      transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
      willChange: 'transform'
  };

  return (
    <div 
      className="relative shadow-2xl bg-black border-4 border-stone-800 overflow-hidden box-content" 
      style={{ 
          width: `${mapWidthPx}px`, 
          height: `${mapHeightPx}px`,
          ...transformStyle
      }}
    >
        {/* Tile Layer */}
        {currentMap.tiles.map((row, y) => row.map((tile, x) => {
            const isRevealed = gameState.exploration[gameState.currentMapId]?.[y]?.[x];
            
            // Fog of War: Render null to let the black container show through
            if (!isRevealed) {
                return null;
            }
            
            // Apply World Mods (Chopped Trees, Mined Rocks)
            let displayTile = tile;
            if (gameState.worldModified[gameState.currentMapId] && gameState.worldModified[gameState.currentMapId][`${y},${x}`]) {
                displayTile = gameState.worldModified[gameState.currentMapId][`${y},${x}`];
            }

            // Visibility Check (Distance + LOS)
            const dx = Math.abs(x - gameState.playerPos.x);
            const dy = Math.abs(y - gameState.playerPos.y);
            let isVisible = dx <= visionRadius && dy <= visionRadius;
            
            // Check LOS if within radius to cast shadows
            if (isVisible) {
                isVisible = hasLineOfSight(gameState.playerPos, {x, y}, currentMap);
            }

            return (
                <div 
                    key={`${x}-${y}`} 
                    className="absolute" 
                    style={{ 
                        left: `${x * TILE_SIZE}px`, 
                        top: `${y * TILE_SIZE}px`,
                        // Slight overlap to fix sub-pixel grid gaps between visible tiles
                        width: '32.5px', 
                        height: '32.5px',
                        // FIX: Use filter instead of overlay to prevent stacking darkness on overlaps
                        filter: isVisible ? 'none' : 'brightness(0.35) grayscale(0.2)'
                    }}
                >
                    <Tile type={displayTile} x={x} y={y} />
                </div>
            );
        }))}

        {/* Entity Layer */}
        {currentMap.entities.map(entity => {
            const isRevealed = gameState.exploration[gameState.currentMapId]?.[entity.pos.y]?.[entity.pos.x];
            if (!isRevealed) return null;

            const dx = Math.abs(entity.pos.x - gameState.playerPos.x);
            const dy = Math.abs(entity.pos.y - gameState.playerPos.y);
            let isVisible = dx <= visionRadius && dy <= visionRadius;
            
            // Check LOS for entities too
            if (isVisible) {
                isVisible = hasLineOfSight(gameState.playerPos, entity.pos, currentMap);
            }

            // Hide Enemies & NPCs if not directly in vision range, even if mapped
            if ((entity.type === 'ENEMY' || entity.type === 'NPC') && !isVisible) return null;

            return (
              <div 
                key={entity.id} 
                style={{
                    // Use uniform filter for entities in fog to match terrain
                    filter: isVisible ? 'none' : 'brightness(0.35) grayscale(0.2)'
                }}
              >
                  <EntityComponent 
                      entity={entity} 
                      animation={gameState.animations[entity.id]}
                      damageValue={combatNumbers[entity.id]}
                  />
              </div>
            );
        })}

        {/* Player Layer */}
        <EntityComponent 
            entity={{
                id: 'player',
                name: 'Hero',
                type: 'PLAYER',
                symbol: '@',
                color: 'white',
                pos: gameState.playerPos,
                facing: gameState.playerFacing
            }} 
            isPlayer
            weaponType={gameState.equipment.WEAPON?.weaponStats?.type}
            animation={gameState.animations['player']}
            damageValue={combatNumbers['player']}
        />

        {/* Day/Night Cycle Overlay */}
        <div className="absolute inset-0 bg-blue-950 pointer-events-none z-30 mix-blend-multiply transition-opacity duration-1000" style={{ opacity: lightingOpacity }} />
    </div>
  );
});
