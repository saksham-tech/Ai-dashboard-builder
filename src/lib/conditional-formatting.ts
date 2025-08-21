import { type ConditionalFormattingRule } from '@/types/visualizations';

export const checkCondition = (targetValue: any, rule: ConditionalFormattingRule): boolean => {
  const val1 = rule.target === 'value' ? parseFloat(rule.value) : rule.value;
  const val2 = rule.target === 'value' ? parseFloat(rule.value2) : rule.value2;
  const target = rule.target === 'value' ? parseFloat(targetValue) : targetValue;

  if (rule.target === 'value' && isNaN(target)) return false;

  switch (rule.operator) {
    case 'gt': return target > val1;
    case 'lt': return target < val1;
    case 'eq': return String(target) === String(val1);
    case 'neq': return String(target) !== String(val1);
    case 'between': return !isNaN(val2) && target >= val1 && target <= val2;
    case 'contains': return String(target).toLowerCase().includes(String(val1).toLowerCase());
    default: return false;
  }
};