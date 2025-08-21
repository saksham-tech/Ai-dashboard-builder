import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type VisualizationOptions, type ChartType } from "@/types/visualizations";

interface ChartSpecificSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
  chartType: ChartType;
}

export function ChartSpecificSettings({ options, onOptionChange, chartType }: ChartSpecificSettingsProps) {
  const { chartSpecific } = options;
  if (!chartSpecific) return null;

  return (
    <div className="space-y-4">
      {['Bar', 'Combo', 'HorizontalBar'].includes(chartType) && (
        <>
          <div className="space-y-2">
            <Label>Bar Width</Label>
            <Input
              value={chartSpecific.barWidth}
              onChange={(e) => onOptionChange('chartSpecific.barWidth', e.target.value)}
              placeholder="e.g., 60% or 20"
            />
          </div>
          <div className="space-y-2">
            <Label>Bar Border Radius</Label>
            <Input
              type="number"
              value={chartSpecific.barBorderRadius[0]}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                onOptionChange('chartSpecific.barBorderRadius', [val, val, val, val]);
              }}
            />
          </div>
        </>
      )}

      {['Pie', 'Donut'].includes(chartType) && (
        <>
          <div className="space-y-2">
            <Label>Rose Type (Shape)</Label>
            <Select
              value={String(chartSpecific.pieRoseType)}
              onValueChange={(value) => onOptionChange('chartSpecific.pieRoseType', value === 'false' ? false : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Normal</SelectItem>
                <SelectItem value="radius">Radius</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pie Border Radius</Label>
            <Input
              type="number"
              value={chartSpecific.pieBorderRadius}
              onChange={(e) => onOptionChange('chartSpecific.pieBorderRadius', parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </>
      )}

      {['Line', 'Area', 'StackedArea', 'Combo'].includes(chartType) && (
        <>
          <div className="flex items-center justify-between">
            <Label>Smooth Line</Label>
            <Switch
              checked={chartSpecific.lineSmooth}
              onCheckedChange={(checked) => onOptionChange('chartSpecific.lineSmooth', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Symbols</Label>
            <Switch
              checked={chartSpecific.showSymbol}
              onCheckedChange={(checked) => onOptionChange('chartSpecific.showSymbol', checked)}
            />
          </div>
          {chartSpecific.showSymbol && (
            <div className="space-y-2">
              <Label>Symbol Size</Label>
              <Input
                type="number"
                value={chartSpecific.symbolSize}
                onChange={(e) => onOptionChange('chartSpecific.symbolSize', parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}