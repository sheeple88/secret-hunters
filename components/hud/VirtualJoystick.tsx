import React, {  useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (dx: number, dy: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);
  
  // Movement Loop Refs
  const directionRef = useRef<{dx: number, dy: number} | null>(null);
  const intervalRef = useRef<any>(null);

  const RADIUS = 40; // Joystick radius

  const handleStart = (e: React.PointerEvent) => {
      e.preventDefault(); // Stop scrolling
      setIsTouching(true);
      
      // Calculate initial position relative to center
      updateJoystick(e.clientX, e.clientY);
  };

  const handleMove = (e: React.PointerEvent) => {
      if (!isTouching) return;
      e.preventDefault();
      updateJoystick(e.clientX, e.clientY);
  };

  const handleEnd = () => {
      setIsTouching(false);
      setKnobPos({ x: 0, y: 0 });
      directionRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
  };

  const updateJoystick = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize knob position
      if (distance > RADIUS) {
          const ratio = RADIUS / distance;
          dx *= ratio;
          dy *= ratio;
      }

      setKnobPos({ x: dx, y: dy });

      // Calculate Direction
      // Threshold to trigger move
      if (distance > 10) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          let moveDir = { dx: 0, dy: 0 };

          if (angle > -45 && angle <= 45) moveDir = { dx: 1, dy: 0 }; // Right
          else if (angle > 45 && angle <= 135) moveDir = { dx: 0, dy: 1 }; // Down
          else if (angle > 135 || angle <= -135) moveDir = { dx: -1, dy: 0 }; // Left
          else moveDir = { dx: 0, dy: -1 }; // Up

          // Only update/trigger if direction changed or just started
          if (!directionRef.current || directionRef.current.dx !== moveDir.dx || directionRef.current.dy !== moveDir.dy) {
              directionRef.current = moveDir;
              
              // Clear existing interval
              if (intervalRef.current) clearInterval(intervalRef.current);
              
              // Immediate Move
              onMove(moveDir.dx, moveDir.dy);
              
              // Start Repeat Interval
              intervalRef.current = setInterval(() => {
                  if (directionRef.current) onMove(directionRef.current.dx, directionRef.current.dy);
              }, 200);
          }
      } else {
          directionRef.current = null;
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
      }
  };

  // Cleanup
  useEffect(() => {
      return () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
      };
  }, []);

  return (
    <div 
        ref={containerRef}
        className="relative w-32 h-32 bg-stone-900/80 rounded-full border-4 border-stone-600 shadow-2xl touch-none select-none flex items-center justify-center backdrop-blur-sm"
        onPointerDown={handleStart}
        onPointerMove={handleMove}
        onPointerUp={handleEnd}
        onPointerLeave={handleEnd}
    >
        {/* Inner Decor */}
        <div className="absolute inset-0 rounded-full opacity-20 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-stone-500 to-transparent pointer-events-none"/>
        
        {/* Knob */}
        <div 
            className="w-12 h-12 bg-stone-400 rounded-full shadow-lg border-2 border-stone-300 pointer-events-none transition-transform duration-75"
            style={{ 
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                backgroundColor: isTouching ? '#fbbf24' : '#a8a29e' // Amber when active
            }}
        />
        
        {/* Arrows Decor */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-stone-600 text-xs pointer-events-none">▲</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-stone-600 text-xs pointer-events-none">▼</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-600 text-xs pointer-events-none">◀</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-600 text-xs pointer-events-none">▶</div>
    </div>
  );
};