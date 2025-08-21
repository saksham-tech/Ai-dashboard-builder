import { useState, useMemo, useEffect } from "react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { type TransformationType, type Dataset, type AggregationType } from "@/types/visualizations";
import { isDate } from "@/lib/date-parser";
import { parseDate } from "@/lib/date-parser";

interface TransformFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allFields: string[];
  datasets: Dataset[];
  onSave: (
    datasetId: string,
    name: string,
    sourceField: string,
    transformation: TransformationType,
    value?: string,
    excludeByCategoryField?: string,
    excludeByCategoryValues?: string[],
    filterOnField?: string,
    valuesToFilter?: string[],
    aggregation?: AggregationType,
    groupByFields?: string[],
    conditionalThenMode?: 'column' | 'literal',
    conditionalThenField?: string,
    conditionalThenValue?: string,
    conditionalElseMode?: 'column' | 'literal',
    conditionalElseField?: string,
    conditionalElseValue?: string,
    combineParts?: Array<{
      mode: 'column' | 'literal';
      field?: string;
      value?: string;
      dateFormat?: 'default' | 'MMM D, YYYY' | 'YYYY-MM-DD' | 'DayOfWeek' | 'MonthName';
      timeFormat?: 'default' | 'h:mm A' | 'HH:mm';
      color?: string;
      fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
      space?: number;
    }>,
  ) => void;
  measureFields: string[];
}

const isPotentiallyNumeric = (value: any): boolean => {
  if (value === null || value === undefined) return true; // Allow nulls/undefined in sample
  if (typeof value === 'number') return true;
  if (typeof value !== 'string' || value.trim() === '') return false;
  
  const cleanedValue = value.replace(/[\s$,€£¥,]/g, '');
  if (cleanedValue === '') return false;
  
  return !isNaN(Number(cleanedValue));
};

const dateTransformations: { value: TransformationType, label: string }[] = [
  { value: 'DAY_OF_WEEK', label: 'Extract Day of Week' },
  { value: 'MONTH_NAME', label: 'Extract Month Name' },
  { value: 'YEAR', label: 'Extract Year' },
  { value: 'QUARTER', label: 'Extract Quarter' },
  { value: 'SLASH_TO_DASH_DATE', label: 'Format Date as YYYY-MM-DD' },
];

const numberTransformations: { value: TransformationType, label: string }[] = [
  { value: 'F_TO_C', label: 'Fahrenheit to Celsius' },
  { value: 'C_TO_F', label: 'Celsius to Fahrenheit' },
];

const textTransformations: { value: TransformationType, label: string }[] = [
  { value: 'ADD_PREFIX', label: 'Add Prefix' },
  { value: 'ADD_SUFFIX', label: 'Add Suffix' },
];

const dataTypeTransformations: { value: TransformationType, label: string }[] = [
  { value: 'TO_WHOLE_NUMBER', label: 'Convert to Whole Number' },
  { value: 'TO_DECIMAL', label: 'Convert to Decimal' },
  { value: 'TO_TEXT', label: 'Convert to Text' },
];

const advancedTransformations: { value: TransformationType, label: string }[] = [
  { value: 'CONDITIONAL_COLUMN', label: 'Conditional Column' },
  { value: 'FILTER_AND_COPY', label: 'Exclude by Condition' },
  { value: 'INCLUDE_BY_CONDITION', label: 'Include by Condition' },
  { value: 'AGGREGATE_BY', label: 'Aggregate by Group' },
  { value: 'COMBINE_WITH_LITERALS', label: 'Combine Columns + Text' },
];

export function TransformFieldDialog({ open, onOpenChange, allFields, datasets, onSave, measureFields }: TransformFieldDialogProps) {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>();
  const [sourceField, setSourceField] = useState<string | undefined>();
  const [transformation, setTransformation] = useState<TransformationType | undefined>();
  const [newName, setNewName] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [excludeByCategoryField, setExcludeByCategoryField] = useState<string | undefined>();
  const [excludeByCategoryValues, setExcludeByCategoryValues] = useState("");
  const [filterOnField, setFilterOnField] = useState<string | undefined>();
  const [valuesToFilter, setValuesToFilter] = useState("");
  const [aggregation, setAggregation] = useState<AggregationType | undefined>();
  const [groupBy, setGroupBy] = useState<string>("");
  // Enhanced conditional column config
  const [conditionalThenMode, setConditionalThenMode] = useState<'column' | 'literal'>("column");
  const [conditionalThenField, setConditionalThenField] = useState<string | undefined>();
  const [conditionalThenValue, setConditionalThenValue] = useState<string>("");
  const [conditionalElseMode, setConditionalElseMode] = useState<'column' | 'literal'>("literal");
  const [conditionalElseField, setConditionalElseField] = useState<string | undefined>();
  const [conditionalElseValue, setConditionalElseValue] = useState<string>("");
  // COMBINE_WITH_LITERALS state
  const [combineParts, setCombineParts] = useState<Array<{
    mode: 'column' | 'literal';
    field?: string;
    value?: string;
    dateFormat?: 'default' | 'MMM D, YYYY' | 'YYYY-MM-DD' | 'DayOfWeek' | 'MonthName';
    timeFormat?: 'default' | 'h:mm A' | 'HH:mm';
    color?: string;
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
    space?: number;
  }>>([]);

  const { columns, measures } = useMemo(() => {
    // Filter columns by selected dataset first
    const datasetColumns = selectedDatasetId
      ? (datasets.find(ds => ds.id === selectedDatasetId)?.fields || [])
      : [];
    const columns = datasetColumns.filter(f => !measureFields.includes(f));
    const measures = measureFields;
    return { columns, measures };
  }, [allFields, measureFields, datasets, selectedDatasetId]);

  const dataType = useMemo(() => {
    if (!sourceField) return 'text';

    const datasetToSampleFrom = datasets.find(ds => ds.fields.includes(sourceField));

    if (!datasetToSampleFrom || datasetToSampleFrom.data.length === 0) return 'text';
    
    const sample = datasetToSampleFrom.data
      .slice(0, 50) // Take a sample of 50 rows
      .map(row => row[sourceField])
      .filter(v => v != null && v !== "");

    if (sample.length === 0) return 'text';

    if (sample.every(v => isDate(v, sourceField))) return 'date';
    
    if (sample.every(isPotentiallyNumeric)) return 'number';

    return 'text';
  }, [datasets, sourceField]);

  // Live preview for COMBINE_WITH_LITERALS (returns array of { text, style } parts to render with styles)
  const combinePreviewParts = useMemo(() => {
    if (transformation !== 'COMBINE_WITH_LITERALS' || !selectedDatasetId || combineParts.length === 0) return '';
    const ds = datasets.find(d => d.id === selectedDatasetId);
    if (!ds || ds.data.length === 0) return '';
    const row = ds.data[0];

    // Build texts per part with optional per-part date/time formatting
    const rawTexts: string[] = combineParts.map(p => {
      if (p.mode === 'column' && p.field) {
        const v = row[p.field as string];
        if (v === null || v === undefined) return '';
        const hasDateFmt = p.dateFormat && p.dateFormat !== 'default';
        const hasTimeFmt = p.timeFormat && p.timeFormat !== 'default';
        if (hasDateFmt || hasTimeFmt) {
          const d = parseDate(v, p.field);
          if (d) {
            let datePart = '';
            let timePart = '';
            if (hasDateFmt) {
              switch (p.dateFormat) {
                case 'MMM D, YYYY': datePart = format(d, 'MMM d, yyyy'); break;
                case 'YYYY-MM-DD': datePart = format(d, 'yyyy-MM-dd'); break;
                case 'DayOfWeek': datePart = format(d, 'eeee'); break;
                case 'MonthName': datePart = format(d, 'MMMM'); break;
              }
            }
            if (hasTimeFmt) {
              switch (p.timeFormat) {
                case 'h:mm A': timePart = format(d, 'h:mm a'); break;
                case 'HH:mm': timePart = format(d, 'HH:mm'); break;
              }
            }
            if (datePart && timePart) return `${datePart} ${timePart}`;
            if (datePart) return datePart;
            if (timePart) return timePart;
          }
        }
        return String(v ?? '');
      }
      if (p.mode === 'literal') return p.value ?? '';
      return '';
    });

    const isLiteral = combineParts.map(p => p.mode === 'literal');
    const hasAnyNonEmptyColumn = rawTexts.some((t, i) => !isLiteral[i] && t.trim() !== '');
    if (!hasAnyNonEmptyColumn) {
      // Show literals only as parts (preserve spacing controls too)
      return rawTexts.map((t, i) => {
        const part = combineParts[i];
        const after = ' '.repeat(part.space ?? 0);
        const color = part.color || '#000';
        const fontWeight = part.fontWeight || 'normal';
        if (isLiteral[i]) return { text: `${t}${after}`, style: { color, fontWeight } as any };
        return { text: '', style: { color, fontWeight } as any };
      }).filter(p => p.text !== '');
    }
    const hasNonEmptyBefore: boolean[] = new Array(rawTexts.length).fill(false);
    let seenNonEmpty = false;
    for (let i = 0; i < rawTexts.length; i++) {
      hasNonEmptyBefore[i] = seenNonEmpty;
      if (rawTexts[i] && rawTexts[i].trim() !== '' && !isLiteral[i]) {
        seenNonEmpty = true;
      }
    }
    const hasNonEmptyAfter: boolean[] = new Array(rawTexts.length).fill(false);
    seenNonEmpty = false;
    for (let i = rawTexts.length - 1; i >= 0; i--) {
      hasNonEmptyAfter[i] = seenNonEmpty;
      if (rawTexts[i] && rawTexts[i].trim() !== '' && !isLiteral[i]) {
        seenNonEmpty = true;
      }
    }
    const partsOut: Array<{ text: string; style: React.CSSProperties }> = [];
    for (let i = 0; i < rawTexts.length; i++) {
      const partCfg = combineParts[i];
      const after = ' '.repeat(partCfg.space ?? 0);
      const color = partCfg.color || '#000';
      const fontWeight = partCfg.fontWeight || 'normal';
      const styled = { color, fontWeight } as React.CSSProperties;
      if (isLiteral[i]) {
        if (hasNonEmptyBefore[i] || hasNonEmptyAfter[i]) {
          partsOut.push({ text: `${rawTexts[i]}${after}`, style: styled });
        }
      } else {
        partsOut.push({ text: `${rawTexts[i]}${after}`, style: styled });
      }
    }
    return partsOut;
  }, [transformation, selectedDatasetId, datasets, combineParts]);

  useEffect(() => {
    if (sourceField && transformation) {
        let transLabel = transformation.toLowerCase();
        setNewName(`${sourceField}_${transLabel}`);
    } else {
      setNewName("");
    }
  }, [sourceField, transformation]);

  useEffect(() => {
    if (transformation === 'COMBINE_WITH_LITERALS' && combineParts.length === 0) {
      // Initialize with sourceField and a space literal as a convenience
      setCombineParts([{ mode: 'column', field: sourceField }, { mode: 'literal', value: ' ' }]);
    }
  }, [transformation]);

  const handleSave = () => {
    if (!selectedDatasetId) {
      toast.error("Please select a table.");
      return;
    }
    if (!newName.trim() || !sourceField || !transformation) {
      toast.error("Please fill out all fields.");
      return;
    }
    if ((transformation === 'ADD_PREFIX' || transformation === 'ADD_SUFFIX') && !customValue.trim()) {
      toast.error("Please provide a value for the prefix or suffix.");
      return;
    }
    if (transformation === 'CONDITIONAL_COLUMN') {
      if (!customValue.trim()) { toast.error('Please provide the comparison value after "is equal to".'); return; }
      if (conditionalThenMode === 'column' && !conditionalThenField) { toast.error('Please select a THEN column.'); return; }
      if (conditionalThenMode === 'literal' && !conditionalThenValue.trim()) { toast.error('Please enter a THEN value.'); return; }
      if (conditionalElseMode === 'column' && !conditionalElseField) { toast.error('Please select an ELSE column.'); return; }
      if (conditionalElseMode === 'literal' && conditionalElseValue.trim() === '') { toast.error('Please enter an ELSE value (can be empty string if desired).'); }
    }
    if ((transformation === 'FILTER_AND_COPY' || transformation === 'INCLUDE_BY_CONDITION') && (!filterOnField || !valuesToFilter.trim())) {
      toast.error("Please select a filter column and provide values.");
      return;
    }
    if (allFields.includes(newName.trim())) {
      toast.error("A field with this name already exists.");
      return;
    }
    if (transformation === 'COMBINE_WITH_LITERALS') {
      const valid = combineParts.length > 0 && combineParts.every(p => (p.mode === 'column' ? !!p.field : true));
      if (!valid) { toast.error('Please configure the sequence (all column parts must select a column).'); return; }
      onSave(
        selectedDatasetId,
        newName.trim(),
        sourceField!,
        transformation,
        undefined, // value
        undefined, // excludeByCategoryField
        undefined, // excludeByCategoryValues
        undefined, // filterOnField
        undefined, // valuesToFilter
        undefined, // aggregation
        undefined, // groupByFields
        undefined, // conditionalThenMode
        undefined, // conditionalThenField
        undefined, // conditionalThenValue
        undefined, // conditionalElseMode
        undefined, // conditionalElseField
        undefined, // conditionalElseValue
        combineParts, // combineParts (correct position)
      );
      // reset and close
      setSourceField(undefined);
      setTransformation(undefined);
      setNewName("");
      setCombineParts([]);
      setSelectedDatasetId(undefined);
      onOpenChange(false);
      return;
    }
    if (transformation === 'AGGREGATE_BY') {
      if (!aggregation) { toast.error('Please select an aggregation function.'); return; }
      const groupByFields = groupBy.split(',').map(v => v.trim()).filter(Boolean);
      if (groupByFields.length === 0) { toast.error('Please provide at least one group-by field.'); return; }
      onSave(selectedDatasetId, newName.trim(), sourceField, transformation, undefined, undefined, undefined, undefined, undefined, aggregation, groupByFields);
      // reset and close
      setSourceField(undefined);
      setTransformation(undefined);
      setNewName("");
      setCustomValue("");
      setExcludeByCategoryField(undefined);
      setExcludeByCategoryValues("");
      setFilterOnField(undefined);
      setValuesToFilter("");
      setAggregation(undefined);
      setGroupBy("");
      setSelectedDatasetId(undefined);
      onOpenChange(false);
      return;
    }
    const valuesToExclude = excludeByCategoryValues.trim() ? excludeByCategoryValues.split(',').map(v => v.trim()) : undefined;
    const filterValues = valuesToFilter.trim() ? valuesToFilter.split(',').map(v => v.trim()) : undefined;
    onSave(
      selectedDatasetId,
      newName.trim(),
      sourceField,
      transformation,
      customValue,
      excludeByCategoryField,
      valuesToExclude,
      filterOnField,
      filterValues,
      undefined,
      undefined,
      conditionalThenMode,
      conditionalThenField,
      conditionalThenValue,
      conditionalElseMode,
      conditionalElseField,
      conditionalElseValue,
      undefined,
    );
    setSourceField(undefined);
    setTransformation(undefined);
    setNewName("");
    setCustomValue("");
    setExcludeByCategoryField(undefined);
    setExcludeByCategoryValues("");
    setFilterOnField(undefined);
    setValuesToFilter("");
    setAggregation(undefined);
    setGroupBy("");
    setConditionalThenMode('column');
    setConditionalThenField(undefined);
    setConditionalThenValue("");
    setConditionalElseMode('literal');
    setConditionalElseField(undefined);
    setConditionalElseValue("");
    setSelectedDatasetId(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transformed Field (Measure)</DialogTitle>
          <DialogDescription>
            Create a new transformed field scoped to the selected table. It will be applied only to that table.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="table-select">Table</Label>
            <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
              <SelectTrigger id="table-select"><SelectValue placeholder="Select a table" /></SelectTrigger>
              <SelectContent>
                {datasets.map(ds => (
                  <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-field">Source Field</Label>
            <Select value={sourceField} onValueChange={setSourceField} disabled={!selectedDatasetId}>
              <SelectTrigger id="source-field"><SelectValue placeholder={selectedDatasetId ? "Select a field to transform" : "Select a table first"} /></SelectTrigger>
              <SelectContent>
                {columns.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Columns</SelectLabel>
                    {columns.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {sourceField && (
            <>
              <div className="space-y-2">
                <Label htmlFor="transformation-type">Transformation</Label>
                <Select value={transformation} onValueChange={(v: TransformationType) => setTransformation(v)}>
                  <SelectTrigger id="transformation-type"><SelectValue placeholder="Select a transformation" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Advanced</SelectLabel>
                      {advancedTransformations.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectGroup>
                    <SelectGroup>
                        <SelectLabel>Data Type Conversion</SelectLabel>
                        {dataTypeTransformations.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectGroup>
                    {dataType === 'date' && (
                        <SelectGroup>
                            <SelectLabel>Date</SelectLabel>
                            {dateTransformations.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectGroup>
                    )}
                    {dataType === 'number' && (
                        <SelectGroup>
                            <SelectLabel>Numeric</SelectLabel>
                            {numberTransformations.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectGroup>
                    )}
                    <SelectGroup>
                        <SelectLabel>Text</SelectLabel>
                        {textTransformations.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {transformation && (transformation === 'ADD_PREFIX' || transformation === 'ADD_SUFFIX') && (
                <div className="space-y-2">
                  <Label htmlFor="custom-value">{transformation === 'ADD_PREFIX' ? 'Prefix Value' : 'Suffix Value'}</Label>
                  <Input
                    id="custom-value"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={transformation === 'ADD_PREFIX' ? "e.g., $" : "e.g., °C"}
                  />
                </div>
              )}
              {transformation === 'COMBINE_WITH_LITERALS' && (
                <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                  <p className="text-xs text-muted-foreground">Build a sequence combining columns and static text/icons. Example: Date @# Time</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setCombineParts(prev => [...prev, { mode: 'column' }])}>Add Column</Button>
                    <Button type="button" variant="secondary" onClick={() => setCombineParts(prev => [...prev, { mode: 'literal', value: ' ' }])}>Add Text</Button>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                     {combineParts.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap">
                        <Select value={p.mode} onValueChange={(v: 'column' | 'literal') => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, mode: v } : pp))}>
                          <SelectTrigger className="w-32"><SelectValue placeholder="Part type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="column">Column</SelectItem>
                            <SelectItem value="literal">Text</SelectItem>
                          </SelectContent>
                        </Select>
                        {p.mode === 'column' ? (
                          <>
                            <Select value={p.field} onValueChange={(v) => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, field: v } : pp))} disabled={!selectedDatasetId}>
                              <SelectTrigger className="min-w-[200px]"><SelectValue placeholder="Select column" /></SelectTrigger>
                              <SelectContent>
                                {columns.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <Input className="min-w-[200px]" placeholder="Enter text, emoji, or icon URL" value={p.value || ''} onChange={(e) => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, value: e.target.value } : pp))} />
                        )}
                        {/* Collapsible advanced settings to reduce clutter */}
                        <details className="ml-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">Customize</summary>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {p.mode === 'column' && (
                              <>
                                <Select value={(p as any).dateFormat ?? 'default'} onValueChange={(v) => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, dateFormat: v as any } : pp))}>
                                  <SelectTrigger className="w-40"><SelectValue placeholder="Date format" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Date: default</SelectItem>
                                    <SelectItem value="MMM D, YYYY">MMM D, YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                    <SelectItem value="DayOfWeek">Day of Week</SelectItem>
                                    <SelectItem value="MonthName">Month Name</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select value={(p as any).timeFormat ?? 'default'} onValueChange={(v) => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, timeFormat: v as any } : pp))}>
                                  <SelectTrigger className="w-36"><SelectValue placeholder="Time format" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Time: default</SelectItem>
                                    <SelectItem value="h:mm A">h:mm A</SelectItem>
                                    <SelectItem value="HH:mm">HH:mm</SelectItem>
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Color</Label>
                              <Input type="color" value={p.color || '#000000'} onChange={(e) => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, color: e.target.value } : pp))} className="h-8 w-10 p-1" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Weight</Label>
                              <Select value={p.fontWeight || 'normal'} onValueChange={(v) => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, fontWeight: v as any } : pp))}>
                                <SelectTrigger className="w-28"><SelectValue placeholder="Weight" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="bold">Bold</SelectItem>
                                  <SelectItem value="bolder">Bolder</SelectItem>
                                  <SelectItem value="lighter">Lighter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2 min-w-[220px]">
                              <Label className="text-xs whitespace-nowrap">Space</Label>
                              <div className="flex-1 px-2">
                                <Slider
                                  value={[p.space ?? 0]}
                                  min={0}
                                  max={10}
                                  step={1}
                                  onValueChange={(val) => setCombineParts(prev => prev.map((pp, i) => i === idx ? { ...pp, space: Math.max(0, val[0] ?? 0) } : pp))}
                                />
                              </div>
                              <div className="w-8 text-xs text-center">{p.space ?? 0}</div>
                            </div>
                          </div>
                        </details>
                        <Button type="button" variant="ghost" onClick={() => setCombineParts(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
                        {idx > 0 && (
                          <Button type="button" variant="ghost" onClick={() => setCombineParts(prev => {
                            const arr = [...prev];
                            [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
                            return arr;
                          })}>Up</Button>
                        )}
                        {idx < combineParts.length - 1 && (
                          <Button type="button" variant="ghost" onClick={() => setCombineParts(prev => {
                            const arr = [...prev];
                            [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
                            return arr;
                          })}>Down</Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-2 bg-white rounded border text-black">
                    <div className="text-xs text-muted-foreground">Preview</div>
                    <div className="font-mono text-sm break-all flex flex-wrap">
                      {Array.isArray(combinePreviewParts) && combinePreviewParts.length > 0 ? (
                        combinePreviewParts.map((p, i) => (
                          <span key={i} style={p.style}>{p.text}</span>
                        ))
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {transformation === 'CONDITIONAL_COLUMN' && (
                <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Label className="flex-shrink-0">If</Label>
                    <Input value={sourceField} disabled className="font-mono" />
                    <Label className="flex-shrink-0">is equal to</Label>
                    <Input
                      placeholder="e.g., Sale"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Then</Label>
                    <div className="flex items-center gap-2">
                      <Select value={conditionalThenMode} onValueChange={(v: 'column' | 'literal') => setConditionalThenMode(v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Mode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="column">Use column</SelectItem>
                          <SelectItem value="literal">Literal value</SelectItem>
                        </SelectContent>
                      </Select>
                      {conditionalThenMode === 'column' ? (
                        <Select value={conditionalThenField} onValueChange={setConditionalThenField} disabled={!selectedDatasetId}>
                          <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                          <SelectContent>
                            {columns.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="e.g., 0 or https://..." value={conditionalThenValue} onChange={(e) => setConditionalThenValue(e.target.value)} />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Else</Label>
                    <div className="flex items-center gap-2">
                      <Select value={conditionalElseMode} onValueChange={(v: 'column' | 'literal') => setConditionalElseMode(v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Mode" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="column">Use column</SelectItem>
                          <SelectItem value="literal">Literal value</SelectItem>
                        </SelectContent>
                      </Select>
                      {conditionalElseMode === 'column' ? (
                        <Select value={conditionalElseField} onValueChange={setConditionalElseField} disabled={!selectedDatasetId}>
                          <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                          <SelectContent>
                            {columns.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="e.g., 0 or https://..." value={conditionalElseValue} onChange={(e) => setConditionalElseValue(e.target.value)} />
                      )}
                    </div>
                  </div>
                </div>
              )}
              {(transformation === 'FILTER_AND_COPY' || transformation === 'INCLUDE_BY_CONDITION') && (
                <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {transformation === 'FILTER_AND_COPY'
                      ? `This creates a copy of '${sourceField}' where rows are excluded (set to 0) based on values in another column.`
                      : `This creates a copy of '${sourceField}' including only rows where a condition is met. Other rows will be set to 0.`
                    }
                  </p>
                  <div className="space-y-2">
                    <Label>Column to Filter On</Label>
                    <Select value={filterOnField} onValueChange={setFilterOnField}>
                      <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                      <SelectContent>
                        {columns.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {transformation === 'FILTER_AND_COPY' ? 'Values to Exclude' : 'Values to Include'}
                    </Label>
                    <Input
                      placeholder="e.g., Value1, Value2"
                      value={valuesToFilter}
                      onChange={(e) => setValuesToFilter(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Enter values separated by a comma.</p>
                  </div>
                </div>
              )}
              {transformation === 'AGGREGATE_BY' && (
                <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    Create a grouped aggregation of '{sourceField}' and write the same aggregated value to each row in the group.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="agg-type">Aggregation</Label>
                    <Select value={aggregation} onValueChange={(v: AggregationType) => setAggregation(v)}>
                      <SelectTrigger id="agg-type"><SelectValue placeholder="Select an aggregation" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUM">SUM</SelectItem>
                        <SelectItem value="AVERAGE">AVERAGE</SelectItem>
                        <SelectItem value="COUNT">COUNT</SelectItem>
                        <SelectItem value="COUNT_DISTINCT">COUNT DISTINCT</SelectItem>
                        <SelectItem value="MAX">MAX</SelectItem>
                        <SelectItem value="MIN">MIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-by">Group By (comma separated)</Label>
                    <Input id="group-by" placeholder="e.g., Region, Category" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Use field names from the selected table. Separate multiple with commas.</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-field-name">New Field Name</Label>
                <Input id="new-field-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Create Field</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}