
import React, { useEffect, useState } from 'react';
import { Star, Trophy } from 'lucide-react';
import { LogEntry } from '../../types';

interface UnlockNotificationProps {
    logs: LogEntry[];
}

export const UnlockNotification: React.FC<UnlockNotificationProps> = ({ logs }) => {
    const [notification, setNotification] = useState<{message: string, type: 'SECRET' | 'QUEST'} | null>(null);

    useEffect(() => {
        if (logs.length === 0) return;
        const lastLog = logs[logs.length - 1];
        if (lastLog.type === 'SECRET' || (lastLog.type === 'QUEST' && lastLog.message.includes('Completed'))) {
            setNotification({
                message: lastLog.message,
                type: lastLog.type as 'SECRET' | 'QUEST'
            });
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [logs]);

    if (!notification) return null;

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[80] animate-bounce-slight pointer-events-none w-full flex justify-center px-4">
            <div className={`px-6 py-3 rounded-full border-2 shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-md ${
                notification.type === 'SECRET' 
                ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100' 
                : 'bg-orange-900/90 border-orange-500 text-orange-100'
            }`}>
                {notification.type === 'SECRET' ? <Star className="w-8 h-8 fill-current animate-spin-slow shrink-0"/> : <Trophy className="w-8 h-8 fill-current animate-pulse shrink-0"/>}
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-75">{notification.type === 'SECRET' ? 'Secret Unlocked' : 'Quest Complete'}</span>
                    <span className="text-lg font-bold font-vt323 leading-none truncate">{notification.message}</span>
                </div>
            </div>
        </div>
    );
};
