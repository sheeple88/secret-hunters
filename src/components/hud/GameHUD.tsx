
import React from 'react';
import { GameState, Stats, Item, Recipe } from '../../types';

import { InventoryModal } from '../modals/InventoryModal';
import { SkillsModal } from '../modals/SkillsModal';
import { JournalModal } from '../modals/JournalModal';
import { BestiaryModal } from '../modals/BestiaryModal';
import { CraftingModal } from '../modals/CraftingModal';
import { PuzzleModal, PuzzleConfig } from '../modals/PuzzleModal';
import { DialogueModal } from '../modals/DialogueModal';
import { WorldMapModal } from '../modals/WorldMapModal';
import { MerchantModal } from '../modals/MerchantModal';
import { SettingsModal } from '../modals/SettingsModal';
import { ArtisanMenu } from '../skills/ArtisanMenu';

import { GameControls } from './GameControls';
import { StatusBar } from './StatusBar';
import { ActionLog } from './ActionLog';
import { DeathScreen } from './DeathScreen';
import { QuestTracker } from './QuestTracker';
import { UnlockNotification } from './UnlockNotification';

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
  onSaveGame: () => void;
  onConsume: (item: Item) => void;
  onTogglePerk: (id: string) => void;
  onPuzzleSolve: () => void;
  onPuzzleClose: () => void;
  onDialogueClose: () => void;
  formatTime: (t: number) => string;
  onBuy: (itemId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
  onStatIncrease: (stat: keyof Stats) => void;
  onAutoConfigChange: (enabled: boolean, allocation: any) => void;
  onResetStats: () => void;
  
  volume: number;
  setVolume: (v: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  lastSaved: number;
  isSaving: boolean;
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
  onConsume,
  onTogglePerk,
  onPuzzleSolve,
  onPuzzleClose,
  onDialogueClose,
  formatTime,
  onBuy,
  onSell,
  onStatIncrease,
  onAutoConfigChange,
  onResetStats,
  volume, setVolume, zoom, setZoom
}) => {

  const hasUnseenSecret = gameState.flags['new_secret'] === true;

  return (
    <>
      <StatusBar 
        gameState={gameState} 
        playerStats={playerStats} 
        formatTime={formatTime} 
      />
      
      <QuestTracker quest={gameState.activeQuest} />
      
      <UnlockNotification logs={gameState.logs} />

      <GameControls 
        onMove={onMove} 
        onInteract={onInteract}
        onOpenModal={setActiveModal} 
        hasNewSecret={hasUnseenSecret}
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

      {activeModal === 'SETTINGS' && (
        <SettingsModal 
            onClose={() => setActiveModal(null)} 
            volume={volume}
            setVolume={setVolume}
            zoom={zoom}
            setZoom={setZoom}
        />
      )}

      {activeModal === 'MERCHANT' && (
        <MerchantModal
            gameState={gameState}
            onClose={() => setActiveModal(null)}
            onBuy={onBuy}
            onSell={onSell}
        />
      )}

      {(activeModal === 'WORKBENCH' || activeModal === 'CAMPFIRE') && (
        <CraftingModal 
            gameState={gameState} 
            station={activeModal} 
            onClose={() => setActiveModal(null)} 
            onCraft={onCraft} 
        />
      )}

      {(activeModal === 'ANVIL' || activeModal === 'ALCHEMY_TABLE' || activeModal === 'FURNACE') && (
          <ArtisanMenu 
              gameState={gameState}
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
    </>
  );
};
