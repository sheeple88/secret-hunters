
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, SkillName, Item, Stats, AnimationType, LogEntry, Recipe, EquipmentSlot } from './types';
import { MAPS, INITIAL_STATS, INITIAL_SKILLS, ITEMS, LOOT_TABLE, EQUIPMENT_TYPES, LOOT_TIERS, STAT_SUFFIXES, SECRETS_DATA, RECIPES } from './constants';
import { Tile } from './components/Tile';
import { EntityComponent } from './components/EntityComponent';
import { 
  Hammer, X, Pickaxe, FlaskConical, Scroll, 
  Backpack, BookOpen, Skull, Sword, Shield, Heart, Zap, 
  Footprints, Ghost, Hand
} from 'lucide-react';

// --- Helper Functions ---
const uid = () => Math.random().toString(36).substr(2, 9);
const getTimestamp = () => Date.now();
const formatNumber = (n: number) => Math.floor(n).toLocaleString();

const getPlayerTotalStats = (base: Stats, equipment: Record<string, Item | null>): Stats => {
  const total = { ...base };
  Object.values(equipment).forEach(item => {
    if (item && item.stats) {
      Object.entries(item.stats).forEach(([key, val]) => {
        // @ts-ignore
        if (typeof val === 'number') total[key as keyof Stats] = (total[key as keyof Stats] || 0) + val;
      });
    }
  });
  return total;
};

const calculateEnemyStats = (name: string, level: number) => {
  const baseHp = 10;
  const hp = Math.floor(baseHp * Math.pow(1.15, level));
  const xp = Math.floor(10 * Math.pow(1.1, level));
  return { maxHp: hp, xp };
};

const addToInventory = (item: Item, state: GameState): Item[] => {
  // Always stack materials/consumables, maybe stack others if identical? keeping it simple for now
  if (['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY'].includes(item.type)) {
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
    
    if (inv[idx].count > count) {
        inv[idx] = { ...inv[idx], count: inv[idx].count - count };
    } else {
        inv.splice(idx, 1);
    }
    return inv;
};

const generateProceduralLoot = (level: number, sourceName: string): Item | null => {
  if (Math.random() > 0.3) return null;
  
  const tier = LOOT_TIERS.slice().reverse().find(t => level >= t.minLvl) || LOOT_TIERS[0];
  const slots = Object.keys(EQUIPMENT_TYPES);
  const slot = slots[Math.floor(Math.random() * slots.length)] as keyof typeof EQUIPMENT_TYPES;
  const typeData = EQUIPMENT_TYPES[slot];
  const baseName = typeData.names[Math.floor(Math.random() * typeData.names.length)];
  
  const rarityRoll = Math.random();
  let rarity = 'COMMON';
  if (rarityRoll > 0.95) rarity = 'LEGENDARY';
  else if (rarityRoll > 0.85) rarity = 'EPIC';
  else if (rarityRoll > 0.70) rarity = 'RARE';
  else if (rarityRoll > 0.50) rarity = 'UNCOMMON';

  const stats: Partial<Stats> = {};
  const numStats = rarity === 'COMMON' ? 1 : rarity === 'UNCOMMON' ? 2 : rarity === 'RARE' ? 3 : 4;
  
  for(let i=0; i<numStats; i++) {
      const statKey = typeData.statBias[Math.floor(Math.random() * typeData.statBias.length)];
      // @ts-ignore
      stats[statKey] = (stats[statKey] || 0) + Math.floor(tier.mult * (Math.random() * 5 + 1));
  }

  const suffix = STAT_SUFFIXES[Math.floor(Math.random() * STAT_SUFFIXES.length)];
  const fullName = `${tier.name} ${baseName} ${suffix.name}`;

  return {
      id: uid(),
      name: fullName,
      type: 'EQUIPMENT',
      slot: slot as any,
      description: `A ${rarity.toLowerCase()} item.`,
      count: 1,
      stats,
      rarity: rarity as any,
      value: Math.floor(level * 10 * tier.mult)
  };
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
    bestiary: [],
    counters: {},
    logs: [{ id: 'init', message: 'Welcome to Secret Hunters!', type: 'INFO', timestamp: Date.now() }],
    flags: {},
    lastAction: null,
    isCombat: false,
    combatTargetId: null,
    activeQuest: null,
    exploration: {},
    knownWaypoints: [],
    knownLocations: [],
    animations: {}
  });

  // Unified Modal State
  const [activeModal, setActiveModal] = useState<'INVENTORY' | 'SKILLS' | 'QUESTS' | 'DEATH' | 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE' | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'INFO') => {
    setGameState(prev => ({
      ...prev,
      logs: [{ id: uid(), message, type, timestamp: getTimestamp() }, ...prev.logs].slice(0, 100)
    }));
  }, []);

  const revealArea = useCallback((mapId: string, x: number, y: number) => {
      setGameState(prev => {
          const mapExplored = prev.exploration[mapId] || 
            (MAPS[mapId] ? Array(MAPS[mapId].height).fill(null).map(() => Array(MAPS[mapId].width).fill(0)) : []);
          
          if (mapExplored.length === 0) return prev;

          const newExplored = mapExplored.map(row => [...row]);
          let changed = false;

          for(let dy = -2; dy <= 2; dy++) {
              for(let dx = -2; dx <= 2; dx++) {
                  const ty = y + dy;
                  const tx = x + dx;
                  if (ty >= 0 && ty < newExplored.length && tx >= 0 && tx < newExplored[0].length) {
                      if (newExplored[ty][tx] === 0) {
                          newExplored[ty][tx] = 1;
                          changed = true;
                      }
                  }
              }
          }

          if (!changed) return prev;
          return {
              ...prev,
              exploration: { ...prev.exploration, [mapId]: newExplored }
          };
      });
  }, []);

  const addSkillXp = useCallback((skillName: SkillName, amt: number) => {
     setGameState(prev => {
         const skill = prev.skills[skillName];
         const newXp = skill.xp + amt;
         const req = Math.floor(50 * Math.pow(skill.level, 2.5));
         let newLevel = skill.level;
         let leveled = false;
         
         if (newXp >= req) {
             newLevel++;
             leveled = true;
         }
         
         const newStats = { ...prev.stats };
         let logs = prev.logs;
         if (leveled) {
             logs = [{ id: uid(), message: `LEVEL UP! ${skillName} -> ${newLevel}`, type: 'SKILL', timestamp: getTimestamp() }, ...logs];
             if (skillName === 'Strength') newStats.str = Math.floor(newStats.str * 1.1 + 5);
             if (skillName === 'Dexterity') newStats.dex = Math.floor(newStats.dex * 1.1 + 5);
             if (skillName === 'Agility') newStats.int = Math.floor(newStats.int * 1.1 + 5);
         }

         return {
             ...prev,
             stats: newStats,
             logs,
             skills: {
                 ...prev.skills,
                 [skillName]: { ...skill, xp: newXp, level: newLevel }
             }
         }
     });
  }, []);

  const handleRespawn = useCallback(() => {
    setGameState(prev => ({
        ...prev,
        stats: { ...prev.stats, hp: prev.stats.maxHp },
        playerPos: { x: 10, y: 7 },
        currentMapId: 'map_10_10',
        logs: [{ id: uid(), message: 'You have been revived at the village.', type: 'COMBAT', timestamp: getTimestamp() }, ...prev.logs],
        animations: {}
    }));
    setActiveModal(null);
  }, []);

  const handleUseItem = (item: Item) => {
      if (item.type === 'CONSUMABLE' && item.healAmount) {
          setGameState(prev => {
              const healedHp = Math.min(prev.stats.maxHp, prev.stats.hp + (item.healAmount || 0));
              const newInv = removeFromInventory(item.id, 1, prev);
              return {
                  ...prev,
                  stats: { ...prev.stats, hp: healedHp },
                  inventory: newInv,
                  logs: [{ id: uid(), message: `Used ${item.name}. Healed ${item.healAmount}.`, type: 'INFO', timestamp: getTimestamp() }, ...prev.logs],
                  animations: { ...prev.animations, player: 'HEAL' }
              };
          });
      } else if (item.type === 'EQUIPMENT' && item.slot) {
          setGameState(prev => {
              const currentEquip = prev.equipment[item.slot!];
              const newInv = removeFromInventory(item.id, 1, prev);
              
              // Return old item to inventory
              if (currentEquip) {
                  newInv.push(currentEquip);
              }

              return {
                  ...prev,
                  equipment: { ...prev.equipment, [item.slot!]: item },
                  inventory: newInv,
                  logs: [{ id: uid(), message: `Equipped ${item.name}.`, type: 'INFO', timestamp: getTimestamp() }, ...prev.logs]
              };
          });
      }
  };

  const handleUnequip = (slot: EquipmentSlot) => {
      setGameState(prev => {
          const item = prev.equipment[slot];
          if (!item) return prev;
          
          return {
              ...prev,
              equipment: { ...prev.equipment, [slot]: null },
              inventory: addToInventory(item, prev),
              logs: [{ id: uid(), message: `Unequipped ${item.name}.`, type: 'INFO', timestamp: getTimestamp() }, ...prev.logs]
          };
      });
  };

  const processEnemyTurn = (state: GameState): GameState => {
      const map = MAPS[state.currentMapId];
      if (!map) return state;

      const enemies = map.entities.filter(e => e.type === 'ENEMY' && !state.flags[`dead_${e.id}`]);
      let newState = { ...state };
      let logs = [...newState.logs];
      let animations = { ...newState.animations, player: undefined as AnimationType | undefined };
      Object.keys(animations).forEach(k => { if (k !== 'player') delete animations[k]; });

      let playerHp = newState.stats.hp;
      const playerPos = newState.playerPos;
      
      enemies.forEach(enemy => {
          const dist = Math.abs(enemy.pos.x - playerPos.x) + Math.abs(enemy.pos.y - playerPos.y);
          if (dist <= 1) {
              const enemyStats = calculateEnemyStats(enemy.name, enemy.level || 1);
              const dmg = Math.max(1, Math.floor(enemyStats.maxHp * 0.1) - Math.floor(newState.stats.dex / 4));
              
              if (Math.random() < (newState.stats.dex * 0.005)) {
                  logs.unshift({ id: uid(), message: `You dodged ${enemy.name}'s attack!`, type: 'COMBAT', timestamp: getTimestamp() });
                  animations['player'] = 'DODGE';
              } else {
                  playerHp -= dmg;
                  logs.unshift({ id: uid(), message: `${enemy.name} hits you for ${dmg} damage!`, type: 'COMBAT', timestamp: getTimestamp() });
                  animations['player'] = 'HURT';
                  animations[enemy.id] = 'ATTACK';
              }
          }
      });
      
      if (playerHp <= 0) {
          // Trigger death state immediately
          setTimeout(() => setActiveModal('DEATH'), 100);
          playerHp = 0;
      }

      return {
          ...newState,
          stats: { ...newState.stats, hp: playerHp },
          logs: logs.slice(0, 50),
          animations
      };
  };

  const handleCraft = (recipe: Recipe) => {
    setGameState(prev => {
        // Validation (Double check)
        if (prev.skills[recipe.skill].level < recipe.levelReq) return prev;
        
        const inv = [...prev.inventory];
        // Consume Ingredients
        for(const ing of recipe.ingredients) {
            const itemIndex = inv.findIndex(i => i.id === ing.itemId);
            if (itemIndex === -1 || inv[itemIndex].count < ing.count) return prev; // Should not happen if button disabled
            
            if (inv[itemIndex].count === ing.count) {
                inv.splice(itemIndex, 1);
            } else {
                inv[itemIndex] = { ...inv[itemIndex], count: inv[itemIndex].count - ing.count };
            }
        }

        // Create Result
        const resultItem = ITEMS[recipe.resultItemId];
        const newInv = addToInventory({ ...resultItem, count: recipe.yield }, { ...prev, inventory: inv });

        // Logs
        const logs = [{ id: uid(), message: `Crafted ${resultItem.name} x${recipe.yield}`, type: 'INFO' as const, timestamp: getTimestamp() }, ...prev.logs];

        return {
            ...prev,
            inventory: newInv,
            logs
        };
    });
    // Add XP outside to trigger level up logic correctly
    addSkillXp(recipe.skill, recipe.xpReward);
  };

  const handleMove = useCallback((dx: number, dy: number) => {
    if (activeModal) return; // Cannot move while UI is open

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
      if (dy > 0) newFacing = 'DOWN';
      if (dy < 0) newFacing = 'UP';

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
            const enemy = targetEntity;
            
            const totalStats = getPlayerTotalStats(prev.stats, prev.equipment);
            const baseDmg = totalStats.str * 2;
            const isCrit = Math.random() < (totalStats.dex * 0.01);
            const damage = Math.floor(Math.max(1, isCrit ? baseDmg * 2 : baseDmg));

            const enemyStats = calculateEnemyStats(enemy.name, enemy.level || 1);
            const currentHp = prev.counters[`hp_${enemy.id}`] ?? enemyStats.maxHp;
            const newEnemyHp = currentHp - damage;

            let newCounters = { ...prev.counters, [`hp_${enemy.id}`]: newEnemyHp };
            let newLogs = [{ id: uid(), message: `You hit ${enemy.name} for ${formatNumber(damage)} ${isCrit ? 'CRIT!' : ''}`, type: 'COMBAT' as const, timestamp: getTimestamp() }, ...prev.logs];
            let newAnimations = { ...prev.animations, player: 'ATTACK' as AnimationType, [enemy.id]: 'HURT' as AnimationType };
            let newStats = { ...prev.stats };
            let newSkills = { ...prev.skills };
            let newInventory = [...prev.inventory];
            let newFlags = { ...prev.flags };
            let newBestiary = [...prev.bestiary];
            let activeQuest = prev.activeQuest ? { ...prev.activeQuest } : null;

            const gainXp = (skill: SkillName, amt: number) => {
                const s = newSkills[skill];
                let xp = s.xp + amt;
                let lvl = s.level;
                const req = Math.floor(50 * Math.pow(lvl, 2.5));
                if (xp >= req) {
                    lvl++;
                    newLogs.unshift({ id: uid(), message: `LEVEL UP! ${skill} -> ${lvl}`, type: 'SKILL', timestamp: getTimestamp() });
                    if (skill === 'Strength') newStats.str = Math.floor(newStats.str * 1.1 + 5);
                    if (skill === 'Dexterity') newStats.dex = Math.floor(newStats.dex * 1.1 + 5);
                    if (skill === 'Agility') newStats.int = Math.floor(newStats.int * 1.1 + 5);
                }
                newSkills[skill] = { ...s, xp, level: lvl };
            };
            gainXp('Strength', damage);
            gainXp('Dexterity', 10);

            if (newEnemyHp <= 0) {
                newLogs.unshift({ id: uid(), message: `You slew ${enemy.name}!`, type: 'COMBAT', timestamp: getTimestamp() });
                newCounters['kills_total'] = (newCounters['kills_total'] || 0) + 1;
                
                newStats.xp += enemyStats.xp;
                newLogs.unshift({ id: uid(), message: `+${formatNumber(enemyStats.xp)} XP`, type: 'INFO', timestamp: getTimestamp() });
                
                const killKey = `kill_${enemy.name.toLowerCase().replace(' ', '_')}`;
                newCounters[killKey] = (newCounters[killKey] || 0) + 1;

                if (newStats.hp < (newStats.maxHp * 0.1)) newFlags['win_low_hp'] = true;
                newFlags[`dead_${enemy.id}`] = true;

                const rawName = enemy.name.replace('Elite ', '');
                if (!newBestiary.includes(rawName)) {
                    newBestiary.push(rawName);
                    newLogs.unshift({ id: uid(), message: `New Bestiary Entry: ${rawName}!`, type: 'SECRET', timestamp: getTimestamp() });
                }

                if (activeQuest && !activeQuest.completed && activeQuest.type === 'KILL') {
                    if (enemy.name.includes(activeQuest.targetId)) {
                        activeQuest.currentCount++;
                        if (activeQuest.currentCount >= activeQuest.targetCount) {
                            activeQuest.completed = true;
                            newLogs.unshift({ id: uid(), message: `QUEST OBJECTIVE COMPLETE! Return to giver.`, type: 'QUEST', timestamp: getTimestamp() });
                        } else {
                            newLogs.unshift({ id: uid(), message: `Quest Progress: ${activeQuest.currentCount}/${activeQuest.targetCount}`, type: 'QUEST', timestamp: getTimestamp() });
                        }
                    }
                }

                const loot = generateProceduralLoot(enemy.level || 1, enemy.name);
                if (loot) {
                    newInventory = addToInventory(loot, { ...prev, inventory: newInventory });
                    newLogs.unshift({ id: uid(), message: `DROP: ${loot.name}`, type: 'LOOT', timestamp: getTimestamp() });
                } else if (LOOT_TABLE[enemy.name]) {
                    const item = ITEMS[LOOT_TABLE[enemy.name]];
                    newInventory = addToInventory({ ...item, count: 1 }, { ...prev, inventory: newInventory });
                    newLogs.unshift({ id: uid(), message: `Found ${item.name}`, type: 'LOOT', timestamp: getTimestamp() });
                }
            }

            const nextState = {
                ...prev,
                playerFacing: newFacing,
                counters: newCounters,
                logs: newLogs.slice(0, 50),
                animations: newAnimations,
                stats: newStats,
                skills: newSkills,
                inventory: newInventory,
                flags: newFlags,
                bestiary: newBestiary,
                activeQuest: activeQuest
            };

            return processEnemyTurn(nextState);
        }
        if (targetEntity.type === 'NPC' || targetEntity.type === 'OBJECT') {
             const msg = `Blocked by ${targetEntity.name}. Press E to interact.`;
             if (prev.logs[0]?.message === msg) return prev;

             let nextState = { ...prev, playerFacing: newFacing };
             nextState.logs = [{ id: uid(), message: msg, type: 'INFO' as const, timestamp: getTimestamp() }, ...nextState.logs];
             return nextState;
        }
      }

      const exit = map.exits.find(e => e.pos.x === newX && e.pos.y === newY);
      if (exit) {
        const flags = { ...prev.flags };
        flags[`visit_${exit.targetMapId}`] = true;
        
        const targetPrefix = `dead_${exit.targetMapId}`;
        const nextFlags: Record<string, boolean> = {};
        Object.keys(flags).forEach(key => {
            if (key.startsWith(targetPrefix)) {
                return; 
            }
            nextFlags[key] = flags[key];
        });

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

      // Check death from environment
      if (newHp <= 0) {
        setTimeout(() => setActiveModal('DEATH'), 100);
        newHp = 0;
      }

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
  }, [revealArea, addLog, addSkillXp, activeModal]);

  const handleAction = useCallback(() => {
     setGameState(prev => {
         const map = MAPS[prev.currentMapId];
         // Check if entity is in front
         let tx = prev.playerPos.x;
         let ty = prev.playerPos.y;
         if (prev.playerFacing === 'UP') ty--;
         if (prev.playerFacing === 'DOWN') ty++;
         if (prev.playerFacing === 'LEFT') tx--;
         if (prev.playerFacing === 'RIGHT') tx++;
         
         const entity = map.entities.find(e => e.pos.x === tx && e.pos.y === ty);
         
         if (entity) {
             if (['ANVIL', 'WORKBENCH', 'ALCHEMY_TABLE'].includes(entity.subType || '')) {
                 // @ts-ignore
                 setActiveModal(entity.subType);
                 return prev;
             }
             if (entity.subType === 'BED') {
                  const newFlags: Record<string, boolean> = {};
                  Object.keys(prev.flags).forEach(key => {
                      if (key.startsWith('dead_') && !key.includes('BOSS_')) return; // Respawn
                      newFlags[key] = prev.flags[key];
                  });
                  return {
                      ...prev,
                      stats: { ...prev.stats, hp: prev.stats.maxHp },
                      flags: newFlags,
                      logs: [{ id: uid(), message: 'You rested and recovered HP. Enemies respawned.', type: 'INFO', timestamp: getTimestamp() }, ...prev.logs]
                  };
             }
             if (entity.subType === 'CHEST' && !prev.flags[`looted_${entity.id}`]) {
                 const flags = { ...prev.flags, [`looted_${entity.id}`]: true };
                 const item = entity.loot ? ITEMS[entity.loot] : generateProceduralLoot(10, 'Chest');
                 let inv = [...prev.inventory];
                 let msg = "Empty.";
                 if (item) {
                     inv = addToInventory({ ...item, count: 1 }, prev);
                     msg = `Found ${item.name}!`;
                 }
                 return { ...prev, flags, inventory: inv, logs: [{ id: uid(), message: msg, type: 'LOOT', timestamp: getTimestamp() }, ...prev.logs] };
             }
             if (entity.type === 'NPC') {
                 // Simple dialogue log for now
                 const line = entity.dialogue ? entity.dialogue[Math.floor(Math.random() * entity.dialogue.length)] : "Hello!";
                 return {
                     ...prev,
                     logs: [{ id: uid(), message: `${entity.name}: "${line}"`, type: 'DIALOGUE', timestamp: getTimestamp() }, ...prev.logs]
                 }
             }
         }
         return prev;
     });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (activeModal) {
            if (e.key === 'Escape') setActiveModal(null);
            return;
        }

        if (e.key === 'ArrowUp') handleMove(0, -1);
        else if (e.key === 'ArrowDown') handleMove(0, 1);
        else if (e.key === 'ArrowLeft') handleMove(-1, 0);
        else if (e.key === 'ArrowRight') handleMove(1, 0);
        else if (e.key === 'e' || e.key === 'Enter') handleAction();
        else if (e.key === 'i') setActiveModal('INVENTORY');
        else if (e.key === 'q') setActiveModal('QUESTS');
        else if (e.key === 'k') setActiveModal('SKILLS');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleAction, activeModal]);

  useEffect(() => {
    revealArea(gameState.currentMapId, gameState.playerPos.x, gameState.playerPos.y);
  }, [gameState.currentMapId, revealArea]); 

  const currentMap = MAPS[gameState.currentMapId];
  const explored = gameState.exploration[gameState.currentMapId];

  // Logic for context action button
  const facingEntity = useMemo(() => {
      if (!currentMap) return null;
      let tx = gameState.playerPos.x;
      let ty = gameState.playerPos.y;
      if (gameState.playerFacing === 'UP') ty--;
      if (gameState.playerFacing === 'DOWN') ty++;
      if (gameState.playerFacing === 'LEFT') tx--;
      if (gameState.playerFacing === 'RIGHT') tx++;
      return currentMap.entities.find(e => e.pos.x === tx && e.pos.y === ty && (e.type === 'NPC' || e.type === 'OBJECT'));
  }, [gameState.playerPos, gameState.playerFacing, currentMap]);

  const playerStats = getPlayerTotalStats(gameState.stats, gameState.equipment);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
        {/* GAME WORLD */}
        <div className="relative shadow-2xl">
             {currentMap && currentMap.tiles.map((row, y) => (
                 <div key={y} className="flex">
                     {row.map((tile, x) => {
                         const isRevealed = explored && explored[y][x];
                         if (!isRevealed) return <div key={x} className="w-8 h-8 bg-black" />;
                         return <Tile key={x} type={tile} x={x} y={y} />;
                     })}
                 </div>
             ))}
             {currentMap && currentMap.entities.map(e => {
                  if (gameState.flags[`dead_${e.id}`]) return null;
                  const isRevealed = explored && explored[e.pos.y][e.pos.x];
                  if (!isRevealed) return null;
                  return (
                      <EntityComponent 
                          key={e.id} 
                          entity={e} 
                          animation={gameState.animations[e.id]} 
                      />
                  );
             })}
             <EntityComponent 
                 entity={{ 
                     id: 'player', name: 'Hero', type: 'PLAYER', 
                     symbol: '@', color: 'white', 
                     pos: gameState.playerPos,
                     facing: gameState.playerFacing 
                 }} 
                 isPlayer 
                 animation={gameState.animations['player']}
             />
             
             {/* Floating Context Action */}
             {facingEntity && !activeModal && (
                 <div 
                    onClick={handleAction}
                    className="absolute z-40 cursor-pointer animate-bounce bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold border border-white shadow-lg"
                    style={{ 
                        top: (gameState.playerPos.y - 1) * 32, 
                        left: gameState.playerPos.x * 32,
                        transform: 'translateX(-25%)'
                    }}
                 >
                     <Hand className="w-3 h-3 inline mr-1"/>Interact
                 </div>
             )}
        </div>
        
        {/* LOGS */}
        <div className="absolute bottom-4 left-4 w-96 max-h-40 overflow-y-auto bg-black/60 text-white p-2 rounded font-mono text-sm pointer-events-none backdrop-blur-sm mask-image-b-to-t">
            {gameState.logs.map(log => (
                <div key={log.id} className={`${log.type === 'COMBAT' ? 'text-red-300' : log.type === 'LOOT' ? 'text-yellow-300' : 'text-stone-300'} drop-shadow-md`}>
                    {log.message}
                </div>
            ))}
        </div>
        
        {/* MINIMAL STATUS HUD (Top Left) */}
        <div className="absolute top-4 left-4 flex gap-4">
             <div className="bg-red-900/80 p-2 rounded border border-red-700 flex items-center gap-2 text-white min-w-[120px]">
                <Heart className="w-4 h-4 text-red-400 fill-current" />
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(gameState.stats.hp / gameState.stats.maxHp) * 100}%` }} />
                </div>
                <span className="text-xs">{gameState.stats.hp}</span>
             </div>
             <div className="bg-blue-900/80 p-2 rounded border border-blue-700 flex items-center gap-2 text-white">
                <Zap className="w-4 h-4 text-blue-400 fill-current" />
                <span className="text-xs font-bold">LVL {gameState.stats.level}</span>
             </div>
        </div>

        {/* TOOLBAR HUD (Bottom Right) */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
             <button 
                onClick={() => setActiveModal('INVENTORY')}
                className="bg-stone-800/90 p-3 rounded-full border-2 border-stone-600 hover:border-yellow-500 hover:bg-stone-700 hover:scale-110 transition-all text-stone-300 group relative"
             >
                 <Backpack className="w-6 h-6" />
                 <span className="absolute right-full mr-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Inventory (I)</span>
             </button>
             <button 
                onClick={() => setActiveModal('SKILLS')}
                className="bg-stone-800/90 p-3 rounded-full border-2 border-stone-600 hover:border-blue-500 hover:bg-stone-700 hover:scale-110 transition-all text-stone-300 group relative"
             >
                 <BookOpen className="w-6 h-6" />
                 <span className="absolute right-full mr-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Skills (K)</span>
             </button>
             <button 
                onClick={() => setActiveModal('QUESTS')}
                className="bg-stone-800/90 p-3 rounded-full border-2 border-stone-600 hover:border-green-500 hover:bg-stone-700 hover:scale-110 transition-all text-stone-300 group relative"
             >
                 <Scroll className="w-6 h-6" />
                 <span className="absolute right-full mr-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Quests (Q)</span>
             </button>
        </div>

        {/* --- MODALS --- */}

        {/* DEATH MODAL */}
        {activeModal === 'DEATH' && (
            <div className="absolute inset-0 bg-red-950/90 z-50 flex flex-col items-center justify-center animate-in fade-in duration-1000">
                <Skull className="w-32 h-32 text-red-500 mb-6 animate-pulse" />
                <h1 className="text-6xl text-red-500 font-bold tracking-widest mb-4 font-[VT323]">YOU DIED</h1>
                <p className="text-red-300 text-xl mb-8">Your journey has ended... for now.</p>
                <button 
                    onClick={handleRespawn}
                    className="bg-red-800 hover:bg-red-700 text-white text-2xl px-8 py-3 rounded border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all hover:scale-105 active:scale-95"
                >
                    REVIVE AT VILLAGE
                </button>
            </div>
        )}

        {/* INVENTORY MODAL */}
        {activeModal === 'INVENTORY' && (
             <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
                <div className="bg-stone-900 border-4 border-stone-700 p-6 rounded-lg w-[800px] max-h-[80vh] flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X /></button>
                    <h2 className="text-2xl text-stone-300 font-bold mb-6 flex items-center gap-2"><Backpack /> Inventory</h2>
                    
                    <div className="flex gap-6 h-full overflow-hidden">
                        {/* Equipment Column */}
                        <div className="w-1/3 flex flex-col gap-4 border-r border-stone-700 pr-4">
                            <h3 className="text-stone-500 uppercase text-xs font-bold tracking-widest">Equipment</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(gameState.equipment).map(([slot, item]) => (
                                    <div key={slot} className="bg-stone-950 p-2 rounded border border-stone-800 flex flex-col items-center justify-center aspect-square relative group">
                                        <span className="absolute top-1 left-1 text-[10px] text-stone-600">{slot}</span>
                                        {item ? (
                                            <>
                                                <div className={`text-2xl ${item.rarity === 'LEGENDARY' ? 'text-yellow-400' : 'text-stone-300'}`}>
                                                    {item.slot === 'WEAPON' ? <Sword /> : item.slot === 'OFFHAND' ? <Shield /> : <div className="w-6 h-6 bg-stone-700/50 rounded-full" />}
                                                </div>
                                                <div className="text-xs text-center mt-1 truncate w-full px-1">{item.name}</div>
                                                <button 
                                                    onClick={() => handleUnequip(slot as EquipmentSlot)}
                                                    className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white transition-opacity font-bold"
                                                >
                                                    UNEQUIP
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-stone-700"><X className="w-6 h-6 opacity-20"/></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 bg-stone-950 p-4 rounded text-sm text-stone-400 space-y-1">
                                <h3 className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-2">Stats</h3>
                                <div className="flex justify-between"><span>STR</span> <span className="text-white">{playerStats.str}</span></div>
                                <div className="flex justify-between"><span>DEX</span> <span className="text-white">{playerStats.dex}</span></div>
                                <div className="flex justify-between"><span>INT</span> <span className="text-white">{playerStats.int}</span></div>
                                <div className="flex justify-between"><span>REGEN</span> <span className="text-green-400">{playerStats.regeneration}</span></div>
                            </div>
                        </div>

                        {/* Backpack Grid */}
                        <div className="flex-1 overflow-y-auto">
                            <h3 className="text-stone-500 uppercase text-xs font-bold tracking-widest mb-4">Backpack ({gameState.inventory.length} items)</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {gameState.inventory.map(item => (
                                    <div key={item.id} className="bg-stone-800 p-2 rounded border border-stone-600 hover:border-yellow-500 hover:bg-stone-700 transition-colors relative group h-24 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className={`text-xs font-bold truncate ${item.rarity === 'LEGENDARY' ? 'text-yellow-400' : item.rarity === 'EPIC' ? 'text-purple-400' : 'text-stone-300'}`}>
                                                {item.name}
                                            </div>
                                            {item.count > 1 && <span className="text-xs bg-black px-1 rounded text-stone-400">x{item.count}</span>}
                                        </div>
                                        <div className="text-[10px] text-stone-500 leading-tight line-clamp-2">{item.description}</div>
                                        
                                        {/* Item Actions */}
                                        {(item.type === 'CONSUMABLE' || item.type === 'EQUIPMENT') && (
                                            <button 
                                                onClick={() => handleUseItem(item)}
                                                className="mt-1 w-full bg-stone-900 text-[10px] py-1 text-stone-300 hover:bg-stone-600 rounded"
                                            >
                                                {item.type === 'EQUIPMENT' ? 'EQUIP' : 'USE'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {Array(Math.max(0, 20 - gameState.inventory.length)).fill(null).map((_, i) => (
                                    <div key={`empty-${i}`} className="bg-stone-900/50 border border-stone-800 rounded h-24 opacity-50" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* SKILLS MODAL */}
        {activeModal === 'SKILLS' && (
             <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
                <div className="bg-stone-900 border-4 border-stone-700 p-6 rounded-lg w-[400px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X /></button>
                    <h2 className="text-2xl text-blue-300 font-bold mb-6 flex items-center gap-2"><BookOpen /> Skills</h2>
                    <div className="space-y-3">
                        {Object.values(gameState.skills).map(skill => (
                            <div key={skill.name} className="bg-stone-950 p-3 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-stone-300">{skill.name}</div>
                                    <div className="text-xs text-stone-500">XP: {skill.xp}</div>
                                </div>
                                <div className="text-xl font-mono text-blue-400">Lv.{skill.level}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* QUESTS MODAL */}
        {activeModal === 'QUESTS' && (
             <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
                <div className="bg-stone-900 border-4 border-stone-700 p-6 rounded-lg w-[400px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X /></button>
                    <h2 className="text-2xl text-yellow-300 font-bold mb-6 flex items-center gap-2"><Scroll /> Quests</h2>
                    <div className="space-y-4">
                        {gameState.activeQuest ? (
                            <div className="bg-stone-800 p-4 rounded border border-yellow-700/50">
                                <h3 className="text-yellow-400 font-bold text-lg mb-2">{gameState.activeQuest.title}</h3>
                                <p className="text-stone-300 text-sm mb-4">{gameState.activeQuest.description}</p>
                                <div className="w-full bg-black h-2 rounded-full overflow-hidden mb-1">
                                    <div className="bg-yellow-600 h-full transition-all" style={{ width: `${(gameState.activeQuest.currentCount / gameState.activeQuest.targetCount) * 100}%` }} />
                                </div>
                                <div className="text-right text-xs text-stone-500">
                                    {gameState.activeQuest.currentCount} / {gameState.activeQuest.targetCount} {gameState.activeQuest.targetId}s
                                </div>
                                {gameState.activeQuest.completed && (
                                    <div className="mt-2 text-green-400 font-bold text-center animate-pulse">
                                        COMPLETE - RETURN TO GIVER
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-stone-500 italic text-center py-8">No active quests. Talk to villagers!</div>
                        )}
                        
                        <div className="pt-4 border-t border-stone-800">
                             <h4 className="text-stone-500 text-xs font-bold uppercase mb-2">Secrets Found</h4>
                             <div className="text-stone-400 text-sm">
                                 {gameState.secrets.filter(s => s.unlocked).length} / {gameState.secrets.length}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CRAFTING MODAL (Reused logic) */}
        {['ANVIL', 'WORKBENCH', 'ALCHEMY_TABLE'].includes(activeModal || '') && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setActiveModal(null)}>
                <div className="bg-stone-900 border-4 border-stone-700 p-6 rounded-lg w-[500px] max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6 border-b border-stone-700 pb-2">
                        <h2 className="text-2xl text-yellow-500 font-bold flex items-center gap-2">
                           {activeModal === 'ANVIL' && <Hammer />}
                           {activeModal === 'WORKBENCH' && <Pickaxe />}
                           {activeModal === 'ALCHEMY_TABLE' && <FlaskConical />}
                           {activeModal?.replace('_', ' ').replace('CRAFTING ', '')}
                        </h2>
                        <button onClick={() => setActiveModal(null)} className="text-stone-500 hover:text-white"><X /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                         {RECIPES.filter(r => r.station === activeModal).length === 0 && <div className="text-stone-500 text-center italic py-4">No recipes available here.</div>}
                        
                        {RECIPES.filter(r => r.station === activeModal).map(recipe => {
                            const canCraftLevel = gameState.skills[recipe.skill].level >= recipe.levelReq;
                            const ingredientsCheck = recipe.ingredients.map(ing => {
                                const has = gameState.inventory.find(i => i.id === ing.itemId)?.count || 0;
                                return { ...ing, has, met: has >= ing.count };
                            });
                            const canCraftIngredients = ingredientsCheck.every(i => i.met);
                            const canCraft = canCraftLevel && canCraftIngredients;

                            return (
                                <div key={recipe.id} className={`bg-stone-800 p-3 rounded border ${canCraft ? 'border-stone-600' : 'border-stone-800 opacity-70'} flex flex-col gap-2`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-stone-200">{recipe.name}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${canCraftLevel ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                            {recipe.skill} Lv.{recipe.levelReq}
                                        </span>
                                    </div>
                                    
                                    <div className="text-sm grid grid-cols-2 gap-2 my-1">
                                        {ingredientsCheck.map(ing => (
                                            <div key={ing.itemId} className={`${ing.met ? 'text-stone-400' : 'text-red-400'}`}>
                                                {ITEMS[ing.itemId]?.name || ing.itemId}: {ing.has}/{ing.count}
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => handleCraft(recipe)}
                                        disabled={!canCraft}
                                        className={`w-full py-2 rounded font-bold text-sm uppercase tracking-wide transition-colors ${
                                            canCraft 
                                            ? 'bg-yellow-700 hover:bg-yellow-600 text-white shadow-md' 
                                            : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                                        }`}
                                    >
                                        Craft
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
