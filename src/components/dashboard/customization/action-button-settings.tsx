import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Visualization, type VisualizationOptions } from "@/types/visualizations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface ActionButtonSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
  allVisualizations: Visualization[];
  currentVizId: string;
}

export function ActionButtonSettings({ options, onOptionChange, allVisualizations, currentVizId }: ActionButtonSettingsProps) {
  const { actionButton } = options;
  const [open, setOpen] = useState(false);

  if (!actionButton) return null;

  const availableTargets = allVisualizations.filter(v => v.id !== currentVizId);
  const selectedTargetIds = new Set(actionButton.targetVizIds || []);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024) { // 100KB limit
        toast.error("Icon is too large. Please upload an image under 100KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onOptionChange('actionButton.iconSrc', reader.result as string);
      };
      reader.onerror = () => {
        toast.error("Could not read the icon file.");
      }
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['action', 'styling']} className="w-full space-y-2">
        <AccordionItem value="action">
          <AccordionTrigger className="text-sm py-2">Action</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={actionButton.text}
                onChange={(e) => onOptionChange('actionButton.text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Visuals</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-10">
                    <div className="flex flex-wrap gap-1">
                      {selectedTargetIds.size > 0 ? (
                        availableTargets
                          .filter(v => selectedTargetIds.has(v.id))
                          .map(v => (
                            <Badge key={v.id} variant="secondary" className="mr-1">
                              {v.options.title.text || `Unnamed ${v.type}`}
                            </Badge>
                          ))
                      ) : (
                        "Select visuals..."
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search visuals..." />
                    <CommandList>
                      <CommandEmpty>No visuals found.</CommandEmpty>
                      <CommandGroup>
                        {availableTargets.map(viz => (
                          <CommandItem
                            key={viz.id}
                            value={viz.options.title.text || `Unnamed ${viz.type}`}
                            onSelect={() => {
                              const newSelection = new Set(selectedTargetIds);
                              if (newSelection.has(viz.id)) {
                                newSelection.delete(viz.id);
                              } else {
                                newSelection.add(viz.id);
                              }
                              onOptionChange('actionButton.targetVizIds', Array.from(newSelection));
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedTargetIds.has(viz.id) ? "opacity-100" : "opacity-0")} />
                            {viz.options.title.text || `Unnamed ${viz.type}`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="styling">
          <AccordionTrigger className="text-sm py-2">Styling</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="icon-upload">Button Icon</Label>
              <Input id="icon-upload" type="file" accept="image/*" onChange={handleIconUpload} className="cursor-pointer" />
            </div>
            {actionButton.iconSrc && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Icon Width (px)</Label>
                  <Input type="number" min="0" value={actionButton.iconWidth || 16} onChange={(e) => onOptionChange('actionButton.iconWidth', parseInt(e.target.value, 10) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Icon Height (px)</Label>
                  <Input type="number" min="0" value={actionButton.iconHeight || 16} onChange={(e) => onOptionChange('actionButton.iconHeight', parseInt(e.target.value, 10) || 0)} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Background</Label>
                <Input type="color" value={actionButton.backgroundColor} onChange={(e) => onOptionChange('actionButton.backgroundColor', e.target.value)} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <Input type="color" value={actionButton.textColor} onChange={(e) => onOptionChange('actionButton.textColor', e.target.value)} className="w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Background Opacity</Label>
              <Slider value={[actionButton.backgroundOpacity]} onValueChange={([v]) => onOptionChange('actionButton.backgroundOpacity', v)} max={1} step={0.05} />
            </div>
            <div className="space-y-2">
              <Label>Border Color</Label>
              <Input type="color" value={actionButton.borderColor} onChange={(e) => onOptionChange('actionButton.borderColor', e.target.value)} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Border Width</Label>
                <Input type="number" min="0" value={actionButton.borderWidth} onChange={(e) => onOptionChange('actionButton.borderWidth', parseInt(e.target.value, 10) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Input type="number" min="0" value={actionButton.borderRadius} onChange={(e) => onOptionChange('actionButton.borderRadius', parseInt(e.target.value, 10) || 0)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}