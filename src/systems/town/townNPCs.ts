
import { Position } from '../../types';

export interface NPCSchedule {
    dayPos: Position;
    nightPos: Position; // Usually their home
}

export const TOWN_NPC_ROSTER: { 
    id: string, 
    name: string, 
    role: string, 
    dialogue: string[], 
    dayPos: Position, 
    nightPos: Position,
    color: string,
    symbol: string
}[] = [
    { 
        id: 'mayor', name: 'Mayor Higgins', role: 'Mayor', 
        dialogue: ["Welcome to our growing town!", "Don't cause trouble."], 
        dayPos: {x: 30, y: 8}, nightPos: {x: 30, y: 5}, // Hall -> Bedroom
        color: 'blue', symbol: 'M'
    },
    { 
        id: 'blacksmith', name: 'Grom', role: 'Smith', 
        dialogue: ["Need armor? I'm busy.", "The anvil never sleeps... but I do."], 
        dayPos: {x: 48, y: 15}, nightPos: {x: 48, y: 12}, // Anvil -> House
        color: 'gray', symbol: 'B'
    },
    { 
        id: 'innkeeper', name: 'Bess', role: 'Innkeeper', 
        dialogue: ["Stay a while and listen.", "Rooms are 5g a night (Not implemented)."], 
        dayPos: {x: 20, y: 25}, nightPos: {x: 22, y: 25}, // Counter -> Back room
        color: 'yellow', symbol: 'I'
    },
    { 
        id: 'farmer_joe', name: 'Farmer Joe', role: 'Farmer', 
        dialogue: ["Ain't much, but it's honest work.", "Keep off the crops!"], 
        dayPos: {x: 50, y: 40}, nightPos: {x: 55, y: 38}, // Field -> Farmhouse
        color: 'green', symbol: 'F'
    },
    { 
        id: 'fisher_tom', name: 'Tom', role: 'Fisher', 
        dialogue: ["Fish aren't biting today.", "Saw a Kraken once. Swear it."], 
        dayPos: {x: 45, y: 45}, nightPos: {x: 42, y: 38}, // River -> Shack
        color: 'cyan', symbol: 'V'
    },
    // Generic Villagers
    { id: 'kid_1', name: 'Timmy', role: 'Child', dialogue: ["I saw a ghost!", "Wanna play?"], dayPos: {x: 30, y: 25}, nightPos: {x: 10, y: 15}, color: 'orange', symbol: 't' },
    { id: 'kid_2', name: 'Sally', role: 'Child', dialogue: ["Running is fun!", "Can you craft a doll?"], dayPos: {x: 32, y: 26}, nightPos: {x: 12, y: 15}, color: 'pink', symbol: 't' },
    { id: 'guard_1', name: 'Guard', role: 'Guard', dialogue: ["Move along.", "Stay safe."], dayPos: {x: 30, y: 48}, nightPos: {x: 25, y: 5}, color: 'red', symbol: 'G' },
    { id: 'guard_2', name: 'Guard', role: 'Guard', dialogue: ["Patrolling...", "Did you hear that?"], dayPos: {x: 58, y: 25}, nightPos: {x: 28, y: 5}, color: 'red', symbol: 'G' },
    { id: 'market_1', name: 'Alice', role: 'Merchant', dialogue: ["Fresh fruit!", "Best prices!"], dayPos: {x: 45, y: 25}, nightPos: {x: 15, y: 20}, color: 'purple', symbol: '$' },
    { id: 'market_2', name: 'Bob', role: 'Merchant', dialogue: ["Wood for sale!", "Sturdy logs!"], dayPos: {x: 45, y: 28}, nightPos: {x: 15, y: 25}, color: 'brown', symbol: '$' },
];
