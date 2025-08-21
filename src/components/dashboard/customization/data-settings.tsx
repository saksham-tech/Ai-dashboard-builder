import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type VisualizationOptions, type ChartType, type AggregationType, type ValueKeyConfig, type FieldFormattingOptions, type Dataset, type Visualization, type Parameter } from "@/types/visualizations";
import { DropZone } from "../drop-zone";
import { Button } from "@/components/ui/button";
import { Trash2, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FieldFormattingSettings } from "./field-formatting-settings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

interface DataSettingsProps {
  options: VisualizationOptions;
  fields: string[];
  chartType: ChartType;
  onOptionChange: (path: string, value: any) => void;
  dataset: Record<string, any>[];
  datasets: Dataset[];
  visualization: Visualization;
  onUpdateSelectedVisualization: (props: Partial<Visualization>) => void;
  staticMeasures: Record<string, string | number>;
  parameters: Parameter[];
  allMeasureFields: string[];
}

const aggregationOptions: { value: AggregationType, label: string }[] = [
    { value: 'NONE', label: 'None (Raw)' },
    { value: 'SUM', label: 'Sum' },
    { value: 'AVERAGE', label: 'Average' },
    { value: 'COUNT', label: 'Count' },
    { value: 'COUNT_DISTINCT', label: 'Count Distinct' },
    { value: 'MAX', label: 'Maximum' },
    { value: 'MIN', label: 'Minimum' },
];

const isStackedChart = (chartType: ChartType) => ['StackedBar', 'StackedBarHorizontal'].includes(chartType);

const createCompositeKey = (datasetId: string, field: string) => `${datasetId}:${field}`;
const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

const isFieldNumeric = (dataset: Dataset | undefined, fieldName: string): boolean => {
  if (!dataset || dataset.data.length === 0) return false;
  const sample = dataset.data.find(row => row[fieldName] != null && row[fieldName] !== '');
  if (!sample) return false;
  const value = sample[fieldName];
  
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return true;
  if (typeof value !== 'string' || value.trim() === '') return false;
  
  const cleanedValue = value.replace(/[\s$,€£¥,]/g, '');
  if (cleanedValue === '') return false;
  
  return !isNaN(Number(cleanedValue));
};

export function DataSettings({ options, fields, chartType, onOptionChange, dataset, datasets, visualization, onUpdateSelectedVisualization, staticMeasures, parameters, allMeasureFields }: DataSettingsProps) {
  const { dataMapping } = options;
  const isKpiCard = chartType === 'Card';
  const nameLabel = isKpiCard ? 'Category' : 'X-Axis';
  const valueLabel = isKpiCard ? 'Value' : 'Y-Axis';

  const handleSelectChange = (fieldKey: keyof VisualizationOptions['dataMapping'], value: string | null) => {
    if (!value) {
      onOptionChange(`dataMapping.${fieldKey}`, null);
      return;
    }

    const parsed = parseCompositeKey(value);
    if (!parsed) return;
    const { datasetId } = parsed;

    const currentBaseId = visualization.datasetId;
    let newBaseId = currentBaseId;

    const isDataSourceField = datasetId !== 'calculated' && datasetId !== 'static' && datasetId !== 'parameter';

    if (isDataSourceField) {
        if (!currentBaseId || fieldKey === 'nameKey' || fieldKey === 'slicerKey' || (chartType === 'Card' && fieldKey === 'valueKey')) {
            newBaseId = datasetId;
        }
    }

    const newOptions = JSON.parse(JSON.stringify(options));
    
    if (newBaseId && newBaseId !== currentBaseId) {
        const newVizProps: Partial<Visualization> = { datasetId: newBaseId };
        
        const newDataMapping = {
            ...newOptions.dataMapping,
            nameKey: null, valueKey: null, valueKeys: [], secondaryValueKey: null, slicerKey: null,
        };
        newDataMapping[fieldKey] = value;
        newOptions.dataMapping = newDataMapping;
        newVizProps.options = newOptions;

        onUpdateSelectedVisualization(newVizProps);
    } else {
        newOptions.dataMapping[fieldKey] = value;
        onUpdateSelectedVisualization({ options: newOptions });
    }
  };

  const handleFieldDrop = (fieldKey: keyof VisualizationOptions['dataMapping'], payload: { field: string; datasetId: string }) => {
    const value = createCompositeKey(payload.datasetId, payload.field);
    handleSelectChange(fieldKey, value);
  };

  const handleValueDrop = (payload: { field: string; datasetId: string }) => {
    const compositeKey = createCompositeKey(payload.datasetId, payload.field);

    if (dataMapping.valueKeys.some(vk => vk.field === compositeKey)) {
      toast.info(`Field "${payload.field}" is already added.`);
      return;
    }

    const targetDataset = datasets.find(ds => ds.id === payload.datasetId);
    const isNumeric = isFieldNumeric(targetDataset, payload.field);
    const aggregation = chartType === 'Table' ? 'NONE' : (isNumeric ? 'SUM' : 'COUNT');

    const newValueKey: ValueKeyConfig = { field: compositeKey, aggregation };
    const newValueKeys = [...dataMapping.valueKeys, newValueKey];
    onOptionChange('dataMapping.valueKeys', newValueKeys);

    if (chartType === 'Table') {
        const currentBaseId = visualization.datasetId;
        const firstDataTableColumn = newValueKeys.find(vk => parseCompositeKey(vk.field)?.datasetId !== 'calculated');
        const newBaseId = firstDataTableColumn ? parseCompositeKey(firstDataTableColumn.field)?.datasetId : undefined;

        if (newBaseId && newBaseId !== currentBaseId) {
            onUpdateSelectedVisualization({ datasetId: newBaseId });
        }
    } else if (!visualization.datasetId && payload.datasetId !== 'calculated' && payload.datasetId !== 'parameter') {
        onUpdateSelectedVisualization({ datasetId: payload.datasetId });
    }
  };

  const handleRemoveValueKey = (index: number) => {
    const newValueKeys = dataMapping.valueKeys.filter((_, i) => i !== index);
    onOptionChange('dataMapping.valueKeys', newValueKeys);

    if (chartType === 'Table') {
        const currentBaseId = visualization.datasetId;
        const firstDataTableColumn = newValueKeys.find(vk => parseCompositeKey(vk.field)?.datasetId !== 'calculated');
        const newBaseId = firstDataTableColumn ? parseCompositeKey(firstDataTableColumn.field)?.datasetId : undefined;

        if (newBaseId !== currentBaseId) {
            onUpdateSelectedVisualization({ datasetId: newBaseId });
        }
    }
  };

  const handleValueKeyChange = (index: number, field: keyof ValueKeyConfig, value: any) => {
    const newValueKeys = [...dataMapping.valueKeys];
    (newValueKeys[index] as any)[field] = value;
    onOptionChange('dataMapping.valueKeys', newValueKeys);

    if (field === 'field' && index === 0) {
      const parsed = parseCompositeKey(value);
      if (parsed && parsed.datasetId !== 'calculated' && parsed.datasetId !== 'parameter') {
        onUpdateSelectedVisualization({ datasetId: parsed.datasetId });
      }
    }
  };

  const handleFormattingChange = (path: string, formatting: FieldFormattingOptions) => {
    onOptionChange(path, formatting);
  };

  const handleTopNToggle = (enabled: boolean) => {
    if (enabled) {
      const parsedValueKey = parseCompositeKey(dataMapping.valueKey)?.field;
      onOptionChange('dataMapping.topN', {
        enabled: true,
        count: 5,
        by: isStackedChart(chartType) ? (parseCompositeKey(dataMapping.valueKeys[0]?.field)?.field || '') : (parsedValueKey || ''),
        order: 'desc',
      });
    } else {
      const newTopN = { ...options.dataMapping.topN, enabled: false };
      onOptionChange('dataMapping.topN', newTopN);
    }
  };

  const formatCompositeKeyForDisplay = (key: string | null) => {
    if (!key) return '';
    const parsed = parseCompositeKey(key);
    if (!parsed) return key;
    if (parsed.datasetId === 'static') {
      return `${parsed.field} (Static Measure)`;
    }
    if (parsed.datasetId === 'parameter') {
      return `${parsed.field} (Parameter)`;
    }
    const ds = datasets.find(d => d.id === parsed.datasetId);
    const dsName = ds ? ds.name : (parsed.datasetId === 'calculated' ? 'Measures' : 'Unknown');
    return `${parsed.field} (${dsName})`;
  }

  const allMeasuresWithKeys = useMemo(() => {
    const measures: { key: string, name: string }[] = [];
    const seen = new Set<string>();

    Object.keys(staticMeasures).forEach(name => {
        if (!seen.has(name)) {
            measures.push({ key: createCompositeKey('static', name), name });
            seen.add(name);
        }
    });

    allMeasureFields.forEach(measureName => {
      if (seen.has(measureName)) return;

      const ownerDataset = datasets.find(ds => ds.fields.includes(measureName));
      const datasetId = ownerDataset ? ownerDataset.id : 'calculated';
      
      measures.push({ key: createCompositeKey(datasetId, measureName), name: measureName });
      seen.add(measureName);
    });

    return measures.sort((a, b) => a.name.localeCompare(b.name));
  }, [datasets, allMeasureFields, staticMeasures]);

  const renderSelectContent = () => (
    <SelectContent>
      {parameters.length > 0 && (
        <SelectGroup>
          <SelectLabel>Parameters</SelectLabel>
          {parameters.map(p => (
            <SelectItem key={`param-${p.id}`} value={createCompositeKey('parameter', p.name)}>
              {p.name}
            </SelectItem>
          ))}
        </SelectGroup>
      )}
      {allMeasuresWithKeys.length > 0 && (
        <SelectGroup>
          <SelectLabel>Measures</SelectLabel>
          {allMeasuresWithKeys.map(m => (
            <SelectItem key={m.key} value={m.key}>{m.name}</SelectItem>
          ))}
        </SelectGroup>
      )}
      {datasets.map(ds => (
        <SelectGroup key={ds.id}>
          <SelectLabel>{ds.name}</SelectLabel>
          {ds.fields.filter(f => !allMeasureFields.includes(f)).map(field => (
            <SelectItem key={`${ds.id}-${field}`} value={createCompositeKey(ds.id, field)}>
              {field}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </SelectContent>
  );

  const showTopN = isStackedChart(chartType) || chartType === 'HorizontalBar' || chartType === 'Bar';
  const showSortOptions = ['Bar', 'HorizontalBar', 'StackedBar', 'StackedBarHorizontal'].includes(chartType);

  return (
    <div className="space-y-4">
      {(chartType === 'Bar' || chartType === 'HorizontalBar' || isStackedChart(chartType)) && (
        <div className="space-y-3">
          <Label>Percentage</Label>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Normalize to 100%</div>
            <Switch
              checked={!!options.dataMapping.normalizeToPercent}
              onCheckedChange={(v) => onOptionChange('dataMapping.normalizeToPercent', v)}
            />
          </div>
          {(chartType === 'Bar' || chartType === 'HorizontalBar') && options.dataMapping.normalizeToPercent && (
            <DropZone onDrop={(payload) => handleFieldDrop('denominatorKey', payload)}>
              <div className="space-y-2">
                <Label>Denominator (e.g., Total Quantity)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={options.dataMapping.denominatorKey || ''}
                      onValueChange={(v) => handleSelectChange('denominatorKey', v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Drop or select field" /></SelectTrigger>
                      {renderSelectContent()}
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Percentage is computed as (Value / Denominator) × 100 per category.</p>
              </div>
            </DropZone>
          )}
          {options.dataMapping.normalizeToPercent && (
            <div className="space-y-2">
              <Label>Decimal Places</Label>
              <Input
                type="number"
                min={0}
                max={6}
                value={options.dataMapping.percentDecimals ?? 0}
                onChange={(e) => onOptionChange('dataMapping.percentDecimals', Math.max(0, Math.min(6, Number(e.target.value))))}
              />
            </div>
          )}
        </div>
      )}
      {chartType === 'Gauge' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <DropZone onDrop={(payload) => handleFieldDrop('valueKey', payload)}>
              <Label>Value</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Select value={dataMapping.valueKey || ''} onValueChange={(v) => handleSelectChange('valueKey', v)}>
                    <SelectTrigger><SelectValue placeholder="Drop or select field" /></SelectTrigger>
                    {renderSelectContent()}
                  </Select>
                </div>
                {dataMapping.valueKey && (
                  <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                    <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.valueKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.valueKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.valueKey)?.field || ''} /></PopoverContent>
                  </Popover>
                )}
              </div>
            </DropZone>
            {dataMapping.valueKey && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aggregation</Label>
                <Select value={dataMapping.valueKeyAggregation || 'SUM'} onValueChange={(value) => onOptionChange('dataMapping.valueKeyAggregation', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <DropZone onDrop={(payload) => handleFieldDrop('gaugeMinValueKey', payload)}>
              <Label>Min Value</Label>
              <Select value={dataMapping.gaugeMinValueKey || ''} onValueChange={(v) => handleSelectChange('gaugeMinValueKey', v)}>
                <SelectTrigger><SelectValue placeholder="Drop or select field (optional)" /></SelectTrigger>
                {renderSelectContent()}
              </Select>
            </DropZone>
            {dataMapping.gaugeMinValueKey && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aggregation</Label>
                <Select value={dataMapping.gaugeMinValueAggregation || 'SUM'} onValueChange={(value) => onOptionChange('dataMapping.gaugeMinValueAggregation', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <DropZone onDrop={(payload) => handleFieldDrop('gaugeMaxValueKey', payload)}>
              <Label>Max Value</Label>
              <Select value={dataMapping.gaugeMaxValueKey || ''} onValueChange={(v) => handleSelectChange('gaugeMaxValueKey', v)}>
                <SelectTrigger><SelectValue placeholder="Drop or select field (optional)" /></SelectTrigger>
                {renderSelectContent()}
              </Select>
            </DropZone>
            {dataMapping.gaugeMaxValueKey && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aggregation</Label>
                <Select value={dataMapping.gaugeMaxValueAggregation || 'SUM'} onValueChange={(value) => onOptionChange('dataMapping.gaugeMaxValueAggregation', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <DropZone onDrop={(payload) => handleFieldDrop('gaugeTargetValueKey', payload)}>
              <Label>Target Value</Label>
              <Select value={dataMapping.gaugeTargetValueKey || ''} onValueChange={(v) => handleSelectChange('gaugeTargetValueKey', v)}>
                <SelectTrigger><SelectValue placeholder="Drop or select field (optional)" /></SelectTrigger>
                {renderSelectContent()}
              </Select>
            </DropZone>
            {dataMapping.gaugeTargetValueKey && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aggregation</Label>
                <Select value={dataMapping.gaugeTargetValueAggregation || 'SUM'} onValueChange={(value) => onOptionChange('dataMapping.gaugeTargetValueAggregation', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {chartType === 'Table' && (
        <div className="space-y-2">
          <Label>Columns</Label>
          <DropZone onDrop={handleValueDrop} className="p-2 space-y-2 bg-muted/30 min-h-[80px] flex flex-col justify-center">
            {dataMapping.valueKeys.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">Drag fields here to add them as columns</p>
            )}
            <div className="space-y-2 w-full">
              {dataMapping.valueKeys.map((vk, index) => (
                <div key={index} className="p-2 space-y-2 bg-background rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 font-medium text-sm truncate">{formatCompositeKeyForDisplay(vk.field)}</div>
                    <Popover>
                      <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                      <PopoverContent className="w-64"><FieldFormattingSettings formatting={vk.formatting || {}} onFormattingChange={(f) => handleValueKeyChange(index, 'formatting', f)} dataset={dataset} fieldName={parseCompositeKey(vk.field)?.field || ''} /></PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveValueKey(index)}>
                      <Trash2 className="h-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Select onValueChange={(value) => {
                if (!value) return;
                const parsed = parseCompositeKey(value);
                if (parsed) handleValueDrop(parsed);
            }}>
                <SelectTrigger>
                    <SelectValue placeholder="Add a column..." />
                </SelectTrigger>
                {renderSelectContent()}
            </Select>
          </DropZone>
        </div>
      )}

      {chartType === 'Matrix' && (
        <div className="space-y-4">
          <DropZone onDrop={(payload) => handleFieldDrop('nameKey', payload)}>
            <Label>Rows</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Select value={dataMapping.nameKey || ''} onValueChange={(v) => handleSelectChange('nameKey', v)}>
                  <SelectTrigger><SelectValue placeholder="Drop or select field" /></SelectTrigger>
                  {renderSelectContent()}
                </Select>
              </div>
              {dataMapping.nameKey && (
                <Popover>
                  <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                  <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.nameKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.nameKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.nameKey)?.field || ''} /></PopoverContent>
                </Popover>
              )}
            </div>
          </DropZone>
          <DropZone onDrop={(payload) => handleFieldDrop('secondaryValueKey', payload)}>
            <Label>Columns</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Select value={dataMapping.secondaryValueKey || ''} onValueChange={(v) => handleSelectChange('secondaryValueKey', v)}>
                  <SelectTrigger><SelectValue placeholder="Drop or select field" /></SelectTrigger>
                  {renderSelectContent()}
                </Select>
              </div>
              {dataMapping.secondaryValueKey && (
                <Popover>
                  <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                  <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.secondaryValueKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.secondaryValueKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.secondaryValueKey)?.field || ''} /></PopoverContent>
                </Popover>
              )}
            </div>
          </DropZone>
          <DropZone onDrop={(payload) => handleFieldDrop('valueKey', payload)}>
            <Label>Values</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Select value={dataMapping.valueKey || ''} onValueChange={(v) => handleSelectChange('valueKey', v)}>
                  <SelectTrigger><SelectValue placeholder="Drop or select field" /></SelectTrigger>
                  {renderSelectContent()}
                </Select>
              </div>
              {dataMapping.valueKey && (
                <Popover>
                  <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                  <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.valueKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.valueKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.valueKey)?.field || ''} /></PopoverContent>
                </Popover>
              )}
            </div>
          </DropZone>
          {dataMapping.valueKey && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Aggregation</Label>
              <Select value={dataMapping.valueKeyAggregation || 'SUM'} onValueChange={(v) => onOptionChange('dataMapping.valueKeyAggregation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{aggregationOptions.filter(o => o.value === 'SUM' || o.value === 'AVERAGE').map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {chartType === 'Shape' && (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
                Optionally, select a data field to drive conditional formatting rules for this shape.
            </p>
            <DropZone onDrop={(payload) => handleFieldDrop('valueKey', payload)}>
                <Label>Value Field</Label>
                <div className="flex items-center gap-2">
                    <Select
                        value={dataMapping.valueKey || 'none'}
                        onValueChange={(value) => handleSelectChange('valueKey', value === 'none' ? null : value)}
                    >
                        <SelectTrigger><SelectValue placeholder="Drop or select a field" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {renderSelectContent()}
                        </SelectContent>
                    </Select>
                </div>
            </DropZone>
            {dataMapping.valueKey && (
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Aggregation</Label>
                    <Select
                        value={dataMapping.valueKeyAggregation || 'NONE'}
                        onValueChange={(value) => onOptionChange('dataMapping.valueKeyAggregation', value)}
                    >
                        <SelectTrigger><SelectValue placeholder="Select aggregation" /></SelectTrigger>
                        <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
        </div>
      )}

      {chartType === 'Slicer' && (
        <div className="space-y-1">
          <DropZone onDrop={(payload) => handleFieldDrop('slicerKey', payload)}>
            <div className="space-y-2">
              <Label>Slicer Field</Label>
              <Select
                value={dataMapping.slicerKey || ''}
                onValueChange={(value) => handleSelectChange('slicerKey', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Drop or select a field" />
                </SelectTrigger>
                {renderSelectContent()}
              </Select>
            </div>
          </DropZone>
        </div>
      )}

      {isStackedChart(chartType) && (
        <div className="space-y-4">
          <DropZone onDrop={(payload) => handleFieldDrop('nameKey', payload)}>
            <div className="space-y-2">
              <Label>{chartType === 'StackedBarHorizontal' ? 'Category (Y-Axis)' : 'Category (X-Axis)'}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Select
                    value={dataMapping.nameKey || ''}
                    onValueChange={(value) => handleSelectChange('nameKey', value)}
                  >
                    <SelectTrigger className="w-full truncate"><SelectValue placeholder="Drop or select a category" /></SelectTrigger>
                    {renderSelectContent()}
                  </Select>
                </div>
                {dataMapping.nameKey && (
                  <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                    <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.nameKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.nameKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.nameKey)?.field || ''} /></PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </DropZone>
          
          <div className="space-y-2">
            <Label>{chartType === 'StackedBarHorizontal' ? 'Values (X-Axis)' : 'Values (Y-Axis)'}</Label>
            <DropZone onDrop={handleValueDrop} className="p-2 space-y-2 bg-muted/30">
              <div className="space-y-2">
                {dataMapping.valueKeys.map((vk, index) => (
                  <div key={index} className="p-2 space-y-2 bg-background rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 font-medium text-sm truncate">{formatCompositeKeyForDisplay(vk.field)}</div>
                      <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                        <PopoverContent className="w-64"><FieldFormattingSettings formatting={vk.formatting || {}} onFormattingChange={(f) => handleValueKeyChange(index, 'formatting', f)} dataset={dataset} fieldName={parseCompositeKey(vk.field)?.field || ''} /></PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleRemoveValueKey(index)}>
                        <Trash2 className="h-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Color</Label>
                        <Input type="color" value={vk.color || '#4f46e5'} onChange={(e) => handleValueKeyChange(index, 'color', e.target.value)} className="h-8 w-12 p-1" />
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Label className="text-xs">Show Label</Label>
                        <Switch checked={!!vk.showLabel} onCheckedChange={(v) => handleValueKeyChange(index, 'showLabel', v)} />
                      </div>
                    </div>
                    <Select value={vk.aggregation} onValueChange={(v: AggregationType) => handleValueKeyChange(index, 'aggregation', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Select onValueChange={(value) => {
                  if (!value) return;
                  const parsed = parseCompositeKey(value);
                  if (parsed) handleValueDrop(parsed);
              }}>
                  <SelectTrigger>
                      <SelectValue placeholder="Add a field to stack..." />
                  </SelectTrigger>
                  {renderSelectContent()}
              </Select>
            </DropZone>
          </div>
        </div>
      )}

      {!isStackedChart(chartType) && !['Slicer', 'Shape', 'Matrix', 'Table', 'Gauge'].includes(chartType) && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{nameLabel}</Label>
            {isKpiCard && (
              <RadioGroup
                value={dataMapping.categoryType || 'field'}
                onValueChange={(value) => onOptionChange('dataMapping.categoryType', value)}
                className="flex items-center space-x-4 my-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="field" id="cat-type-field" />
                  <Label htmlFor="cat-type-field" className="font-normal">From Field</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="cat-type-custom" />
                  <Label htmlFor="cat-type-custom" className="font-normal">Custom Text</Label>
                </div>
              </RadioGroup>
            )}

            {(!isKpiCard || (dataMapping.categoryType || 'field') === 'field') ? (
              <DropZone onDrop={(payload) => handleFieldDrop('nameKey', payload)}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={dataMapping.nameKey || (isKpiCard ? 'none' : '')}
                      onValueChange={(value) => handleSelectChange('nameKey', value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="w-full truncate"><SelectValue placeholder="Drop or select a field" /></SelectTrigger>
                      <SelectContent>
                        {isKpiCard && <SelectItem value="none">None</SelectItem>}
                        {renderSelectContent()}
                      </SelectContent>
                    </Select>
                  </div>
                  {dataMapping.nameKey && (
                    <Popover>
                      <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                      <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.nameKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.nameKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.nameKey)?.field || ''} /></PopoverContent>
                    </Popover>
                  )}
                </div>
              </DropZone>
            ) : (
              <Input
                value={dataMapping.customCategoryText || ''}
                onChange={(e) => onOptionChange('dataMapping.customCategoryText', e.target.value)}
                placeholder="Enter custom category"
              />
            )}
            {dataMapping.nameKey && (!isKpiCard || (dataMapping.categoryType || 'field') === 'field') && (
              <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Aggregation</Label>
                  <Select
                    value={dataMapping.nameKeyAggregation || 'NONE'}
                    onValueChange={(value) => onOptionChange('dataMapping.nameKeyAggregation', value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select aggregation" /></SelectTrigger>
                    <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <DropZone onDrop={(payload) => handleFieldDrop('valueKey', payload)}>
              <Label>{valueLabel}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Select
                    value={dataMapping.valueKey || (isKpiCard ? 'none' : '')}
                    onValueChange={(value) => handleSelectChange('valueKey', value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="w-full truncate"><SelectValue placeholder="Drop or select a field" /></SelectTrigger>
                    <SelectContent>
                      {isKpiCard && <SelectItem value="none">None</SelectItem>}
                      {renderSelectContent()}
                    </SelectContent>
                  </Select>
                </div>
                {dataMapping.valueKey && (
                  <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                    <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.valueKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.valueKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.valueKey)?.field || ''} /></PopoverContent>
                  </Popover>
                )}
              </div>
            </DropZone>
            {dataMapping.valueKey && (
              <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Aggregation</Label>
                  <Select
                    value={dataMapping.valueKeyAggregation || 'NONE'}
                    onValueChange={(value) => onOptionChange('dataMapping.valueKeyAggregation', value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select aggregation" /></SelectTrigger>
                    <SelectContent>{aggregationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
              </div>
            )}
          </div>

          {['Combo', 'StackedArea'].includes(chartType) && (
            <DropZone onDrop={(payload) => handleFieldDrop('secondaryValueKey', payload)}>
              <div className="space-y-2">
                <Label>Secondary Y-Axis</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={dataMapping.secondaryValueKey || ''}
                      onValueChange={(value) => handleSelectChange('secondaryValueKey', value)}
                    >
                      <SelectTrigger className="w-full truncate"><SelectValue placeholder="Drop or select a field" /></SelectTrigger>
                      {renderSelectContent()}
                    </Select>
                  </div>
                  {dataMapping.secondaryValueKey && (
                    <Popover>
                      <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button></PopoverTrigger>
                      <PopoverContent className="w-64"><FieldFormattingSettings formatting={dataMapping.secondaryValueKeyFormatting || {}} onFormattingChange={(f) => handleFormattingChange('dataMapping.secondaryValueKeyFormatting', f)} dataset={dataset} fieldName={parseCompositeKey(dataMapping.secondaryValueKey)?.field || ''} /></PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </DropZone>
          )}
        </div>
      )}
      {showTopN && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="top-n">
            <AccordionTrigger className="text-sm py-2">Limit Categories (Top N)</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label>Enable Top N</Label>
                <Switch
                  checked={dataMapping.topN?.enabled || false}
                  onCheckedChange={handleTopNToggle}
                />
              </div>
              {dataMapping.topN?.enabled && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label>Count</Label>
                    <Input
                      type="number"
                      min="1"
                      value={dataMapping.topN.count || 5}
                      onChange={(e) => onOptionChange('dataMapping.topN.count', parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                  {isStackedChart(chartType) && (
                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select
                        value={dataMapping.topN.by || ''}
                        onValueChange={(value) => onOptionChange('dataMapping.topN.by', value)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select field to sort by" /></SelectTrigger>
                        <SelectContent>
                          {dataMapping.valueKeys.map(vk => (
                            <SelectItem key={vk.field} value={parseCompositeKey(vk.field)?.field || ''}>{formatCompositeKeyForDisplay(vk.field)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Select
                      value={dataMapping.topN.order || 'desc'}
                      onValueChange={(value) => onOptionChange('dataMapping.topN.order', value)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      {showSortOptions && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="sort">
            <AccordionTrigger className="text-sm py-2">Sorting</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select
                  value={dataMapping.sortOrder || 'none'}
                  onValueChange={(value) => onOptionChange('dataMapping.sortOrder', value === 'none' ? undefined : value)}
                  disabled={dataMapping.topN?.enabled}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (by category)</SelectItem>
                    <SelectItem value="desc">Descending (by value)</SelectItem>
                    <SelectItem value="asc">Ascending (by value)</SelectItem>
                  </SelectContent>
                </Select>
                {dataMapping.topN?.enabled && <p className="text-xs text-muted-foreground">Sorting is controlled by Top N settings.</p>}
              </div>
              {isStackedChart(chartType) && dataMapping.sortOrder && !dataMapping.topN?.enabled && (
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={dataMapping.sortBySeries || 'total'}
                    onValueChange={(value) => onOptionChange('dataMapping.sortBySeries', value)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Total of all series</SelectItem>
                      {dataMapping.valueKeys.map(vk => (
                        <SelectItem key={vk.field} value={parseCompositeKey(vk.field)?.field || ''}>{formatCompositeKeyForDisplay(vk.field)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}