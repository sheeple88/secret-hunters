
import React from 'react';
import { GameState, GameMap } from '../types';
import { Tile } from './Tile';
import { EntityComponent } from './EntityComponent';
import { hasLineOfSight } from '../systems/ai';
import { FloatingDamage } from './combat/FloatingDamage';

interface GameRendererProps {
  currentMap: GameMap;
  gameState: GameState;
  viewScale: number;
  visionRadius: number;
  lightingOpacity: number;
  combatNumbers: Record<string, number>;
  cameraPosition?: { x: number, y: number };
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
  
  // If map data isn't loaded yet, show loading state
  if (!currentMap) {
      return (
          <div className="flex items-center justify-center w-full h-full bg-black text-stone-500 font-mono text-xl animate-pulse">
              Loading World...
          </div>
      );
  }

  const TILE_SIZE = 32;
  const width = currentMap.width;
  const height = currentMap.height;
  const mapWidthPx = width * TILE_SIZE;
  const mapHeightPx = height * TILE_SIZE;

  // Camera Transform
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

  const isNight = gameState.time > 1800 || gameState.time < 600;
  // Always force reveal towns or interiors to prevent black screen bugs
  const forceReveal = currentMap.isTown || currentMap.biome === 'INTERIOR';

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
            // Safe Access for Exploration Grid
            const expRow = gameState.exploration[gameState.currentMapId]?.[y];
            const explored = expRow ? expRow[x] : 0;
            
            const isRevealed = forceReveal || explored;
            
            if (!isRevealed) return null;
            
            let displayTile = tile;
            if (gameState.worldModified[gameState.currentMapId] && gameState.worldModified[gameState.currentMapId][`${y},${x}`]) {
                displayTile = gameState.worldModified[gameState.currentMapId][`${y},${x}`];
            }

            const dx = Math.abs(x - gameState.playerPos.x);
            const dy = Math.abs(y - gameState.playerPos.y);
            let isVisible = dx <= visionRadius && dy <= visionRadius;
            
            if (isVisible) isVisible = hasLineOfSight(gameState.playerPos, {x, y}, currentMap);
            
            if (forceReveal) isVisible = true;

            return (
                <div 
                    key={`${x}-${y}`} 
                    className="absolute" 
                    style={{ 
                        left: `${x * TILE_SIZE}px`, 
                        top: `${y * TILE_SIZE}px`,
                        width: '32.5px', 
                        height: '32.5px',
                        filter: isVisible ? 'none' : 'brightness(0.35) grayscale(0.2)'
                    }}
                >
                    <Tile type={displayTile} x={x} y={y} />
                </div>
            );
        }))}

        {/* Entity Layer */}
        {currentMap.entities.map(entity => {
            const expRow = gameState.exploration[gameState.currentMapId]?.[entity.pos.y];
            const explored = expRow ? expRow[entity.pos.x] : 0;
            const isRevealed = forceReveal || explored;
            
            if (!isRevealed) return null;

            const dx = Math.abs(entity.pos.x - gameState.playerPos.x);
            const dy = Math.abs(entity.pos.y - gameState.playerPos.y);
            let isVisible = dx <= visionRadius && dy <= visionRadius;
            
            if (isVisible) isVisible = hasLineOfSight(gameState.playerPos, entity.pos, currentMap);

            if (forceReveal) isVisible = true;

            if ((entity.type === 'ENEMY' || entity.type === 'NPC') && !isVisible) return null;

            return (
              <div key={entity.id} style={{ filter: isVisible ? 'none' : 'brightness(0.35) grayscale(0.2)' }}>
                  <EntityComponent 
                      entity={entity} 
                      animation={gameState.animations[entity.id]}
                      damageValue={combatNumbers[entity.id]}
                      weaponType={undefined}
                  />
                  {entity.subType === 'LAMP' && isNight && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-xl pointer-events-none mix-blend-screen z-20" 
                           style={{ transform: `translate3d(${entity.pos.x * 32}px, ${entity.pos.y * 32}px, 0)` }} 
                      />
                  )}
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
            equippedCosmetic={gameState.equippedCosmetic}
        />

        {gameState.animations['player'] === 'HURT' && combatNumbers['player'] && (
             <div className="absolute transition-transform will-change-transform z-50 pointer-events-none" style={{ transform: `translate3d(${gameState.playerPos.x * 32}px, ${gameState.playerPos.y * 32}px, 0)` }}>
                 <FloatingDamage value={combatNumbers['player']} type="HIT" />
             </div>
        )}
        {gameState.animations['player'] === 'DODGE' && (
             <div className="absolute transition-transform will-change-transform z-50 pointer-events-none" style={{ transform: `translate3d(${gameState.playerPos.x * 32}px, ${gameState.playerPos.y * 32}px, 0)` }}>
                 <FloatingDamage value={0} type="MISS" />
             </div>
        )}

        <div className="absolute inset-0 bg-blue-950 pointer-events-none z-30 mix-blend-multiply transition-opacity duration-1000" style={{ opacity: forceReveal ? lightingOpacity * 0.5 : lightingOpacity }} />
    </div>
  );
});
