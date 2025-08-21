import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

import { type Visualization, type VisualizationOptions, type Dataset, type Relationship, type Parameter, type CalculatedFieldDefinition, type TransformedFieldDefinition, AggregationType } from "@/types/visualizations"
import { cn } from "@/lib/utils"
import { aggregateData, aggregateStackedData } from "@/lib/aggregation"
import { formatValue } from "@/lib/formatting";
import { FileQuestion, Image as ImageIcon, Copy } from 'lucide-react';
import { TextBoxVisual } from './visuals/text-box-visual';
import { SlicerVisual } from './visuals/slicer-visual';
import { ShapeVisual } from './visuals/shape-visual';
import { checkCondition } from "@/lib/conditional-formatting";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ActionButtonVisual } from './visuals/action-button-visual';
import { MatrixVisual } from './visuals/matrix-visual';
import { TableVisual } from './visuals/table-visual';
import { ParameterVisual } from './visuals/parameter-visual';
import { applyCalculations, resolveMeasureValue } from '@/lib/calculations';
import { applyTransformations } from '@/lib/transformations';

const applyOpacityToColor = (color: string, opacity: number): string => {
  if (!color) return 'transparent';
  if (opacity === 1 && !color.startsWith('rgba') && !color.startsWith('hsla')) return color;

  if (color.startsWith('rgba') || color.startsWith('hsla')) {
    return color.replace(/,([\d.]+)\)$/, `, ${opacity})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)) {
    let c: any = color.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    const r = (c >> 16) & 255;
    const g = (c >> 8) & 255;
    const b = c & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('hsl')) {
    return color.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
  }
  if (color === 'transparent') {
    return `rgba(0, 0, 0, 0)`;
  }
  return color;
};

interface VisualizationWrapperProps {
  visualization: Visualization;
  dataset: Record<string, any>[];
  allDatasets: Dataset[];
  finalDatasets: Dataset[];
  filteredDatasets: Map<string, Record<string, any>[]>;
  relationships: Relationship[];
  isSelected: boolean;
  onClick: (event: React.MouseEvent) => void;
  onUpdate: (props: Partial<Visualization>) => void;
  activeFilters: Record<string, { datasetId: string, values: Set<any> }>;
  onFilterChange: (datasetId: string, field: string, selectedValues: Set<any>) => void;
  isLocked: boolean;
  onCopy: () => void;
  openSlicerPopovers?: Record<string, boolean>;
  onSlicerPopoverToggle?: (vizId: string, isOpen: boolean) => void;
  isHidden: boolean;
  onToggleVisibility: (vizId: string) => void;
  zIndex: number;
  allMeasureFields: string[];
  staticMeasures: Record<string, string | number>;
  parameters?: Parameter[];
  parameterValues?: Record<string, any>;
  onParameterValueChange?: (parameterId: string, value: any) => void;
  calculatedFieldDefinitions: CalculatedFieldDefinition[];
  transformedFieldDefinitions: TransformedFieldDefinition[];
}

const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

const renderAsKpi = (viz: Visualization, value: any, category: string | null) => {
  const { options } = viz;
  const { card: cardOptions, conditionalFormatting, dataMapping } = options;
  if (!cardOptions) return null;

  const {
    valueFontSize, valueColor, valueFontWeight,
    showCategory, categoryFontSize, categoryColor, categoryFontWeight,
    textAlign, verticalAlign, spacing
  } = cardOptions;

  const finalValue = formatValue(value, dataMapping.valueKeyFormatting, parseCompositeKey(dataMapping.valueKey)?.field);
  const finalCategory = category ? formatValue(category, dataMapping.nameKeyFormatting, parseCompositeKey(dataMapping.nameKey)?.field) : null;

  let finalValueColor = valueColor;
  if (conditionalFormatting?.enabled && conditionalFormatting.rules.length > 0) {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numericValue)) {
      const matchingRule = conditionalFormatting.rules.find(rule => checkCondition(numericValue, { ...rule, target: 'value' }));
      if (matchingRule) {
        finalValueColor = matchingRule.color;
      }
    }
  }

  const verticalAlignClasses = {
    top: 'justify-start',
    middle: 'justify-center',
    bottom: 'justify-end',
  };

  const textAlignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <div className={cn("w-full h-full flex flex-col p-4", verticalAlignClasses[verticalAlign], textAlignClasses[textAlign])}>
      {showCategory && finalCategory && (
        <div
          className="truncate"
          style={{
            fontSize: `${categoryFontSize}px`,
            color: categoryColor,
            fontWeight: categoryFontWeight,
            marginBottom: `${spacing}px`,
          }}
        >
          {finalCategory}
        </div>
      )}
      <div
        className="truncate"
        style={{
          fontSize: `${valueFontSize}px`,
          color: finalValueColor,
          fontWeight: valueFontWeight,
          lineHeight: 1.2,
        }}
      >
        {finalValue}
      </div>
    </div>
  );
};

const getEchartsOption = (
  viz: Visualization, 
  dataset: Record<string, any>[],
  allDatasets: Dataset[],
  calculatedFieldDefinitions: CalculatedFieldDefinition[],
  parameters: Parameter[],
  parameterValues: Record<string, any>,
  staticMeasures: Record<string, string | number>
) => {
  const { options, type } = viz;
  const { title, legend, xAxis, yAxis, colors, dataLabels, dataMapping, chartSpecific, conditionalFormatting } = options;
  const { nameKey, valueKey, valueKeys, secondaryValueKey, valueKeyAggregation, nameKeyFormatting, valueKeyFormatting, sortOrder, sortBySeries, normalizeToPercent, denominatorKey, percentDecimals } = dataMapping as any;

  const parsedNameKey = parseCompositeKey(nameKey)?.field;
  const parsedValueKey = parseCompositeKey(valueKey)?.field;
  const parsedSecondaryValueKey = parseCompositeKey(secondaryValueKey)?.field;
  const parsedDenominatorKey = parseCompositeKey(denominatorKey || null)?.field;
  const parsedValueKeys = valueKeys.map(vk => ({ ...vk, field: parseCompositeKey(vk.field)?.field || vk.field }));

  const isStacked = ['StackedBar', 'StackedBarHorizontal'].includes(type as any);

  let processedData = isStacked
    ? (parsedNameKey && parsedValueKeys.length > 0 ? aggregateStackedData(dataset, parsedNameKey, parsedValueKeys, dataMapping.topN, sortOrder, sortBySeries) : [])
    : (parsedNameKey && parsedValueKey ? aggregateData(dataset, parsedNameKey, parsedValueKey, valueKeyAggregation, dataMapping.topN, sortOrder) : []);

  const toPercent = (val: number) => {
    const d = typeof percentDecimals === 'number' ? percentDecimals : 0;
    return Number.isFinite(val) ? parseFloat((val).toFixed(d)) : 0;
  };

  // Normalize stacked bars to 100%
  if (isStacked && normalizeToPercent && processedData.length > 0) {
    processedData = processedData.map(row => {
      const total = parsedValueKeys.reduce((sum, vk) => sum + (typeof row[vk.field] === 'number' ? row[vk.field] : 0), 0);
      if (total <= 0) return { ...row, ...Object.fromEntries(parsedValueKeys.map(vk => [vk.field, 0])) };
      const next: any = { ...row };
      parsedValueKeys.forEach(vk => {
        const v = typeof row[vk.field] === 'number' ? row[vk.field] : 0;
        next[vk.field] = toPercent((v / total) * 100);
      });
      return next;
    });
  }

  // For simple bars: convert to percentage using denominator per category
  const percentModeSimpleBar = !isStacked && normalizeToPercent && (type === 'Bar' || type === 'HorizontalBar');
  let denominatorByName: Record<string, number> = {};
  if (percentModeSimpleBar && parsedNameKey && parsedDenominatorKey) {
    const denomAgg = aggregateData(dataset, parsedNameKey, parsedDenominatorKey, 'SUM', dataMapping.topN, sortOrder);
    denominatorByName = Object.fromEntries(denomAgg.map(d => [String(d.name), (typeof d.value === 'number' ? d.value : 0)]));
    processedData = processedData.map(d => {
      const denom = denominatorByName[String(d.name)] ?? 0;
      const v = typeof d.value === 'number' ? d.value : 0;
      const pct = denom > 0 ? (v / denom) * 100 : 0;
      return { ...d, value: toPercent(pct) };
    });
  }

  const chartColors = [colors.primary, colors.secondary, 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))'];

  const dynamicYFontSize = Math.max(8, Math.min(14, Math.floor(viz.height / 25)));
  const dynamicXFontSize = Math.max(8, Math.min(14, Math.floor(viz.width / 40)));

  const baseOption = {
    title: {
      text: title.text,
      left: title.alignment,
      textStyle: { color: title.color, fontSize: title.fontSize, overflow: 'truncate', width: viz.width - 40 },
      show: false,
    },
    legend: {
      show: legend.show,
      orient: (legend.position === 'left' || legend.position === 'right') ? 'vertical' : 'horizontal',
      left: (legend.position === 'left' || legend.position === 'center') ? legend.position : 'auto',
      right: legend.position === 'right' ? 8 : 'auto',
      top: legend.position === 'top' ? 8 : 'auto',
      bottom: legend.position === 'bottom' ? 8 : 'auto',
      textStyle: { color: 'hsl(var(--foreground))' },
    },
    tooltip: {
      trigger: type === 'Pie' || type === 'Donut' ? 'item' : 'axis',
      backgroundColor: 'hsl(var(--card))',
      borderColor: 'hsl(var(--border))',
      textStyle: { color: 'hsl(var(--foreground))' },
      formatter: (params: any) => {
        const series = Array.isArray(params) ? params : [params];
        if (series.length === 0) return '';
        
        const category = formatValue(series[0].name, nameKeyFormatting, parsedNameKey || undefined);
        let tooltipText = `${category}<br/>`;

        series.forEach(s => {
          const seriesConfig = parsedValueKeys.find(vk => vk.field === s.seriesName);
          const formatting = seriesConfig?.formatting || valueKeyFormatting;
          const fieldName = s.seriesName || parsedValueKey;
          if ((isStacked && normalizeToPercent) || percentModeSimpleBar) {
            const d = typeof percentDecimals === 'number' ? percentDecimals : 0;
            tooltipText += `${s.marker} ${s.seriesName}: <strong>${Number(s.value).toFixed(d)}%</strong><br/>`;
          } else {
            tooltipText += `${s.marker} ${s.seriesName}: <strong>${formatValue(s.value, formatting, fieldName)}</strong><br/>`;
          }
        });
        return tooltipText;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    color: chartColors,
  };

  let series: any[] = [];

  const applyConditionalFormatting = (dataPoint: { name: any, value: any }, defaultColor: string) => {
    if (conditionalFormatting?.enabled && conditionalFormatting.rules.length > 0) {
      const matchingRule = conditionalFormatting.rules.find(rule => {
        const targetValue = rule.target === 'value' ? dataPoint.value : dataPoint.name;
        return checkCondition(targetValue, rule);
      });
      if (matchingRule) {
        return { color: matchingRule.color, text: matchingRule.text };
      }
    }
    return { color: defaultColor, text: null };
  };

  const seriesLabel = {
    show: dataLabels.show,
    color: dataLabels.color,
    fontSize: dataLabels.fontSize,
    position: 'top',
    formatter: (params: any) => {
      const dataPoint = params.data;
      if (conditionalFormatting?.enabled && conditionalFormatting.rules.length > 0) {
        const matchingRule = conditionalFormatting.rules.find(rule => {
          const targetValue = rule.target === 'value' ? dataPoint.value : dataPoint.name;
          return checkCondition(targetValue, rule);
        });
        if (matchingRule && matchingRule.text) {
          return matchingRule.text;
        }
      }
      if ((isStacked && normalizeToPercent) || percentModeSimpleBar) {
        const d = typeof percentDecimals === 'number' ? percentDecimals : 0;
        return `${Number(params.value).toFixed(d)}%`;
      }
      return formatValue(params.value, valueKeyFormatting, parsedValueKey || undefined);
    }
  };

  switch (type as any) {
    case 'StackedBar':
    case 'StackedBarHorizontal':
      const stackedBarLabel = { ...seriesLabel, position: 'inside' };
      series = parsedValueKeys.map((vk, index) => {
        const formatter = (params: any) => {
          const dataPoint = processedData[params.dataIndex];
          if (!dataPoint) return '';

          if (normalizeToPercent) {
            const currentValue = typeof params.value === 'number' ? params.value : 0;
            if (currentValue < 5) return '';
            const d = typeof percentDecimals === 'number' ? percentDecimals : 0;
            return `${currentValue.toFixed(d)}%`;
          } else {
            const total = parsedValueKeys.reduce((sum, keyConfig) => {
              const val = dataPoint[keyConfig.field];
              return sum + (typeof val === 'number' ? val : 0);
            }, 0);
            if (total === 0) return '';
            const currentValue = typeof params.value === 'number' ? params.value : 0;
            if ((currentValue / total) < 0.05) return '';
            return formatValue(currentValue, vk.formatting, vk.field);
          }
        };
        
        return {
          name: vk.field,
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          label: { ...stackedBarLabel, show: vk.showLabel ?? stackedBarLabel.show, formatter },
          barWidth: chartSpecific?.barWidth,
          itemStyle: {
            color: vk.color || chartColors[index % chartColors.length],
            borderRadius: vk.borderRadius,
            borderColor: vk.borderColor,
            opacity: vk.backgroundOpacity,
          },
          data: processedData.map(d => d[vk.field]),
        };
      });
      break;
    case 'Bar':
    case 'HorizontalBar':
      const barData = processedData.map(d => {
        const format = applyConditionalFormatting({ name: d.name, value: d.value }, colors.primary);
        return {
          value: d.value,
          name: d.name,
          itemStyle: {
            color: format.color,
            borderRadius: chartSpecific?.barBorderRadius,
          },
        };
      });
      series = [{ type: 'bar', data: barData, label: seriesLabel, barWidth: chartSpecific?.barWidth }];
      break;
    case 'Line':
      series = [{ name: parsedValueKey, type: 'line', data: processedData.map(d => d.value), label: seriesLabel, smooth: chartSpecific?.lineSmooth, symbolSize: chartSpecific?.symbolSize, showSymbol: chartSpecific?.showSymbol }];
      break;
    case 'Area':
      series = [{ name: parsedValueKey, type: 'line', areaStyle: {}, data: processedData.map(d => d.value), label: seriesLabel, smooth: chartSpecific?.lineSmooth, symbolSize: chartSpecific?.symbolSize, showSymbol: chartSpecific?.showSymbol }];
      break;
    case 'Pie':
    case 'Donut':
      const pieData = processedData.map((d, index) => {
        const format = applyConditionalFormatting({ name: d.name, value: d.value }, chartColors[index % chartColors.length]);
        return {
          ...d,
          itemStyle: {
            color: format.color,
            borderRadius: chartSpecific?.pieBorderRadius,
          },
        };
      });
      const radius = type === 'Pie' ? '70%' : ['40%', '70%'];
      series = [{ type: 'pie', data: pieData, radius, roseType: chartSpecific?.pieRoseType, label: { ...seriesLabel, position: 'outside' } }];
      break;
    case 'Scatter':
      series = [{ name: parsedValueKey, type: 'scatter', data: processedData.map(d => [d.name, d.value]) }];
      break;
    case 'Combo':
      series = [
        { name: parsedValueKey, type: 'bar', data: processedData.map(d => d.value), label: seriesLabel, itemStyle: { borderRadius: chartSpecific?.barBorderRadius }, barWidth: chartSpecific?.barWidth },
        { name: parsedSecondaryValueKey, type: 'line', data: dataset.map(d => d[parsedSecondaryValueKey || '']), smooth: chartSpecific?.lineSmooth, symbolSize: chartSpecific?.symbolSize, showSymbol: chartSpecific?.showSymbol }
      ];
      break;
    case 'StackedArea':
      series = [
        { name: parsedValueKey, type: 'line', stack: 'total', areaStyle: {}, emphasis: { focus: 'series' }, data: processedData.map(d => d.value), smooth: chartSpecific?.lineSmooth },
        { name: parsedSecondaryValueKey, type: 'line', stack: 'total', areaStyle: {}, emphasis: { focus: 'series' }, data: dataset.map(d => d[parsedSecondaryValueKey || '']), smooth: chartSpecific?.lineSmooth }
      ];
      break;
    case 'Gauge': {
      const { gauge: gaugeOptions } = options;
      if (!gaugeOptions) return {};

      const { gaugeMinValueKey, gaugeMaxValueKey, gaugeTargetValueKey, valueKeyAggregation, gaugeMinValueAggregation, gaugeMaxValueAggregation, gaugeTargetValueAggregation } = dataMapping;

      const getSingleAggregatedValue = (data: Record<string, any>[], field: string | undefined, aggregation: AggregationType): number | null => {
          if (!field || data.length === 0) return null;
          const allValues = data.map(row => row[field]);
          const numericValues = allValues.map(v => {
              if (typeof v === 'number') return v;
              if (typeof v === 'string') {
                  const num = parseFloat(v.replace(/[^0-9.-]/g, ''));
                  return isNaN(num) ? null : num;
              }
              return null;
          }).filter((v): v is number => v !== null);

          if (numericValues.length === 0) return null;

          let effectiveAggregation = aggregation;
          if (aggregation === 'NONE' && numericValues.length > 1) {
              effectiveAggregation = 'SUM';
          }

          switch (effectiveAggregation) {
              case 'SUM': return numericValues.reduce((a, b) => a + b, 0);
              case 'AVERAGE': return numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
              case 'COUNT': return allValues.length;
              case 'COUNT_DISTINCT': return new Set(allValues).size;
              case 'MAX': return Math.max(...numericValues);
              case 'MIN': return Math.min(...numericValues);
              case 'NONE': return numericValues[0];
              default: return null;
          }
      };

      const resolveGaugeField = (fieldKey: string | null, aggregation: AggregationType): number | null => {
          const parsedKey = parseCompositeKey(fieldKey);
          if (!parsedKey) return null;

          const allDatasetFields = new Set(allDatasets.flatMap(ds => ds.fields));
          const measureValue = resolveMeasureValue(
              parsedKey.field,
              calculatedFieldDefinitions,
              parameters,
              parameterValues,
              staticMeasures,
              allDatasetFields
          );

          if (measureValue !== null) {
              return measureValue;
          }
          
          return getSingleAggregatedValue(dataset, parsedKey.field, aggregation);
      };

      const gaugeValue = resolveGaugeField(valueKey, valueKeyAggregation) ?? 0;
      const minValue = resolveGaugeField(gaugeMinValueKey, gaugeMinValueAggregation || 'SUM') ?? gaugeOptions.min;
      const maxValue = resolveGaugeField(gaugeMaxValueKey, gaugeMaxValueAggregation || 'SUM') ?? gaugeOptions.max;
      const targetValue = resolveGaugeField(gaugeTargetValueKey, gaugeTargetValueAggregation || 'SUM');

      const series = [{
        type: 'gauge',
        min: minValue,
        max: maxValue,
        startAngle: gaugeOptions.startAngle,
        endAngle: gaugeOptions.endAngle,
        splitNumber: gaugeOptions.splitNumber,
        radius: `${gaugeOptions.radius || 75}%`,
        axisLine: {
          lineStyle: {
            width: 10,
            color: gaugeOptions.axisLineColor,
          },
        },
        pointer: {
          show: false,
        },
        axisTick: {
          distance: -10,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        splitLine: {
          distance: -10,
          length: 10,
          lineStyle: {
            color: '#fff',
            width: 4
          }
        },
        axisLabel: {
          color: 'auto',
          distance: 15,
          fontSize: 12
        },
        progress: {
          show: gaugeOptions.showProgress,
          width: 10,
          itemStyle: {
            color: gaugeOptions.progressColor || 'auto'
          }
        },
        detail: {
          valueAnimation: true,
          formatter: gaugeOptions.detailFormatter,
          color: gaugeOptions.detailStyle?.color || 'auto',
          fontSize: gaugeOptions.detailStyle?.fontSize || Math.min(24, viz.width / 8),
          fontWeight: gaugeOptions.detailStyle?.fontWeight || 'bold',
          offsetCenter: [0, '0%']
        },
        data: [{
          value: gaugeValue,
          name: title.text
        }]
      }];

      if (gaugeOptions.showTarget && targetValue !== null && targetValue !== undefined) {
        series.push({
          type: 'gauge',
          min: minValue,
          max: maxValue,
          startAngle: gaugeOptions.startAngle,
          endAngle: gaugeOptions.endAngle,
          radius: '75%',
          pointer: {
            show: true,
            icon: 'rect',
            width: 2,
            length: 12,
            offsetCenter: [0, '-60%'],
            itemStyle: {
              color: gaugeOptions.targetColor || '#ff4d4f'
            }
          },
          progress: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: { show: false },
          data: [{ value: targetValue }],
        } as any);
      }

      return { ...baseOption, series };
    }
  }

  let xAxisConfig, yAxisConfig;
  const percentFormatter = (val: any) => {
    const d = typeof percentDecimals === 'number' ? percentDecimals : 0;
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (!Number.isFinite(num)) return '';
    return `${num.toFixed(d)}%`;
  };
  const categoryFormatter = (val: any) => formatValue(val, nameKeyFormatting, parsedNameKey || undefined, true);
  const valueAxisFormatter = (val: any) => {
    const showPercent = (isStacked && normalizeToPercent) || percentModeSimpleBar;
    if (showPercent) return percentFormatter(val);
    return formatValue(val, valueKeyFormatting, parsedValueKey || undefined, true);
  };

  if ((type as any) === 'StackedBarHorizontal' || type === 'HorizontalBar') {
      xAxisConfig = { show: xAxis.show, type: 'value', max: ((isStacked && normalizeToPercent) || (percentModeSimpleBar && type === 'HorizontalBar')) ? 100 : undefined, axisLabel: { color: xAxis.color, fontSize: dynamicXFontSize, formatter: valueAxisFormatter }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: xAxis.showGrid, lineStyle: { color: 'hsl(var(--border))' } } };
      yAxisConfig = { show: yAxis.show, type: 'category', data: processedData.map(d => String(d.name)), axisLabel: { color: yAxis.color, fontSize: dynamicYFontSize, formatter: categoryFormatter }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: yAxis.showGrid, lineStyle: { color: 'hsl(var(--border))' } } };
  } else {
      xAxisConfig = { show: xAxis.show, type: 'category', data: processedData.map(d => String(d.name)), axisLabel: { color: xAxis.color, interval: 0, rotate: processedData.length > 10 ? 30 : 0, fontSize: dynamicXFontSize, formatter: categoryFormatter }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: xAxis.showGrid, lineStyle: { color: 'hsl(var(--border))' } } };
      yAxisConfig = { show: yAxis.show, type: 'value', max: ((isStacked && normalizeToPercent) || (percentModeSimpleBar && type === 'Bar')) ? 100 : undefined, axisLabel: { color: yAxis.color, fontSize: dynamicYFontSize, formatter: valueAxisFormatter }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: yAxis.showGrid, lineStyle: { color: 'hsl(var(--border))' } } };
  }

  if (type === 'Pie' || type === 'Donut') {
    return { ...baseOption, series };
  }

  return { ...baseOption, xAxis: xAxisConfig, yAxis: yAxisConfig, series };
};

const renderChart = (
  viz: Visualization,
  dataset: Record<string, any>[],
  allDatasets: Dataset[],
  finalDatasets: Dataset[],
  filteredDatasets: Map<string, Record<string, any>[]>,
  relationships: Relationship[],
  onUpdate: (props: Partial<Visualization>) => void,
  echartsOption: any,
  activeFilters: Record<string, { datasetId: string, values: Set<any> }>,
  onFilterChange: (datasetId: string, field: string, selectedValues: Set<any>) => void,
  openSlicerPopovers?: Record<string, boolean>,
  onSlicerPopoverToggle?: (vizId: string, isOpen: boolean) => void,
  onToggleVisibility?: (vizId: string) => void,
  allMeasureFields?: string[],
  staticMeasures?: Record<string, string | number>,
  parameters?: Parameter[],
  parameterValues?: Record<string, any>,
  onParameterValueChange?: (parameterId: string, value: any) => void,
  calculatedFieldDefinitions?: CalculatedFieldDefinition[],
  joinedDatasetArg?: Record<string, any>[],
  filteredJoinedForSlicerArg?: Record<string, any>[]
) => {
  const { options, type } = viz;
  const { dataMapping } = options;
  const { nameKey, valueKey, valueKeys, valueKeyAggregation } = dataMapping;

  const isSimpleChart = !['Card', 'TextBox', 'Image', 'Slicer', 'StackedBar', 'StackedBarHorizontal', 'Shape', 'ActionButton', 'Matrix', 'Table', 'Parameter', 'Gauge'].includes(type);
  const isStackedChart = ['StackedBar', 'StackedBarHorizontal'].includes(type);

  if (isSimpleChart && (!nameKey || !valueKey)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <FileQuestion className="w-10 h-10 mb-2" />
        <p className="text-sm">Please drag fields to 'X-Axis' and 'Y-Axis' to build your chart.</p>
      </div>
    );
  }

  if (isStackedChart && (!nameKey || valueKeys.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <FileQuestion className="w-10 h-10 mb-2" />
        <p className="text-sm">Please select a category field and at least one value field.</p>
      </div>
    );
  }

  if (type === 'Gauge' && !valueKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <FileQuestion className="w-10 h-10 mb-2" />
        <p className="text-sm">Please drag a field to 'Value' to build your gauge.</p>
      </div>
    );
  }

  switch (viz.type) {
    case 'Card': {
      let displayValue: any = "N/A";
      let categoryLabel: string | null = null;
      const parsedValueKey = parseCompositeKey(valueKey);
      const parsedNameKey = parseCompositeKey(nameKey);

      if (parsedValueKey) {
        const allDatasetFields = new Set(allDatasets.flatMap(ds => ds.fields));
        const measureValue = resolveMeasureValue(
          parsedValueKey.field,
          calculatedFieldDefinitions || [],
          parameters || [],
          parameterValues || {},
          staticMeasures || {},
          allDatasetFields
        );

        if (measureValue !== null) {
          displayValue = measureValue;
        } else if (dataset.length > 0) {
          const allValues = dataset.map(row => row[parsedValueKey.field]);
          
          const getNumericValue = (v: any): number | null => {
              if (v === null || v === undefined) return null;
              if (typeof v === 'number') return v;
              if (typeof v !== 'string' || v.trim() === '') return null;
              let str = v.trim().replace(/[\s$€£¥]/g, '');
              const hasComma = str.includes(',');
              const hasPeriod = str.includes('.');
              if (hasComma && hasPeriod && str.lastIndexOf('.') < str.lastIndexOf(',')) {
                  str = str.replace(/\./g, '').replace(',', '.');
              } else if (hasComma) {
                  str = str.replace(/,/g, '');
              }
              if (str === '') return null;
              const num = Number(str);
              return isNaN(num) ? null : num;
          };

          const numericValues = allValues.map(getNumericValue).filter((v): v is number => v !== null);

          let effectiveAggregation = valueKeyAggregation;
          if (effectiveAggregation === 'NONE' && dataset.length > 1) {
              effectiveAggregation = 'SUM';
          }

          switch (effectiveAggregation) {
            case 'SUM':
              displayValue = numericValues.reduce((sum, val) => sum + val, 0);
              break;
            case 'AVERAGE':
              displayValue = numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
              break;
            case 'COUNT':
              displayValue = allValues.filter(v => v !== null && v !== undefined && v !== '').length;
              break;
            case 'COUNT_DISTINCT':
              displayValue = new Set(allValues.filter(v => v !== null && v !== undefined && v !== '')).size;
              break;
            case 'NONE':
              const firstValidValue = allValues.find(v => v !== null && v !== undefined && v !== '');
              displayValue = firstValidValue !== undefined ? firstValidValue : "N/A";
              break;
            default:
              displayValue = "N/A";
          }
        }
      }

      if (parsedNameKey?.field && dataset.length > 0) {
        categoryLabel = dataset[0][parsedNameKey.field];
      }
      
      return renderAsKpi(viz, displayValue, categoryLabel);
    }
    case 'TextBox':
      return <TextBoxVisual visualization={viz} onUpdate={onUpdate} />;
    case 'Image': {
      const { image: imageOptions } = options;
      if (!imageOptions) return null;

      const { src, dataField, objectFit, width, height, verticalAlign, horizontalAlign } = imageOptions;
      let imageUrl = src;

      if (dataField && dataset.length > 0) {
        imageUrl = dataset[0][dataField];
      }

      if (!imageUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <ImageIcon className="w-10 h-10 mb-2" />
            <p className="text-sm">
              {dataField ? "No image URL in data" : "Upload an image or select a data field"}
            </p>
          </div>
        );
      }

      const verticalAlignClasses = {
        top: 'items-start',
        middle: 'items-center',
        bottom: 'items-end',
      };
    
      const horizontalAlignClasses = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      };

      return (
        <div className={cn(
          "w-full h-full flex",
          verticalAlignClasses[verticalAlign || 'middle'],
          horizontalAlignClasses[horizontalAlign || 'center']
        )}>
          <img 
            src={imageUrl} 
            alt={options.title.text} 
            style={{ 
              objectFit,
              width: width || '100%',
              height: height || '100%',
            }} 
          />
        </div>
      );
    }
    case 'Slicer':
      const slicerData = joinedDatasetArg || (allDatasets.find(d => d.id === viz.datasetId)?.data || []);
      return <SlicerVisual 
        visualization={viz} 
        dataset={slicerData} 
        filteredDataset={filteredJoinedForSlicerArg}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange} 
        isOpen={openSlicerPopovers?.[viz.id] || false}
        onToggle={(isOpen) => onSlicerPopoverToggle?.(viz.id, isOpen)}
      />;
    case 'Shape':
      return <ShapeVisual visualization={viz} dataset={dataset} />;
    case 'ActionButton':
      return <ActionButtonVisual visualization={viz} onToggleVisibility={onToggleVisibility || (() => {})} />;
    case 'Matrix':
      return <MatrixVisual visualization={viz} finalDatasets={finalDatasets} filteredDatasets={filteredDatasets} relationships={relationships} />;
    case 'Table':
      return <TableVisual visualization={viz} finalDatasets={finalDatasets} filteredDatasets={filteredDatasets} relationships={relationships} allMeasureFields={allMeasureFields || []} activeFilters={activeFilters} handleFilterChange={onFilterChange} />;
    case 'Parameter': {
      if (!viz.parameterId) return null;
      const parameter = parameters?.find(p => p.id === viz.parameterId);
      if (!parameter) return null;
      const value = parameterValues?.[viz.parameterId];
      return <ParameterVisual parameter={parameter} value={value} onValueChange={(newValue) => onParameterValueChange?.(viz.parameterId!, newValue)} />;
    }
    default:
      return <ReactECharts option={echartsOption} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />;
  }
};

export function VisualizationWrapper({ visualization, dataset, allDatasets, finalDatasets, filteredDatasets, relationships, isSelected, onClick, onUpdate, activeFilters, onFilterChange, isLocked, onCopy, openSlicerPopovers, onSlicerPopoverToggle, isHidden, onToggleVisibility, zIndex, allMeasureFields, staticMeasures, parameters, parameterValues, onParameterValueChange, calculatedFieldDefinitions, transformedFieldDefinitions }: VisualizationWrapperProps) {
  const { options, type } = visualization;
  const { general, title } = options;

  const shadowClasses = { none: '', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg', xl: 'shadow-xl' };
  const backgroundColorWithOpacity = applyOpacityToColor(general.backgroundColor, general.backgroundOpacity ?? 1);

  const isChart = !['Card', 'TextBox', 'Image', 'Slicer', 'Shape', 'ActionButton', 'Matrix', 'Table', 'Parameter'].includes(type);

  const joinedDataset = useMemo(() => {
    // Table visual performs its own join logic; skip here to avoid misleading warnings
    if (visualization?.type === 'Table') {
      const baseId = visualization.datasetId;
      if (!baseId) return dataset;
      return finalDatasets.find(d => d.id === baseId)?.data || dataset;
    }
    const { dataMapping } = visualization.options;
    const { nameKey, valueKey, valueKeys, secondaryValueKey, slicerKey } = dataMapping as any;

    const requiredDatasetIds = new Set<string>();
    if (visualization.datasetId) {
        requiredDatasetIds.add(visualization.datasetId);
    }
    const keys = [nameKey, valueKey, secondaryValueKey, slicerKey, ...valueKeys.map(vk => vk.field)];
    keys.forEach(key => {
        const parsed = parseCompositeKey(key);
        if (parsed && parsed.datasetId !== 'calculated' && parsed.datasetId !== 'static' && parsed.datasetId !== 'parameter') {
            requiredDatasetIds.add(parsed.datasetId);
        }
    });

    // If slicer, also consider slicer text fields and image field
    if (visualization.type === 'Slicer') {
        const slicer = (visualization.options as any).slicer;
        if (slicer) {
            const textFields: string[] = Array.isArray(slicer.texts) ? slicer.texts.map((t: any) => t.field) : [];
            const imageField: string | null = slicer.image?.field || null;
            [...textFields, imageField].forEach(key => {
                const parsed = parseCompositeKey(key);
                if (parsed && parsed.datasetId !== 'calculated' && parsed.datasetId !== 'static' && parsed.datasetId !== 'parameter') {
                    requiredDatasetIds.add(parsed.datasetId);
                }
            });
        }
    }

    if (requiredDatasetIds.size <= 1) {
        return dataset;
    }

    const baseTableId = visualization.datasetId;
    if (!baseTableId) {
        return dataset;
    }

    let joinedData = [...(filteredDatasets.get(baseTableId) || [])];
    const tablesToJoin = new Set(requiredDatasetIds);
    tablesToJoin.delete(baseTableId);
    const joinedTables = new Set([baseTableId]);

    let joinedSomething = true;
    while (tablesToJoin.size > 0 && joinedSomething) {
        joinedSomething = false;
        for (const tableIdToJoin of tablesToJoin) {
            const rel = relationships.find(r => {
                const fromJoined = joinedTables.has(r.fromTable);
                const toJoined = joinedTables.has(r.toTable);
                const fromIsTarget = r.fromTable === tableIdToJoin;
                const toIsTarget = r.toTable === tableIdToJoin;
                return (fromJoined && toIsTarget) || (toJoined && fromIsTarget);
            });

            if (rel) {
                const otherData = filteredDatasets.get(tableIdToJoin);
                if (!otherData) continue;

                const isFromJoined = joinedTables.has(rel.fromTable);
                const baseJoinKey = isFromJoined ? rel.fromColumn : rel.toColumn;
                const otherJoinKey = isFromJoined ? rel.toColumn : rel.fromColumn;

                const otherDataMap = new Map<string, Record<string, any>[]>();
                for (const row of otherData) {
                    const key = String(row[otherJoinKey]);
                    if (!otherDataMap.has(key)) {
                        otherDataMap.set(key, []);
                    }
                    otherDataMap.get(key)!.push(row);
                }

                const otherTable = finalDatasets.find(ds => ds.id === tableIdToJoin);
                const otherFields = otherTable ? otherTable.fields : [];
                const nullsForOtherTable = otherFields.reduce((acc, field) => {
                    acc[field] = null;
                    return acc;
                }, {} as Record<string, null>);

                joinedData = joinedData.flatMap(baseRow => {
                    const joinValue = String(baseRow[baseJoinKey]);
                    const otherRows = otherDataMap.get(joinValue);
                    if (otherRows && otherRows.length > 0) {
                        return otherRows.map(otherRow => ({ ...baseRow, ...otherRow }));
                    }
                    return [{ ...baseRow, ...nullsForOtherTable }];
                });

                tablesToJoin.delete(tableIdToJoin);
                joinedTables.add(tableIdToJoin);
                joinedSomething = true;
                break;
            }
        }
    }

    if (tablesToJoin.size > 0) {
        console.warn("Could not join all required tables for visualization:", visualization.id, "Unjoined:", Array.from(tablesToJoin));
    }

    return joinedData;
  }, [visualization, dataset, filteredDatasets, relationships, finalDatasets]);

  // Build an UNFILTERED joined dataset for slicers so items don't disappear on selection
  const unfilteredJoinedForSlicer = useMemo(() => {
    if (!visualization || visualization.type !== 'Slicer') return dataset;

    const { dataMapping } = visualization.options;
    const { nameKey, valueKey, valueKeys, secondaryValueKey, slicerKey } = dataMapping as any;
    const selectedDatasetId = parseCompositeKey(slicerKey)?.datasetId || null;

    const requiredDatasetIds = new Set<string>();
    if (visualization.datasetId) {
      requiredDatasetIds.add(visualization.datasetId);
    }
    const keys = [nameKey, valueKey, secondaryValueKey, slicerKey, ...valueKeys.map((vk: any) => vk.field)];
    keys.forEach(key => {
      const parsed = parseCompositeKey(key);
      if (parsed && parsed.datasetId !== 'calculated' && parsed.datasetId !== 'static' && parsed.datasetId !== 'parameter') {
        requiredDatasetIds.add(parsed.datasetId);
      }
    });

    const slicer = (visualization.options as any).slicer;
    if (slicer) {
      const textFields: string[] = Array.isArray(slicer.texts) ? slicer.texts.map((t: any) => t.field) : [];
      const imageField: string | null = slicer.image?.field || null;
      [...textFields, imageField].forEach(key => {
        const parsed = parseCompositeKey(key);
        if (parsed && parsed.datasetId !== 'calculated' && parsed.datasetId !== 'static' && parsed.datasetId !== 'parameter') {
          requiredDatasetIds.add(parsed.datasetId);
        }
      });
    }

    if (requiredDatasetIds.size <= 1) {
      const baseId = visualization.datasetId;
      if (!baseId) return dataset;
      return finalDatasets.find(d => d.id === baseId)?.data || dataset;
    }

    const baseTableId = visualization.datasetId;
    if (!baseTableId) return dataset;

    const mapAll = new Map<string, Record<string, any>[]>();
    for (const ds of finalDatasets) {
      mapAll.set(ds.id, ds.data);
    }

    let joinedData = [...(mapAll.get(baseTableId) || [])];
    const tablesToJoin = new Set(requiredDatasetIds);
    tablesToJoin.delete(baseTableId);
    const joinedTables = new Set([baseTableId]);

    let joinedSomething = true;
    while (tablesToJoin.size > 0 && joinedSomething) {
      joinedSomething = false;
      for (const tableIdToJoin of tablesToJoin) {
        const rel = relationships.find(r => {
          const fromJoined = joinedTables.has(r.fromTable);
          const toJoined = joinedTables.has(r.toTable);
          const fromIsTarget = r.fromTable === tableIdToJoin;
          const toIsTarget = r.toTable === tableIdToJoin;
          return (fromJoined && toIsTarget) || (toJoined && fromIsTarget);
        });

        if (rel) {
          const otherData = mapAll.get(tableIdToJoin);
          if (!otherData) continue;

          const isFromJoined = joinedTables.has(rel.fromTable);
          const baseJoinKey = isFromJoined ? rel.fromColumn : rel.toColumn;
          const otherJoinKey = isFromJoined ? rel.toColumn : rel.fromColumn;

          const otherDataMap = new Map<string, Record<string, any>[]>();
          for (const row of otherData) {
            const key = String(row[otherJoinKey]);
            if (!otherDataMap.has(key)) {
              otherDataMap.set(key, []);
            }
            otherDataMap.get(key)!.push(row);
          }

          const otherTable = finalDatasets.find(ds => ds.id === tableIdToJoin);
          const otherFields = otherTable ? otherTable.fields : [];
          const nullsForOtherTable = otherFields.reduce((acc, field) => {
            (acc as any)[field] = null;
            return acc;
          }, {} as Record<string, null>);

          joinedData = joinedData.flatMap(baseRow => {
            const joinValue = String(baseRow[baseJoinKey]);
            const otherRows = otherDataMap.get(joinValue);
            if (otherRows && otherRows.length > 0) {
              return otherRows.map(otherRow => {
                // Ensure fields from selectedDatasetId win in case of name collisions
                if (selectedDatasetId) {
                  const otherIsSelected = tableIdToJoin === selectedDatasetId;
                  const baseContainsSelected = joinedTables.has(selectedDatasetId);
                  if (otherIsSelected) {
                    return { ...baseRow, ...otherRow };
                  }
                  if (baseContainsSelected) {
                    return { ...otherRow, ...baseRow };
                  }
                }
                return { ...baseRow, ...otherRow };
              });
            }
            return [{ ...baseRow, ...nullsForOtherTable }];
          });

          tablesToJoin.delete(tableIdToJoin);
          joinedTables.add(tableIdToJoin);
          joinedSomething = true;
          break;
        }
      }
    }

    return joinedData;
  }, [visualization, dataset, finalDatasets, relationships]);

  // Build a FILTERED joined dataset for slicers using filteredDatasets to reflect other filters dynamically
  const filteredJoinedForSlicer = useMemo(() => {
    if (!visualization || visualization.type !== 'Slicer') return dataset;

    const { dataMapping } = visualization.options;
    const { nameKey, valueKey, valueKeys, secondaryValueKey, slicerKey } = dataMapping as any;
    const selectedDatasetId = parseCompositeKey(slicerKey)?.datasetId || null;

    const requiredDatasetIds = new Set<string>();
    if (visualization.datasetId) {
      requiredDatasetIds.add(visualization.datasetId);
    }
    const keys = [nameKey, valueKey, secondaryValueKey, slicerKey, ...valueKeys.map((vk: any) => vk.field)];
    keys.forEach(key => {
      const parsed = parseCompositeKey(key);
      if (parsed && parsed.datasetId !== 'calculated' && parsed.datasetId !== 'static' && parsed.datasetId !== 'parameter') {
        requiredDatasetIds.add(parsed.datasetId);
      }
    });

    const slicer = (visualization.options as any).slicer;
    if (slicer) {
      const textFields: string[] = Array.isArray(slicer.texts) ? slicer.texts.map((t: any) => t.field) : [];
      const imageField: string | null = slicer.image?.field || null;
      [...textFields, imageField].forEach(key => {
        const parsed = parseCompositeKey(key);
        if (parsed && parsed.datasetId !== 'calculated' && parsed.datasetId !== 'static' && parsed.datasetId !== 'parameter') {
          requiredDatasetIds.add(parsed.datasetId);
        }
      });
    }

    if (requiredDatasetIds.size <= 1) {
      const baseId = visualization.datasetId;
      if (!baseId) return dataset;
      return filteredDatasets.get(baseId) || dataset;
    }

    const baseTableId = visualization.datasetId;
    if (!baseTableId) return dataset;

    const mapAll = new Map<string, Record<string, any>[]>();
    for (const dsId of requiredDatasetIds) {
      const filtered = filteredDatasets.get(dsId);
      if (filtered) mapAll.set(dsId, filtered);
    }

    let joinedData = [...(mapAll.get(baseTableId) || [])];
    const tablesToJoin = new Set(requiredDatasetIds);
    tablesToJoin.delete(baseTableId);
    const joinedTables = new Set([baseTableId]);

    let joinedSomething = true;
    while (tablesToJoin.size > 0 && joinedSomething) {
      joinedSomething = false;
      for (const tableIdToJoin of tablesToJoin) {
        const rel = relationships.find(r => {
          const fromJoined = joinedTables.has(r.fromTable);
          const toJoined = joinedTables.has(r.toTable);
          const fromIsTarget = r.fromTable === tableIdToJoin;
          const toIsTarget = r.toTable === tableIdToJoin;
          return (fromJoined && toIsTarget) || (toJoined && fromIsTarget);
        });

        if (rel) {
          const otherData = mapAll.get(tableIdToJoin);
          if (!otherData) continue;

          const isFromJoined = joinedTables.has(rel.fromTable);
          const baseJoinKey = isFromJoined ? rel.fromColumn : rel.toColumn;
          const otherJoinKey = isFromJoined ? rel.toColumn : rel.fromColumn;

          const otherDataMap = new Map<string, Record<string, any>[]>();
          for (const row of otherData) {
            const key = String(row[otherJoinKey]);
            if (!otherDataMap.has(key)) {
              otherDataMap.set(key, []);
            }
            otherDataMap.get(key)!.push(row);
          }

          joinedData = joinedData.flatMap(baseRow => {
            const joinValue = String(baseRow[baseJoinKey]);
            const otherRows = otherDataMap.get(joinValue);
            if (otherRows && otherRows.length > 0) {
              return otherRows.map(otherRow => {
                // Ensure fields from selectedDatasetId win in case of name collisions
                if (selectedDatasetId) {
                  const otherIsSelected = tableIdToJoin === selectedDatasetId;
                  const baseContainsSelected = joinedTables.has(selectedDatasetId);
                  if (otherIsSelected) {
                    return { ...baseRow, ...otherRow };
                  }
                  if (baseContainsSelected) {
                    return { ...otherRow, ...baseRow };
                  }
                }
                return { ...baseRow, ...otherRow };
              });
            }
            return [] as Record<string, any>[]; // filtered join: drop non-matching rows
          });

          tablesToJoin.delete(tableIdToJoin);
          joinedTables.add(tableIdToJoin);
          joinedSomething = true;
          break;
        }
      }
    }

    return joinedData;
  }, [visualization, dataset, filteredDatasets, relationships]);

  const finalComputedDataset = useMemo(() => {
    if (!visualization) return joinedDataset;
    
    const { dataMapping } = visualization.options;
    const keys = [dataMapping.nameKey, dataMapping.valueKey, dataMapping.secondaryValueKey, ...dataMapping.valueKeys.map(vk => vk.field)];
    const requiredMeasureNames = new Set(
      keys
        .map(k => parseCompositeKey(k)?.field)
        .filter((f): f is string => !!f && allMeasureFields.includes(f))
    );

    if (requiredMeasureNames.size === 0) return joinedDataset;

    const requiredCalcDefs = calculatedFieldDefinitions.filter(def => requiredMeasureNames.has(def.name));
    const requiredTransformDefs = transformedFieldDefinitions.filter(def => requiredMeasureNames.has(def.name));

    let data = [...joinedDataset];
    if (requiredTransformDefs.length > 0) {
      data = applyTransformations(data, requiredTransformDefs);
    }
    if (requiredCalcDefs.length > 0) {
      data = applyCalculations(data, requiredCalcDefs, parameters, parameterValues);
    }
    
    return data;
  }, [joinedDataset, visualization, allMeasureFields, calculatedFieldDefinitions, transformedFieldDefinitions, parameters, parameterValues]);

  const echartsOption = useMemo(() => {
    if (!isChart) return null;
    return getEchartsOption(
      visualization, 
      finalComputedDataset,
      allDatasets,
      calculatedFieldDefinitions,
      parameters || [],
      parameterValues || {},
      staticMeasures
    );
  }, [isChart, visualization, finalComputedDataset, allDatasets, calculatedFieldDefinitions, parameters, parameterValues, staticMeasures]);

  return (
    <Draggable
      position={{ x: visualization.x, y: visualization.y }}
      onStop={(e, data) => onUpdate({ x: data.x, y: data.y })}
      bounds="parent"
      disabled={isLocked}
      cancel=".react-resizable-handle, button, textarea, .echarts-for-react, [data-radix-popper-content-wrapper], .slicer-item"
    >
      <ResizableBox
        width={visualization.width}
        height={visualization.height}
        onResizeStop={(e, data) => onUpdate({ width: data.size.width, height: data.size.height })}
        className={cn(
          "rounded-lg transition-shadow transform-gpu",
          !isLocked && "cursor-move",
          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-glow is-selected" : "hover:shadow-lg",
          general.boxShadow !== 'none' && shadowClasses[general.boxShadow],
          isHidden && "hidden"
        )}
        style={{ 
          position: 'absolute', 
          backgroundColor: backgroundColorWithOpacity, 
          border: `${general.borderWidth ?? 1}px solid ${general.borderColor}`, 
          borderRadius: `${general.borderRadius}px`,
          zIndex: isSelected ? 1000 : zIndex,
        }}
        minConstraints={[30, 30]}
        resizeHandles={isLocked ? [] : ['se']}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="w-full h-full bg-transparent flex flex-col" onClick={isLocked ? undefined : onClick}>
              {isChart ? (
                <div className="p-2 flex flex-col flex-grow min-h-0">
                  <h3 className="text-sm font-medium truncate flex-shrink-0" style={{ fontSize: `${title.fontSize}px`, color: title.color, textAlign: title.alignment }}>{title.text}</h3>
                  <div className="flex-grow pt-2 min-h-0">
                    {renderChart(visualization, finalComputedDataset, allDatasets, finalDatasets, filteredDatasets, relationships, onUpdate, echartsOption, activeFilters, onFilterChange || (() => {}), openSlicerPopovers, onSlicerPopoverToggle, onToggleVisibility, allMeasureFields, staticMeasures, parameters, parameterValues, onParameterValueChange, calculatedFieldDefinitions, unfilteredJoinedForSlicer, filteredJoinedForSlicer)}
                  </div>
                </div>
              ) : (
                <div className="flex-grow h-full">
                  {renderChart(visualization, finalComputedDataset, allDatasets, finalDatasets, filteredDatasets, relationships, onUpdate, echartsOption, activeFilters, onFilterChange || (() => {}), openSlicerPopovers, onSlicerPopoverToggle, onToggleVisibility, allMeasureFields, staticMeasures, parameters, parameterValues, onParameterValueChange, calculatedFieldDefinitions, unfilteredJoinedForSlicer, filteredJoinedForSlicer)}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={(e) => { e.stopPropagation(); onCopy(); }}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ResizableBox>
    </Draggable>
  );
}