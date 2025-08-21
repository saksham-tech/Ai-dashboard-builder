import { useMemo } from "react";
import { type Visualization } from "@/types/visualizations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatValue } from "@/lib/formatting";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SlicerVisualProps {
  visualization: Visualization;
  dataset: Record<string, any>[];
  filteredDataset?: Record<string, any>[];
  activeFilters: Record<string, { datasetId: string, values: Set<any> }>;
  onFilterChange: (datasetId: string, field: string, selectedValues: Set<any>) => void;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

const hexToRgba = (hex: string, alpha: number): string => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // Fallback for invalid hex
  return `rgba(0, 0, 0, ${alpha})`;
};

export function SlicerVisual({
  visualization,
  dataset,
  filteredDataset,
  activeFilters,
  onFilterChange,
  isOpen,
  onToggle,
}: SlicerVisualProps) {
  const { options, datasetId } = visualization;
  const { slicerKey } = options.dataMapping;
  const slicerOptions = options.slicer;
  
  const parsedSlicerKey = parseCompositeKey(slicerKey)?.field;

  // Build a set of available values from the filtered dataset to reflect relationships/other filters
  const availableValueSet = useMemo(() => {
    if (!parsedSlicerKey || !filteredDataset) return null as Set<any> | null;
    const s = new Set<any>();
    filteredDataset.forEach(row => {
      const v = row[parsedSlicerKey];
      if (v !== undefined && v !== null) s.add(v);
    });
    return s;
  }, [filteredDataset, parsedSlicerKey]);

  const uniqueItems = useMemo(() => {
    if (!parsedSlicerKey) return [];
    const seen = new Set<any>();
    const result: Record<string, any>[] = [];
    dataset.forEach((row) => {
      const value = row[parsedSlicerKey];
      if (value !== undefined && value !== null && !seen.has(value)) {
        seen.add(value);
        result.push(row);
      }
    });
    return result.sort((a, b) => String(a[parsedSlicerKey]).localeCompare(String(b[parsedSlicerKey])));
  }, [dataset, parsedSlicerKey]);

  if (!parsedSlicerKey || !slicerOptions || !datasetId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
        <p className="text-sm">Please select a field for this slicer in the 'Data Mapping' panel.</p>
      </div>
    );
  }

  const currentSelection = activeFilters[parsedSlicerKey]?.values || new Set();

  const handleItemClick = (e: React.MouseEvent, value: any) => {
    const newSelection = new Set(currentSelection);
    if (slicerOptions.allowMultiSelect) {
      if (newSelection.has(value)) {
        newSelection.delete(value);
      } else {
        newSelection.add(value);
      }
    } else {
      if (newSelection.has(value)) {
        newSelection.clear();
      } else {
        newSelection.clear();
        newSelection.add(value);
      }
    }
    onFilterChange(datasetId, parsedSlicerKey, newSelection);
  };

  const { image: imageSettings, texts, layout, textBlockPadding } = slicerOptions;
  const rawImageField = imageSettings?.field || null;
  const parsedImageField = parseCompositeKey(rawImageField)?.field || rawImageField;

  const positionClasses = {
    left: 'flex-row items-center gap-2',
    right: 'flex-row-reverse items-center gap-2 justify-end',
    top: 'flex-col items-center gap-1',
    bottom: 'flex-col-reverse items-center gap-1',
  };

  const SlicerContent = () => (
    <div
      className="grid"
      style={{
        gridTemplateColumns: layout.itemWidth && layout.itemWidth > 0
          ? `repeat(auto-fill, minmax(${layout.itemWidth}px, 1fr))`
          : `repeat(${layout.gridColumns}, minmax(0, 1fr))`,
        gap: `${layout.gap}px`,
      }}
    >
      {(currentSelection.size > 0
        ? uniqueItems // this slicer is active: show all
        : (availableValueSet
            ? uniqueItems.filter(item => availableValueSet.has(item[parsedSlicerKey as string]))
            : uniqueItems)
      ).map((item, index) => {
        const value = item[parsedSlicerKey];
        const isSelected = currentSelection.has(value);
        const isAvailable = !availableValueSet || availableValueSet.has(value);
        const imageUrl = parsedImageField ? item[parsedImageField] : null;

        const itemStyle: React.CSSProperties = slicerOptions.showItemContainer
          ? {
              backgroundColor: isSelected
                ? hexToRgba(slicerOptions.selectedItemBackgroundColor, slicerOptions.selectedItemBackgroundOpacity)
                : hexToRgba(slicerOptions.itemBackgroundColor, slicerOptions.itemBackgroundOpacity),
              borderRadius: `${slicerOptions.itemBorderRadius}px`,
              padding: `${slicerOptions.itemPadding}px`,
              border: `${slicerOptions.itemBorderWidth || 0}px solid ${isSelected ? slicerOptions.selectedItemBorderColor : slicerOptions.itemBorderColor}`,
              height: layout.itemHeight && layout.itemHeight > 0 ? `${layout.itemHeight}px` : 'auto',
              opacity: isAvailable ? 1 : 0.45,
            }
          : {
              backgroundColor: 'transparent',
              borderRadius: 0,
              padding: 0,
              height: layout.itemHeight && layout.itemHeight > 0 ? `${layout.itemHeight}px` : 'auto',
              opacity: isAvailable ? 1 : 0.45,
            };

        return (
          <div
            key={index}
            className={cn(
              "cursor-pointer transition-colors flex w-full slicer-item",
              slicerOptions.showItemContainer && "rounded-md",
              positionClasses[imageSettings?.position || 'left']
            )}
            style={itemStyle}
            onClick={(e) => handleItemClick(e, value)}
          >
            {parsedImageField && imageUrl && imageSettings && (
              <div
                style={{
                  padding: `${imageSettings.padding || 0}px`,
                  display: (imageSettings.position === 'top' || imageSettings.position === 'bottom') ? 'flex' : undefined,
                  justifyContent: (imageSettings.position === 'top' || imageSettings.position === 'bottom')
                    ? (imageSettings.align === 'center' ? 'center' : imageSettings.align === 'right' ? 'flex-end' : 'flex-start')
                    : undefined,
                }}
              >
                <img
                  src={imageUrl}
                  alt={String(value)}
                  className="flex-shrink-0 rounded-sm"
                  style={{
                    width: `${imageSettings.width}px`,
                    height: `${imageSettings.height}px`,
                    objectFit: imageSettings.objectFit,
                  }}
                />
              </div>
            )}
            <div
              className="flex flex-col flex-grow min-w-0"
              style={{
                textAlign: slicerOptions.textAlign || 'left',
                padding: `${textBlockPadding || 0}px`,
              }}
            >
              {texts.length > 0 ? (
                texts.map(textOption => {
                  // Support both composite keys (datasetId:field) and plain field names
                  const parsedTextField = parseCompositeKey(textOption.field)?.field || textOption.field || null;
                  return (
                    <div
                      key={textOption.id}
                      className="truncate"
                      style={{
                        fontSize: `${textOption.fontSize}px`,
                        color: isSelected ? slicerOptions.selectedItemTextColor : textOption.color,
                        fontWeight: textOption.fontWeight,
                        textAlign: textOption.align || slicerOptions.textAlign || 'left',
                      }}
                    >
                      {parsedTextField ? formatValue(item[parsedTextField], textOption.formatting) : '...'}
                    </div>
                  )
                })
              ) : (
                <span
                  className={cn("truncate text-sm", isSelected && "font-semibold")}
                  style={{ color: isSelected ? slicerOptions.selectedItemTextColor : slicerOptions.itemTextColor }}
                >
                  {String(value)}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {(currentSelection.size > 0 ? uniqueItems : (availableValueSet ? uniqueItems.filter(item => availableValueSet.has(item[parsedSlicerKey as string])) : uniqueItems)).length === 0 && (
        <p className="text-center text-muted-foreground text-sm mt-4 col-span-full">
          No matching values found.
        </p>
      )}
    </div>
  );

  if (slicerOptions.popoverModeEnabled) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Popover open={isOpen} onOpenChange={onToggle}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative w-full h-full">
              {slicerOptions.popoverIconSrc ? (
                <img src={slicerOptions.popoverIconSrc} alt="Slicer Icon" className="w-6 h-6" />
              ) : (
                <Filter className="w-5 h-5" />
              )}
              {slicerOptions.showActiveFilterCount && currentSelection.size > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                  {currentSelection.size}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium leading-none">{slicerOptions.popoverTitle || 'Filter'}</h4>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onFilterChange(datasetId, parsedSlicerKey, new Set())}>Clear</Button>
            </div>
            <ScrollArea className="h-64">
              <SlicerContent />
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <SlicerContent />
      </ScrollArea>
    </div>
  );
}