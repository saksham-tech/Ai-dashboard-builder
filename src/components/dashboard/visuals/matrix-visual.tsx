import { useMemo } from "react";
import { type Visualization, type Dataset, type Relationship } from "@/types/visualizations";
import { formatValue } from "@/lib/formatting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MatrixVisualProps {
  visualization: Visualization;
  finalDatasets: Dataset[];
  filteredDatasets: Map<string, Record<string, any>[]>;
  relationships: Relationship[];
}

const parseColor = (color: string): [number, number, number] | null => {
    if (color.startsWith('#')) {
        const hex = color.substring(1);
        if (hex.length === 3) return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
        if (hex.length === 6) return [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
    }
    if (color.startsWith('rgb')) {
        const parts = color.match(/(\d+)/g);
        if (parts && parts.length >= 3) return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
    }
    return null;
};

const interpolate = (start: [number, number, number], end: [number, number, number], factor: number): string => {
    const result = start.slice();
    for (let i = 0; i < 3; i++) result[i] = Math.round(result[i] + factor * (end[i] - result[i]));
    return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
};

const getColorForValue = (value: number, min: number, max: number, minColor: string, centerColor: string, maxColor: string): string => {
    const minRgb = parseColor(minColor);
    const centerRgb = parseColor(centerColor);
    const maxRgb = parseColor(maxColor);
    if (!minRgb || !centerRgb || !maxRgb) return '';
    if (max === min) return centerColor;
    const position = (value - min) / (max - min);
    if (position < 0.5) return interpolate(minRgb, centerRgb, position * 2);
    return interpolate(centerRgb, maxRgb, (position - 0.5) * 2);
};

const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

export function MatrixVisual({ visualization, finalDatasets, filteredDatasets, relationships }: MatrixVisualProps) {
  const { options } = visualization;
  const { dataMapping, matrix: matrixOptions } = options;
  const { nameKey, secondaryValueKey, valueKey, valueKeyAggregation } = dataMapping;

  const pivotData = useMemo(() => {
    const rowField = parseCompositeKey(nameKey);
    const colField = parseCompositeKey(secondaryValueKey);
    const valueField = parseCompositeKey(valueKey);

    if (!rowField || !colField || !valueField) return null;

    const getDatasetForField = (fieldInfo: { datasetId: string, field: string }) => finalDatasets.find(ds => ds.id === fieldInfo.datasetId);
    
    const rowDS = getDatasetForField(rowField);
    const colDS = getDatasetForField(colField);
    const valDS = getDatasetForField(valueField);

    if (!rowDS || !colDS || !valDS) {
        return { error: "One or more fields could not be found in the data model." };
    }

    const valData = filteredDatasets.get(valDS.id) || [];
    if (valData.length === 0) {
      return { uniqueRows: [], uniqueCols: [], dataMatrix: [], rowTotals: [], colTotals: [], grandTotal: 0, minVal: 0, maxVal: 0 };
    }

    let joinedData = [...valData];
    const factTableId = valDS.id;
    const tablesJoined = new Set([factTableId]);

    const tablesToJoin = [
        { ds: rowDS, field: rowField.field },
        { ds: colDS, field: colField.field }
    ];

    for (const dim of tablesToJoin) {
        if (tablesJoined.has(dim.ds.id)) continue;

        const rel = relationships.find(r => 
            (r.fromTable === factTableId && r.toTable === dim.ds.id) ||
            (r.fromTable === dim.ds.id && r.toTable === factTableId)
        );

        if (!rel) {
            return { error: `No relationship found between '${valDS.name}' and '${dim.ds.name}'. Please check the Data Model.` };
        }

        const factJoinKey = rel.fromTable === factTableId ? rel.fromColumn : rel.toColumn;
        const dimJoinKey = rel.toTable === dim.ds.id ? rel.toColumn : rel.fromColumn;
        const dimData = filteredDatasets.get(dim.ds.id) || [];

        const dimDataMap = new Map(dimData.map(row => [row[dimJoinKey], row]));

        joinedData = joinedData.map(factRow => {
            const joinValue = factRow[factJoinKey];
            const dimRow = dimDataMap.get(joinValue);
            return { ...factRow, ...(dimRow || {}) };
        });
        tablesJoined.add(dim.ds.id);
    }

    const uniqueRows = Array.from(new Set(joinedData.map(d => d[rowField.field]))).sort();
    const uniqueCols = Array.from(new Set(joinedData.map(d => d[colField.field]))).sort();
    const rowMap = new Map(uniqueRows.map((val, i) => [val, i]));
    const colMap = new Map(uniqueCols.map((val, i) => [val, i]));
    const dataMatrix: (number | null)[][] = Array(uniqueRows.length).fill(0).map(() => Array(uniqueCols.length).fill(null));
    const countMatrix: number[][] = Array(uniqueRows.length).fill(0).map(() => Array(uniqueCols.length).fill(0));
    let minVal = Infinity, maxVal = -Infinity;

    for (const item of joinedData) {
      const rowIdx = rowMap.get(item[rowField.field]);
      const colIdx = colMap.get(item[colField.field]);
      const value = typeof item[valueField.field] === 'number' ? item[valueField.field] : 0;
      if (rowIdx !== undefined && colIdx !== undefined) {
        if (dataMatrix[rowIdx][colIdx] === null) dataMatrix[rowIdx][colIdx] = 0;
        (dataMatrix[rowIdx][colIdx] as number) += value;
        countMatrix[rowIdx][colIdx]++;
      }
    }

    if (valueKeyAggregation === 'AVERAGE') {
      for (let i = 0; i < uniqueRows.length; i++) {
        for (let j = 0; j < uniqueCols.length; j++) {
          if (dataMatrix[i][j] !== null && countMatrix[i][j] > 0) {
            (dataMatrix[i][j] as number) /= countMatrix[i][j];
          }
        }
      }
    }

    for (const row of dataMatrix) {
        for (const val of row) {
            if (val !== null) {
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }
        }
    }

    const rowTotals = dataMatrix.map(row => row.reduce((sum: number, val) => sum + (val || 0), 0));
    const colTotals = uniqueCols.map((_, j) => dataMatrix.reduce((sum, row) => sum + (row[j] || 0), 0));
    const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);

    return { uniqueRows, uniqueCols, dataMatrix, rowTotals, colTotals, grandTotal, minVal, maxVal };
  }, [dataMapping, finalDatasets, filteredDatasets, relationships]);

  if (!matrixOptions) return null;
  if (!pivotData) return <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">Please select fields for Rows, Columns, and Values.</div>;
  if ('error' in pivotData) return <div className="flex items-center justify-center h-full text-destructive p-4 text-center">{pivotData.error}</div>;

  const { uniqueRows, uniqueCols, dataMatrix, rowTotals, colTotals, grandTotal, minVal, maxVal } = pivotData;
  const { grid, rowHeaders, columnHeaders, values, totals } = matrixOptions;
  
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

  const borderStyle = `${grid.thickness}px solid ${grid.color}`;

  const trimText = (text: string, limit?: number) => {
    if (limit && text.length > limit) {
      return text.substring(0, limit);
    }
    return text;
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      <h3 className="text-sm font-medium truncate flex-shrink-0 mb-2" style={{ fontSize: `${options.title.fontSize}px`, color: options.title.color, textAlign: options.title.alignment }}>
        {options.title.text}
      </h3>
      <ScrollArea className="flex-grow">
        <table className="border-collapse text-sm">
          <thead style={{ backgroundColor: columnHeaders.backgroundColor }}>
            <tr>
              <th className={cn("text-left sticky top-0 z-10 w-28")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, backgroundColor: columnHeaders.backgroundColor }}></th>
              {uniqueCols.map((col, i) => {
                const formattedCol = formatValue(col, dataMapping.secondaryValueKeyFormatting);
                const trimmedCol = trimText(formattedCol, columnHeaders.characterLimit);
                return (
                  <th key={i} className={cn("text-right sticky top-0 z-10 w-24 truncate")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, color: columnHeaders.color, fontSize: `${columnHeaders.fontSize}px`, borderLeft: grid.vertical ? borderStyle : '', whiteSpace: columnHeaders.wordWrap ? 'normal' : 'nowrap' }}>
                    {trimmedCol}
                  </th>
                );
              })}
              {totals.showRowGrandTotal && <th className={cn("text-right sticky top-0 z-10 w-24 font-bold")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, color: totals.color, fontSize: `${totals.fontSize}px`, backgroundColor: totals.backgroundColor, borderLeft: grid.vertical ? borderStyle : '' }}>Total</th>}
            </tr>
          </thead>
          <tbody>
            {uniqueRows.map((row, i) => {
              const isAlternatingRow = values.showAlternatingRows && i % 2 !== 0;
              const isLastRow = i === uniqueRows.length - 1;
              const rowHeaderBg = isAlternatingRow ? values.alternatingRowColor : rowHeaders.backgroundColor;
              const valueCellBg = isAlternatingRow ? values.alternatingRowColor : values.backgroundColor;
              const totalCellBg = isAlternatingRow ? values.alternatingRowColor : totals.backgroundColor;
              const formattedRow = formatValue(row, dataMapping.nameKeyFormatting);
              const trimmedRow = trimText(formattedRow, rowHeaders.characterLimit);

              return (
                <tr key={i}>
                  <th className={cn("text-left sticky left-0 z-10 w-28 truncate")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, color: rowHeaders.color, fontSize: `${rowHeaders.fontSize}px`, backgroundColor: rowHeaderBg, borderRight: grid.horizontal ? borderStyle : '', borderBottom: grid.horizontal && !isLastRow ? borderStyle : '', whiteSpace: rowHeaders.wordWrap ? 'normal' : 'nowrap' }}>
                    {trimmedRow}
                  </th>
                  {dataMatrix[i].map((val, j) => {
                    let cellStyle: React.CSSProperties = {
                      padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`,
                      color: values.color,
                      backgroundColor: valueCellBg,
                      borderLeft: grid.vertical ? borderStyle : '',
                      borderBottom: grid.horizontal && !isLastRow ? borderStyle : '',
                      whiteSpace: values.wordWrap ? 'normal' : 'nowrap',
                    };
                    if (cf.enabled && val !== null) {
                      if (cf.backgroundColorScale.enabled) {
                        cellStyle.backgroundColor = getColorForValue(val, minVal, maxVal, cf.backgroundColorScale.minColor, cf.backgroundColorScale.centerColor, cf.backgroundColorScale.maxColor);
                      }
                      if (cf.fontColorScale.enabled) {
                        cellStyle.color = getColorForValue(val, minVal, maxVal, cf.fontColorScale.minColor, cf.fontColorScale.centerColor, cf.fontColorScale.maxColor);
                      }
                    }
                    return (
                      <td key={j} className={cn("text-right truncate")} style={{ ...cellStyle, fontSize: `${values.fontSize}px` }}>
                        {val !== null ? formatValue(val, dataMapping.valueKeyFormatting) : ''}
                      </td>
                    );
                  })}
                  {totals.showRowGrandTotal && <td className={cn("text-right font-bold w-24 truncate")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, color: totals.color, fontSize: `${totals.fontSize}px`, backgroundColor: totalCellBg, borderLeft: grid.vertical ? borderStyle : '', borderBottom: grid.horizontal && !isLastRow ? borderStyle : '' }}>{formatValue(rowTotals[i], dataMapping.valueKeyFormatting)}</td>}
                </tr>
              );
            })}
          </tbody>
          {totals.showColumnGrandTotal && (
            <tfoot>
              <tr>
                <th className={cn("text-left sticky left-0 z-10 w-28 font-bold")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, color: totals.color, fontSize: `${totals.fontSize}px`, backgroundColor: totals.backgroundColor, borderRight: grid.horizontal ? borderStyle : '' }}>Total</th>
                {colTotals.map((total, i) => (
                  <td key={i} className={cn("text-right font-bold w-24 truncate")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, color: totals.color, fontSize: `${totals.fontSize}px`, backgroundColor: totals.backgroundColor, borderLeft: grid.vertical ? borderStyle : '' }}>{formatValue(total, dataMapping.valueKeyFormatting)}</td>
                ))}
                {totals.showRowGrandTotal && <td className={cn("text-right font-bold w-24 truncate")} style={{ padding: `${values.rowPadding ?? 4}px ${values.columnPadding ?? 8}px`, color: totals.color, fontSize: `${totals.fontSize}px`, backgroundColor: totals.backgroundColor, borderLeft: grid.vertical ? borderStyle : '' }}>{formatValue(grandTotal, dataMapping.valueKeyFormatting)}</td>}
              </tr>
            </tfoot>
          )}
        </table>
      </ScrollArea>
    </div>
  );
}