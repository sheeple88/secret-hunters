
import React from 'react';
import { Settings, Volume2, ZoomIn, X } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  volume: number;
  setVolume: (v: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    onClose, volume, setVolume, zoom, setZoom
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-stone-900 w-full max-w-md p-6 rounded-xl border-4 border-stone-600 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
                    <h2 className="text-2xl font-bold text-stone-200 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-stone-400"/> Settings
                    </h2>
                    <button onClick={onClose} className="hover:text-red-400 text-stone-500"><X/></button>
                </div>

                <div className="space-y-6">
                    {/* Volume */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-bold text-stone-400">
                            <span className="flex items-center gap-2"><Volume2 className="w-4 h-4"/> Master Volume</span>
                            <span>{Math.round(volume * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>

                    {/* Zoom */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-bold text-stone-400">
                            <span className="flex items-center gap-2"><ZoomIn className="w-4 h-4"/> Interface Zoom</span>
                            <span>{zoom.toFixed(1)}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" max="2.0" step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="text-[10px] text-stone-600 text-center">Adjusts game view scale relative to screen size.</div>
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <div className="text-[10px] text-stone-600 font-mono">Secret Hunters v1.8 (Hardcore - No Saves)</div>
                </div>
            </div>
        </div>
    );
};
