import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { type VisualizationOptions, type ValueKeyConfig } from "@/types/visualizations";

interface StackedBarSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function StackedBarSettings({ options, onOptionChange }: StackedBarSettingsProps) {
  const { valueKeys } = options.dataMapping;
  const [selectedField, setSelectedField] = useState<string | undefined>(valueKeys[0]?.field);

  const selectedConfig = valueKeys.find(vk => vk.field === selectedField);
  const selectedIndex = valueKeys.findIndex(vk => vk.field === selectedField);

  const handleSettingChange = (field: keyof ValueKeyConfig, value: any) => {
    if (selectedIndex === -1) return;

    const newValueKeys = [...valueKeys];
    const updatedConfig = { ...newValueKeys[selectedIndex], [field]: value };
    newValueKeys[selectedIndex] = updatedConfig;
    onOptionChange('dataMapping.valueKeys', newValueKeys);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Series to Format</Label>
        <Select value={selectedField} onValueChange={setSelectedField}>
          <SelectTrigger>
            <SelectValue placeholder="Select a series" />
          </SelectTrigger>
          <SelectContent>
            {valueKeys.map(vk => (
              <SelectItem key={vk.field} value={vk.field}>{vk.field}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedConfig && (
        <div className="space-y-4 pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Bar Color</Label>
              <Input
                type="color"
                value={selectedConfig.color || '#000000'}
                onChange={(e) => handleSettingChange('color', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Border Color</Label>
              <Input
                type="color"
                value={selectedConfig.borderColor || '#000000'}
                onChange={(e) => handleSettingChange('borderColor', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bar Radius</Label>
            <Input
              type="number"
              min="0"
              value={selectedConfig.borderRadius || 0}
              onChange={(e) => handleSettingChange('borderRadius', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Background Opacity</Label>
            <Slider
              value={[selectedConfig.backgroundOpacity ?? 1]}
              onValueChange={([value]) => handleSettingChange('backgroundOpacity', value)}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      )}
    </div>
  );
}