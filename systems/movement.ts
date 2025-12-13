
import { GameState, Position, AnimationType, LogEntry, Item, GameMap } from '../types';
import { MAPS, ITEMS, WEAPON_TEMPLATES, uid, calculateSkillLevel, SCALE_FACTOR, MONSTER_TEMPLATES } from '../constants';
import { playSound } from '../services/audioService';
import { generateLoot } from '../services/itemService';
import { processEnemyTurns, processSpawners } from './ai';
import { generateDungeon } from './mapGenerator';

const BLOCKED_TILES = ['WALL', 'TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE', 'ROCK', 'SHRINE', 'VOID', 'WATER', 'CACTUS', 'DEEP_WATER', 'OBSIDIAN', 'CRACKED_WALL', 'ROOF'];
const TREE_TYPES = ['TREE', 'OAK_TREE', 'BIRCH_TREE', 'PINE_TREE'];

// Helper to calculate stats inside the logic (or pass them in)
const getPlayerTotalStats = (gs: GameState) => {
    return { str: gs.stats.str, dex: gs.stats.dex, int: gs.stats.int }; 
};

// Skill XP Helper
const applySkillXp = (gs: GameState, skillName: string, amount: number) => {
    // Graceful fallback if skill key missing
    const skill = gs.skills[skillName as any] || { name: skillName, level: 1, xp: 0 };
    const newXp = skill.xp + amount;
    const newLevel = calculateSkillLevel(newXp);
    const levelsGained = newLevel - skill.level;
    
    let statChanges: any = {};
    if (levelsGained > 0) {
        playSound('LEVEL_UP');
        // Exponential stat gain from skills? Or stick to linear helper?
        // Let's keep skills linear but influential
        if (skillName === 'Strength') statChanges.str = (gs.stats.str) + (levelsGained * 5);
        if (skillName === 'Dexterity') statChanges.dex = (gs.stats.dex) + (levelsGained * 5);
    }
    return { updatedSkill: { ...skill, xp: newXp, level: newLevel }, statChanges, levelsGained };
};

// New Robust Entry Finder: Scans the target edge for a Path or Open Ground
const findBestEntry = (targetMap: GameMap, entrySide: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'): Position => {
    let candidatePoints: Position[] = [];
    const w = targetMap.width;
    const h = targetMap.height;

    // Determine scanning range based on side
    let fixedCoord = 0; 
    let scanLimit = 0; 
    let isVerticalScan = false; // Scanning along Y axis (for East/West entry)

    if (entrySide === 'NORTH') { fixedCoord = 0; scanLimit = w; isVerticalScan = false; }
    else if (entrySide === 'SOUTH') { fixedCoord = h - 1; scanLimit = w; isVerticalScan = false; }
    else if (entrySide === 'WEST') { fixedCoord = 0; scanLimit = h; isVerticalScan = true; }
    else if (entrySide === 'EAST') { fixedCoord = w - 1; scanLimit = h; isVerticalScan = true; }

    // Pass 1: Look for DIRT_PATH (The "Gate")
    for (let i = 0; i < scanLimit; i++) {
        const x = isVerticalScan ? fixedCoord : i;
        const y = isVerticalScan ? i : fixedCoord;
        
        if (targetMap.tiles[y][x] === 'DIRT_PATH') {
            candidatePoints.push({ x, y });
        }
    }

    // Pass 2: If no paths found, Look for ANY non-blocked tile
    if (candidatePoints.length === 0) {
        for (let i = 0; i < scanLimit; i++) {
            const x = isVerticalScan ? fixedCoord : i;
            const y = isVerticalScan ? i : fixedCoord;
            
            if (!BLOCKED_TILES.includes(targetMap.tiles[y][x])) {
                candidatePoints.push({ x, y });
            }
        }
    }

    // Return the median point (Center of the gate)
    if (candidatePoints.length > 0) {
        const midIndex = Math.floor(candidatePoints.length / 2);
        return candidatePoints[midIndex];
    }

    // Ultimate Fallback: Center of map
    return { x: Math.floor(w / 2), y: Math.floor(h / 2) };
};

export const handlePlayerMove = (
    prev: GameState, 
    dx: number, 
    dy: number,
    setActiveModal: (m: string) => void // Callback for death
): GameState => {
    if (prev.stats.hp <= 0) return prev;
    
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
            return { ...prev, playerFacing: facing };
        }
    }
    
    const targetMap = MAPS[nextMapId];
    
    // --- 2. Collision Check (If on same map) ---
    // If we transitioned, findBestEntry guarantees a valid tile, so skip collision check for nextPos
    if (!didTransition) {
        if (!targetMap.tiles[nextPos.y] || !targetMap.tiles[nextPos.y][nextPos.x]) {
             return { ...prev, playerFacing: facing };
        }
        
        // Resolve Effective Tile (Check World Modifications)
        let effectiveTile = targetMap.tiles[nextPos.y][nextPos.x];
        const mapMod = prev.worldModified[nextMapId];
        if (mapMod && mapMod[`${nextPos.y},${nextPos.x}`]) {
            effectiveTile = mapMod[`${nextPos.y},${nextPos.x}`];
        }

        // Block Check
        if (BLOCKED_TILES.includes(effectiveTile)) {
             // If it's a gatherable resource, we allow 'collision' so we can interact with it below
            if (![...TREE_TYPES, 'ROCK'].includes(effectiveTile)) {
                return { ...prev, playerFacing: facing };
            }
        }
    }

    // --- 3. Action Logic ---
    let playerDidAction = false;
    let newAnimations: Record<string, AnimationType> = {};
    let newNumbers: Record<string, number> = {};
    let combatLogs: LogEntry[] = [];
    let newCounters = { ...prev.counters };
    let newInventory = [...prev.inventory];
    let newStats = { ...prev.stats };
    let newSkills = { ...prev.skills };
    let newWorldMod = { ...prev.worldModified };
    let newBestiary = [...prev.bestiary];
    let nextMapEntities = [...targetMap.entities];
    let newWorldTier = prev.worldTier || 0; // Track World Tier

    // Transition Logging
    if (didTransition) {
        const logMsg = `Zone: ${targetMap.name} (${nextPos.x}, ${nextPos.y})`;
        combatLogs.push({ id: uid(), message: logMsg, type: 'DEBUG', timestamp: Date.now() });
    }
    
    // Resolve Target Tile again for Action Logic
    let targetTile = targetMap.tiles[nextPos.y][nextPos.x];
    const mapMod = newWorldMod[nextMapId];
    if (mapMod && mapMod[`${nextPos.y},${nextPos.x}`]) {
        targetTile = mapMod[`${nextPos.y},${nextPos.x}`];
    }
    
    // Check Dungeon Entrance
    if (['ENTRANCE_CRYPT', 'ENTRANCE_CAVE', 'ENTRANCE_MAGMA'].includes(targetTile)) {
        // Generate a unique ID for this dungeon instance location
        const dungeonId = `dungeon_${nextMapId}_${nextPos.x}_${nextPos.y}`;
        let type: 'CRYPT' | 'CAVE' | 'MAGMA' = 'CAVE';
        if (targetTile === 'ENTRANCE_CRYPT') type = 'CRYPT';
        if (targetTile === 'ENTRANCE_MAGMA') type = 'MAGMA';

        if (!MAPS[dungeonId]) {
            // Generate it on the fly
            // Scale based on Max(Zone Difficulty, Player Level)
            const d = map.difficulty || 1;
            // Pass world tier to make dungeons harder as you progress
            MAPS[dungeonId] = generateDungeon(dungeonId, d, type, nextMapId, nextPos, prev.stats.level, newWorldTier);
        }

        const dungeonMap = MAPS[dungeonId];
        // Find the stairs up (start)
        let sx = 1, sy = 1;
        for(let y=0; y<dungeonMap.height; y++){
            for(let x=0; x<dungeonMap.width; x++){
                if (dungeonMap.tiles[y][x] === 'STAIRS_UP') { sx = x; sy = y; break; }
            }
        }

        playSound('UI_CLICK');
        // Transition
        didTransition = true;
        nextMapId = dungeonId;
        nextPos = { x: sx, y: sy };
        nextMapEntities = [...dungeonMap.entities]; // Switch to dungeon entities
        
        combatLogs.push({ id: uid(), message: `Entered ${dungeonMap.name}`, type: 'INFO', timestamp: Date.now() });

        // Initialize Exploration for Dungeon
        const newExp = { ...prev.exploration };
        if (!newExp[nextMapId]) {
            newExp[nextMapId] = Array(dungeonMap.height).fill(null).map(() => Array(dungeonMap.width).fill(0));
        }

        return { 
            ...prev, 
            playerPos: nextPos, 
            currentMapId: nextMapId, 
            exploration: newExp, 
            playerFacing: 'DOWN',
            logs: [...combatLogs, ...prev.logs].slice(0,100)
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

           // Update World Mod (Tree -> Stump, Rock -> Floor)
           const newMapMod = newWorldMod[nextMapId] || {};
           newMapMod[`${nextPos.y},${nextPos.x}`] = isTree ? 'STUMP' : 'FLOOR';
           newWorldMod[nextMapId] = newMapMod;

           return { ...prev, playerFacing: facing, stats: newStats, skills: newSkills, inventory: newInventory, worldModified: newWorldMod, counters: newCounters };
       }
       // If blocked and not gatherable, we already returned above
   }

   // Check Entity Collision
   let entity = targetMap.entities.find(e => e.pos.x === nextPos.x && e.pos.y === nextPos.y);

   if (entity) {
       // Item Drop Pickup
       if (entity.type === 'ITEM_DROP' && entity.loot) {
           playSound('UI_CLICK');
           const item = ITEMS[entity.loot];
           if (item) {
               const pickupItem = { ...item };
               // ONLY assign new UID if it's NOT a stackable generic item (Key, Material, Consumable, GADGET, BLUEPRINT)
               // This ensures 'boss_key' stays 'boss_key' so checks work
               // Added GADGET and BLUEPRINT to stackable list so they keep their IDs
               if (!['MATERIAL', 'CONSUMABLE', 'JUNK', 'KEY', 'COLLECTIBLE', 'GADGET', 'BLUEPRINT'].includes(item.type)) {
                   pickupItem.id = uid();
               }

               // Check if exists in inventory to stack
               const existingIdx = newInventory.findIndex(i => i.id === pickupItem.id);
               if (existingIdx !== -1) {
                   // Stack
                   newInventory = newInventory.map((i, idx) => idx === existingIdx ? { ...i, count: i.count + 1 } : i);
               } else {
                   // Add new
                   newInventory.push(pickupItem);
               }

               combatLogs.push({ id: uid(), message: `Picked up: ${item.name}`, type: 'LOOT', timestamp: Date.now() });
               
               // Remove from map
               nextMapEntities = nextMapEntities.filter(e => e.id !== entity!.id);
               // Allow movement into the tile
               if (!didTransition) {
                   playerDidAction = true;
                   newCounters.steps_taken = (newCounters.steps_taken || 0) + 1;
                   nextPos = { x: nextPos.x, y: nextPos.y };
               }
           }
       }
       
       // Check if this entity acts as a teleporter (has destination AND valid mapId)
       // This handles the STAIRS_UP exit from dungeons too
       else if (entity.destination && entity.destination.mapId && MAPS[entity.destination.mapId]) {
           // Teleport Logic ... (Preserved)
           playSound('UI_CLICK');
           const dest = entity.destination;
           let newExp = { ...prev.exploration };
           
           const logMsg = `Teleport: ${dest.mapId} (${dest.x}, ${dest.y})`;
           combatLogs.push({ id: uid(), message: logMsg, type: 'DEBUG', timestamp: Date.now() });
           
           // Initialize exploration grid if new
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
               ...prev, 
               playerPos: { x: dest.x, y: dest.y }, 
               currentMapId: dest.mapId, 
               exploration: newExp, 
               playerFacing: 'DOWN',
               logs: allLogs
           };
       }

       // Attack Enemies or Destroy Spawners
       else if (entity.type === 'ENEMY' || entity.subType === 'MOB_SPAWNER') {
           // Combat
           playerDidAction = true;
           playSound('ATTACK');
           
           // --- COMBAT CALCULATION ---
           const weapon = prev.equipment.WEAPON?.weaponStats || WEAPON_TEMPLATES['Sword'];
           
           // Determine Scaling Attribute based on weapon
           let scalingStat = 0;
           let skillUsed = 'Strength';

           if (['SWORD', 'AXE', 'MACE', 'SPEAR'].includes(weapon.type)) {
               scalingStat = prev.stats.str;
               skillUsed = 'Strength';
           } else if (['BOW', 'DAGGER'].includes(weapon.type)) {
               scalingStat = prev.stats.dex;
               skillUsed = 'Dexterity';
           } else if (['STAFF', 'ROD'].includes(weapon.type)) {
               scalingStat = prev.stats.int;
               skillUsed = 'Agility'; // Or 'Magic' if we had it, fallback to agility for now or just generic XP
           }

           // Damage Formula: (Weapon Base + Random Var) + (Stat * 1.0)
           // Crit: Multiplier
           let dmg = Math.floor(weapon.minDmg + (Math.random() * (weapon.maxDmg - weapon.minDmg)) + scalingStat); 
           
           if (Math.random() < weapon.critChance) {
               dmg = Math.floor(dmg * weapon.critMult);
               // Add visual flair for crit later?
           }

           const newEnemyHp = (entity.hp || 10) - dmg;
           
           newAnimations['player'] = 'ATTACK';
           newAnimations[entity.id] = 'HURT';
           newNumbers[entity.id] = dmg;
           combatLogs.push({ id: uid(), message: `You hit ${entity.name} for ${dmg}`, type: 'COMBAT', timestamp: Date.now() });

           // Skill XP
           const { updatedSkill, statChanges } = applySkillXp(prev, skillUsed, 5);
           newStats = { ...newStats, ...statChanges };
           newSkills[skillUsed] = updatedSkill;

           if (newEnemyHp <= 0) {
               playSound('KILL');
               nextMapEntities = nextMapEntities.filter(e => e.id !== entity!.id);
               combatLogs.push({ id: uid(), message: `${entity!.name} destroyed!`, type: 'COMBAT', timestamp: Date.now() });
               
               if (entity.type === 'ENEMY') newCounters.enemies_killed = (newCounters.enemies_killed || 0) + 1;
               
               // BOSS DROP LOGIC
               if (entity.subType === 'BOSS') {
                   // Spawn Key on floor
                   nextMapEntities.push({
                       id: `drop_${uid()}`,
                       name: 'Skull Key',
                       type: 'ITEM_DROP',
                       loot: 'boss_key',
                       symbol: 'k',
                       color: 'yellow',
                       pos: entity.pos
                   });
                   combatLogs.push({ id: uid(), message: `${entity.name} dropped a Key!`, type: 'SECRET', timestamp: Date.now() });
                   
                   // WORLD TIER INCREASE EVENT
                   newWorldTier++;
                   playSound('SECRET'); // Reuse sound or new one
                   combatLogs.push({ 
                       id: uid(), 
                       message: `THE WORLD GROWS DARKER... (World Tier ${newWorldTier})`, 
                       type: 'SECRET', 
                       timestamp: Date.now() 
                   });
               }

               // XP and Gold Calculation (EXPONENTIAL)
               // Look up base XP mod from templates if possible
               // Extract base name logic
               let baseName = entity.name.split(' ').pop() || 'Slime';
               if (['King', 'Lord', 'Mother', 'Dragon', 'Beholder', 'Lich'].some(k => entity.name.includes(k))) {
                   // Keep full name for bosses if mapped
                   if (MONSTER_TEMPLATES[entity.name]) baseName = entity.name;
                   // Otherwise try finding partial match in keys
                   else {
                       const match = Object.keys(MONSTER_TEMPLATES).find(k => entity.name.includes(k));
                       if (match) baseName = match;
                   }
               }
               
               const template = MONSTER_TEMPLATES[baseName] || MONSTER_TEMPLATES['Slime'];
               const xpMod = template.xpMod || 1.0;

               // Base Gain: 50 * Mod * 1.15^Level
               let xpGain = Math.floor(50 * xpMod * Math.pow(SCALE_FACTOR, entity.level || 1));
               let goldGain = Math.floor(10 * xpMod * Math.pow(SCALE_FACTOR, entity.level || 1) * (0.5 + Math.random()));
               
               if (entity.isSpawned) {
                   xpGain = Math.max(1, Math.floor(xpGain / 2));
                   goldGain = Math.max(0, Math.floor(goldGain / 4));
               }
               
               if (entity.subType === 'MOB_SPAWNER') {
                   // Spawners give decent XP for destroying
                   xpGain = Math.floor(100 * Math.pow(SCALE_FACTOR, entity.level || 1));
                   goldGain = 0;
               }
               
               // Boss XP Bonus handled by template XP Mod usually, but safe to boost
               if (entity.subType === 'BOSS') {
                   xpGain *= 2; 
                   goldGain *= 2;
               }

               newStats.xp += xpGain;
               newStats.gold += goldGain;
               
               // Drop Calculation
               // If spawned, drop chance is reduced to 25% of normal
               if (Math.random() < (entity.isSpawned ? 0.25 : 1.0)) {
                   // If in a Dungeon, boost rarity!
                   const isDungeon = targetMap.biome === 'DUNGEON';
                   // Boss always drops rare+
                   const rarityBoost = entity.subType === 'BOSS' ? 0.5 : (isDungeon ? 0.2 : 0); 
                   
                   const loot = generateLoot(entity.level || 1, entity.name, rarityBoost);
                   if (loot) {
                       // Boss drop is usually equipment, pushed to inventory
                       const existing = newInventory.find(i => i.id === loot.id); 
                       newInventory.push(loot); 
                       combatLogs.push({ id: uid(), message: `Looted: ${loot.name}`, type: 'LOOT', timestamp: Date.now() });
                   }
               }
               
               // Spawner Loot Logic
               if (entity.subType === 'MOB_SPAWNER') {
                   // Always drop some iron/scraps
                   newInventory.push({...ITEMS['iron_ore'], id: uid()});
                   combatLogs.push({ id: uid(), message: `Looted: Iron Ore`, type: 'LOOT', timestamp: Date.now() });

                   // 10% Chance for Spawner Item
                   if (Math.random() < 0.10) {
                       newInventory.push({ ...ITEMS['mob_spawner_item'], id: uid() });
                       combatLogs.push({ id: uid(), message: `RARE DROP: Cage of Souls!`, type: 'SECRET', timestamp: Date.now() });
                   }

                   // 5% Chance for Dark Gem
                   if (Math.random() < 0.05) {
                       newInventory.push({ ...ITEMS['dark_gem'], id: uid() });
                       combatLogs.push({ id: uid(), message: `RARE DROP: Dark Gem!`, type: 'SECRET', timestamp: Date.now() });
                   }
               }

               if (!newBestiary.includes(entity.name)) newBestiary.push(entity.name);
           } else {
               const idx = nextMapEntities.findIndex(e => e.id === entity!.id);
               if (idx !== -1) nextMapEntities[idx] = { ...entity, hp: newEnemyHp };
           }
           nextPos = prev.playerPos;
           nextMapId = prev.currentMapId;

       } else if (entity.subType === 'CRATE') {
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
       } else if (['NPC', 'OBJECT'].includes(entity.type) && !['PRESSURE_PLATE'].includes(entity.subType || '')) {
           return { ...prev, playerFacing: facing };
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
   // Also handle Spawner Logic
   if (playerDidAction) {
       // Process Spawners first (pass current steps)
       nextMapEntities = processSpawners(nextMapEntities, targetMap, nextPos, newCounters.steps_taken || 0);

       const aiMapState = { ...targetMap, entities: nextMapEntities };
       const { entities: updatedEntities, damageToPlayer, logs: enemyLogs, anims: enemyAnims, numbers: enemyNumbers } 
          = processEnemyTurns({ ...prev, playerPos: nextPos }, aiMapState, nextPos);
      
       nextMapEntities = updatedEntities;
       
       if (damageToPlayer > 0) {
           newStats.hp -= damageToPlayer;
           newCounters.damage_taken = (newCounters.damage_taken || 0) + damageToPlayer;
           newNumbers['player'] = (newNumbers['player'] || 0) + damageToPlayer;
           combatLogs = [...combatLogs, ...enemyLogs];
           newAnimations = { ...newAnimations, ...enemyAnims };
           if (newStats.hp <= 0) setActiveModal('DEATH');
       }
   }

   // --- 5. Final Updates ---
   const finalLogs = [...combatLogs, ...prev.logs].slice(0, 100);
   
   // Explore logic (same as before)
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
       worldTier: newWorldTier // Pass updated tier
   };
};
