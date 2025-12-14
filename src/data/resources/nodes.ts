
import { TileType } from '../../types';

export interface ResourceNode {
    id: string;
    name: string;
    type: 'ROCK' | 'TREE' | 'PLANT' | 'FISHING';
    requiredLevel: number;
    requiredTool: 'PICKAXE' | 'AXE' | 'SCYTHE' | 'ROD';
    xp: number;
    dropTable: { itemId: string, chance: number }[];
    respawnTime: number;
    hardenss: number; // Higher = harder to gather
    tileTypes?: TileType[]; // Tiles that represent this node
}

export const RESOURCE_NODES: ResourceNode[] = [
    // --- WOODCUTTING ---
    {
        id: 'tree_normal',
        name: 'Tree',
        type: 'TREE',
        requiredLevel: 1,
        requiredTool: 'AXE',
        xp: 25,
        dropTable: [{ itemId: 'wood', chance: 1.0 }],
        respawnTime: 10000,
        hardenss: 0,
        tileTypes: ['TREE']
    },
    {
        id: 'tree_oak',
        name: 'Oak Tree',
        type: 'TREE',
        requiredLevel: 15,
        requiredTool: 'AXE',
        xp: 37.5,
        dropTable: [{ itemId: 'oak_log', chance: 1.0 }],
        respawnTime: 15000,
        hardenss: 10,
        tileTypes: ['OAK_TREE']
    },
    {
        id: 'tree_willow',
        name: 'Willow Tree',
        type: 'TREE',
        requiredLevel: 30,
        requiredTool: 'AXE',
        xp: 67.5,
        dropTable: [{ itemId: 'willow_log', chance: 1.0 }],
        respawnTime: 20000,
        hardenss: 25,
        tileTypes: ['BIRCH_TREE'] // Reusing Birch asset for Willow logic
    },
    {
        id: 'tree_yew',
        name: 'Yew Tree',
        type: 'TREE',
        requiredLevel: 60,
        requiredTool: 'AXE',
        xp: 175,
        dropTable: [{ itemId: 'yew_log', chance: 1.0 }],
        respawnTime: 40000,
        hardenss: 50,
        tileTypes: ['PINE_TREE'] // Reusing Pine asset for Yew logic
    },

    // --- MINING ---
    {
        id: 'rock_copper',
        name: 'Copper Vein',
        type: 'ROCK',
        requiredLevel: 1,
        requiredTool: 'PICKAXE',
        xp: 17.5,
        dropTable: [{ itemId: 'copper_ore', chance: 1.0 }, { itemId: 'uncut_sapphire', chance: 0.01 }],
        respawnTime: 5000,
        hardenss: 0,
        tileTypes: ['ROCK'] // Basic rocks are copper/tin in low level zones
    },
    {
        id: 'rock_iron',
        name: 'Iron Ore',
        type: 'ROCK',
        requiredLevel: 15,
        requiredTool: 'PICKAXE',
        xp: 35,
        dropTable: [{ itemId: 'iron_ore', chance: 1.0 }, { itemId: 'uncut_emerald', chance: 0.01 }],
        respawnTime: 10000,
        hardenss: 15,
        tileTypes: ['STONE_BRICK'] // Placeholder mapping
    },
    {
        id: 'rock_coal',
        name: 'Coal Deposit',
        type: 'ROCK',
        requiredLevel: 30,
        requiredTool: 'PICKAXE',
        xp: 50,
        dropTable: [{ itemId: 'coal_ore', chance: 1.0 }, { itemId: 'uncut_ruby', chance: 0.01 }],
        respawnTime: 15000,
        hardenss: 30,
        tileTypes: ['OBSIDIAN']
    },
    {
        id: 'rock_mithril',
        name: 'Mithril Ore',
        type: 'ROCK',
        requiredLevel: 55,
        requiredTool: 'PICKAXE',
        xp: 80,
        dropTable: [{ itemId: 'mithril_ore', chance: 1.0 }, { itemId: 'uncut_diamond', chance: 0.01 }],
        respawnTime: 60000,
        hardenss: 60
    },
    
    // --- HERBLORE / FARMING ---
    {
        id: 'herb_patch',
        name: 'Herb Patch',
        type: 'PLANT',
        requiredLevel: 1,
        requiredTool: 'SCYTHE',
        xp: 10,
        dropTable: [{ itemId: 'grimy_guam', chance: 0.7 }, { itemId: 'grimy_marrentill', chance: 0.3 }],
        respawnTime: 20000,
        hardenss: 0,
        tileTypes: ['FLOWER']
    }
];
