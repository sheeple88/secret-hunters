
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, SkillName, Item, Stats, AnimationType, LogEntry, Recipe, TileType, Secret, Entity, Position, GameMap } from './types';
import { MAPS, INITIAL_STATS, INITIAL_SKILLS, ITEMS, WEAPON_TEMPLATES, PERKS, DEFAULT_RECIPES, uid, calculateXpForLevel, calculateSkillLevel, SCALE_FACTOR } from './constants';
import { ALL_SECRETS } from './data/secrets/index';
import { ACHIEVEMENTS } from './data/achievements';
import { playSound, setMasterVolume } from './services/audioService';
import { GameRenderer } from './components/renderer/GameRenderer';
import { GameHUD } from './components/hud/GameHUD';
import { PuzzleConfig } from './components/modals/PuzzleModal';
import { handlePlayerMove } from './systems/movement';
import { generateBossRewards } from './services/itemService';
import { generateHavensRest } from './systems/maps/havensRest';

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
    // Fix: Allow GADGET and BLUEPRINT to keep their ID so logic checking for 'mob_spawner_item' works
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
        
        // Calculate points for each stat based on %
        const addStr = Math.floor(points * (str / totalWeight));
        const addDex = Math.floor(points * (dex / totalWeight));
        const addInt = Math.floor(points * (int / totalWeight));
        const addHp = Math.floor(points * (hp / totalWeight));
        const addRegen = Math.floor(points * (regeneration / totalWeight));

        result.str += addStr;
        result.dex += addDex;
        result.int += addInt;
        
        // HP Stat adds bonus flat HP on top of natural growth
        const hpStatVal = Math.floor(5 * Math.pow(SCALE_FACTOR, result.level));
        result.maxHp += (addHp * hpStatVal);
        result.hp += (addHp * hpStatVal);
        
        result.regeneration += addRegen;

        usedPoints = addStr + addDex + addInt + addHp + addRegen;
        result.unspentStatPoints = (result.unspentStatPoints || 0) - usedPoints; // Deduct used, leaving remainders
        return { newStats: result, allocated: true };
    }
    return { newStats: stats, allocated: false };
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
    
    // NEW TRACKING
    unlockedSecretIds: [],
    unlockedAchievementIds: [],
    
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
    statAllocation: { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 },
    worldTier: 0
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleConfig | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<{title: string, messages: string[]} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(0);
  
  const [combatNumbers, setCombatNumbers] = useState<Record<string, number>>({});
  const [viewScale, setViewScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1.0); // New user setting
  const [volume, setVolume] = useState(0.3); // New user setting
  
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Handle Opening Modals - specifically to clear secret notifications
  const handleOpenModal = (modalName: string | null) => {
      setActiveModal(modalName);
      if (modalName === 'SECRETS') {
          // Clear the new_secret flag when opening journal
          setGameState(prev => ({
              ...prev,
              flags: { ...prev.flags, new_secret: false }
          }));
      }
  };

  // Update Audio Volume
  useEffect(() => {
      setMasterVolume(volume);
  }, [volume]);

  // Update Mayor Dialogue on Load/Reset if needed
  useEffect(() => {
      if (MAPS['map_10_10']) {
          const mayor = MAPS['map_10_10'].entities.find(e => e.id.includes('mayor'));
          if (mayor) {
              const tier = gameState.worldTier || 0;
              if (tier === 0) mayor.dialogue = ["Welcome to Haven's Rest!", "The North Crypts are dangerous.", "Prove yourself by defeating the Crypt Lord."];
              else if (tier === 1) mayor.dialogue = ["By the Gods! You defeated the Crypt Lord?", "The ground shakes beneath us.", "The Molten King in the Desert stirs.", "Seek the Magma Core in the South."];
              else if (tier === 2) mayor.dialogue = ["The heat has subsided, but a chill wind blows.", "The Brood Mother in the Deep Caverns has awakened.", "Prepare yourself, hunter."];
              else mayor.dialogue = ["You are a legend, Hunter.", "The world is safe... for now.", "Explore the ends of the earth!"];
          }
      }
  }, [gameState.worldTier]);

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

  // --- STAT ALLOCATION HANDLERS ---
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
          let newState = { 
              ...prev,
              autoDistributeStats: enabled,
              statAllocation: allocation
          };

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
          return {
              ...prev,
              stats: newStats,
              logs: [...prev.logs, { id: uid(), message: `Stats Reset! ${totalPoints} points refunded.`, type: 'INFO', timestamp: getTimestamp() }]
          };
      });
  };

  // --- SCALE & MOBILE LOGIC ---
  useEffect(() => {
      const handleResize = () => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          setViewportSize({ w, h });
          
          const mobileCheck = w <= 768;
          setIsMobile(mobileCheck);
          
          const tilesWide = mobileCheck ? 11 : 26;
          const desiredScale = w / (tilesWide * 32);
          
          // Multiply by userZoom setting
          const clampedScale = Math.max(0.5, Math.min(3.0, desiredScale * userZoom));
          
          setViewScale(clampedScale);
      };
      
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial call
      return () => window.removeEventListener('resize', handleResize);
  }, [userZoom]); // Re-run when zoom changes

  // --- SAVE/LOAD ---
  useEffect(() => {
      const saved = localStorage.getItem('sh_save_v1');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (parsed.gameState && parsed.gameState.stats) {
                  // V2 Save Format (Wrapped with settings)
                  const gs = parsed.gameState;
                  
                  // Restore Settings
                  if (parsed.settings) {
                      setVolume(parsed.settings.volume ?? 0.3);
                      setUserZoom(parsed.settings.zoom ?? 1.0);
                  }
                  
                  // MIGRATION: Convert old secrets array to ID list if needed
                  if (gs.secrets && Array.isArray(gs.secrets) && !gs.unlockedSecretIds) {
                      gs.unlockedSecretIds = gs.secrets.filter((s: any) => s.unlocked).map((s: any) => s.id);
                      delete gs.secrets; // Remove heavy object from state
                  }
                  if (!gs.unlockedAchievementIds) gs.unlockedAchievementIds = [];

                  // Migrations...
                  let exp = gs.exploration || {};
                  Object.keys(MAPS).forEach(mapId => {
                      const map = MAPS[mapId];
                      if (exp[mapId]) {
                          if (exp[mapId].length !== map.height || (exp[mapId][0] && exp[mapId][0].length !== map.width)) {
                              exp[mapId] = Array(map.height).fill(null).map(() => Array(map.width).fill(0));
                              if (mapId === 'map_10_10') {
                                   exp[mapId] = Array(30).fill(null).map((_, y) => Array(40).fill(0).map((_, x) => (Math.abs(x-20) <= 6 && Math.abs(y-15) <= 6) ? 1 : 0));
                              }
                          }
                      }
                  });

                  if (gs.skills && gs.skills['Woodcutting']) {
                      gs.skills['Logging'] = gs.skills['Woodcutting'];
                      gs.skills['Logging'].name = 'Logging';
                      delete gs.skills['Woodcutting'];
                  }
                  if (!gs.skills['Logging']) gs.skills['Logging'] = { name: 'Logging', level: 1, xp: 0 };
                  if (!gs.skills['Fishing']) gs.skills['Fishing'] = { name: 'Fishing', level: 1, xp: 0 };
                  if (!gs.skills['Cooking']) gs.skills['Cooking'] = { name: 'Cooking', level: 1, xp: 0 };
                  if (!gs.knownRecipes) gs.knownRecipes = DEFAULT_RECIPES;
                  if (gs.autoDistributeStats === undefined) {
                      gs.autoDistributeStats = false;
                      gs.statAllocation = { str: 25, dex: 25, int: 25, hp: 20, regeneration: 5 };
                      gs.stats.unspentStatPoints = 0;
                  }
                  if (gs.worldTier === undefined) gs.worldTier = 0;

                  setGameState({ 
                      ...gs, 
                      exploration: exp,
                      animations: {}, 
                      worldModified: gs.worldModified || {}, 
                      time: gs.time || 800 
                  });
              } else if (parsed.stats) {
                  // Legacy V1 format support
                  setGameState(prev => ({...prev, ...parsed})); 
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
      localStorage.setItem('sh_save_v1', JSON.stringify(saveData));
      setLastSaved(Date.now());
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 500);
  };

  useEffect(() => {
      if (!hasLoaded) return;
      // Auto-save every 10s
      const interval = setInterval(handleSave, 10000);
      return () => clearInterval(interval);
  }, [gameState, hasLoaded, volume, userZoom]);

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
              let newLogs = [...prev.logs];
              let newSecretIds = [...prev.unlockedSecretIds];
              let newAchievementIds = [...prev.unlockedAchievementIds];
              let newStats = { ...prev.stats };
              
              let secretsChanged = false;
              let achievementChanged = false;

              // 1. Check Secrets
              ALL_SECRETS.forEach(s => {
                  if (!newSecretIds.includes(s.id) && s.condition(prev)) {
                      secretsChanged = true;
                      newSecretIds.push(s.id);
                      playSound('SECRET');
                      newLogs.push({ id: uid(), message: `Secret Unlocked: ${s.title}`, type: 'SECRET', timestamp: getTimestamp() });
                      
                      // Award Perk
                      if (s.perkId && !newPerks.includes(s.perkId)) {
                          newPerks.push(s.perkId);
                      }
                      
                      // Award Stat Bonus
                      if (s.statBonus) {
                          Object.entries(s.statBonus).forEach(([key, val]) => {
                              // @ts-ignore
                              if (typeof val === 'number') newStats[key] = (newStats[key] || 0) + val;
                          });
                      }
                  }
              });

              // 2. Check Achievements
              ACHIEVEMENTS.forEach(ach => {
                  if (!newAchievementIds.includes(ach.id) && ach.condition(prev)) {
                      achievementChanged = true;
                      newAchievementIds.push(ach.id);
                      playSound('LEVEL_UP'); // Distinct sound?
                      newLogs.push({ id: uid(), message: `Achievement: ${ach.title}`, type: 'QUEST', timestamp: getTimestamp() });
                      
                      // Award Rewards
                      if (ach.reward.gold) newStats.gold += ach.reward.gold;
                      if (ach.reward.xp) newStats.xp += ach.reward.xp;
                  }
              });

              // Regen
              if (newStats.hp < totalStats.maxHp) {
                  newStats.hp = Math.min(totalStats.maxHp, newStats.hp + Math.max(1, Math.floor(totalStats.regeneration)));
              }
              
              if (secretsChanged || achievementChanged) {
                  const flagUpdate = secretsChanged ? { ...prev.flags, new_secret: true } : prev.flags;
                  
                  return { 
                      ...prev, 
                      stats: newStats,
                      unlockedSecretIds: newSecretIds,
                      unlockedAchievementIds: newAchievementIds,
                      unlockedPerks: newPerks, 
                      logs: newLogs, 
                      flags: flagUpdate
                  };
              }
              
              return { ...prev, stats: newStats };
          });
      }, 2000); // Check every 2s
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
                      handleOpenModal('MERCHANT');
                  } else {
                      setActiveDialogue({ title: entity.name, messages: entity.dialogue || ['...'] });
                  }
              } else if (entity.type === 'OBJECT') {
                  if (entity.subType === 'ANVIL') handleOpenModal('ANVIL');
                  else if (entity.subType === 'WORKBENCH') handleOpenModal('WORKBENCH');
                  else if (entity.subType === 'ALCHEMY_TABLE') handleOpenModal('ALCHEMY_TABLE');
                  else if (entity.subType === 'CAMPFIRE') handleOpenModal('CAMPFIRE');
                  else if (entity.subType === 'SIGNPOST') {
                      playSound('UI_CLICK');
                      setActiveDialogue({ title: 'Sign', messages: entity.destination?.name ? [`To ${entity.destination.name}`] : ['A weather-worn sign.'] });
                      newCounters.lore_read = (newCounters.lore_read || 0) + 1;
                  } else if (entity.subType === 'LOCKED_DOOR') setActivePuzzle({ id: entity.id, type: 'KEYPAD', content: 'ENTER SECURITY CODE', solution: '1234' });
                  else if (entity.subType === 'LOCKED_CHEST') {
                      const requiredKeyId = entity.keyId || 'iron_key';
                      const key = prev.inventory.find(i => i.id === requiredKeyId);
                      
                      if (key) { 
                          playSound('UI_CLICK'); 
                          newLogs.push({ id: uid(), message: 'Unlocked Chest!', type: 'INFO', timestamp: getTimestamp() }); 
                          newInventory = removeFromInventory(requiredKeyId, 1, prev); 
                          entity.subType = 'CHEST'; 
                          entity.type = 'OBJECT'; 
                      } else {
                          const keyName = ITEMS[requiredKeyId]?.name || 'Key';
                          newLogs.push({ id: uid(), message: `Locked. Needs ${keyName}.`, type: 'INFO', timestamp: getTimestamp() });
                      }
                  } else if (entity.subType === 'BOSS_CHEST') {
                      const requiredKeyId = 'boss_key';
                      const key = prev.inventory.find(i => i.id === requiredKeyId);
                      
                      if (key) { 
                          playSound('SECRET');
                          // Consume Key
                          newInventory = removeFromInventory(requiredKeyId, 1, prev);
                          
                          // Generate 5 random rewards
                          const rewards = generateBossRewards(prev.stats.level);
                          rewards.forEach(reward => {
                              newInventory = addToInventory(prepareItemForInventory(reward), { ...prev, inventory: newInventory });
                              newLogs.push({ id: uid(), message: `Found ${reward.name} x${reward.count}`, type: 'LOOT', timestamp: getTimestamp() });
                          });
                          
                          // Change entity state to open
                          entity.subType = 'OPEN_CHEST'; 
                          entity.type = 'OBJECT'; 
                      } else {
                          newLogs.push({ id: uid(), message: `Locked. The Boss holds the Key.`, type: 'INFO', timestamp: getTimestamp() });
                      }
                  } else if (entity.subType === 'FISHING_SPOT') {
                      if (prev.equipment.WEAPON?.id === 'fishing_rod') {
                          playSound('GATHER');
                          newAnimations['player'] = 'FISH_CAST';
                          const fishLevel = prev.skills.Fishing.level;
                          let catchId = 'raw_fish';
                          const roll = Math.random() * 100 + fishLevel;
                          
                          if (roll > 100 && fishLevel >= 50) catchId = 'raw_shark';
                          else if (roll > 75 && fishLevel >= 30) catchId = 'raw_tuna';
                          else if (roll > 50 && fishLevel >= 15) catchId = 'raw_salmon';
                          else if (roll > 25 && fishLevel >= 5) catchId = 'raw_trout';
                          
                          const fishXp = catchId === 'raw_shark' ? 100 : catchId === 'raw_tuna' ? 50 : catchId === 'raw_salmon' ? 25 : catchId === 'raw_trout' ? 15 : 10;
                          
                          const skill = prev.skills.Fishing;
                          const newXp = skill.xp + fishXp;
                          const newLevel = calculateSkillLevel(newXp);
                          const levelsGained = newLevel - skill.level;
                          
                          let statChanges: any = {};
                          if (levelsGained > 0) {
                              playSound('LEVEL_UP');
                              newLogs.push({ id: uid(), message: `Fishing reached Level ${newLevel}!`, type: 'SKILL', timestamp: getTimestamp() });
                              statChanges.dex = (prev.stats.dex) + (levelsGained * 2);
                          }
                          
                          setTimeout(() => {
                              setGameState(p => {
                                  const catchItem = ITEMS[catchId];
                                  const updatedMap = MAPS[p.currentMapId];
                                  updatedMap.entities = updatedMap.entities.filter(e => e.id !== entity.id); 
                                  
                                  return { 
                                      ...p, 
                                      animations: { ...p.animations, player: 'FISH_CATCH' }, 
                                      inventory: addToInventory(prepareItemForInventory(catchItem), p), 
                                      skills: { ...p.skills, Fishing: { ...skill, xp: newXp, level: newLevel } },
                                      stats: { ...p.stats, ...statChanges },
                                      logs: [...p.logs, {id:uid(), message: `Caught ${catchItem.name}! (+${fishXp} XP)`, type: 'LOOT', timestamp: getTimestamp()}], 
                                      counters: { ...p.counters, fish_caught: (p.counters.fish_caught || 0) + 1 } 
                                  };
                              });
                          }, 1000);
                      } else {
                          newLogs.push({ id: uid(), message: 'You need a Fishing Rod.', type: 'INFO', timestamp: getTimestamp() });
                      }
                  } else if (entity.subType === 'CHEST') {
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
                  setTimeout(() => setGameState(p => ({ ...p, animations: { ...p.animations, player: 'FISH_CATCH' }, inventory: addToInventory(prepareItemForInventory(ITEMS['raw_fish']), p), logs: [...p.logs, {id:uid(), message: 'Caught a small fish.', type: 'LOOT', timestamp: getTimestamp()}], counters: { ...p.counters, fish_caught: (p.counters.fish_caught || 0) + 1 } })), 1000);
              }
          }
          return { ...prev, logs: newLogs, inventory: newInventory, animations: newAnimations, counters: newCounters };
      });
  }, [activeDialogue, activePuzzle, activeModal]);

  const handlePlayerAction = useCallback((dx: number, dy: number) => {
      setGameState(prev => {
          if (activePuzzle || activeDialogue) return prev;
          
          let nextState = handlePlayerMove(prev, dx, dy, handleOpenModal);
          nextState = checkLevelUp(nextState);
          
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
          if (activeModal && activeModal !== 'DEATH') { if (e.key === 'Escape') handleOpenModal(null); return; }
          if (activeModal === 'DEATH') return;
          if (activePuzzle) { if (e.key === 'Escape') setActivePuzzle(null); return; }
          if (activeDialogue) { if (e.key === 'Escape') setActiveDialogue(null); return; }
          if (['w','ArrowUp'].includes(e.key)) handlePlayerAction(0, -1);
          if (['s','ArrowDown'].includes(e.key)) handlePlayerAction(0, 1);
          if (['a','ArrowLeft'].includes(e.key)) handlePlayerAction(-1, 0);
          if (['d','ArrowRight'].includes(e.key)) handlePlayerAction(1, 0);
          if (e.key === 'e' || e.key === 'E') handleInteraction();
          if (e.key === 'i') handleOpenModal('INVENTORY');
          if (e.key === 'k') handleOpenModal('SKILLS');
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
          
          const { updatedSkill, statChanges } = { updatedSkill: prev.skills[recipe.skill], statChanges: {} }; 
          
          playSound('CRAFT');
          const resultItem = ITEMS[recipe.resultItemId];
          const newCounters = { ...prev.counters, items_crafted: (prev.counters.items_crafted || 0) + 1 };
          
          const skill = prev.skills[recipe.skill];
          const newXp = skill.xp + recipe.xpReward;
          const newLevel = calculateSkillLevel(newXp);
          const newSkills = { ...prev.skills, [recipe.skill]: { ...skill, xp: newXp, level: newLevel } };

          return { ...prev, inventory: addToInventory(prepareItemForInventory(resultItem), { ...prev, inventory: inv }), skills: newSkills, stats: { ...prev.stats, ...statChanges }, counters: newCounters };
      });
  };
  const lightingOpacity = (() => {
      const t = gameState.time;
      if (t < 500) return 0.6; if (t < 800) return 0.6 - ((t-500)/300) * 0.6; if (t < 1800) return 0; if (t < 2200) return ((t-1800)/400) * 0.6; return 0.6;
  })();
  const handlePuzzleSolve = () => {
      playSound('SECRET'); setActivePuzzle(null);
      setGameState(prev => {
          const map = MAPS[prev.currentMapId];
          const newEntities = map.entities.filter(e => e.id !== activePuzzle?.id); MAPS[prev.currentMapId].entities = newEntities; const newCounters = { ...prev.counters, puzzles_solved: (prev.counters.puzzles_solved || 0) + 1 };
          return { ...prev, logs: [...prev.logs, { id: uid(), message: 'Puzzle Solved! Passage Opened.', type: 'SECRET', timestamp: getTimestamp() }], counters: newCounters };
      });
  };

  const handleConsume = (item: Item) => {
      if (item.id === 'mob_spawner_item' || item.name === 'Cage of Souls' || item.id === 'campfire_kit') {
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
              const blockedTiles = ['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'WATER', 'LAVA', 'VOID'];
              
              if (isOccupied || blockedTiles.includes(tile)) {
                  return {
                      ...prev,
                      logs: [...prev.logs, { id: uid(), message: "Cannot place that here.", type: 'INFO', timestamp: getTimestamp() }]
                  };
              }

              playSound('CRAFT');
              let newEntity: Entity;
              if (item.id === 'campfire_kit') {
                  newEntity = {
                      id: `campfire_${uid()}`,
                      name: `Campfire`,
                      type: 'OBJECT',
                      subType: 'CAMPFIRE',
                      symbol: '^',
                      color: 'orange',
                      pos: {x: tx, y: ty},
                  };
              } else {
                  newEntity = {
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
                      spawnType: 'Skeleton',
                      lastSpawnTime: 0,
                      lastSpawnStep: 0
                  };
              }
              
              map.entities.push(newEntity);

              return {
                  ...prev,
                  inventory: removeFromInventory(item.id, 1, prev),
                  logs: [...prev.logs, { id: uid(), message: `Placed ${newEntity.name}.`, type: 'INFO', timestamp: getTimestamp() }]
              };
          });
          return;
      }

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

      playSound('GATHER'); 
      setGameState(p => ({ 
          ...p, 
          stats: { ...p.stats, hp: Math.min(p.stats.maxHp, p.stats.hp + (item.healAmount||0)) }, 
          inventory: removeFromInventory(item.id, 1, p),
          counters: { ...p.counters, consumables_used: (p.counters.consumables_used || 0) + 1 }
      })); 
  };

  const handleBuy = (itemId: string, price: number) => {
      setGameState(prev => {
          if (prev.stats.gold < price) return prev;
          playSound('UI_CLICK'); 
          const item = ITEMS[itemId];
          
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

  const cameraPosition = useMemo(() => {
      const currentMap = MAPS[gameState.currentMapId];
      if (!currentMap) return { x: 0, y: 0 };
      
      const tileSize = 32;
      const borderSize = 4;
      const totalBorderWidth = borderSize * 2; 

      const playerVisualX = gameState.playerPos.x * tileSize + tileSize/2 + borderSize;
      const playerVisualY = gameState.playerPos.y * tileSize + tileSize/2 + borderSize;
      
      const centerX = viewportSize.w / 2;
      const centerY = viewportSize.h / 2;
      
      let targetX = centerX - (playerVisualX * viewScale);
      let targetY = centerY - (playerVisualY * viewScale);

      const totalVisualWidth = (currentMap.width * tileSize + totalBorderWidth) * viewScale;
      const totalVisualHeight = (currentMap.height * tileSize + totalBorderWidth) * viewScale;

      if (totalVisualWidth <= viewportSize.w) {
          targetX = (viewportSize.w - totalVisualWidth) / 2;
      } else {
          targetX = Math.max(viewportSize.w - totalVisualWidth, Math.min(0, targetX));
      }

      if (totalVisualHeight <= viewportSize.h) {
          targetY = (viewportSize.h - totalVisualHeight) / 2;
      } else {
          targetY = Math.max(viewportSize.h - totalVisualHeight, Math.min(0, targetY));
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
            setActiveModal={handleOpenModal}
            onMove={(dx, dy) => handlePlayerAction(dx, dy)}
            onInteract={handleInteraction}
            onEquip={toggleEquip}
            onCraft={craft}
            onRespawn={() => { setGameState(p => ({ ...p, playerPos: {x:20,y:15}, currentMapId: 'map_10_10', stats: { ...p.stats, hp: p.stats.maxHp } })); handleOpenModal(null); }}
            onResetSave={() => { localStorage.removeItem('sh_save_v1'); window.location.reload(); }}
            onSaveGame={handleSave}
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
            onResetStats={handleResetStats}
            isSaving={isSaving}
            // New Props
            volume={volume}
            setVolume={setVolume}
            zoom={userZoom}
            setZoom={setUserZoom}
            lastSaved={lastSaved}
        />
    </div>
  );
}
