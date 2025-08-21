import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type VisualizationOptions, type ConditionalFormattingRule } from "@/types/visualizations";
import { nanoid } from "nanoid";
import { Trash2 } from "lucide-react";

interface ConditionalFormattingSettingsProps {
  options: VisualizationOptions;
  onOptionChange: (path: string, value: any) => void;
}

export function ConditionalFormattingSettings({ options, onOptionChange }: ConditionalFormattingSettingsProps) {
  const { conditionalFormatting } = options;
  if (!conditionalFormatting) return null;

  const handleRuleChange = (ruleId: string, field: keyof ConditionalFormattingRule, value: any) => {
    const newRules = conditionalFormatting.rules.map(rule =>
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    );
    onOptionChange('conditionalFormatting.rules', newRules);
  };

  const handleAddRule = () => {
    const newRule: ConditionalFormattingRule = {
      id: nanoid(),
      target: 'value',
      operator: 'gt',
      value: 0,
      color: '#ff4d4f',
      text: '',
    };
    onOptionChange('conditionalFormatting.rules', [...conditionalFormatting.rules, newRule]);
  };

  const handleDeleteRule = (ruleId: string) => {
    const newRules = conditionalFormatting.rules.filter(rule => rule.id !== ruleId);
    onOptionChange('conditionalFormatting.rules', newRules);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Enable Conditional Formatting</Label>
        <Switch
          checked={conditionalFormatting.enabled}
          onCheckedChange={(checked) => onOptionChange('conditionalFormatting.enabled', checked)}
        />
      </div>

      {conditionalFormatting.enabled && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Rules are applied in order. The first rule that matches will be used.
          </p>
          {conditionalFormatting.rules.map((rule) => (
            <div key={rule.id} className="p-3 space-y-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">If</span>
                <div className="flex-grow" />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteRule(rule.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={rule.target} onValueChange={(v: 'value' | 'name') => handleRuleChange(rule.id, 'target', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="name">Category</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={rule.operator} onValueChange={(v) => handleRuleChange(rule.id, 'operator', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">is greater than</SelectItem>
                    <SelectItem value="lt">is less than</SelectItem>
                    <SelectItem value="eq">is equal to</SelectItem>
                    <SelectItem value="neq">is not equal to</SelectItem>
                    <SelectItem value="between">is between</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type={rule.target === 'value' && rule.operator !== 'contains' ? 'number' : 'text'}
                  value={rule.value}
                  onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
                  placeholder="Value"
                />
                {rule.operator === 'between' && (
                  <Input
                    type="number"
                    value={rule.value2 || ''}
                    onChange={(e) => handleRuleChange(rule.id, 'value2', e.target.value)}
                    placeholder="and"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Then apply this format</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={rule.color}
                    onChange={(e) => handleRuleChange(rule.id, 'color', e.target.value)}
                    className="w-1/4"
                  />
                  <Input
                    type="text"
                    value={rule.text || ''}
                    onChange={(e) => handleRuleChange(rule.id, 'text', e.target.value)}
                    placeholder="Display text (optional)"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={handleAddRule}>
            Add Rule
          </Button>
        </div>
      )}
    </div>
  );
}