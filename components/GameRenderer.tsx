
import React, { useMemo } from 'react';
import { GameState, GameMap } from '../types';
import { Tile } from './Tile';
import { EntityComponent } from './EntityComponent';

interface GameRendererProps {
  currentMap: GameMap;
  gameState: GameState;
  viewScale: number;
  visionRadius: number;
  lightingOpacity: number;
  combatNumbers: Record<string, number>;
}

export const GameRenderer: React.FC<GameRendererProps> = React.memo(({ 
  currentMap, 
  gameState, 
  viewScale, 
  visionRadius, 
  lightingOpacity,
  combatNumbers
}) => {
  
  // Calculate centering offsets
  // Map size is 20x15 tiles, each 2rem (32px). Total size 640px x 480px.
  // We want to center this within the container logic handled by parent, 
  // but here we just render the board div.
  
  return (
    <div 
      className="relative shadow-2xl bg-black border-4 border-stone-800 overflow-hidden" 
      style={{ 
          width: `${currentMap.width * 2}rem`, 
          height: `${currentMap.height * 2}rem`,
          transform: `scale(${viewScale})`,
          // Center the map in the screen using absolute positioning logic if handled by parent,
          // or just standard transform origin.
          transformOrigin: 'center center',
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

            // Visibility Check
            const dx = Math.abs(x - gameState.playerPos.x);
            const dy = Math.abs(y - gameState.playerPos.y);
            const isVisible = dx <= visionRadius && dy <= visionRadius;

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
            const isVisible = dx <= visionRadius && dy <= visionRadius;

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
