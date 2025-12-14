
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, SkillName, Item, Stats, AnimationType, LogEntry, Recipe, TileType, Secret, Entity, Position, GameMap } from './types';
import { MAPS, INITIAL_STATS, INITIAL_SKILLS, ITEMS, WEAPON_TEMPLATES, PERKS, DEFAULT_RECIPES, uid, calculateXpForLevel, calculateSkillLevel, SCALE_FACTOR, MONSTER_TEMPLATES } from './constants';
import { ALL_SECRETS } from './data/secrets/index';
import { ACHIEVEMENTS } from './data/achievements';
import { QUESTS } from './data/quests';
import { playSound, setMasterVolume } from './services/audioService';
import { GameRenderer } from './components/renderer/GameRenderer';
import { GameHUD } from './components/hud/GameHUD';
import { PuzzleConfig } from './components/modals/PuzzleModal';
import { handlePlayerMove } from './systems/movement';
import { generateBossRewards, generateLoot } from './services/itemService';
import { initializeWorld, regenerateAllMaps } from './systems/mapGenerator';
import { checkQuestUpdate } from './systems/questUtils';
import { handlePlayerAttack } from './systems/combat/playerAttack';
import { processEnemyTurn } from './systems/combat/enemyAI';
import { processEnemyTurns, processSpawners } from './systems/ai'; 

// --- Initialize World if Empty (Fix for Circular Dependency) ---
if (Object.keys(MAPS).length === 0) {
    console.log("Initializing World Map...");
    initializeWorld(MAPS, ALL_SECRETS);
}

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
    if (!['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY', 'COLLECTIBLE', 'GADGET', 'BLUEPRINT'].includes(item.type)) {
        item.id = uid();
    }
    return item;
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

const distributePoints = (stats: Stats, allocation: any, points: number): { newStats: Stats, allocated: boolean } => {
    if (points <= 0) return { newStats: stats, allocated: false };
    
    const { str, dex, int, hp, regeneration } = allocation;
    const totalWeight = str + dex + int + hp + regeneration;
    const result = { ...stats };

    if (totalWeight > 0) {
        let usedPoints = 0;
        const addStr = Math.floor(points * (str / totalWeight));
        const addDex = Math.floor(points * (dex / totalWeight));
        const addInt = Math.floor(points * (int / totalWeight));
        const addHp = Math.floor(points * (hp / totalWeight));
        const addRegen = Math.floor(points * (regeneration / totalWeight));

        result.str += addStr;
        result.dex += addDex;
        result.int += addInt;
        
        const hpStatVal = Math.floor(5 * Math.pow(SCALE_FACTOR, result.level));
        result.maxHp += (addHp * hpStatVal);
        result.hp += (addHp * hpStatVal);
        
        result.regeneration += addRegen;

        usedPoints = addStr + addDex + addInt + addHp + addRegen;
        result.unspentStatPoints = (result.unspentStatPoints || 0) - usedPoints;
        return { newStats: result, allocated: true };
    }
    return { newStats: stats, allocated: false };
};

export default function App() {
  // --- FRESH STATE INITIALIZATION ---
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 28, y: 22 }, // SPAWN: Town Square
    playerFacing: 'DOWN',
    currentMapId: 'map_10_10',
    stats: INITIAL_STATS,
    equipment: { HEAD: null, BODY: null, LEGS: null, WEAPON: null, OFFHAND: null, ACCESSORY: null },
    skills: INITIAL_SKILLS,
    inventory: [],
    knownRecipes: DEFAULT_RECIPES,
    unlockedSecretIds: [],
    unlockedAchievementIds: [],
    completedQuestIds: [],
    unlockedPerks: [],
    equippedPerks: [],
    unlockedCosmetics: ['party_hat'], 
    equippedCosmetic: 'party_hat', // Default
    activeTitle: null,
    bestiary: [],
    counters: { map_revision: 999, steps_taken: 0, enemies_killed: 0, trees_cut: 0, rocks_mined: 0, fish_caught: 0, items_crafted: 0, damage_taken: 0, puzzles_solved: 0, lore_read: 0 }, 
    logs: [{ id: 'init', message: 'You arrive at Havens Rest.', type: 'INFO', timestamp: Date.now() }],
    flags: {},
    lastAction: null,
    isCombat: false,
    lastCombatTime: 0,
    combatTargetId: null,
    activeQuest: null,
    // Exploration: Initialize interior as revealed, town as hidden (60x50)
    exploration: { 
        'interior_home': Array(8).fill(null).map(() => Array(10).fill(1)), 
        'map_10_10': Array(50).fill(null).map(() => Array(60).fill(0)) 
    },
    worldModified: {},
    knownWaypoints: [],
    knownLocations: [],
    animations: {},
    time: 800,
    autoDistributeStats: false,
    statAllocation: { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 },
    worldTier: 0
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleConfig | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<{title: string, messages: string[]} | null>(null);
  
  const [combatNumbers, setCombatNumbers] = useState<Record<string, number>>({});
  const [viewScale, setViewScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1.0); 
  const [volume, setVolume] = useState(0.3); 
  const [isMobile, setIsMobile] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [hasLoaded, setHasLoaded] = useState(false);

  // --- ENSURE MAP INTEGRITY ON MOUNT ---
  useEffect(() => {
      // If the map is missing or wrong size, regenerate
      if (!MAPS['map_10_10'] || MAPS['map_10_10'].width < 60) {
          console.log("Regenerating Malformed World...");
          regenerateAllMaps(MAPS, ALL_SECRETS);
          // Also reset player pos if they are OOB
          setGameState(prev => ({
              ...prev,
              playerPos: { x: 28, y: 22 },
              currentMapId: 'map_10_10',
              exploration: { 
                'interior_home': Array(8).fill(null).map(() => Array(10).fill(1)), 
                'map_10_10': Array(50).fill(null).map(() => Array(60).fill(0)) 
              },
          }));
      }
  }, []);

  // --- SAVE/LOAD ---
  useEffect(() => {
      const saveKey = 'sh_save_v5_fix'; // NEW SAVE KEY TO FORCE UPDATE
      const saved = localStorage.getItem(saveKey); 
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (parsed.gameState && parsed.gameState.stats) {
                  const gs = parsed.gameState;
                  // Restore Settings
                  if (parsed.settings) {
                      setVolume(parsed.settings.volume ?? 0.3);
                      setUserZoom(parsed.settings.zoom ?? 1.0);
                  }
                  
                  let exp = gs.exploration || {};
                  
                  // Ensure exploration grids match current map sizes
                  Object.keys(MAPS).forEach(mapId => {
                      const map = MAPS[mapId];
                      if (map) {
                          if (!exp[mapId] || exp[mapId].length !== map.height || (exp[mapId][0] && exp[mapId][0].length !== map.width)) {
                              console.log(`Resizing exploration grid for ${mapId}`);
                              const newGrid = Array(map.height).fill(null).map(() => Array(map.width).fill(0));
                              // Reveal Center of Town for safety
                              if (mapId === 'map_10_10') {
                                   for(let y=0; y<map.height; y++) {
                                       for(let x=0; x<map.width; x++) {
                                           if (Math.abs(x-28) <= 6 && Math.abs(y-22) <= 6) newGrid[y][x] = 1;
                                       }
                                   }
                              }
                              exp[mapId] = newGrid;
                          }
                      }
                  });

                  setGameState({ 
                      ...gs, 
                      exploration: exp,
                      animations: {}, 
                      worldModified: gs.worldModified || {}, 
                      time: gs.time || 800,
                      // FORCE HAT
                      unlockedCosmetics: [...new Set([...(gs.unlockedCosmetics || []), 'party_hat'])],
                      equippedCosmetic: 'party_hat'
                  });
              }
          } catch (e) { console.error(e); }
      }
      setHasLoaded(true);
  }, []);

  const handleSave = () => {
      const saveData = {
          gameState: gameState,
          settings: {
              volume,
              zoom: userZoom
          },
          timestamp: Date.now()
      };
      localStorage.setItem('sh_save_v5_fix', JSON.stringify(saveData));
  };

  useEffect(() => {
      if (!hasLoaded) return;
      const interval = setInterval(handleSave, 10000);
      return () => clearInterval(interval);
  }, [gameState, hasLoaded, volume, userZoom]);

  // NEW: Combat Number Cleanup Loop
  useEffect(() => {
      if (Object.keys(combatNumbers).length > 0) {
          const timer = setTimeout(() => {
              setCombatNumbers({});
          }, 1200); 
          return () => clearTimeout(timer);
      }
  }, [combatNumbers]);

  // NEW: AI Game Loop (Tick)
  useEffect(() => {
      const aiInterval = setInterval(() => {
          setGameState(prev => {
              if (activeModal || activePuzzle || activeDialogue) return prev;

              const map = MAPS[prev.currentMapId];
              if (!map || map.biome === 'INTERIOR') return prev; 

              // 1. Process Spawners
              const entitiesWithSpawns = processSpawners(map.entities, map, prev.playerPos, prev.counters.steps_taken || 0);
              
              // 2. Process Enemy Movement
              const aiResult = processEnemyTurns(prev, { ...map, entities: entitiesWithSpawns }, prev.playerPos);
              
              // Update Map
              MAPS[prev.currentMapId].entities = aiResult.entities;

              // Handle Damage to Player
              let newStats = { ...prev.stats };
              let newCounters = { ...prev.counters };
              if (aiResult.damageToPlayer > 0) {
                  newStats.hp -= aiResult.damageToPlayer;
                  newCounters.damage_taken = (newCounters.damage_taken || 0) + aiResult.damageToPlayer;
              }

              return {
                  ...prev,
                  stats: newStats,
                  counters: newCounters,
                  logs: [...prev.logs, ...aiResult.logs].slice(-50), 
                  animations: { ...prev.animations, ...aiResult.anims } 
              };
          });
      }, 800); 
      return () => clearInterval(aiInterval);
  }, [activeModal, activePuzzle, activeDialogue]);

  const handleOpenModal = (modalName: string | null) => {
      setActiveModal(modalName);
      if (modalName === 'SECRETS') {
          setGameState(prev => ({
              ...prev,
              flags: { ...prev.flags, new_secret: false }
          }));
      }
  };

  useEffect(() => {
      setMasterVolume(volume);
  }, [volume]);

  // --- LEVEL UP LOGIC ---
  const checkLevelUp = useCallback((state: GameState): GameState => {
      let newState = { ...state };
      const xpReq = calculateXpForLevel(newState.stats.level + 1);
      
      if (newState.stats.xp >= xpReq) {
          playSound('LEVEL_UP');
          const pointsGained = Math.max(5, Math.floor(5 * Math.pow(1.05, newState.stats.level)));
          newState.stats.level += 1;
          const hpGain = Math.floor(10 * Math.pow(SCALE_FACTOR, newState.stats.level));
          newState.stats.maxHp += hpGain; 
          newState.stats.hp = newState.stats.maxHp;
          newState.stats.unspentStatPoints = (newState.stats.unspentStatPoints || 0) + pointsGained;
          newState.logs = [...newState.logs, { id: uid(), message: `LEVEL UP! Level ${newState.stats.level}. +${pointsGained} Stats.`, type: 'INFO', timestamp: getTimestamp() }];

          if (newState.autoDistributeStats) {
              const { newStats, allocated } = distributePoints(newState.stats, newState.statAllocation, newState.stats.unspentStatPoints);
              newState.stats = newStats;
              if (allocated) {
                  newState.logs.push({ id: uid(), message: `Auto-distributed stats.`, type: 'INFO', timestamp: getTimestamp() });
              }
          }
      }
      return newState;
  }, []);

  // --- HANDLERS ---
  const handleStatIncrease = (stat: keyof Stats) => {
      setGameState(prev => {
          if (prev.stats.unspentStatPoints <= 0) return prev;
          const newStats = { ...prev.stats };
          if (stat === 'maxHp') { 
              const hpStatVal = Math.floor(5 * Math.pow(SCALE_FACTOR, newStats.level));
              newStats.maxHp += hpStatVal;
              newStats.hp += hpStatVal;
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
      setGameState(prev => {
          let newState = { ...prev, autoDistributeStats: enabled, statAllocation: allocation };
          if (enabled && newState.stats.unspentStatPoints > 0) {
              const { newStats, allocated } = distributePoints(newState.stats, allocation, newState.stats.unspentStatPoints);
              newState.stats = newStats;
              if (allocated) {
                  newState.logs = [...newState.logs, { id: uid(), message: `Auto-distributed available points.`, type: 'INFO', timestamp: getTimestamp() }];
              }
          }
          return newState;
      });
  };

  const handleResetStats = () => {
      setGameState(prev => {
          const level = prev.stats.level;
          let totalPoints = 0;
          let naturalMaxHp = INITIAL_STATS.maxHp;
          for (let l = 1; l < level; l++) {
              const points = Math.max(5, Math.floor(5 * Math.pow(1.05, l)));
              totalPoints += points;
              const nextLvl = l + 1;
              const hpGain = Math.floor(10 * Math.pow(SCALE_FACTOR, nextLvl));
              naturalMaxHp += hpGain;
          }
          const newStats = {
              ...prev.stats,
              str: INITIAL_STATS.str,
              dex: INITIAL_STATS.dex,
              int: INITIAL_STATS.int,
              regeneration: INITIAL_STATS.regeneration,
              maxHp: naturalMaxHp,
              hp: naturalMaxHp,
              unspentStatPoints: totalPoints
          };
          playSound('SECRET');
          return { ...prev, stats: newStats, logs: [...prev.logs, { id: uid(), message: `Stats Reset! ${totalPoints} points refunded.`, type: 'INFO', timestamp: getTimestamp() }] };
      });
  };

  // --- TIME & REGEN LOOPS ---
  useEffect(() => {
      const interval = setInterval(() => setGameState(p => ({ ...p, time: (p.time + 1) >= 2400 ? 0 : p.time + 1 })), 250);
      return () => clearInterval(interval);
  }, []);

  // --- UNLOCK CHECKER LOOP (Secrets & Achievements) ---
  useEffect(() => {
      const interval = setInterval(() => {
          setGameState(prev => {
              if (prev.stats.hp <= 0) return prev;
              const totalStats = getPlayerTotalStats(prev.stats, prev.equipment, prev.equippedPerks);
              
              let newPerks = [...prev.unlockedPerks];
              let newCosmetics = [...prev.unlockedCosmetics];
              let newLogs = [...prev.logs];
              let newSecretIds = [...prev.unlockedSecretIds];
              let newAchievementIds = [...prev.unlockedAchievementIds];
              let newStats = { ...prev.stats };
              
              let secretsChanged = false;
              let achievementChanged = false;

              // Secrets
              ALL_SECRETS.forEach(s => {
                  if (!newSecretIds.includes(s.id) && s.condition(prev)) {
                      secretsChanged = true;
                      newSecretIds.push(s.id);
                      playSound('SECRET');
                      newLogs.push({ id: uid(), message: `Secret: ${s.title}`, type: 'SECRET', timestamp: getTimestamp() });
                      
                      if (s.perkId && !newPerks.includes(s.perkId)) newPerks.push(s.perkId);
                      if (s.cosmeticUnlock && !newCosmetics.includes(s.cosmeticUnlock)) newCosmetics.push(s.cosmeticUnlock);
                      
                      if (s.statBonus) {
                          Object.entries(s.statBonus).forEach(([key, val]) => {
                              // @ts-ignore
                              if (typeof val === 'number') newStats[key] = (newStats[key] || 0) + val;
                          });
                      }
                  }
              });

              // Achievements
              ACHIEVEMENTS.forEach(ach => {
                  if (!newAchievementIds.includes(ach.id) && ach.condition(prev)) {
                      achievementChanged = true;
                      newAchievementIds.push(ach.id);
                      playSound('LEVEL_UP');
                      newLogs.push({ id: uid(), message: `Achievement: ${ach.title}`, type: 'QUEST', timestamp: getTimestamp() });
                      if (ach.reward.gold) newStats.gold += ach.reward.gold;
                      if (ach.reward.xp) newStats.xp += ach.reward.xp;
                  }
              });

              if (Date.now() - prev.lastCombatTime > 5000) {
                  if (newStats.hp < totalStats.maxHp) {
                      newStats.hp = Math.min(totalStats.maxHp, newStats.hp + Math.max(1, Math.floor(totalStats.regeneration)));
                  }
              }
              
              if (secretsChanged || achievementChanged) {
                  const flagUpdate = secretsChanged ? { ...prev.flags, new_secret: true } : prev.flags;
                  return { 
                      ...prev, 
                      stats: newStats,
                      unlockedSecretIds: newSecretIds,
                      unlockedAchievementIds: newAchievementIds,
                      unlockedPerks: newPerks, 
                      unlockedCosmetics: newCosmetics,
                      logs: newLogs, 
                      flags: flagUpdate
                  };
              }
              
              return { ...prev, stats: newStats };
          });
      }, 2000); 
      return () => clearInterval(interval);
  }, []);

  const handleTogglePerk = (id: string) => {
      // Toggle Hat Logic handled here now for simplicity if ID starts with cosmetic keyword
      if (gameState.unlockedCosmetics.includes(id)) {
           setGameState(p => ({
               ...p,
               equippedCosmetic: p.equippedCosmetic === id ? null : id
           }));
           return;
      }

      if (PERKS[id]) {
          setGameState(p => { 
              const eq = p.equippedPerks.includes(id) ? p.equippedPerks.filter(x => x !== id) : [...p.equippedPerks, id].slice(0,3); 
              return { ...p, equippedPerks: eq }; 
          });
      }
  };

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
          let newLogs = [...prev.logs], newAnimations = { ...prev.animations }, newInventory = [...prev.inventory], newCounters = { ...prev.counters };
          let newActiveQuest = prev.activeQuest;
          let newStats = { ...prev.stats };
          let newSkills = { ...prev.skills };
          let completedQuestIds = [...prev.completedQuestIds];
          let newCombatTime = prev.lastCombatTime;
          let newBestiary = [...prev.bestiary];
          let nextMapEntities = [...map.entities];
          let newCombatNumbers = { ...combatNumbers };
          let newWorldTier = prev.worldTier;

          if (entity) {
              if (entity.type === 'ENEMY' || entity.subType === 'MOB_SPAWNER') {
                  const result = handlePlayerAttack(prev);
                  const attackRes = result.newState;
                  
                  newLogs = attackRes.logs;
                  newAnimations = attackRes.animations;
                  newStats = attackRes.stats;
                  newSkills = attackRes.skills;
                  newCounters = attackRes.counters;
                  newInventory = attackRes.inventory;
                  newBestiary = attackRes.bestiary;
                  nextMapEntities = MAPS[prev.currentMapId].entities;
                  newCombatNumbers = result.damageEvents;
                  newCombatTime = Date.now();

                  const mapAfterPlayer = { ...map, entities: nextMapEntities };
                  const aiResult = processEnemyTurn({ ...prev, ...attackRes }, mapAfterPlayer);
                  
                  nextMapEntities = aiResult.updatedEntities;
                  newLogs = [...newLogs, ...aiResult.logs];
                  newAnimations = { ...newAnimations, ...aiResult.animations };
                  
                  if (aiResult.damageToPlayer > 0) {
                      newStats.hp -= aiResult.damageToPlayer;
                      newCounters.damage_taken = (newCounters.damage_taken || 0) + aiResult.damageToPlayer;
                      newCombatNumbers['player'] = aiResult.damageToPlayer;
                      if (newStats.hp <= 0) setActiveModal('DEATH');
                  }
                  MAPS[prev.currentMapId].entities = nextMapEntities;

              }
              else if (entity.name === 'Chicken') {
                  playSound('UI_CLICK');
                  newAnimations[entity.id] = 'DODGE';
                  newCounters['poked_chicken'] = (newCounters['poked_chicken'] || 0) + 1;
                  newLogs.push({ id: uid(), message: "Bawk!", type: 'INFO', timestamp: Date.now() });
              }
              else if (entity.type === 'NPC') {
                  playSound('UI_CLICK');
                  entity.facing = prev.playerFacing === 'UP' ? 'DOWN' : prev.playerFacing === 'DOWN' ? 'UP' : prev.playerFacing === 'LEFT' ? 'RIGHT' : 'LEFT';
                  if (entity.questId) {
                      const questDef = QUESTS[entity.questId];
                      if (prev.activeQuest && prev.activeQuest.id === entity.questId) {
                          if (prev.activeQuest.currentCount >= prev.activeQuest.targetCount) {
                              playSound('LEVEL_UP');
                              newStats.xp += prev.activeQuest.reward.xp;
                              if (prev.activeQuest.reward.gold) newStats.gold += prev.activeQuest.reward.gold;
                              if (prev.activeQuest.reward.itemId) {
                                  const rewardItem = ITEMS[prev.activeQuest.reward.itemId];
                                  if (rewardItem) {
                                      const count = prev.activeQuest.reward.itemCount || 1;
                                      for (let i=0; i<count; i++) newInventory = addToInventory(prepareItemForInventory(rewardItem), { ...prev, inventory: newInventory });
                                  }
                              }
                              completedQuestIds.push(prev.activeQuest.id);
                              newLogs.push({ id: uid(), message: `Quest Completed: ${prev.activeQuest.title}`, type: 'QUEST', timestamp: getTimestamp() });
                              setActiveDialogue({ title: entity.name, messages: questDef.dialogueEnd || ["Thanks!"] });
                              newActiveQuest = null;
                          } else {
                              setActiveDialogue({ title: entity.name, messages: [`How goes the hunt? (${prev.activeQuest.currentCount}/${prev.activeQuest.targetCount})`] });
                          }
                      } else if (completedQuestIds.includes(entity.questId)) {
                          setActiveDialogue({ title: entity.name, messages: ["Thanks again for your help."] });
                      } else if (!prev.activeQuest) {
                          newActiveQuest = { ...questDef, currentCount: 0, completed: false };
                          setActiveDialogue({ title: entity.name, messages: questDef.dialogueStart || ["Need help."] });
                          newLogs.push({ id: uid(), message: `Quest Accepted: ${questDef.title}`, type: 'QUEST', timestamp: getTimestamp() });
                          playSound('SECRET');
                      } else {
                          setActiveDialogue({ title: entity.name, messages: ["Finish your current task first."] });
                      }
                  }
                  else if (entity.name.includes('Merchant')) handleOpenModal('MERCHANT');
                  else setActiveDialogue({ title: entity.name, messages: entity.dialogue || ['...'] });
              } 
              else if (entity.type === 'OBJECT') {
                  if (entity.subType === 'ANVIL') handleOpenModal('ANVIL');
                  else if (entity.subType === 'WORKBENCH') handleOpenModal('WORKBENCH');
                  else if (entity.subType === 'ALCHEMY_TABLE') handleOpenModal('ALCHEMY_TABLE');
                  else if (entity.subType === 'CAMPFIRE') handleOpenModal('CAMPFIRE');
                  else if (entity.subType === 'FURNACE' || (entity.subType as any) === 'FURNACE') handleOpenModal('FURNACE'); 
                  else if (entity.subType === 'SIGNPOST') {
                      playSound('UI_CLICK');
                      setActiveDialogue({ title: 'Sign', messages: entity.destination?.name ? [`To ${entity.destination.name}`] : ['A weather-worn sign.'] });
                      newCounters.lore_read = (newCounters.lore_read || 0) + 1;
                  } 
                  else if (entity.subType === 'LOCKED_DOOR') setActivePuzzle({ id: entity.id, type: 'KEYPAD', content: 'ENTER SECURITY CODE', solution: '1234' });
                  else if (entity.subType === 'CHEST') {
                      playSound('UI_CLICK');
                      const lootId = entity.loot || 'potion_small';
                      const lootItem = ITEMS[lootId];
                      if (lootItem) {
                          newInventory = addToInventory(prepareItemForInventory(lootItem), { ...prev, inventory: newInventory });
                          newLogs.push({ id: uid(), message: `Found ${lootItem.name}!`, type: 'LOOT', timestamp: getTimestamp() });
                          MAPS[prev.currentMapId].entities = map.entities.filter(e => e.id !== entity.id);
                      }
                  }
              }
          } else {
              playSound('ATTACK');
              newAnimations['player'] = 'ATTACK';
          }
          
          if (Object.keys(newCombatNumbers).length > 0) setCombatNumbers(newCombatNumbers);

          return { 
              ...prev, 
              logs: newLogs, 
              inventory: newInventory, 
              animations: newAnimations, 
              counters: newCounters, 
              activeQuest: newActiveQuest, 
              stats: newStats, 
              skills: newSkills, 
              completedQuestIds, 
              lastCombatTime: newCombatTime, 
              bestiary: newBestiary, 
              worldTier: newWorldTier
          };
      });
  }, [activeDialogue, activePuzzle, activeModal]);

  const handlePlayerAction = useCallback((dx: number, dy: number) => {
      setGameState(prev => {
          if (activePuzzle || activeDialogue) return prev;
          const { newState, damageEvents } = handlePlayerMove(prev, dx, dy, handleOpenModal);
          const finalState = checkLevelUp(newState);
          if (Object.keys(damageEvents).length > 0) setCombatNumbers(damageEvents);
          if (Object.keys(finalState.animations).length > 0) {
              setTimeout(() => setGameState(p => ({ ...p, animations: {} })), 400);
          }
          return finalState;
      });
  }, [activePuzzle, activeDialogue, checkLevelUp]);

  const toggleEquip = (item: Item) => { 
      playSound('UI_CLICK'); 
      setGameState(prev => ({ 
          ...prev, 
          equipment: { 
              ...prev.equipment, 
              [item.slot!]: prev.equipment[item.slot!]?.id === item.id ? null : item 
          } 
      })); 
  };

  const craft = (recipe: Recipe) => {
      setGameState(prev => {
          let inv = [...prev.inventory];
          if (!recipe.ingredients.every(i => inv.find(x => x.id === i.itemId && x.count >= i.count))) return prev;
          
          recipe.ingredients.forEach(i => inv = removeFromInventory(i.itemId, i.count, { ...prev, inventory: inv }));
          
          playSound('CRAFT');
          const resultItem = ITEMS[recipe.resultItemId];
          const newCounters = { ...prev.counters, items_crafted: (prev.counters.items_crafted || 0) + 1 };
          
          const skill = prev.skills[recipe.skill];
          const newXp = skill.xp + recipe.xpReward;
          const newLevel = calculateSkillLevel(newXp);
          const newSkills = { ...prev.skills, [recipe.skill]: { ...skill, xp: newXp, level: newLevel } };

          let newLogs = [...prev.logs];
          let newActiveQuest = prev.activeQuest;
          
          if (newLevel > skill.level) {
              playSound('LEVEL_UP');
              newLogs.push({ id: uid(), message: `${recipe.skill} reached level ${newLevel}!`, type: 'SKILL', timestamp: getTimestamp() });
          }

          const qUpd = checkQuestUpdate(newActiveQuest, 'COLLECT', resultItem.id, recipe.yield);
          if (qUpd) {
              newActiveQuest = qUpd.newQuest;
              if (qUpd.log) newLogs.push(qUpd.log);
          }
          
          newLogs.push({ id: uid(), message: `Crafted ${resultItem.name} x${recipe.yield}`, type: 'INFO', timestamp: getTimestamp() });

          const baseItem = prepareItemForInventory(resultItem);
          let finalInv = inv;
          if (['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY', 'COLLECTIBLE', 'GADGET', 'BLUEPRINT'].includes(baseItem.type)) {
               finalInv = addToInventory({ ...baseItem, count: recipe.yield }, { ...prev, inventory: inv });
          } else {
               for(let k=0; k<recipe.yield; k++) {
                   finalInv = addToInventory(prepareItemForInventory(resultItem), { ...prev, inventory: finalInv });
               }
          }

          return { ...prev, inventory: finalInv, skills: newSkills, counters: newCounters, logs: newLogs, activeQuest: newActiveQuest };
      });
  };

  const handleConsume = (item: Item) => {
      if (item.type === 'GADGET') {
          setGameState(prev => {
              const map = MAPS[prev.currentMapId];
              let tx = prev.playerPos.x;
              let ty = prev.playerPos.y;
              if (prev.playerFacing === 'UP') ty -= 1;
              if (prev.playerFacing === 'DOWN') ty += 1;
              if (prev.playerFacing === 'LEFT') tx -= 1;
              if (prev.playerFacing === 'RIGHT') tx += 1;

              if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) {
                  playSound('BUMP');
                  return prev; 
              }
              const isOccupied = map.entities.some(e => e.pos.x === tx && e.pos.y === ty);
              const tile = map.tiles[ty][tx];
              if (isOccupied || ['WALL','TREE','OAK_TREE','BIRCH_TREE','PINE_TREE','ROCK','WATER','LAVA','VOID'].includes(tile as string)) {
                   return { ...prev, logs: [...prev.logs, { id: uid(), message: "Cannot place that here.", type: 'INFO', timestamp: getTimestamp() }] };
              }

              playSound('CRAFT');
              let newEntity: Entity;
              if (item.id === 'campfire_kit') {
                  newEntity = { id: `campfire_${uid()}`, name: `Campfire`, type: 'OBJECT', subType: 'CAMPFIRE', symbol: '^', color: 'orange', pos: {x: tx, y: ty} };
              } else {
                  newEntity = { id: `spawner_placed_${uid()}`, name: `Placed Cage`, type: 'OBJECT', subType: 'MOB_SPAWNER', symbol: '#', color: 'darkred', pos: {x: tx, y: ty}, hp: 100, maxHp: 100, level: 1, spawnType: 'Skeleton' };
              }
              map.entities.push(newEntity);
              return { ...prev, inventory: removeFromInventory(item.id, 1, prev), logs: [...prev.logs, { id: uid(), message: `Placed ${newEntity.name}.`, type: 'INFO', timestamp: getTimestamp() }] };
          });
          return;
      }
      
      if (item.type === 'BLUEPRINT' && item.recipeId) {
          setGameState(prev => {
              if (prev.knownRecipes.includes(item.recipeId!)) return { ...prev, logs: [...prev.logs, { id: uid(), message: "Recipe already known.", type: 'INFO', timestamp: getTimestamp() }]};
              playSound('LEVEL_UP');
              return { ...prev, knownRecipes: [...prev.knownRecipes, item.recipeId!], inventory: removeFromInventory(item.id, 1, prev), logs: [...prev.logs, { id: uid(), message: `Learned Recipe: ${item.name}`, type: 'SECRET', timestamp: getTimestamp() }] };
          });
          return;
      }

      if (item.healAmount) {
          playSound('GATHER');
          setGameState(p => ({ 
              ...p, 
              stats: { ...p.stats, hp: Math.min(p.stats.maxHp, p.stats.hp + (item.healAmount||0)) }, 
              inventory: removeFromInventory(item.id, 1, p),
              counters: { ...p.counters, consumables_used: (p.counters.consumables_used || 0) + 1 },
              logs: [...p.logs, { id: uid(), message: `Used ${item.name}. +${item.healAmount} HP`, type: 'INFO', timestamp: getTimestamp() }]
          }));
      }
  };

  const handlePuzzleSolve = () => {
      playSound('SECRET'); setActivePuzzle(null);
      setGameState(prev => {
          const map = MAPS[prev.currentMapId];
          map.entities = map.entities.filter(e => e.id !== activePuzzle?.id);
          return { ...prev, counters: { ...prev.counters, puzzles_solved: (prev.counters.puzzles_solved || 0) + 1 }, logs: [...prev.logs, { id: uid(), message: 'Puzzle Solved!', type: 'SECRET', timestamp: getTimestamp() }] };
      });
  };

  const handleBuy = (itemId: string, price: number) => {
      setGameState(prev => {
          if (prev.stats.gold < price) return prev;
          playSound('UI_CLICK');
          return { ...prev, stats: { ...prev.stats, gold: prev.stats.gold - price }, inventory: addToInventory(prepareItemForInventory(ITEMS[itemId]), prev), logs: [...prev.logs, { id: uid(), message: `Bought ${ITEMS[itemId].name}`, type: 'TRADE', timestamp: getTimestamp() }] };
      });
  };

  const handleSell = (item: Item, price: number) => {
      setGameState(prev => {
          playSound('UI_CLICK');
          return { ...prev, stats: { ...prev.stats, gold: prev.stats.gold + price }, inventory: removeFromInventory(item.id, 1, prev), logs: [...prev.logs, { id: uid(), message: `Sold ${item.name} for ${price}g`, type: 'TRADE', timestamp: getTimestamp() }] };
      });
  };

  const lightingOpacity = useMemo(() => {
      const t = gameState.time;
      if (t < 500) return 0.6; 
      if (t < 800) return 0.6 - ((t-500)/300) * 0.6; 
      if (t < 1800) return 0; 
      if (t < 2200) return ((t-1800)/400) * 0.6; 
      return 0.6;
  }, [gameState.time]);

  // Viewport calculation
  const cameraPosition = useMemo(() => {
      const currentMap = MAPS[gameState.currentMapId];
      if (!currentMap) return { x: 0, y: 0 };
      const TILE_SIZE = 32;
      const playerVisualX = gameState.playerPos.x * TILE_SIZE + TILE_SIZE/2;
      const playerVisualY = gameState.playerPos.y * TILE_SIZE + TILE_SIZE/2;
      const centerX = viewportSize.w / 2;
      const centerY = viewportSize.h / 2;
      let targetX = centerX - (playerVisualX * viewScale);
      let targetY = centerY - (playerVisualY * viewScale);
      const mapW = currentMap.width * TILE_SIZE * viewScale;
      const mapH = currentMap.height * TILE_SIZE * viewScale;
      
      if (mapW <= viewportSize.w) targetX = (viewportSize.w - mapW) / 2;
      else targetX = Math.max(viewportSize.w - mapW, Math.min(0, targetX));
      
      if (mapH <= viewportSize.h) targetY = (viewportSize.h - mapH) / 2;
      else targetY = Math.max(viewportSize.h - mapH, Math.min(0, targetY));
      
      return { x: targetX, y: targetY };
  }, [gameState.playerPos, gameState.currentMapId, viewScale, viewportSize]);

  // Window Resize Listener
  useEffect(() => {
      const handleResize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          setViewportSize({ w, h });
          const mobileCheck = w <= 768;
          setIsMobile(mobileCheck);
          const tilesWide = mobileCheck ? 11 : 26;
          const desiredScale = w / (tilesWide * 32);
          const clampedScale = Math.max(0.5, Math.min(3.0, desiredScale * userZoom));
          setViewScale(clampedScale);
      };
      window.addEventListener('resize', handleResize);
      handleResize(); 
      return () => window.removeEventListener('resize', handleResize);
  }, [userZoom]);

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
            setActiveModal={handleOpenModal}
            onMove={(dx, dy) => handlePlayerAction(dx, dy)}
            onInteract={handleInteraction}
            onEquip={toggleEquip}
            onCraft={craft}
            onRespawn={() => { 
                setGameState(p => ({ 
                    ...p, 
                    playerPos: {x: 28, y: 22}, // NEW TOWN SPAWN
                    currentMapId: 'map_10_10', 
                    stats: { ...p.stats, hp: p.stats.maxHp } 
                })); 
                handleOpenModal(null); 
            }}
            onResetSave={() => {}} // No-op, button removed
            onSaveGame={() => {}} // No-op
            onConsume={handleConsume}
            onTogglePerk={handleTogglePerk}
            onPuzzleSolve={handlePuzzleSolve}
            onPuzzleClose={() => setActivePuzzle(null)}
            onDialogueClose={() => setActiveDialogue(null)}
            formatTime={(t) => `${Math.floor(t/100).toString().padStart(2,'0')}:${Math.floor((t%100)*0.6).toString().padStart(2,'0')}`}
            onBuy={handleBuy}
            onSell={handleSell}
            onStatIncrease={handleStatIncrease}
            onAutoConfigChange={handleAutoDistributionChange}
            onResetStats={handleResetStats}
            isSaving={false}
            volume={volume}
            setVolume={setVolume}
            zoom={userZoom}
            setZoom={setUserZoom}
            lastSaved={0}
        />
    </div>
  );
}
