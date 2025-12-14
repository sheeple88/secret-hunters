
import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { GameState, Item, Stats, Entity } from './types';
import { MAPS, INITIAL_STATS, INITIAL_SKILLS, ITEMS, PERKS, uid, calculateXpForLevel } from './data/Registry';
import { generateWorld } from './systems/WorldGen';
import { handleInput } from './systems/Engine';
import { GameRenderer } from './components/renderer/GameRenderer';
import { GameHUD } from './components/hud/GameHUD';
import { ALL_SECRETS } from './data/secrets/index';
import { initializeWorld, regenerateAllMaps } from './systems/mapGenerator';
import { generateHavensRest } from './systems/maps/havensRest';

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 28, y: 22 },
    playerFacing: 'DOWN',
    currentMapId: 'map_10_10',
    stats: INITIAL_STATS,
    equipment: { HEAD: null, BODY: null, LEGS: null, WEAPON: null, OFFHAND: null, ACCESSORY: null },
    skills: INITIAL_SKILLS,
    inventory: [],
    knownRecipes: [],
    unlockedSecretIds: [],
    unlockedAchievementIds: [],
    completedQuestIds: [],
    unlockedPerks: [],
    equippedPerks: [],
    unlockedCosmetics: ['party_hat'], 
    equippedCosmetic: 'party_hat',
    activeTitle: null,
    bestiary: [],
    counters: {}, 
    logs: [{ id: 'init', message: 'Welcome to Secret Hunters.', type: 'INFO', timestamp: Date.now() }],
    flags: {},
    lastAction: null,
    isCombat: false,
    lastCombatTime: 0,
    combatTargetId: null,
    activeQuest: null,
    // Initialize exploration for starting town
    exploration: { 
        'map_10_10': Array(50).fill(null).map(() => Array(60).fill(1)) // Full reveal town start
    },
    worldModified: {},
    animations: {},
    time: 800,
    autoDistributeStats: false,
    statAllocation: { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 },
    worldTier: 0,
    knownWaypoints: [],
    knownLocations: []
  });

  const [combatNumbers, setCombatNumbers] = useState<Record<string, number>>({});
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activePuzzle, setActivePuzzle] = useState(null);
  const [activeDialogue, setActiveDialogue] = useState(null);
  const [viewScale, setViewScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1.0);
  const [volume, setVolume] = useState(0.5);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // --- INIT ---
  useEffect(() => {
      // Force regeneration if MAPS is empty or invalid
      if (Object.keys(MAPS).length === 0 || !MAPS['map_10_10']) {
          console.log("Initializing World...");
          const world = generateWorld(); // Use new WorldGen
          Object.assign(MAPS, world);
      }
      
      // Fallback sanity check for broken map state
      if (!MAPS['map_10_10'] || MAPS['map_10_10'].width < 60) {
           console.log("Repairing World State...");
           const world = generateWorld();
           Object.assign(MAPS, world);
      }
  }, []);

  // --- GAME LOOP ---
  const handleAction = useCallback((dx: number, dy: number) => {
      if (activeModal || activePuzzle || activeDialogue) return;
      
      setGameState(prev => {
          const { newState, events } = handleInput(prev, dx, dy);
          
          if (events.damage) {
              setCombatNumbers(n => ({ ...n, [events.targetId]: events.damage }));
              setTimeout(() => setCombatNumbers({}), 1000);
          }
          if (events.playerDamage) {
              setCombatNumbers(n => ({ ...n, player: events.playerDamage }));
              setTimeout(() => setCombatNumbers({}), 1000);
          }
          
          return newState;
      });
  }, [activeModal, activePuzzle, activeDialogue]);

  // --- VIEWPORT ---
  const cameraPosition = useMemo(() => {
      const map = MAPS[gameState.currentMapId];
      if (!map) return { x: 0, y: 0 };
      const TILE = 32;
      const px = gameState.playerPos.x * TILE + 16;
      const py = gameState.playerPos.y * TILE + 16;
      let tx = (viewportSize.w / 2) - (px * viewScale);
      let ty = (viewportSize.h / 2) - (py * viewScale);
      
      // Clamp
      const mw = map.width * TILE * viewScale;
      const mh = map.height * TILE * viewScale;
      if (mw > viewportSize.w) tx = Math.max(viewportSize.w - mw, Math.min(0, tx));
      else tx = (viewportSize.w - mw) / 2;
      
      if (mh > viewportSize.h) ty = Math.max(viewportSize.h - mh, Math.min(0, ty));
      else ty = (viewportSize.h - mh) / 2;

      return { x: tx, y: ty };
  }, [gameState.playerPos, gameState.currentMapId, viewScale, viewportSize]);

  // --- UI HANDLERS ---
  const handleEquip = (item: Item) => {
      setGameState(prev => {
          const slot = item.slot;
          if (!slot) return prev;
          const current = prev.equipment[slot];
          const newEq = { ...prev.equipment, [slot]: current?.id === item.id ? null : item };
          return { ...prev, equipment: newEq };
      });
  };

  const handleConsume = (item: Item) => {
      if (item.healAmount) {
          setGameState(prev => ({
              ...prev,
              stats: { ...prev.stats, hp: Math.min(prev.stats.maxHp, prev.stats.hp + (item.healAmount || 0)) },
              inventory: prev.inventory.filter(i => i.id !== item.id) // Simplified remove
          }));
      }
  };

  // Resize
  useEffect(() => {
      const handleResize = () => {
          setViewportSize({ w: window.innerWidth, h: window.innerHeight });
          const scale = Math.max(0.5, Math.min(3.0, window.innerWidth / (20 * 32) * userZoom));
          setViewScale(scale);
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
  }, [userZoom]);

  // Force re-render if map data loads late
  if (!MAPS[gameState.currentMapId]) {
      return (
          <div className="w-screen h-screen bg-black flex items-center justify-center text-white">
              <div className="animate-pulse">Loading World...</div>
          </div>
      );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
        <GameRenderer 
            currentMap={MAPS[gameState.currentMapId]}
            gameState={gameState}
            viewScale={viewScale}
            visionRadius={6}
            lightingOpacity={0}
            combatNumbers={combatNumbers}
            cameraPosition={cameraPosition}
        />
        <GameHUD 
            gameState={gameState}
            playerStats={gameState.stats}
            activeModal={activeModal}
            activePuzzle={activePuzzle}
            activeDialogue={activeDialogue}
            setActiveModal={setActiveModal}
            onMove={handleAction}
            onInteract={() => handleAction(0, 0)} // Interact handled in Engine
            onEquip={handleEquip}
            onCraft={() => {}}
            onRespawn={() => setGameState(p => ({ ...p, stats: { ...p.stats, hp: p.stats.maxHp }, playerPos: {x: 28, y: 22}, currentMapId: 'map_10_10' }))}
            onResetSave={() => { localStorage.clear(); window.location.reload(); }}
            onSaveGame={() => localStorage.setItem('sh_save_v9_final', JSON.stringify({ gameState }))}
            onConsume={handleConsume}
            onTogglePerk={() => {}}
            onPuzzleSolve={() => {}}
            onPuzzleClose={() => setActivePuzzle(null)}
            onDialogueClose={() => setActiveDialogue(null)}
            formatTime={(t) => `${Math.floor(t/100)}:00`}
            onBuy={() => {}}
            onSell={() => {}}
            onStatIncrease={() => {}}
            onAutoConfigChange={() => {}}
            onResetStats={() => {}}
            volume={volume} setVolume={setVolume} zoom={userZoom} setZoom={setUserZoom} lastSaved={0} isSaving={false}
        />
    </div>
  );
}
