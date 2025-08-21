import { useMemo, useRef } from "react";
import { type Visualization, type Dataset, type Relationship } from "@/types/visualizations";
import { formatValue } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";

interface TableVisualProps {
  visualization: Visualization;
  finalDatasets: Dataset[];
  filteredDatasets: Map<string, Record<string, any>[]>;
  relationships: Relationship[];
  allMeasureFields: string[];
  activeFilters: Record<string, { datasetId: string, values: Set<any> }>;
  handleFilterChange: (datasetId: string, field: string, selectedValues: Set<any>) => void;
}

const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key) return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

const isImageUrl = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('data:image')) return true;
  // Allow query params after extension
  const imageExtPattern = /(\.jpg|\.jpeg|\.png|\.gif|\.svg|\.webp|\.bmp)(\?.*)?$/i;
  return imageExtPattern.test(trimmed);
};

const isPotentiallyNumeric = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return true;
  if (typeof value !== 'string' || value.trim() === '') return false;
  const cleanedValue = value.replace(/[\s$,€£¥,]/g, '');
  if (cleanedValue === '') return false;
  return !isNaN(Number(cleanedValue));
};

export function TableVisual({ visualization, finalDatasets, filteredDatasets, relationships, allMeasureFields, activeFilters, handleFilterChange }: TableVisualProps) {
  const { options } = visualization;
  
  const defaultTableOptions = {
    grid: { vertical: true, horizontal: true, color: '#27282b', thickness: 1 },
    headers: { fontSize: 12, color: '#fafafa', backgroundColor: '#18191b', wordWrap: true, alignment: 'left' as const },
    values: { fontSize: 12, color: '#fafafa', backgroundColor: '#0e0f10', showAlternatingRows: true, alternatingRowColor: '#222326', rowPadding: 4, columnPadding: 8, alignment: 'left' as const },
    totals: { show: false, fontSize: 12, color: '#fafafa', backgroundColor: '#27282b', label: 'Total', columnsWithTotals: [] },
    allowMultiSelect: false,
    filterColumn: '',
  };

  const tableOptions = {
    ...defaultTableOptions,
    ...options.table,
    grid: { ...defaultTableOptions.grid, ...options.table?.grid },
    headers: { ...defaultTableOptions.headers, ...options.table?.headers },
    values: { ...defaultTableOptions.values, ...options.table?.values },
    totals: { ...defaultTableOptions.totals, ...options.table?.totals },
  };

  const { dataMapping } = options;
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, columns, totals, error } = useMemo(() => {
    const { valueKeys } = dataMapping;

    if (valueKeys.length === 0) {
      return { data: [], columns: [], totals: {}, error: null };
    }

    const memoizedColumns = valueKeys.map(vk => {
        const parsed = parseCompositeKey(vk.field);
        const header = parsed?.field || vk.field;
        const datasetId = parsed?.datasetId;
        const sourceDataset = finalDatasets.find(ds => ds.id === datasetId);
        
        let isImage = false;
        let isNumeric = false;

        if (sourceDataset && sourceDataset.data.length > 0) {
            const sample = sourceDataset.data.slice(0, 50).map(row => row[header]).filter(v => v != null && v !== '');
            if (sample.length > 0) {
                // Consider it an image column if ANY sample looks like an image URL
                isImage = sample.some(isImageUrl);
                // If column looks like image, force non-numeric; otherwise detect numeric
                if (!isImage) {
                    isNumeric = sample.every(isPotentiallyNumeric);
                } else {
                    isNumeric = false;
                }
            }
        }
        // If heuristics didn't decide, fall back to global measure list
        if (!isImage && !isNumeric && allMeasureFields.includes(header)) {
            isNumeric = true;
        }

        return {
            key: vk.field,
            header, // display name
            accessor: header, // will be adjusted after baseTableId is known if needed
            formatting: vk.formatting,
            datasetId,
            isImage,
            isNumeric
        } as {
            key: string;
            header: string;
            accessor: string;
            formatting: any;
            datasetId?: string;
            isImage: boolean;
            isNumeric: boolean;
        };
    });

    const firstDataTableColumn = memoizedColumns.find(c => c.datasetId && c.datasetId !== 'calculated');
    if (!firstDataTableColumn || !firstDataTableColumn.datasetId) {
      return { data: [], columns: [], totals: {}, error: "Please add at least one column from a data table." };
    }
    const baseTableId = firstDataTableColumn.datasetId;

    // After base is known, adjust accessors for non-base datasets to avoid collisions (they may be suffixed during join)
    memoizedColumns.forEach(col => {
      if (col.datasetId && col.datasetId !== baseTableId) {
        col.accessor = `${col.header}__${col.datasetId}`;
      } else {
        col.accessor = col.header;
      }
    });

    const requiredDatasetIds = new Set<string>([baseTableId]);
    memoizedColumns.forEach(c => {
      if (c.datasetId && c.datasetId !== 'calculated') {
        requiredDatasetIds.add(c.datasetId);
      }
    });

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

          const toKey = (v: any) => String(v).trim();
          const otherDataMap = new Map<string, Record<string, any>[]>();
          for (const row of otherData) {
            const key = toKey(row[otherJoinKey]);
            if (!otherDataMap.has(key)) {
              otherDataMap.set(key, []);
            }
            otherDataMap.get(key)!.push(row);
          }

          const otherTable = finalDatasets.find(ds => ds.id === tableIdToJoin);
          const otherFields = otherTable ? otherTable.fields : [];
          const nullsForOtherTable = otherFields.reduce((acc, field) => {
            // Always suffix non-base fields to align with accessors
            acc[`${field}__${tableIdToJoin}`] = null;
            return acc;
          }, {} as Record<string, null>);

          joinedData = joinedData.flatMap(baseRow => {
            const joinValue = toKey(baseRow[baseJoinKey]);
            const otherRows = otherDataMap.get(joinValue);
            if (otherRows && otherRows.length > 0) {
              return otherRows.map(otherRow => {
                const merged: Record<string, any> = { ...baseRow };
                // Always suffix fields from the joined table to avoid ambiguity
                for (const [k, v] of Object.entries(otherRow)) {
                  const targetKey = `${k}__${tableIdToJoin}`;
                  merged[targetKey] = v;
                }
                return merged;
              });
            }
            // For unmatched, add nulls for the suffixed fields only if they don't exist yet
            const mergedUnmatched: Record<string, any> = { ...baseRow };
            for (const [k, v] of Object.entries(nullsForOtherTable)) {
              if (!(k in mergedUnmatched)) mergedUnmatched[k] = v;
            }
            return [mergedUnmatched];
          });

          tablesToJoin.delete(tableIdToJoin);
          joinedTables.add(tableIdToJoin);
          joinedSomething = true;
          break;
        }
      }
    }

    if (tablesToJoin.size > 0) {
      const unjoinedTableNames = Array.from(tablesToJoin).map(id => finalDatasets.find(ds => ds.id === id)?.name).filter(Boolean);
      if (unjoinedTableNames.length > 0) {
        return { data: [], columns: [], totals: {}, error: `Could not join tables: ${unjoinedTableNames.join(', ')}. Please check relationships.` };
      }
    }

    const dimensionColumns = memoizedColumns.filter(c => !c.isNumeric);
    const measureColumns = memoizedColumns.filter(c => c.isNumeric);
    let finalData = joinedData;

    // If any selected column is an image, render raw rows (no aggregation) to preserve images
    // Use both metadata and actual data scan for robustness
    const containsImageColumn = memoizedColumns.some(c => c.isImage) || joinedData.slice(0, 200).some(r => memoizedColumns.some(c => isImageUrl(r[c.accessor])));
    if (!containsImageColumn && dimensionColumns.length > 0 && measureColumns.length > 0) {
        const normalizeDim = (v: any) => (v === null || v === undefined) ? '(blank)' : v;
        const getCompositeKey = (row: Record<string, any>): string => dimensionColumns.map(d => normalizeDim(row[d.accessor])).join('||');
        const aggregatedMap = new Map<string, Record<string, any>>();

        for (const row of joinedData) {
            const key = getCompositeKey(row);

            if (!aggregatedMap.has(key)) {
                const newEntry: Record<string, any> = {};
                dimensionColumns.forEach(d => { newEntry[d.header] = row[d.accessor] ?? null; });
                measureColumns.forEach(m => { newEntry[m.header] = null; });
                aggregatedMap.set(key, newEntry);
            }

            const entry = aggregatedMap.get(key)!;
            measureColumns.forEach(m => {
                const value = row[m.accessor];
                if (value !== null && value !== undefined) {
                    if (m.isNumeric) {
                        const numericValue = Number(String(value).replace(/[,$.]/g, ''));
                        if (!isNaN(numericValue)) entry[m.header] = (entry[m.header] || 0) + numericValue;
                    } else if (entry[m.header] === null) {
                        entry[m.header] = value;
                    }
                }
            });
        }
        
        const aggregatedData = Array.from(aggregatedMap.values());
        // Do not drop rows; keep rows even if measures are null so dimensions (like images) still display
        finalData = aggregatedData;
        // Fallback: if aggregation produced no rows, show raw joined data
        if (finalData.length === 0) {
          finalData = joinedData;
        }
    }

    // Unpivot-aware consolidation: for each dimension key, merge rows into a single row where
    // each non-dimension column gets the first non-blank value found across the group's rows.
    // Drop groups that have no valid values in any non-dimension column.
    if (dimensionColumns.length > 0) {
      const nonDimensionColumns = memoizedColumns.filter(c => dimensionColumns.every(d => d.header !== c.header));
      const normalizeDim = (v: any) => (v === null || v === undefined) ? '(blank)' : v;
      const getCompositeKey = (row: Record<string, any>): string => dimensionColumns.map(d => normalizeDim(row[d.accessor])).join('||');
      const isBlank = (v: any) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

      const groups = new Map<string, Record<string, any>[]>();
      for (const row of finalData) {
        const key = getCompositeKey(row);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }

      const filtered: Record<string, any>[] = [];
      for (const [, rows] of groups) {
        // Build a merged row using the first row as base
        if (rows.length === 0) continue;
        const base = rows[0];
        const merged: Record<string, any> = {};

        // Copy dimension values to both header and accessor keys
        for (const d of dimensionColumns) {
          const val = base[d.accessor];
          merged[d.header] = val;
          merged[d.accessor] = val;
        }

        // For each non-dimension column, pick the first non-blank across the group's rows
        let hasAnyValue = false;
        for (const c of nonDimensionColumns) {
          let chosen: any = null;
          for (const r of rows) {
            const v = r[c.accessor];
            if (!isBlank(v)) { chosen = v; break; }
          }
          if (!isBlank(chosen)) {
            hasAnyValue = true;
          }
          // Set to both keys to be safe across aggregated/non-aggregated paths
          merged[c.header] = isBlank(chosen) ? null : chosen;
          merged[c.accessor] = isBlank(chosen) ? null : chosen;
        }

        if (hasAnyValue) {
          filtered.push(merged);
        }
      }

      // Apply only if something remains after filtering
      if (filtered.length > 0) finalData = filtered;
    }

    // Optionally hide rows that contain any blank across selected columns
    if (tableOptions?.values?.hideRowsWithBlanks) {
      finalData = finalData.filter(row => {
        return memoizedColumns.every(col => {
          const v = row[col.accessor];
          if (v === null || v === undefined) return false;
          if (typeof v === 'string' && v.trim() === '') return false;
          return true;
        });
      });
    }

    const totals: Record<string, number | null> = {};
    if (tableOptions?.totals?.show) {
        const columnsToTotal = new Set(tableOptions.totals.columnsWithTotals || []);
        memoizedColumns.forEach(col => {
            if (col.isNumeric && columnsToTotal.has(col.header)) {
                totals[col.header] = finalData.reduce((sum, row) => {
                    const val = Number(String(row[col.accessor]).replace(/[,$.]/g, ''));
                    return sum + (isNaN(val) ? 0 : val);
                }, 0);
            } else {
                totals[col.header] = null;
            }
        });
    }

    return { data: finalData, columns: memoizedColumns, totals, error: null };
  }, [visualization, finalDatasets, filteredDatasets, relationships, allMeasureFields]);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  if (error) {
    return <div className="flex items-center justify-center h-full text-destructive p-4 text-center">{error}</div>;
  }

  if (columns.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">Please add fields to the 'Columns' area in the Data Mapping panel.</div>;
  }

  const { grid, headers, values, totals: totalsOptions, allowMultiSelect, filterColumn } = tableOptions;
  const borderStyle = `${grid.thickness}px solid ${grid.color}`;
  const virtualRows = rowVirtualizer.getVirtualItems();

  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const filterField = filterColumn || columns[0]?.header;
  const filterColumnMeta = columns.find(c => c.header === filterField);
  const filterDatasetId = filterColumnMeta?.datasetId;
  const currentSelection = activeFilters[filterField]?.values || new Set();

  const handleRowClick = (row: Record<string, any>) => {
    if (!filterField || !filterDatasetId) return;

    const rowValue = filterColumnMeta ? row[filterColumnMeta.accessor] : undefined;
    if (rowValue === undefined || rowValue === null) return;

    const newSelection = new Set(currentSelection);
    if (allowMultiSelect) {
      if (newSelection.has(rowValue)) {
        newSelection.delete(rowValue);
      } else {
        newSelection.add(rowValue);
      }
    } else {
      if (newSelection.has(rowValue) && newSelection.size === 1) {
        newSelection.clear();
      } else {
        newSelection.clear();
        newSelection.add(rowValue);
      }
    }
    handleFilterChange(filterDatasetId, filterField, newSelection);
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      <h3 className="text-sm font-medium truncate flex-shrink-0 mb-2" style={{ fontSize: `${options.title.fontSize}px`, color: options.title.color, textAlign: options.title.alignment }}>
        {options.title.text}
      </h3>
      <div ref={parentRef} className="flex-grow overflow-auto">
        <div style={{ height: `${rowVirtualizer.getTotalSize() + 35 + (totalsOptions.show ? 35 : 0)}px`, width: '100%', position: 'relative' }}>
          {/* Header */}
          <div className="sticky top-0 z-10 flex" style={{ height: '35px', backgroundColor: headers.backgroundColor, borderBottom: grid.horizontal ? borderStyle : '' }}>
            {columns.map((col, i) => (
              <div
                key={col.key}
                className={cn("font-bold flex items-center truncate", alignmentClasses[headers.alignment])}
                style={{
                  width: `${100 / columns.length}%`,
                  padding: `${values.rowPadding}px ${values.columnPadding}px`,
                  color: headers.color,
                  fontSize: `${headers.fontSize}px`,
                  borderRight: grid.vertical && i < columns.length - 1 ? borderStyle : '',
                }}
              >
                {col.header}
              </div>
            ))}
          </div>

          {/* Body */}
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualRows.map(virtualRow => {
              const row = data[virtualRow.index];
              const isAlternating = values.showAlternatingRows && virtualRow.index % 2 !== 0;
              const rowValue = filterField ? row[filterField] : undefined;
              const isSelected = rowValue !== undefined && currentSelection.has(rowValue);

              return (
                <div
                  key={virtualRow.key}
                  className={cn("absolute w-full flex", (allowMultiSelect || filterColumn) && "cursor-pointer", isSelected && "bg-primary/20")}
                  onClick={() => handleRowClick(row)}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    backgroundColor: isSelected ? undefined : (isAlternating ? values.alternatingRowColor : values.backgroundColor),
                    borderBottom: grid.horizontal ? borderStyle : '',
                  }}
                >
                  {columns.map((col, i) => {
                    const rawValue = row[col.accessor];
                    return (
                      <div
                        key={col.key}
                        className={cn("truncate flex items-center", alignmentClasses[values.alignment])}
                        style={{
                          width: `${100 / columns.length}%`,
                          padding: `${values.rowPadding}px ${values.columnPadding}px`,
                          color: values.color,
                          fontSize: `${values.fontSize}px`,
                          borderRight: grid.vertical && i < columns.length - 1 ? borderStyle : '',
                        }}
                      >
                        {isImageUrl(rawValue) ? (
                          <img src={rawValue} alt={col.header} className="max-h-full h-8 object-contain" />
                        ) : (
                          formatValue(rawValue, col.formatting, col.header)
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {totalsOptions.show && (
            <div className="sticky bottom-0 z-10 flex" style={{ height: '35px', backgroundColor: totalsOptions.backgroundColor, top: `${rowVirtualizer.getTotalSize() + 35}px` }}>
              {columns.map((col, i) => (
                <div
                  key={col.key}
                  className={cn("font-bold flex items-center truncate", alignmentClasses[values.alignment])}
                  style={{
                    width: `${100 / columns.length}%`,
                    padding: `${values.rowPadding}px ${values.columnPadding}px`,
                    color: totalsOptions.color,
                    fontSize: `${totalsOptions.fontSize}px`,
                    borderTop: grid.horizontal ? borderStyle : '',
                    borderRight: grid.vertical && i < columns.length - 1 ? borderStyle : '',
                  }}
                >
                  {i === 0 ? totalsOptions.label : (
                    col.isNumeric && totals[col.header] !== null ? formatValue(totals[col.header], col.formatting, col.header) : ''
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}