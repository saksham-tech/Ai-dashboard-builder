import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";
import { type Operand } from "@/types/visualizations";

interface OperandInputProps {
  value: Operand;
  onChange: (value: Operand) => void;
  fields: { value: string; label: string }[];
  idPrefix: string;
}

export function OperandInput({ value, onChange, fields, idPrefix }: OperandInputProps) {
  const handleTypeChange = (type: 'field' | 'number') => {
    onChange({ type, value: type === 'field' ? '' : 0 });
  };

  const handleValueChange = (newValue: string | number) => {
    onChange({ ...value, value: newValue });
  };

  return (
    <div className="flex-1 space-y-2">
      <RadioGroup
        value={value.type}
        onValueChange={handleTypeChange}
        className="flex items-center space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="field" id={`${idPrefix}-field`} />
          <Label htmlFor={`${idPrefix}-field`}>Field</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="number" id={`${idPrefix}-number`} />
          <Label htmlFor={`${idPrefix}-number`}>Number</Label>
        </div>
      </RadioGroup>
      {value.type === 'field' ? (
        <Combobox
          options={fields}
          value={String(value.value)}
          onChange={(val) => handleValueChange(val)}
          placeholder="Select field..."
          searchPlaceholder="Search fields..."
          emptyMessage="No fields found."
        />
      ) : (
        <Input
          type="number"
          value={value.value}
          onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
          placeholder="Enter a number"
        />
      )}
    </div>
  );
}