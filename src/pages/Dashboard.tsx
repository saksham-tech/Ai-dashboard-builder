import { nanoid } from "nanoid";
import { useState, useRef, useEffect } from "react";
import { CustomizationSidebar } from "@/components/dashboard/customization-sidebar";
import { VisualizationWrapper } from "@/components/dashboard/visualization-wrapper";
import { type Visualization, type VisualizationOptions, type SlicerTextOptions, type ShapeOptions, type Dataset, type Parameter, type CalculatedFieldDefinition, type TransformedFieldDefinition } from "@/types/visualizations";
import { LayoutGrid, ClipboardPaste } from "lucide-react";
import { FieldsSidebar } from "@/components/dashboard/fields-sidebar";
import { cn } from "@/lib/utils";
import { CanvasToolbar } from "@/components/dashboard/canvas-toolbar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { toast } from "sonner";
import { useDashboard } from "@/context/DashboardContext";
import { SelectionLayerSidebar } from "@/components/dashboard/selection-layer-sidebar";

interface DashboardProps {
  datasets: Dataset[];
  finalDatasets: Dataset[];
  filteredDatasets: Map<string, Record<string, any>[]>;
  visualizations: Visualization[];
  setVisualizations: React.Dispatch<React.SetStateAction<Visualization[]>>;
  selectedVizId: string | null;
  setSelectedVizId: React.Dispatch<React.SetStateAction<string | null>>;
  canvasBackground: string;
  setCanvasBackground: React.Dispatch<React.SetStateAction<string>>;
  activeFilters: Record<string, { datasetId: string, values: Set<any> }>;
  handleFilterChange: (datasetId: string, field: string, selectedValues: Set<any>) => void;
  onAddCalculatedField: () => void;
  onAddTransformedField: () => void;
  allMeasureFields: string[];
  isLocked: boolean;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  hiddenVizIds: Set<string>;
  onToggleVisibility: (vizId: string) => void;
  allAvailableFields: string[];
  onDeleteMeasure: (measureName: string) => void;
  staticMeasures: Record<string, string | number>;
  onAddParameter: () => void;
  parameters: Parameter[];
  parameterValues: Record<string, any>;
  onParameterValueChange: (parameterId: string, value: any) => void;
  calculatedFieldDefinitions: CalculatedFieldDefinition[];
  transformedFieldDefinitions: TransformedFieldDefinition[];
}

export default function Dashboard({
  datasets,
  finalDatasets,
  filteredDatasets,
  visualizations,
  setVisualizations,
  selectedVizId,
  setSelectedVizId,
  canvasBackground,
  setCanvasBackground,
  activeFilters,
  handleFilterChange,
  onAddCalculatedField,
  onAddTransformedField,
  allMeasureFields,
  isLocked,
  setIsLocked,
  hiddenVizIds,
  onToggleVisibility,
  allAvailableFields,
  onDeleteMeasure,
  staticMeasures,
  onAddParameter,
  parameters = [],
  parameterValues,
  onParameterValueChange,
  calculatedFieldDefinitions,
  transformedFieldDefinitions,
}: DashboardProps) {
  const { relationships } = useDashboard();
  const [isFieldsPanelExpanded, setIsFieldsPanelExpanded] = useState(true);
  const [isLayerPanelExpanded, setIsLayerPanelExpanded] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const previousCanvasSizeRef = useRef<{ width: number; height: number } | null>(null);
  const [clipboard, setClipboard] = useState<Omit<Visualization, 'id' | 'x' | 'y'> | null>(null);
  const [pasteCoords, setPasteCoords] = useState({ x: 0, y: 0 });
  const [openSlicerPopovers, setOpenSlicerPopovers] = useState<Record<string, boolean>>({});

  const handleSlicerPopoverToggle = (vizId: string, isOpen: boolean) => {
    setOpenSlicerPopovers(prev => ({ ...prev, [vizId]: isOpen }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const newWidth = entry.contentRect.width;
      const newHeight = entry.contentRect.height;
      const previousSize = previousCanvasSizeRef.current;

      if (!previousSize) {
        previousCanvasSizeRef.current = { width: newWidth, height: newHeight };
        return;
      }

      if (previousSize.width === newWidth && previousSize.height === newHeight) {
        return;
      }

      const scaleX = newWidth / previousSize.width;
      const scaleY = newHeight / previousSize.height;

      if (previousSize.width > 0 && previousSize.height > 0) {
        setVisualizations(prevVisualizations => {
          if (prevVisualizations.length === 0) {
            return prevVisualizations;
          }
          return prevVisualizations.map(viz => ({
            ...viz,
            x: viz.x * scaleX,
            y: viz.y * scaleY,
            width: viz.width * scaleX,
            height: viz.height * scaleY,
          }))
        });
      }

      previousCanvasSizeRef.current = { width: newWidth, height: newHeight };
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [setVisualizations]);

  const handleCopy = (vizId: string) => {
    const vizToCopy = visualizations.find(v => v.id === vizId);
    if (vizToCopy) {
      const { id, x, y, ...rest } = vizToCopy;
      setClipboard(rest);
      toast.success(`Copied "${rest.options.title.text}"`);
    }
  };

  const handlePaste = () => {
    if (clipboard) {
      const newViz: Visualization = {
        ...clipboard,
        id: nanoid(),
        x: pasteCoords.x + 10,
        y: pasteCoords.y + 10,
        width: clipboard.width,
        height: clipboard.height,
      };
      setVisualizations(prev => [...prev, newViz]);
      setSelectedVizId(newViz.id);
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setPasteCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleReorderVisualizations = (draggedId: string, targetId: string) => {
    setVisualizations(prev => {
      const draggedIndex = prev.findIndex(v => v.id === draggedId);
      const targetIndex = prev.findIndex(v => v.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newVizArray = [...prev];
      const [draggedItem] = newVizArray.splice(draggedIndex, 1);
      newVizArray.splice(targetIndex, 0, draggedItem);
      
      return newVizArray;
    });
  };

  const addVisualization = (type: Visualization['type'], subTypeOptions?: any) => {
    const getThemeColor = (variable: string) => `hsl(${getComputedStyle(document.documentElement).getPropertyValue(variable).trim()})`;

    const cardBackgroundColor = getThemeColor('--card');
    const borderColor = getThemeColor('--border');
    const foregroundColor = getThemeColor('--foreground');
    const mutedForegroundColor = getThemeColor('--muted-foreground');
    const primaryColor = getThemeColor('--primary');
    const primaryForegroundColor = getThemeColor('--primary-foreground');
    const backgroundColor = getThemeColor('--background');
    const mutedColor = getThemeColor('--muted');

    const baseOptions: Omit<VisualizationOptions, 'textBox' | 'image' | 'slicer' | 'card' | 'shape' | 'actionButton' | 'matrix' | 'table' | 'gauge'> = {
      general: { backgroundColor: cardBackgroundColor, borderColor: borderColor, borderRadius: 8, boxShadow: 'none', backgroundOpacity: 1, borderWidth: 1 },
      title: { text: `New ${type}`, fontSize: 16, color: foregroundColor, alignment: 'left' },
      dataLabels: { show: false, color: foregroundColor, fontSize: 12 },
      legend: { show: true, position: 'top' },
      xAxis: { show: true, color: mutedForegroundColor, showGrid: true },
      yAxis: { show: true, color: mutedForegroundColor, showGrid: true },
      colors: { primary: '#8884d8', secondary: '#82ca9d' },
      dataMapping: { 
        nameKey: null, 
        nameKeyFormatting: {},
        categoryType: 'field',
        customCategoryText: '',
        valueKey: null, 
        valueKeyFormatting: {},
        valueKeys: [], 
        secondaryValueKey: null, 
        secondaryValueKeyFormatting: {},
        valueKeyAggregation: 'NONE', 
        nameKeyAggregation: 'NONE', 
        slicerKey: null,
      },
      chartSpecific: {
        barWidth: '60%',
        barBorderRadius: [5, 5, 0, 0],
        pieRoseType: false,
        pieBorderRadius: 8,
        lineSmooth: true,
        symbolSize: 8,
        showSymbol: true,
      },
      conditionalFormatting: {
        enabled: false,
        rules: [],
      },
    };

    let specificOptions: Partial<VisualizationOptions> = {};

    switch (type) {
      case 'TextBox':
        specificOptions.textBox = {
          text: '## New Text Box\n\nDouble-click to edit this text. You can use Markdown for formatting!',
          fontSize: 16,
          color: foregroundColor,
          fontWeight: 'normal',
          verticalAlign: 'middle',
          horizontalAlign: 'center',
        };
        break;
      case 'Image':
        specificOptions.image = {
          src: null,
          objectFit: 'contain',
          dataField: null,
          width: '100%',
          height: '100%',
          verticalAlign: 'middle',
          horizontalAlign: 'center',
        };
        break;
      case 'Slicer':
        specificOptions.slicer = {
          allowMultiSelect: true,
          showItemContainer: true,
          itemBackgroundColor: mutedColor,
          itemTextColor: mutedForegroundColor,
          selectedItemBackgroundColor: primaryColor,
          selectedItemTextColor: primaryForegroundColor,
          itemBorderRadius: 4,
          itemBorderColor: 'transparent',
          selectedItemBorderColor: primaryColor,
          itemBorderWidth: 1,
          itemPadding: 8,
          itemBackgroundOpacity: 0.5,
          selectedItemBackgroundOpacity: 1.0,
          image: {
            field: null,
            position: 'left',
            width: 32,
            height: 32,
            objectFit: 'contain',
            padding: 4,
          },
          texts: [],
          layout: {
            gridColumns: 1,
            gap: 8,
            itemHeight: 0,
            itemWidth: 0,
          },
          textAlign: 'left',
          textBlockPadding: 4,
          popoverModeEnabled: false,
          popoverTitle: 'Filter',
          popoverIconSrc: '',
          showActiveFilterCount: true,
        };
        break;
      case 'Card':
        specificOptions.card = {
          valueFontSize: 48,
          valueColor: foregroundColor,
          valueFontWeight: 'bold',
          showCategory: true,
          categoryFontSize: 18,
          categoryColor: mutedForegroundColor,
          categoryFontWeight: 'normal',
          textAlign: 'center',
          verticalAlign: 'middle',
          spacing: 4,
        };
        break;
      case 'Shape':
        specificOptions.shape = {
          shapeType: subTypeOptions?.shapeType || 'rectangle',
          fillColor: primaryColor,
          strokeColor: foregroundColor,
          strokeWidth: 2,
          strokeDasharray: 'none',
          cornerRadius: 4,
          fillOpacity: 1,
          strokeOpacity: 1,
        };
        break;
      case 'ActionButton':
        specificOptions.actionButton = {
          text: 'Click Me',
          action: 'toggleVisibility',
          targetVizIds: [],
          backgroundColor: borderColor,
          textColor: foregroundColor,
          backgroundOpacity: 1,
          borderColor: borderColor,
          borderWidth: 1,
          borderRadius: 4,
          iconSrc: null,
          iconWidth: 16,
          iconHeight: 16,
        };
        break;
      case 'Matrix':
        specificOptions.matrix = {
          style: 'default',
          grid: { vertical: true, horizontal: true, color: borderColor, thickness: 1 },
          rowHeaders: { fontSize: 12, color: foregroundColor, backgroundColor: cardBackgroundColor, wordWrap: true },
          columnHeaders: { fontSize: 12, color: foregroundColor, backgroundColor: cardBackgroundColor, wordWrap: true },
          values: { fontSize: 12, color: foregroundColor, backgroundColor: backgroundColor, wordWrap: true, showAlternatingRows: true, alternatingRowColor: mutedColor, rowPadding: 4, columnPadding: 8 },
          totals: { showRowGrandTotal: true, showColumnGrandTotal: true, fontSize: 12, color: foregroundColor, backgroundColor: borderColor },
          conditionalFormatting: {
            enabled: false,
            backgroundColorScale: { enabled: false, minColor: '#d73027', centerColor: '#fee08b', maxColor: '#1a9850' },
            fontColorScale: { enabled: false, minColor: '#000000', centerColor: '#000000', maxColor: '#000000' },
          },
        };
        baseOptions.dataMapping.valueKeyAggregation = 'SUM';
        break;
      case 'Table':
        specificOptions.table = {
          grid: { vertical: true, horizontal: true, color: borderColor, thickness: 1 },
          headers: { fontSize: 12, color: foregroundColor, backgroundColor: cardBackgroundColor, wordWrap: true, alignment: 'left' },
          values: { fontSize: 12, color: foregroundColor, backgroundColor: backgroundColor, showAlternatingRows: true, alternatingRowColor: mutedColor, rowPadding: 4, columnPadding: 8, alignment: 'left' },
          totals: { show: false, fontSize: 12, color: foregroundColor, backgroundColor: borderColor, label: 'Total', columnsWithTotals: [] },
          allowMultiSelect: false,
          filterColumn: '',
        };
        baseOptions.dataMapping.valueKeyAggregation = 'NONE';
        break;
      case 'Gauge':
        specificOptions.gauge = {
          min: 0,
          max: 100,
          startAngle: 180,
          endAngle: 0,
          splitNumber: 5,
          axisLineColor: [
            [0.3, '#67e8f9'],
            [0.7, '#38bdf8'],
            [1, '#0284c7']
          ],
          showPointer: true,
          showProgress: true,
          detailFormatter: '{value}%',
          progressColor: '#38bdf8',
          radius: 75,
          detailStyle: {
            fontSize: 24,
            color: foregroundColor,
            fontWeight: 'bold',
          },
        };
        baseOptions.dataMapping.valueKeyAggregation = 'SUM';
        break;
    }

    const newViz: Visualization = {
      id: nanoid(),
      type,
      x: 20,
      y: 20 + visualizations.length * 20,
      width: type === 'ActionButton' ? 120 : type === 'TextBox' ? 300 : type === 'Image' ? 250 : type === 'Slicer' ? 200 : type === 'Shape' ? 150 : type === 'Matrix' ? 600 : type === 'Table' ? 600 : type === 'Gauge' ? 300 : 500,
      height: type === 'ActionButton' ? 40 : type === 'TextBox' ? 150 : type === 'Image' ? 250 : type === 'Slicer' ? 300 : type === 'Shape' ? (subTypeOptions?.shapeType === 'line' ? 20 : 150) : type === 'Matrix' ? 400 : type === 'Table' ? 400 : type === 'Gauge' ? 300 : 350,
      options: { ...baseOptions, ...specificOptions },
      datasetId: datasets.length > 0 ? datasets[0].id : undefined,
    };
    setVisualizations(prev => [...prev, newViz]);
    setSelectedVizId(newViz.id);
  };

  const updateVisualization = (id: string, newProps: Partial<Visualization>) => {
    setVisualizations(visualizations.map(viz => {
      if (viz.id !== id) return viz;
  
      const updatedViz = { ...viz, ...newProps };
  
      // If slicerKey is updated, also update the first text field if it exists or create one
      if (newProps.options?.dataMapping?.slicerKey && viz.type === 'Slicer') {
        const newSlicerKey = newProps.options.dataMapping.slicerKey;
        const slicerOptions = updatedViz.options.slicer;
        if (slicerOptions) {
          let newTexts: SlicerTextOptions[];
          if (slicerOptions.texts.length > 0) {
            newTexts = [...slicerOptions.texts];
            newTexts[0] = { ...newTexts[0], field: newSlicerKey };
          } else {
            newTexts = [{
              id: nanoid(),
              field: newSlicerKey,
              fontSize: 14,
              color: slicerOptions.itemTextColor,
              fontWeight: 'normal',
              formatting: {},
            }];
          }
          updatedViz.options = {
            ...updatedViz.options,
            slicer: { ...slicerOptions, texts: newTexts },
          };
        }
      }
      return updatedViz;
    }));
  };

  const deleteVisualization = (id: string) => {
    setVisualizations(prev => prev.filter(viz => viz.id !== id));
    if (selectedVizId === id) {
      setSelectedVizId(null);
    }
  };

  const selectedVisualization = visualizations.find(viz => viz.id === selectedVizId) || null;
  const selectedDataset = datasets.find(d => d.id === selectedVisualization?.datasetId);
  
  const dataForSidebar = selectedDataset ? selectedDataset.data : (datasets[0]?.data || []);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <aside className={cn(
        "border-r border-border bg-card/50 transition-all duration-300",
        isLayerPanelExpanded ? "w-64" : "w-14"
      )}>
        <SelectionLayerSidebar
          visualizations={visualizations}
          onReorder={handleReorderVisualizations}
          hiddenVizIds={hiddenVizIds}
          onToggleVisibility={onToggleVisibility}
          isExpanded={isLayerPanelExpanded}
          onToggle={() => setIsLayerPanelExpanded(!isLayerPanelExpanded)}
          selectedVizId={selectedVizId}
          onSelectViz={setSelectedVizId}
        />
      </aside>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <CanvasToolbar 
          onAddShape={(shapeType) => addVisualization('Shape', { shapeType })}
          onAddParameter={onAddParameter}
        />
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              ref={canvasRef}
              className="flex-1 relative"
              onClick={isLocked ? undefined : () => setSelectedVizId(null)}
              style={{
                backgroundImage: `url(${canvasBackground})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
              onContextMenu={handleCanvasContextMenu}
            >
              <div className="w-full h-full">
                {visualizations.map((viz, index) => (
                  <VisualizationWrapper 
                    key={viz.id} 
                    visualization={viz} 
                    dataset={filteredDatasets.get(viz.datasetId || '') || []}
                    allDatasets={datasets}
                    finalDatasets={finalDatasets}
                    filteredDatasets={filteredDatasets}
                    relationships={relationships}
                    isSelected={viz.id === selectedVizId} 
                    onClick={(e) => { e.stopPropagation(); setSelectedVizId(viz.id); }} 
                    onUpdate={(props) => updateVisualization(viz.id, props)}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    isLocked={isLocked}
                    onCopy={() => handleCopy(viz.id)}
                    openSlicerPopovers={openSlicerPopovers}
                    onSlicerPopoverToggle={handleSlicerPopoverToggle}
                    isHidden={hiddenVizIds.has(viz.id) && viz.id !== selectedVizId}
                    onToggleVisibility={onToggleVisibility}
                    zIndex={index}
                    allMeasureFields={allMeasureFields}
                    staticMeasures={staticMeasures}
                    parameters={parameters}
                    parameterValues={parameterValues}
                    onParameterValueChange={onParameterValueChange}
                    calculatedFieldDefinitions={calculatedFieldDefinitions}
                    transformedFieldDefinitions={transformedFieldDefinitions}
                  />
                ))}
              </div>
              {visualizations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-lg m-4">
                  <LayoutGrid className="w-16 h-16 mb-4" />
                  <h2 className="text-2xl font-semibold">Your Canvas is Empty</h2>
                  <p className="mt-2">Upload a CSV file and add a visualization to get started.</p>
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handlePaste} disabled={!clipboard}>
              <ClipboardPaste className="w-4 h-4 mr-2" />
              Paste
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </main>

      <aside className="w-80 border-l border-border bg-card/50">
        <CustomizationSidebar 
          onAddVisualization={addVisualization} 
          selectedVisualization={selectedVisualization} 
          onUpdateSelectedVisualization={(props) => { if (selectedVizId) { updateVisualization(selectedVizId, props); } }}
          onDeleteSelectedVisualization={() => { if (selectedVizId) { deleteVisualization(selectedVizId); } }}
          fields={allAvailableFields}
          dataset={dataForSidebar}
          datasets={finalDatasets}
          onSetCanvasBackground={setCanvasBackground}
          isLocked={isLocked}
          onToggleLock={() => setIsLocked(!isLocked)}
          allVisualizations={visualizations}
          staticMeasures={staticMeasures}
          parameters={parameters}
          allMeasureFields={allMeasureFields}
        />
      </aside>

      {datasets.length > 0 && (
        <aside className={cn(
          "border-l border-border bg-card/50 transition-all duration-300",
          isFieldsPanelExpanded ? "w-64" : "w-14"
        )}>
          <FieldsSidebar 
            datasets={finalDatasets} 
            isExpanded={isFieldsPanelExpanded}
            onToggle={() => setIsFieldsPanelExpanded(!isFieldsPanelExpanded)}
            onAddCalculatedField={onAddCalculatedField}
            onAddTransformedField={onAddTransformedField}
            calculatedFields={allMeasureFields}
            onDeleteMeasure={onDeleteMeasure}
            parameters={parameters}
          />
        </aside>
      )}
    </div>
  );
}