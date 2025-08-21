import { useState, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { type Dataset } from "@/types/visualizations";
import { isDate } from "@/lib/date-parser";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

type CreationMode = 'auto' | 'manual';
type DateFormat = 'yyyy-MM-dd' | 'MMMM' | 'MMMM-yyyy' | 'dd-MM-yyyy';

const allPossibleDateColumns = [
  { id: 'Date', label: 'Date (Primary)' },
  { id: 'Year', label: 'Year' },
  { id: 'Quarter', label: 'Quarter' },
  { id: 'MonthNumber', label: 'Month Number' },
  { id: 'MonthName', label: 'Month Name' },
  { id: 'DayOfWeek', label: 'Day of Week' },
  { id: 'DayOfMonth', label: 'Day of Month' },
  { id: 'DayOfYear', label: 'Day of Year' },
  { id: 'WeekOfYear', label: 'Week of Year' },
  { id: 'FiscalYear', label: 'Fiscal Year' },
  { id: 'FiscalQuarter', label: 'Fiscal Quarter' },
];

interface DateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: Dataset[];
  onSave: (name: string, options: { mode: 'auto', fiscalYearEndMonth?: number, dateFormat: DateFormat, columns: Set<string> } | { mode: 'manual', sourceDatasetIds: string[], fiscalYearEndMonth?: number, dateFormat: DateFormat, columns: Set<string> }) => void;
}

export function DateTableDialog({ open, onOpenChange, datasets, onSave }: DateTableDialogProps) {
  const [tableName, setTableName] = useState("Calendar");
  const [mode, setMode] = useState<CreationMode>('auto');
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(new Set());
  const [fiscalYearEndMonth, setFiscalYearEndMonth] = useState<string>("none");
  const [dateFormat, setDateFormat] = useState<DateFormat>('yyyy-MM-dd');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(['Date', 'Year', 'MonthName', 'DayOfWeek']));

  const datasetsWithDateColumns = useMemo(() => {
    return datasets.filter(dataset => 
      dataset.fields.some(field => {
        const sample = dataset.data.find(row => row[field] != null && row[field] !== '');
        return sample && isDate(sample[field], field);
      })
    );
  }, [datasets]);

  const handleSave = () => {
    if (!tableName.trim()) {
      toast.error("Please enter a table name.");
      return;
    }
    if (mode === 'manual' && selectedDatasetIds.size === 0) {
      toast.error("Please select at least one source dataset for manual mode.");
      return;
    }

    const fyEndMonth = fiscalYearEndMonth === 'none' ? undefined : parseInt(fiscalYearEndMonth, 10);

    const options = mode === 'auto'
      ? { mode: 'auto' as const, fiscalYearEndMonth: fyEndMonth, dateFormat, columns: selectedColumns }
      : { mode: 'manual' as const, sourceDatasetIds: Array.from(selectedDatasetIds), fiscalYearEndMonth: fyEndMonth, dateFormat, columns: selectedColumns };
      
    onSave(tableName.trim(), options);
    
    setTableName("Calendar");
    setMode('auto');
    setSelectedDatasetIds(new Set());
    setFiscalYearEndMonth("none");
    setDateFormat('yyyy-MM-dd');
    setSelectedColumns(new Set(['Date', 'Year', 'MonthName', 'DayOfWeek']));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Date Table</DialogTitle>
          <DialogDescription>
            Generate a calendar table. Use 'Auto' to scan all data, or 'Manual' to specify a source.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup value={mode} onValueChange={(v: CreationMode) => setMode(v)} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="mode-auto" />
              <Label htmlFor="mode-auto">Auto (from all data)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="mode-manual" />
              <Label htmlFor="mode-manual">Manual</Label>
            </div>
          </RadioGroup>

          {mode === 'manual' && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Source Datasets</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-auto min-h-10">
                    <div className="flex flex-wrap gap-1">
                      {selectedDatasetIds.size > 0 ? (
                        datasetsWithDateColumns
                          .filter(d => selectedDatasetIds.has(d.id))
                          .map(d => <Badge key={d.id} variant="secondary">{d.name}</Badge>)
                      ) : "Select datasets..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search datasets..." />
                    <CommandList>
                      <CommandEmpty>No datasets with date columns found.</CommandEmpty>
                      <CommandGroup>
                        {datasetsWithDateColumns.map(ds => (
                          <CommandItem
                            key={ds.id}
                            value={ds.name}
                            onSelect={() => {
                              const newSelection = new Set(selectedDatasetIds);
                              if (newSelection.has(ds.id)) newSelection.delete(ds.id);
                              else newSelection.add(ds.id);
                              setSelectedDatasetIds(newSelection);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedDatasetIds.has(ds.id) ? "opacity-100" : "opacity-0")} />
                            {ds.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Accordion type="single" collapsible className="w-full pt-4 border-t">
            <AccordionItem value="columns">
              <AccordionTrigger>Customize Columns</AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {allPossibleDateColumns.map(col => (
                    <div key={col.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`col-${col.id}`}
                        checked={selectedColumns.has(col.id)}
                        onCheckedChange={(checked) => {
                          const newSelection = new Set(selectedColumns);
                          if (checked) newSelection.add(col.id);
                          else newSelection.delete(col.id);
                          setSelectedColumns(newSelection);
                        }}
                        disabled={col.id === 'Date' || (['FiscalYear', 'FiscalQuarter'].includes(col.id) && fiscalYearEndMonth === 'none')}
                      />
                      <Label htmlFor={`col-${col.id}`} className="text-sm font-normal">{col.label}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="date-format">Date Column Format</Label>
            <Select value={dateFormat} onValueChange={(v: DateFormat) => setDateFormat(v)}>
              <SelectTrigger id="date-format"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                <SelectItem value="dd-MM-yyyy">dd-MM-yyyy</SelectItem>
                <SelectItem value="MMMM-yyyy">Month-Year (e.g., January-2023)</SelectItem>
                <SelectItem value="MMMM">Month Name (e.g., January)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="fiscal-year-end">Fiscal Year End (Optional)</Label>
            <Select value={fiscalYearEndMonth} onValueChange={setFiscalYearEndMonth}>
              <SelectTrigger id="fiscal-year-end"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Calendar Year)</SelectItem>
                <SelectItem value="1">January</SelectItem>
                <SelectItem value="2">February</SelectItem>
                <SelectItem value="3">March</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">June</SelectItem>
                <SelectItem value="7">July</SelectItem>
                <SelectItem value="8">August</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="table-name">New Table Name</Label>
            <Input id="table-name" value={tableName} onChange={(e) => setTableName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Generate Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}