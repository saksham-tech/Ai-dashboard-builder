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
import { Switch } from "@/components/ui/switch";
import { type VisualizationOptions, type ChartType } from "@/types/visualizations";

interface GeneralSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
  chartType: ChartType;
}

export function GeneralSettings({ options, onOptionChange, chartType }: GeneralSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={options.title.text}
          onChange={(e) => onOptionChange('title.text', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Font Size</Label>
          <Input
            type="number"
            value={options.title.fontSize}
            onChange={(e) => onOptionChange('title.fontSize', parseInt(e.target.value, 10))}
          />
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <Input
            type="color"
            value={options.title.color}
            onChange={(e) => onOptionChange('title.color', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Alignment</Label>
        <Select
          value={options.title.alignment}
          onValueChange={(value) => onOptionChange('title.alignment', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {chartType === 'Card' && options.card && (
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">KPI Value</p>
            <p className="text-xs text-muted-foreground -mt-2">
              For data formatting (e.g., prefixes, decimals), use the settings icon in the 'Data Mapping' panel.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="number"
                value={options.card.valueFontSize}
                onChange={(e) => onOptionChange('card.valueFontSize', parseInt(e.target.value, 10))}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={options.card.valueColor}
                onChange={(e) => onOptionChange('card.valueColor', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Font Weight</Label>
            <Select
              value={options.card.valueFontWeight}
              onValueChange={(value) => onOptionChange('card.valueFontWeight', value)}
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

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label>Show Category</Label>
              <Switch
                checked={options.card.showCategory}
                onCheckedChange={(checked) => onOptionChange('card.showCategory', checked)}
              />
            </div>
          </div>
          {options.card.showCategory && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Category Font Size</Label>
                  <Input
                    type="number"
                    value={options.card.categoryFontSize}
                    onChange={(e) => onOptionChange('card.categoryFontSize', parseInt(e.target.value, 10))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category Color</Label>
                  <Input
                    type="color"
                    value={options.card.categoryColor}
                    onChange={(e) => onOptionChange('card.categoryColor', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category Font Weight</Label>
                <Select
                  value={options.card.categoryFontWeight}
                  onValueChange={(value) => onOptionChange('card.categoryFontWeight', value)}
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
            </>
          )}

          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Layout</p>
          </div>
          <div className="space-y-2">
            <Label>Text Alignment</Label>
            <Select
              value={options.card.textAlign}
              onValueChange={(value) => onOptionChange('card.textAlign', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vertical Alignment</Label>
            <Select
              value={options.card.verticalAlign}
              onValueChange={(value) => onOptionChange('card.verticalAlign', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Spacing (px)</Label>
            <Input
              type="number"
              value={options.card.spacing ?? 4}
              onChange={(e) => onOptionChange('card.spacing', parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-2">
          <Label>Background Color</Label>
          <Input
            type="color"
            value={options.general.backgroundColor}
            onChange={(e) => onOptionChange('general.backgroundColor', e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Background Opacity</Label>
          <Slider
            value={[options.general.backgroundOpacity ?? 1]}
            onValueChange={([value]) => onOptionChange("general.backgroundOpacity", value)}
            max={1}
            step={0.05}
          />
        </div>
        <div className="space-y-2">
          <Label>Border Color</Label>
          <Input
            type="color"
            value={options.general.borderColor}
            onChange={(e) => onOptionChange('general.borderColor', e.target.value)}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Border Width (px)</Label>
            <Input
              type="number"
              min="0"
              value={options.general.borderWidth ?? 1}
              onChange={(e) => onOptionChange('general.borderWidth', parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>Border Radius (px)</Label>
            <Input
              type="number"
              min="0"
              value={options.general.borderRadius}
              onChange={(e) => onOptionChange('general.borderRadius', parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Shadow</Label>
          <Select
            value={options.general.boxShadow}
            onValueChange={(value) => onOptionChange('general.boxShadow', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Shadow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}