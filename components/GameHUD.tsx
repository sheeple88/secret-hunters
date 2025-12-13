
import React from 'react';
import { GameState, Stats, Item, Recipe } from '../types';
import { Save } from 'lucide-react';

import { InventoryModal } from './modals/InventoryModal';
import { SkillsModal } from './modals/SkillsModal';
import { JournalModal } from './modals/JournalModal';
import { BestiaryModal } from './modals/BestiaryModal';
import { CraftingModal } from './modals/CraftingModal';
import { PuzzleModal, PuzzleConfig } from './modals/PuzzleModal';
import { DialogueModal } from './modals/DialogueModal';
import { WorldMapModal } from './modals/WorldMapModal';

import { GameControls } from './hud/GameControls';
import { StatusBar } from './hud/StatusBar';
import { ActionLog } from './hud/ActionLog';
import { DeathScreen } from './hud/DeathScreen';
import { QuestTracker } from './hud/QuestTracker';
import { UnlockNotification } from './hud/UnlockNotification';
import { DebugOverlay } from './hud/DebugOverlay';

interface GameHUDProps {
  gameState: GameState;
  playerStats: Stats;
  activeModal: string | null;
  activePuzzle: PuzzleConfig | null;
  activeDialogue: { title: string, messages: string[] } | null;
  setActiveModal: (modal: any) => void;
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onEquip: (item: Item) => void;
  onCraft: (recipe: Recipe) => void;
  onRespawn: () => void;
  onResetSave: () => void;
  onConsume: (item: Item) => void;
  onTogglePerk: (id: string) => void;
  onPuzzleSolve: () => void;
  onPuzzleClose: () => void;
  onDialogueClose: () => void;
  formatTime: (t: number) => string;
  onStatIncrease: (stat: keyof Stats) => void;
  onAutoConfigChange: (enabled: boolean, allocation: any) => void;
  onResetStats: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  playerStats,
  activeModal,
  activePuzzle,
  activeDialogue,
  setActiveModal,
  onMove,
  onInteract,
  onEquip,
  onCraft,
  onRespawn,
  onResetSave,
  onConsume,
  onTogglePerk,
  onPuzzleSolve,
  onPuzzleClose,
  onDialogueClose,
  formatTime,
  onStatIncrease,
  onAutoConfigChange,
  onResetStats
}) => {

  return (
    <>
      <StatusBar 
        gameState={gameState} 
        playerStats={playerStats} 
        formatTime={formatTime} 
      />
      
      <QuestTracker quest={gameState.activeQuest} />
      
      <UnlockNotification logs={gameState.logs} />

      <DebugOverlay logs={gameState.logs} gameState={gameState} />

      <GameControls 
        onMove={onMove} 
        onInteract={onInteract}
        onOpenModal={setActiveModal} 
      />

      <ActionLog 
        logs={gameState.logs} 
      />
      
      {activeModal === 'INVENTORY' && (
        <InventoryModal 
            gameState={gameState} 
            playerStats={playerStats} 
            onClose={() => setActiveModal(null)} 
            onEquip={onEquip} 
            onConsume={onConsume}
            onStatIncrease={onStatIncrease}
            onAutoConfigChange={onAutoConfigChange}
            onResetStats={onResetStats}
        />
      )}
      
      {activeModal === 'SKILLS' && (
        <SkillsModal 
            gameState={gameState} 
            onClose={() => setActiveModal(null)} 
        />
      )}
      
      {activeModal === 'SECRETS' && (
        <JournalModal 
            gameState={gameState} 
            onClose={() => setActiveModal(null)} 
            onTogglePerk={onTogglePerk} 
        />
      )}

      {activeModal === 'BESTIARY' && (
        <BestiaryModal 
            gameState={gameState} 
            onClose={() => setActiveModal(null)} 
        />
      )}

      {activeModal === 'MAP' && (
        <WorldMapModal 
            gameState={gameState} 
            onClose={() => setActiveModal(null)} 
        />
      )}

      {(activeModal === 'ANVIL' || activeModal === 'WORKBENCH' || activeModal === 'ALCHEMY_TABLE') && (
        <CraftingModal 
            gameState={gameState} 
            station={activeModal} 
            onClose={() => setActiveModal(null)} 
            onCraft={onCraft} 
        />
      )}
      
      {activePuzzle && (
          <PuzzleModal 
              config={activePuzzle}
              onSolve={onPuzzleSolve}
              onClose={onPuzzleClose}
          />
      )}

      {activeDialogue && (
          <DialogueModal 
              title={activeDialogue.title}
              messages={activeDialogue.messages}
              onClose={onDialogueClose}
          />
      )}

      {activeModal === 'DEATH' && (
          <DeathScreen onRespawn={onRespawn} />
      )}
      
      <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button onClick={onResetSave} className="p-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded border border-red-800 text-xs flex items-center gap-1"><Save className="w-3 h-3"/> Reset</button>
      </div>
    </>
  );
};
