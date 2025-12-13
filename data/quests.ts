
import { Quest } from '../types';

export const QUESTS: Record<string, Quest> = {
    'rat_catcher': {
        id: 'rat_catcher',
        title: 'Rat Catcher',
        description: 'The fields to the south are overrun. Kill 5 Rats.',
        type: 'KILL',
        targetId: 'Rat',
        targetCount: 5,
        currentCount: 0,
        reward: { xp: 100, gold: 50 },
        completed: false,
        giverId: 'guard_s',
        dialogueStart: ["The southern fields are plagued by vermin.", "Be useful and clear out 5 Rats for me.", "I'll make it worth your while."],
        dialogueEnd: ["Not bad, rookie.", "The fields are safer now.", "Here's your pay."]
    },
    'lumber_supply': {
        id: 'lumber_supply',
        title: 'Lumber Supply',
        description: 'We need materials for repairs. Collect 10 Wood.',
        type: 'COLLECT',
        targetId: 'wood',
        targetCount: 10,
        currentCount: 0,
        reward: { xp: 150, gold: 75, itemId: 'potion_small', itemCount: 3 },
        completed: false,
        giverId: 'npc_smith',
        dialogueStart: ["The forge burns through fuel fast.", "Bring me 10 logs of plain Wood.", "Trees are plentiful outside the walls."],
        dialogueEnd: ["Excellent timber.", "This will keep the fires burning.", "Take these potions, you'll need them."]
    },
    'slime_hunter': {
        id: 'slime_hunter',
        title: 'Slime Season',
        description: 'Green slime is everywhere. Kill 10 Slimes.',
        type: 'KILL',
        targetId: 'Slime',
        targetCount: 10,
        currentCount: 0,
        reward: { xp: 200, gold: 100 },
        completed: false,
        giverId: 'guard_n',
        dialogueStart: ["Sticky messes, all of them.", "Go squash 10 Slimes in the wilderness.", "Don't get eaten."],
        dialogueEnd: ["Gross. But effective.", "Good work cleaning up the mess."]
    },
    'iron_shortage': {
        id: 'iron_shortage',
        title: 'Iron Shortage',
        description: 'The anvil is cold. Collect 5 Iron Ore.',
        type: 'COLLECT',
        targetId: 'iron_ore',
        targetCount: 5,
        currentCount: 0,
        reward: { xp: 300, gold: 150, itemId: 'iron_ingot', itemCount: 2 },
        completed: false,
        giverId: 'npc_smith',
        dialogueStart: ["We are running low on Iron.", "Mine 5 Iron Ore from the rocky outcrops.", "Look for grey rocks with orange specks."],
        dialogueEnd: ["Finally, quality ore!", "I've smelted a few ingots for you as thanks."]
    }
};
