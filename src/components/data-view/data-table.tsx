import { useRef, useState } from "react";
import { type Dataset } from "@/types/visualizations";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatValue } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableProps {
  dataset: Dataset;
  onPivotRequest: (columns: string[]) => void;
  onUnpivotRequest: (columns: string[], type: 'selected' | 'other') => void;
  onDeleteRequest: (columns: string[]) => void;
  onDeleteOtherColumnsRequest: (columns: string[]) => void;
  onChangeTypeRequest: (column: string, newType: 'whole' | 'decimal' | 'text' | 'date') => void;
  onRemoveDuplicatesRequest: (column: string) => void;
}

export function DataTable({ dataset, onPivotRequest, onUnpivotRequest, onDeleteRequest, onDeleteOtherColumnsRequest, onChangeTypeRequest, onRemoveDuplicatesRequest }: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  if (!dataset || dataset.data.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        This table is empty.
      </div>
    );
  }

  const handleColumnSelect = (column: string, isMulti: boolean) => {
    setSelectedColumns(prev => {
      const newSelection = new Set(isMulti ? prev : []);
      if (newSelection.has(column)) {
        newSelection.delete(column);
      } else {
        newSelection.add(column);
      }
      return newSelection;
    });
  };

  const rowVirtualizer = useVirtualizer({
    count: dataset.data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: dataset.fields.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const headerHeight = 35;

  return (
    <div ref={parentRef} className="h-full w-full overflow-auto relative">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize() + headerHeight}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {/* Render Headers */}
        <div className="sticky top-0 z-10 h-[35px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {virtualColumns.map((virtualColumn) => {
            const fieldName = dataset.fields[virtualColumn.index];
            const isSelected = selectedColumns.has(fieldName);

            return (
              <ContextMenu key={virtualColumn.key}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "absolute top-0 left-0 flex h-full items-center justify-between border-b border-r border-border p-2 font-bold cursor-pointer transition-colors group",
                      isSelected && "bg-primary/20"
                    )}
                    style={{
                      width: `${virtualColumn.size}px`,
                      transform: `translateX(${virtualColumn.start}px)`,
                    }}
                    onClick={(e) => handleColumnSelect(fieldName, e.ctrlKey || e.metaKey)}
                  >
                    <span className="truncate">{fieldName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRequest([fieldName]);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => onRemoveDuplicatesRequest(fieldName)}>
                    Remove Duplicates
                  </ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Change Type</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem onSelect={() => onChangeTypeRequest(fieldName, 'whole')}>To Whole Number</ContextMenuItem>
                      <ContextMenuItem onSelect={() => onChangeTypeRequest(fieldName, 'decimal')}>To Decimal Number</ContextMenuItem>
                      <ContextMenuItem onSelect={() => onChangeTypeRequest(fieldName, 'text')}>To Text</ContextMenuItem>
                      <ContextMenuItem onSelect={() => onChangeTypeRequest(fieldName, 'date')}>To Date (YYYY-MM-DD)</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuSeparator />
                  {selectedColumns.size === 3 && (
                    <ContextMenuItem onSelect={() => onPivotRequest(Array.from(selectedColumns))}>
                      Pivot Columns
                    </ContextMenuItem>
                  )}
                  {selectedColumns.size > 0 && (
                    <ContextMenuItem onSelect={() => onUnpivotRequest(Array.from(selectedColumns), 'selected')}>
                      Unpivot Selected Columns
                    </ContextMenuItem>
                  )}
                  {selectedColumns.size > 0 && selectedColumns.size < dataset.fields.length && (
                    <ContextMenuItem onSelect={() => onUnpivotRequest(Array.from(selectedColumns), 'other')}>
                      Unpivot Other Columns
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  {selectedColumns.size > 0 && (
                    <ContextMenuItem onSelect={() => onDeleteRequest(Array.from(selectedColumns))} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Column(s)
                    </ContextMenuItem>
                  )}
                  {selectedColumns.size > 0 && selectedColumns.size < dataset.fields.length && (
                    <ContextMenuItem onSelect={() => onDeleteOtherColumnsRequest(Array.from(selectedColumns))} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      Delete Other Columns
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>

        {/* Render Data Cells */}
        {virtualRows.map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="absolute left-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start + headerHeight}px)`,
            }}
          >
            {virtualColumns.map((virtualColumn) => {
              const row = dataset.data[virtualRow.index];
              const field = dataset.fields[virtualColumn.index];
              const cellValue = row[field];
              const isSelected = selectedColumns.has(field);

              return (
                <div
                  key={virtualColumn.key}
                  className={cn(
                    "absolute top-0 left-0 flex h-full items-center justify-start border-b border-r border-border p-2 transition-colors",
                    isSelected && "bg-primary/10"
                  )}
                  style={{
                    width: `${virtualColumn.size}px`,
                    transform: `translateX(${virtualColumn.start}px)`,
                  }}
                >
                  <span className="truncate">{formatValue(cellValue, undefined, field)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}