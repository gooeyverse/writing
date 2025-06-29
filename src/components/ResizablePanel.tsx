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
  const [isHovering, setIsHovering] = useState(false);
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
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, direction, minSize, maxSize, onResize]);

  const sizeStyle = direction === 'horizontal' 
    ? { width: `${size}%` }
    : { height: `${size}%` };

  // Calculate stroke weight - 1px default, 2px on hover/drag
  const strokeWeight = (isHovering || isDragging) ? 2 : 1;

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
          absolute z-10 group transition-all duration-200 bg-transparent
          ${direction === 'horizontal' 
            ? 'right-0 top-0 bottom-0' 
            : 'bottom-0 left-0 right-0'
          }
        `}
        style={{ 
          cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
          [direction === 'horizontal' ? 'width' : 'height']: `${strokeWeight}px`,
          backgroundColor: (isHovering || isDragging) ? '#6b7280' : 'transparent' // Dark gray on hover/drag
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Resize Icon - Centered */}
        <div className={`
          absolute inset-0 flex items-center justify-center transition-opacity duration-200
          ${direction === 'horizontal' ? 'flex-col' : 'flex-row'}
          ${isHovering || isDragging ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className={`
            bg-white border border-gray-400 rounded-sm p-1 shadow-sm
            ${isDragging ? 'border-gray-600 bg-gray-100' : ''}
          `}>
            <GripVertical 
              className={`
                w-3 h-3 text-gray-600 transition-colors
                ${direction === 'vertical' ? 'rotate-90' : ''}
                ${isDragging ? 'text-gray-700' : ''}
              `} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};