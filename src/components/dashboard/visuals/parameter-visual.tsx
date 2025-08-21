import { type Parameter } from "@/types/visualizations";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface ParameterVisualProps {
  parameter: Parameter;
  value: any;
  onValueChange: (value: any) => void;
}

export function ParameterVisual({ parameter, value, onValueChange }: ParameterVisualProps) {
  const { name, config } = parameter;
  const { min, max, step } = config;

  return (
    <div className="p-4 h-full flex flex-col justify-center space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={`param-${parameter.id}`} className="font-medium">{name}</Label>
        <Input
          type="number"
          className="w-24 h-8"
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
        />
      </div>
      <Slider
        id={`param-${parameter.id}`}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([val]) => onValueChange(val)}
      />
    </div>
  );
}