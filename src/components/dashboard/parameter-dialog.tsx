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
import { toast } from "sonner";
import { type Parameter } from "@/types/visualizations";

interface ParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (parameter: Omit<Parameter, 'id'>) => void;
  existingNames: string[];
}

export function ParameterDialog({ open, onOpenChange, onSave, existingNames }: ParameterDialogProps) {
  const [name, setName] = useState("");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [step, setStep] = useState(1);
  const [defaultValue, setDefaultValue] = useState(50);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a parameter name.");
      return;
    }
    if (existingNames.includes(name.trim())) {
      toast.error("A parameter with this name already exists.");
      return;
    }
    if (min >= max) {
      toast.error("Minimum value must be less than the maximum value.");
      return;
    }
    if (defaultValue < min || defaultValue > max) {
      toast.error("Default value must be within the min/max range.");
      return;
    }

    onSave({
      name: name.trim(),
      type: 'numeric-slider',
      config: { min, max, step, defaultValue },
    });

    // Reset form
    setName("");
    setMin(0);
    setMax(100);
    setStep(1);
    setDefaultValue(50);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Parameter</DialogTitle>
          <DialogDescription>
            Define a numeric slider parameter for what-if analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="param-name">Parameter Name</Label>
            <Input id="param-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., DiscountRate" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="param-min">Minimum Value</Label>
              <Input id="param-min" type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="param-max">Maximum Value</Label>
              <Input id="param-max" type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="param-step">Step</Label>
              <Input id="param-step" type="number" value={step} onChange={(e) => setStep(Number(e.target.value))} min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="param-default">Default Value</Label>
              <Input id="param-default" type="number" value={defaultValue} onChange={(e) => setDefaultValue(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Create Parameter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}