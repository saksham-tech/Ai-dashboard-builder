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
import { OperandInput } from "./operand-input";
import { type Operand, type Parameter } from "@/types/visualizations";

interface CalculatedFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: string[];
  parameters: Parameter[];
  onSave: (name: string, op1: Operand, operator: string, op2: Operand) => void;
}

export function CalculatedFieldDialog({ open, onOpenChange, fields, parameters, onSave }: CalculatedFieldDialogProps) {
  const [name, setName] = useState("");
  const [operand1, setOperand1] = useState<Operand>({ type: 'field', value: '' });
  const [operator, setOperator] = useState<string | undefined>();
  const [operand2, setOperand2] = useState<Operand>({ type: 'field', value: '' });

  const fieldOptions = useMemo(() => {
    const tableAndMeasureFields = fields.map(field => ({ value: field, label: field }));
    const parameterFields = parameters.map(p => ({ value: p.name, label: `[Param] ${p.name}` }));
    return [...tableAndMeasureFields, ...parameterFields];
  }, [fields, parameters]);

  const handleSave = () => {
    const isOperand1Set = operand1.type === 'number' || (operand1.type === 'field' && operand1.value !== '');
    if (!name.trim() || !isOperand1Set) {
      toast.error("Please provide a name and a value for the first operand.");
      return;
    }
    if (fields.includes(name.trim())) {
      toast.error("A field with this name already exists.");
      return;
    }

    const isOperand2Set = operand2.type === 'number' || (operand2.type === 'field' && operand2.value !== '');
    const isFullFormula = operator && isOperand2Set;

    if (isFullFormula) {
      onSave(name.trim(), operand1, operator!, operand2);
    } else {
      // It's a static value or single field copy
      onSave(name.trim(), operand1, '+', { type: 'number', value: 0 });
    }

    setName("");
    setOperand1({ type: 'field', value: '' });
    setOperator(undefined);
    setOperand2({ type: 'field', value: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Calculated Field</DialogTitle>
          <DialogDescription>
            Create a new data field. To create a static value (e.g., a sales target), fill only the first input. To create a formula, fill all inputs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-field-name">New Field Name</Label>
            <Input
              id="new-field-name"
              placeholder="e.g., Profit Margin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-end justify-between gap-2">
            <OperandInput value={operand1} onChange={setOperand1} fields={fieldOptions} idPrefix="op1" />
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="w-24 flex-shrink-0"><SelectValue placeholder="Op" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="*">*</SelectItem>
                <SelectItem value="/">/</SelectItem>
                <SelectItem value="MAX">MAX</SelectItem>
                <SelectItem value="MIN">MIN</SelectItem>
              </SelectContent>
            </Select>
            <OperandInput value={operand2} onChange={setOperand2} fields={fieldOptions} idPrefix="op2" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Create Field</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}