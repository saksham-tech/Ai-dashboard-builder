import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onDrop: (payload: { field: string; datasetId: string }) => void;
  children: React.ReactNode;
  className?: string;
}

export function DropZone({ onDrop, children, className }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const payloadStr = e.dataTransfer.getData('application/json');
      if (payloadStr) {
        const payload = JSON.parse(payloadStr);
        if (payload.field && payload.datasetId) {
          onDrop(payload);
        }
      }
    } catch (error) {
      console.error("Failed to parse drop data:", error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "p-2 border border-dashed border-transparent rounded-md transition-colors",
        isOver && "border-primary bg-primary/10",
        className
      )}
    >
      {children}
    </div>
  );
}