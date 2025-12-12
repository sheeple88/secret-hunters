
import React, { useState } from 'react';
import { Calculator, HelpCircle, X, Check } from 'lucide-react';

export interface PuzzleConfig {
  id: string;
  type: 'KEYPAD' | 'RIDDLE';
  content: string; // The riddle text or hint
  solution: string;
}

interface PuzzleModalProps {
  config: PuzzleConfig;
  onSolve: () => void;
  onClose: () => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ config, onSolve, onClose }) => {
    const [input, setInput] = useState("");
    const [error, setError] = useState(false);

    const handleSubmit = () => {
        if (input.toLowerCase().trim() === config.solution.toLowerCase().trim()) {
            onSolve();
        } else {
            setError(true);
            setTimeout(() => setError(false), 500);
            setInput("");
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
            <div className={`bg-stone-800 p-6 rounded-xl border-4 ${error ? 'border-red-500' : 'border-stone-600'} shadow-2xl max-w-sm w-full transition-colors duration-300 animate-scale-in`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-stone-200 flex items-center gap-2">
                        {config.type === 'KEYPAD' ? <Calculator className="text-cyan-400"/> : <HelpCircle className="text-purple-400"/>}
                        {config.type === 'KEYPAD' ? 'Security Lock' : 'Riddle'}
                    </h2>
                    <button onClick={onClose}><X className="w-5 h-5 hover:text-red-400"/></button>
                </div>
                
                <div className="mb-6 text-stone-300 font-mono text-center border-y border-stone-700 py-4 bg-stone-900/50 rounded">
                    {config.content}
                </div>

                {config.type === 'KEYPAD' ? (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                            <button key={n} onClick={() => setInput(p => p + n)} className="bg-stone-700 p-3 rounded font-mono text-xl hover:bg-stone-600 active:bg-stone-500 text-stone-200">{n}</button>
                        ))}
                        <button onClick={() => setInput("")} className="bg-red-900/50 text-red-200 p-3 rounded font-bold hover:bg-red-900">C</button>
                        <button onClick={() => setInput(p => p + "0")} className="bg-stone-700 p-3 rounded font-mono text-xl hover:bg-stone-600 text-stone-200">0</button>
                        <button onClick={handleSubmit} className="bg-green-900/50 text-green-200 p-3 rounded font-bold hover:bg-green-900"><Check/></button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input 
                            autoFocus
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="bg-black text-stone-200 border border-stone-600 rounded p-2 flex-1 font-mono uppercase"
                            placeholder="Answer..."
                        />
                        <button onClick={handleSubmit} className="bg-stone-600 px-4 rounded hover:bg-stone-500 text-white"><Check/></button>
                    </div>
                )}
                
                <div className="h-8 flex items-center justify-center">
                    <div className="text-xl font-mono tracking-widest text-cyan-500 min-h-[1.5rem]">{input}</div>
                </div>
            </div>
        </div>
    );
};
