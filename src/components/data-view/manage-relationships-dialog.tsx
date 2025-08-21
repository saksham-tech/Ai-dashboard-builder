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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { type Dataset, type Relationship, type Cardinality } from "@/types/visualizations";
import { nanoid } from "nanoid";
import { Trash2, Link } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface ManageRelationshipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: Dataset[];
  relationships: Relationship[];
  onSave: (relationship: Relationship) => void;
  onDelete: (relationshipId: string) => void;
}

export function ManageRelationshipsDialog({ open, onOpenChange, datasets, relationships, onSave, onDelete }: ManageRelationshipsDialogProps) {
  const [fromTable, setFromTable] = useState<string | undefined>();
  const [fromColumn, setFromColumn] = useState<string | undefined>();
  const [toTable, setToTable] = useState<string | undefined>();
  const [toColumn, setToColumn] = useState<string | undefined>();
  const [cardinality, setCardinality] = useState<Cardinality>('one-to-many');

  const fromTableFields = datasets.find(d => d.id === fromTable)?.fields || [];
  const toTableFields = datasets.find(d => d.id === toTable)?.fields || [];

  useEffect(() => {
    if (fromTable && fromColumn && toTable && toColumn) {
      const fromDataset = datasets.find(d => d.id === fromTable);
      const toDataset = datasets.find(d => d.id === toTable);

      if (fromDataset && toDataset && fromDataset.data.length > 0 && toDataset.data.length > 0) {
        const fromValues = fromDataset.data.map(row => row[fromColumn]);
        const toValues = toDataset.data.map(row => row[toColumn]);

        const isFromOne = new Set(fromValues).size === fromValues.length;
        const isToOne = new Set(toValues).size === toValues.length;

        if (isFromOne && !isToOne) {
          setCardinality('one-to-many');
        } else if (!isFromOne && isToOne) {
          setCardinality('many-to-one');
        } else if (isFromOne && isToOne) {
          setCardinality('one-to-one');
        } else {
          // Default for many-to-many, as it's the most common scenario to filter on
          setCardinality('one-to-many');
        }
      }
    }
  }, [fromTable, fromColumn, toTable, toColumn, datasets]);

  const handleSave = () => {
    if (!fromTable || !fromColumn || !toTable || !toColumn) {
      toast.error("Please fill out all fields to create a relationship.");
      return;
    }
    if (fromTable === toTable) {
      toast.error("Cannot create a relationship within the same table.");
      return;
    }
    const newRelationship: Relationship = {
      id: nanoid(),
      fromTable,
      fromColumn,
      toTable,
      toColumn,
      cardinality,
    };
    onSave(newRelationship);
    setFromTable(undefined);
    setFromColumn(undefined);
    setToTable(undefined);
    setToColumn(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Relationships</DialogTitle>
          <DialogDescription>
            Create and manage relationships between your data tables. This allows filters to work across different visuals.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Create New Relationship</h3>
            <div className="space-y-2">
              <Label>From Table</Label>
              <Select value={fromTable} onValueChange={(value) => { setFromTable(value); setFromColumn(undefined); }}>
                <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
                <SelectContent>{datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Column</Label>
              <Select value={fromColumn} onValueChange={setFromColumn} disabled={!fromTable}>
                <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                <SelectContent>{fromTableFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Table</Label>
              <Select value={toTable} onValueChange={(value) => { setToTable(value); setToColumn(undefined); }}>
                <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
                <SelectContent>{datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Column</Label>
              <Select value={toColumn} onValueChange={setToColumn} disabled={!toTable}>
                <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                <SelectContent>{toTableFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cardinality (Auto-detected)</Label>
              <Select value={cardinality} onValueChange={(v: Cardinality) => setCardinality(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-to-many">One to Many</SelectItem>
                  <SelectItem value="one-to-one">One to One</SelectItem>
                  <SelectItem value="many-to-one">Many to One</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">Add Relationship</Button>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Existing Relationships</h3>
            <ScrollArea className="h-96 pr-4">
              <div className="space-y-2">
                {relationships.length > 0 ? relationships.map(rel => {
                  const fromTableName = datasets.find(d => d.id === rel.fromTable)?.name;
                  const toTableName = datasets.find(d => d.id === rel.toTable)?.name;
                  return (
                    <div key={rel.id} className="p-3 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{fromTableName} &harr; {toTableName}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(rel.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {rel.fromColumn} <Link className="w-3 h-3 inline-block mx-1" /> {rel.toColumn}
                      </p>
                      <p className="text-xs text-muted-foreground/80 capitalize mt-1">{rel.cardinality.replace('-', ' to ')}</p>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground text-center pt-8">No relationships defined yet.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}