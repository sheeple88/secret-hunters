
import { Recipe } from '../../types';

export const ARTISAN_RECIPES: Recipe[] = [
    // --- SMELTING (Furnace) ---
    { id: 'bar_bronze', name: 'Bronze Bar', resultItemId: 'bronze_bar', yield: 1, skill: 'Smithing', levelReq: 1, xpReward: 6, ingredients: [{itemId: 'copper_ore', count: 1}, {itemId: 'tin_ore', count: 1}], station: 'FURNACE' },
    { id: 'bar_iron', name: 'Iron Bar', resultItemId: 'iron_bar', yield: 1, skill: 'Smithing', levelReq: 15, xpReward: 12.5, ingredients: [{itemId: 'iron_ore', count: 1}], station: 'FURNACE' },
    { id: 'bar_steel', name: 'Steel Bar', resultItemId: 'steel_bar', yield: 1, skill: 'Smithing', levelReq: 30, xpReward: 17.5, ingredients: [{itemId: 'iron_ore', count: 1}, {itemId: 'coal_ore', count: 2}], station: 'FURNACE' },
    { id: 'bar_mithril', name: 'Mithril Bar', resultItemId: 'mithril_bar', yield: 1, skill: 'Smithing', levelReq: 50, xpReward: 30, ingredients: [{itemId: 'mithril_ore', count: 1}, {itemId: 'coal_ore', count: 4}], station: 'FURNACE' },
    { id: 'bar_gold', name: 'Gold Bar', resultItemId: 'gold_bar', yield: 1, skill: 'Smithing', levelReq: 40, xpReward: 22.5, ingredients: [{itemId: 'gold_ore', count: 1}], station: 'FURNACE' },

    // --- SMITHING (Anvil) ---
    // Bronze
    { id: 'bronze_dagger', name: 'Bronze Dagger', resultItemId: 'bronze_dagger', yield: 1, skill: 'Smithing', levelReq: 1, xpReward: 12.5, ingredients: [{itemId: 'bronze_bar', count: 1}], station: 'ANVIL' },
    { id: 'bronze_sword', name: 'Bronze Sword', resultItemId: 'bronze_sword', yield: 1, skill: 'Smithing', levelReq: 1, xpReward: 12.5, ingredients: [{itemId: 'bronze_bar', count: 1}], station: 'ANVIL' },
    { id: 'bronze_scimitar', name: 'Bronze Scimitar', resultItemId: 'bronze_scimitar', yield: 1, skill: 'Smithing', levelReq: 5, xpReward: 25, ingredients: [{itemId: 'bronze_bar', count: 2}], station: 'ANVIL' },
    { id: 'bronze_plate', name: 'Bronze Platebody', resultItemId: 'bronze_plate', yield: 1, skill: 'Smithing', levelReq: 18, xpReward: 62.5, ingredients: [{itemId: 'bronze_bar', count: 5}], station: 'ANVIL' },
    
    // Iron
    { id: 'iron_dagger', name: 'Iron Dagger', resultItemId: 'iron_dagger', yield: 1, skill: 'Smithing', levelReq: 15, xpReward: 25, ingredients: [{itemId: 'iron_bar', count: 1}], station: 'ANVIL' },
    { id: 'iron_sword', name: 'Iron Sword', resultItemId: 'iron_sword', yield: 1, skill: 'Smithing', levelReq: 15, xpReward: 25, ingredients: [{itemId: 'iron_bar', count: 1}], station: 'ANVIL' },
    { id: 'iron_plate', name: 'Iron Platebody', resultItemId: 'iron_plate', yield: 1, skill: 'Smithing', levelReq: 33, xpReward: 125, ingredients: [{itemId: 'iron_bar', count: 5}], station: 'ANVIL' },

    // Steel
    { id: 'steel_scimitar', name: 'Steel Scimitar', resultItemId: 'steel_scimitar', yield: 1, skill: 'Smithing', levelReq: 35, xpReward: 75, ingredients: [{itemId: 'steel_bar', count: 2}], station: 'ANVIL' },
    { id: 'steel_plate', name: 'Steel Platebody', resultItemId: 'steel_plate', yield: 1, skill: 'Smithing', levelReq: 48, xpReward: 187.5, ingredients: [{itemId: 'steel_bar', count: 5}], station: 'ANVIL' },

    // --- FLETCHING (Workbench/Knife) ---
    { id: 'arrow_shaft', name: 'Arrow Shafts (15)', resultItemId: 'arrow_shaft', yield: 15, skill: 'Fletching', levelReq: 1, xpReward: 5, ingredients: [{itemId: 'wood', count: 1}], station: 'WORKBENCH' },
    { id: 'shortbow_oak', name: 'Oak Shortbow', resultItemId: 'oak_shortbow', yield: 1, skill: 'Fletching', levelReq: 20, xpReward: 16.5, ingredients: [{itemId: 'oak_log', count: 1}], station: 'WORKBENCH' },
    { id: 'longbow_oak', name: 'Oak Longbow', resultItemId: 'oak_longbow', yield: 1, skill: 'Fletching', levelReq: 25, xpReward: 25, ingredients: [{itemId: 'oak_log', count: 1}], station: 'WORKBENCH' },
    { id: 'shortbow_willow', name: 'Willow Shortbow', resultItemId: 'willow_shortbow', yield: 1, skill: 'Fletching', levelReq: 35, xpReward: 33, ingredients: [{itemId: 'willow_log', count: 1}], station: 'WORKBENCH' },
    
    // --- HERBLORE (Alchemy Table) ---
    { id: 'potion_attack', name: 'Attack Potion', resultItemId: 'potion_attack', yield: 1, skill: 'Herblore', levelReq: 1, xpReward: 25, ingredients: [{itemId: 'clean_guam', count: 1}, {itemId: 'vial_water', count: 1}], station: 'ALCHEMY_TABLE' },
    { id: 'potion_antipoison', name: 'Antipoison', resultItemId: 'potion_antipoison', yield: 1, skill: 'Herblore', levelReq: 5, xpReward: 37.5, ingredients: [{itemId: 'clean_marrentill', count: 1}, {itemId: 'vial_water', count: 1}], station: 'ALCHEMY_TABLE' },
    { id: 'potion_strength', name: 'Strength Potion', resultItemId: 'potion_strength', yield: 1, skill: 'Herblore', levelReq: 12, xpReward: 50, ingredients: [{itemId: 'clean_tarromin', count: 1}, {itemId: 'vial_water', count: 1}], station: 'ALCHEMY_TABLE' },
    
    // --- CRAFTING (Workbench) ---
    { id: 'leather_gloves', name: 'Leather Gloves', resultItemId: 'leather_gloves', yield: 1, skill: 'Crafting', levelReq: 1, xpReward: 13.8, ingredients: [{itemId: 'leather', count: 1}], station: 'WORKBENCH' },
    { id: 'leather_cowl', name: 'Leather Cowl', resultItemId: 'leather_cowl', yield: 1, skill: 'Crafting', levelReq: 1, xpReward: 15, ingredients: [{itemId: 'leather', count: 1}], station: 'WORKBENCH' },
    { id: 'ammy_sapphire', name: 'Sapphire Amulet', resultItemId: 'amulet_sapphire', yield: 1, skill: 'Crafting', levelReq: 24, xpReward: 65, ingredients: [{itemId: 'gold_bar', count: 1}, {itemId: 'cut_sapphire', count: 1}], station: 'FURNACE' },
];
