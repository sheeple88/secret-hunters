
import React, { useState, useMemo } from 'react';
import { GameState, Recipe, SkillName } from '../../types';
import { ARTISAN_RECIPES } from '../../data/artisan/recipes';
import { RECIPES, ITEMS } from '../../constants';
import { Hammer, Flame, Feather, FlaskConical, X, ChevronRight, Lock, Settings } from 'lucide-react';

interface ArtisanMenuProps {
    gameState: GameState;
    onClose: () => void;
    onCraft: (recipe: Recipe) => void;
}

const CATEGORIES: { id: SkillName | 'All', icon: any, label: string }[] = [
    { id: 'Smithing', icon: Hammer, label: 'Smithing' },
    { id: 'Fletching', icon: Feather, label: 'Fletching' },
    { id: 'Herblore', icon: FlaskConical, label: 'Herblore' },
    { id: 'Crafting', icon: Flame, label: 'Crafting' }, // Cooking/Crafting mix
];

export const ArtisanMenu: React.FC<ArtisanMenuProps> = ({ gameState, onClose, onCraft }) => {
    const [activeCategory, setActiveCategory] = useState<SkillName | 'All'>('Smithing');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    // Merge old and new recipes
    const allRecipes = useMemo(() => [...RECIPES, ...ARTISAN_RECIPES], []);

    const filteredRecipes = useMemo(() => {
        return allRecipes.filter(r => {
            if (activeCategory === 'All') return true;
            // Map generic 'Crafting' to include Cooking for simplicity in this UI
            if (activeCategory === 'Crafting') return r.skill === 'Crafting' || r.skill === 'Cooking';
            return r.skill === activeCategory;
        }).sort((a, b) => a.levelReq - b.levelReq);
    }, [activeCategory, allRecipes]);

    const canCraft = (recipe: Recipe) => {
        const skill = gameState.skills[recipe.skill];
        const hasLevel = skill && skill.level >= recipe.levelReq;
        const hasMats = recipe.ingredients.every(ing => {
            const item = gameState.inventory.find(i => i.id === ing.itemId);
            return item && item.count >= ing.count;
        });
        return { hasLevel, hasMats };
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-stone-900 w-full max-w-5xl h-[80vh] flex rounded-xl border-4 border-stone-600 shadow-2xl overflow-hidden">
                
                {/* Sidebar Categories */}
                <div className="w-20 bg-stone-950 border-r border-stone-800 flex flex-col items-center py-4 gap-4">
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id); setSelectedRecipe(null); }}
                            className={`p-3 rounded-xl transition-all ${activeCategory === cat.id ? 'bg-amber-700 text-white shadow-lg scale-110' : 'text-stone-500 hover:bg-stone-800 hover:text-stone-300'}`}
                            title={cat.label}
                        >
                            <cat.icon size={24} />
                        </button>
                    ))}
                    <div className="mt-auto">
                        <button onClick={onClose} className="p-3 text-stone-500 hover:text-red-400"><X size={24}/></button>
                    </div>
                </div>

                {/* Recipe List */}
                <div className="w-1/3 bg-stone-900 border-r border-stone-800 flex flex-col">
                    <div className="p-4 border-b border-stone-800 bg-stone-950/50">
                        <h2 className="text-xl font-bold text-stone-200">{activeCategory}</h2>
                        <div className="text-xs text-stone-500">Lv. {gameState.skills[activeCategory as SkillName]?.level || 1}</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredRecipes.map(recipe => {
                            const { hasLevel } = canCraft(recipe);
                            return (
                                <button 
                                    key={recipe.id}
                                    onClick={() => setSelectedRecipe(recipe)}
                                    className={`w-full text-left p-3 rounded flex items-center justify-between group transition-colors ${selectedRecipe?.id === recipe.id ? 'bg-amber-900/40 border border-amber-700/50' : 'hover:bg-stone-800 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center bg-stone-950 border ${hasLevel ? 'border-stone-700' : 'border-red-900/50 opacity-50'}`}>
                                            {/* Ideally Item Icon here */}
                                            <div className="text-[10px] font-bold text-stone-500">{recipe.resultItemId.substring(0,2).toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold ${hasLevel ? 'text-stone-300' : 'text-stone-600'}`}>{recipe.name}</div>
                                            <div className="text-[10px] text-stone-500">Lv. {recipe.levelReq}</div>
                                        </div>
                                    </div>
                                    {!hasLevel && <Lock size={12} className="text-stone-700"/>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="flex-1 bg-stone-900/50 p-8 flex flex-col items-center justify-center relative">
                    {selectedRecipe ? (
                        <div className="w-full max-w-md flex flex-col gap-6 animate-slide-in">
                            <div className="text-center">
                                <h3 className="text-3xl font-bold text-amber-100 mb-2">{selectedRecipe.name}</h3>
                                <div className="text-stone-400 text-sm flex items-center justify-center gap-2">
                                    <span className="bg-stone-800 px-2 py-1 rounded text-stone-300">{selectedRecipe.station}</span>
                                    <span>•</span>
                                    <span className="text-green-400">{selectedRecipe.xpReward} XP</span>
                                </div>
                            </div>

                            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
                                <h4 className="text-xs font-bold text-stone-500 uppercase mb-3 tracking-wider">Requirements</h4>
                                <div className="space-y-3">
                                    {selectedRecipe.ingredients.map((ing, idx) => {
                                        const playerItem = gameState.inventory.find(i => i.id === ing.itemId);
                                        const has = playerItem ? playerItem.count : 0;
                                        const enough = has >= ing.count;
                                        const itemName = ITEMS[ing.itemId]?.name || ing.itemId;

                                        return (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className={enough ? 'text-stone-300' : 'text-stone-500'}>{itemName}</span>
                                                <span className={enough ? 'text-green-500 font-mono' : 'text-red-500 font-mono'}>
                                                    {has}/{ing.count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4">
                                {(() => {
                                    const { hasLevel, hasMats } = canCraft(selectedRecipe);
                                    let btnText = "Craft";
                                    if (!hasLevel) btnText = `Requires Level ${selectedRecipe.levelReq}`;
                                    else if (!hasMats) btnText = "Missing Materials";

                                    return (
                                        <button 
                                            onClick={() => onCraft(selectedRecipe)}
                                            disabled={!hasLevel || !hasMats}
                                            className={`w-full py-4 rounded-lg font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                                hasLevel && hasMats 
                                                ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                            }`}
                                        >
                                            <Hammer size={20} className={hasLevel && hasMats ? "animate-bounce-slight" : ""}/> 
                                            {btnText}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="text-stone-600 flex flex-col items-center gap-4">
                            <Settings size={48} className="opacity-20"/>
                            <p>Select a recipe to view details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
