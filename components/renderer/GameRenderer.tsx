
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
  
  // Base map dimensions
  const mapWidthRem = currentMap.width * 2;
  const mapHeightRem = currentMap.height * 2;

  // Camera Transform Logic
  // Added transition to match EntityComponent for smooth scrolling
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
      className="relative shadow-2xl bg-black border-4 border-stone-800 overflow-hidden" 
      style={{ 
          width: `${mapWidthRem}rem`, 
          height: `${mapHeightRem}rem`,
          ...transformStyle
      }}
    >
        {/* Tile Layer */}
        {currentMap.tiles.map((row, y) => row.map((tile, x) => {
            const isRevealed = gameState.exploration[gameState.currentMapId]?.[y]?.[x];
            if (!isRevealed) return <div key={`${x}-${y}`} className="absolute w-8 h-8 bg-black z-40" style={{ left: `${x*2}rem`, top: `${y*2}rem` }} />;
            
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
                <div key={`${x}-${y}`} className="absolute w-8 h-8" style={{ left: `${x * 2}rem`, top: `${y * 2}rem` }}>
                    <Tile type={displayTile} x={x} y={y} />
                    {!isVisible && <div className="absolute inset-0 bg-black/60 z-20 pointer-events-none" />}
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
              <div key={entity.id} className={isVisible ? '' : 'opacity-50 grayscale'}>
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
