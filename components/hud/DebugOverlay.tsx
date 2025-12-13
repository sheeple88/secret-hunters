
import React from 'react';
import { LogEntry, GameState } from '../../types';

interface DebugOverlayProps {
  logs: LogEntry[];
  gameState: GameState;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ logs, gameState }) => {
  // Disabled as per request to remove map coordinate widget
  return null;
};
