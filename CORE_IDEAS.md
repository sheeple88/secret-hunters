
# Secret Hunters - Core Design Checklist

This document tracks the core philosophy and feature set of "Secret Hunters".
**Rule:** All future updates must align with these pillars and ensure no regression in Mobile compatibility or Core Mechanics.

## 1. The Core Loop (The "Soul")
*   **Goal:** The primary method of gaining significant power is finding **Secrets**, not just grinding XP.
*   **Secrets:** Hidden interactions, specific tile triggers, or collection milestones that unlock **Perks**.
*   **Perks:** Equipable passives that drastically change playstyle (e.g., "Midas Touch", "Lava Walk").

## 2. Gameplay Mechanics
*   [x] **Grid-Based Movement:** 
    *   Desktop: WASD / Arrow Keys.
    *   Mobile: On-screen D-Pad (Must remain accessible).
    *   Logic: Collision detection, map transitions, interaction priority.
*   [x] **Combat:** 
    *   "Bump" combat (move into enemy to attack).
    *   Turn-based logic (Player move -> Enemy reaction).
    *   Stats: STR (Melee), DEX (Bow/Crit), INT (Magic/Crafting), HP, Regen.
*   [x] **Inventory & Equipment:**
    *   Slots: Head, Body, Legs, Weapon, Offhand, Accessory.
    *   Rarity System: Common -> Mythic.
*   [x] **Procedural Loot Generation:**
    *   **Affix System:** Procedurally generated names that correlate to stats (e.g., "Strong" adds STR).
    *   **Contextual Loot:** Enemies drop gear types matching their theme (e.g., Cultists drop Robes/Staves).
    *   **Dynamic Scaling:** Item stats scale with Item Level and Rarity.
*   [ ] **Advanced Gear Progression:**
    *   **Upgrading:** Use Gold/Anvil to increase item stats (+1, +2).
    *   **Salvaging:** Break down unwanted gear for crafting materials.
    *   **Legendary Effects:** Unique passives on high-tier loot (e.g., "Chance to freeze enemies").
    *   **Set Bonuses:** Stat multipliers for wearing matching armor sets (e.g., "Cultist Set").
*   [x] **Skill System:**
    *   Usage-based progression (XP gained by doing actions).
    *   Categories: Combat (Strength/Dexterity), Gathering (Mining/Woodcutting), Artisan (Alchemy/Crafting).
    *   Leveling skills grants base stat increases (e.g., Mining levels increase Strength).
*   [x] **Crafting:**
    *   Resource gathering (Trees, Rocks).
    *   Specific Stations (Anvil, Workbench, Alchemy).
    *   Recipe-based unlocking.
*   [x] **Puzzles:**
    *   Push Blocks (Sokoban style).
    *   Pressure Plates.
    *   Hidden Walls/Doors.

## 3. User Experience (UX) & Tech
*   [x] **Mobile First / Hybrid:** 
    *   Game board must **auto-scale** to fit width.
    *   Touch controls must be available on small screens.
    *   No hover-only tooltips (must have click/tap alternatives).
*   [x] **Visual Style:** 
    *   16x16 Pixel Art (SVG based for crisp scaling).
    *   Dark UI theme (Stone/Fantasy).
*   [x] **AI Integration:** 
    *   Gemini API used for *Flavor* (Rumors, Lore), not mechanics.
    *   Falls back gracefully if API key is missing.

## 4. Content Checklist
*   [x] **Biomes:** Grass, Desert, Snow, Dungeon (partially implemented in generator).
*   [x] **Bestiary:** Tracks enemies seen.
*   [x] **Journal:** Tracks unlocked Secrets and Active Quests.
*   [x] **Sound/Audio:** Procedural Synth Audio implemented.
*   [x] **Save System:** LocalStorage save/load with persistency for cut trees/mined rocks.

## 5. The "Secret Hunter" Vibe
*   The game should feel mysterious.
*   Rumors from NPCs should be vague.
*   The map should have "fog of war" to encourage exploration.
*   There should always be "one more thing" to find.

## 6. The Goal List (The "Dream")
*   **1,000 Secrets to Find:** From simple hidden walls to ARG-level complex puzzles.
*   **10,000+ Armor & Weapon Combinations:** Infinite procedural generation depth.
*   **Leveling up to DuoDecillion:** Uncapped progression embracing incremental mechanics.
*   **20 Magic Types:** Elemental, Void, Time, Blood, Nature, and more.
*   **500 Quests:** Ranging from daily fetch quests to epic multi-stage narratives.
*   **20 Towns:** Unique hubs with distinct biomes, cultures, and economy.
*   **250 Monster Types:** A massive bestiary to hunt and catalogue.
