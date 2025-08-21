import { format, getQuarter } from 'date-fns';
import { type TransformedFieldDefinition, type TransformationType, type AggregationType } from "@/types/visualizations";
import { parseDate } from './date-parser';

const transformValue = (row: Record<string, any>, definition: TransformedFieldDefinition): any => {
  const { sourceField, transformation, value: customValue } = definition;
  const sourceValue = row[sourceField];

  switch (transformation) {
    // Date transformations
    case 'DAY_OF_WEEK': {
      const date = parseDate(sourceValue);
      return date ? format(date, 'eeee') : null;
    }
    case 'MONTH_NAME': {
      const date = parseDate(sourceValue);
      return date ? format(date, 'MMMM') : null;
    }
    case 'YEAR': {
      const date = parseDate(sourceValue);
      return date ? date.getUTCFullYear() : null;
    }
    case 'QUARTER': {
      const date = parseDate(sourceValue);
      return date ? `Q${getQuarter(date)}` : null;
    }
    case 'SLASH_TO_DASH_DATE': {
      const date = parseDate(sourceValue);
      if (date) {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (typeof sourceValue === 'string') {
        return sourceValue.replace(/\//g, '-');
      }
      return sourceValue;
    }
    // Number transformations
    case 'F_TO_C': {
      const num = parseFloat(sourceValue);
      return isNaN(num) ? null : (num - 32) * 5 / 9;
    }
    case 'C_TO_F': {
      const num = parseFloat(sourceValue);
      return isNaN(num) ? null : (num * 9 / 5) + 32;
    }
    // Text transformations
    case 'ADD_PREFIX':
      return customValue ? `${customValue}${sourceValue}` : sourceValue;
    case 'ADD_SUFFIX':
      return customValue ? `${sourceValue}${customValue}` : sourceValue;
    // Data type conversions
    case 'TO_WHOLE_NUMBER': {
      if (sourceValue === null || sourceValue === undefined) return null;
      const num = parseInt(String(sourceValue).replace(/[^0-9.-]/g, ''), 10);
      return isNaN(num) ? null : num;
    }
    case 'TO_DECIMAL': {
      if (sourceValue === null || sourceValue === undefined) return null;
      const num = parseFloat(String(sourceValue).replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    }
    case 'TO_TEXT': {
      return sourceValue === null || sourceValue === undefined ? null : String(sourceValue);
    }
    // Conditional Column
    case 'CONDITIONAL_COLUMN': {
      const {
        conditionalThenMode,
        conditionalThenField,
        conditionalThenValue,
        conditionalElseMode,
        conditionalElseField,
        conditionalElseValue,
        // legacy fields fallback
        excludeByCategoryField,
        excludeByCategoryValues,
      } = definition as any;

      const match = String(sourceValue) === customValue;

      if (match) {
        // THEN branch
        if (conditionalThenMode === 'column' && conditionalThenField) return row[conditionalThenField];
        if (conditionalThenMode === 'literal') return conditionalThenValue ?? null;
        // fallback to legacy: use excludeByCategoryField as THEN source column
        if (excludeByCategoryField) return row[excludeByCategoryField];
        return null;
      } else {
        // ELSE branch
        if (conditionalElseMode === 'column' && conditionalElseField) return row[conditionalElseField];
        if (conditionalElseMode === 'literal') return conditionalElseValue ?? null;
        // fallback legacy: use first excludeByCategoryValues entry as ELSE literal
        if (excludeByCategoryValues && excludeByCategoryValues.length > 0) return excludeByCategoryValues[0];
        return null;
      }
    }
    case 'FILTER_AND_COPY': {
      const { filterOnField, valuesToFilter } = definition;
      if (!filterOnField || !valuesToFilter || valuesToFilter.length === 0) {
        return sourceValue; // Not configured, just copy
      }
      const filterValue = row[filterOnField];
      if (valuesToFilter.includes(String(filterValue))) {
        return null; // Exclude this value by setting it to null
      }
      return sourceValue; // Keep this value
    }
    case 'INCLUDE_BY_CONDITION': {
      const { filterOnField, valuesToFilter: valuesToInclude } = definition;
      if (!filterOnField || !valuesToInclude || valuesToInclude.length === 0) {
        return null; // Not configured, so include nothing
      }
      const filterValue = row[filterOnField];
      if (valuesToInclude.includes(String(filterValue))) {
        return sourceValue; // Keep this value
      }
      return null; // Exclude this value by setting it to null
    }
    case 'AGGREGATE_BY': {
      // Handled in applyTransformations where we have dataset scope
      return null;
    }
    case 'COMBINE_WITH_LITERALS': {
      const parts = (definition as any).combineParts as Array<{ mode: 'column' | 'literal'; field?: string; value?: string; dateFormat?: any; timeFormat?: any }> | undefined;
      if (!parts || parts.length === 0) {
        console.log('No combineParts found, checking conditionalElseValue for legacy data:', (definition as any).conditionalElseValue);
        return null;
      }
      
      // Debug logging
      console.log('COMBINE_WITH_LITERALS debug:', {
        fieldName: definition.name,
        parts: parts,
        rowData: Object.keys(row).slice(0, 5), // Show first 5 column names
        sampleValues: parts.map(p => p.mode === 'column' && p.field ? `${p.field}=${row[p.field]}` : `literal="${p.value}"`).join(', ')
      });
      // Map parts to text, preserving literals; columns become formatted string or ''
      const texts: string[] = parts.map(p => {
        if (p.mode === 'column' && p.field) {
          const v = row[p.field];
          if (v === null || v === undefined) return '';
          const hasDateFmt = p.dateFormat && p.dateFormat !== 'default';
          const hasTimeFmt = p.timeFormat && p.timeFormat !== 'default';
          if (hasDateFmt || hasTimeFmt) {
            const d = parseDate(v, p.field);
            if (d) {
              let datePart = '';
              let timePart = '';
              if (hasDateFmt) {
                switch (p.dateFormat) {
                  case 'MMM D, YYYY': datePart = format(d, 'MMM d, yyyy'); break;
                  case 'YYYY-MM-DD': datePart = format(d, 'yyyy-MM-dd'); break;
                  case 'DayOfWeek': datePart = format(d, 'eeee'); break;
                  case 'MonthName': datePart = format(d, 'MMMM'); break;
                }
              }
              if (hasTimeFmt) {
                switch (p.timeFormat) {
                  case 'h:mm A': timePart = format(d, 'h:mm a'); break;
                  case 'HH:mm': timePart = format(d, 'HH:mm'); break;
                }
              }
              if (datePart && timePart) return `${datePart} ${timePart}`;
              if (datePart) return datePart;
              if (timePart) return timePart;
            }
          }
          return String(v);
        }
        if (p.mode === 'literal') {
          return p.value ?? '';
        }
        return '';
      }).map((text, i) => {
        const part = parts[i] as any;
        const after = ' '.repeat(part?.space ?? 0);
        return `${text}${after}`;
      });
      // Determine which indices are literals
      const isLiteral = parts.map(p => p.mode === 'literal');
      const hasAnyNonEmptyColumn = texts.some((t, i) => !isLiteral[i] && t.trim() !== '');
      // Keep a literal if there is non-empty text before OR after it (at least one side)
      const hasNonEmptyBefore: boolean[] = new Array(texts.length).fill(false);
      let seenNonEmpty = false;
      for (let i = 0; i < texts.length; i++) {
        hasNonEmptyBefore[i] = seenNonEmpty;
        if (texts[i] && texts[i].trim() !== '' && !isLiteral[i]) {
          seenNonEmpty = true;
        }
      }
      const hasNonEmptyAfter: boolean[] = new Array(texts.length).fill(false);
      seenNonEmpty = false;
      for (let i = texts.length - 1; i >= 0; i--) {
        hasNonEmptyAfter[i] = seenNonEmpty;
        if (texts[i] && texts[i].trim() !== '' && !isLiteral[i]) {
          seenNonEmpty = true;
        }
      }
      // If there is no non-empty column at all, keep literals as-is (literal-only output)
      if (!hasAnyNonEmptyColumn) {
        const onlyLiterals = texts.filter((_, i) => isLiteral[i]).join('').trim();
        return onlyLiterals === '' ? null : onlyLiterals;
      }

      const filtered: string[] = [];
      for (let i = 0; i < texts.length; i++) {
        if (isLiteral[i]) {
          if (hasNonEmptyBefore[i] || hasNonEmptyAfter[i]) {
            filtered.push(texts[i]);
          }
        } else {
          filtered.push(texts[i]);
        }
      }
      const result = filtered.join('').trim();
      return result === '' ? null : result;
    }
    default:
      return null;
  }
};

export const applyTransformations = (
  baseDataset: Record<string, any>[],
  definitions: TransformedFieldDefinition[]
): Record<string, any>[] => {
  if (definitions.length === 0) {
    return baseDataset;
  }

  // Pre-compute aggregation maps for AGGREGATE_BY definitions
  const aggregateDefs = definitions.filter(d => d.transformation === 'AGGREGATE_BY');
  const nonAggregateDefs = definitions.filter(d => d.transformation !== 'AGGREGATE_BY');

  const aggResults: Map<string, Map<string, number | null>> = new Map();

  const buildGroupKey = (row: Record<string, any>, fields: string[]): string => {
    const keyParts = fields.map(f => String(row[f]));
    return JSON.stringify(keyParts);
  };

  const computeAggregation = (agg: AggregationType, values: any[], distinctOn?: boolean): number | null => {
    if (agg === 'COUNT') return values.length;
    if (agg === 'COUNT_DISTINCT') {
      const set = new Set(values.map(v => String(v)));
      return set.size;
    }
    const nums = values
      .map(v => (typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, ''))))
      .filter(v => !isNaN(v));
    if (nums.length === 0) return null;
    switch (agg) {
      case 'SUM': return nums.reduce((a, b) => a + b, 0);
      case 'AVERAGE': return nums.reduce((a, b) => a + b, 0) / nums.length;
      case 'MAX': return Math.max(...nums);
      case 'MIN': return Math.min(...nums);
      default: return null;
    }
  };

  for (const def of aggregateDefs) {
    const groupFields = def.groupByFields || [];
    const agg = def.aggregation as AggregationType | undefined;
    if (!agg || groupFields.length === 0) continue;

    const groupMap: Map<string, any[]> = new Map();
    for (const row of baseDataset) {
      const key = buildGroupKey(row, groupFields);
      const arr = groupMap.get(key) || [];
      arr.push(row[def.sourceField]);
      groupMap.set(key, arr);
    }

    const resultMap: Map<string, number | null> = new Map();
    for (const [key, values] of groupMap.entries()) {
      resultMap.set(key, computeAggregation(agg, values));
    }
    aggResults.set(def.name, resultMap);
  }

  // Apply all transformations in one pass
  return baseDataset.map(row => {
    const newRow = { ...row };
    // Non-aggregate transforms first
    nonAggregateDefs.forEach(def => {
      if (def.transformation === 'COMBINE_WITH_LITERALS') {
        newRow[def.name] = transformValue(row, def);
      } else if (row[def.sourceField] !== undefined) {
        newRow[def.name] = transformValue(row, def);
      }
    });
    // Then aggregate transforms map from precomputed results
    for (const def of aggregateDefs) {
      const groupFields = def.groupByFields || [];
      const agg = def.aggregation as AggregationType | undefined;
      if (!agg || groupFields.length === 0) { newRow[def.name] = null; continue; }
      const key = JSON.stringify(groupFields.map(f => String(row[f])));
      const map = aggResults.get(def.name);
      newRow[def.name] = map ? map.get(key) ?? null : null;
    }
    return newRow;
  });
};