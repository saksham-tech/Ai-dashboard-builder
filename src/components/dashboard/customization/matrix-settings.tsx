import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type VisualizationOptions } from "@/types/visualizations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MatrixSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function MatrixSettings({ options, onOptionChange }: MatrixSettingsProps) {
  const matrixOptions = options.matrix;
  if (!matrixOptions) return null;

  const defaultCf = {
    enabled: false,
    backgroundColorScale: { enabled: false, minColor: '#d73027', centerColor: '#fee08b', maxColor: '#1a9850' },
    fontColorScale: { enabled: false, minColor: '#000000', centerColor: '#000000', maxColor: '#000000' },
  };

  const cf = {
    ...defaultCf,
    ...(matrixOptions.conditionalFormatting || {}),
    backgroundColorScale: {
      ...defaultCf.backgroundColorScale,
      ...(matrixOptions.conditionalFormatting?.backgroundColorScale || {}),
    },
    fontColorScale: {
      ...defaultCf.fontColorScale,
      ...(matrixOptions.conditionalFormatting?.fontColorScale || {}),
    },
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['grid', 'headers', 'values', 'totals', 'conditional-formatting']} className="w-full space-y-2">
        <AccordionItem value="grid">
          <AccordionTrigger className="text-sm py-2">Grid</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Vertical Grid</Label>
              <Switch checked={matrixOptions.grid.vertical} onCheckedChange={(c) => onOptionChange('matrix.grid.vertical', c)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Horizontal Grid</Label>
              <Switch checked={matrixOptions.grid.horizontal} onCheckedChange={(c) => onOptionChange('matrix.grid.horizontal', c)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Grid Color</Label>
                <Input type="color" value={matrixOptions.grid.color} onChange={(e) => onOptionChange('matrix.grid.color', e.target.value)} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Thickness (px)</Label>
                <Input type="number" min="0" value={matrixOptions.grid.thickness} onChange={(e) => onOptionChange('matrix.grid.thickness', parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="headers">
          <AccordionTrigger className="text-sm py-2">Headers</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <p className="font-medium text-xs">Column Headers</p>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Font Size" value={matrixOptions.columnHeaders.fontSize} onChange={(e) => onOptionChange('matrix.columnHeaders.fontSize', parseInt(e.target.value, 10) || 12)} />
              <Input type="color" value={matrixOptions.columnHeaders.color} onChange={(e) => onOptionChange('matrix.columnHeaders.color', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Character Limit</Label>
              <Input type="number" min="1" placeholder="e.g., 3" value={matrixOptions.columnHeaders.characterLimit || ''} onChange={(e) => onOptionChange('matrix.columnHeaders.characterLimit', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <Input type="color" value={matrixOptions.columnHeaders.backgroundColor} onChange={(e) => onOptionChange('matrix.columnHeaders.backgroundColor', e.target.value)} />
            <div className="flex items-center justify-between"><Label>Word Wrap</Label><Switch checked={matrixOptions.columnHeaders.wordWrap} onCheckedChange={(c) => onOptionChange('matrix.columnHeaders.wordWrap', c)} /></div>
            
            <p className="font-medium text-xs pt-4 border-t">Row Headers</p>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Font Size" value={matrixOptions.rowHeaders.fontSize} onChange={(e) => onOptionChange('matrix.rowHeaders.fontSize', parseInt(e.target.value, 10) || 12)} />
              <Input type="color" value={matrixOptions.rowHeaders.color} onChange={(e) => onOptionChange('matrix.rowHeaders.color', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Character Limit</Label>
              <Input type="number" min="1" placeholder="e.g., 3" value={matrixOptions.rowHeaders.characterLimit || ''} onChange={(e) => onOptionChange('matrix.rowHeaders.characterLimit', e.target.value ? parseInt(e.target.value, 10) : undefined)} />
            </div>
            <Input type="color" value={matrixOptions.rowHeaders.backgroundColor} onChange={(e) => onOptionChange('matrix.rowHeaders.backgroundColor', e.target.value)} />
            <div className="flex items-center justify-between"><Label>Word Wrap</Label><Switch checked={matrixOptions.rowHeaders.wordWrap} onCheckedChange={(c) => onOptionChange('matrix.rowHeaders.wordWrap', c)} /></div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="values">
          <AccordionTrigger className="text-sm py-2">Values</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Font Size" value={matrixOptions.values.fontSize} onChange={(e) => onOptionChange('matrix.values.fontSize', parseInt(e.target.value, 10) || 12)} />
              <Input type="color" value={matrixOptions.values.color} onChange={(e) => onOptionChange('matrix.values.color', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Row Padding (px)</Label>
                <Input type="number" min="0" value={matrixOptions.values.rowPadding ?? 4} onChange={(e) => onOptionChange('matrix.values.rowPadding', parseInt(e.target.value, 10) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Column Padding (px)</Label>
                <Input type="number" min="0" value={matrixOptions.values.columnPadding ?? 8} onChange={(e) => onOptionChange('matrix.values.columnPadding', parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>
            <Input type="color" value={matrixOptions.values.backgroundColor} onChange={(e) => onOptionChange('matrix.values.backgroundColor', e.target.value)} />
            <div className="flex items-center justify-between"><Label>Word Wrap</Label><Switch checked={matrixOptions.values.wordWrap} onCheckedChange={(c) => onOptionChange('matrix.values.wordWrap', c)} /></div>
            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Alternate Row Colors</Label>
              <Switch checked={matrixOptions.values.showAlternatingRows} onCheckedChange={(c) => onOptionChange('matrix.values.showAlternatingRows', c)} />
            </div>
            {matrixOptions.values.showAlternatingRows && (
              <div className="space-y-2">
                <Label>Alternate Row Color</Label>
                <Input type="color" value={matrixOptions.values.alternatingRowColor} onChange={(e) => onOptionChange('matrix.values.alternatingRowColor', e.target.value)} className="w-full" />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="totals">
          <AccordionTrigger className="text-sm py-2">Totals</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Row Grand Total</Label>
              <Switch checked={matrixOptions.totals.showRowGrandTotal} onCheckedChange={(c) => onOptionChange('matrix.totals.showRowGrandTotal', c)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Column Grand Total</Label>
              <Switch checked={matrixOptions.totals.showColumnGrandTotal} onCheckedChange={(c) => onOptionChange('matrix.totals.showColumnGrandTotal', c)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Font Size" value={matrixOptions.totals.fontSize} onChange={(e) => onOptionChange('matrix.totals.fontSize', parseInt(e.target.value, 10) || 12)} />
              <Input type="color" value={matrixOptions.totals.color} onChange={(e) => onOptionChange('matrix.totals.color', e.target.value)} />
            </div>
            <Input type="color" value={matrixOptions.totals.backgroundColor} onChange={(e) => onOptionChange('matrix.totals.backgroundColor', e.target.value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="conditional-formatting">
          <AccordionTrigger className="text-sm py-2">Conditional Formatting</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Enable Formatting</Label>
              <Switch checked={cf.enabled} onCheckedChange={(c) => onOptionChange('matrix.conditionalFormatting.enabled', c)} />
            </div>
            {cf.enabled && (
              <div className="space-y-4">
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Background Color Scale</Label>
                    <Switch checked={cf.backgroundColorScale.enabled} onCheckedChange={(c) => onOptionChange('matrix.conditionalFormatting.backgroundColorScale.enabled', c)} />
                  </div>
                  {cf.backgroundColorScale.enabled && (
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="color" value={cf.backgroundColorScale.minColor} onChange={(e) => onOptionChange('matrix.conditionalFormatting.backgroundColorScale.minColor', e.target.value)} />
                      <Input type="color" value={cf.backgroundColorScale.centerColor} onChange={(e) => onOptionChange('matrix.conditionalFormatting.backgroundColorScale.centerColor', e.target.value)} />
                      <Input type="color" value={cf.backgroundColorScale.maxColor} onChange={(e) => onOptionChange('matrix.conditionalFormatting.backgroundColorScale.maxColor', e.target.value)} />
                    </div>
                  )}
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Font Color Scale</Label>
                    <Switch checked={cf.fontColorScale.enabled} onCheckedChange={(c) => onOptionChange('matrix.conditionalFormatting.fontColorScale.enabled', c)} />
                  </div>
                  {cf.fontColorScale.enabled && (
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="color" value={cf.fontColorScale.minColor} onChange={(e) => onOptionChange('matrix.conditionalFormatting.fontColorScale.minColor', e.target.value)} />
                      <Input type="color" value={cf.fontColorScale.centerColor} onChange={(e) => onOptionChange('matrix.conditionalFormatting.fontColorScale.centerColor', e.target.value)} />
                      <Input type="color" value={cf.fontColorScale.maxColor} onChange={(e) => onOptionChange('matrix.conditionalFormatting.fontColorScale.maxColor', e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}