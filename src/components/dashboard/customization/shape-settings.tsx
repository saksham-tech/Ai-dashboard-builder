import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Visualization, type VisualizationOptions } from "@/types/visualizations";
import { Slider } from "@/components/ui/slider";

interface ShapeSettingsProps {
  visualization: Visualization;
  onOptionChange: (path: string, value: any) => void;
  onUpdateVisualization: (props: Partial<Visualization>) => void;
}

export function ShapeSettings({ visualization, onOptionChange, onUpdateVisualization }: ShapeSettingsProps) {
  const { options, width, height } = visualization;
  if (!options.shape) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Width (px)</Label>
          <Input
            type="number"
            min="10"
            value={Math.round(width)}
            onChange={(e) => onUpdateVisualization({ width: parseInt(e.target.value, 10) || 10 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Height (px)</Label>
          <Input
            type="number"
            min="10"
            value={Math.round(height)}
            onChange={(e) => onUpdateVisualization({ height: parseInt(e.target.value, 10) || 10 })}
          />
        </div>
      </div>
      {options.shape.shapeType !== 'line' && (
        <div className="space-y-2">
          <Label>Fill Color</Label>
          <Input
            type="color"
            value={options.shape.fillColor}
            onChange={(e) => onOptionChange('shape.fillColor', e.target.value)}
            className="w-full"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>Stroke Color</Label>
        <Input
          type="color"
          value={options.shape.strokeColor}
          onChange={(e) => onOptionChange('shape.strokeColor', e.target.value)}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label>Stroke Width (px)</Label>
        <Input
          type="number"
          min="0"
          value={options.shape.strokeWidth}
          onChange={(e) => onOptionChange('shape.strokeWidth', parseInt(e.target.value, 10) || 0)}
        />
      </div>
      <div className="space-y-2">
        <Label>Stroke Style</Label>
        <Select
          value={options.shape.strokeDasharray}
          onValueChange={(value) => onOptionChange('shape.strokeDasharray', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Stroke Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Solid</SelectItem>
            <SelectItem value="5, 5">Dashed</SelectItem>
            <SelectItem value="2, 2">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {options.shape.shapeType === 'rectangle' && (
        <div className="space-y-2">
          <Label>Corner Radius (px)</Label>
          <Input
            type="number"
            min="0"
            value={options.shape.cornerRadius || 0}
            onChange={(e) => onOptionChange('shape.cornerRadius', parseInt(e.target.value, 10) || 0)}
          />
        </div>
      )}
      {options.shape.shapeType !== 'line' && (
        <div className="space-y-2">
          <Label>Fill Opacity</Label>
          <Slider
            value={[options.shape.fillOpacity ?? 1]}
            onValueChange={([value]) => onOptionChange("shape.fillOpacity", value)}
            max={1}
            step={0.05}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label>Stroke Opacity</Label>
        <Slider
          value={[options.shape.strokeOpacity ?? 1]}
          onValueChange={([value]) => onOptionChange("shape.strokeOpacity", value)}
          max={1}
          step={0.05}
        />
      </div>
    </div>
  );
}