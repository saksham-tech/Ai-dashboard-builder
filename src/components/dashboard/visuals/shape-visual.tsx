import { useMemo } from "react";
import { type Visualization, type ShapeOptions } from "@/types/visualizations";
import { checkCondition } from "@/lib/conditional-formatting";

interface ShapeVisualProps {
  visualization: Visualization;
  dataset: Record<string, any>[];
}

const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

export function ShapeVisual({ visualization, dataset }: ShapeVisualProps) {
  const { options, width, height } = visualization;
  const { shape, dataMapping, conditionalFormatting } = options;

  if (!shape) return null;

  // Calculate scaling factor based on a baseline size (e.g., 150px)
  const scaleFactor = Math.min(width, height) / 150;
  const dynamicStrokeWidth = Math.max(0.5, (shape.strokeWidth || 0) * scaleFactor);
  const dynamicCornerRadius = (shape.cornerRadius || 0) * scaleFactor;

  const aggregatedValue = useMemo(() => {
    const { valueKey, valueKeyAggregation } = dataMapping;
    const parsedValueKey = parseCompositeKey(valueKey)?.field;
    if (!parsedValueKey || !dataset || dataset.length === 0) return null;
    
    const allValues = dataset.map(row => row[parsedValueKey]);
    const numericValues = allValues.filter(v => typeof v === 'number' && !isNaN(v));

    switch (valueKeyAggregation) {
      case 'SUM': return numericValues.reduce((a, b) => a + b, 0);
      case 'AVERAGE': return numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
      case 'COUNT': return allValues.length;
      case 'COUNT_DISTINCT': return new Set(allValues).size;
      case 'NONE': return numericValues.length > 0 ? numericValues[0] : null;
      default: return null;
    }
  }, [dataset, dataMapping]);

  const finalStyles: ShapeOptions = useMemo(() => {
    let finalFillColor = shape.fillColor;
    
    if (conditionalFormatting?.enabled && conditionalFormatting.rules.length > 0 && aggregatedValue !== null) {
      const matchingRule = conditionalFormatting.rules.find(rule => {
        return checkCondition(aggregatedValue, { ...rule, target: 'value' });
      });
      if (matchingRule) {
        finalFillColor = matchingRule.color;
      }
    }
    
    return {
      ...shape,
      fillColor: finalFillColor,
    };
  }, [shape, conditionalFormatting, aggregatedValue]);

  const { shapeType, fillColor, strokeColor, strokeDasharray, fillOpacity, strokeOpacity } = finalStyles;

  const strokeDasharrayValue = strokeDasharray === 'none' ? undefined : strokeDasharray;
  const trianglePoints = `${width / 2},${dynamicStrokeWidth / 2} ${width - dynamicStrokeWidth / 2},${height - dynamicStrokeWidth / 2} ${dynamicStrokeWidth / 2},${height - dynamicStrokeWidth / 2}`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {shapeType === 'rectangle' && (
        <rect
          x={dynamicStrokeWidth / 2}
          y={dynamicStrokeWidth / 2}
          width={width - dynamicStrokeWidth}
          height={height - dynamicStrokeWidth}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={dynamicStrokeWidth}
          strokeDasharray={strokeDasharrayValue}
          rx={dynamicCornerRadius}
          fillOpacity={fillOpacity}
          strokeOpacity={strokeOpacity}
        />
      )}
      {shapeType === 'circle' && (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={(width - dynamicStrokeWidth) / 2}
          ry={(height - dynamicStrokeWidth) / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={dynamicStrokeWidth}
          strokeDasharray={strokeDasharrayValue}
          fillOpacity={fillOpacity}
          strokeOpacity={strokeOpacity}
        />
      )}
      {shapeType === 'line' && (
        <line
          x1={dynamicStrokeWidth}
          y1={height / 2}
          x2={width - dynamicStrokeWidth}
          y2={height / 2}
          stroke={strokeColor}
          strokeWidth={dynamicStrokeWidth}
          strokeDasharray={strokeDasharrayValue}
          strokeLinecap="round"
          strokeOpacity={strokeOpacity}
        />
      )}
      {shapeType === 'triangle' && (
        <polygon
          points={trianglePoints}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={dynamicStrokeWidth}
          strokeDasharray={strokeDasharrayValue}
          fillOpacity={fillOpacity}
          strokeOpacity={strokeOpacity}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}