import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type VisualizationOptions } from "@/types/visualizations";

interface ColorSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
  isComboChart: boolean;
}

export function ColorSettings({ options, onOptionChange, isComboChart }: ColorSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Primary Color</Label>
        <Input
          type="color"
          value={options.colors.primary}
          onChange={(e) => onOptionChange('colors.primary', e.target.value)}
          className="w-full"
        />
      </div>
      {isComboChart && (
        <div className="space-y-2">
          <Label>Secondary Color</Label>
          <Input
            type="color"
            value={options.colors.secondary}
            onChange={(e) => onOptionChange('colors.secondary', e.target.value)}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}