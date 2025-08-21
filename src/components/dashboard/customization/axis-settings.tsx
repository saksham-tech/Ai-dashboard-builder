import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { type VisualizationOptions } from "@/types/visualizations";

interface AxisSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function AxisSettings({ options, onOptionChange }: AxisSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Show X-Axis</Label>
        <Switch
          checked={options.xAxis.show}
          onCheckedChange={(checked) => onOptionChange('xAxis.show', checked)}
        />
      </div>
      {options.xAxis.show && (
        <div className="space-y-2 pl-2 border-l-2 ml-2">
          <Label>X-Axis Color</Label>
          <Input
            type="color"
            value={options.xAxis.color}
            onChange={(e) => onOptionChange('xAxis.color', e.target.value)}
            className="w-full"
          />
          <div className="flex items-center justify-between pt-2">
            <Label>Show Grid Lines</Label>
            <Switch
              checked={options.xAxis.showGrid}
              onCheckedChange={(checked) => onOptionChange('xAxis.showGrid', checked)}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label>Show Y-Axis</Label>
        <Switch
          checked={options.yAxis.show}
          onCheckedChange={(checked) => onOptionChange('yAxis.show', checked)}
        />
      </div>
      {options.yAxis.show && (
        <div className="space-y-2 pl-2 border-l-2 ml-2">
          <Label>Y-Axis Color</Label>
          <Input
            type="color"
            value={options.yAxis.color}
            onChange={(e) => onOptionChange('yAxis.color', e.target.value)}
            className="w-full"
          />
          <div className="flex items-center justify-between pt-2">
            <Label>Show Grid Lines</Label>
            <Switch
              checked={options.yAxis.showGrid}
              onCheckedChange={(checked) => onOptionChange('yAxis.showGrid', checked)}
            />
          </div>
        </div>
      )}
    </div>
  );
}