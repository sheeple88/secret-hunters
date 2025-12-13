
import { GameState, Position, AnimationType, LogEntry, Item, GameMap } from '../types';
import { MAPS, ITEMS, uid, calculateSkillLevel, SCALE_FACTOR } from '../constants';
import { playSound } from '../services/audioService';
// NEW: Import modular AI
import { processEnemyTurn, processSpawners } from './combat/enemyAI';
import { generateDungeon } from './mapGenerator';
import { checkQuestUpdate } from './questUtils';

const BLOCKED_TILES = ['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'SHRINE', 'VOID', 'WATER', 'CACTUS', 'DEEP_WATER', 'OBSIDIAN', 'CRACKED_WALL', 'ROOF'];
const TREE_TYPES = ['TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE'];

// Skill XP Helper
const applySkillXp = (gs: GameState, skillName: string, amount: number) => {
    const skill = gs.skills[skillName as any] || { name: skillName, level: 1, xp: 0 };
    const newXp = skill.xp + amount;
    const newLevel = calculateSkillLevel(newXp);
    const levelsGained = newLevel - skill.level;
    
    let statChanges: any = {};
    if (levelsGained > 0) {
        playSound('LEVEL_UP');
        // Legacy stat bump kept for non-combat skills
        if (skillName === 'Logging') statChanges.str = (gs.stats.str) + levelsGained;
        if (skillName === 'Mining') statChanges.str = (gs.stats.str) + levelsGained;
    }
    return { updatedSkill: { ...skill, xp: newXp, level: newLevel }, statChanges, levelsGained };
};

const findBestEntry = (targetMap: GameMap, entrySide: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'): Position => {
    let candidatePoints: Position[] = [];
    const w = targetMap.width;
    const h = targetMap.height;

    let fixedCoord = 0; 
    let scanLimit = 0; 
    let isVerticalScan = false;

    if (entrySide === 'NORTH') { fixedCoord = 0; scanLimit = w; isVerticalScan = false; }
    else if (entrySide === 'SOUTH') { fixedCoord = h - 1; scanLimit = w; isVerticalScan = false; }
    else if (entrySide === 'WEST') { fixedCoord = 0; scanLimit = h; isVerticalScan = true; }
    else if (entrySide === 'EAST') { fixedCoord = w - 1; scanLimit = h; isVerticalScan = true; }

    for (let i = 0; i < scanLimit; i++) {
        const x = isVerticalScan ? fixedCoord : i;
        const y = isVerticalScan ? i : fixedCoord;
        
        if (targetMap.tiles[y][x] === 'DIRT_PATH') {
            candidatePoints.push({ x, y });
        }
    }

    if (candidatePoints.length === 0) {
        for (let i = 0; i < scanLimit; i++) {
            const x = isVerticalScan ? fixedCoord : i;
            const y = isVerticalScan ? i : fixedCoord;
            
            if (!BLOCKED_TILES.includes(targetMap.tiles[y][x])) {
                candidatePoints.push({ x, y });
            }
        }
    }

    if (candidatePoints.length > 0) {
        const midIndex = Math.floor(candidatePoints.length / 2);
        return candidatePoints[midIndex];
    }

    return { x: Math.floor(w / 2), y: Math.floor(h / 2) };
};

export const handlePlayerMove = (
    prev: GameState, 
    dx: number, 
    dy: number,
    setActiveModal: (m: string) => void
): { newState: GameState, damageEvents: Record<string, number> } => {
    if (prev.stats.hp <= 0) return { newState: prev, damageEvents: {} };
    
    const map = MAPS[prev.currentMapId];
    const nx = prev.playerPos.x + dx;
    const ny = prev.playerPos.y + dy;
    const facing = dx > 0 ? 'RIGHT' : dx < 0 ? 'LEFT' : dy > 0 ? 'DOWN' : 'UP';
    
    // --- 1. Map Transitions ---
    let nextMapId = prev.currentMapId;
    let nextPos = { x: nx, y: ny };
    let didTransition = false;

    // Check Bounds
    if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) {
        let entrySide: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | null = null;
        let targetId: string | undefined = undefined;

        if (nx < 0) { targetId = map.neighbors.LEFT; entrySide = 'EAST'; }
        else if (nx >= map.width) { targetId = map.neighbors.RIGHT; entrySide = 'WEST'; }
        else if (ny < 0) { targetId = map.neighbors.UP; entrySide = 'SOUTH'; }
        else if (ny >= map.height) { targetId = map.neighbors.DOWN; entrySide = 'NORTH'; }

        if (targetId && MAPS[targetId] && entrySide) {
            nextMapId = targetId;
            nextPos = findBestEntry(MAPS[targetId], entrySide);
            didTransition = true;
        } else {
            return { newState: { ...prev, playerFacing: facing }, damageEvents: {} };
        }
    }
    
    const targetMap = MAPS[nextMapId];
    
    // --- 2. Collision Check (If on same map) ---
    if (!didTransition) {
        if (!targetMap.tiles[nextPos.y] || !targetMap.tiles[nextPos.y][nextPos.x]) {
             return { newState: { ...prev, playerFacing: facing }, damageEvents: {} };
        }
        
        // Resolve Effective Tile
        let effectiveTile = targetMap.tiles[nextPos.y][nextPos.x];
        const mapMod = prev.worldModified[nextMapId];
        if (mapMod && mapMod[`${nextPos.y},${nextPos.x}`]) {
            effectiveTile = mapMod[`${nextPos.y},${nextPos.x}`];
        }

        // Block Check
        const entityAtPos = targetMap.entities.find(e => e.pos.x === nextPos.x && e.pos.y === nextPos.y);
        
        if (BLOCKED_TILES.includes(effectiveTile) && ![...TREE_TYPES, 'ROCK'].includes(effectiveTile)) {
             return { newState: { ...prev, playerFacing: facing }, damageEvents: {} };
        }
        
        if (entityAtPos && ['ENEMY', 'NPC', 'OBJECT'].includes(entityAtPos.type)) {
             // Exception for Item Drops or non-blocking objects (like drops)
             if (!['ITEM_DROP'].includes(entityAtPos.type) && !['PRESSURE_PLATE'].includes(entityAtPos.subType || '')) {
                 return { newState: { ...prev, playerFacing: facing }, damageEvents: {} };
             }
        }
    }

    // --- 3. Action Logic ---
    let playerDidAction = false;
    let newAnimations: Record<string, AnimationType> = {};
    let damageEvents: Record<string, number> = {};
    let combatLogs: LogEntry[] = [];
    let newCounters = { ...prev.counters };
    let newInventory = [...prev.inventory];
    let newStats = { ...prev.stats };
    let newSkills = { ...prev.skills };
    let newWorldMod = { ...prev.worldModified };
    let nextMapEntities = [...targetMap.entities];
    let newWorldTier = prev.worldTier || 0; 
    let newActiveQuest = prev.activeQuest;
    let newBestiary = [...prev.bestiary]; // Fix: Added missing declaration

    if (didTransition) {
        const logMsg = `Zone: ${targetMap.name} (${nextPos.x}, ${nextPos.y})`;
        combatLogs.push({ id: uid(), message: logMsg, type: 'DEBUG', timestamp: Date.now() });
    }
    
    let targetTile = targetMap.tiles[nextPos.y][nextPos.x];
    const mapMod = newWorldMod[nextMapId];
    if (mapMod && mapMod[`${nextPos.y},${nextPos.x}`]) {
        targetTile = mapMod[`${nextPos.y},${nextPos.x}`];
    }
    
    // Check Dungeon Entrance
    if (['ENTRANCE_CRYPT', 'ENTRANCE_CAVE', 'ENTRANCE_MAGMA'].includes(targetTile)) {
        const dungeonId = `dungeon_${nextMapId}_${nextPos.x}_${nextPos.y}`;
        let type: 'CRYPT' | 'CAVE' | 'MAGMA' = 'CAVE';
        if (targetTile === 'ENTRANCE_CRYPT') type = 'CRYPT';
        if (targetTile === 'ENTRANCE_MAGMA') type = 'MAGMA';

        if (!MAPS[dungeonId]) {
            const d = map.difficulty || 1;
            MAPS[dungeonId] = generateDungeon(dungeonId, d, type, nextMapId, nextPos, prev.stats.level, newWorldTier);
        }

        const dungeonMap = MAPS[dungeonId];
        let sx = 1, sy = 1;
        for(let y=0; y<dungeonMap.height; y++){
            for(let x=0; x<dungeonMap.width; x++){
                if (dungeonMap.tiles[y][x] === 'STAIRS_UP') { sx = x; sy = y; break; }
            }
        }

        playSound('UI_CLICK');
        didTransition = true;
        nextMapId = dungeonId;
        nextPos = { x: sx, y: sy };
        nextMapEntities = [...dungeonMap.entities];
        
        combatLogs.push({ id: uid(), message: `Entered ${dungeonMap.name}`, type: 'INFO', timestamp: Date.now() });

        const newExp = { ...prev.exploration };
        if (!newExp[nextMapId]) {
            newExp[nextMapId] = Array(dungeonMap.height).fill(null).map(() => Array(dungeonMap.width).fill(0));
        }

        return { 
            newState: { 
                ...prev, 
                playerPos: nextPos, 
                currentMapId: nextMapId, 
                exploration: newExp, 
                playerFacing: 'DOWN',
                logs: [...combatLogs, ...prev.logs].slice(0,100)
            },
            damageEvents: {}
        };
    }

    // Check collision with tile (Gathering)
    if (!didTransition && BLOCKED_TILES.includes(targetTile)) {
        if ((TREE_TYPES.includes(targetTile) || targetTile === 'ROCK')) {
           playSound('GATHER');
           const isTree = TREE_TYPES.includes(targetTile);
           const skill = isTree ? 'Logging' : 'Mining';
           const { updatedSkill, statChanges } = applySkillXp(prev, skill, 10);
           
           if (isTree) newCounters.trees_cut = (newCounters.trees_cut || 0) + 1;
           if (targetTile === 'ROCK') newCounters.rocks_mined = (newCounters.rocks_mined || 0) + 1;
           
           newStats = { ...newStats, ...statChanges };
           newSkills = { ...newSkills, [skill]: updatedSkill };
           
           // Add Item
           let itemId = 'stone';
           if (targetTile === 'OAK_TREE') itemId = 'oak_log';
           else if (targetTile === 'BIRCH_TREE') itemId = 'birch_log';
           else if (targetTile === 'PINE_TREE') itemId = 'pine_log';
           else if (targetTile === 'TREE') itemId = 'wood';
           
           const itemTemplate = ITEMS[itemId];
           const existing = newInventory.find(i => i.id === itemTemplate.id);
           if (existing) {
               newInventory = newInventory.map(i => i.id === itemTemplate.id ? { ...i, count: i.count + 1 } : i);
           } else {
               newInventory.push({ ...itemTemplate });
           }

           const newMapMod = newWorldMod[nextMapId] || {};
           newMapMod[`${nextPos.y},${nextPos.x}`] = isTree ? 'STUMP' : 'FLOOR';
           newWorldMod[nextMapId] = newMapMod;

           const qUpd = checkQuestUpdate(newActiveQuest, 'COLLECT', itemId, 1);
           if (qUpd) {
               newActiveQuest = qUpd.newQuest;
               if (qUpd.log) combatLogs.push(qUpd.log);
           }

           return { 
               newState: { ...prev, playerFacing: facing, stats: newStats, skills: newSkills, inventory: newInventory, worldModified: newWorldMod, counters: newCounters, activeQuest: newActiveQuest, logs: [...combatLogs, ...prev.logs].slice(0,100) },
               damageEvents: {} 
           };
       }
   }

   // Check Entity Collision (Pickups/Teleports only)
   let entity = targetMap.entities.find(e => e.pos.x === nextPos.x && e.pos.y === nextPos.y);

   if (entity) {
       // Item Drop Pickup
       if (entity.type === 'ITEM_DROP' && entity.loot) {
           playSound('UI_CLICK');
           const item = ITEMS[entity.loot];
           if (item) {
               const pickupItem = { ...item };
               if (!['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY', 'COLLECTIBLE', 'GADGET', 'BLUEPRINT'].includes(item.type)) {
                   pickupItem.id = uid();
               }

               const existingIdx = newInventory.findIndex(i => i.id === pickupItem.id);
               if (existingIdx !== -1) {
                   newInventory = newInventory.map((i, idx) => idx === existingIdx ? { ...i, count: i.count + 1 } : i);
               } else {
                   newInventory.push(pickupItem);
               }

               combatLogs.push({ id: uid(), message: `Picked up: ${item.name}`, type: 'LOOT', timestamp: Date.now() });
               
               nextMapEntities = nextMapEntities.filter(e => e.id !== entity!.id);
               if (!didTransition) {
                   playerDidAction = true;
                   newCounters.steps_taken = (newCounters.steps_taken || 0) + 1;
                   nextPos = { x: nextPos.x, y: nextPos.y };
               }
           }
       }
       
       // Teleport Logic
       else if (entity.destination && entity.destination.mapId && MAPS[entity.destination.mapId]) {
           playSound('UI_CLICK');
           const dest = entity.destination;
           let newExp = { ...prev.exploration };
           
           const logMsg = `Teleport: ${dest.mapId} (${dest.x}, ${dest.y})`;
           combatLogs.push({ id: uid(), message: logMsg, type: 'DEBUG', timestamp: Date.now() });
           
           if (!newExp[dest.mapId]) {
                const destMap = MAPS[dest.mapId];
                if (destMap.biome === 'INTERIOR') {
                    newExp[dest.mapId] = Array(destMap.height).fill(null).map(() => Array(destMap.width).fill(1));
                } else {
                    newExp[dest.mapId] = Array(destMap.height).fill(null).map(() => Array(destMap.width).fill(0));
                }
           }
           const allLogs = [...combatLogs, ...prev.logs].slice(0, 100);

           return { 
               newState: { 
                   ...prev, 
                   playerPos: { x: dest.x, y: dest.y }, 
                   currentMapId: dest.mapId, 
                   exploration: newExp, 
                   playerFacing: 'DOWN',
                   logs: allLogs
               },
               damageEvents: {}
           };
       }
       
       else if (entity.subType === 'CRATE') {
           playSound('BUMP');
           nextMapEntities = nextMapEntities.filter(e => e.id !== entity!.id);
           const loot = entity.loot ? ITEMS[entity.loot] : (Math.random() > 0.5 ? ITEMS['wood'] : null);
           if (loot) {
               const existing = newInventory.find(i => i.id === loot.id);
               if (existing && loot.type === 'MATERIAL') newInventory = newInventory.map(i => i.id === loot.id ? {...i, count: i.count + 1} : i);
               else newInventory.push({...loot, id: uid()});
           }
           newAnimations['player'] = 'ATTACK';
           playerDidAction = true;
           nextPos = prev.playerPos; // Stay put
       } else if (['NPC', 'OBJECT', 'ENEMY'].includes(entity.type) && !['PRESSURE_PLATE'].includes(entity.subType || '')) {
           return { newState: { ...prev, playerFacing: facing }, damageEvents: {} };
       }
   } else {
       // Move Success
       if (!didTransition) {
           playSound('WALK');
           playerDidAction = true;
           newCounters.steps_taken = (newCounters.steps_taken || 0) + 1;
       }
       nextPos = { x: nextPos.x, y: nextPos.y };
   }

   // --- 4. Enemy Turns ---
   // Triggered by movement
   if (playerDidAction) {
       // NEW: Modular AI Logic
       nextMapEntities = processSpawners(targetMap, nextMapEntities);

       const { updatedEntities, damageToPlayer, logs: enemyLogs, animations: enemyAnims } 
          = processEnemyTurn({ ...prev, playerPos: nextPos }, { ...targetMap, entities: nextMapEntities });
      
       nextMapEntities = updatedEntities;
       
       if (damageToPlayer > 0) {
           newStats.hp -= damageToPlayer;
           newCounters.damage_taken = (newCounters.damage_taken || 0) + damageToPlayer;
           damageEvents['player'] = damageToPlayer;
           combatLogs = [...combatLogs, ...enemyLogs];
           newAnimations = { ...newAnimations, ...enemyAnims };
           if (newStats.hp <= 0) setActiveModal('DEATH');
       }
   }

   // --- 5. Final Updates ---
   const finalLogs = [...combatLogs, ...prev.logs].slice(0, 100);
   
   const newExp = { ...prev.exploration };
   if (!newExp[nextMapId]) {
       if (targetMap.biome === 'INTERIOR') {
           newExp[nextMapId] = Array(targetMap.height).fill(null).map(() => Array(targetMap.width).fill(1));
       } else {
           newExp[nextMapId] = Array(targetMap.height).fill(null).map(() => Array(targetMap.width).fill(0));
       }
   }
   let rad = 4;
   if (prev.equippedPerks.includes('vision_plus')) rad += 2;
   const expGrid = newExp[nextMapId];
   if (expGrid && targetMap.biome !== 'INTERIOR') {
        for(let y = nextPos.y - rad; y <= nextPos.y + rad; y++) {
            if (y >= 0 && y < targetMap.height && expGrid[y]) {
                for(let x = nextPos.x - rad; x <= nextPos.x + rad; x++) {
                    if (x >= 0 && x < targetMap.width) {
                        expGrid[y][x] = 1;
                    }
                }
            }
        }
   }

   MAPS[nextMapId].entities = nextMapEntities;

   return {
       newState: {
           ...prev,
           playerPos: nextPos,
           playerFacing: facing,
           currentMapId: nextMapId,
           stats: newStats,
           inventory: newInventory,
           skills: newSkills,
           bestiary: newBestiary,
           logs: finalLogs,
           animations: newAnimations,
           exploration: newExp,
           counters: newCounters,
           activeQuest: newActiveQuest,
           worldTier: newWorldTier,
           lastAction: playerDidAction ? 'MOVE' : prev.lastAction
       },
       damageEvents
   };
};
