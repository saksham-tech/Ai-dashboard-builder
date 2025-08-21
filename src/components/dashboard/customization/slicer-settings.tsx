import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type VisualizationOptions, type SlicerTextOptions, type Dataset } from "@/types/visualizations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FieldFormattingSettings } from "./field-formatting-settings";
import { toast } from "sonner";

interface SlicerSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
  fields: string[];
  dataset: Record<string, any>[];
  allDatasets: Dataset[];
}

const isImageUrl = (value: any): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmedValue = value.trim().toLowerCase();
  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://') || trimmedValue.startsWith('data:image')) {
    return true;
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'];
  return imageExtensions.some(ext => trimmedValue.endsWith(ext));
};

export function SlicerSettings({ options, onOptionChange, fields, dataset, allDatasets }: SlicerSettingsProps) {
  const slicerOptions = options.slicer;
  if (!slicerOptions) return null;

  // (removed) previously built a flat list of composite keys; now we show table->column selectors

  const imageFields = useMemo(() => {
    if (!allDatasets || allDatasets.length === 0) return [] as string[];
    const out: string[] = [];
    const nameHints = ['image', 'img', 'icon', 'logo', 'avatar', 'photo', 'picture', 'pic', 'thumbnail', 'thumb'];
    allDatasets.forEach(ds => {
      // scan up to 1000 rows or entire dataset if smaller
      const limit = Math.min(1000, ds.data.length);
      const sample = ds.data.slice(0, limit);
      ds.fields.forEach(field => {
        // Primary: detect by URL/image-like values in a larger sample
        const looksLikeImage = sample.some(row => isImageUrl(row[field]));
        if (looksLikeImage) {
          out.push(`${ds.id}:${field}`);
          return;
        }
        // Secondary: field name heuristic + any non-empty string in data
        const lower = field.toLowerCase();
        const nameSuggestsImage = nameHints.some(h => lower.includes(h));
        if (nameSuggestsImage) {
          const anyString = sample.some(row => typeof row[field] === 'string' && row[field].trim().length > 0);
          if (anyString) out.push(`${ds.id}:${field}`);
        }
      });
    });
    return Array.from(new Set(out));
  }, [allDatasets]);

  const hasAnyFields = useMemo(() => allDatasets.some(ds => ds.fields.length > 0), [allDatasets]);

  const handleAddText = () => {
    const newText: SlicerTextOptions = {
      id: nanoid(),
      field: null,
      fontSize: 14,
      color: slicerOptions.itemTextColor,
      fontWeight: 'normal',
      formatting: {},
      align: slicerOptions.textAlign || 'left',
    };
    onOptionChange('slicer.texts', [...slicerOptions.texts, newText]);
  };

  const handleRemoveText = (id: string) => {
    const newTexts = slicerOptions.texts.filter(t => t.id !== id);
    onOptionChange('slicer.texts', newTexts);
  };

  const handleTextChange = (id: string, field: keyof SlicerTextOptions, value: any) => {
    const newTexts = slicerOptions.texts.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    onOptionChange('slicer.texts', newTexts);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024) { // 100KB limit for icons
        toast.error("Icon is too large. Please upload an image under 100KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onOptionChange('slicer.popoverIconSrc', reader.result as string);
      };
      reader.onerror = () => {
        toast.error("Could not read the icon file. Please try again.");
      }
      reader.readAsDataURL(file);
    }
  };

  const imageSettings = slicerOptions.image;

  const getDatasetLabel = (id: string) => {
    const ds = allDatasets.find(d => d.id === id);
    return ds?.name || ds?.id || id;
  };

  const parseCompositeKeyLocal = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['behavior', 'style', 'layout', 'text-fields']} className="w-full space-y-2">
        <AccordionItem value="behavior">
          <AccordionTrigger className="text-sm py-2">Behavior</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Allow Multi-Select</Label>
              <Switch
                checked={slicerOptions.allowMultiSelect}
                onCheckedChange={(checked) => onOptionChange("slicer.allowMultiSelect", checked)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="popover-mode">
          <AccordionTrigger className="text-sm py-2">Popover Mode</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Enable Popover Mode</Label>
              <Switch
                checked={slicerOptions.popoverModeEnabled}
                onCheckedChange={(checked) => onOptionChange("slicer.popoverModeEnabled", checked)}
              />
            </div>
            {slicerOptions.popoverModeEnabled && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Popover Title</Label>
                  <Input value={slicerOptions.popoverTitle || ''} onChange={(e) => onOptionChange("slicer.popoverTitle", e.target.value)} placeholder="e.g., Filter by Region" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon-upload">Custom Icon</Label>
                  <Input id="icon-upload" type="file" accept="image/*" onChange={handleIconUpload} className="cursor-pointer" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Active Filter Count</Label>
                  <Switch
                    checked={slicerOptions.showActiveFilterCount}
                    onCheckedChange={(checked) => onOptionChange("slicer.showActiveFilterCount", checked)}
                  />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layout">
          <AccordionTrigger className="text-sm py-2">Layout</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Columns</Label>
                <Input type="number" min="1" value={slicerOptions.layout.gridColumns} onChange={(e) => onOptionChange("slicer.layout.gridColumns", parseInt(e.target.value, 10) || 1)} />
              </div>
              <div className="space-y-2">
                <Label>Gap (px)</Label>
                <Input type="number" min="0" value={slicerOptions.layout.gap} onChange={(e) => onOptionChange("slicer.layout.gap", parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Item Height (px)</Label>
                <Input type="number" min="0" value={slicerOptions.layout.itemHeight || 0} onChange={(e) => onOptionChange("slicer.layout.itemHeight", parseInt(e.target.value, 10) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Item Width (px)</Label>
                <Input type="number" min="0" value={slicerOptions.layout.itemWidth || 0} onChange={(e) => onOptionChange("slicer.layout.itemWidth", parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Set height to 0 for auto height. Set width to 0 to fit columns, or a value for fixed width and wrapping.</p>
            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select value={slicerOptions.textAlign || 'left'} onValueChange={(v) => onOptionChange("slicer.textAlign", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="text-fields">
          <AccordionTrigger className="text-sm py-2">Text Fields</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-3">
              {slicerOptions.texts.map((text, index) => (
                <div key={text.id} className="p-3 space-y-3 bg-muted/50 rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Text Field {index + 1}</Label>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveText(text.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const parsed = parseCompositeKeyLocal(text.field || '');
                        const selectedDatasetId = parsed?.datasetId || '';
                        const selectedField = parsed?.field || '';
                        const datasetFields = selectedDatasetId ? (allDatasets.find(d => d.id === selectedDatasetId)?.fields || []) : [];
                        return (
                          <>
                            <Select
                              value={selectedDatasetId}
                              onValueChange={(dsId) => {
                                const firstField = (allDatasets.find(d => d.id === dsId)?.fields || [])[0] || '';
                                const newValue = firstField ? `${dsId}:${firstField}` : '';
                                handleTextChange(text.id, 'field', newValue);
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                              <SelectContent>
                                {allDatasets.map(ds => (
                                  <SelectItem key={ds.id} value={ds.id}>{getDatasetLabel(ds.id)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={selectedField}
                              onValueChange={(fld) => handleTextChange(text.id, 'field', `${selectedDatasetId}:${fld}`)}
                              disabled={!selectedDatasetId}
                            >
                              <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                              <SelectContent>
                                {datasetFields.map(f => (
                                  <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Font Size</Label>
                        <Input type="number" min="8" value={text.fontSize} onChange={(e) => handleTextChange(text.id, 'fontSize', parseInt(e.target.value, 10) || 12)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color</Label>
                        <Input type="color" value={text.color} onChange={(e) => handleTextChange(text.id, 'color', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Align</Label>
                        <Select value={text.align || 'left'} onValueChange={(v) => handleTextChange(text.id, 'align', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {text.field && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0"><Settings2 className="w-4 h-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <FieldFormattingSettings
                            formatting={text.formatting || {}}
                            onFormattingChange={(f) => handleTextChange(text.id, 'formatting', f)}
                            dataset={dataset}
                            fieldName={text.field}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-3" onClick={handleAddText}><Plus className="w-4 h-4 mr-2" /> Add Text Field</Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="style">
          <AccordionTrigger className="text-sm py-2">Item Style</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Show Item Container</Label>
              <Switch
                checked={slicerOptions.showItemContainer}
                onCheckedChange={(checked) => onOptionChange("slicer.showItemContainer", checked)}
              />
            </div>
            {slicerOptions.showItemContainer && (
              <>
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <Input type="color" value={slicerOptions.itemBackgroundColor} onChange={(e) => onOptionChange("slicer.itemBackgroundColor", e.target.value)} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label>Selected BG</Label>
                    <Input type="color" value={slicerOptions.selectedItemBackgroundColor} onChange={(e) => onOptionChange("slicer.selectedItemBackgroundColor", e.target.value)} className="w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Opacity</Label>
                  <Slider
                    value={[slicerOptions.itemBackgroundOpacity]}
                    onValueChange={([value]) => onOptionChange("slicer.itemBackgroundOpacity", value)}
                    max={1}
                    step={0.05}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Selected BG Opacity</Label>
                  <Slider
                    value={[slicerOptions.selectedItemBackgroundOpacity]}
                    onValueChange={([value]) => onOptionChange("slicer.selectedItemBackgroundOpacity", value)}
                    max={1}
                    step={0.05}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Border Radius (px)</Label>
                    <Input type="number" min="0" value={slicerOptions.itemBorderRadius} onChange={(e) => onOptionChange("slicer.itemBorderRadius", parseInt(e.target.value, 10) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Padding (px)</Label>
                    <Input type="number" min="0" value={slicerOptions.itemPadding} onChange={(e) => onOptionChange("slicer.itemPadding", parseInt(e.target.value, 10) || 0)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Padding (px)</Label>
                  <Input type="number" min="0" value={slicerOptions.textBlockPadding || 0} onChange={(e) => onOptionChange("slicer.textBlockPadding", parseInt(e.target.value, 10) || 0)} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="space-y-2">
                    <Label>Border Color</Label>
                    <Input type="color" value={slicerOptions.itemBorderColor} onChange={(e) => onOptionChange("slicer.itemBorderColor", e.target.value)} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label>Selected Border</Label>
                    <Input type="color" value={slicerOptions.selectedItemBorderColor} onChange={(e) => onOptionChange("slicer.selectedItemBorderColor", e.target.value)} className="w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Width (px)</Label>
                  <Input type="number" min="0" value={slicerOptions.itemBorderWidth} onChange={(e) => onOptionChange("slicer.itemBorderWidth", parseInt(e.target.value, 10) || 0)} />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {imageSettings && (
          <AccordionItem value="image">
            <AccordionTrigger className="text-sm py-2">Image</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Image Field</Label>
                {(() => {
                  const parsed = parseCompositeKeyLocal(imageSettings.field || '');
                  const selectedDatasetId = parsed?.datasetId || '';
                  const selectedField = parsed?.field || '';
                  const imageFieldsByDataset = (dsId: string) => imageFields.filter(f => f.startsWith(`${dsId}:`)).map(f => f.split(':').slice(1).join(':'));
                  return (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedDatasetId}
                        onValueChange={(dsId) => {
                          const candidates = imageFieldsByDataset(dsId);
                          const firstField = candidates[0] || '';
                          const newValue = firstField ? `${dsId}:${firstField}` : '';
                          onOptionChange("slicer.image.field", newValue || null);
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger>
                        <SelectContent>
                          {allDatasets.map(ds => (
                            <SelectItem key={ds.id} value={ds.id}>{getDatasetLabel(ds.id)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedField}
                        onValueChange={(fld) => onOptionChange("slicer.image.field", `${selectedDatasetId}:${fld}`)}
                        disabled={!selectedDatasetId}
                      >
                        <SelectTrigger><SelectValue placeholder="Select image column" /></SelectTrigger>
                        <SelectContent>
                          {selectedDatasetId && imageFieldsByDataset(selectedDatasetId).map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })()}
                {imageFields.length === 0 && hasAnyFields && <p className="text-xs text-muted-foreground">No fields with image URLs detected in your data.</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Position</Label>
                  <Select value={imageSettings.position} onValueChange={(value) => onOptionChange("slicer.image.position", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Object Fit</Label>
                  <Select value={imageSettings.objectFit} onValueChange={(value) => onOptionChange("slicer.image.objectFit", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contain">Contain</SelectItem>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="fill">Fill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Align</Label>
                <Select value={imageSettings.align || 'left'} onValueChange={(v) => onOptionChange('slicer.image.align', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Width (px)</Label>
                  <Input type="number" min="0" value={imageSettings.width} onChange={(e) => onOptionChange("slicer.image.width", parseInt(e.target.value, 10) || 32)} />
                </div>
                <div>
                  <Label>Height (px)</Label>
                  <Input type="number" min="0" value={imageSettings.height} onChange={(e) => onOptionChange("slicer.image.height", parseInt(e.target.value, 10) || 32)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image Padding (px)</Label>
                <Input type="number" min="0" value={imageSettings.padding || 0} onChange={(e) => onOptionChange("slicer.image.padding", parseInt(e.target.value, 10) || 0)} />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}