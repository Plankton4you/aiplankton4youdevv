import { useState, useEffect, useRef } from "react";
import { Menu, X, Move } from "lucide-react";

// DraggableMenuButton Component
interface DraggableMenuButtonProps {
  isOpen: boolean;
  onToggle?: () => void;
}

export default function DraggableMenuButton({ isOpen, onToggle }: DraggableMenuButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 100 }); // Default position
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('menuButtonPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.error("Failed to parse saved position", e);
      }
    }
  }, []);

  // Save position to localStorage when changed
  useEffect(() => {
    localStorage.setItem('menuButtonPosition', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (buttonRef.current && e.touches[0]) {
      const touch = e.touches[0];
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  // Prevent button from going off screen
  useEffect(() => {
    const checkBoundaries = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const buttonWidth = buttonRef.current?.offsetWidth || 100;
      const buttonHeight = buttonRef.current?.offsetHeight || 50;
      
      let { x, y } = position;
      
      // Keep button within horizontal boundaries
      if (x < 0) x = 0;
      if (x > windowWidth - buttonWidth) x = windowWidth - buttonWidth;
      
      // Keep button within vertical boundaries
      if (y < 0) y = 0;
      if (y > windowHeight - buttonHeight) y = windowHeight - buttonHeight;
      
      if (x !== position.x || y !== position.y) {
        setPosition({ x, y });
      }
    };
    
    checkBoundaries();
    window.addEventListener('resize', checkBoundaries);
    
    return () => {
      window.removeEventListener('resize', checkBoundaries);
    };
  }, [position]);

  return (
    <div 
      ref={buttonRef}
      className="fixed z-50 cursor-grab active:cursor-grabbing"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`, 
        touchAction: 'none'
      }}
    >
      <div 
        className={`flex items-center ${isDragging ? 'pointer-events-none' : ''}`}
      >
        {/* Draggable handle */}
        <div 
          className="p-1.5 rounded-full bg-opacity-80 backdrop-blur-sm mr-1"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Move className="h-4 w-4" style={{ 
            color: 'transparent',
            backgroundImage: 'linear-gradient(45deg, #ffd700, #f5f5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text'
          }} />
        </div>
        
        {/* Menu button */}
        <button 
          onClick={onToggle}
          className="p-2.5 rounded-full shadow-lg backdrop-blur-md transition-transform duration-300 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1.5px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2), inset 0 0 8px rgba(255, 215, 0, 0.1)'
          }}
        >
          {isOpen ? (
            <X className="h-6 w-6" style={{ 
              color: 'transparent',
              backgroundImage: 'linear-gradient(45deg, #ffd700, #f5f5f5, #ffd700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.6))'
            }} />
          ) : (
            <Menu className="h-6 w-6" style={{ 
              color: 'transparent',
              backgroundImage: 'linear-gradient(45deg, #ffd700, #f5f5f5, #ffd700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.6))'
            }} />
          )}
        </button>
      </div>
    </div>
  );
}