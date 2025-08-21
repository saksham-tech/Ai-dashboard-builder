import { useState, useEffect } from "react";
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

interface PivotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
  datasetName: string;
  onConfirm: (rowField: string, columnField: string, valueField: string, newTableName: string) => void;
}

export function PivotDialog({ open, onOpenChange, columns, datasetName, onConfirm }: PivotDialogProps) {
  const [rowField, setRowField] = useState<string | undefined>();
  const [columnField, setColumnField] = useState<string | undefined>();
  const [valueField, setValueField] = useState<string | undefined>();
  const [newTableName, setNewTableName] = useState("");

  useEffect(() => {
    if (open) {
      setRowField(columns[0]);
      setColumnField(columns[1]);
      setValueField(columns[2]);
      setNewTableName(`${datasetName} (Pivoted)`);
    }
  }, [open, columns, datasetName]);

  const handleConfirm = () => {
    if (!rowField || !columnField || !valueField || !newTableName.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }
    if (new Set([rowField, columnField, valueField]).size !== 3) {
      toast.error("Each field must be unique.");
      return;
    }
    onConfirm(rowField, columnField, valueField, newTableName.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pivot Columns</DialogTitle>
          <DialogDescription>
            Assign the selected columns to create a new pivoted table.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Row Field (Categories)</Label>
            <Select value={rowField} onValueChange={setRowField}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Column Field (New Headers)</Label>
            <Select value={columnField} onValueChange={setColumnField}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Value Field</Label>
            <Select value={valueField} onValueChange={setValueField}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>New Table Name</Label>
            <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleConfirm}>Create Pivoted Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}