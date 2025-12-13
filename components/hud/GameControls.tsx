
import React, { useEffect, useState } from 'react';
import { 
  Backpack, BookOpen, Star, Ghost, Map as MapIcon,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand 
} from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';

interface GameControlsProps {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onOpenModal: (modal: string) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ onMove, onInteract, onOpenModal }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const ControlButton = ({ onClick, icon: Icon, color = "stone", size = "md", title }: any) => {
      const baseStyles = "relative flex items-center justify-center rounded-lg shadow-lg active:translate-y-1 transition-all select-none touch-manipulation border-b-4 active:border-b-0 active:mt-1";
      
      const colors: any = {
          stone: "bg-stone-700 border-stone-900 text-stone-200 hover:bg-stone-600",
          amber: "bg-amber-600 border-amber-800 text-amber-100 hover:bg-amber-500",
          blue: "bg-blue-600 border-blue-800 text-blue-100 hover:bg-blue-500",
          purple: "bg-purple-600 border-purple-800 text-purple-100 hover:bg-purple-500",
          red: "bg-red-600 border-red-800 text-red-100 hover:bg-red-500",
          green: "bg-green-700 border-green-900 text-green-100 hover:bg-green-600",
      };

      const sizes: any = {
          sm: "w-10 h-10",
          md: "w-14 h-14",
          lg: "w-16 h-16",
          xl: "w-20 h-20"
      };

      return (
          <button 
            className={`${baseStyles} ${colors[color]} ${sizes[size]}`}
            onPointerDown={(e) => {
                e.preventDefault(); 
                onClick();
            }}
            title={title}
          >
              <Icon className={size === 'sm' ? "w-5 h-5" : size === 'xl' ? "w-10 h-10" : "w-8 h-8"} strokeWidth={2.5} />
          </button>
      );
  };

  return (
    <>
        {/* Menu Bar - Top Right */}
        <div className={`fixed z-50 flex gap-2 pointer-events-auto transition-all ${isMobile ? 'top-2 right-2 scale-90 origin-top-right' : 'top-4 right-4'}`}>
             <div className="flex gap-1 p-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-xl">
                <ControlButton onClick={() => onOpenModal('INVENTORY')} icon={Backpack} color="stone" size="sm" title="Inventory (I)" />
                <ControlButton onClick={() => onOpenModal('SKILLS')} icon={BookOpen} color="blue" size="sm" title="Skills (K)" />
                <ControlButton onClick={() => onOpenModal('SECRETS')} icon={Star} color="amber" size="sm" title="Journal" />
                <ControlButton onClick={() => onOpenModal('BESTIARY')} icon={Ghost} color="purple" size="sm" title="Bestiary" />
                <ControlButton onClick={() => onOpenModal('MAP')} icon={MapIcon} color="green" size="sm" title="World Map" />
             </div>
        </div>

        {/* MOBILE CONTROLS (Overlay) */}
        {isMobile && (
            <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-end pb-8 px-6">
                <div className="flex justify-between items-end w-full">
                    {/* Joystick Left */}
                    <div className="pointer-events-auto opacity-100">
                        <VirtualJoystick onMove={onMove} />
                    </div>

                    {/* Action Button Right */}
                    <div className="pointer-events-auto opacity-100 mb-2">
                         <ControlButton onClick={onInteract} icon={Hand} color="amber" size="xl" title="Interact" />
                    </div>
                </div>
            </div>
        )}

        {/* DESKTOP CONTROLS (D-Pad) */}
        {!isMobile && (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-6 pointer-events-auto">
                <div className="flex items-end gap-6">
                     <div className="bg-stone-900/80 p-2 rounded-full border-4 border-stone-800 shadow-2xl backdrop-blur-sm">
                         <div className="grid grid-cols-3 gap-1">
                              <div />
                              <ControlButton onClick={() => onMove(0, -1)} icon={ArrowUp} color="stone" />
                              <div />
                              
                              <ControlButton onClick={() => onMove(-1, 0)} icon={ArrowLeft} color="stone" />
                              <div className="w-14 h-14 bg-stone-950/50 rounded-lg flex items-center justify-center">
                                  <div className="w-2 h-2 bg-stone-800 rounded-full opacity-50"/>
                              </div>
                              <ControlButton onClick={() => onMove(1, 0)} icon={ArrowRight} color="stone" />
                              
                              <div />
                              <ControlButton onClick={() => onMove(0, 1)} icon={ArrowDown} color="stone" />
                              <div />
                         </div>
                     </div>

                     <div className="mb-2">
                         <ControlButton onClick={onInteract} icon={Hand} color="amber" size="lg" title="Interact (E)" />
                     </div>
                </div>
                <div className="text-[10px] text-white/30 font-mono pointer-events-none">
                    WASD to Move | E to Interact
                </div>
            </div>
        )}
    </>
  );
};
