import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DragPreviewProps {
  isDragging: boolean;
  className?: string;
}

export function DragPreview({ isDragging, className }: DragPreviewProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isDragging) {
      setIsVisible(true);
    } else {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => setIsVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black/10 pointer-events-none z-40 transition-opacity duration-150",
        isDragging ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-background border border-dashed border-primary rounded-lg p-4 shadow-lg">
          <div className="text-sm text-muted-foreground">
            Arrastra para mover la clase
          </div>
        </div>
      </div>
    </div>
  );
}