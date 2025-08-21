import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type VisualizationOptions } from "@/types/visualizations";

interface TextBoxSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function TextBoxSettings({ options, onOptionChange }: TextBoxSettingsProps) {
  if (!options.textBox) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Text (Markdown supported)</Label>
        <Textarea
          value={options.textBox.text}
          onChange={(e) => onOptionChange('textBox.text', e.target.value)}
          rows={6}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Font Size</Label>
          <Input
            type="number"
            value={options.textBox.fontSize}
            onChange={(e) => onOptionChange('textBox.fontSize', parseInt(e.target.value, 10))}
          />
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <Input
            type="color"
            value={options.textBox.color}
            onChange={(e) => onOptionChange('textBox.color', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Font Weight</Label>
        <Select
          value={options.textBox.fontWeight || 'normal'}
          onValueChange={(value) => onOptionChange('textBox.fontWeight', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Font Weight" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lighter">Lighter</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
            <SelectItem value="bolder">Bolder</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Vertical Alignment</Label>
        <Select
          value={options.textBox.verticalAlign}
          onValueChange={(value) => onOptionChange('textBox.verticalAlign', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Vertical Alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="middle">Middle</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Horizontal Alignment</Label>
        <Select
          value={options.textBox.horizontalAlign}
          onValueChange={(value) => onOptionChange('textBox.horizontalAlign', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Horizontal Alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}