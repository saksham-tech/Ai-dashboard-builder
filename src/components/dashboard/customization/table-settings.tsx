import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type VisualizationOptions } from "@/types/visualizations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

export function TableSettings({ options, onOptionChange }: TableSettingsProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const defaultTableOptions = {
    grid: { vertical: true, horizontal: true, color: '#27282b', thickness: 1 },
    headers: { fontSize: 12, color: '#fafafa', backgroundColor: '#18191b', wordWrap: true, alignment: 'left' as const },
    values: { fontSize: 12, color: '#fafafa', backgroundColor: '#0e0f10', showAlternatingRows: true, alternatingRowColor: '#222326', rowPadding: 4, columnPadding: 8, alignment: 'left' as const, hideRowsWithBlanks: false },
    totals: { show: false, fontSize: 12, color: '#fafafa', backgroundColor: '#27282b', label: 'Total', columnsWithTotals: [] },
    allowMultiSelect: false,
    filterColumn: '',
  };

  const tableOptions = {
    ...defaultTableOptions,
    ...(options.table || {}),
    grid: { ...defaultTableOptions.grid, ...(options.table?.grid || {}) },
    headers: { ...defaultTableOptions.headers, ...(options.table?.headers || {}) },
    values: { ...defaultTableOptions.values, ...(options.table?.values || {}) },
    totals: { ...defaultTableOptions.totals, ...(options.table?.totals || {}) },
  };

  if (!options.table) return null;

  const allColumns = options.dataMapping.valueKeys.map(vk => parseCompositeKey(vk.field)?.field).filter(Boolean) as string[];
  const selectedTotals = new Set(tableOptions.totals.columnsWithTotals || []);

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['interaction', 'grid', 'headers', 'values', 'totals']} className="w-full space-y-2">
        <AccordionItem value="interaction">
          <AccordionTrigger className="text-sm py-2">Interaction</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Allow Multi-Select</Label>
              <Switch checked={tableOptions.allowMultiSelect} onCheckedChange={(c) => onOptionChange('table.allowMultiSelect', c)} />
            </div>
            {tableOptions.allowMultiSelect && (
              <div className="space-y-2">
                <Label>Filter on Column</Label>
                <Select value={tableOptions.filterColumn} onValueChange={(v) => onOptionChange('table.filterColumn', v)}>
                  <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                  <SelectContent>
                    {allColumns.map(col => <SelectItem key={col} value={col}>{col}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="grid">
          <AccordionTrigger className="text-sm py-2">Grid</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Vertical Grid</Label>
              <Switch checked={tableOptions.grid.vertical} onCheckedChange={(c) => onOptionChange('table.grid.vertical', c)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Horizontal Grid</Label>
              <Switch checked={tableOptions.grid.horizontal} onCheckedChange={(c) => onOptionChange('table.grid.horizontal', c)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Grid Color</Label>
                <Input type="color" value={tableOptions.grid.color} onChange={(e) => onOptionChange('table.grid.color', e.target.value)} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Thickness (px)</Label>
                <Input type="number" min="0" value={tableOptions.grid.thickness} onChange={(e) => onOptionChange('table.grid.thickness', parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="headers">
          <AccordionTrigger className="text-sm py-2">Headers</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Font Size" value={tableOptions.headers.fontSize} onChange={(e) => onOptionChange('table.headers.fontSize', parseInt(e.target.value, 10) || 12)} />
              <Input type="color" value={tableOptions.headers.color} onChange={(e) => onOptionChange('table.headers.color', e.target.value)} />
            </div>
            <Input type="color" value={tableOptions.headers.backgroundColor} onChange={(e) => onOptionChange('table.headers.backgroundColor', e.target.value)} />
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select value={tableOptions.headers.alignment || 'left'} onValueChange={(v) => onOptionChange('table.headers.alignment', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>Word Wrap</Label><Switch checked={tableOptions.headers.wordWrap} onCheckedChange={(c) => onOptionChange('table.headers.wordWrap', c)} /></div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="values">
          <AccordionTrigger className="text-sm py-2">Values</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Font Size" value={tableOptions.values.fontSize} onChange={(e) => onOptionChange('table.values.fontSize', parseInt(e.target.value, 10) || 12)} />
              <Input type="color" value={tableOptions.values.color} onChange={(e) => onOptionChange('table.values.color', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Row Padding (px)</Label>
                <Input type="number" min="0" value={tableOptions.values.rowPadding} onChange={(e) => onOptionChange('table.values.rowPadding', parseInt(e.target.value, 10) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Column Padding (px)</Label>
                <Input type="number" min="0" value={tableOptions.values.columnPadding} onChange={(e) => onOptionChange('table.values.columnPadding', parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>
            <Input type="color" value={tableOptions.values.backgroundColor} onChange={(e) => onOptionChange('table.values.backgroundColor', e.target.value)} />
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select value={tableOptions.values.alignment || 'left'} onValueChange={(v) => onOptionChange('table.values.alignment', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Alternate Row Colors</Label>
              <Switch checked={tableOptions.values.showAlternatingRows} onCheckedChange={(c) => onOptionChange('table.values.showAlternatingRows', c)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Hide rows with blanks</Label>
              <Switch checked={!!tableOptions.values.hideRowsWithBlanks} onCheckedChange={(c) => onOptionChange('table.values.hideRowsWithBlanks', c)} />
            </div>
            {tableOptions.values.showAlternatingRows && (
              <div className="space-y-2">
                <Label>Alternate Row Color</Label>
                <Input type="color" value={tableOptions.values.alternatingRowColor} onChange={(e) => onOptionChange('table.values.alternatingRowColor', e.target.value)} className="w-full" />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="totals">
          <AccordionTrigger className="text-sm py-2">Totals</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Show Total Row</Label>
              <Switch checked={tableOptions.totals.show} onCheckedChange={(c) => onOptionChange('table.totals.show', c)} />
            </div>
            {tableOptions.totals.show && (
              <>
                <div className="space-y-2">
                  <Label>Total Label</Label>
                  <Input value={tableOptions.totals.label} onChange={(e) => onOptionChange('table.totals.label', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Columns to Total</Label>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-auto min-h-10">
                        <div className="flex flex-wrap gap-1">
                          {selectedTotals.size > 0 ? allColumns.filter(c => selectedTotals.has(c)).map(c => <Badge key={c} variant="secondary">{c}</Badge>) : "Select columns..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search columns..." />
                        <CommandList>
                          <CommandEmpty>No columns found.</CommandEmpty>
                          <CommandGroup>
                            {allColumns.map(col => (
                              <CommandItem
                                key={col}
                                value={col}
                                onSelect={() => {
                                  const newSelection = new Set(selectedTotals);
                                  if (newSelection.has(col)) newSelection.delete(col);
                                  else newSelection.add(col);
                                  onOptionChange('table.totals.columnsWithTotals', Array.from(newSelection));
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedTotals.has(col) ? "opacity-100" : "opacity-0")} />
                                {col}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Font Size" value={tableOptions.totals.fontSize} onChange={(e) => onOptionChange('table.totals.fontSize', parseInt(e.target.value, 10) || 12)} />
                  <Input type="color" value={tableOptions.totals.color} onChange={(e) => onOptionChange('table.totals.color', e.target.value)} />
                </div>
                <Input type="color" value={tableOptions.totals.backgroundColor} onChange={(e) => onOptionChange('table.totals.backgroundColor', e.target.value)} />
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}