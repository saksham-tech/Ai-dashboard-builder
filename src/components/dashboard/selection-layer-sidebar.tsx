import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Layers } from "lucide-react";
import { type Visualization } from "@/types/visualizations";
import { cn } from "@/lib/utils";

interface SelectionLayerSidebarProps {
  visualizations: Visualization[];
  onReorder: (draggedId: string, targetId: string) => void;
  hiddenVizIds: Set<string>;
  onToggleVisibility: (vizId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  selectedVizId: string | null;
  onSelectViz: (vizId: string) => void;
}

export function SelectionLayerSidebar({
  visualizations,
  onReorder,
  hiddenVizIds,
  onToggleVisibility,
  isExpanded,
  onToggle,
  selectedVizId,
  onSelectViz,
}: SelectionLayerSidebarProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      onReorder(draggedId, targetId);
    }
    setDraggedId(null);
  };

  // Reverse the array for display so that top layer is at the top of the list
  const reversedVisualizations = [...visualizations].reverse();

  if (!isExpanded) {
    return (
      <div className="flex flex-col items-center h-full py-4">
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 mb-4 flex-shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div 
          className="flex-1 flex items-center justify-center cursor-pointer w-full"
          onClick={onToggle}
        >
          <h2 
            className="text-sm font-semibold tracking-tight whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Layers
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Layers</h2>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
        {reversedVisualizations.map(viz => (
          <div
            key={viz.id}
            draggable
            onDragStart={(e) => handleDragStart(e, viz.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, viz.id)}
            onClick={() => onSelectViz(viz.id)}
            className={cn(
              "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
              draggedId === viz.id ? "opacity-50" : "",
              selectedVizId === viz.id ? "bg-primary/20" : "bg-muted/50 hover:bg-muted"
            )}
          >
            <span className="text-sm truncate flex-1 pr-2">
              {viz.options.title.text || `Unnamed ${viz.type}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(viz.id);
              }}
            >
              {hiddenVizIds.has(viz.id) ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}