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
import { Checkbox } from "@/components/ui/checkbox";

interface AddDateColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: Dataset[];
  onSave: (datasetId: string, sourceField: string, columnsToCreate: Set<string>) => void;
}

const dateColumns = [
  { id: 'Year', label: 'Year' },
  { id: 'Quarter', label: 'Quarter' },
  { id: 'MonthNumber', label: 'Month Number' },
  { id: 'MonthName', label: 'Month Name' },
  { id: 'DayOfWeek', label: 'Day of Week' },
  { id: 'DayOfMonth', label: 'Day of Month' },
  { id: 'DayOfYear', label: 'Day of Year' },
  { id: 'WeekOfYear', label: 'Week of Year' },
];

export function AddDateColumnsDialog({ open, onOpenChange, datasets, onSave }: AddDateColumnsDialogProps) {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>();
  const [sourceField, setSourceField] = useState<string | undefined>();
  const [columnsToCreate, setColumnsToCreate] = useState<Set<string>>(new Set(['Year', 'MonthName', 'DayOfWeek']));

  const dateFields = useMemo(() => {
    if (!selectedDatasetId) return [];
    const dataset = datasets.find(d => d.id === selectedDatasetId);
    if (!dataset) return [];
    return dataset.fields.filter(field => {
      const sample = dataset.data.find(row => row[field] != null && row[field] !== '');
      return sample && isDate(sample[field], field);
    });
  }, [datasets, selectedDatasetId]);

  const handleSave = () => {
    if (!selectedDatasetId || !sourceField) {
      toast.error("Please select a dataset and a source date field.");
      return;
    }
    if (columnsToCreate.size === 0) {
      toast.error("Please select at least one column to create.");
      return;
    }
    onSave(selectedDatasetId, sourceField, columnsToCreate);
    setSelectedDatasetId(undefined);
    setSourceField(undefined);
    setColumnsToCreate(new Set(['Year', 'MonthName', 'DayOfWeek']));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Date Columns</DialogTitle>
          <DialogDescription>
            Select a table and a date column to automatically generate related time intelligence columns.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dataset-select">Select Table</Label>
            <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
              <SelectTrigger id="dataset-select"><SelectValue placeholder="Select a table" /></SelectTrigger>
              <SelectContent>
                {datasets.map(ds => <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedDatasetId && (
            <div className="space-y-2">
              <Label htmlFor="date-field-select">Source Date Column</Label>
              <Select value={sourceField} onValueChange={setSourceField}>
                <SelectTrigger id="date-field-select"><SelectValue placeholder="Select a date column" /></SelectTrigger>
                <SelectContent>
                  {dateFields.map(field => <SelectItem key={field} value={field}>{field}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {sourceField && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Columns to Create</Label>
              <div className="grid grid-cols-2 gap-2">
                {dateColumns.map(col => (
                  <div key={col.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`col-${col.id}`}
                      checked={columnsToCreate.has(col.id)}
                      onCheckedChange={(checked) => {
                        const newSelection = new Set(columnsToCreate);
                        if (checked) newSelection.add(col.id);
                        else newSelection.delete(col.id);
                        setColumnsToCreate(newSelection);
                      }}
                    />
                    <Label htmlFor={`col-${col.id}`} className="text-sm font-normal">{col.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Add Columns</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}