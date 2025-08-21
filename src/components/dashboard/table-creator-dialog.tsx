import { useState } from "react";
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
import { nanoid } from "nanoid";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

type Column = {
  id: string;
  name: string;
  type: 'Text' | 'Number' | 'Date';
};

interface TableCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, columns: { name: string; type: string }[]) => void;
}

export function TableCreatorDialog({ open, onOpenChange, onSave }: TableCreatorDialogProps) {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<Column[]>([{ id: nanoid(), name: "", type: 'Text' }]);

  const handleAddColumn = () => {
    setColumns([...columns, { id: nanoid(), name: "", type: 'Text' }]);
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const handleColumnChange = (id: string, field: 'name' | 'type', value: string) => {
    setColumns(columns.map(col => col.id === id ? { ...col, [field]: value } : col));
  };

  const handleSave = () => {
    if (!tableName.trim()) {
      toast.error("Please enter a table name.");
      return;
    }
    const validColumns = columns.filter(col => col.name.trim() !== '');
    if (validColumns.length === 0) {
      toast.error("Please define at least one column.");
      return;
    }
    const columnNames = new Set(validColumns.map(c => c.name.trim()));
    if (columnNames.size !== validColumns.length) {
      toast.error("Column names must be unique.");
      return;
    }

    onSave(tableName.trim(), validColumns.map(({ name, type }) => ({ name: name.trim(), type })));
    setTableName("");
    setColumns([{ id: nanoid(), name: "", type: 'Text' }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
          <DialogDescription>
            Define the name and columns for your new table. Data can be added later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Table Name</Label>
            <Input
              id="table-name"
              placeholder="e.g., Sales Targets"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Columns</Label>
            <ScrollArea className="max-h-60 pr-4">
              <div className="space-y-2">
                {columns.map((col, index) => (
                  <div key={col.id} className="flex items-center gap-2">
                    <Input
                      placeholder={`Column ${index + 1} Name`}
                      value={col.name}
                      onChange={(e) => handleColumnChange(col.id, 'name', e.target.value)}
                    />
                    <Select value={col.type} onValueChange={(v: Column['type']) => handleColumnChange(col.id, 'type', v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="Number">Number</SelectItem>
                        <SelectItem value="Date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveColumn(col.id)} disabled={columns.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button variant="outline" className="w-full" onClick={handleAddColumn}>
              <Plus className="w-4 h-4 mr-2" /> Add Column
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Create Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}