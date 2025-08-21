import { useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type FieldFormattingOptions } from "@/types/visualizations";
import { isDate } from '@/lib/date-parser';

const isNumericString = (value: any): boolean => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  // Strip common currency symbols, commas, and whitespace
  const cleanedValue = value.replace(/[\s$,€£¥]/g, '');
  if (cleanedValue === '') return false;
  return !isNaN(Number(cleanedValue));
};

interface FieldFormattingSettingsProps {
  formatting: FieldFormattingOptions;
  onFormattingChange: (formatting: FieldFormattingOptions) => void;
  dataset: Record<string, any>[];
  fieldName: string;
}

export function FieldFormattingSettings({ formatting, onFormattingChange, dataset, fieldName }: FieldFormattingSettingsProps) {
  const dataType = useMemo(() => {
    if (!dataset || dataset.length === 0 || !fieldName) return 'text';
    const sample = dataset.find(row => row[fieldName] != null && row[fieldName] !== '');
    if (!sample) return 'text';
    const value = sample[fieldName];
    
    if (isDate(value, fieldName)) return 'date';

    if (typeof value === 'number' || isNumericString(value)) return 'number';
    
    return 'text';
  }, [dataset, fieldName]);

  const handleChange = (key: keyof FieldFormattingOptions, value: any) => {
    const newFormatting = { ...formatting };
    if (value === 'default' || value === '') {
      delete newFormatting[key];
    } else {
      (newFormatting as any)[key] = value;
    }
    onFormattingChange(newFormatting);
  };

  return (
    <div className="space-y-4 p-1">
      <p className="text-sm font-medium text-center">Formatting for <span className="text-primary">{fieldName}</span></p>
      <p className="text-xs text-muted-foreground text-center -mt-3">Detected Type: {dataType}</p>
      
      <Accordion type="multiple" defaultValue={[`${dataType}-formatting`]} className="w-full">
        <AccordionItem value="number-formatting">
          <AccordionTrigger className="text-sm py-2">Number Formatting</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                placeholder="e.g., $"
                value={formatting.customPrefix || ''}
                onChange={(e) => handleChange('customPrefix', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Suffix</Label>
              <Input
                placeholder="e.g., °C"
                value={formatting.customSuffix || ''}
                onChange={(e) => handleChange('customSuffix', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Decimal Places</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={formatting.decimalPlaces ?? ''}
                onChange={(e) => handleChange('decimalPlaces', e.target.value ? parseInt(e.target.value, 10) : undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Units</Label>
              <Select
                value={formatting.displayUnits || 'none'}
                onValueChange={(v) => handleChange('displayUnits', v === 'none' ? undefined : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Full Number)</SelectItem>
                  <SelectItem value="auto">Auto (K, M, B)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="date-formatting">
          <AccordionTrigger className="text-sm py-2">Date/Time Formatting</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={formatting.dateFormat || 'default'} onValueChange={(v) => handleChange('dateFormat', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="MMM D, YYYY">Jan 1, 2024</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2024-01-01</SelectItem>
                  <SelectItem value="DayOfWeek">Monday</SelectItem>
                  <SelectItem value="MonthName">January</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={formatting.timeFormat || 'default'} onValueChange={(v) => handleChange('timeFormat', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">None</SelectItem>
                  <SelectItem value="h:mm A">8:30 PM</SelectItem>
                  <SelectItem value="HH:mm">20:30</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="text-formatting">
          <AccordionTrigger className="text-sm py-2">Text Formatting</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Prefix</Label>
              <Input
                placeholder="e.g., ID: "
                value={formatting.customPrefix || ''}
                onChange={(e) => handleChange('customPrefix', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Suffix</Label>
              <Input
                placeholder="e.g., units"
                value={formatting.customSuffix || ''}
                onChange={(e) => handleChange('customSuffix', e.target.value)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}