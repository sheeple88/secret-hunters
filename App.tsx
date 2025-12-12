
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, LogEntry, Item, GameMap, Position, Entity, SkillName, Recipe, Skill, EquipmentSlot, Stats, Quest, AnimationType } from './types';
import { MAPS, SECRETS_DATA, INITIAL_STATS, ITEMS, LOOT_TABLE, INITIAL_SKILLS, RECIPES, QUESTS, LOOT_TIERS, EQUIPMENT_TYPES, STAT_SUFFIXES, ENEMY_INFO, ASSETS } from './constants';
import { Tile } from './components/Tile';
import { EntityComponent } from './components/EntityComponent';
import { generateRumor, generateLore } from './services/geminiService';
import { Terminal, Sparkles, Backpack, Sword, MessageSquare, Hand, Hammer, HelpCircle, Skull, Trophy, Shield, Map as MapIcon, Navigation, Scroll, BookOpen } from 'lucide-react';

// Helpers
const getTimestamp = () => Date.now();
const uid = () => Math.random().toString(36).substr(2, 9);

// Big Number Formatter
const formatNumber = (num: number): string => {
  if (num < 1000) return Math.floor(num).toString();
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Od", "Nd", "V", "Uv", "Dv"];
  const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);
  let shortValue = parseFloat((suffixNum !== 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
  if (shortValue % 1 !== 0) {
    shortValue = parseFloat(shortValue.toFixed(1));
  }
  return shortValue + suffixes[suffixNum];
};

const EQUIPMENT_SLOTS: EquipmentSlot[] = ['HEAD', 'BODY', 'LEGS', 'WEAPON', 'OFFHAND', 'ACCESSORY'];

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 10, y: 7 }, 
    playerFacing: 'RIGHT',
    currentMapId: 'map_10_10', // Start in Town Center
    stats: { ...INITIAL_STATS },
    equipment: {
        HEAD: null,
        BODY: null,
        LEGS: null,
        WEAPON: null,
        OFFHAND: null,
        ACCESSORY: null,
    },
    skills: { ...INITIAL_SKILLS },
    inventory: [],
    secrets: SECRETS_DATA.map(s => ({ ...s, unlocked: false })),
    counters: {},
    logs: [{ id: 'init', message: 'Welcome to Secret Hunters. Infinite power awaits.', type: 'INFO', timestamp: getTimestamp() }],
    flags: {},
    lastAction: null,
    isCombat: false,
    combatTargetId: null,
    activeQuest: null,
    exploration: {}, // Initial exploration state
    knownWaypoints: [],
    knownLocations: ['map_10_10'],
    animations: {},
    bestiary: [],
  });

  const [activeTab, setActiveTab] = useState<'LOG' | 'SECRETS' | 'INV' | 'SKILLS' | 'EQUIP' | 'MAP' | 'BESTIARY'>('LOG');
  const [isLoadingRumor, setIsLoadingRumor] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // References
  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // --- LOGIC ---

  useEffect(() => {
    const handleResize = () => {
      if (gameContainerRef.current) {
         const { width, height } = gameContainerRef.current.getBoundingClientRect();
         const map = MAPS[gameState.currentMapId] || MAPS['map_10_10'];
         const mapPixelWidth = (map.width * 32) + 32; 
         const mapPixelHeight = (map.height * 32) + 32;
         const scaleX = (width - 40) / mapPixelWidth;
         const scaleY = (height - 40) / mapPixelHeight;
         const newScale = Math.min(scaleX, scaleY, 1.5); 
         setScale(Math.max(newScale, 0.5));
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState.currentMapId]);

  // Clear animations effect
  useEffect(() => {
      if (Object.keys(gameState.animations).length > 0) {
          const t = setTimeout(() => {
              setGameState(prev => ({ ...prev, animations: {} }));
          }, 300); // Matches animation duration
          return () => clearTimeout(t);
      }
  }, [gameState.animations]);

  const addLog = (message: string, type: LogEntry['type'] = 'INFO') => {
    setGameState(prev => ({
      ...prev,
      logs: [{ id: uid(), message, type, timestamp: getTimestamp() }, ...prev.logs].slice(0, 50)
    }));
  };

  // Helper to add item to inventory (handles stacking)
  const addToInventory = (item: Item, state: GameState): Item[] => {
      const inv = [...state.inventory];
      // Only stack specific types
      if (['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY'].includes(item.type)) {
          const existing = inv.find(i => i.id === item.id); // Check by ID reference if possible, otherwise name match for generics
          if (existing) {
              existing.count += item.count;
              return inv;
          }
          // Fallback to name check if ID differs but same item logic (e.g. static items)
          const existingByName = inv.find(i => i.name === item.name && i.type === item.type);
          if (existingByName) {
              existingByName.count += item.count;
              return inv;
          }
      }
      // Equipment or new items
      inv.push(item);
      return inv;
  };

  // Fog of War Logic
  const revealArea = useCallback((mapId: string, px: number, py: number, radius: number = 5) => {
      setGameState(prev => {
          const map = MAPS[mapId];
          if (!map) return prev;

          const exploration = { ...prev.exploration };
          if (!exploration[mapId]) {
              // Initialize grid with 0s
              exploration[mapId] = Array(map.height).fill(null).map(() => Array(map.width).fill(0));
          }

          const grid = [...exploration[mapId].map(row => [...row])];
          let changed = false;

          for (let y = Math.max(0, py - radius); y <= Math.min(map.height - 1, py + radius); y++) {
              for (let x = Math.max(0, px - radius); x <= Math.min(map.width - 1, px + radius); x++) {
                  if ((x-px)**2 + (y-py)**2 <= radius**2) {
                      if (grid[y][x] === 0) {
                          grid[y][x] = 1;
                          changed = true;
                      }
                  }
              }
          }

          if (!changed) return prev;

          exploration[mapId] = grid;
          
          // Mark map as known if visited
          const knownLocations = prev.knownLocations.includes(mapId) ? prev.knownLocations : [...prev.knownLocations, mapId];

          return { ...prev, exploration, knownLocations };
      });
  }, []);

  // Initial reveal on load and map change
  useEffect(() => {
      revealArea(gameState.currentMapId, gameState.playerPos.x, gameState.playerPos.y);
  }, [gameState.currentMapId, revealArea]); // Remove playerPos dependency to avoid re-rendering on every step for this specific effect, handle in move

  const handleDeath = () => {
      setGameState(prev => {
          // Respawn all non-boss enemies on death
          const newFlags = { ...prev.flags };
          Object.keys(newFlags).forEach(key => {
               // Assuming BOSS IDs contain 'BOSS_' and normal enemies contain 'map_'
               if (key.startsWith('dead_') && !key.includes('BOSS_')) {
                   delete newFlags[key];
               }
          });

          return {
            ...prev,
            stats: { ...prev.stats, hp: prev.stats.maxHp },
            currentMapId: 'house_player',
            playerPos: { x: 1, y: 1 }, // Bed
            flags: newFlags,
            logs: [{ id: uid(), message: 'YOU DIED! Rescued by mysterious forces.', type: 'COMBAT' as const, timestamp: getTimestamp() }, ...prev.logs].slice(0, 50)
          };
      });
  };

  // --- SCALING CALCULATIONS ---
  const getPlayerTotalStats = (baseStats: Stats, equipment: GameState['equipment']): Stats => {
      let total = { ...baseStats };
      // Apply Equipment
      Object.values(equipment).forEach(item => {
          if (item && item.stats) {
              total.str += item.stats.str || 0;
              total.dex += item.stats.dex || 0;
              total.int += item.stats.int || 0;
              total.regeneration += item.stats.regeneration || 0;
              total.maxHp += item.stats.maxHp || 0;
          }
      });
      return total;
  };

  const calculateEnemyStats = (baseName: string, level: number) => {
      const multiplier = Math.pow(1.15, level);
      
      let baseHp = 10;
      let baseDmg = 2;
      let baseXp = 10;

      if (baseName.includes('Dragon')) { baseHp = 100; baseDmg = 20; baseXp = 500; }
      if (baseName.includes('Golem')) { baseHp = 50; baseDmg = 10; baseXp = 200; }
      if (baseName.includes('Minotaur')) { baseHp = 80; baseDmg = 15; baseXp = 400; } // Elite
      if (baseName.includes('Beholder')) { baseHp = 60; baseDmg = 25; baseXp = 400; } // Elite

      return {
          hp: Math.floor(baseHp * multiplier),
          maxHp: Math.floor(baseHp * multiplier),
          dmg: Math.floor(baseDmg * multiplier),
          xp: Math.floor(baseXp * Math.pow(1.1, level))
      };
  };

  // --- PROCEDURAL LOOT GENERATOR ---
  const generateProceduralLoot = (level: number, enemyName?: string): Item | null => {
      if (Math.random() > 0.4) return null; // 40% chance drop

      // 1. Determine Material Tier based on Level
      // Find the highest tier where minLvl <= level
      let tier = LOOT_TIERS[0];
      for (let i = LOOT_TIERS.length - 1; i >= 0; i--) {
          if (level >= LOOT_TIERS[i].minLvl) {
              tier = LOOT_TIERS[i];
              break;
          }
      }

      // 2. Roll Rarity (Weighted)
      const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'GODLY'];
      const rarityWeights = [0.6, 0.25, 0.1, 0.04, 0.009, 0.0009, 0.0001];
      let r = Math.random();
      let rarityIdx = 0;
      for(let i=0; i<rarityWeights.length; i++) {
          if (r < rarityWeights[i]) { rarityIdx = i; break; }
          r -= rarityWeights[i];
      }
      const rarity = rarities[rarityIdx] as any;
      const rarityMult = Math.pow(1.5, rarityIdx); // Multiplier for rarity

      // 3. Roll Slot & Type
      const slots: EquipmentSlot[] = ['WEAPON', 'HEAD', 'BODY', 'LEGS', 'OFFHAND', 'ACCESSORY'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      const typeConfig = EQUIPMENT_TYPES[slot];
      const baseType = typeConfig.names[Math.floor(Math.random() * typeConfig.names.length)];

      // 4. Calculate Stats
      const stats: Partial<Stats> = {};
      const baseStatPoints = Math.floor((level * 1.5 + 5) * tier.mult * rarityMult * (Math.random() * 0.4 + 0.8)); // +/- 20% variance
      
      // Distribute points based on slot bias
      typeConfig.statBias.forEach(statKey => {
          let val = Math.floor(baseStatPoints / typeConfig.statBias.length);
          if (statKey === 'regeneration') val = Math.max(1, Math.floor(val / 5)); // Regen is 5x more expensive/rare
          if (val === 0) val = 1;
          stats[statKey] = val;
      });

      // 5. Naming
      // [Rarity] [Material] [BaseType] [Suffix]
      // e.g. "Rare Mithril Sword of Power"
      
      // Determine Suffix based on highest stat
      let highestStat: keyof Stats = 'str';
      let highestVal = 0;
      (Object.keys(stats) as Array<keyof Stats>).forEach(k => {
          if ((stats[k] || 0) > highestVal) {
              highestVal = stats[k] || 0;
              highestStat = k;
          }
      });
      
      // Random suffix for that stat
      const possibleSuffixes = STAT_SUFFIXES.filter(s => s.stat === highestStat);
      const suffix = possibleSuffixes.length > 0 ? possibleSuffixes[Math.floor(Math.random() * possibleSuffixes.length)].name : '';

      const rarityPrefix = rarity !== 'COMMON' ? rarity + ' ' : '';
      const name = `${rarityPrefix}${tier.name} ${baseType}${suffix ? ' ' + suffix : ''}`;

      return {
          id: uid(),
          name,
          type: 'EQUIPMENT',
          slot,
          rarity,
          description: `Lvl ${level} ${tier.name} Item`,
          count: 1,
          stats,
          levelReq: Math.floor(level * 0.8), // req is slightly lower than drop level
          value: Math.floor(baseStatPoints * 10)
      };
  };

  const addSkillXp = (skillName: SkillName, amount: number) => {
    setGameState(prev => {
      const skill = prev.skills[skillName];
      const newXp = skill.xp + amount;
      const nextLevelXp = Math.floor(50 * Math.pow(skill.level, 2.5)); 
      
      let newLevel = skill.level;
      let leveledUp = false;

      if (newXp >= nextLevelXp) {
        newLevel++;
        leveledUp = true;
      }

      const newStats = { ...prev.stats };
      if (skillName === 'Strength' && leveledUp) newStats.str = Math.floor(newStats.str * 1.1 + 5);
      if (skillName === 'Dexterity' && leveledUp) newStats.dex = Math.floor(newStats.dex * 1.1 + 5);
      if (skillName === 'Agility' && leveledUp) newStats.int = Math.floor(newStats.int * 1.1 + 5);
      
      const logs = [...prev.logs];
      if (leveledUp) {
          logs.unshift({ id: uid(), message: `LEVEL UP! ${skillName} -> ${newLevel}.`, type: 'SKILL', timestamp: getTimestamp() });
      }

      return {
        ...prev,
        stats: newStats,
        skills: {
          ...prev.skills,
          [skillName]: { ...skill, xp: newXp, level: newLevel }
        },
        logs
      };
    });
  };

  // Regen Loop
  useEffect(() => {
    const regenInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.stats.hp <= 0) return prev; // Dead men don't regenerate
        
        const totalStats = getPlayerTotalStats(prev.stats, prev.equipment);
        const maxHp = totalStats.maxHp;
        
        if (prev.stats.hp >= maxHp) return prev;

        const regenAmount = Math.max(1, Math.floor(totalStats.regeneration)); // Minimum 1
        const newHp = Math.min(maxHp, prev.stats.hp + regenAmount);
        
        // Only trigger animation if actually healed
        if (newHp > prev.stats.hp) {
             const newAnimations = { ...prev.animations, player: 'HEAL' as AnimationType };
             return {
                 ...prev,
                 stats: { ...prev.stats, hp: newHp },
                 animations: newAnimations
             };
        }
        return prev;
      });
    }, 5000); // Every 5 seconds

    return () => clearInterval(regenInterval);
  }, []);

  // --- ENEMY AI ---
  const processEnemyTurn = (currentState: GameState): GameState => {
      const map = MAPS[currentState.currentMapId];
      if (!map) return currentState;

      const newLogs = [...currentState.logs];
      let newHp = currentState.stats.hp;
      let damageTakenTotal = currentState.counters['damage_taken'] || 0;
      const newAnimations = { ...currentState.animations };
      const enemies = map.entities.filter(e => e.type === 'ENEMY' && !currentState.flags[`dead_${e.id}`]);

      const isBlocked = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
          const tile = map.tiles[y][x];
          if (['WALL', 'TREE', 'ROCK', 'WATER', 'VOID', 'SHRINE', 'CACTUS', 'DEEP_WATER', 'OBSIDIAN'].includes(tile)) return true;
          if (map.entities.some(e => e.pos.x === x && e.pos.y === y && !currentState.flags[`dead_${e.id}`] && e.type !== 'PLAYER')) return true;
          if (currentState.playerPos.x === x && currentState.playerPos.y === y) return true;
          return false;
      };

      enemies.forEach(enemy => {
          const dx = currentState.playerPos.x - enemy.pos.x;
          const dy = currentState.playerPos.y - enemy.pos.y;
          const dist = Math.abs(dx) + Math.abs(dy);

          if (dist === 1) {
              const enemyStats = calculateEnemyStats(enemy.name, enemy.level || 1);
              const dodgeChance = 0.1;
              
              // Enemy Attack Animation
              newAnimations[enemy.id] = 'ATTACK';

              if (Math.random() > dodgeChance) {
                  const dmg = Math.max(1, enemyStats.dmg); 
                  newHp -= dmg;
                  damageTakenTotal += dmg;
                  newLogs.unshift({ id: uid(), message: `${enemy.name} (Lvl ${enemy.level}) hits for ${formatNumber(dmg)}!`, type: 'COMBAT', timestamp: getTimestamp() });
                  
                  // Player Hurt Animation
                  newAnimations['player'] = 'HURT';
              } else {
                  newLogs.unshift({ id: uid(), message: `You dodged ${enemy.name}!`, type: 'COMBAT', timestamp: getTimestamp() });
                  
                  // Player Dodge Animation
                  newAnimations['player'] = 'DODGE';
              }
          } else if (dist < 8) {
              let targetX = enemy.pos.x;
              let targetY = enemy.pos.y;
              if (Math.abs(dx) > Math.abs(dy)) targetX += Math.sign(dx);
              else targetY += Math.sign(dy);

              if (isBlocked(targetX, targetY)) {
                  targetX = enemy.pos.x;
                  targetY = enemy.pos.y;
                  if (Math.abs(dx) <= Math.abs(dy)) targetX += Math.sign(dx);
                  else targetY += Math.sign(dy);
              }

              if (!isBlocked(targetX, targetY)) {
                  enemy.pos = { x: targetX, y: targetY };
                  if (targetX < enemy.pos.x) enemy.facing = 'LEFT';
                  if (targetX > enemy.pos.x) enemy.facing = 'RIGHT';
              }
          }
      });

      return {
          ...currentState,
          stats: { ...currentState.stats, hp: newHp },
          counters: { ...currentState.counters, damage_taken: damageTakenTotal },
          logs: newLogs,
          animations: newAnimations
      };
  };

  const checkSecrets = async (currentState: GameState) => {
    let newState = { ...currentState };
    let secretsChanged = false;

    for (const secret of newState.secrets) {
      if (!secret.unlocked && secret.condition(newState)) {
        secret.unlocked = true;
        secretsChanged = true;
        
        newState.stats.str += secret.statBonus.str || 0;
        newState.stats.dex += secret.statBonus.dex || 0;
        newState.stats.int += secret.statBonus.int || 0;
        newState.stats.hp += secret.statBonus.hp || 0;
        newState.stats.maxHp += secret.statBonus.maxHp || 0;
        newState.stats.xp += secret.statBonus.xp || 0;
        
        generateLore(secret).then(lore => {
           addLog(`SECRET UNLOCKED: ${secret.title} - ${lore}`, 'SECRET');
        });
        
        addLog(`Unlocked: ${secret.title}! Stats increased.`, 'SECRET');
      }
    }
    
    const xpReq = Math.floor(newState.stats.level * 200 * Math.pow(1.1, newState.stats.level));
    if (newState.stats.xp >= xpReq) {
      newState.stats.level++;
      newState.stats.xp -= xpReq;
      newState.stats.maxHp = Math.floor(newState.stats.maxHp * 1.2);
      newState.stats.hp = newState.stats.maxHp;
      newState.logs.unshift({ id: uid(), message: `COMBAT LEVEL UP! You are now level ${newState.stats.level}.`, type: 'INFO', timestamp: getTimestamp() });
    }

    if (secretsChanged) setGameState(newState);
  };

  const handleMove = useCallback((dx: number, dy: number) => {
    if (Math.random() < 0.1) addSkillXp('Agility', 5);

    setGameState(prev => {
      if (prev.stats.hp <= 0) return prev;

      const map = MAPS[prev.currentMapId];
      if (!map) return prev;
      
      const newX = prev.playerPos.x + dx;
      const newY = prev.playerPos.y + dy;
      let newFacing = prev.playerFacing;
      if (dx > 0) newFacing = 'RIGHT';
      if (dx < 0) newFacing = 'LEFT';

      if (newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
        return { ...prev, playerFacing: newFacing };
      }

      const targetTile = map.tiles[newY][newX];
      if (['WALL', 'TREE', 'ROCK', 'SHRINE', 'VOID', 'WATER', 'CACTUS', 'DEEP_WATER', 'OBSIDIAN'].includes(targetTile)) {
        const counters = { ...prev.counters };
        if (targetTile === 'WALL') counters['bump_wall'] = (counters['bump_wall'] || 0) + 1;
        if (targetTile === 'TREE') counters['bump_tree'] = (counters['bump_tree'] || 0) + 1;
        if (targetTile === 'CACTUS') {
            const msg = "Ouch! Prickly!";
            // Prevent repeat message spam and damage if holding key
            if (prev.logs[0]?.message === msg) return prev;

            const nextState = { ...prev, counters, playerFacing: newFacing, stats: { ...prev.stats, hp: prev.stats.hp - 1 } };
            nextState.logs = [{ id: uid(), message: msg, type: 'COMBAT' as const, timestamp: getTimestamp() }, ...nextState.logs];
            return processEnemyTurn(nextState);
        }
        
        let nextState = { ...prev, counters, playerFacing: newFacing };
        return processEnemyTurn(nextState);
      }

      const targetEntity = map.entities.find(e => e.pos.x === newX && e.pos.y === newY && !(prev.flags[`dead_${e.id}`] || prev.flags[`looted_${e.id}`]));
      if (targetEntity) {
        if (targetEntity.type === 'ENEMY') {
            const msg = `Blocked by ${targetEntity.name}. Press SPACE to attack!`;
            // Prevent repeat message spam if holding key
            if (prev.logs[0]?.message === msg) return prev;

            let nextState = { ...prev, playerFacing: newFacing };
            nextState.logs = [{ id: uid(), message: msg, type: 'COMBAT' as const, timestamp: getTimestamp() }, ...nextState.logs];
            return processEnemyTurn(nextState);
        }
        if (targetEntity.type === 'NPC' || targetEntity.type === 'OBJECT') {
             const msg = `Blocked by ${targetEntity.name}. Press E to interact.`;
             // Prevent repeat message spam if holding key
             if (prev.logs[0]?.message === msg) return prev;

             let nextState = { ...prev, playerFacing: newFacing };
             nextState.logs = [{ id: uid(), message: msg, type: 'INFO' as const, timestamp: getTimestamp() }, ...nextState.logs];
             return nextState;
        }
      }

      const exit = map.exits.find(e => e.pos.x === newX && e.pos.y === newY);
      if (exit) {
        // Prepare flags for next state
        const flags = { ...prev.flags };
        flags[`visit_${exit.targetMapId}`] = true;
        
        // --- RESPAWN LOGIC ---
        // When entering a map, clear dead flags for that map to respawn enemies.
        // Identify enemies of the target map by ID prefix (e.g., 'map_10_10_').
        // Bosses usually have special IDs (BOSS_GOLEM) and won't be respawned here unless we explicitly include them.
        const targetPrefix = `dead_${exit.targetMapId}`;
        const nextFlags: Record<string, boolean> = {};
        Object.keys(flags).forEach(key => {
            if (key.startsWith(targetPrefix)) {
                return; // Skip copying this flag, effectively respawning the enemy
            }
            nextFlags[key] = flags[key];
        });

        // Reveal area on enter
        setTimeout(() => revealArea(exit.targetMapId, exit.targetPos.x, exit.targetPos.y), 50);

        return {
            ...prev,
            currentMapId: exit.targetMapId,
            playerPos: exit.targetPos,
            lastAction: 'travel',
            playerFacing: newFacing,
            flags: nextFlags
        };
      }
      
      const newCounters = { ...prev.counters };
      const newFlags = { ...prev.flags };
      let newHp = prev.stats.hp;

      if (map.tiles[prev.playerPos.y][prev.playerPos.x] === 'SHRINE') {
          newCounters['shrine_meditation'] = 0;
      }
      
      if (targetTile === 'LAVA') {
          newCounters['step_lava'] = (newCounters['step_lava'] || 0) + 1;
          const dmg = 5;
          newHp -= dmg;
          newCounters['damage_taken'] = (newCounters['damage_taken'] || 0) + dmg;
          addLog("Ouch! Hot!", 'COMBAT');
      }
      if (targetTile === 'GRAVESTONE') newCounters['step_grave'] = (newCounters['step_grave'] || 0) + 1;
      if (targetTile === 'FLOWER') newCounters['step_flower'] = (newCounters['step_flower'] || 0) + 1;
      if (targetTile === 'MUD') newCounters['step_mud'] = (newCounters['step_mud'] || 0) + 1;
      if (targetTile === 'WATERFALL') newFlags['seen_waterfall'] = true;
      if (targetTile === 'SAND' && parseInt(prev.currentMapId.split('_')[2]) > 16) {
           newCounters['steps_desert'] = (newCounters['steps_desert'] || 0) + 1;
      }

      if (newHp <= 0) setTimeout(handleDeath, 500); 

      // Reveal area
      revealArea(prev.currentMapId, newX, newY);

      let nextState = {
        ...prev,
        stats: { ...prev.stats, hp: newHp },
        playerPos: { x: newX, y: newY },
        playerFacing: newFacing,
        lastAction: 'move',
        counters: newCounters,
        flags: newFlags
      };

      return processEnemyTurn(nextState);
    });
  }, [revealArea]);

  const handleTeleport = (targetMapId: string) => {
      setGameState(prev => {
          const targetMap = MAPS[targetMapId];
          // Find waypoint pos in target map
          const wp = targetMap.entities.find(e => e.subType === 'WAYPOINT');
          const targetPos = wp ? { x: wp.pos.x, y: wp.pos.y + 1 } : { x: 10, y: 10 };
          
          revealArea(targetMapId, targetPos.x, targetPos.y);

          // Respawn logic for teleport
          const targetPrefix = `dead_${targetMapId}`;
          const nextFlags: Record<string, boolean> = {};
          Object.keys(prev.flags).forEach(key => {
              if (key.startsWith(targetPrefix)) return;
              nextFlags[key] = prev.flags[key];
          });

          return {
              ...prev,
              currentMapId: targetMapId,
              playerPos: targetPos,
              flags: nextFlags,
              logs: [{ id: uid(), message: "Teleported!", type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs]
          };
      });
      setShowModal(null);
  }

  const handleAction = (action: 'ATTACK' | 'DANCE' | 'WAIT' | 'INTERACT') => {
    
    if (action === 'INTERACT') {
         const map = MAPS[gameState.currentMapId];
         const { x, y } = gameState.playerPos;
         
         // Side effects for Modals
         const entity = map.entities.find(e => 
            Math.abs(e.pos.x - x) + Math.abs(e.pos.y - y) <= 1 &&
            !gameState.flags[`looted_${e.id}`] && !gameState.flags[`dead_${e.id}`]
         );
         if (entity) {
             if (entity.type === 'NPC') setShowModal('NPC_TALK');
             if (entity.subType === 'WAYPOINT') {
                 if (gameState.knownWaypoints.includes(map.id)) {
                     setShowModal('FAST_TRAVEL');
                 }
             }
         }

         setGameState(prev => {
             const map = MAPS[prev.currentMapId];
             const { x, y } = prev.playerPos;
             const facing = prev.playerFacing;
             
             // Check Entity Interaction
             const entity = map.entities.find(e => 
                Math.abs(e.pos.x - x) + Math.abs(e.pos.y - y) <= 1 &&
                !prev.flags[`looted_${e.id}`] && !prev.flags[`dead_${e.id}`]
             );

             if (entity) {
                if (entity.type === 'NPC') {
                    // Check Quest Giver logic
                    let logs = [...prev.logs];
                    let activeQuest = prev.activeQuest;
                    let stats = { ...prev.stats };
                    let inventory = [...prev.inventory];
                    let flags = { ...prev.flags };

                    if (entity.questId) {
                        // Is this NPC the giver of current active quest?
                        if (activeQuest && activeQuest.id === entity.questId) {
                            if (activeQuest.completed) {
                                // Claim Reward
                                logs.unshift({ id: uid(), message: `QUEST COMPLETE: ${activeQuest.title}!`, type: 'QUEST', timestamp: getTimestamp() });
                                stats.xp += activeQuest.reward.xp;
                                logs.unshift({ id: uid(), message: `+${activeQuest.reward.xp} XP`, type: 'INFO', timestamp: getTimestamp() });
                                if (activeQuest.reward.gold) {
                                    // Not using gold yet
                                }
                                if (activeQuest.reward.itemId) {
                                    const rewardItem = ITEMS[activeQuest.reward.itemId];
                                    const count = activeQuest.reward.itemCount || 1;
                                    inventory = addToInventory({ ...rewardItem, count }, { ...prev, inventory });
                                    logs.unshift({ id: uid(), message: `Received ${count} ${rewardItem.name}`, type: 'LOOT', timestamp: getTimestamp() });
                                }
                                flags[`quest_completed_${activeQuest.id}`] = true;
                                activeQuest = null; 
                            } else {
                                logs.unshift({ id: uid(), message: `${entity.name}: "How goes the task?"`, type: 'DIALOGUE', timestamp: getTimestamp() });
                            }
                        } else if (!activeQuest && !prev.flags[`quest_completed_${entity.questId}`]) {
                            // Give New Quest
                            const newQuest = QUESTS[entity.questId];
                            activeQuest = { ...newQuest };
                            logs.unshift({ id: uid(), message: `${entity.name}: "${newQuest.description}"`, type: 'DIALOGUE', timestamp: getTimestamp() });
                            logs.unshift({ id: uid(), message: `QUEST ACCEPTED: ${newQuest.title}`, type: 'QUEST', timestamp: getTimestamp() });
                        } else if (prev.flags[`quest_completed_${entity.questId}`]) {
                             logs.unshift({ id: uid(), message: `${entity.name}: "Thanks for your help before!"`, type: 'DIALOGUE', timestamp: getTimestamp() });
                        } else {
                            logs.unshift({ id: uid(), message: `${entity.name}: "I am busy right now."`, type: 'DIALOGUE', timestamp: getTimestamp() });
                        }
                    } else {
                         logs.unshift({ id: uid(), message: `${entity.name}: ${entity.dialogue?.[0] || '...' }`, type: 'DIALOGUE', timestamp: getTimestamp() });
                    }

                    return { ...prev, logs, activeQuest, stats, inventory, flags };
                } else if (entity.subType === 'CHEST') {
                    const flags = { ...prev.flags, [`looted_${entity.id}`]: true };
                    const counters = { ...prev.counters, open_chest: (prev.counters['open_chest'] || 0) + 1 };
                    const lootKey = entity.loot || 'POTION';
                    
                    // Chest loot generation: use entity.loot if specific, else random level 10 loot
                    let lootItem: Item | null = null;
                    if (ITEMS[lootKey]) {
                        lootItem = { ...ITEMS[lootKey], count: 1, id: uid() };
                    } else {
                        // Fallback or explicit random generation for chests
                        lootItem = generateProceduralLoot(10);
                    }

                    let inventory = [...prev.inventory];
                    if (lootItem) {
                        inventory = addToInventory(lootItem, prev);
                    }
                    return { ...prev, flags, counters, inventory, logs: [{ id: uid(), message: `Opened Chest! Found ${lootItem?.name || 'Nothing'}.`, type: 'SECRET' as const, timestamp: getTimestamp() }, ...prev.logs] };
                } else if (entity.subType === 'BED') {
                    const newStats = { ...prev.stats, hp: prev.stats.maxHp };
                    
                    // Strictly respawn NON-BOSS enemies on sleep
                    const newFlags: Record<string, boolean> = {};
                    Object.keys(prev.flags).forEach(key => {
                        // Keep looted chests, visited flags, and dead BOSSES.
                        // Remove dead normal enemies.
                        if (key.startsWith('dead_') && !key.includes('BOSS_')) {
                             return; // Skip -> Respawn
                        }
                        newFlags[key] = prev.flags[key];
                    });

                    return { ...prev, stats: newStats, flags: newFlags, logs: [{ id: uid(), message: "You slept. HP Restored. Common enemies respawned.", type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs] };
                } else if (entity.subType === 'WAYPOINT') {
                    if (!prev.knownWaypoints.includes(map.id)) {
                        return {
                            ...prev,
                            knownWaypoints: [...prev.knownWaypoints, map.id],
                            logs: [{ id: uid(), message: `Waypoint activated: ${map.name}`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs]
                        };
                    }
                } else if (entity.subType === 'SIGNPOST') {
                    if (entity.destination && !prev.knownLocations.includes(entity.destination.mapId)) {
                        return {
                            ...prev,
                            knownLocations: [...prev.knownLocations, entity.destination.mapId],
                            logs: [{ id: uid(), message: `Map Updated: ${entity.destination.name} added to World Map.`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs]
                        };
                    } else if (entity.destination) {
                        return { ...prev, logs: [{ id: uid(), message: `Sign reads: "${entity.destination.name} nearby"`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs] };
                    }
                } else if (entity.subType === 'ANVIL' || entity.subType === 'WORKBENCH' || entity.subType === 'ALCHEMY_TABLE') {
                     return { ...prev, logs: [{ id: uid(), message: `A ${entity.name}. Use the Crafting menu to make items.`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs] };
                }
             }

             // Resource Gathering
             let targetX = x;
             let targetY = y;
             if (facing === 'LEFT') targetX--; else targetX++;
             
             if (targetX >= 0 && targetX < map.width && targetY >= 0 && targetY < map.height) {
                 const tile = map.tiles[targetY][targetX];
                 if (tile === 'TREE') {
                     addSkillXp('Woodcutting', 15);
                     const log = ITEMS.LOG;
                     const inventory = addToInventory({ ...log, count: 1 }, prev);
                     return { ...prev, inventory, logs: [{ id: uid(), message: "You chop some logs.", type: 'SKILL' as const, timestamp: getTimestamp() }, ...prev.logs] };
                 }
                 if (tile === 'ROCK') {
                     addSkillXp('Mining', 15);
                     const ore = Math.random() > 0.5 ? ITEMS.COPPER_ORE : ITEMS.PEBBLE;
                     const inventory = addToInventory({ ...ore, count: 1 }, prev);
                     return { ...prev, inventory, logs: [{ id: uid(), message: `You mine some ${ore.name}.`, type: 'SKILL' as const, timestamp: getTimestamp() }, ...prev.logs] };
                 }
                 if (tile === 'FLOWER') {
                     addSkillXp('Alchemy', 10);
                     const herb = ITEMS.RED_HERB;
                     const inventory = addToInventory({ ...herb, count: 1 }, prev);
                     return { ...prev, inventory, logs: [{ id: uid(), message: `You gather some ${herb.name}.`, type: 'SKILL' as const, timestamp: getTimestamp() }, ...prev.logs] };
                 }
                 if (tile === 'SAND') {
                     const sand = ITEMS.SAND;
                     const inventory = addToInventory({ ...sand, count: 1 }, prev);
                     return { ...prev, inventory, logs: [{ id: uid(), message: `You scoop up some ${sand.name}.`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs] };
                 }
             }
             
             return { ...prev, logs: [{ id: uid(), message: "Nothing to interact with.", type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs] };
         });
         return; 
    }

    setGameState(prev => {
      const map = MAPS[prev.currentMapId];
      if (!map) return prev;
      
      const counters = { ...prev.counters };
      let logs = prev.logs;
      let inventory = [...prev.inventory];
      let flags = { ...prev.flags };
      let stats = { ...prev.stats };
      let activeQuest = prev.activeQuest ? { ...prev.activeQuest } : null;
      let animations = { ...prev.animations };
      let bestiary = [...prev.bestiary];

      const pushLog = (msg: string, type: LogEntry['type']) => {
          logs = [{ id: uid(), message: msg, type, timestamp: getTimestamp() }, ...logs];
      };

      if (action === 'DANCE') {
        if (prev.currentMapId === 'map_10_10') counters['dance_town'] = (counters['dance_town'] || 0) + 1;
        pushLog("You dance wildly!", 'INFO');
      }

      if (action === 'WAIT') {
         counters['wait_action'] = (counters['wait_action'] || 0) + 1;
         pushLog("You stand still.", 'INFO');
      }

      if (action === 'ATTACK') {
        const { x, y } = prev.playerPos;
        
        // Player Attack Animation
        animations['player'] = 'ATTACK';

        const targets = map.entities.filter(e => 
          e.type === 'ENEMY' && 
          Math.abs(e.pos.x - x) + Math.abs(e.pos.y - y) === 1 &&
          !(prev.flags[`dead_${e.id}`])
        );

        if (targets.length > 0) {
            const target = targets[0]; 
            const totalStats = getPlayerTotalStats(prev.stats, prev.equipment);
            const baseDmg = totalStats.str * 2;
            const isCrit = Math.random() < (totalStats.dex * 0.01);
            const damage = Math.floor(Math.max(1, isCrit ? baseDmg * 2 : baseDmg));
            
            const enemyStats = calculateEnemyStats(target.name, target.level || 1);
            
            const currentHp = prev.counters[`hp_${target.id}`] ?? enemyStats.maxHp;
            const newHp = currentHp - damage;
            counters[`hp_${target.id}`] = newHp;

            // Enemy Hurt Animation
            animations[target.id] = 'HURT';

            pushLog(`You hit ${target.name} for ${formatNumber(damage)} ${isCrit ? 'CRIT!' : ''}`, 'COMBAT');
            addSkillXp('Strength', damage);
            addSkillXp('Dexterity', 10);

            if (newHp <= 0) {
                pushLog(`You slew ${target.name}!`, 'COMBAT');
                counters['kills_total'] = (counters['kills_total'] || 0) + 1;
                
                stats.xp += enemyStats.xp;
                pushLog(`+${formatNumber(enemyStats.xp)} XP`, 'INFO');

                counters[`kill_${target.name.toLowerCase().replace(' ', '_')}`] = (counters[`kill_${target.name.toLowerCase().replace(' ', '_')}`] || 0) + 1;

                if (stats.hp < (stats.maxHp * 0.1)) flags['win_low_hp'] = true;
                flags[`dead_${target.id}`] = true;

                // --- BESTIARY UNLOCK ---
                const rawName = target.name.replace('Elite ', '');
                if (!bestiary.includes(rawName)) {
                    bestiary.push(rawName);
                    pushLog(`New Bestiary Entry: ${rawName}!`, 'SECRET');
                }

                // Quest Progress Check
                if (activeQuest && !activeQuest.completed && activeQuest.type === 'KILL') {
                    if (target.name.includes(activeQuest.targetId)) {
                        activeQuest.currentCount++;
                        if (activeQuest.currentCount >= activeQuest.targetCount) {
                            activeQuest.completed = true;
                            pushLog(`QUEST OBJECTIVE COMPLETE! Return to giver.`, 'QUEST');
                        } else {
                            pushLog(`Quest Progress: ${activeQuest.currentCount}/${activeQuest.targetCount}`, 'QUEST');
                        }
                    }
                }

                const loot = generateProceduralLoot(target.level || 1, target.name);
                
                if (loot) {
                    // Only use new procedural loot logic
                    inventory = addToInventory(loot, { ...prev, inventory });
                    pushLog(`DROP: ${loot.name}`, 'LOOT');
                } else if (LOOT_TABLE[target.name]) {
                    // Fallback to static loot table if procedural failed but static exists (mostly materials)
                    const item = ITEMS[LOOT_TABLE[target.name]];
                    inventory = addToInventory({ ...item, count: 1 }, { ...prev, inventory });
                    pushLog(`Found ${item.name}`, 'LOOT');
                }
            }
        } else {
            pushLog("You swing at the air.", 'INFO');
        }
      }

      return processEnemyTurn({
          ...prev,
          counters,
          inventory,
          flags,
          stats,
          activeQuest,
          animations, // Pass active animations
          logs: logs.slice(0, 50),
          bestiary,
      });
    });
  };

  const handleCraft = (recipe: Recipe) => {
     setGameState(prev => {
         if (prev.skills[recipe.skill].level < recipe.levelReq) {
             addLog(`Need ${recipe.skill} level ${recipe.levelReq}!`, 'INFO');
             return prev;
         }
         
         // Station Check
         if (recipe.station) {
             const map = MAPS[prev.currentMapId];
             const nearbyStation = map.entities.find(e => 
                 e.subType === recipe.station && 
                 Math.abs(e.pos.x - prev.playerPos.x) + Math.abs(e.pos.y - prev.playerPos.y) <= 2
             );
             if (!nearbyStation) {
                 addLog(`Requires nearby ${recipe.station.replace('_', ' ')}!`, 'INFO');
                 return prev;
             }
         }

         const inv = [...prev.inventory];
         for (const ing of recipe.ingredients) {
             const has = inv.find(i => i.id === ing.itemId);
             if (!has || has.count < ing.count) {
                 addLog(`Missing ingredients for ${recipe.name}.`, 'INFO');
                 return prev;
             }
         }
         for (const ing of recipe.ingredients) {
             const item = inv.find(i => i.id === ing.itemId)!;
             item.count -= ing.count;
         }
         
         // Add crafted item
         const resultBase = ITEMS[recipe.resultItemId];
         // Note: If we want crafted items to scale, we'd need procedural generation here too.
         // For now, keep static recipe results but use the helper.
         const newInv = addToInventory({ ...resultBase, count: recipe.yield }, { ...prev, inventory: inv.filter(i => i.count > 0) });

         addSkillXp(recipe.skill, recipe.xpReward);
         addLog(`Crafted ${resultBase.name}! +${recipe.xpReward} ${recipe.skill} XP`, 'SKILL');

         return { ...prev, inventory: newInv };
     });
  };

  const equipItem = (item: Item) => {
      setGameState(prev => {
          if (!item.slot) return prev;
          const currentEquipped = prev.equipment[item.slot];
          const newInv = prev.inventory.filter(i => i !== item); 
          
          if (currentEquipped) {
              newInv.push(currentEquipped); 
          }

          return {
              ...prev,
              equipment: {
                  ...prev.equipment,
                  [item.slot]: item
              },
              inventory: newInv,
              logs: [{ id: uid(), message: `Equipped ${item.name}`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs]
          };
      });
  };

  const unequipItem = (slot: EquipmentSlot) => {
      setGameState(prev => {
          const item = prev.equipment[slot];
          if (!item) return prev;
          
          return {
              ...prev,
              equipment: {
                  ...prev.equipment,
                  [slot]: null
              },
              inventory: [...prev.inventory, item],
              logs: [{ id: uid(), message: `Unequipped ${item.name}`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs]
          };
      });
  };

  const useItem = (item: Item) => {
    if (item.type === 'EQUIPMENT') {
        equipItem(item);
        return;
    }
    setGameState(prev => {
        if (item.type === 'CONSUMABLE' && item.count > 0 && item.healAmount) {
            const newHp = Math.min(prev.stats.maxHp, prev.stats.hp + item.healAmount);
            const newInv = prev.inventory.map(i => i.id === item.id ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0);
            addLog(`Used ${item.name}. Healed ${item.healAmount} HP.`, 'INFO');
            return {
                ...prev,
                stats: { ...prev.stats, hp: newHp },
                inventory: newInv
            };
        }
        return prev;
    });
  }

  const handleAskRumor = async () => {
    if (isLoadingRumor) return;
    setIsLoadingRumor(true);
    addLog("Consulting the spirits...", 'INFO');
    
    const unlocked = gameState.secrets.filter(s => s.unlocked);
    const locked = gameState.secrets.filter(s => !s.unlocked);
    
    const rumor = await generateRumor(unlocked, locked, gameState.stats);
    addLog(`Sage: "${rumor}"`, 'DIALOGUE');
    setIsLoadingRumor(false);
    setShowModal(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (showModal) { if (e.key === 'Escape') setShowModal(null); return; }
      switch (e.key) {
        case 'ArrowUp': case 'w': handleMove(0, -1); break;
        case 'ArrowDown': case 's': handleMove(0, 1); break;
        case 'ArrowLeft': case 'a': handleMove(-1, 0); break;
        case 'ArrowRight': case 'd': handleMove(1, 0); break;
        case ' ': handleAction('ATTACK'); break;
        case 'e': handleAction('INTERACT'); break;
        case 'q': handleAction('DANCE'); break;
        case 'Shift': handleAction('WAIT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, showModal]);

  useEffect(() => {
    checkSecrets(gameState);
    if (gameState.stats.hp <= 0 && gameState.currentMapId !== 'house_player') {
         setTimeout(handleDeath, 500);
    }
  }, [gameState.counters, gameState.inventory, gameState.playerPos, gameState.currentMapId, gameState.stats.hp]);

  const currentMap = MAPS[gameState.currentMapId] || MAPS['map_10_10'];
  const totalStats = getPlayerTotalStats(gameState.stats, gameState.equipment);
  const explorationGrid = gameState.exploration[gameState.currentMapId];

  return (
    <div className="h-screen w-screen bg-stone-950 text-gray-200 flex flex-col md:flex-row overflow-hidden font-vt323 selection:bg-purple-500 selection:text-white">
      
      {/* --- LEFT PANEL: GAME VIEW --- */}
      <div className="relative flex-1 bg-[#111] flex flex-col h-1/2 md:h-full">
        
        {/* TOP BAR / HUD */}
        <div className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 z-20 shadow-md flex-shrink-0">
             <div className="flex items-center gap-2">
                <Sparkles className="animate-spin-slow text-purple-400" /> 
                <h1 className="text-2xl text-yellow-500 font-bold tracking-widest hidden sm:block">SECRET HUNTERS</h1>
             </div>
             
             <div className="flex gap-3 text-lg font-mono items-center">
                 <div className="flex flex-col items-end leading-none">
                    <span className={`${gameState.stats.hp < 10 ? 'text-red-600 animate-pulse' : 'text-red-400'} font-bold`}>HP {formatNumber(gameState.stats.hp)}/{formatNumber(gameState.stats.maxHp)}</span>
                    <span className="text-xs text-stone-500">HEALTH</span>
                 </div>
                 <div className="w-px h-8 bg-stone-700 mx-1"></div>
                 <div className="flex flex-col items-end leading-none">
                    <span className="text-blue-400 font-bold">LVL {formatNumber(gameState.stats.level)}</span>
                    <span className="text-xs text-stone-500">XP {formatNumber(gameState.stats.xp)}</span>
                 </div>
                 <div className="hidden sm:flex gap-3 ml-4 text-stone-400 text-base">
                     <span title="Strength">STR {formatNumber(totalStats.str)}</span>
                     <span title="Dexterity">DEX {formatNumber(totalStats.dex)}</span>
                     <span title="Intelligence">INT {formatNumber(totalStats.int)}</span>
                     <span title="Regeneration" className="text-green-400">REG {formatNumber(totalStats.regeneration)}</span>
                 </div>
             </div>
        </div>

        {/* ACTIVE QUEST HUD */}
        {gameState.activeQuest && (
            <div className="absolute top-20 right-4 z-40 bg-stone-900/90 border border-stone-700 p-3 rounded max-w-[200px] shadow-lg pointer-events-none md:pointer-events-auto">
                <div className="text-yellow-500 font-bold text-sm flex items-center gap-1 mb-1">
                    <Scroll size={14} /> {gameState.activeQuest.title}
                </div>
                <div className="text-xs text-stone-300 mb-1 leading-tight">{gameState.activeQuest.description}</div>
                <div className="text-xs text-stone-400">
                    {gameState.activeQuest.completed 
                        ? <span className="text-green-400 font-bold">RETURN TO GIVER</span> 
                        : `Progress: ${gameState.activeQuest.currentCount}/${gameState.activeQuest.targetCount}`
                    }
                </div>
            </div>
        )}

        {/* GAME GRID CONTAINER */}
        <div ref={gameContainerRef} className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-[#111] relative">
            <div 
            className="relative bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-stone-800 rounded-lg overflow-hidden transition-all duration-300 origin-center"
            style={{ 
                width: `${currentMap.width * 2}rem`, 
                height: `${currentMap.height * 2}rem`,
                transform: `scale(${scale})`,
                boxShadow: '0 0 0 4px #292524, 0 10px 20px rgba(0,0,0,0.5)'
            }}
            >
            {/* Map Layer */}
            {currentMap.tiles.map((row, y) => (
                <div key={y} className="flex">
                {row.map((tileType, x) => (
                    <Tile key={`${x}-${y}`} type={tileType} x={x} y={y} />
                ))}
                </div>
            ))}

            {/* Fog of War Layer */}
            {explorationGrid && explorationGrid.map((row, y) => (
                <div key={`fog-${y}`} className="flex absolute top-0 left-0 w-full" style={{ top: `${y * 2}rem` }}>
                    {row.map((val, x) => (
                        val === 0 ? <div key={`fog-${x}-${y}`} className="w-8 h-8 bg-black z-10" /> : <div key={`fog-${x}-${y}`} className="w-8 h-8 pointer-events-none" />
                    ))}
                </div>
            ))}

            {/* Entities Layer */}
            <EntityComponent 
                entity={{ 
                    id: 'player', 
                    name: 'Hero', 
                    type: 'PLAYER', 
                    symbol: '@', 
                    color: 'blue', 
                    pos: gameState.playerPos,
                    facing: gameState.playerFacing
                }} 
                isPlayer 
                animation={gameState.animations['player']} // Pass animation prop
            />
            
            {currentMap.entities.map(ent => {
                if (gameState.flags[`dead_${ent.id}`] || gameState.flags[`looted_${ent.id}`]) return null;
                // Only render entity if tile is explored
                if (explorationGrid && explorationGrid[ent.pos.y] && explorationGrid[ent.pos.y][ent.pos.x] === 0) return null;

                const hp = gameState.counters[`hp_${ent.id}`];
                const entWithState = hp !== undefined ? { ...ent, hp } : ent;
                
                if (hp === undefined && ent.type === 'ENEMY') {
                     const estStats = calculateEnemyStats(ent.name, ent.level || 1);
                     entWithState.hp = estStats.hp;
                     entWithState.maxHp = estStats.maxHp;
                }
                const isActiveWaypoint = ent.subType === 'WAYPOINT' && gameState.knownWaypoints.includes(currentMap.id);
                return <EntityComponent key={ent.id} entity={entWithState} isActiveWaypoint={isActiveWaypoint} animation={gameState.animations[ent.id]} />;
            })}
            
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] z-50 opacity-20" />
            
            {gameState.logs[0]?.type === 'COMBAT' && gameState.logs[0].message.includes('hits for') && (
                <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none z-40" />
            )}

            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1 rounded text-stone-300 pointer-events-none animate-pulse z-50">
                {currentMap.name} ({gameState.playerPos.x}, {gameState.playerPos.y}) - Zone Diff: {currentMap.difficulty || 1}
            </div>
            
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex gap-4 text-stone-500 text-sm font-mono bg-black/50 p-2 rounded backdrop-blur-sm pointer-events-none z-50">
                <span className="flex items-center gap-1"><span className="px-2 bg-stone-800 rounded text-stone-300">WASD</span> Move</span>
                <span className="flex items-center gap-1"><span className="px-2 bg-stone-800 rounded text-stone-300">SPACE</span> Attack</span>
                <span className="flex items-center gap-1"><span className="px-2 bg-stone-800 rounded text-stone-300">E</span> Interact</span>
            </div>
        </div>

        {/* Mobile Controls Overlay */}
        <div className="md:hidden absolute bottom-4 right-4 grid grid-cols-3 gap-2 w-48 opacity-80 z-30">
             <div />
             <button onClick={() => handleMove(0, -1)} className="p-3 bg-stone-800 rounded border border-stone-600 active:bg-stone-700 shadow flex items-center justify-center">▲</button>
             <div />
             <button onClick={() => handleMove(-1, 0)} className="p-3 bg-stone-800 rounded border border-stone-600 active:bg-stone-700 shadow flex items-center justify-center">◀</button>
             <button onClick={() => handleAction('INTERACT')} className="p-3 bg-amber-800 rounded border border-amber-600 active:bg-amber-700 shadow flex items-center justify-center"><Hand size={16}/></button>
             <button onClick={() => handleMove(1, 0)} className="p-3 bg-stone-800 rounded border border-stone-600 active:bg-stone-700 shadow flex items-center justify-center">▶</button>
             <button onClick={() => handleAction('ATTACK')} className="p-3 bg-red-800 rounded border border-red-600 active:bg-red-700 shadow flex items-center justify-center"><Sword size={16}/></button>
             <button onClick={() => handleMove(0, 1)} className="p-3 bg-stone-800 rounded border border-stone-600 active:bg-stone-700 shadow flex items-center justify-center">▼</button>
             <button onClick={() => handleAction('DANCE')} className="p-3 bg-purple-800 rounded border border-purple-600 active:bg-purple-700 shadow flex items-center justify-center"><Sparkles size={16}/></button>
        </div>
      </div>

      {/* --- RIGHT PANEL: UI / HUD --- */}
      <div className="w-full md:w-[400px] bg-stone-900 border-t-4 md:border-t-0 md:border-l-4 border-stone-800 flex flex-col h-1/2 md:h-full z-10 shadow-2xl">
        
        {/* Tabs */}
        <div className="flex border-b-4 border-stone-800 bg-stone-950">
          <button onClick={() => setActiveTab('LOG')} className={`flex-1 p-3 flex justify-center transition-colors ${activeTab === 'LOG' ? 'bg-stone-800 text-yellow-500' : 'text-stone-600 hover:text-stone-400'}`}><Terminal size={20} /></button>
          <button onClick={() => setActiveTab('EQUIP')} className={`flex-1 p-3 flex justify-center transition-colors ${activeTab === 'EQUIP' ? 'bg-stone-800 text-yellow-500' : 'text-stone-600 hover:text-stone-400'}`}><Shield size={20} /></button>
          <button onClick={() => setActiveTab('INV')} className={`flex-1 p-3 flex justify-center transition-colors ${activeTab === 'INV' ? 'bg-stone-800 text-yellow-500' : 'text-stone-600 hover:text-stone-400'}`}><Backpack size={20} /></button>
          <button onClick={() => setActiveTab('MAP')} className={`flex-1 p-3 flex justify-center transition-colors ${activeTab === 'MAP' ? 'bg-stone-800 text-yellow-500' : 'text-stone-600 hover:text-stone-400'}`}><MapIcon size={20} /></button>
          <button onClick={() => setActiveTab('SKILLS')} className={`flex-1 p-3 flex justify-center transition-colors ${activeTab === 'SKILLS' ? 'bg-stone-800 text-yellow-500' : 'text-stone-600 hover:text-stone-400'}`}><Trophy size={20} /></button>
          <button onClick={() => setActiveTab('BESTIARY')} className={`flex-1 p-3 flex justify-center transition-colors ${activeTab === 'BESTIARY' ? 'bg-stone-800 text-yellow-500' : 'text-stone-600 hover:text-stone-400'}`}><BookOpen size={20} /></button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm relative bg-[#1a1a1a]">
          
          {activeTab === 'LOG' && (
            <div className="flex flex-col gap-2 font-vt323 text-lg">
              {gameState.logs.map(log => (
                <div key={log.id} className={`
                  p-2 rounded border-l-2
                  ${log.type === 'COMBAT' ? 'border-red-500 bg-red-900/10 text-red-300' : ''}
                  ${log.type === 'SECRET' ? 'border-yellow-500 bg-yellow-900/20 text-yellow-300' : ''}
                  ${log.type === 'SKILL' ? 'border-green-500 bg-green-900/20 text-green-300' : ''}
                  ${log.type === 'LOOT' ? 'border-orange-500 bg-orange-900/20 text-orange-300' : ''}
                  ${log.type === 'DIALOGUE' ? 'border-cyan-500 bg-cyan-900/10 text-cyan-300' : ''}
                  ${log.type === 'QUEST' ? 'border-purple-500 bg-purple-900/20 text-purple-300' : ''}
                  ${log.type === 'INFO' ? 'border-stone-600 text-stone-400' : ''}
                `}>
                  <span className="opacity-40 text-xs mr-2 block mb-1">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                  {log.message}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'EQUIP' && (
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      {EQUIPMENT_SLOTS.map(slot => (
                          <div key={slot} className="bg-stone-800 p-3 rounded border border-stone-700 min-h-[100px] relative group">
                              <span className="text-[10px] uppercase text-stone-500 absolute top-1 right-2">{slot}</span>
                              {gameState.equipment[slot] ? (
                                  <div className="cursor-pointer" onClick={() => unequipItem(slot)}>
                                      <div className={`font-bold text-sm mb-1 ${
                                          gameState.equipment[slot]!.rarity === 'LEGENDARY' ? 'text-orange-400' :
                                          gameState.equipment[slot]!.rarity === 'EPIC' ? 'text-purple-400' :
                                          gameState.equipment[slot]!.rarity === 'RARE' ? 'text-blue-400' :
                                          'text-stone-300'
                                      }`}>
                                          {gameState.equipment[slot]!.name}
                                      </div>
                                      <div className="text-xs text-stone-400">
                                          {Object.entries(gameState.equipment[slot]!.stats || {}).map(([key, val]) => (
                                              <div key={key}>+{formatNumber(val as number)} {key.toUpperCase()}</div>
                                          ))}
                                      </div>
                                      <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          Unequip
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex items-center justify-center h-full text-stone-600 italic">Empty</div>
                              )}
                          </div>
                      ))}
                  </div>
                  
                  <div className="bg-stone-900 p-4 rounded border border-stone-700">
                      <h3 className="text-stone-500 uppercase text-xs mb-2">Total Stats</h3>
                      <div className="grid grid-cols-2 gap-2 text-stone-300">
                           <div>STR: <span className="text-white">{formatNumber(totalStats.str)}</span></div>
                           <div>DEX: <span className="text-white">{formatNumber(totalStats.dex)}</span></div>
                           <div>INT: <span className="text-white">{formatNumber(totalStats.int)}</span></div>
                           <div>HP: <span className="text-white">{formatNumber(totalStats.maxHp)}</span></div>
                           <div>REG: <span className="text-green-400">{formatNumber(totalStats.regeneration)}</span></div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'INV' && (
            <div>
              <h3 className="text-stone-500 mb-4 uppercase tracking-widest text-xs border-b border-stone-800 pb-1">Backpack</h3>
              <div className="grid gap-3 mb-8">
                 {gameState.inventory.length === 0 && <p className="text-stone-700 italic text-center py-8">Your pockets are empty.</p>}
                 {gameState.inventory.map((item, idx) => (
                   <div key={idx} className="bg-stone-800 p-3 rounded border border-stone-700 flex justify-between items-center shadow-sm group">
                      <div>
                        <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                                item.rarity === 'LEGENDARY' ? 'text-orange-400' :
                                item.rarity === 'EPIC' ? 'text-purple-400' :
                                item.rarity === 'RARE' ? 'text-blue-400' :
                                'text-stone-200'
                            }`}>{item.name}</span>
                            <span className="bg-stone-900 text-stone-500 px-1.5 py-0.5 rounded text-xs">x{item.count}</span>
                        </div>
                        <p className="text-stone-500 text-xs mt-1">{item.description}</p>
                        {item.stats && (
                             <div className="text-[10px] text-stone-400 mt-1">
                                {Object.entries(item.stats).map(([k,v]) => `+${formatNumber(v as number)} ${k.toUpperCase()} `)}
                             </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {item.type === 'CONSUMABLE' && (
                            <button onClick={() => useItem(item)} className="px-3 py-1 bg-green-900 text-green-200 text-xs rounded border border-green-700 hover:bg-green-800">Use</button>
                        )}
                        {item.type === 'EQUIPMENT' && (
                            <button onClick={() => equipItem(item)} className="px-3 py-1 bg-blue-900 text-blue-200 text-xs rounded border border-blue-700 hover:bg-blue-800">Equip</button>
                        )}
                      </div>
                   </div>
                 ))}
              </div>
              
              <h3 className="text-stone-500 mb-4 uppercase tracking-widest text-xs border-b border-stone-800 pb-1">Crafting</h3>
              <div className="space-y-3">
                 {RECIPES.map(recipe => {
                     const canCraft = 
                        gameState.skills[recipe.skill].level >= recipe.levelReq &&
                        recipe.ingredients.every(ing => (gameState.inventory.find(i => i.id === ing.itemId)?.count || 0) >= ing.count);
                     
                     return (
                         <button 
                           key={recipe.id}
                           onClick={() => handleCraft(recipe)}
                           disabled={!canCraft}
                           className={`w-full p-3 rounded border flex flex-col gap-1 transition-all ${
                               canCraft 
                               ? 'bg-stone-800 border-stone-600 hover:bg-stone-700 text-stone-200' 
                               : 'bg-stone-900 border-stone-800 text-stone-600 opacity-60 cursor-not-allowed'
                           }`}
                         >
                            <div className="flex justify-between w-full">
                                <span className="font-bold flex items-center gap-2">
                                    <Hammer size={14} /> {recipe.name}
                                </span>
                                <span className="text-xs flex gap-2">
                                    {recipe.station && <span className="text-yellow-500 bg-yellow-900/30 px-1 rounded">@{recipe.station.replace('_', ' ')}</span>}
                                    <span>{recipe.skill} Lv.{recipe.levelReq}</span>
                                </span>
                            </div>
                            <div className="text-xs text-left w-full mt-1">
                                {recipe.ingredients.map((ing, i) => {
                                    const has = gameState.inventory.find(inv => inv.id === ing.itemId)?.count || 0;
                                    const name = ITEMS[ing.itemId]?.name || ing.itemId;
                                    return <span key={i} className={has >= ing.count ? 'text-green-500' : 'text-red-500'}>{name} x{ing.count}{i < recipe.ingredients.length - 1 ? ', ' : ''}</span>
                                })}
                            </div>
                         </button>
                     )
                 })}
              </div>
            </div>
          )}

          {activeTab === 'MAP' && (
              <div className="flex flex-col items-center justify-center p-4">
                  <h3 className="text-stone-500 mb-4 uppercase tracking-widest text-xs border-b border-stone-800 pb-1 w-full">World Map</h3>
                  <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px] bg-stone-900 p-2 rounded border border-stone-700">
                      {Array.from({ length: 20 }, (_, y) => 
                          Array.from({ length: 20 }, (_, x) => {
                              const mId = `map_${x}_${y}`;
                              const visited = !!gameState.exploration[mId];
                              const known = gameState.knownLocations.includes(mId);
                              const isCurrent = gameState.currentMapId === mId;
                              const hasWaypoint = gameState.knownWaypoints.includes(mId);
                              const mapData = MAPS[mId];
                              
                              let bgClass = 'bg-stone-800';
                              if (visited || known) {
                                  if (mapData.biome === 'TOWN') bgClass = 'bg-cyan-900';
                                  else if (mapData.biome === 'LABYRINTH') bgClass = 'bg-purple-900';
                                  else if (mapData.biome === 'VOLCANO') bgClass = 'bg-red-900';
                                  else if (mapData.biome === 'TUNDRA') bgClass = 'bg-slate-300';
                                  else if (mapData.biome === 'DESERT') bgClass = 'bg-yellow-700';
                                  else bgClass = 'bg-green-900';
                              }

                              return (
                                  <div 
                                    key={mId} 
                                    className={`w-3 h-3 md:w-4 md:h-4 rounded-[1px] relative ${bgClass} ${isCurrent ? 'border border-white animate-pulse' : ''}`}
                                    title={visited || known ? mapData.name : 'Unknown'}
                                  >
                                      {hasWaypoint && <div className="absolute inset-0 bg-white/30 rounded-full scale-50" />}
                                      {!visited && !known && <div className="w-full h-full bg-black/80" />}
                                  </div>
                              );
                          })
                      )}
                  </div>
                  <div className="mt-4 text-xs text-stone-500 text-center">
                      <div className="flex gap-4 justify-center mb-2">
                          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-white rounded-full"></div> You</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-900 rounded-[1px]"></div> Town</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-900 rounded-[1px]"></div> Labyrinth</span>
                      </div>
                      Explore to reveal the map. Look for signs.
                  </div>
              </div>
          )}

          {activeTab === 'SKILLS' && (
             <div className="space-y-4">
                 <h3 className="text-stone-500 mb-4 uppercase tracking-widest text-xs border-b border-stone-800 pb-1">Skills & Stats</h3>
                 <div className="grid grid-cols-2 gap-4">
                    {Object.values(gameState.skills).map((skill: Skill) => {
                        const nextXp = Math.floor(50 * Math.pow(skill.level, 2.5));
                        const prevXp = Math.floor(50 * Math.pow(skill.level - 1, 2.5));
                        const progress = Math.min(100, Math.max(0, ((skill.xp - prevXp) / (nextXp - prevXp)) * 100));
                        
                        return (
                            <div key={skill.name} className="bg-stone-800 p-2 rounded border border-stone-700">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="font-bold text-stone-300">{skill.name}</span>
                                    <span className="text-yellow-500 text-xl font-vt323">{skill.level}</span>
                                </div>
                                <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="text-[10px] text-stone-500 mt-1 text-right">{formatNumber(skill.xp)} / {formatNumber(nextXp)} XP</div>
                            </div>
                        )
                    })}
                 </div>
             </div>
          )}

          {activeTab === 'SECRETS' && (
             <div>
               <h3 className="text-stone-500 mb-4 uppercase tracking-widest text-xs border-b border-stone-800 pb-1">Discoveries</h3>
               <div className="space-y-3">
                 {gameState.secrets.map(secret => (
                   <div key={secret.id} className={`p-4 rounded border-2 transition-all ${secret.unlocked ? 'border-yellow-700 bg-yellow-900/10' : 'border-stone-800 bg-stone-900/30'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-bold text-lg ${secret.unlocked ? 'text-yellow-400' : 'text-stone-600'}`}>
                           {secret.unlocked ? secret.title : '???'}
                        </span>
                        {secret.unlocked ? 
                           <span className="text-[10px] bg-yellow-600 text-black px-1 py-0.5 rounded font-bold">FOUND</span> :
                           <span className="text-[10px] bg-stone-800 text-stone-600 px-1 py-0.5 rounded">LOCKED</span>
                        }
                      </div>
                      <p className="text-sm text-stone-400 font-vt323 leading-tight">
                        {secret.unlocked ? secret.description : (secret.hint || 'No hint available.')}
                      </p>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'BESTIARY' && (
              <div>
                  <h3 className="text-stone-500 mb-4 uppercase tracking-widest text-xs border-b border-stone-800 pb-1 flex justify-between">
                      <span>Monster Log</span>
                      <span>{gameState.bestiary.length}/{Object.keys(ENEMY_INFO).length}</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.keys(ENEMY_INFO).map(enemyName => {
                          const unlocked = gameState.bestiary.includes(enemyName);
                          const info = ENEMY_INFO[enemyName];
                          const asset = ASSETS[info.assetKey];
                          
                          return (
                              <div key={enemyName} className={`bg-stone-800 p-3 rounded border flex flex-col items-center text-center transition-all ${unlocked ? 'border-stone-600' : 'border-stone-800 opacity-60'}`}>
                                  <div className="w-12 h-12 bg-black/50 rounded flex items-center justify-center mb-2 overflow-hidden border border-stone-700">
                                      {unlocked ? (
                                          <img src={asset} className="w-8 h-8 object-contain" style={{imageRendering:'pixelated'}} alt={enemyName} />
                                      ) : (
                                          <span className="text-2xl text-stone-700">?</span>
                                      )}
                                  </div>
                                  {unlocked ? (
                                      <>
                                          <div className="font-bold text-red-400 text-sm mb-1">{enemyName}</div>
                                          <div className="text-[10px] text-stone-400 leading-tight mb-2 h-8 overflow-hidden">{info.description}</div>
                                          <div className="w-full border-t border-stone-700 pt-1 mt-auto">
                                              <div className="text-[10px] text-stone-500 uppercase">Drops</div>
                                              <div className="text-[10px] text-yellow-600 font-mono">
                                                  {LOOT_TABLE[enemyName] ? ITEMS[LOOT_TABLE[enemyName]]?.name || '???' : 'Equipment'}
                                              </div>
                                          </div>
                                      </>
                                  ) : (
                                      <div className="text-sm text-stone-600 mt-2">Unknown</div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showModal === 'NPC_TALK' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-stone-900 border-4 border-stone-700 p-8 rounded-xl max-w-lg w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6 border-b border-stone-800 pb-4">
                  <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center border-2 border-red-700 overflow-hidden">
                       <img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='4' y='6' width='8' height='9' fill='%23b91c1c'/%3E%3Crect x='5' y='1' width='6' height='5' fill='%23fca5a5'/%3E%3Crect x='5' y='5' width='6' height='3' fill='%23e5e5e5'/%3E%3Crect x='6' y='8' width='4' height='2' fill='%23e5e5e5'/%3E%3C/svg%3E" className="w-full h-full object-cover scale-150 translate-y-2" style={{imageRendering:'pixelated'}} />
                  </div>
                  <div>
                    <h2 className="text-2xl text-yellow-500 font-bold font-vt323">Elder Sage</h2>
                    <p className="text-stone-500 text-sm">Keeper of Secrets</p>
                  </div>
              </div>
              
              <p className="text-stone-300 text-xl mb-8 font-vt323 leading-relaxed">"The world has expanded! Seek the ice to the north and the fires to the east!"</p>
              
              <div className="space-y-3 font-mono">
                 <button 
                   onClick={handleAskRumor} 
                   disabled={isLoadingRumor}
                   className="w-full p-4 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800 text-purple-200 rounded text-left transition-all flex justify-between items-center group"
                 >
                   <span>{isLoadingRumor ? 'Listening to the spirits...' : 'Tell me a rumor...'}</span>
                   {!isLoadingRumor && <span className="text-purple-500 group-hover:translate-x-1 transition-transform">→</span>}
                 </button>
                 <button onClick={() => setShowModal(null)} className="w-full p-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-400 hover:text-stone-200 rounded text-left transition-colors">
                   I must go.
                 </button>
              </div>
           </div>
        </div>
      )}

      {showModal === 'FAST_TRAVEL' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-stone-900 border-4 border-stone-700 p-6 rounded-xl max-w-md w-full shadow-2xl">
                  <h2 className="text-2xl text-cyan-400 font-bold font-vt323 mb-4 flex items-center gap-2"><Navigation /> Fast Travel</h2>
                  <div className="space-y-2">
                      {gameState.knownWaypoints.map(mid => {
                          const map = MAPS[mid];
                          return (
                              <button 
                                key={mid} 
                                onClick={() => handleTeleport(mid)}
                                className="w-full p-3 bg-stone-800 hover:bg-cyan-900/30 border border-stone-600 hover:border-cyan-500 text-left rounded transition-colors flex justify-between group"
                              >
                                  <span className="group-hover:text-cyan-300">{map.name}</span>
                                  {mid === gameState.currentMapId && <span className="text-xs text-stone-500">Current</span>}
                              </button>
                          )
                      })}
                  </div>
                  <button onClick={() => setShowModal(null)} className="w-full mt-6 p-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded">Cancel</button>
              </div>
          </div>
      )}

    </div>
  );
}
