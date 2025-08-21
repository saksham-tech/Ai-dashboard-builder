import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type VisualizationOptions } from "@/types/visualizations";

interface LegendSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function LegendSettings({ options, onOptionChange }: LegendSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Show Legend</Label>
        <Switch
          checked={options.legend.show}
          onCheckedChange={(checked) => onOptionChange('legend.show', checked)}
        />
      </div>
      {options.legend.show && (
        <div className="space-y-2">
          <Label>Position</Label>
          <Select
            value={options.legend.position}
            onValueChange={(value) => onOptionChange('legend.position', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="center">Center</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}