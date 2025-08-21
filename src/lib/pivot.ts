import { type Dataset } from "@/types/visualizations";
import { nanoid } from "nanoid";

export const pivot = (
  sourceDataset: Dataset,
  rowField: string,
  columnField: string,
  valueField: string,
  newTableName: string
): Dataset => {
  const pivotedData: Record<string, any>[] = [];
  const newColumns = new Set<string>([rowField]);
  const groupedByRow = new Map<any, Record<string, any>[]>();

  // Group data by the row field
  for (const row of sourceDataset.data) {
    const key = row[rowField];
    if (!groupedByRow.has(key)) {
      groupedByRow.set(key, []);
    }
    groupedByRow.get(key)!.push(row);
  }

  // Get all unique column values to create new columns
  const dynamicColumns = Array.from(new Set(sourceDataset.data.map(row => row[columnField]))).sort();
  dynamicColumns.forEach(col => newColumns.add(String(col)));

  // Construct the pivoted data
  for (const [key, rows] of groupedByRow.entries()) {
    const newRow: Record<string, any> = { [rowField]: key };
    for (const col of dynamicColumns) {
      const matchingRow = rows.find(r => r[columnField] === col);
      newRow[String(col)] = matchingRow ? matchingRow[valueField] : null;
    }
    pivotedData.push(newRow);
  }

  return {
    id: nanoid(),
    name: newTableName,
    data: pivotedData,
    fields: Array.from(newColumns),
  };
};

export const unpivot = (
  sourceDataset: Dataset,
  columnsToUnpivot: string[],
  attributeColumnName: string,
  valueColumnName: string,
  newTableName: string
): Dataset => {
  const unpivotedData: Record<string, any>[] = [];
  const columnsToKeep = sourceDataset.fields.filter(f => !columnsToUnpivot.includes(f));
  const newFields = [...columnsToKeep, attributeColumnName, valueColumnName];

  for (const row of sourceDataset.data) {
    for (const col of columnsToUnpivot) {
      const newRow: Record<string, any> = {};
      columnsToKeep.forEach(keepCol => {
        newRow[keepCol] = row[keepCol];
      });
      newRow[attributeColumnName] = col;
      newRow[valueColumnName] = row[col];
      unpivotedData.push(newRow);
    }
  }

  return {
    id: nanoid(),
    name: newTableName,
    data: unpivotedData,
    fields: newFields,
  };
};