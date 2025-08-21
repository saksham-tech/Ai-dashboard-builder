import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type VisualizationOptions } from "@/types/visualizations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GaugeSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function GaugeSettings({ options, onOptionChange }: GaugeSettingsProps) {
  const gaugeOptions = options.gauge;
  if (!gaugeOptions) return null;

  const handleColorChange = (index: number, field: 'value' | 'color', value: any) => {
    const newColors = [...gaugeOptions.axisLineColor];
    if (field === 'value') {
      newColors[index][0] = parseFloat(value) || 0;
    } else {
      newColors[index][1] = value;
    }
    onOptionChange('gauge.axisLineColor', newColors);
  };

  const addColorStop = () => {
    const newColors = [...gaugeOptions.axisLineColor, [1, '#ff4d4f']];
    onOptionChange('gauge.axisLineColor', newColors);
  };

  const removeColorStop = (index: number) => {
    const newColors = gaugeOptions.axisLineColor.filter((_, i) => i !== index);
    onOptionChange('gauge.axisLineColor', newColors);
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['range', 'axis', 'style', 'value-text']} className="w-full space-y-2">
        <AccordionItem value="range">
          <AccordionTrigger className="text-sm py-2">Fallback Range</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground -mt-2">Used if Min/Max value fields are not set in Data Mapping.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Min Value</Label>
                <Input type="number" value={gaugeOptions.min} onChange={(e) => onOptionChange('gauge.min', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Max Value</Label>
                <Input type="number" value={gaugeOptions.max} onChange={(e) => onOptionChange('gauge.max', Number(e.target.value))} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="axis">
          <AccordionTrigger className="text-sm py-2">Axis</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Start Angle</Label>
                <Input type="number" value={gaugeOptions.startAngle} onChange={(e) => onOptionChange('gauge.startAngle', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>End Angle</Label>
                <Input type="number" value={gaugeOptions.endAngle} onChange={(e) => onOptionChange('gauge.endAngle', Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Split Number</Label>
              <Input type="number" min="0" value={gaugeOptions.splitNumber} onChange={(e) => onOptionChange('gauge.splitNumber', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Color Stops</Label>
              <div className="space-y-2">
                {gaugeOptions.axisLineColor.map(([val, color], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="number" step="0.1" max="1" min="0" value={val} onChange={(e) => handleColorChange(i, 'value', e.target.value)} className="w-20" />
                    <Input type="color" value={color} onChange={(e) => handleColorChange(i, 'color', e.target.value)} className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeColorStop(i)} disabled={gaugeOptions.axisLineColor.length <= 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={addColorStop}>
                <Plus className="w-4 h-4 mr-2" /> Add Color Stop
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="style">
          <AccordionTrigger className="text-sm py-2">Style</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Progress Color</Label>
              <Input type="color" value={gaugeOptions.progressColor} onChange={(e) => onOptionChange('gauge.progressColor', e.target.value)} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label>Radius (%)</Label>
              <Slider value={[gaugeOptions.radius || 75]} onValueChange={([v]) => onOptionChange('gauge.radius', v)} min={50} max={100} step={1} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Show Target Line</Label>
              <Switch checked={gaugeOptions.showTarget} onCheckedChange={(c) => onOptionChange('gauge.showTarget', c)} />
            </div>
            {gaugeOptions.showTarget && (
              <div className="space-y-2">
                <Label>Target Color</Label>
                <Input type="color" value={gaugeOptions.targetColor} onChange={(e) => onOptionChange('gauge.targetColor', e.target.value)} className="w-full" />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="value-text">
          <AccordionTrigger className="text-sm py-2">Value Text</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input type="number" value={gaugeOptions.detailStyle?.fontSize || 24} onChange={(e) => onOptionChange('gauge.detailStyle.fontSize', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input type="color" value={gaugeOptions.detailStyle?.color || '#ffffff'} onChange={(e) => onOptionChange('gauge.detailStyle.color', e.target.value)} className="w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select value={gaugeOptions.detailStyle?.fontWeight || 'bold'} onValueChange={(v) => onOptionChange('gauge.detailStyle.fontWeight', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="bolder">Bolder</SelectItem>
                  <SelectItem value="lighter">Lighter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Detail Formatter</Label>
              <Input value={gaugeOptions.detailFormatter} onChange={(e) => onOptionChange('gauge.detailFormatter', e.target.value)} placeholder="{value}" />
              <p className="text-xs text-muted-foreground">Use `&#123;value&#125;` as a placeholder for the current value.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}