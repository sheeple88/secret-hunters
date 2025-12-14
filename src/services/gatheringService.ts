
import { GameState, Item, LogEntry } from '../types';
import { RESOURCE_NODES } from '../data/resources/nodes';
import { uid, calculateSkillLevel } from '../constants';
import { playSound } from './audioService';
import { generateLoot } from './itemService';

// Tool Power mapping
const TOOL_POWER = {
    'wood_pickaxe': 1,
    'stone_pickaxe': 2,
    'iron_pickaxe': 4,
    'steel_pickaxe': 6,
    'mithril_pickaxe': 10,
    'wood_axe': 1,
    'stone_axe': 2,
    'iron_axe': 4,
    'steel_axe': 6,
    'mithril_axe': 10
};

export const attemptGather = (
    gameState: GameState, 
    nodeId: string, 
    levelAdjustment: number = 0
): { success: boolean, loot: string | null, xp: number, logs: LogEntry[] } => {
    
    // Find Node Definition
    // 1. Check exact ID match
    let node = RESOURCE_NODES.find(n => n.id === nodeId);
    
    // 2. Fallback: Find by Tile Type (Generic Gathering)
    if (!node) {
        node = RESOURCE_NODES.find(n => n.tileTypes?.includes(nodeId as any));
    }
    
    // 3. Fallback: Level Adjustment (e.g. higher level zones give better generic rocks)
    if (node && node.type === 'ROCK' && levelAdjustment > 5) {
        // Upgrade generic rock to Iron if high level zone
        const ironNode = RESOURCE_NODES.find(n => n.id === 'rock_iron');
        if (ironNode) node = ironNode;
    }

    if (!node) return { success: false, loot: null, xp: 0, logs: [] };

    const skillName = node.type === 'ROCK' ? 'Mining' : node.type === 'TREE' ? 'Logging' : 'Farming';
    const playerLevel = gameState.skills[skillName]?.level || 1;
    const logs: LogEntry[] = [];

    // Check Level Req
    if (playerLevel < node.requiredLevel) {
        logs.push({ id: uid(), message: `You need Level ${node.requiredLevel} ${skillName} to gather this.`, type: 'INFO', timestamp: Date.now() });
        return { success: false, loot: null, xp: 0, logs };
    }

    // Check Tool
    const weapon = gameState.equipment.WEAPON;
    // Basic check: does name contain "Pickaxe" or "Axe"?
    // In a real system we'd have a 'toolType' property on items. 
    // Using string matching for now to preserve existing item data structure.
    const toolName = weapon?.name.toLowerCase() || "";
    const hasTool = node.requiredTool === 'PICKAXE' ? toolName.includes('pickaxe') : 
                    node.requiredTool === 'AXE' ? toolName.includes('axe') : 
                    node.requiredTool === 'SCYTHE' ? true : true; // Hands fine for farming

    // Starter tools handling (if no tool equipped, assume basic hands/bad tool)
    let toolPower = 0;
    if (hasTool && weapon) {
        // @ts-ignore
        toolPower = TOOL_POWER[weapon.id] || 1; 
    } else {
        // Allow gathering basics without tool but very slow
        if (node.requiredLevel > 1) {
             logs.push({ id: uid(), message: `You need a ${node.requiredTool.toLowerCase()} to gather this.`, type: 'INFO', timestamp: Date.now() });
             return { success: false, loot: null, xp: 0, logs };
        }
        toolPower = 0.5;
    }

    // Success Formula: (Level + ToolPower) vs (Hardness + 10)
    // RuneScape style: ticks to deplete. Simplified: One click = one attempt.
    const successChance = Math.min(0.95, (playerLevel + (toolPower * 5)) / (node.hardenss + 10));
    
    if (Math.random() < successChance) {
        // Success
        playSound('GATHER');
        
        // Determine Loot
        let lootId = node.dropTable[0].itemId;
        const roll = Math.random();
        let cumulative = 0;
        for(const drop of node.dropTable) {
            cumulative += drop.chance;
            if (roll <= cumulative) {
                lootId = drop.itemId;
                // Rare gem check handled by array order usually, simplified here
            }
        }

        logs.push({ id: uid(), message: `You gather some ${node.name}.`, type: 'LOOT', timestamp: Date.now() });
        
        return { success: true, loot: lootId, xp: node.xp, logs };
    } else {
        // Fail
        playSound('BUMP');
        // logs.push({ id: uid(), message: "You fail to gather anything.", type: 'INFO', timestamp: Date.now() });
        return { success: false, loot: null, xp: 0, logs };
    }
};
