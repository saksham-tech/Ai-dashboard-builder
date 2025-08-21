import { Button } from "../ui/button";
import { Database, FunctionSquare, SlidersHorizontal, Trash2 } from "lucide-react";
import { type Dataset } from "@/types/visualizations";

interface FieldsPanelProps {
  fields: string[];
  datasetId: string;
  onDelete?: (field: string) => void;
  deletableFields?: string[];
}

export function FieldsPanel({ fields, datasetId, onDelete, deletableFields }: FieldsPanelProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, field: string) => {
    const payload = JSON.stringify({ field, datasetId });
    e.dataTransfer.setData('application/json', payload);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {fields.map(field => {
          const isMeasure = deletableFields?.includes(field);
          const isParameter = datasetId === 'parameters';
          return (
            <div
              key={field}
              draggable
              onDragStart={(e) => handleDragStart(e, field)}
              className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded-md cursor-grab active:cursor-grabbing group"
            >
              {isParameter ? (
                <SlidersHorizontal className="w-3 h-3 text-chart-2" />
              ) : isMeasure ? (
                <FunctionSquare className="w-3 h-3 text-primary" />
              ) : (
                <Database className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="truncate flex-1">{field}</span>
              {onDelete && isMeasure && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(field);
                  }}
                  draggable={false}
                  onDragStart={(e) => e.stopPropagation()}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}