
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, SkillName, Item, Stats, AnimationType, LogEntry, Recipe, TileType, Secret, Entity, Position, GameMap } from './types';
import { MAPS, INITIAL_STATS, INITIAL_SKILLS, ITEMS, WEAPON_TEMPLATES, SECRETS_DATA, PERKS, DEFAULT_RECIPES, uid, calculateXpForLevel, calculateSkillLevel } from './constants';
import { playSound } from './services/audioService';
import { GameRenderer } from './components/renderer/GameRenderer';
import { GameHUD } from './components/hud/GameHUD';
import { PuzzleConfig } from './components/modals/PuzzleModal';
import { handlePlayerMove } from './systems/movement';

// --- Helper Functions ---
const getTimestamp = () => Date.now();
const formatNumber = (n: number) => Math.floor(n).toLocaleString();

const getPlayerTotalStats = (base: Stats, equipment: Record<string, Item | null>, equippedPerks: string[]): Stats => {
  const total = { ...base };
  Object.values(equipment).forEach(item => {
    if (item && item.stats) {
      Object.entries(item.stats).forEach(([key, val]) => {
        // @ts-ignore
        if (typeof val === 'number') total[key as keyof Stats] = (total[key as keyof Stats] || 0) + val;
      });
    }
  });
  equippedPerks.forEach(perkId => {
      const perk = PERKS[perkId];
      if (perk && perk.statBonus) {
          Object.entries(perk.statBonus).forEach(([key, val]) => {
              // @ts-ignore
              if (typeof val === 'number') total[key as keyof Stats] = (total[key as keyof Stats] || 0) + val;
          });
      }
  });
  return total;
};

const addToInventory = (item: Item, state: GameState): Item[] => {
  if (['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY', 'COLLECTIBLE', 'GADGET', 'BLUEPRINT'].includes(item.type)) {
    const existing = state.inventory.find(i => i.id === item.id);
    if (existing) {
      return state.inventory.map(i => i.id === item.id ? { ...i, count: i.count + (item.count || 1) } : i);
    }
  }
  return [...state.inventory, item];
};

const removeFromInventory = (itemId: string, count: number, state: GameState): Item[] => {
    const inv = [...state.inventory];
    const idx = inv.findIndex(i => i.id === itemId);
    if (idx === -1) return inv;
    if (inv[idx].count > count) inv[idx] = { ...inv[idx], count: inv[idx].count - count };
    else inv.splice(idx, 1);
    return inv;
};

const prepareItemForInventory = (itemTemplate: Item): Item => {
    const item = { ...itemTemplate };
    if (!['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY', 'COLLECTIBLE'].includes(item.type)) {
        item.id = uid();
    }
    return item;
};

const applySkillXp = (currentStats: Stats, currentSkills: Record<SkillName, any>, skillName: SkillName, amount: number) => {
    const skill = currentSkills[skillName];
    // Fallback if skill missing
    if (!skill) return { updatedSkill: { name: skillName, level: 1, xp: 0 }, statChanges: {}, logs: [] };

    const newXp = skill.xp + amount;
    const newLevel = calculateSkillLevel(newXp);
    const levelsGained = newLevel - skill.level;
    let statChanges: Partial<Stats> = {};
    let logs: string[] = [];
    if (levelsGained > 0) {
        logs.push(`SKILL UP! ${skillName} ${skill.level} -> ${newLevel}`);
        playSound('LEVEL_UP');
        // Bonus stats from skills still apply automatically
        if (skillName === 'Strength') statChanges.str = (currentStats.str || 0) + (levelsGained * 2);
        if (skillName === 'Dexterity') statChanges.dex = (currentStats.dex || 0) + (levelsGained * 2);
        if (skillName === 'Agility') { statChanges.dex = (currentStats.dex || 0) + levelsGained; statChanges.regeneration = (currentStats.regeneration || 0) + Math.ceil(levelsGained * 0.5); }
        if (skillName === 'Mining') statChanges.str = (currentStats.str || 0) + levelsGained;
        if (skillName === 'Logging') statChanges.str = (currentStats.str || 0) + levelsGained;
        if (skillName === 'Alchemy') statChanges.int = (currentStats.int || 0) + (levelsGained * 2);
        if (skillName === 'Crafting') statChanges.int = (currentStats.int || 0) + levelsGained;
        if (skillName === 'Fishing') { statChanges.dex = (currentStats.dex || 0) + levelsGained; statChanges.regeneration = (currentStats.regeneration || 0) + Math.ceil(levelsGained * 0.2); }
    }
    return { updatedSkill: { ...skill, xp: newXp, level: newLevel }, statChanges, logs };
};

const getVisionRadius = (gameState: GameState) => {
    const map = MAPS[gameState.currentMapId];
    if (map?.biome === 'INTERIOR') return 30; // Full visibility inside

    let base = 4;
    if (gameState.equippedPerks.includes('vision_plus')) base += 2;
    const time = gameState.time;
    const isNight = time >= 2000 || time < 500;
    if (isNight && !gameState.equippedPerks.includes('night_vision')) base = Math.max(2, base - 2);
    return base;
};

export default function App() {
  // Center player in the larger map initially
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 20, y: 15 }, // Adjusted for larger town
    playerFacing: 'DOWN',
    currentMapId: 'map_10_10',
    stats: INITIAL_STATS,
    equipment: { HEAD: null, BODY: null, LEGS: null, WEAPON: null, OFFHAND: null, ACCESSORY: null },
    skills: INITIAL_SKILLS,
    inventory: [],
    knownRecipes: DEFAULT_RECIPES,
    secrets: SECRETS_DATA.map(s => ({ ...s, unlocked: false })),
    unlockedPerks: [],
    equippedPerks: [],
    bestiary: [],
    counters: { map_revision: 0, steps_taken: 0, enemies_killed: 0, trees_cut: 0, rocks_mined: 0, fish_caught: 0, items_crafted: 0, damage_taken: 0, puzzles_solved: 0, lore_read: 0 }, 
    logs: [{ id: 'init', message: 'Welcome to Secret Hunters!', type: 'INFO', timestamp: Date.now() }],
    flags: {},
    lastAction: null,
    isCombat: false,
    combatTargetId: null,
    activeQuest: null,
    exploration: { 'map_10_10': Array(30).fill(null).map((_, y) => Array(40).fill(0).map((_, x) => (Math.abs(x-20) <= 6 && Math.abs(y-15) <= 6) ? 1 : 0)) }, // Adjusted exploration for larger town
    worldModified: {},
    knownWaypoints: [],
    knownLocations: [],
    animations: {},
    time: 800,
    autoDistributeStats: false,
    statAllocation: { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 }
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleConfig | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<{title: string, messages: string[]} | null>(null);
  
  const [combatNumbers, setCombatNumbers] = useState<Record<string, number>>({});
  const [viewScale, setViewScale] = useState(1);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // --- LEVEL UP LOGIC ---
  const checkLevelUp = useCallback((state: GameState): GameState => {
      let newState = { ...state };
      const xpReq = calculateXpForLevel(newState.stats.level + 1);
      
      if (newState.stats.xp >= xpReq) {
          // Level Up!
          playSound('LEVEL_UP');
          const pointsGained = 5; // 5 stat points per level
          newState.stats.level += 1;
          newState.stats.maxHp += 10; // Base HP growth
          newState.stats.hp = newState.stats.maxHp;
          newState.logs = [...newState.logs, { id: uid(), message: `LEVEL UP! You are now level ${newState.stats.level}.`, type: 'INFO', timestamp: getTimestamp() }];

          // Auto Distribute Logic
          if (newState.autoDistributeStats) {
              const { str, dex, int, hp, regeneration } = newState.statAllocation;
              const totalWeight = str + dex + int + hp + regeneration;
              
              if (totalWeight > 0) {
                  let usedPoints = 0;
                  
                  // Calculate points for each stat based on %
                  const addStr = Math.floor(pointsGained * (str / totalWeight));
                  const addDex = Math.floor(pointsGained * (dex / totalWeight));
                  const addInt = Math.floor(pointsGained * (int / totalWeight));
                  const addHp = Math.floor(pointsGained * (hp / totalWeight));
                  const addRegen = Math.floor(pointsGained * (regeneration / totalWeight));

                  newState.stats.str += addStr;
                  newState.stats.dex += addDex;
                  newState.stats.int += addInt;
                  newState.stats.maxHp += (addHp * 5); // 1 pt = 5 HP
                  newState.stats.hp += (addHp * 5);
                  newState.stats.regeneration += addRegen;

                  usedPoints = addStr + addDex + addInt + addHp + addRegen;
                  newState.stats.unspentStatPoints = (newState.stats.unspentStatPoints || 0) + (pointsGained - usedPoints);
                  
                  newState.logs.push({ id: uid(), message: `Auto-distributed ${usedPoints} points.`, type: 'INFO', timestamp: getTimestamp() });
              } else {
                  newState.stats.unspentStatPoints = (newState.stats.unspentStatPoints || 0) + pointsGained;
              }
          } else {
              newState.stats.unspentStatPoints = (newState.stats.unspentStatPoints || 0) + pointsGained;
              newState.logs.push({ id: uid(), message: `Gained ${pointsGained} Stat Points!`, type: 'INFO', timestamp: getTimestamp() });
          }
      }
      return newState;
  }, []);

  // --- STAT ALLOCATION HANDLERS ---
  const handleStatIncrease = (stat: keyof Stats) => {
      setGameState(prev => {
          if (prev.stats.unspentStatPoints <= 0) return prev;
          const newStats = { ...prev.stats };
          
          if (stat === 'maxHp') { // Map generic HP button to maxHp
              newStats.maxHp += 5;
              newStats.hp += 5;
          } else {
              // @ts-ignore
              newStats[stat] += 1;
          }
          
          newStats.unspentStatPoints -= 1;
          playSound('UI_CLICK');
          return { ...prev, stats: newStats };
      });
  };

  const handleAutoDistributionChange = (enabled: boolean, allocation: any) => {
      setGameState(prev => ({
          ...prev,
          autoDistributeStats: enabled,
          statAllocation: allocation
      }));
  };

  // --- SCALE & MOBILE LOGIC ---
  useEffect(() => {
      const handleResize = () => {
          setViewportSize({ w: window.innerWidth, h: window.innerHeight });
          const mobileCheck = window.matchMedia("(max-width: 768px)").matches;
          setIsMobile(mobileCheck);
          
          if (mobileCheck) {
              // On mobile, we want a tighter zoom to see details
              setViewScale(Math.min(window.innerWidth / 320, window.innerHeight / 240) * 1.0); 
          } else {
              // On desktop, we want a fixed, nice retro scale (1.5x) rather than fitting the whole map
              // This enables the "screen scroll" feel for large maps
              setViewScale(1.5);
          }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- SAVE/LOAD ---
  useEffect(() => {
      const saved = localStorage.getItem('sh_save_v1');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (parsed.stats && parsed.playerPos) {
                  const mergedSecrets = SECRETS_DATA.map(s => {
                      const savedS = parsed.secrets.find((ps: Secret) => ps.id === s.id);
                      return savedS ? { ...s, unlocked: savedS.unlocked } : { ...s, unlocked: false };
                  });
                  
                  // Fix Exploration Mismatches (Migration for new map sizes)
                  let exp = parsed.exploration || {};
                  Object.keys(MAPS).forEach(mapId => {
                      const map = MAPS[mapId];
                      if (exp[mapId]) {
                          // If dimensions don't match, reset exploration for that map
                          if (exp[mapId].length !== map.height || (exp[mapId][0] && exp[mapId][0].length !== map.width)) {
                              console.log(`Migrating map ${mapId}: Dimensions changed. Resetting exploration.`);
                              exp[mapId] = Array(map.height).fill(null).map(() => Array(map.width).fill(0));
                              // If it's the current map, we should probably reveal center or start
                              if (mapId === 'map_10_10') {
                                   exp[mapId] = Array(30).fill(null).map((_, y) => Array(40).fill(0).map((_, x) => (Math.abs(x-20) <= 6 && Math.abs(y-15) <= 6) ? 1 : 0));
                              }
                          }
                      }
                  });

                  // Migration for Woodcutting -> Logging
                  if (parsed.skills && parsed.skills['Woodcutting']) {
                      parsed.skills['Logging'] = parsed.skills['Woodcutting'];
                      parsed.skills['Logging'].name = 'Logging';
                      delete parsed.skills['Woodcutting'];
                  }
                  // Ensure default Logging skill exists if missing
                  if (!parsed.skills['Logging']) {
                      parsed.skills['Logging'] = { name: 'Logging', level: 1, xp: 0 };
                  }

                  // Migration for knownRecipes
                  if (!parsed.knownRecipes) {
                      parsed.knownRecipes = DEFAULT_RECIPES;
                  }
                  
                  // Migration for Stat Allocation
                  if (parsed.autoDistributeStats === undefined) {
                      parsed.autoDistributeStats = false;
                      parsed.statAllocation = { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 };
                      parsed.stats.unspentStatPoints = 0;
                  }

                  setGameState({ 
                      ...parsed, 
                      secrets: mergedSecrets, 
                      exploration: exp, // Use fixed exploration
                      animations: {}, 
                      worldModified: parsed.worldModified || {}, 
                      time: parsed.time || 800 
                  });
              }
          } catch (e) { console.error(e); }
      }
      setHasLoaded(true);
  }, []);

  useEffect(() => {
      if (!hasLoaded) return;
      const timeout = setTimeout(() => localStorage.setItem('sh_save_v1', JSON.stringify(gameState)), 1000);
      return () => clearTimeout(timeout);
  }, [gameState, hasLoaded]);

  // --- TIME & REGEN LOOPS ---
  useEffect(() => {
      const interval = setInterval(() => setGameState(p => ({ ...p, time: (p.time + 1) >= 2400 ? 0 : p.time + 1 })), 250);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      const interval = setInterval(() => {
          setGameState(prev => {
              if (prev.stats.hp <= 0) return prev;
              const totalStats = getPlayerTotalStats(prev.stats, prev.equipment, prev.equippedPerks);
              
              let newSecrets = [...prev.secrets];
              let newPerks = [...prev.unlockedPerks];
              let newLogs = [...prev.logs];
              let secretsChanged = false;

              newSecrets = newSecrets.map(s => {
                  if (!s.unlocked && s.condition(prev)) {
                      secretsChanged = true;
                      playSound('SECRET');
                      newLogs.push({ id: uid(), message: `Secret Unlocked: ${s.title}`, type: 'SECRET', timestamp: getTimestamp() });
                      if (s.perkId && !newPerks.includes(s.perkId)) {
                          newPerks.push(s.perkId);
                      }
                      return { ...s, unlocked: true };
                  }
                  return s;
              });

              if (prev.stats.hp < totalStats.maxHp) {
                  return { ...prev, stats: { ...prev.stats, hp: Math.min(totalStats.maxHp, prev.stats.hp + Math.max(1, Math.floor(totalStats.regeneration))) }, secrets: secretsChanged ? newSecrets : prev.secrets, unlockedPerks: newPerks, logs: secretsChanged ? newLogs : prev.logs };
              }
              
              if (secretsChanged) {
                  return { ...prev, secrets: newSecrets, unlockedPerks: newPerks, logs: newLogs };
              }
              
              return prev;
          });
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  // --- INTERACTION & GAME LOGIC ---
  const handleInteraction = useCallback(() => {
      setGameState(prev => {
          if (activeDialogue || activePuzzle || activeModal) return prev;
          const map = MAPS[prev.currentMapId];
          const px = prev.playerPos.x, py = prev.playerPos.y;
          let tx = px, ty = py;
          if (prev.playerFacing === 'UP') ty -= 1;
          if (prev.playerFacing === 'DOWN') ty += 1;
          if (prev.playerFacing === 'LEFT') tx -= 1;
          if (prev.playerFacing === 'RIGHT') tx += 1;
          if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return prev;
          const entity = map.entities.find(e => e.pos.x === tx && e.pos.y === ty);
          const tile = map.tiles[ty][tx];
          let newLogs = [...prev.logs], newAnimations = { ...prev.animations }, newInventory = [...prev.inventory], newCounters = { ...prev.counters };
          
          if (entity) {
              if (entity.type === 'NPC') {
                  playSound('UI_CLICK');
                  entity.facing = prev.playerFacing === 'UP' ? 'DOWN' : prev.playerFacing === 'DOWN' ? 'UP' : prev.playerFacing === 'LEFT' ? 'RIGHT' : 'LEFT';
                  
                  // Merchant Interaction
                  if (entity.name.includes('Merchant')) {
                      setActiveModal('MERCHANT');
                  } else {
                      setActiveDialogue({ title: entity.name, messages: entity.dialogue || ['...'] });
                  }
              } else if (entity.type === 'OBJECT') {
                  if (entity.subType === 'ANVIL') setActiveModal('ANVIL');
                  else if (entity.subType === 'WORKBENCH') setActiveModal('WORKBENCH');
                  else if (entity.subType === 'ALCHEMY_TABLE') setActiveModal('ALCHEMY_TABLE');
                  else if (entity.subType === 'SIGNPOST') {
                      playSound('UI_CLICK');
                      setActiveDialogue({ title: 'Sign', messages: entity.destination?.name ? [`To ${entity.destination.name}`] : ['A weather-worn sign.'] });
                      newCounters.lore_read = (newCounters.lore_read || 0) + 1;
                  } else if (entity.subType === 'LOCKED_DOOR') setActivePuzzle({ id: entity.id, type: 'KEYPAD', content: 'ENTER SECURITY CODE', solution: '1234' });
                  else if (entity.subType === 'LOCKED_CHEST') {
                      const key = prev.inventory.find(i => i.id === 'iron_key');
                      if (key) { playSound('UI_CLICK'); newLogs.push({ id: uid(), message: 'Unlocked Chest!', type: 'INFO', timestamp: getTimestamp() }); newInventory = removeFromInventory('iron_key', 1, prev); entity.subType = 'CHEST'; entity.type = 'OBJECT'; } 
                      else newLogs.push({ id: uid(), message: 'Locked. Needs Iron Key.', type: 'INFO', timestamp: getTimestamp() });
                  }
                  if (entity.subType === 'CHEST') {
                      playSound('UI_CLICK');
                      const lootId = entity.loot || 'potion_small';
                      const lootItem = ITEMS[lootId];
                      if (lootItem) {
                          newInventory = addToInventory(prepareItemForInventory(lootItem), { ...prev, inventory: newInventory });
                          newLogs.push({ id: uid(), message: `Found ${lootItem.name}!`, type: 'LOOT', timestamp: getTimestamp() });
                          MAPS[prev.currentMapId].entities = map.entities.filter(e => e.id !== entity.id);
                      } else newLogs.push({ id: uid(), message: 'Empty.', type: 'INFO', timestamp: getTimestamp() });
                  }
              }
          } else {
              if (tile === 'WATER' && prev.equipment.WEAPON?.id === 'fishing_rod') {
                  playSound('GATHER');
                  newAnimations['player'] = 'FISH_CAST';
                  setTimeout(() => setGameState(p => ({ ...p, animations: { ...p.animations, player: 'FISH_CATCH' }, inventory: addToInventory(prepareItemForInventory(ITEMS['raw_fish']), p), logs: [...p.logs, {id:uid(), message: 'Caught a Fish!', type: 'LOOT', timestamp: getTimestamp()}], counters: { ...p.counters, fish_caught: (p.counters.fish_caught || 0) + 1 } })), 1000);
              }
          }
          return { ...prev, logs: newLogs, inventory: newInventory, animations: newAnimations, counters: newCounters };
      });
  }, [activeDialogue, activePuzzle, activeModal]);

  // Use the new movement system
  const handlePlayerAction = useCallback((dx: number, dy: number) => {
      setGameState(prev => {
          if (activePuzzle || activeDialogue) return prev;
          
          let nextState = handlePlayerMove(prev, dx, dy, setActiveModal);
          
          // Check for Level Up after movement/action
          nextState = checkLevelUp(nextState);
          
          // Temporary display logic for animations managed by system
          if (Object.keys(nextState.animations).length > 0) {
              setTimeout(() => {
                  setGameState(p => ({ ...p, animations: {} }));
              }, 400);
          }
          
          return nextState;
      });
  }, [activePuzzle, activeDialogue, checkLevelUp]);

  useEffect(() => {
      const h = (e: KeyboardEvent) => {
          if (activeModal && activeModal !== 'DEATH') { if (e.key === 'Escape') setActiveModal(null); return; }
          if (activeModal === 'DEATH') return;
          if (activePuzzle) { if (e.key === 'Escape') setActivePuzzle(null); return; }
          if (activeDialogue) { if (e.key === 'Escape') setActiveDialogue(null); return; }
          if (['w','ArrowUp'].includes(e.key)) handlePlayerAction(0, -1);
          if (['s','ArrowDown'].includes(e.key)) handlePlayerAction(0, 1);
          if (['a','ArrowLeft'].includes(e.key)) handlePlayerAction(-1, 0);
          if (['d','ArrowRight'].includes(e.key)) handlePlayerAction(1, 0);
          if (e.key === 'e' || e.key === 'E') handleInteraction();
          if (e.key === 'i') setActiveModal('INVENTORY');
          if (e.key === 'k') setActiveModal('SKILLS');
      };
      window.addEventListener('keydown', h);
      return () => window.removeEventListener('keydown', h);
  }, [activeModal, activePuzzle, activeDialogue, handlePlayerAction, handleInteraction]);

  const toggleEquip = (item: Item) => { playSound('UI_CLICK'); setGameState(prev => ({ ...prev, equipment: { ...prev.equipment, [item.slot!]: prev.equipment[item.slot!]?.id === item.id ? null : item } })); };
  const craft = (recipe: Recipe) => {
      setGameState(prev => {
          let inv = [...prev.inventory];
          if (!recipe.ingredients.every(i => inv.find(x => x.id === i.itemId && x.count >= i.count))) return prev;
          recipe.ingredients.forEach(i => inv = removeFromInventory(i.itemId, i.count, { ...prev, inventory: inv }));
          const { updatedSkill, statChanges } = applySkillXp(prev.stats, prev.skills, recipe.skill, recipe.xpReward);
          playSound('CRAFT');
          const resultItem = ITEMS[recipe.resultItemId];
          const newCounters = { ...prev.counters, items_crafted: (prev.counters.items_crafted || 0) + 1 };
          return { ...prev, inventory: addToInventory(prepareItemForInventory(resultItem), { ...prev, inventory: inv }), skills: { ...prev.skills, [recipe.skill]: updatedSkill }, stats: { ...prev.stats, ...statChanges }, counters: newCounters };
      });
  };
  const lightingOpacity = (() => {
      const t = gameState.time;
      if (t < 500) return 0.6; if (t < 800) return 0.6 - ((t-500)/300) * 0.6; if (t < 1800) return 0; if (t < 2200) return ((t-1800)/400) * 0.6; return 0.6;
  })();
  const handlePuzzleSolve = () => {
      playSound('SECRET'); setActivePuzzle(null);
      setGameState(prev => {
          const map = MAPS[prev.currentMapId]; const newEntities = map.entities.filter(e => e.id !== activePuzzle?.id); MAPS[prev.currentMapId].entities = newEntities; const newCounters = { ...prev.counters, puzzles_solved: (prev.counters.puzzles_solved || 0) + 1 };
          return { ...prev, logs: [...prev.logs, { id: uid(), message: 'Puzzle Solved! Passage Opened.', type: 'SECRET', timestamp: getTimestamp() }], counters: newCounters };
      });
  };

  const handleConsume = (item: Item) => {
      // Placeable Items Logic
      if (item.id === 'mob_spawner_item') {
          setGameState(prev => {
              const map = MAPS[prev.currentMapId];
              
              // Calculate target position based on facing
              let tx = prev.playerPos.x;
              let ty = prev.playerPos.y;
              if (prev.playerFacing === 'UP') ty -= 1;
              if (prev.playerFacing === 'DOWN') ty += 1;
              if (prev.playerFacing === 'LEFT') tx -= 1;
              if (prev.playerFacing === 'RIGHT') tx += 1;

              // Check bounds
              if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) {
                  playSound('BUMP');
                  return prev; 
              }

              // Check if space is occupied by entity or blocked tile
              const isOccupied = map.entities.some(e => e.pos.x === tx && e.pos.y === ty);
              const tile = map.tiles[ty][tx];
              const blockedTiles = ['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'LAVA', 'VOID'];
              
              if (isOccupied || blockedTiles.includes(tile)) {
                  return {
                      ...prev,
                      logs: [...prev.logs, { id: uid(), message: "Cannot place that here.", type: 'INFO', timestamp: getTimestamp() }]
                  };
              }

              // Place Spawner
              playSound('CRAFT');
              const newEntity: Entity = {
                  id: `spawner_placed_${uid()}`,
                  name: `Placed Cage`,
                  type: 'OBJECT',
                  subType: 'MOB_SPAWNER',
                  symbol: '#',
                  color: 'darkred',
                  pos: {x: tx, y: ty},
                  hp: 100,
                  maxHp: 100,
                  level: 1,
                  spawnType: 'Skeleton', // Default spawn for placed cages
                  lastSpawnTime: 0,
                  lastSpawnStep: 0
              };
              
              map.entities.push(newEntity);

              return {
                  ...prev,
                  inventory: removeFromInventory(item.id, 1, prev),
                  logs: [...prev.logs, { id: uid(), message: "Placed Mob Spawner.", type: 'INFO', timestamp: getTimestamp() }]
              };
          });
          return;
      }

      // Blueprint Logic
      if (item.type === 'BLUEPRINT' && item.recipeId) {
          setGameState(prev => {
              if (prev.knownRecipes.includes(item.recipeId!)) {
                  return { ...prev, logs: [...prev.logs, { id: uid(), message: "You already know this recipe.", type: 'INFO', timestamp: getTimestamp() }]};
              }
              playSound('LEVEL_UP');
              return {
                  ...prev,
                  knownRecipes: [...prev.knownRecipes, item.recipeId!],
                  inventory: removeFromInventory(item.id, 1, prev),
                  logs: [...prev.logs, { id: uid(), message: `Learned Recipe: ${item.name.replace('Blueprint: ', '')}`, type: 'SECRET', timestamp: getTimestamp() }]
              };
          });
          return;
      }

      // Default Consumable Logic (Potions/Food)
      playSound('GATHER'); 
      setGameState(p => ({ 
          ...p, 
          stats: { ...p.stats, hp: Math.min(p.stats.maxHp, p.stats.hp + (item.healAmount||0)) }, 
          inventory: removeFromInventory(item.id, 1, p) 
      })); 
  };

  const handleBuy = (itemId: string, price: number) => {
      setGameState(prev => {
          if (prev.stats.gold < price) return prev;
          playSound('UI_CLICK'); // Or a generic 'COINS' sound if available
          const item = ITEMS[itemId];
          
          // Special case for blueprints: Add to inventory, not directly unlock (user must consume)
          // But wait, if they buy it, they get the item. `handleConsume` handles unlocking.
          
          return {
              ...prev,
              stats: { ...prev.stats, gold: prev.stats.gold - price },
              inventory: addToInventory(prepareItemForInventory(item), prev),
              logs: [...prev.logs, { id: uid(), message: `Bought ${item.name}`, type: 'TRADE', timestamp: getTimestamp() }]
          };
      });
  };

  const handleSell = (item: Item, price: number) => {
      setGameState(prev => {
          playSound('UI_CLICK');
          return {
              ...prev,
              stats: { ...prev.stats, gold: prev.stats.gold + price },
              inventory: removeFromInventory(item.id, 1, prev),
              logs: [...prev.logs, { id: uid(), message: `Sold ${item.name} for ${price}g`, type: 'TRADE', timestamp: getTimestamp() }]
          };
      });
  };

  // Camera now active for BOTH mobile and desktop to support scrolling maps
  const cameraPosition = useMemo(() => {
      const currentMap = MAPS[gameState.currentMapId];
      if (!currentMap) return { x: 0, y: 0 };
      
      const tileSize = 32;
      const playerX = gameState.playerPos.x * tileSize + (tileSize/2);
      const playerY = gameState.playerPos.y * tileSize + (tileSize/2);
      
      const centerX = viewportSize.w / 2;
      const centerY = viewportSize.h / 2;
      
      // Calculate "Ideal" Camera Position (Centered on Player)
      // We want the player's center to be at the screen center.
      // ScreenCenter = Translate + (Player * Scale)
      // Translate = ScreenCenter - (Player * Scale)
      
      let targetX = centerX - (playerX * viewScale);
      let targetY = centerY - (playerY * viewScale);

      // Clamp Logic
      const mapWidthPx = currentMap.width * tileSize * viewScale;
      const mapHeightPx = currentMap.height * tileSize * viewScale;

      // Clamp X
      // If map is smaller than screen, center it
      if (mapWidthPx <= viewportSize.w) {
          targetX = (viewportSize.w - mapWidthPx) / 2;
      } else {
          // If map is larger, clamp to edges
          // Left edge of map (x=0) cannot be > 0. (Map shouldn't be pushed right into void) => targetX <= 0
          // Right edge of map (x=mapWidth) cannot be < viewportW. (Map shouldn't be pushed left into void) 
          // rightEdge = targetX + mapWidthPx >= viewportW  => targetX >= viewportW - mapWidthPx
          targetX = Math.max(viewportSize.w - mapWidthPx, Math.min(0, targetX));
      }

      // Clamp Y
      if (mapHeightPx <= viewportSize.h) {
          targetY = (viewportSize.h - mapHeightPx) / 2;
      } else {
          targetY = Math.max(viewportSize.h - mapHeightPx, Math.min(0, targetY));
      }
      
      return { x: targetX, y: targetY };
  }, [gameState.playerPos, gameState.currentMapId, viewScale, viewportSize]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <GameRenderer 
            currentMap={MAPS[gameState.currentMapId]}
            gameState={gameState}
            viewScale={viewScale}
            visionRadius={getVisionRadius(gameState)}
            lightingOpacity={lightingOpacity}
            combatNumbers={combatNumbers}
            cameraPosition={cameraPosition}
        />
        <GameHUD 
            gameState={gameState}
            playerStats={getPlayerTotalStats(gameState.stats, gameState.equipment, gameState.equippedPerks)}
            activeModal={activeModal}
            activePuzzle={activePuzzle}
            activeDialogue={activeDialogue}
            setActiveModal={setActiveModal}
            onMove={(dx, dy) => handlePlayerAction(dx, dy)}
            onInteract={handleInteraction}
            onEquip={toggleEquip}
            onCraft={craft}
            onRespawn={() => { setGameState(p => ({ ...p, playerPos: {x:20,y:15}, currentMapId: 'map_10_10', stats: { ...p.stats, hp: p.stats.maxHp } })); setActiveModal(null); }}
            onResetSave={() => { localStorage.removeItem('sh_save_v1'); window.location.reload(); }}
            onConsume={handleConsume}
            onTogglePerk={(id) => { setGameState(p => { const eq = p.equippedPerks.includes(id) ? p.equippedPerks.filter(x => x !== id) : [...p.equippedPerks, id].slice(0,3); return { ...p, equippedPerks: eq }; }); }}
            onPuzzleSolve={handlePuzzleSolve}
            onPuzzleClose={() => setActivePuzzle(null)}
            onDialogueClose={() => setActiveDialogue(null)}
            formatTime={(t) => `${Math.floor(t/100).toString().padStart(2,'0')}:${Math.floor((t%100)*0.6).toString().padStart(2,'0')}`}
            onBuy={handleBuy}
            onSell={handleSell}
            onStatIncrease={handleStatIncrease}
            onAutoConfigChange={handleAutoDistributionChange}
        />
    </div>
  );
}
