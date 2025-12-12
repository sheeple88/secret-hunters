
import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface DialogueModalProps {
  title: string;
  messages: string[];
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({ title, messages, onClose }) => {
    const [index, setIndex] = useState(0);

    const handleNext = () => {
        if (index < messages.length - 1) {
            setIndex(index + 1);
        } else {
            onClose();
        }
    };

    // Keyboard support for advancing dialogue
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default game handling if this modal is active
            if (['Space', 'Enter', 'e', 'E'].includes(e.key)) {
                e.stopPropagation();
                handleNext();
            } else if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [index, messages.length]);

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[100] md:bottom-10 md:left-1/2 md:-translate-x-1/2 md:w-[600px] animate-slide-up">
            <div className="bg-stone-900/95 border-4 border-stone-600 rounded-xl p-6 shadow-2xl relative backdrop-blur-sm">
                <div className="absolute -top-5 left-4 bg-stone-800 border-2 border-stone-600 px-4 py-1 rounded-t-lg text-yellow-500 font-bold flex items-center gap-2 shadow-lg">
                    <MessageCircle size={16}/> {title}
                </div>
                
                <button onClick={onClose} className="absolute top-2 right-2 text-stone-500 hover:text-red-400">
                    <X size={20}/>
                </button>

                <div className="min-h-[60px] text-xl text-stone-200 font-vt323 leading-relaxed mt-2 drop-shadow-md">
                    {messages[index]}
                </div>

                <div className="flex justify-end mt-4 border-t border-stone-800 pt-2">
                    <button onClick={handleNext} className="text-sm text-stone-400 animate-pulse hover:text-white transition-colors">
                        {index < messages.length - 1 ? 'Press [E] for Next' : 'Press [E] to Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};
