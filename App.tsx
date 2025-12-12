
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, SkillName, Item, Stats, AnimationType, LogEntry, Recipe, TileType, Secret, Entity, Position, GameMap } from './types';
import { MAPS, INITIAL_STATS, INITIAL_SKILLS, ITEMS, WEAPON_TEMPLATES, SECRETS_DATA, PERKS, uid, calculateXpForLevel, calculateSkillLevel } from './constants';
import { generateLoot } from './services/itemService';
import { playSound } from './services/audioService';
import { GameRenderer } from './components/GameRenderer';
import { GameHUD } from './components/GameHUD';
import { PuzzleConfig } from './components/modals/PuzzleModal';
import { generateLore } from './services/geminiService';

// --- Helper Functions ---
const getTimestamp = () => Date.now();
const formatNumber = (n: number) => Math.floor(n).toLocaleString();
const BLOCKED_TILES: TileType[] = ['WALL', 'TREE', 'ROCK', 'SHRINE', 'VOID', 'WATER', 'CACTUS', 'DEEP_WATER', 'OBSIDIAN', 'CRACKED_WALL'];

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
  if (['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY', 'COLLECTIBLE'].includes(item.type)) {
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
    const newXp = skill.xp + amount;
    const newLevel = calculateSkillLevel(newXp);
    const levelsGained = newLevel - skill.level;
    let statChanges: Partial<Stats> = {};
    let logs: string[] = [];
    if (levelsGained > 0) {
        logs.push(`SKILL UP! ${skillName} ${skill.level} -> ${newLevel}`);
        playSound('LEVEL_UP');
        if (skillName === 'Strength') statChanges.str = (currentStats.str || 0) + (levelsGained * 2);
        if (skillName === 'Dexterity') statChanges.dex = (currentStats.dex || 0) + (levelsGained * 2);
        if (skillName === 'Agility') { statChanges.dex = (currentStats.dex || 0) + levelsGained; statChanges.regeneration = (currentStats.regeneration || 0) + Math.ceil(levelsGained * 0.5); }
        if (skillName === 'Mining') statChanges.str = (currentStats.str || 0) + levelsGained;
        if (skillName === 'Woodcutting') statChanges.str = (currentStats.str || 0) + levelsGained;
        if (skillName === 'Alchemy') statChanges.int = (currentStats.int || 0) + (levelsGained * 2);
        if (skillName === 'Crafting') statChanges.int = (currentStats.int || 0) + levelsGained;
        if (skillName === 'Fishing') { statChanges.dex = (currentStats.dex || 0) + levelsGained; statChanges.regeneration = (currentStats.regeneration || 0) + Math.ceil(levelsGained * 0.2); }
    }
    return { updatedSkill: { ...skill, xp: newXp, level: newLevel }, statChanges, logs };
};

const getVisionRadius = (gameState: GameState) => {
    let base = 4;
    if (gameState.equippedPerks.includes('vision_plus')) base += 2;
    const time = gameState.time;
    const isNight = time >= 2000 || time < 500;
    if (isNight && !gameState.equippedPerks.includes('night_vision')) base = Math.max(2, base - 2);
    return base;
};

// --- AI & PATHFINDING HELPERS ---

// Bresenham's Line Algorithm for Line of Sight
const hasLineOfSight = (p1: Position, p2: Position, map: GameMap): boolean => {
    let x0 = p1.x;
    let y0 = p1.y;
    const x1 = p2.x;
    const y1 = p2.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        if (x0 === x1 && y0 === y1) return true;
        // Check if blocked (ignore start/end, just check path)
        if (BLOCKED_TILES.includes(map.tiles[y0][x0]) && !(x0 === p1.x && y0 === p1.y)) return false;
        
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 10, y: 7 },
    playerFacing: 'DOWN',
    currentMapId: 'map_10_10',
    stats: INITIAL_STATS,
    equipment: { HEAD: null, BODY: null, LEGS: null, WEAPON: null, OFFHAND: null, ACCESSORY: null },
    skills: INITIAL_SKILLS,
    inventory: [],
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
    exploration: { 'map_10_10': Array(15).fill(null).map((_, y) => Array(20).fill(0).map((_, x) => (Math.abs(x-10) <= 4 && Math.abs(y-7) <= 4) ? 1 : 0)) },
    worldModified: {},
    knownWaypoints: [],
    knownLocations: [],
    animations: {},
    time: 800
  });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleConfig | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<{title: string, messages: string[]} | null>(null);
  
  const [combatNumbers, setCombatNumbers] = useState<Record<string, number>>({});
  const [viewScale, setViewScale] = useState(1);
  const [hasLoaded, setHasLoaded] = useState(false);

  // --- SCALE LOGIC ---
  useEffect(() => {
      const handleResize = () => {
          const mapW = 640;
          const mapH = 480;
          const scaleW = window.innerWidth / mapW;
          const scaleH = window.innerHeight / mapH;
          setViewScale(Math.min(scaleW, scaleH)); 
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
                  setGameState({ ...parsed, secrets: mergedSecrets, animations: {}, worldModified: parsed.worldModified || {}, time: parsed.time || 800 });
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
              
              // Secret Checking Loop
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

  // --- INTERACTION LOGIC ---
  const handleInteraction = useCallback(() => {
      setGameState(prev => {
          if (activeDialogue || activePuzzle || activeModal) return prev; // Cannot interact while busy

          const map = MAPS[prev.currentMapId];
          const px = prev.playerPos.x;
          const py = prev.playerPos.y;
          let tx = px;
          let ty = py;

          if (prev.playerFacing === 'UP') ty -= 1;
          if (prev.playerFacing === 'DOWN') ty += 1;
          if (prev.playerFacing === 'LEFT') tx -= 1;
          if (prev.playerFacing === 'RIGHT') tx += 1;

          // Check Bounds
          if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return prev;

          const entity = map.entities.find(e => e.pos.x === tx && e.pos.y === ty);
          const tile = map.tiles[ty][tx];

          let newLogs = [...prev.logs];
          let newAnimations = { ...prev.animations };
          let newInventory = [...prev.inventory];
          let newCounters = { ...prev.counters };
          
          if (entity) {
              if (entity.type === 'NPC') {
                  playSound('UI_CLICK');
                  setActiveDialogue({ title: entity.name, messages: entity.dialogue || ['...'] });
                  // Face player
                  entity.facing = prev.playerFacing === 'UP' ? 'DOWN' : prev.playerFacing === 'DOWN' ? 'UP' : prev.playerFacing === 'LEFT' ? 'RIGHT' : 'LEFT';
              }
              else if (entity.type === 'OBJECT') {
                  if (entity.subType === 'ANVIL') setActiveModal('ANVIL');
                  else if (entity.subType === 'WORKBENCH') setActiveModal('WORKBENCH');
                  else if (entity.subType === 'ALCHEMY_TABLE') setActiveModal('ALCHEMY_TABLE');
                  else if (entity.subType === 'SIGNPOST') {
                      playSound('UI_CLICK');
                      setActiveDialogue({ title: 'Sign', messages: entity.destination?.name ? [`To ${entity.destination.name}`] : ['A weather-worn sign.'] });
                      newCounters.lore_read = (newCounters.lore_read || 0) + 1;
                  }
                  else if (entity.subType === 'LOCKED_DOOR') {
                      setActivePuzzle({ id: entity.id, type: 'KEYPAD', content: 'ENTER SECURITY CODE', solution: '1234' });
                  }
                  else if (entity.subType === 'LOCKED_CHEST') {
                      const key = prev.inventory.find(i => i.id === 'iron_key');
                      if (key) {
                           playSound('UI_CLICK');
                           newLogs.push({ id: uid(), message: 'Unlocked Chest!', type: 'INFO', timestamp: getTimestamp() });
                           newInventory = removeFromInventory('iron_key', 1, prev);
                           entity.subType = 'CHEST'; 
                           entity.type = 'OBJECT';
                      } else {
                           newLogs.push({ id: uid(), message: 'Locked. Needs Iron Key.', type: 'INFO', timestamp: getTimestamp() });
                      }
                  }
                  
                  if (entity.subType === 'CHEST') {
                      playSound('UI_CLICK');
                      const lootId = entity.loot || 'potion_small';
                      const lootItem = ITEMS[lootId];
                      if (lootItem) {
                          const itemToAdd = prepareItemForInventory(lootItem);
                          newInventory = addToInventory(itemToAdd, { ...prev, inventory: newInventory });
                          newLogs.push({ id: uid(), message: `Found ${lootItem.name}!`, type: 'LOOT', timestamp: getTimestamp() });
                          
                          const mapEntities = map.entities.filter(e => e.id !== entity.id);
                          MAPS[prev.currentMapId].entities = mapEntities;
                      } else {
                           newLogs.push({ id: uid(), message: 'Empty.', type: 'INFO', timestamp: getTimestamp() });
                      }
                  }
              }
          } else {
              // Tile Interactions (e.g. Water)
              if (tile === 'WATER' && prev.equipment.WEAPON?.id === 'fishing_rod') {
                  // Fishing Logic
                  playSound('GATHER');
                  newAnimations['player'] = 'FISH_CAST';
                  setTimeout(() => {
                      setGameState(p => ({ 
                          ...p, 
                          animations: { ...p.animations, player: 'FISH_CATCH' }, 
                          inventory: addToInventory(prepareItemForInventory(ITEMS['raw_fish']), p), 
                          logs: [...p.logs, {id:uid(), message: 'Caught a Fish!', type: 'LOOT', timestamp: getTimestamp()}],
                          counters: { ...p.counters, fish_caught: (p.counters.fish_caught || 0) + 1 }
                      }));
                      playSound('SECRET'); // reusing positive sound
                  }, 1000);
              }
          }

          return { ...prev, logs: newLogs, inventory: newInventory, animations: newAnimations, counters: newCounters };
      });
  }, [activeDialogue, activePuzzle, activeModal]);


  // --- AI LOGIC ---
  const processEnemyTurns = (currentState: GameState, currentMap: GameMap, nextPlayerPos: Position): { entities: Entity[], damageToPlayer: number, logs: LogEntry[], anims: Record<string, AnimationType>, numbers: Record<string, number> } => {
      let entities = [...currentMap.entities];
      let damageToPlayer = 0;
      let logs: LogEntry[] = [];
      let anims: Record<string, AnimationType> = {};
      let numbers: Record<string, number> = {};
      
      // Occupied tiles by other enemies next turn (avoid stacking)
      const occupied = new Set<string>();
      entities.forEach(e => {
          if (e.type !== 'ENEMY') occupied.add(`${e.pos.x},${e.pos.y}`);
      });
      occupied.add(`${nextPlayerPos.x},${nextPlayerPos.y}`); // Player is an obstacle for moving

      entities = entities.map(entity => {
          if (entity.type !== 'ENEMY') return entity;
          
          const dist = Math.abs(entity.pos.x - nextPlayerPos.x) + Math.abs(entity.pos.y - nextPlayerPos.y); // Manhattan
          const aggro = entity.aggroRange || 5;
          const range = entity.attackRange || 1;
          
          // 1. Check Aggro
          if (dist > aggro) return entity; // Idle

          // 2. Check Attack Range
          let canAttack = false;
          if (dist <= range) {
              if (range === 1) {
                  canAttack = true; // Melee always hits if adjacent
              } else {
                  // Ranged needs LOS
                  if (hasLineOfSight(entity.pos, nextPlayerPos, currentMap)) {
                      canAttack = true;
                  }
              }
          }

          if (canAttack) {
              // ATTACK!
              playSound('HIT');
              const eDmg = Math.max(1, Math.floor((entity.level || 1) * 2));
              damageToPlayer += eDmg;
              anims[entity.id] = range > 1 ? 'SHOOT' : 'ATTACK';
              anims['player'] = 'HURT';
              numbers['player'] = (numbers['player'] || 0) + eDmg;
              logs.push({ id: uid(), message: `${entity.name} hit you for ${eDmg}!`, type: 'COMBAT', timestamp: getTimestamp() });
              
              occupied.add(`${entity.pos.x},${entity.pos.y}`); // Stays in place
              return entity;
          } else {
              // CHASE!
              // Simple heuristic: try to reduce largest difference
              let dx = nextPlayerPos.x - entity.pos.x;
              let dy = nextPlayerPos.y - entity.pos.y;
              let nextX = entity.pos.x;
              let nextY = entity.pos.y;

              // Try X axis first if further away, or random if equal
              const tryX = Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && Math.random() > 0.5);
              
              if (tryX) {
                  nextX += dx > 0 ? 1 : -1;
              } else {
                  nextY += dy > 0 ? 1 : -1;
              }

              // Collision Check 1: Walls
              let blocked = BLOCKED_TILES.includes(currentMap.tiles[nextY][nextX]);
              // Collision Check 2: Other Entities
              if (!blocked && occupied.has(`${nextX},${nextY}`)) blocked = true;

              if (blocked) {
                  // Try alternative axis
                  nextX = entity.pos.x;
                  nextY = entity.pos.y;
                  if (!tryX) {
                       nextX += dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
                  } else {
                       nextY += dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
                  }
                  
                  // Re-check collision
                  blocked = BLOCKED_TILES.includes(currentMap.tiles[nextY][nextX]);
                  if (!blocked && occupied.has(`${nextX},${nextY}`)) blocked = true;
              }

              if (!blocked) {
                  occupied.add(`${nextX},${nextY}`);
                  const facing = nextX > entity.pos.x ? 'RIGHT' : nextX < entity.pos.x ? 'LEFT' : entity.facing;
                  return { ...entity, pos: { x: nextX, y: nextY }, facing };
              } else {
                  occupied.add(`${entity.pos.x},${entity.pos.y}`); // Stuck
                  return entity;
              }
          }
      });

      return { entities, damageToPlayer, logs, anims, numbers };
  };

  const handlePlayerAction = useCallback((dx: number, dy: number) => {
      setGameState(prev => {
          if (prev.stats.hp <= 0) return prev;
          if (activePuzzle || activeDialogue) return prev; // Freeze movement when puzzle/dialogue is active

          const map = MAPS[prev.currentMapId];
          const nx = prev.playerPos.x + dx;
          const ny = prev.playerPos.y + dy;
          const facing = dx > 0 ? 'RIGHT' : dx < 0 ? 'LEFT' : dy > 0 ? 'DOWN' : 'UP';
          
          // --- 1. Map Transitions & Bounds ---
          let nextMapId = prev.currentMapId;
          let nextPos = { x: nx, y: ny };
          if (nx < 0 && map.neighbors.LEFT) { nextMapId = map.neighbors.LEFT; nextPos.x = MAPS[nextMapId].width - 1; }
          else if (nx >= map.width && map.neighbors.RIGHT) { nextMapId = map.neighbors.RIGHT; nextPos.x = 0; }
          else if (ny < 0 && map.neighbors.UP) { nextMapId = map.neighbors.UP; nextPos.y = MAPS[nextMapId].height - 1; }
          else if (ny >= map.height && map.neighbors.DOWN) { nextMapId = map.neighbors.DOWN; nextPos.y = 0; }
          else if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return { ...prev, playerFacing: facing };

          const targetMap = MAPS[nextMapId];
          
          // --- 2. Player Action Check (Combat vs Move) ---
          let playerDidAction = false; // Triggers enemy turn
          let newAnimations: Record<string, AnimationType> = {};
          let newNumbers: Record<string, number> = {};
          let combatLogs: LogEntry[] = [];
          let newCounters = { ...prev.counters };
          
          // Check collision with tile
          const tile = targetMap.tiles[nextPos.y][nextPos.x];
          if (BLOCKED_TILES.includes(tile)) {
               // Gathering logic
               if ((tile === 'TREE' || tile === 'ROCK') && ['Woodcutting', 'Mining'].includes(tile === 'TREE' ? 'Woodcutting' : 'Mining')) {
                  playSound('GATHER');
                  const skill = tile === 'TREE' ? 'Woodcutting' : 'Mining';
                  const { updatedSkill, statChanges } = applySkillXp(prev.stats, prev.skills, skill, 10);
                  const item = ITEMS[tile === 'TREE' ? 'wood' : 'stone'];
                  const wm = { ...prev.worldModified, [nextMapId]: { ...(prev.worldModified[nextMapId] || {}), [`${nextPos.y},${nextPos.x}`]: tile==='TREE'?'GRASS':'FLOOR' } };
                  
                  if (tile === 'TREE') newCounters.trees_cut = (newCounters.trees_cut || 0) + 1;
                  if (tile === 'ROCK') newCounters.rocks_mined = (newCounters.rocks_mined || 0) + 1;
                  
                  return { ...prev, playerFacing: facing, stats: { ...prev.stats, ...statChanges }, skills: { ...prev.skills, [skill]: updatedSkill }, inventory: addToInventory({ ...item }, prev), worldModified: wm as any, counters: newCounters };
              }
              return { ...prev, playerFacing: facing };
          }
          
          // Check collision with entities
          let entity = targetMap.entities.find(e => e.pos.x === nextPos.x && e.pos.y === nextPos.y);
          
          // STATE UPDATES CONTAINERS
          let nextMapEntities = [...targetMap.entities];
          let nextStats = { ...prev.stats };
          let nextInventory = [...prev.inventory];
          let nextSkills = { ...prev.skills };
          let nextBestiary = [...prev.bestiary];
          
          if (entity) {
              if (entity.destination) {
                  // WARP / ENTER DOOR - Keep automatic
                  playSound('UI_CLICK'); // Transition sound
                  const dest = entity.destination;
                  
                  // Initialize exploration for new map if needed
                  let newExp = { ...prev.exploration };
                  if (!newExp[dest.mapId]) newExp[dest.mapId] = Array(MAPS[dest.mapId].height).fill(null).map(() => Array(MAPS[dest.mapId].width).fill(0));
                  
                  return {
                      ...prev,
                      playerPos: { x: dest.x, y: dest.y },
                      currentMapId: dest.mapId,
                      exploration: newExp,
                      playerFacing: 'DOWN' // Reset facing on entry usually feels better
                  };
              }

              if (entity.type === 'ENEMY') {
                  // PLAYER ATTACK - Keep automatic (Bump Combat)
                  playerDidAction = true;
                  playSound('ATTACK');
                  
                  const playerStats = getPlayerTotalStats(prev.stats, prev.equipment, prev.equippedPerks);
                  const weapon = prev.equipment.WEAPON?.weaponStats || WEAPON_TEMPLATES['Sword'];
                  
                  let dmg = Math.floor(weapon.minDmg + (Math.random() * (weapon.maxDmg - weapon.minDmg)) + (playerStats.str * 0.5));
                  if (Math.random() < weapon.critChance) dmg = Math.floor(dmg * weapon.critMult);
                  
                  const newEnemyHp = (entity.hp || 10) - dmg;
                  
                  newAnimations['player'] = 'ATTACK';
                  newAnimations[entity.id] = 'HURT';
                  newNumbers[entity.id] = dmg;
                  combatLogs.push({ id: uid(), message: `You hit ${entity.name} for ${dmg}`, type: 'COMBAT', timestamp: getTimestamp() });

                  // Skill XP
                  const skillUsed = weapon.type === 'BOW' ? 'Dexterity' : 'Strength';
                  const { updatedSkill, statChanges } = applySkillXp(prev.stats, prev.skills, skillUsed, 5);
                  nextStats = { ...nextStats, ...statChanges };
                  nextSkills[skillUsed] = updatedSkill;

                  if (newEnemyHp <= 0) {
                      playSound('KILL');
                      nextMapEntities = nextMapEntities.filter(e => e.id !== entity!.id);
                      combatLogs.push({ id: uid(), message: `${entity!.name} died!`, type: 'COMBAT', timestamp: getTimestamp() });
                      newCounters.enemies_killed = (newCounters.enemies_killed || 0) + 1;
                      
                      nextStats.xp += Math.floor((entity.level || 1) * 10);
                      nextStats.gold += Math.floor((entity.level || 1) * (2 + Math.random() * 5));
                      
                      const loot = generateLoot(entity.level || 1, entity.name);
                      if (loot) {
                          const itemToAdd = prepareItemForInventory(loot);
                          nextInventory = addToInventory(itemToAdd, { ...prev, inventory: nextInventory });
                          combatLogs.push({ id: uid(), message: `Looted: ${loot.name}`, type: 'LOOT', timestamp: getTimestamp() });
                      }
                      if (!nextBestiary.includes(entity.name)) nextBestiary.push(entity.name);
                  } else {
                      const idx = nextMapEntities.findIndex(e => e.id === entity!.id);
                      if (idx !== -1) nextMapEntities[idx] = { ...entity, hp: newEnemyHp };
                  }
                  
              } else if (entity.subType === 'CRATE') {
                  // Keep smashing crates automatic
                  playSound('BUMP');
                  nextMapEntities = nextMapEntities.filter(e => e.id !== entity!.id);
                  const loot = entity.loot ? ITEMS[entity.loot] : (Math.random() > 0.5 ? ITEMS['wood'] : null);
                  if (loot) {
                      const itemToAdd = prepareItemForInventory(loot);
                      nextInventory = addToInventory(itemToAdd, { ...prev, inventory: nextInventory });
                  }
                  newAnimations['player'] = 'ATTACK';
                  playerDidAction = true;
              } else if (['NPC', 'OBJECT'].includes(entity.type) && !['PRESSURE_PLATE'].includes(entity.subType || '')) {
                  // IMPORTANT: Block movement but DO NOT Interact automatically
                  // Interactions (Talking, Workbench, Chests) now require pressing 'E'
                  return { ...prev, playerFacing: facing }; 
              }
          } else {
              // MOVE
              playSound('WALK');
              nextPos = { x: nx, y: ny };
              playerDidAction = true;
              newCounters.steps_taken = (newCounters.steps_taken || 0) + 1;
          }

          // --- 3. Enemy Turns (AI) ---
          if (playerDidAction) {
              const aiMapState = { ...targetMap, entities: nextMapEntities };
              const { entities: updatedEntities, damageToPlayer, logs: enemyLogs, anims: enemyAnims, numbers: enemyNumbers } 
                  = processEnemyTurns({ ...prev, playerPos: nextPos }, aiMapState, nextPos);
              
              nextMapEntities = updatedEntities;
              
              if (damageToPlayer > 0) {
                  nextStats.hp -= damageToPlayer;
                  newCounters.damage_taken = (newCounters.damage_taken || 0) + damageToPlayer;
                  newNumbers['player'] = (newNumbers['player'] || 0) + damageToPlayer;
                  combatLogs = [...combatLogs, ...enemyLogs];
                  newAnimations = { ...newAnimations, ...enemyAnims };
                  if (nextStats.hp <= 0) setActiveModal('DEATH');
              }
          }

          // --- 4. Final State Update ---
          const finalLogs = [...combatLogs, ...prev.logs].slice(0, 100);
          
          // Exploration Update
          const newExp = { ...prev.exploration };
          if (!newExp[nextMapId]) newExp[nextMapId] = Array(targetMap.height).fill(null).map(() => Array(targetMap.width).fill(0));
          const rad = getVisionRadius(prev);
          for(let y = nextPos.y - rad; y <= nextPos.y + rad; y++) 
             for(let x = nextPos.x - rad; x <= nextPos.x + rad; x++) 
                 if (y >= 0 && y < targetMap.height && x >= 0 && x < targetMap.width) newExp[nextMapId][y][x] = 1;
          
          if (Object.keys(newAnimations).length > 0) {
              setCombatNumbers(newNumbers);
              setTimeout(() => {
                  setGameState(p => ({ ...p, animations: {} }));
                  setCombatNumbers({});
              }, 400);
          }

          MAPS[nextMapId].entities = nextMapEntities;

          return {
              ...prev,
              playerPos: nextPos,
              playerFacing: facing,
              currentMapId: nextMapId,
              stats: nextStats,
              inventory: nextInventory,
              skills: nextSkills,
              bestiary: nextBestiary,
              logs: finalLogs,
              animations: newAnimations,
              exploration: newExp,
              counters: newCounters
          };
      });
  }, [activePuzzle, activeDialogue]);

  // --- KEYBOARD ---
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

  const toggleEquip = (item: Item) => {
      playSound('UI_CLICK');
      setGameState(prev => ({ ...prev, equipment: { ...prev.equipment, [item.slot!]: prev.equipment[item.slot!]?.id === item.id ? null : item } }));
  };

  const craft = (recipe: Recipe) => {
      setGameState(prev => {
          let inv = [...prev.inventory];
          if (!recipe.ingredients.every(i => inv.find(x => x.id === i.itemId && x.count >= i.count))) return prev;
          recipe.ingredients.forEach(i => inv = removeFromInventory(i.itemId, i.count, { ...prev, inventory: inv }));
          const { updatedSkill, statChanges } = applySkillXp(prev.stats, prev.skills, recipe.skill, recipe.xpReward);
          playSound('CRAFT');
          const resultItem = ITEMS[recipe.resultItemId];
          const itemToAdd = prepareItemForInventory(resultItem);
          const newCounters = { ...prev.counters, items_crafted: (prev.counters.items_crafted || 0) + 1 };
          return { ...prev, inventory: addToInventory(itemToAdd, { ...prev, inventory: inv }), skills: { ...prev.skills, [recipe.skill]: updatedSkill }, stats: { ...prev.stats, ...statChanges }, counters: newCounters };
      });
  };

  const lightingOpacity = (() => {
      const t = gameState.time;
      if (t < 500) return 0.6;
      if (t < 800) return 0.6 - ((t-500)/300) * 0.6;
      if (t < 1800) return 0;
      if (t < 2200) return ((t-1800)/400) * 0.6;
      return 0.6;
  })();

  const handlePuzzleSolve = () => {
      playSound('SECRET');
      setActivePuzzle(null);
      // Remove the entity that triggered the puzzle (e.g. locked door)
      setGameState(prev => {
          const map = MAPS[prev.currentMapId];
          const newEntities = map.entities.filter(e => e.id !== activePuzzle?.id);
          // Mutate MAPS to persist locally for now
          MAPS[prev.currentMapId].entities = newEntities;
          const newCounters = { ...prev.counters, puzzles_solved: (prev.counters.puzzles_solved || 0) + 1 };
          return { ...prev, logs: [...prev.logs, { id: uid(), message: 'Puzzle Solved! Passage Opened.', type: 'SECRET', timestamp: getTimestamp() }], counters: newCounters };
      });
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
        <GameRenderer 
            currentMap={MAPS[gameState.currentMapId]}
            gameState={gameState}
            viewScale={viewScale}
            visionRadius={getVisionRadius(gameState)}
            lightingOpacity={lightingOpacity}
            combatNumbers={combatNumbers}
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
            onRespawn={() => {
                setGameState(p => ({ ...p, playerPos: {x:10,y:7}, currentMapId: 'map_10_10', stats: { ...p.stats, hp: p.stats.maxHp } }));
                setActiveModal(null);
            }}
            onResetSave={() => { localStorage.removeItem('sh_save_v1'); window.location.reload(); }}
            onConsume={(item) => {
                playSound('GATHER');
                setGameState(p => ({ ...p, stats: { ...p.stats, hp: Math.min(p.stats.maxHp, p.stats.hp + (item.healAmount||0)) }, inventory: removeFromInventory(item.id, 1, p) }));
            }}
            onTogglePerk={(id) => {
                setGameState(p => {
                    const eq = p.equippedPerks.includes(id) ? p.equippedPerks.filter(x => x !== id) : [...p.equippedPerks, id].slice(0,3);
                    return { ...p, equippedPerks: eq };
                });
            }}
            onPuzzleSolve={handlePuzzleSolve}
            onPuzzleClose={() => setActivePuzzle(null)}
            onDialogueClose={() => setActiveDialogue(null)}
            formatTime={(t) => `${Math.floor(t/100).toString().padStart(2,'0')}:${Math.floor((t%100)*0.6).toString().padStart(2,'0')}`}
        />
    </div>
  );
}
