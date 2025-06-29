import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
  onResize?: (size: number) => void;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  direction,
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
  className = '',
  onResize
}) => {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSize.current = size;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !panelRef.current) return;

      const container = panelRef.current.parentElement;
      if (!container) return;

      const containerSize = direction === 'horizontal' 
        ? container.clientWidth 
        : container.clientHeight;
      
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      const deltaPercent = (delta / containerSize) * 100;
      
      const newSize = Math.max(minSize, Math.min(maxSize, startSize.current + deltaPercent));
      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minSize, maxSize, onResize]);

  const sizeStyle = direction === 'horizontal' 
    ? { width: `${size}%` }
    : { height: `${size}%` };

  return (
    <div 
      ref={panelRef}
      className={`relative ${className}`}
      style={sizeStyle}
    >
      {children}
      
      {/* Resize Handle */}
      <div
        className={`
          absolute bg-gray-300 hover:bg-gray-400 transition-colors cursor-${direction === 'horizontal' ? 'col' : 'row'}-resize z-10 group
          ${direction === 'horizontal' 
            ? 'right-0 top-0 bottom-0 w-1 hover:w-2' 
            : 'bottom-0 left-0 right-0 h-1 hover:h-2'
          }
          ${isDragging ? 'bg-black' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        <div className={`
          absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
          ${direction === 'horizontal' ? 'flex-col' : 'flex-row'}
        `}>
          <GripVertical 
            className={`w-3 h-3 text-gray-600 ${direction === 'vertical' ? 'rotate-90' : ''}`} 
          />
        </div>
      </div>
    </div>
  );
};