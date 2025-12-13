
import React from 'react';
import { Hammer, Pickaxe, FlaskConical, X } from 'lucide-react';
import { GameState, Recipe } from '../../types';
import { RECIPES, ITEMS } from '../../constants';

interface CraftingModalProps {
  gameState: GameState;
  station: 'ANVIL' | 'WORKBENCH' | 'ALCHEMY_TABLE';
  onClose: () => void;
  onCraft: (recipe: Recipe) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({ gameState, station, onClose, onCraft }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
        <div className="bg-stone-900 w-full max-w-lg p-6 rounded-xl border-4 border-stone-600 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-stone-200 flex items-center gap-2">
                    {station === 'ANVIL' ? <Hammer/> : station === 'WORKBENCH' ? <Pickaxe/> : <FlaskConical/>} 
                    Crafting
                </h2>
                <button onClick={onClose}><X className="w-6 h-6 hover:text-red-400"/></button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {RECIPES.filter(r => r.station === station && gameState.knownRecipes.includes(r.id)).map(recipe => {
                    const skill = gameState.skills[recipe.skill];
                    const canCraftLevel = skill.level >= recipe.levelReq;
                    const canCraftMats = recipe.ingredients.every(ing => {
                        const item = gameState.inventory.find(i => i.id === ing.itemId);
                        return item && item.count >= ing.count;
                    });
                    return (
                        <div key={recipe.id} className="bg-stone-950 p-4 rounded border border-stone-800 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-stone-200">{recipe.name}</div>
                                <div className="text-xs text-stone-500 mt-1">
                                    {recipe.ingredients.map(ing => `${ITEMS[ing.itemId].name} x${ing.count}`).join(', ')}
                                </div>
                            </div>
                            <button 
                                onClick={() => onCraft(recipe)} 
                                disabled={!canCraftLevel || !canCraftMats}
                                className={`px-4 py-2 rounded text-sm font-bold ${canCraftLevel && canCraftMats ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}
                            >
                                Craft
                            </button>
                        </div>
                    )
                })}
                {RECIPES.filter(r => r.station === station && gameState.knownRecipes.includes(r.id)).length === 0 && (
                    <div className="text-stone-500 text-center italic py-4">No recipes known for this station.</div>
                )}
            </div>
        </div>
    </div>
  );
};
