
// Helper for pixel art assets
export const createAsset = (svgContent: string) => 
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${svgContent}</svg>`)}`;

// --- GENERATORS (Save space & allow variations) ---

const humanoid = (shirt: string, pants: string = '#000', skin: string = '#fca5a5', hair: string = '#451a03', hat?: string) => `
    <rect x="5" y="11" width="2" height="4" fill="${pants}"/>
    <rect x="9" y="11" width="2" height="4" fill="${pants}"/>
    <rect x="4" y="6" width="8" height="5" fill="${shirt}"/>
    <rect x="4" y="1" width="8" height="5" fill="${skin}"/>
    ${hat ? hat : `<rect x="4" y="0" width="8" height="2" fill="${hair}"/>`}
    <rect x="6" y="3" width="1" height="1" fill="#000"/>
    <rect x="10" y="3" width="1" height="1" fill="#000"/>
`;

const blob = (color: string, eyes: boolean = true) => `
    <rect x="3" y="6" width="10" height="8" fill="${color}" rx="1"/>
    ${eyes ? `<rect x="5" y="8" width="1" height="1" fill="#000"/><rect x="9" y="8" width="1" height="1" fill="#000"/>` : ''}
`;

const beast = (color: string) => `
    <rect x="4" y="6" width="8" height="6" fill="${color}"/>
    <rect x="2" y="4" width="4" height="4" fill="${color}"/>
    <rect x="3" y="5" width="1" height="1" fill="#000"/>
`;

// --- ASSET DEFINITIONS ---

export const ASSETS = {
  // Tiles
  GRASS: createAsset(`
    <rect width="16" height="16" fill="#4ade80"/>
    <rect x="2" y="3" width="1" height="1" fill="#22c55e" opacity="0.5"/>
    <rect x="8" y="12" width="1" height="1" fill="#22c55e" opacity="0.5"/>
    <rect x="12" y="5" width="1" height="1" fill="#22c55e" opacity="0.5"/>
  `),
  DIRT_PATH: createAsset(`
    <rect width="16" height="16" fill="#a8a29e"/>
    <rect x="0" y="0" width="16" height="16" fill="#d6d3d1"/>
    <rect x="2" y="2" width="2" height="1" fill="#a8a29e" opacity="0.5"/>
    <rect x="10" y="5" width="1" height="2" fill="#a8a29e" opacity="0.5"/>
    <rect x="6" y="12" width="2" height="1" fill="#a8a29e" opacity="0.5"/>
  `),
  WALL: createAsset(`
    <rect width="16" height="16" fill="#57534e"/>
    <rect x="0" y="3" width="16" height="1" fill="#292524" opacity="0.4"/>
    <rect x="0" y="8" width="16" height="1" fill="#292524" opacity="0.4"/>
    <rect x="0" y="13" width="16" height="1" fill="#292524" opacity="0.4"/>
    <rect x="8" y="4" width="1" height="4" fill="#292524" opacity="0.4"/>
    <rect x="4" y="9" width="1" height="4" fill="#292524" opacity="0.4"/>
  `),
  ROOF: createAsset(`
    <rect width="16" height="16" fill="#7c2d12"/>
    <path d="M0,4 L16,4 M0,8 L16,8 M0,12 L16,12" stroke="#431407" opacity="0.5"/>
    <path d="M4,0 L4,4 M12,0 L12,4 M8,4 L8,8 M4,8 L4,12 M12,8 L12,12 M8,12 L8,16" stroke="#431407" opacity="0.5"/>
  `),
  CRACKED_WALL: createAsset(`
    <rect width="16" height="16" fill="#57534e"/>
    <rect x="0" y="3" width="16" height="1" fill="#292524" opacity="0.4"/>
    <rect x="0" y="8" width="16" height="1" fill="#292524" opacity="0.4"/>
    <path d="M4,4 L6,8 L4,12" stroke="#000" stroke-width="1" opacity="0.5"/>
    <path d="M12,2 L10,6 L12,10" stroke="#000" stroke-width="1" opacity="0.5"/>
  `),
  WATER: createAsset(`
    <rect width="16" height="16" fill="#3b82f6"/>
    <rect x="2" y="4" width="4" height="1" fill="#93c5fd" opacity="0.6"/>
    <rect x="9" y="9" width="5" height="1" fill="#93c5fd" opacity="0.6"/>
  `),
  DEEP_WATER: createAsset(`
    <rect width="16" height="16" fill="#1e3a8a"/>
    <rect x="3" y="5" width="3" height="1" fill="#3b82f6" opacity="0.4"/>
    <rect x="10" y="10" width="4" height="1" fill="#3b82f6" opacity="0.4"/>
  `),
  FLOOR: createAsset(`
    <rect width="16" height="16" fill="#a8a29e"/>
    <rect x="0" y="0" width="16" height="1" fill="#78716c"/>
    <rect x="0" y="0" width="1" height="16" fill="#78716c"/>
    <rect x="4" y="4" width="1" height="1" fill="#78716c" opacity="0.5"/>
  `),
  PLANK: createAsset(`
    <rect width="16" height="16" fill="#92400e"/>
    <rect x="0" y="3" width="16" height="1" fill="#713f12"/>
    <rect x="0" y="7" width="16" height="1" fill="#713f12"/>
    <rect x="0" y="11" width="16" height="1" fill="#713f12"/>
    <rect x="0" y="15" width="16" height="1" fill="#713f12"/>
  `),
  LAVA: createAsset(`
    <rect width="16" height="16" fill="#ea580c"/>
    <rect x="2" y="3" width="2" height="2" fill="#facc15" opacity="0.8"/>
    <rect x="10" y="10" width="3" height="2" fill="#facc15" opacity="0.8"/>
    <rect x="6" y="6" width="2" height="2" fill="#f87171"/>
  `),
  DOOR: createAsset(`
    <rect x="2" y="1" width="12" height="14" fill="#78350f"/>
    <rect x="3" y="2" width="10" height="12" fill="#92400e"/>
    <circle cx="11" cy="9" r="1" fill="#facc15"/>
    <rect x="3" y="14" width="10" height="1" fill="#000" opacity="0.3"/>
  `),
  LOCKED_DOOR: createAsset(`
    <rect x="2" y="1" width="12" height="14" fill="#3f3f46"/>
    <rect x="3" y="2" width="10" height="12" fill="#52525b"/>
    <rect x="3" y="2" width="10" height="12" fill="none" stroke="#27272a" stroke-width="1"/>
    <rect x="7" y="7" width="2" height="4" fill="#facc15"/>
    <circle cx="8" cy="7" r="2" fill="#facc15"/>
    <circle cx="8" cy="7" r="1" fill="#000"/>
  `),
  VOID: createAsset(`
    <rect width="16" height="16" fill="#000"/>
  `),
  SAND: createAsset(`
    <rect width="16" height="16" fill="#fde047"/>
    <rect x="2" y="2" width="1" height="1" fill="#d97706" opacity="0.3"/>
    <rect x="12" y="10" width="1" height="1" fill="#d97706" opacity="0.3"/>
  `),
  MUD: createAsset(`
    <rect width="16" height="16" fill="#573a2e"/>
    <rect x="3" y="3" width="2" height="2" fill="#3e2921" opacity="0.5"/>
  `),
  SNOW: createAsset(`
    <rect width="16" height="16" fill="#f8fafc"/>
    <rect x="3" y="3" width="1" height="1" fill="#cbd5e1"/>
    <rect x="12" y="8" width="1" height="1" fill="#cbd5e1"/>
  `),
  ICE: createAsset(`
    <rect width="16" height="16" fill="#cffafe"/>
    <path d="M4,4 L12,12 M12,4 L4,12" stroke="#a5f3fc" stroke-width="1" opacity="0.7"/>
  `),
  STONE_BRICK: createAsset(`
    <rect width="16" height="16" fill="#44403c"/>
    <rect x="0" y="4" width="16" height="1" fill="#292524"/>
    <rect x="0" y="9" width="16" height="1" fill="#292524"/>
    <rect x="0" y="14" width="16" height="1" fill="#292524"/>
    <rect x="8" y="0" width="1" height="4" fill="#292524"/>
    <rect x="4" y="5" width="1" height="4" fill="#292524"/>
  `),
  OBSIDIAN: createAsset(`
    <rect width="16" height="16" fill="#1c1917"/>
    <path d="M4,4 L10,2 L14,8 L8,14 L2,10 Z" fill="#292524"/>
    <path d="M10,2 L12,6 M14,8 L10,10" stroke="#44403c" stroke-width="0.5"/>
  `),
  STAIRS_DOWN: createAsset(`
    <rect width="16" height="16" fill="#292524"/>
    <rect x="2" y="2" width="12" height="2" fill="#57534e"/>
    <rect x="2" y="5" width="12" height="2" fill="#44403c"/>
    <rect x="2" y="8" width="12" height="2" fill="#292524"/>
    <rect x="2" y="11" width="12" height="2" fill="#1c1917"/>
  `),
  STAIRS_UP: createAsset(`
    <rect width="16" height="16" fill="#292524"/>
    <rect x="2" y="11" width="12" height="2" fill="#57534e"/>
    <rect x="2" y="8" width="12" height="2" fill="#44403c"/>
    <rect x="2" y="5" width="12" height="2" fill="#292524"/>
    <rect x="2" y="2" width="12" height="2" fill="#1c1917"/>
  `),

  // Objects (Overlays)
  TREE: createAsset(`
    <rect x="6" y="10" width="4" height="6" fill="#78350f"/>
    <rect x="4" y="2" width="8" height="8" fill="#15803d"/>
    <rect x="3" y="4" width="10" height="4" fill="#15803d"/>
    <rect x="5" y="3" width="1" height="1" fill="#4ade80" opacity="0.5"/>
  `),
  OAK_TREE: createAsset(`
    <rect x="6" y="10" width="4" height="6" fill="#78350f"/>
    <circle cx="8" cy="6" r="5" fill="#15803d"/>
    <circle cx="6" cy="5" r="3" fill="#16a34a"/>
    <circle cx="10" cy="5" r="2" fill="#16a34a"/>
  `),
  BIRCH_TREE: createAsset(`
    <rect x="7" y="6" width="2" height="10" fill="#e5e5e5"/>
    <rect x="7" y="8" width="2" height="1" fill="#404040"/>
    <rect x="7" y="12" width="2" height="1" fill="#404040"/>
    <path d="M8,1 L4,6 L12,6 Z" fill="#bef264"/>
    <path d="M8,4 L3,9 L13,9 Z" fill="#a3e635"/>
  `),
  PINE_TREE: createAsset(`
    <rect x="7" y="12" width="2" height="4" fill="#3f2c20"/>
    <path d="M2,13 L8,4 L14,13 Z" fill="#065f46"/>
    <path d="M3,9 L8,2 L13,9 Z" fill="#047857"/>
  `),
  STUMP: createAsset(`
    <rect x="6" y="10" width="4" height="4" fill="#78350f"/>
    <rect x="6" y="10" width="4" height="1" fill="#92400e"/>
    <rect x="7" y="10" width="2" height="1" fill="#b45309"/>
  `),

  ROCK: createAsset(`
    <rect x="4" y="8" width="8" height="6" fill="#78716c" rx="1"/>
    <rect x="5" y="9" width="2" height="1" fill="#d6d3d1" opacity="0.5"/>
  `),
  CACTUS: createAsset(`
    <rect x="7" y="4" width="2" height="12" fill="#166534"/>
    <rect x="4" y="6" width="3" height="2" fill="#166534"/>
    <rect x="4" y="6" width="2" height="4" fill="#166534"/>
    <rect x="9" y="8" width="3" height="2" fill="#166534"/>
    <rect x="10" y="5" width="2" height="5" fill="#166534"/>
  `),
  GRAVESTONE: createAsset(`
    <path d="M4,16 L4,6 Q8,2 12,6 L12,16 Z" fill="#525252"/>
    <rect x="6" y="8" width="4" height="1" fill="#262626"/>
    <rect x="7.5" y="6.5" width="1" height="4" fill="#262626"/>
  `),
  SHRINE: createAsset(`
    <rect x="2" y="12" width="12" height="3" fill="#581c87"/>
    <rect x="4" y="10" width="8" height="2" fill="#6b21a8"/>
    <rect x="6" y="4" width="4" height="6" fill="#a855f7"/>
    <circle cx="8" cy="2" r="2" fill="#facc15" opacity="0.5"/>
  `),
  CHEST: createAsset(`
    <rect x="2" y="5" width="12" height="10" fill="#a16207" stroke="#422006" stroke-width="1"/>
    <rect x="2" y="8" width="12" height="1" fill="#422006" opacity="0.3"/>
    <rect x="7" y="8" width="2" height="2" fill="#facc15"/>
  `),
  LOCKED_CHEST: createAsset(`
    <rect x="2" y="5" width="12" height="10" fill="#3f3f46" stroke="#18181b" stroke-width="1"/>
    <rect x="2" y="8" width="12" height="1" fill="#18181b" opacity="0.3"/>
    <rect x="6" y="7" width="4" height="4" fill="#fbbf24"/>
    <circle cx="8" cy="9" r="1" fill="#000"/>
  `),
  BED: createAsset(`
    <rect x="2" y="4" width="12" height="11" fill="#dc2626"/>
    <rect x="2" y="4" width="12" height="3" fill="#fef2f2"/>
  `),
  FLOWER: createAsset(`
    <rect x="6" y="8" width="1" height="4" fill="#166534"/>
    <circle cx="5" cy="7" r="2" fill="#f472b6"/>
    <circle cx="8" cy="7" r="2" fill="#f472b6"/>
    <circle cx="6.5" cy="5" r="2" fill="#f472b6"/>
    <circle cx="6.5" cy="7" r="1" fill="#fef08a"/>
  `),
  WATERFALL: createAsset(`
    <rect width="16" height="16" fill="#3b82f6"/>
    <rect x="3" y="0" width="2" height="16" fill="#bfdbfe" opacity="0.7"/>
    <rect x="8" y="0" width="2" height="16" fill="#bfdbfe" opacity="0.5"/>
  `),
  BONES_DECOR: createAsset(`
    <rect x="6" y="6" width="4" height="1" fill="#e5e5e5"/>
    <circle cx="5" cy="6.5" r="1" fill="#e5e5e5"/>
    <circle cx="11" cy="6.5" r="1" fill="#e5e5e5"/>
  `),
  WAYPOINT: createAsset(`
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#60a5fa"/>
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#93c5fd" opacity="0.5" transform="scale(0.8) translate(1.6, 2)"/>
    <circle cx="8" cy="8" r="1" fill="#fff" class="animate-pulse"/>
  `),
  WAYPOINT_ACTIVE: createAsset(`
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#a855f7"/>
    <path d="M8,16 L4,10 L8,2 L12,10 Z" fill="#d8b4fe" opacity="0.5" transform="scale(0.8) translate(1.6, 2)"/>
    <circle cx="8" cy="8" r="2" fill="#fff" class="animate-ping"/>
  `),
  SIGNPOST: createAsset(`
    <rect x="7" y="8" width="2" height="8" fill="#78350f"/>
    <rect x="2" y="4" width="12" height="5" fill="#a16207" stroke="#422006"/>
    <path d="M3,5 L13,5 M3,7 L13,7" stroke="#713f12" opacity="0.5"/>
  `),
  ANVIL: createAsset(`
    <rect x="2" y="6" width="12" height="4" fill="#374151"/>
    <rect x="4" y="10" width="8" height="6" fill="#1f2937"/>
    <path d="M2,6 L0,4 L2,4" fill="#374151"/>
  `),
  WORKBENCH: createAsset(`
    <rect x="1" y="6" width="14" height="4" fill="#92400e"/>
    <rect x="2" y="10" width="2" height="6" fill="#78350f"/>
    <rect x="12" y="10" width="2" height="6" fill="#78350f"/>
    <rect x="3" y="5" width="4" height="1" fill="#fcd34d"/>
  `),
  ALCHEMY_TABLE: createAsset(`
    <rect x="2" y="6" width="12" height="8" fill="#5D4037"/>
    <rect x="1" y="6" width="14" height="2" fill="#8D6E63"/>
    <circle cx="4" cy="4" r="2" fill="#E91E63" opacity="0.8"/>
    <rect x="3" y="3" width="2" height="3" fill="#E91E63" opacity="0.8"/>
    <rect x="8" y="2" width="2" height="4" fill="#2196F3" opacity="0.8"/>
    <circle cx="12" cy="5" r="1.5" fill="#4CAF50" opacity="0.8"/>
  `),
  RELIC: createAsset(`
    <circle cx="8" cy="8" r="4" fill="#fbbf24"/>
    <circle cx="8" cy="8" r="2" fill="#fef3c7" opacity="0.8"/>
    <path d="M8,2 L9,6 L14,8 L9,10 L8,14 L7,10 L2,8 L7,6 Z" fill="#f59e0b" opacity="0.5"/>
  `),
  PRESSURE_PLATE: createAsset(`
    <rect x="3" y="3" width="10" height="10" fill="#57534e"/>
    <rect x="4" y="4" width="8" height="8" fill="#44403c"/>
    <rect x="5" y="5" width="6" height="6" fill="#292524" opacity="0.5"/>
  `),
  PUSH_BLOCK: createAsset(`
    <rect x="1" y="1" width="14" height="14" fill="#a8a29e" stroke="#57534e" stroke-width="1"/>
    <path d="M3,3 L13,13 M13,3 L3,13" stroke="#78716c" stroke-width="1" opacity="0.5"/>
  `),
  CRATE: createAsset(`
    <rect x="2" y="2" width="12" height="12" fill="#92400e"/>
    <rect x="2" y="2" width="12" height="12" fill="none" stroke="#713f12" stroke-width="2"/>
    <path d="M2,2 L14,14 M14,2 L2,14" stroke="#713f12" stroke-width="1"/>
  `),

  // Weapons
  WEAPON_SWORD: createAsset(`<path d="M6,14 L4,12 L10,6 L12,8 Z" fill="#9ca3af"/><path d="M10,6 L14,2" stroke="#e5e7eb" stroke-width="2"/><circle cx="5" cy="13" r="1" fill="#4b5563"/>`),
  WEAPON_AXE: createAsset(`<rect x="7" y="10" width="2" height="6" fill="#78350f"/><path d="M6,10 L4,6 Q8,2 12,6 L10,10 Z" fill="#94a3b8"/><path d="M9,10 L12,7" stroke="#cbd5e1" stroke-width="1"/>`),
  WEAPON_MACE: createAsset(`<rect x="7" y="8" width="2" height="8" fill="#78350f"/><circle cx="8" cy="6" r="3" fill="#475569"/><circle cx="8" cy="6" r="1" fill="#94a3b8"/><path d="M6,4 L5,3 M10,4 L11,3 M6,8 L5,9 M10,8 L11,9" stroke="#cbd5e1" stroke-width="1"/>`),
  WEAPON_DAGGER: createAsset(`<path d="M7,12 L9,12 L8,6 Z" fill="#cbd5e1"/><rect x="7" y="12" width="2" height="3" fill="#475569"/>`),
  WEAPON_SPEAR: createAsset(`<rect x="7" y="4" width="2" height="12" fill="#78350f"/><path d="M7,4 L8,1 L9,4" fill="#94a3b8"/>`),
  WEAPON_BOW: createAsset(`<path d="M4,4 Q12,8 4,12" stroke="#78350f" stroke-width="2" fill="none"/><path d="M4,4 L4,12" stroke="#e5e7eb" stroke-width="0.5" opacity="0.5"/>`),
  WEAPON_STAFF: createAsset(`<rect x="7" y="2" width="2" height="14" fill="#78350f"/><circle cx="8" cy="2" r="2" fill="#ef4444" opacity="0.8"/><circle cx="8" cy="2" r="1" fill="#fca5a5" opacity="0.8"/>`),
  WEAPON_ROD: createAsset(`<path d="M12,2 L4,14" stroke="#d97706" stroke-width="2"/><path d="M12,2 L14,6 L14,10" stroke="#e5e5e5" stroke-width="1" fill="none"/>`),

  // Entities (Using Procedural Generators)
  PLAYER: createAsset(humanoid('#3b82f6', '#1e3a8a')),
  
  NPC: createAsset(humanoid('#b91c1c', '#7f1d1d', '#fca5a5', '#000', `<polygon points="3,1 8,-3 13,1" fill="#7f1d1d"/>`)),
  MAYOR: createAsset(humanoid('#1e3a8a', '#000', '#fca5a5', '#000', `<rect x="3" y="0" width="10" height="3" fill="#000"/><rect x="4" y="3" width="8" height="1" fill="#000"/>`)),
  MERCHANT: createAsset(humanoid('#166534', '#facc15')),
  
  CULTIST: createAsset(humanoid('#4c1d95', '#5b21b6', '#000', '#000')),
  KNIGHT: createAsset(humanoid('#9ca3af', '#4b5563', '#9ca3af', '#000')),
  VAMPIRE: createAsset(humanoid('#000', '#000', '#fecaca', '#000', `<rect x="6" y="2" width="4" height="4" fill="#fecaca"/>`)),
  ZOMBIE: createAsset(humanoid('#4d7c0f', '#3f6212', '#65a30d', '#000')),

  // Blobs
  SLIME: createAsset(blob('#4ade80')),
  ICE_GOLEM: createAsset(blob('#bae6fd')),
  EARTH_GOLEM: createAsset(blob('#57534e')),
  
  // Beasts
  RAT: createAsset(`<rect x="2" y="10" width="10" height="5" fill="#78716c"/><rect x="12" y="11" width="3" height="1" fill="#ea580c"/>`),
  WOLF: createAsset(beast('#94a3b8')),
  BEAR: createAsset(beast('#5c3a21')),
  
  // Unique Monsters
  SPIDER: createAsset(`<rect x="6" y="6" width="4" height="4" fill="#171717"/><path d="M4,4 L6,6 M12,4 L10,6 M4,12 L6,10 M12,12 L10,10" stroke="#171717" stroke-width="1"/>`),
  GOBLIN: createAsset(`<rect x="5" y="5" width="6" height="6" fill="#166534"/><rect x="4" y="6" width="1" height="2" fill="#166534"/><rect x="11" y="6" width="1" height="2" fill="#166534"/>`),
  GHOST: createAsset(`<path d="M4,14 L4,6 Q4,2 8,2 Q12,2 12,6 L12,14 L10,12 L8,14 L6,12 L4,14 Z" fill="#e5e7eb" opacity="0.8"/><rect x="6" y="6" width="1" height="2" fill="#000"/><rect x="9" y="6" width="1" height="2" fill="#000"/>`),
  BAT: createAsset(`<path d="M2,6 Q8,10 14,6 L12,10 L8,12 L4,10 Z" fill="#171717"/><circle cx="6" cy="9" r="0.5" fill="#ef4444"/><circle cx="10" cy="9" r="0.5" fill="#ef4444"/>`),
  SKELETON: createAsset(`<rect x="6" y="2" width="4" height="4" fill="#e5e5e5"/><rect x="7" y="6" width="2" height="6" fill="#e5e5e5"/><rect x="5" y="7" width="6" height="1" fill="#e5e5e5"/>`),
  SNAKE: createAsset(`<path d="M2,12 Q4,8 6,12 Q8,16 10,12 L14,10" fill="none" stroke="#65a30d" stroke-width="2"/><circle cx="14" cy="10" r="1" fill="#65a30d"/>`),
  SCORPION: createAsset(`<rect x="5" y="8" width="6" height="4" fill="#a16207"/><path d="M4,8 L2,6 M12,8 L14,6 M11,8 L13,4" stroke="#a16207" stroke-width="2"/>`),
  MINOTAUR: createAsset(`<rect x="4" y="4" width="8" height="10" fill="#573a2e"/><path d="M4,4 L2,2 M12,4 L14,2" stroke="#e5e5e5" stroke-width="2"/><circle cx="6" cy="7" r="1" fill="red"/><circle cx="10" cy="7" r="1" fill="red"/><rect x="6" y="10" width="4" height="4" fill="#000" opacity="0.3"/>`),
  BEHOLDER: createAsset(`<circle cx="8" cy="8" r="6" fill="#4c1d95"/><circle cx="8" cy="8" r="3" fill="#fef08a"/><circle cx="8" cy="8" r="1" fill="#000"/><path d="M8,2 L8,0 M14,8 L16,8 M8,14 L8,16 M2,8 L0,8" stroke="#a78bfa"/>`),
  MIMIC: createAsset(`<rect x="2" y="5" width="12" height="10" fill="#a16207" stroke="#422006" stroke-width="1"/><rect x="2" y="8" width="12" height="1" fill="#422006" opacity="0.3"/><rect x="7" y="8" width="2" height="2" fill="#facc15"/><path d="M4,12 L6,14 L8,12 L10,14 L12,12" stroke="#fff" stroke-width="1"/><circle cx="5" cy="7" r="1" fill="red"/><circle cx="11" cy="7" r="1" fill="red"/>`),
  FIRE_ELEMENTAL: createAsset(`<circle cx="8" cy="10" r="4" fill="#ea580c"/><path d="M8,10 Q6,4 8,2 Q10,4 8,10" fill="#f97316"/><circle cx="7" cy="9" r="1" fill="#fef3c7"/><circle cx="9" cy="9" r="1" fill="#fef3c7"/>`),
  SPECTER: createAsset(`<path d="M4,14 L4,6 Q4,2 8,2 Q12,2 12,6 L12,14 L10,12 L8,14 L6,12 L4,14 Z" fill="#14b8a6" opacity="0.6"/><circle cx="6" cy="6" r="1" fill="#ccfbf1"/><circle cx="10" cy="6" r="1" fill="#ccfbf1"/>`),
  DRAGON: createAsset(`<rect x="4" y="6" width="10" height="6" fill="#b91c1c"/><path d="M2,6 L6,2 L10,6" fill="#b91c1c"/><rect x="0" y="4" width="4" height="4" fill="#b91c1c"/><rect x="1" y="5" width="1" height="1" fill="#facc15"/>`),
  KRAKEN: createAsset(`<rect x="4" y="4" width="8" height="6" fill="#7e22ce"/><path d="M4,10 Q2,14 4,16 M8,10 Q8,16 8,16 M12,10 Q14,14 12,16" stroke="#7e22ce" stroke-width="2" fill="none"/>`),
  LICH: createAsset(`<rect x="5" y="2" width="6" height="12" fill="#312e81"/><circle cx="8" cy="4" r="2" fill="#fef9c3"/><circle cx="7" cy="4" r="0.5" fill="#3b82f6"/><circle cx="9" cy="4" r="0.5" fill="#3b82f6"/>`),
};
