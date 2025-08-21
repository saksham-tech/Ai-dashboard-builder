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
import { toast } from "sonner";
import { Badge } from "../ui/badge";

interface UnpivotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: string[];
  datasetName: string;
  onConfirm: (attributeCol: string, valueCol: string, newTableName: string) => void;
}

export function UnpivotDialog({ open, onOpenChange, columns, datasetName, onConfirm }: UnpivotDialogProps) {
  const [attributeCol, setAttributeCol] = useState("Attribute");
  const [valueCol, setValueCol] = useState("Value");
  const [newTableName, setNewTableName] = useState("");

  useEffect(() => {
    if (open) {
      setNewTableName(`${datasetName} (Unpivoted)`);
    }
  }, [open, datasetName]);

  const handleConfirm = () => {
    if (!attributeCol.trim() || !valueCol.trim() || !newTableName.trim()) {
      toast.error("Please provide names for all fields.");
      return;
    }
    onConfirm(attributeCol.trim(), valueCol.trim(), newTableName.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unpivot Columns</DialogTitle>
          <DialogDescription>
            The selected columns will be transformed from columns into rows.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Columns to Unpivot</Label>
            <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50 max-h-24 overflow-y-auto">
              {columns.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>New Attribute Column Name</Label>
            <Input value={attributeCol} onChange={(e) => setAttributeCol(e.target.value)} placeholder="e.g., Month" />
            <p className="text-xs text-muted-foreground">This column will hold the original column headers.</p>
          </div>
          <div className="space-y-2">
            <Label>New Value Column Name</Label>
            <Input value={valueCol} onChange={(e) => setValueCol(e.target.value)} placeholder="e.g., Sales" />
            <p className="text-xs text-muted-foreground">This column will hold the values from the original columns.</p>
          </div>
          <div className="space-y-2">
            <Label>New Table Name</Label>
            <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleConfirm}>Create Unpivoted Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}