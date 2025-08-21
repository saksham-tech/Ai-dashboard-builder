import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Visualization, type ChartType, type Dataset, type Parameter } from "@/types/visualizations"
import { 
  BarChart, LineChart, PieChart, AreaChart, CreditCard, 
  Circle, ScatterChart, BarChartHorizontal, Layers,
  Type, Image as ImageIcon, Filter, AlignCenter, BarChartBig, Lock, Unlock, Trash2, PlaySquare, Table, GaugeCircle
} from "lucide-react"
import { GeneralSettings } from "./customization/general-settings"
import { ColorSettings } from "./customization/color-settings"
import { LegendSettings } from "./customization/legend-settings"
import { AxisSettings } from "./customization/axis-settings"
import { DataLabelSettings } from "./customization/data-label-settings"
import { DataSettings } from "./customization/data-settings"
import { ImageSettings } from "./customization/image-settings"
import { TextBoxSettings } from "./customization/text-box-settings"
import { ChartSpecificSettings } from "./customization/chart-specific-settings"
import { ConditionalFormattingSettings } from "./customization/conditional-formatting-settings"
import { SlicerSettings } from "./customization/slicer-settings"
import { toast } from "sonner"
import { StackedBarSettings } from "./customization/stacked-bar-settings"
import { ShapeSettings } from "./customization/shape-settings"
import { ActionButtonSettings } from "./customization/action-button-settings"
import { MatrixSettings } from "./customization/matrix-settings"
import { TableSettings } from "./customization/table-settings"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GaugeSettings } from "./customization/gauge-settings"

interface CustomizationSidebarProps {
  onAddVisualization: (type: ChartType) => void;
  selectedVisualization: Visualization | null;
  onUpdateSelectedVisualization: (props: Partial<Visualization>) => void;
  onDeleteSelectedVisualization: () => void;
  fields: string[];
  dataset: Record<string, any>[];
  datasets: Dataset[];
  onSetCanvasBackground: (url: string) => void;
  isLocked: boolean;
  onToggleLock: () => void;
  allVisualizations: Visualization[];
  staticMeasures: Record<string, string | number>;
  parameters: Parameter[];
  allMeasureFields: string[];
}

const vizOptions: { name: ChartType, icon: React.ReactNode }[] = [
  { name: 'Bar', icon: <BarChart className="w-5 h-5" /> },
  { name: 'HorizontalBar', icon: <BarChartHorizontal className="w-5 h-5" /> },
  { name: 'StackedBar', icon: <BarChartBig className="w-5 h-5" /> },
  { name: 'StackedBarHorizontal', icon: <BarChartHorizontal className="w-5 h-5" /> },
  { name: 'Line', icon: <LineChart className="w-5 h-5" /> },
  { name: 'Pie', icon: <PieChart className="w-5 h-5" /> },
  { name: 'Area', icon: <AreaChart className="w-5 h-5" /> },
  { name: 'Card', icon: <CreditCard className="w-5 h-5" /> },
  { name: 'Donut', icon: <Circle className="w-5 h-5" /> },
  { name: 'Combo', icon: <Layers className="w-5 h-5" /> },
  { name: 'TextBox', icon: <Type className="w-5 h-5" /> },
  { name: 'Image', icon: <ImageIcon className="w-5 h-5" /> },
  { name: 'Slicer', icon: <Filter className="w-5 h-5" /> },
  { name: 'ActionButton', icon: <PlaySquare className="w-5 h-5" /> },
  { name: 'Matrix', icon: <Table className="w-5 h-5" /> },
  { name: 'Table', icon: <Table className="w-5 h-5" /> },
  { name: 'Gauge', icon: <GaugeCircle className="w-5 h-5" /> },
];

export function CustomizationSidebar({
  onAddVisualization,
  selectedVisualization,
  onUpdateSelectedVisualization,
  onDeleteSelectedVisualization,
  fields,
  dataset,
  datasets,
  onSetCanvasBackground,
  isLocked,
  onToggleLock,
  allVisualizations,
  staticMeasures,
  parameters,
  allMeasureFields,
}: CustomizationSidebarProps) {

  const handleOptionChange = (path: string, value: any) => {
    if (!selectedVisualization) return;

    const keys = path.split('.');
    const newOptions = JSON.parse(JSON.stringify(selectedVisualization.options));
    let currentLevel: any = newOptions;

    for (let i = 0; i < keys.length - 1; i++) {
      if (currentLevel[keys[i]] === undefined) {
        currentLevel[keys[i]] = {};
      }
      currentLevel = currentLevel[keys[i]];
    }
    currentLevel[keys[keys.length - 1]] = value;

    onUpdateSelectedVisualization({ options: newOptions });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("File is too large. Please upload an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onSetCanvasBackground(reader.result as string);
      };
      reader.onerror = () => {
        toast.error("Could not read the file. Please try again.");
      }
      reader.readAsDataURL(file);
    }
  };

  const isChart = selectedVisualization && !['Card', 'TextBox', 'Image', 'Slicer', 'Shape', 'ActionButton', 'Matrix', 'Table', 'Gauge'].includes(selectedVisualization.type);
  const isStackedBar = selectedVisualization && ['StackedBar', 'StackedBarHorizontal'].includes(selectedVisualization.type);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold tracking-tight p-4 pb-2">Dashboard Controls</h2>
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <Accordion type="multiple" defaultValue={['add-visuals', 'canvas-settings']} className="w-full">
          <AccordionItem value="canvas-settings">
            <AccordionTrigger>Canvas Settings</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="bg-upload">Background Image</Label>
                <Input id="bg-upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label>{isLocked ? 'Canvas Locked' : 'Lock Canvas'}</Label>
                <Button variant="outline" size="icon" onClick={onToggleLock}>
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="add-visuals">
            <AccordionTrigger>Add Visualizations</AccordionTrigger>
            <AccordionContent>
           
              <div className="flex flex-wrap pt-2">
  {vizOptions.map((viz, index) => (
    <Tooltip key={viz.name}>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center justify-center h-12 w-12 rounded-none border-r-0 border-b ${
            index % 4 === 0 ? '' : ''
          } ${
            index % 4 === 3 ? '' : ''
          } ${
            index >= vizOptions.length - (vizOptions.length % 4 || 4) && index % 4 === 0 ? '' : ''
          } ${
            index >= vizOptions.length - (vizOptions.length % 4 || 4) && index % 4 === 3 ? '' : ''
          } ${
            index >= vizOptions.length - (vizOptions.length % 4 || 4) ? '' : ''
          } ${
            index % 4 === 3 || index === vizOptions.length - 1 ? 'border-r' : ''
          }`}
          style={{ flexBasis: '25%' }}
          onClick={() => onAddVisualization(viz.name)}
        >
          {viz.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{viz.name}</p>
      </TooltipContent>
    </Tooltip>
  ))}
</div>

              
            </AccordionContent>
          </AccordionItem>

          {selectedVisualization && (
            <AccordionItem value="format-visual">
              <AccordionTrigger>Format Visual</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <Accordion type="multiple" defaultValue={['data-mapping', 'image-settings', 'text-box-settings', 'slicer-settings', 'shape-settings', 'general', 'action-button-settings', 'matrix-settings', 'table-settings', 'gauge-settings']} className="w-full space-y-2">
                  
                  {selectedVisualization.type === 'Shape' && (
                    <AccordionItem value="shape-settings">
                      <AccordionTrigger className="text-sm py-2">Shape Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <ShapeSettings 
                          visualization={selectedVisualization} 
                          onOptionChange={handleOptionChange} 
                          onUpdateVisualization={onUpdateSelectedVisualization} 
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type === 'ActionButton' && (
                    <AccordionItem value="action-button-settings">
                      <AccordionTrigger className="text-sm py-2">Action Button Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <ActionButtonSettings
                          options={selectedVisualization.options}
                          onOptionChange={handleOptionChange}
                          allVisualizations={allVisualizations}
                          currentVizId={selectedVisualization.id}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type === 'Image' && (
                    <AccordionItem value="image-settings">
                      <AccordionTrigger className="text-sm py-2">Image Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <ImageSettings 
                          options={selectedVisualization.options} 
                          onOptionChange={handleOptionChange} 
                          allDatasets={datasets}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type === 'TextBox' && (
                    <AccordionItem value="text-box-settings">
                      <AccordionTrigger className="text-sm py-2">Text Box Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <TextBoxSettings options={selectedVisualization.options} onOptionChange={handleOptionChange} />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type === 'Slicer' && (
                    <AccordionItem value="slicer-settings">
                      <AccordionTrigger className="text-sm py-2">Slicer Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <SlicerSettings 
                          options={selectedVisualization.options} 
                          onOptionChange={handleOptionChange}
                          fields={fields}
                          dataset={dataset}
                          allDatasets={datasets}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type === 'Matrix' && (
                    <AccordionItem value="matrix-settings">
                      <AccordionTrigger className="text-sm py-2">Matrix Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <MatrixSettings 
                          options={selectedVisualization.options} 
                          onOptionChange={handleOptionChange}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type === 'Table' && (
                    <AccordionItem value="table-settings">
                      <AccordionTrigger className="text-sm py-2">Table Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <TableSettings 
                          options={selectedVisualization.options} 
                          onOptionChange={handleOptionChange}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type === 'Gauge' && (
                    <AccordionItem value="gauge-settings">
                      <AccordionTrigger className="text-sm py-2">Gauge Settings</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <GaugeSettings 
                          options={selectedVisualization.options} 
                          onOptionChange={handleOptionChange}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {selectedVisualization.type !== 'Image' && selectedVisualization.type !== 'TextBox' && selectedVisualization.type !== 'ActionButton' && (
                    <AccordionItem value="data-mapping">
                      <AccordionTrigger className="text-sm py-2">Data Mapping</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <DataSettings 
                          visualization={selectedVisualization}
                          datasets={datasets}
                          onUpdateSelectedVisualization={onUpdateSelectedVisualization}
                          options={selectedVisualization.options} 
                          fields={fields} 
                          dataset={dataset} 
                          chartType={selectedVisualization.type} 
                          onOptionChange={handleOptionChange} 
                          staticMeasures={staticMeasures}
                          parameters={parameters}
                          allMeasureFields={allMeasureFields}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  <AccordionItem value="general">
                    <AccordionTrigger className="text-sm py-2">General</AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <GeneralSettings 
                        options={selectedVisualization.options} 
                        onOptionChange={handleOptionChange} 
                        chartType={selectedVisualization.type}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {isChart && (
                    <AccordionItem value="chart-specific">
                      <AccordionTrigger className="text-sm py-2">Chart Specific</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <ChartSpecificSettings 
                          options={selectedVisualization.options} 
                          onOptionChange={handleOptionChange} 
                          chartType={selectedVisualization.type} 
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {isStackedBar && (
                    <AccordionItem value="bar-formatting">
                      <AccordionTrigger className="text-sm py-2">Bar Formatting</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <StackedBarSettings options={selectedVisualization.options} onOptionChange={handleOptionChange} />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {['Bar', 'Pie', 'Donut', 'Card', 'Shape'].includes(selectedVisualization.type) && (
                     <AccordionItem value="conditional-formatting">
                        <AccordionTrigger className="text-sm py-2">Conditional Formatting</AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <ConditionalFormattingSettings options={selectedVisualization.options} onOptionChange={handleOptionChange} />
                        </AccordionContent>
                      </AccordionItem>
                  )}

                  {selectedVisualization.type !== 'Image' && selectedVisualization.type !== 'TextBox' && selectedVisualization.type !== 'Slicer' && selectedVisualization.type !== 'Shape' && selectedVisualization.type !== 'ActionButton' && selectedVisualization.type !== 'Matrix' && selectedVisualization.type !== 'Table' && selectedVisualization.type !== 'Gauge' && (
                    <>
                      <AccordionItem value="colors">
                        <AccordionTrigger className="text-sm py-2">Colors</AccordionTrigger>
                        <AccordionContent className="pt-4"><ColorSettings options={selectedVisualization.options} onOptionChange={handleOptionChange} isComboChart={selectedVisualization.type === 'Combo'} /></AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="legend">
                        <AccordionTrigger className="text-sm py-2">Legend</AccordionTrigger>
                        <AccordionContent className="pt-4"><LegendSettings options={selectedVisualization.options} onOptionChange={handleOptionChange} /></AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="axis">
                        <AccordionTrigger className="text-sm py-2">X & Y Axis</AccordionTrigger>
                        <AccordionContent className="pt-4"><AxisSettings options={selectedVisualization.options} onOptionChange={handleOptionChange} /></AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="data-labels">
                        <AccordionTrigger className="text-sm py-2">Data Labels</AccordionTrigger>
                        <AccordionContent className="pt-4"><DataLabelSettings options={selectedVisualization.options} onOptionChange={handleOptionChange} /></AccordionContent>
                      </AccordionItem>
                    </>
                  )}
                </Accordion>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={onDeleteSelectedVisualization}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Visual
                </Button>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  )
}