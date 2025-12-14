import React, { useState } from 'react';
import { Settings, Save, Volume2, ZoomIn, Trash2, X, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  volume: number;
  setVolume: (v: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onSave: () => void;
  onReset: () => void;
  lastSaved: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    onClose, volume, setVolume, zoom, setZoom, onSave, onReset, lastSaved 
}) => {
    const [confirmReset, setConfirmReset] = useState(false);

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

                    {/* Save Management */}
                    <div className="border-t border-stone-800 pt-4 space-y-3">
                        <div className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Data Management</div>
                        
                        <div className="flex items-center justify-between bg-stone-950 p-3 rounded border border-stone-800">
                            <div>
                                <div className="text-stone-300 font-bold text-sm">Manual Save</div>
                                <div className="text-[10px] text-stone-500">
                                    Last Saved: {lastSaved > 0 ? new Date(lastSaved).toLocaleTimeString() : 'Never'}
                                </div>
                            </div>
                            <button 
                                onClick={onSave}
                                className="bg-stone-800 hover:bg-stone-700 text-stone-200 p-2 rounded flex items-center gap-2 text-xs border border-stone-600 transition-colors"
                            >
                                <Save className="w-4 h-4"/> Save
                            </button>
                        </div>

                        {!confirmReset ? (
                            <button 
                                onClick={() => setConfirmReset(true)}
                                className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 p-3 rounded border border-red-900/50 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4"/> Reset Progress
                            </button>
                        ) : (
                            <div className="bg-red-950/80 p-3 rounded border border-red-600 text-center animate-pulse">
                                <div className="text-red-200 font-bold text-sm mb-2 flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-4 h-4"/> Are you sure?
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setConfirmReset(false)}
                                        className="flex-1 bg-stone-800 text-stone-300 py-2 rounded text-xs hover:bg-stone-700"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={onReset}
                                        className="flex-1 bg-red-600 text-white py-2 rounded text-xs font-bold hover:bg-red-500"
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <div className="text-[10px] text-stone-600 font-mono">Secret Hunters v1.9</div>
                </div>
            </div>
        </div>
    );
};