import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { type VisualizationOptions } from "@/types/visualizations";

interface DataLabelSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function DataLabelSettings({ options, onOptionChange }: DataLabelSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Show Data Labels</Label>
        <Switch
          checked={options.dataLabels.show}
          onCheckedChange={(checked) => onOptionChange('dataLabels.show', checked)}
        />
      </div>
      {options.dataLabels.show && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Input
              type="number"
              value={options.dataLabels.fontSize}
              onChange={(e) => onOptionChange('dataLabels.fontSize', parseInt(e.target.value, 10))}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              type="color"
              value={options.dataLabels.color}
              onChange={(e) => onOptionChange('dataLabels.color', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}