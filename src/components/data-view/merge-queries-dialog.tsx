import { useState, useMemo, useEffect } from "react";
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
import { type Dataset, type JoinType } from "@/types/visualizations";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Badge } from "../ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type MergeDestination = 'new' | 'left' | 'right';

interface MergeQueriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: Dataset[];
  onConfirm: (leftTableId: string, leftColumn: string, rightTableId: string, rightColumn: string, joinType: JoinType, mergeDestination: MergeDestination, columnsToMerge: string[], newTableName?: string) => void;
}

export function MergeQueriesDialog({ open, onOpenChange, datasets, onConfirm }: MergeQueriesDialogProps) {
  const [leftTableId, setLeftTableId] = useState<string | undefined>();
  const [leftColumn, setLeftColumn] = useState<string | undefined>();
  const [rightTableId, setRightTableId] = useState<string | undefined>();
  const [rightColumn, setRightColumn] = useState<string | undefined>();
  const [newTableName, setNewTableName] = useState("");
  const [mergeDestination, setMergeDestination] = useState<MergeDestination>('new');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [joinType, setJoinType] = useState<JoinType>('left');

  const leftTable = useMemo(() => datasets.find(d => d.id === leftTableId), [datasets, leftTableId]);
  const rightTable = useMemo(() => datasets.find(d => d.id === rightTableId), [datasets, rightTableId]);

  const availableColumnsToMerge = useMemo(() => {
    if (!rightTable || !rightColumn) return [];
    return rightTable.fields.filter(f => f !== rightColumn);
  }, [rightTable, rightColumn]);

  useEffect(() => {
    setSelectedColumns(new Set());
  }, [rightTableId]);

  useEffect(() => {
    if ((joinType !== 'left' && joinType !== 'inner') && mergeDestination === 'left') {
        setMergeDestination('new');
    }
  }, [joinType, mergeDestination]);

  const handleConfirm = () => {
    if (!leftTableId || !leftColumn || !rightTableId || !rightColumn) {
      toast.error("Please select both tables and their join columns.");
      return;
    }
    if (mergeDestination === 'new' && !newTableName.trim()) {
      toast.error("Please provide a name for the new table.");
      return;
    }
    if (selectedColumns.size === 0) {
      toast.error("Please select at least one column to merge.");
      return;
    }
    if (leftTableId === rightTableId) {
      toast.error("Cannot merge a table with itself.");
      return;
    }
    onConfirm(leftTableId, leftColumn, rightTableId, rightColumn, joinType, mergeDestination, Array.from(selectedColumns), newTableName.trim());
    onOpenChange(false);
    setLeftTableId(undefined);
    setLeftColumn(undefined);
    setRightTableId(undefined);
    setRightColumn(undefined);
    setNewTableName("");
    setMergeDestination('new');
    setSelectedColumns(new Set());
    setJoinType('left');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Merge Queries</DialogTitle>
          <DialogDescription>
            Combine two tables based on a matching column.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Left Table</h3>
            <div className="space-y-2">
              <Label>Table</Label>
              <Select value={leftTableId} onValueChange={(v) => { setLeftTableId(v); setLeftColumn(undefined); }}>
                <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
                <SelectContent>{datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Join Column</Label>
              <Select value={leftColumn} onValueChange={setLeftColumn} disabled={!leftTable}>
                <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                <SelectContent>{leftTable?.fields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Right Table</h3>
            <div className="space-y-2">
              <Label>Table</Label>
              <Select value={rightTableId} onValueChange={(v) => { setRightTableId(v); setRightColumn(undefined); }}>
                <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
                <SelectContent>{datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Join Column</Label>
              <Select value={rightColumn} onValueChange={setRightColumn} disabled={!rightTable}>
                <SelectTrigger><SelectValue placeholder="Select a column" /></SelectTrigger>
                <SelectContent>{rightTable?.fields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-2 pt-4 border-t">
          <Label>Join Type</Label>
          <Select value={joinType} onValueChange={(v: JoinType) => setJoinType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="left">Left Outer (all from first, matching from second)</SelectItem>
                  <SelectItem value="right">Right Outer (all from second, matching from first)</SelectItem>
                  <SelectItem value="full">Full Outer (all rows from both)</SelectItem>
                  <SelectItem value="inner">Inner (only matching rows)</SelectItem>
              </SelectContent>
          </Select>
        </div>
        {rightTable && (
          <div className="space-y-2 pt-4 border-t">
            <Label>Columns from '{rightTable.name}' to Merge</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-auto min-h-10">
                  <div className="flex flex-wrap gap-1">
                    {selectedColumns.size > 0 ? Array.from(selectedColumns).map(col => <Badge key={col} variant="secondary">{col}</Badge>) : "Select columns..."}
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
                      {availableColumnsToMerge.map(col => (
                        <CommandItem
                          key={col}
                          value={col}
                          onSelect={() => {
                            const newSelection = new Set(selectedColumns);
                            if (newSelection.has(col)) newSelection.delete(col);
                            else newSelection.add(col);
                            setSelectedColumns(newSelection);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedColumns.has(col) ? "opacity-100" : "opacity-0")} />
                          {col}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
        <div className="space-y-2 pt-4 border-t">
          <Label>Merge Destination</Label>
          <RadioGroup value={mergeDestination} onValueChange={(v: MergeDestination) => setMergeDestination(v)} className="flex space-x-4">
            <div className="flex items-center space-x-2"><RadioGroupItem value="new" id="dest-new" /><Label htmlFor="dest-new">New Table</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="left" id="dest-left" disabled={!leftTable || (joinType !== 'left' && joinType !== 'inner')} /><Label htmlFor="dest-left" className={cn(!leftTable && "text-muted-foreground")}>Merge into '{leftTable?.name || 'Left'}'</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="right" id="dest-right" disabled={true} /><Label htmlFor="dest-right" className="text-muted-foreground">Merge into '{rightTable?.name || 'Right'}'</Label></div>
          </RadioGroup>
        </div>
        {mergeDestination === 'new' && (
          <div className="space-y-2">
            <Label>New Table Name</Label>
            <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="e.g., Sales with Product Details" />
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleConfirm}>Merge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}