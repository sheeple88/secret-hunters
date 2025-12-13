
import React, { useEffect, useState } from 'react';
import { Star, Trophy, Sparkles } from 'lucide-react';
import { LogEntry } from '../../types';

interface UnlockNotificationProps {
    logs: LogEntry[];
}

export const UnlockNotification: React.FC<UnlockNotificationProps> = ({ logs }) => {
    const [notification, setNotification] = useState<{message: string, type: 'SECRET' | 'QUEST'} | null>(null);

    useEffect(() => {
        if (logs.length === 0) return;
        const lastLog = logs[logs.length - 1];
        
        // Prevent showing old notifications when loading a save game
        // Only show if the log timestamp is within the last 2 seconds
        const isRecent = (Date.now() - lastLog.timestamp) < 2000;

        if (isRecent && (lastLog.type === 'SECRET' || (lastLog.type === 'QUEST' && lastLog.message.includes('Completed')))) {
            setNotification({
                message: lastLog.message,
                type: lastLog.type as 'SECRET' | 'QUEST'
            });
            
            // Short duration as requested
            const timer = setTimeout(() => setNotification(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [logs]);

    if (!notification) return null;

    const isSecret = notification.type === 'SECRET';

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] pointer-events-none w-full flex justify-center px-4 animate-slide-down">
            <div 
                className={`
                    relative p-1 bg-black shadow-[0_10px_20px_rgba(0,0,0,0.5)] 
                    border-4 ${isSecret ? 'border-yellow-600' : 'border-purple-600'}
                    min-w-[280px] max-w-md
                `}
            >
                {/* Pixel Corners (Outer) */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-black"/>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-black"/>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-black"/>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-black"/>

                <div 
                    className={`
                        flex flex-col items-center justify-center p-3 text-center
                        border-2 ${isSecret ? 'border-yellow-800 bg-yellow-900/90' : 'border-purple-800 bg-purple-900/90'}
                    `}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {isSecret ? (
                            <Star className="w-5 h-5 text-yellow-300 fill-current animate-spin-slow"/> 
                        ) : (
                            <Trophy className="w-5 h-5 text-purple-300 fill-current animate-bounce"/>
                        )}
                        <span className={`text-xs font-bold font-vt323 tracking-[0.2em] uppercase ${isSecret ? 'text-yellow-300' : 'text-purple-300'}`}>
                            {isSecret ? 'Secret Unlocked' : 'Quest Complete'}
                        </span>
                        {isSecret ? (
                            <Star className="w-5 h-5 text-yellow-300 fill-current animate-spin-slow"/> 
                        ) : (
                            <Trophy className="w-5 h-5 text-purple-300 fill-current animate-bounce"/>
                        )}
                    </div>
                    
                    <div className="w-full h-px bg-white/20 mb-2" />

                    <div className="text-xl md:text-2xl font-bold font-vt323 text-white leading-none drop-shadow-md flex items-center gap-2">
                        {notification.message}
                        {isSecret && <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse"/>}
                    </div>
                </div>
            </div>
        </div>
    );
};
