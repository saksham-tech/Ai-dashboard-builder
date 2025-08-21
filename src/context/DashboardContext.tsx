import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { type Visualization, type CalculatedFieldDefinition, type Operand, type TransformedFieldDefinition, type TransformationType, type Dataset, type Relationship, type Cardinality, type JoinType, type Parameter, type VisualizationOptions } from "@/types/visualizations";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { applyCalculations } from '@/lib/calculations';
import { applyTransformations } from "@/lib/transformations";
import { parseDate, isDate } from "@/lib/date-parser";
import { getYear, getQuarter, getMonth, format, getDate, getDayOfYear, getWeek } from 'date-fns';
import { generateDateTableFromRange } from '@/lib/date-table';
import { pivot, unpivot } from '@/lib/pivot';

export interface DashboardInfo {
  id: string;
  name: string;
}

type DateFormat = 'yyyy-MM-dd' | 'MMMM' | 'MMMM-yyyy' | 'dd-MM-yyyy';
type MergeDestination = 'new' | 'left' | 'right';

interface DashboardContextType {
  datasets: Dataset[];
  setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>;
  visualizations: Visualization[];
  setVisualizations: React.Dispatch<React.SetStateAction<Visualization[]>>;
  selectedVizId: string | null;
  setSelectedVizId: React.Dispatch<React.SetStateAction<string | null>>;
  canvasBackground: string;
  setCanvasBackground: React.Dispatch<React.SetStateAction<string>>;
  activeFilters: Record<string, { datasetId: string, values: Set<any> }>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Record<string, { datasetId: string, values: Set<any> }>>>;
  dashboardInfo: DashboardInfo | null;
  setDashboardInfo: React.Dispatch<React.SetStateAction<DashboardInfo | null>>;
  calculatedFieldDefinitions: CalculatedFieldDefinition[];
  setCalculatedFieldDefinitions: React.Dispatch<React.SetStateAction<CalculatedFieldDefinition[]>>;
  transformedFieldDefinitions: TransformedFieldDefinition[];
  setTransformedFieldDefinitions: React.Dispatch<React.SetStateAction<TransformedFieldDefinition[]>>;
  isLocked: boolean;
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
  hiddenVizIds: Set<string>;
  setHiddenVizIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  relationships: Relationship[];
  staticMeasures: Record<string, string | number>;
  parameters: Parameter[];
  parameterValues: Record<string, any>;
  
  finalDatasets: Dataset[];
  filteredDatasets: Map<string, Record<string, any>[]>;
  allMeasureFields: string[];
  fieldsForDialogs: string[];
  lastAddedTableId: string | null;

  handleDataParsed: (data: Record<string, any>[], fields: string[], name: string) => void;
  handleFilterChange: (datasetId: string, field: string, selectedValues: Set<any>) => void;
  loadDashboard: (dashboard: { id: string, name: string, configuration: any }) => void;
  clearDashboard: () => void;
  handleSaveCalculatedField: (name: string, op1: Operand, operator: string, op2: Operand) => void;
  handleSaveTransformedField: (
    datasetId: string,
    name: string,
    sourceField: string,
    transformation: TransformationType,
    value?: string,
    excludeByCategoryField?: string,
    excludeByCategoryValues?: string[],
    filterOnField?: string,
    valuesToFilter?: string[],
    aggregation?: import("@/types/visualizations").AggregationType,
    groupByFields?: string[],
    conditionalThenMode?: 'column' | 'literal',
    conditionalThenField?: string,
    conditionalThenValue?: string,
    conditionalElseMode?: 'column' | 'literal',
    conditionalElseField?: string,
    conditionalElseValue?: string,
    combineParts?: Array<{ mode: 'column' | 'literal'; field?: string; value?: string }>,
  ) => void;
  handleToggleVisibility: (vizId: string) => void;
  handleSaveDateColumns: (datasetId: string, sourceField: string, columnsToCreate: Set<string>) => void;
  handleSaveDateTable: (name: string, options: { mode: 'auto', fiscalYearEndMonth?: number, dateFormat: DateFormat, columns: Set<string> } | { mode: 'manual', sourceDatasetIds: string[], fiscalYearEndMonth?: number, dateFormat: DateFormat, columns: Set<string> }) => void;
  handleSaveNewTable: (name: string, columns: { name: string; type: string }[]) => void;
  handleSaveRelationship: (relationship: Relationship) => void;
  handleDeleteRelationship: (relationshipId: string) => void;
  handlePivot: (sourceDatasetId: string, rowField: string, columnField: string, valueField: string, newTableName: string) => void;
  handleUnpivot: (sourceDatasetId: string, columnsToUnpivot: string[], attributeCol: string, valueCol: string, newTableName: string) => void;
  handleDeleteColumns: (datasetId: string, columnsToDelete: string[]) => void;
  handleDeleteOtherColumns: (datasetId: string, columnsToKeep: string[]) => void;
  handleDeleteDataset: (datasetId: string) => void;
  handleDeleteMeasure: (measureName: string) => void;
  handleChangeColumnType: (datasetId: string, columnName: string, newType: 'whole' | 'decimal' | 'text' | 'date') => void;
  handleRenameDataset: (datasetId: string, newName: string) => void;
  handleMergeQueries: (leftTableId: string, leftColumn: string, rightTableId: string, rightColumn: string, joinType: JoinType, mergeDestination: MergeDestination, columnsToMerge: string[], newTableName?: string) => void;
  handleRemoveDuplicates: (datasetId: string, columnName: string) => void;
  handleDuplicateTable: (datasetId: string) => void;
  handleSaveParameter: (parameter: Omit<Parameter, 'id'>) => void;
  handleParameterValueChange: (parameterId: string, value: any) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const findBestRelationship = (tableA: Dataset, tableB: Dataset): Omit<Relationship, 'id'> | null => {
  let bestMatch: { score: number; fromColumn: string; toColumn: string; fromTable: string; toTable: string } | null = null;

  const normalize = (str: string) => str.toLowerCase().replace(/_id$|id$|s$/, '');

  for (const colA of tableA.fields) {
    for (const colB of tableB.fields) {
      let score = 0;
      const colALower = colA.toLowerCase();
      const colBLower = colB.toLowerCase();

      if (colALower === colBLower) score = 100;
      else if (normalize(tableA.name) === normalize(colB) || normalize(tableB.name) === normalize(colA)) score = 120;
      else if (normalize(colA) === normalize(colB)) score = 80;

      if (score > (bestMatch?.score || 0)) {
        bestMatch = { score, fromColumn: colA, toColumn: colB, fromTable: tableA.id, toTable: tableB.id };
      }
    }
  }

  if (!bestMatch) return null;

  const uniqueFrom = new Set(tableA.data.map(row => row[bestMatch!.fromColumn])).size;
  const uniqueTo = new Set(tableB.data.map(row => row[bestMatch!.toColumn])).size;

  let cardinality: Cardinality = 'one-to-many';
  if (uniqueFrom > uniqueTo) {
    cardinality = 'one-to-many';
  } else if (uniqueTo > uniqueFrom) {
    cardinality = 'many-to-one';
    [bestMatch.fromTable, bestMatch.toTable] = [bestMatch.toTable, bestMatch.fromTable];
    [bestMatch.fromColumn, bestMatch.toColumn] = [bestMatch.toColumn, bestMatch.fromColumn];
  } else if (uniqueFrom === tableA.data.length && uniqueTo === tableB.data.length) {
    cardinality = 'one-to-one';
  }

  return { ...bestMatch, cardinality };
};

const parseCompositeKey = (key: string | null): { datasetId: string, field: string } | null => {
    if (!key || typeof key !== 'string') return null;
    const parts = key.split(':');
    if (parts.length < 2) return null;
    return { datasetId: parts[0], field: parts.slice(1).join(':') };
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [selectedVizId, setSelectedVizId] = useState<string | null>(null);
  const [canvasBackground, setCanvasBackground] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, { datasetId: string, values: Set<any> }>>({});
  const [dashboardInfo, setDashboardInfo] = useState<DashboardInfo | null>(null);
  const [calculatedFieldDefinitions, setCalculatedFieldDefinitions] = useState<CalculatedFieldDefinition[]>([]);
  const [transformedFieldDefinitions, setTransformedFieldDefinitions] = useState<TransformedFieldDefinition[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [hiddenVizIds, setHiddenVizIds] = useState<Set<string>>(new Set());
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [lastAddedTableId, setLastAddedTableId] = useState<string | null>(null);
  const [staticMeasures, setStaticMeasures] = useState<Record<string, string | number>>({});
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({});

  const calculatedFields = useMemo(() => calculatedFieldDefinitions.map(def => def.name), [calculatedFieldDefinitions]);
  const transformedFields = useMemo(() => transformedFieldDefinitions.map(def => def.name), [transformedFieldDefinitions]);
  const allMeasureFields = useMemo(() => [
    ...Object.keys(staticMeasures),
    ...calculatedFields, 
    ...transformedFields
  ], [staticMeasures, calculatedFields, transformedFields]);

  useEffect(() => {
    const allMeasureDefinitions = [
        ...calculatedFieldDefinitions.map(d => ({ ...d, type: 'calculated' as const })),
        ...transformedFieldDefinitions.map(d => ({ ...d, type: 'transformed' as const }))
    ];

    if (allMeasureDefinitions.length === 0) return;

    const nodes = allMeasureDefinitions.map(d => d.name);
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    nodes.forEach(node => {
        adj[node] = [];
        inDegree[node] = 0;
    });

    allMeasureDefinitions.forEach(def => {
        const dependencies: string[] = [];
        if (def.type === 'calculated') {
            if (def.op1.type === 'field' && nodes.includes(String(def.op1.value))) dependencies.push(String(def.op1.value));
            if (def.op2.type === 'field' && nodes.includes(String(def.op2.value))) dependencies.push(String(def.op2.value));
        } else { // transformed
            if (nodes.includes(def.sourceField)) dependencies.push(def.sourceField);
        }

        dependencies.forEach(dep => {
            adj[dep].push(def.name);
            inDegree[def.name]++;
        });
    });

    const queue = nodes.filter(node => inDegree[node] === 0);
    const sortedMeasures: string[] = [];

    while (queue.length > 0) {
        const u = queue.shift()!;
        sortedMeasures.push(u);
        (adj[u] || []).forEach(v => {
            inDegree[v]--;
            if (inDegree[v] === 0) queue.push(v);
        });
    }

    if (sortedMeasures.length !== nodes.length) {
        toast.error("Circular dependency detected in measures. Some calculations may not work correctly.");
    }
  }, [calculatedFieldDefinitions, transformedFieldDefinitions]);

  const finalDatasets = useMemo(() => {
    const allMeasureDefinitions = [
        ...calculatedFieldDefinitions.map(d => ({ ...d, type: 'calculated' as const })),
        ...transformedFieldDefinitions.map(d => ({ ...d, type: 'transformed' as const }))
    ];

    if (allMeasureDefinitions.length === 0) {
        return datasets.map(ds => ({ ...ds, fields: Array.from(new Set(ds.fields)) }));
    }

    const nodes = allMeasureDefinitions.map(d => d.name);
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    nodes.forEach(node => {
        adj[node] = [];
        inDegree[node] = 0;
    });

    allMeasureDefinitions.forEach(def => {
        const dependencies: string[] = [];
        if (def.type === 'calculated') {
            if (def.op1.type === 'field' && nodes.includes(String(def.op1.value))) dependencies.push(String(def.op1.value));
            if (def.op2.type === 'field' && nodes.includes(String(def.op2.value))) dependencies.push(String(def.op2.value));
        } else { // transformed
            if (nodes.includes(def.sourceField)) dependencies.push(def.sourceField);
        }
        dependencies.forEach(dep => {
            adj[dep].push(def.name);
            inDegree[def.name]++;
        });
    });

    const queue = nodes.filter(node => inDegree[node] === 0);
    const sortedMeasures: string[] = [];
    while (queue.length > 0) {
        const u = queue.shift()!;
        sortedMeasures.push(u);
        (adj[u] || []).forEach(v => {
            inDegree[v]--;
            if (inDegree[v] === 0) queue.push(v);
        });
    }

    if (sortedMeasures.length !== nodes.length) {
        return datasets; // Abort on cycle
    }

    return datasets.map(ds => {
        let data = [...ds.data];
        const fields = new Set(ds.fields);

        sortedMeasures.forEach(measureName => {
            const def = allMeasureDefinitions.find(d => d.name === measureName);
            if (!def) return;

            const hasDependencies = (def.type === 'calculated')
                ? (def.op1.type !== 'field' || fields.has(String(def.op1.value))) && (def.op2.type !== 'field' || fields.has(String(def.op2.value)))
                : (() => {
                    // For COMBINE_WITH_LITERALS, depend on all referenced column parts instead of only sourceField
                    // @ts-ignore - def may carry combineParts when type is transformed
                    if (def.transformation === 'COMBINE_WITH_LITERALS' && Array.isArray((def as any).combineParts)) {
                      const parts = (def as any).combineParts as Array<{ mode: 'column' | 'literal'; field?: string }>;
                      const needed = parts.filter(p => p.mode === 'column' && p.field).map(p => String(p.field));
                      return needed.length === 0 ? true : needed.every(f => fields.has(f));
                    }
                    // Respect dataset scoping: if a transformed field has datasetId and it's not this dataset, skip
                    const scopedId = (def as any).datasetId as string | undefined;
                    if (scopedId && ds.id !== scopedId) return false;
                    return fields.has(def.sourceField);
                  })();

            if (hasDependencies) {
                console.log('Applying transformation:', def.name, 'to dataset:', ds.name, 'type:', def.type);
                if (def.type === 'calculated') {
                    data = applyCalculations(data, [def], parameters, parameterValues);
                } else {
                    // If transformed and scoped, ensure we only apply to the scoped dataset
                    const scopedId = (def as any).datasetId as string | undefined;
                    if (scopedId && ds.id !== scopedId) {
                      // skip applying to this dataset
                    } else {
                      data = applyTransformations(data, [def]);
                    }
                }
                fields.add(def.name);
            } else {
                console.log('Skipping transformation (missing dependencies):', def.name, 'for dataset:', ds.name);
            }
        });
        
        return { ...ds, data, fields: Array.from(fields) };
    });
  }, [datasets, calculatedFieldDefinitions, transformedFieldDefinitions, parameters, parameterValues]);

  const filteredDatasets = useMemo(() => {
    const datasetsById = new Map(finalDatasets.map(ds => [ds.id, ds]));
    const filteredResults = new Map<string, Record<string, any>[]>();

    if (Object.keys(activeFilters).length === 0) {
      for (const ds of finalDatasets) {
        filteredResults.set(ds.id, ds.data);
      }
      return filteredResults;
    }

    for (const ds of finalDatasets) {
      let currentData = ds.data;
      for (const [field, filterInfo] of Object.entries(activeFilters)) {
        if (filterInfo.datasetId === ds.id && ds.fields.includes(field)) {
          currentData = currentData.filter(row => filterInfo.values.has(row[field]));
        }
      }
      filteredResults.set(ds.id, currentData);
    }

    for (const rel of relationships) {
      const fromTableFilteredData = filteredResults.get(rel.fromTable);
      const toTableFilteredData = filteredResults.get(rel.toTable);

      if (fromTableFilteredData && toTableFilteredData) {
        const fromTableOriginalData = datasetsById.get(rel.fromTable)?.data;
        const toTableOriginalData = datasetsById.get(rel.toTable)?.data;

        if (fromTableOriginalData && fromTableFilteredData.length < fromTableOriginalData.length) {
          const validJoinKeys = new Set(fromTableFilteredData.map(row => row[rel.fromColumn]));
          const propagatedFilterResult = toTableFilteredData.filter(row => validJoinKeys.has(row[rel.toColumn]));
          filteredResults.set(rel.toTable, propagatedFilterResult);
        }
        
        if (toTableOriginalData && toTableFilteredData.length < toTableOriginalData.length) {
          const validJoinKeys = new Set(toTableFilteredData.map(row => row[rel.toColumn]));
          const propagatedFilterResult = fromTableFilteredData.filter(row => validJoinKeys.has(row[rel.fromColumn]));
          filteredResults.set(rel.fromTable, propagatedFilterResult);
        }
      }
    }

    return filteredResults;
  }, [finalDatasets, activeFilters, relationships]);

  const fieldsForDialogs = useMemo(() => {
    const allFields = new Set<string>();
    finalDatasets.forEach(ds => {
      ds.fields.forEach(f => allFields.add(f));
    });
    allMeasureFields.forEach(m => allFields.add(m));
    return Array.from(allFields).sort();
  }, [finalDatasets, allMeasureFields]);

  const handleSaveRelationship = (relationship: Relationship) => {
    setRelationships(prev => [...prev, relationship]);
    toast.success("Relationship created.");
  };

  const handleDataParsed = (data: Record<string, any>[], fields: string[], name: string) => {
    const processedData = [...data];
    const dateFieldsToConvert: string[] = [];

    for (const field of fields) {
      const sample = processedData
        .map(row => row[field])
        .filter(v => v != null && v !== '')
        .slice(0, 100);

      if (sample.length < 10) continue;

      let dateCount = 0;
      let numberCount = 0;
      let integerCount = 0;

      for (const value of sample) {
        if (typeof value === 'number') {
          numberCount++;
          if (value % 1 === 0) integerCount++;
        }
        if (isDate(value, field)) {
          dateCount++;
        }
      }

      const isAllIntegers = numberCount === sample.length && integerCount === sample.length;
      const hasDateHint = field.toLowerCase().includes('date') || field.toLowerCase().includes('day');

      if ((dateCount / sample.length > 0.9) && (!isAllIntegers || hasDateHint)) {
        dateFieldsToConvert.push(field);
      }
    }

    if (dateFieldsToConvert.length > 0) {
      for (let i = 0; i < processedData.length; i++) {
        for (const field of dateFieldsToConvert) {
          const date = parseDate(processedData[i][field], field);
          if (date) {
            const year = date.getUTCFullYear();
            const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = date.getUTCDate().toString().padStart(2, '0');
            processedData[i][field] = `${year}-${month}-${day}`;
          }
        }
      }
      toast.info(`Auto-converted ${dateFieldsToConvert.length} column(s) to standard date format.`);
    }

    const newDataset: Dataset = { id: nanoid(), name, data: processedData, fields };
    setDatasets(prev => {
      const newDatasets = [...prev, newDataset];
      if (newDatasets.length === 2) {
        const bestRel = findBestRelationship(newDatasets[0], newDatasets[1]);
        if (bestRel) {
          const newRelationship: Relationship = { ...bestRel, id: nanoid() };
          setRelationships(prevRels => [...prevRels, newRelationship]);
          const fromTableName = newDatasets.find(d => d.id === newRelationship.fromTable)?.name;
          const toTableName = newDatasets.find(d => d.id === newRelationship.toTable)?.name;
          toast.success(`Auto-detected relationship between "${fromTableName}" and "${toTableName}" on "${newRelationship.fromColumn}".`);
        }
      }
      return newDatasets;
    });
    toast.success(`Dataset "${name}" loaded successfully.`);
  };

  const handleFilterChange = (datasetId: string, field: string, selectedValues: Set<any>) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (selectedValues.size === 0) {
        delete newFilters[field];
      } else {
        newFilters[field] = { datasetId, values: selectedValues };
      }
      return newFilters;
    });
  };

  const loadDashboard = (dashboard: { id: string, name: string, configuration: any }) => {
    let config = dashboard.configuration;
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } 
      catch (e) { toast.error("Could not load dashboard due to invalid format."); return; }
    }
    setDatasets(config?.datasets || []);
    setCalculatedFieldDefinitions(config?.calculatedFieldDefinitions || []);
    setTransformedFieldDefinitions(config?.transformedFieldDefinitions || []);
    setStaticMeasures(config?.staticMeasures || {});
    setVisualizations(config?.visualizations || []);
    setCanvasBackground(config?.canvasBackground || "");
    setDashboardInfo({ id: dashboard.id, name: dashboard.name });
    setRelationships(config?.relationships || []);
    setSelectedVizId(null);
    setActiveFilters({});
    setHiddenVizIds(new Set(config?.hiddenVizIds || []));
    setParameters(config?.parameters || []);
    const initialValues: Record<string, any> = {};
    (config?.parameters || []).forEach((p: Parameter) => {
      initialValues[p.id] = p.config.defaultValue;
    });
    setParameterValues(config?.parameterValues || initialValues);
  };

  const clearDashboard = () => {
    setDatasets([]);
    setVisualizations([]);
    setCanvasBackground("");
    setDashboardInfo(null);
    setSelectedVizId(null);
    setActiveFilters({});
    setCalculatedFieldDefinitions([]);
    setTransformedFieldDefinitions([]);
    setStaticMeasures({});
    setRelationships([]);
    setHiddenVizIds(new Set());
    setParameters([]);
    setParameterValues({});
  };

  const handleSaveCalculatedField = (name: string, op1: Operand, operator: string, op2: Operand) => {
    const isStatic = op1.type === 'number' && op2.type === 'number' && op2.value === 0 && operator === '+';
    if (isStatic) {
      setStaticMeasures(prev => ({ ...prev, [name]: op1.value }));
      toast.success(`Static measure "${name}" added.`);
    } else {
      setCalculatedFieldDefinitions(prev => [...prev, { name, op1, operator, op2 }]);
      toast.success(`Calculated field "${name}" added.`);
    }
  };

  const handleSaveTransformedField = (
    datasetId: string,
    name: string,
    sourceField: string,
    transformation: TransformationType,
    value?: string,
    excludeByCategoryField?: string,
    excludeByCategoryValues?: string[],
    filterOnField?: string,
    valuesToFilter?: string[],
    aggregation?: import("@/types/visualizations").AggregationType,
    groupByFields?: string[],
    conditionalThenMode?: 'column' | 'literal',
    conditionalThenField?: string,
    conditionalThenValue?: string,
    conditionalElseMode?: 'column' | 'literal',
    conditionalElseField?: string,
    conditionalElseValue?: string,
    combineParts?: Array<{ mode: 'column' | 'literal'; field?: string; value?: string }>,
  ) => {
    const newDef = {
      datasetId,
      name,
      sourceField,
      transformation,
      value,
      excludeByCategoryField,
      excludeByCategoryValues,
      filterOnField,
      valuesToFilter,
      aggregation,
      groupByFields,
      conditionalThenMode,
      conditionalThenField,
      conditionalThenValue,
      conditionalElseMode,
      conditionalElseField,
      conditionalElseValue,
      combineParts,
    };
    console.log('Saving transformed field definition:', newDef);
    setTransformedFieldDefinitions(prev => [...prev, newDef]);
    toast.success(`Transformed field "${name}" added.`);
  };

  const handleToggleVisibility = (vizId: string) => {
    setHiddenVizIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vizId)) newSet.delete(vizId);
      else newSet.add(vizId);
      return newSet;
    });
  };

  const addComputedColumns = (datasetId: string, columns: { name: string; compute: (row: Record<string, any>) => any }[]) => {
    setDatasets(prev =>
      prev.map(ds => {
        if (ds.id !== datasetId) return ds;
        
        const newFields = new Set(ds.fields);
        columns.forEach(col => newFields.add(col.name));

        const newData = ds.data.map(row => {
          const updatedRow = { ...row };
          columns.forEach(col => {
            if (!(col.name in updatedRow)) {
              updatedRow[col.name] = col.compute(row);
            }
          });
          return updatedRow;
        });
        return { ...ds, fields: Array.from(newFields), data: newData };
      })
    );
  };

  const handleSaveDateColumns = (datasetId: string, sourceField: string, columnsToCreate: Set<string>) => {
    const columnDefinitions: { name: string; compute: (row: Record<string, any>) => any }[] = [];

    const columnMap = {
        'Year': (d: Date) => getYear(d),
        'Quarter': (d: Date) => `Q${getQuarter(d)}`,
        'MonthNumber': (d: Date) => getMonth(d) + 1,
        'MonthName': (d: Date) => format(d, 'MMMM'),
        'DayOfWeek': (d: Date) => format(d, 'eeee'),
        'DayOfMonth': (d: Date) => getDate(d),
        'DayOfYear': (d: Date) => getDayOfYear(d),
        'WeekOfYear': (d: Date) => getWeek(d),
    };

    columnsToCreate.forEach(colName => {
        const key = colName as keyof typeof columnMap;
        if (key in columnMap) {
            columnDefinitions.push({
                name: colName,
                compute: (row) => {
                    const date = parseDate(row[sourceField], sourceField);
                    return date ? columnMap[key](date) : null;
                }
            });
        }
    });

    addComputedColumns(datasetId, columnDefinitions);
    
    const targetDataset = datasets.find(d => d.id === datasetId);
    toast.success(`Date columns added to "${targetDataset?.name}"`);
  };

  const handleSaveDateTable = (name: string, options: { mode: 'auto', fiscalYearEndMonth?: number, dateFormat: DateFormat, columns: Set<string> } | { mode: 'manual', sourceDatasetIds: string[], fiscalYearEndMonth?: number, dateFormat: DateFormat, columns: Set<string> }) => {
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    const MIN_YEAR = 1900;
    const MAX_YEAR = 2100;

    const datasetsToScan = options.mode === 'auto' 
      ? datasets 
      : datasets.filter(d => options.sourceDatasetIds.includes(d.id));

    if (datasetsToScan.length === 0) {
      toast.warning("No datasets selected or available to scan for dates.");
      return;
    }

    datasetsToScan.forEach(ds => {
      const potentialDateFields = ds.fields.filter(field => {
        const sampleData = ds.data.slice(0, 100).map(row => row[field]).filter(v => v != null && v !== '');
        if (sampleData.length < 5) return false;
        const dateCount = sampleData.filter(v => isDate(v, field)).length;
        return (dateCount / sampleData.length) > 0.9;
      });

      if (potentialDateFields.length === 0) {
        return;
      }

      for (const row of ds.data) {
        for (const field of potentialDateFields) {
          const date = parseDate(row[field], field);
          if (date && date.getUTCFullYear() >= MIN_YEAR && date.getUTCFullYear() <= MAX_YEAR) {
            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
          }
        }
      }
    });

    if (!minDate || !maxDate) {
      toast.warning("Could not generate date table. No valid dates found in the selected sources within the range 1900-2100.");
      return;
    }

    console.log("Detected date range for table generation:", minDate, maxDate);

    if (options.fiscalYearEndMonth) {
      const fyEnd = options.fiscalYearEndMonth;
      if (minDate.getUTCMonth() + 1 > fyEnd) {
        minDate = new Date(Date.UTC(minDate.getUTCFullYear(), fyEnd, 1));
      } else {
        minDate = new Date(Date.UTC(minDate.getUTCFullYear() - 1, fyEnd, 1));
      }
      if (maxDate.getUTCMonth() + 1 > fyEnd) {
        maxDate = new Date(Date.UTC(maxDate.getUTCFullYear() + 1, fyEnd, 0));
      } else {
        maxDate = new Date(Date.UTC(maxDate.getUTCFullYear(), fyEnd, 0));
      }
    }

    const tableData = generateDateTableFromRange(minDate, maxDate, options.dateFormat, options.columns, options.fiscalYearEndMonth);

    if (tableData.data.length === 0) {
      toast.warning("Could not generate date table. No valid dates found in the calculated range.");
      return;
    }
    const newDataset: Dataset = { id: nanoid(), name, data: tableData.data, fields: tableData.fields };
    setDatasets(prev => [...prev, newDataset]);
    setLastAddedTableId(newDataset.id);
    toast.success(`Date table "${name}" generated successfully.`);
  };

  const handleSaveNewTable = (name: string, columns: { name: string; type: string }[]) => {
    const newDataset: Dataset = {
      id: nanoid(),
      name,
      data: [],
      fields: columns.map(c => c.name),
    };
    setDatasets(prev => [...prev, newDataset]);
    setLastAddedTableId(newDataset.id);
    toast.success(`Table "${name}" created successfully.`);
  };

  const handleDeleteRelationship = (relationshipId: string) => {
    setRelationships(prev => prev.filter(r => r.id !== relationshipId));
    toast.success("Relationship deleted.");
  };

  const handlePivot = (sourceDatasetId: string, rowField: string, columnField: string, valueField: string, newTableName: string) => {
    const sourceDataset = datasets.find(ds => ds.id === sourceDatasetId);
    if (!sourceDataset) {
      toast.error("Source dataset not found.");
      return;
    }
    const newDataset = pivot(sourceDataset, rowField, columnField, valueField, newTableName);
    
    const newRelationships: Relationship[] = [];
    for (const existingDs of datasets) {
      const bestRel = findBestRelationship(newDataset, existingDs);
      if (bestRel) {
        newRelationships.push({ ...bestRel, id: nanoid() });
      }
    }

    setDatasets(prev => [...prev, newDataset]);
    setLastAddedTableId(newDataset.id);
    if (newRelationships.length > 0) {
      setRelationships(prevRels => [...prevRels, ...newRelationships]);
      newRelationships.forEach(rel => {
        const fromTableName = datasets.find(d => d.id === rel.fromTable)?.name || newDataset.name;
        const toTableName = datasets.find(d => d.id === rel.toTable)?.name || newDataset.name;
        toast.success(`Auto-detected relationship between "${fromTableName}" and "${toTableName}".`);
      });
    }

    toast.success(`Table "${newTableName}" created successfully.`);
  };

  const handleUnpivot = (sourceDatasetId: string, columnsToUnpivot: string[], attributeCol: string, valueCol: string, newTableName: string) => {
    const sourceDataset = datasets.find(ds => ds.id === sourceDatasetId);
    if (!sourceDataset) {
      toast.error("Source dataset not found.");
      return;
    }
    const newDataset = unpivot(sourceDataset, columnsToUnpivot, attributeCol, valueCol, newTableName);
    
    const newRelationships: Relationship[] = [];
    for (const existingDs of datasets) {
      const bestRel = findBestRelationship(newDataset, existingDs);
      if (bestRel) {
        newRelationships.push({ ...bestRel, id: nanoid() });
      }
    }

    setDatasets(prev => [...prev, newDataset]);
    setLastAddedTableId(newDataset.id);
    if (newRelationships.length > 0) {
      setRelationships(prevRels => [...prevRels, ...newRelationships]);
      newRelationships.forEach(rel => {
        const fromTableName = datasets.find(d => d.id === rel.fromTable)?.name || newDataset.name;
        const toTableName = datasets.find(d => d.id === rel.toTable)?.name || newDataset.name;
        toast.success(`Auto-detected relationship between "${fromTableName}" and "${toTableName}".`);
      });
    }

    toast.success(`Table "${newTableName}" created successfully.`);
  };

  const handleDeleteColumns = (datasetId: string, columnsToDelete: string[]) => {
    setDatasets(prev =>
      prev.map(ds => {
        if (ds.id !== datasetId) return ds;

        const newFields = ds.fields.filter(f => !columnsToDelete.includes(f));
        const newData = ds.data.map(row => {
          const newRow = { ...row };
          columnsToDelete.forEach(col => {
            delete newRow[col];
          });
          return newRow;
        });

        return { ...ds, fields: newFields, data: newData };
      })
    );
    toast.success(`${columnsToDelete.length} column(s) deleted.`);
  };

  const handleDeleteOtherColumns = (datasetId: string, columnsToKeep: string[]) => {
    setDatasets(prev =>
      prev.map(ds => {
        if (ds.id !== datasetId) return ds;
        const newData = ds.data.map(row => {
          const newRow: Record<string, any> = {};
          columnsToKeep.forEach(col => {
            newRow[col] = row[col];
          });
          return newRow;
        });
        return { ...ds, fields: columnsToKeep, data: newData };
      })
    );
    toast.success(`Other columns deleted.`);
  };

  const handleDeleteDataset = (datasetId: string) => {
    const datasetName = datasets.find(d => d.id === datasetId)?.name;
    setDatasets(prev => prev.filter(d => d.id !== datasetId));
    setVisualizations(prev => prev.filter(v => v.datasetId !== datasetId));
    setRelationships(prev => prev.filter(r => r.fromTable !== datasetId && r.toTable !== datasetId));
    toast.success(`Table "${datasetName}" and its visuals have been deleted.`);
  };

  const handleDeleteMeasure = (measureName: string) => {
    let measureFound = false;
    if (Object.prototype.hasOwnProperty.call(staticMeasures, measureName)) {
      setStaticMeasures(prev => {
        const newMeasures = { ...prev };
        delete newMeasures[measureName];
        return newMeasures;
      });
      measureFound = true;
    }
    
    const isCalculated = calculatedFieldDefinitions.some(def => def.name === measureName);
    if (isCalculated) {
      setCalculatedFieldDefinitions(prev => prev.filter(def => def.name !== measureName));
      measureFound = true;
    } else if (!measureFound) {
      setTransformedFieldDefinitions(prev => prev.filter(def => def.name !== measureName));
      measureFound = true;
    }

    if (!measureFound) return;

    setVisualizations(prev => prev.map(viz => {
      const newOptions = JSON.parse(JSON.stringify(viz.options));
      let updated = false;

      const cleanMapping = (mapping: any) => {
        const compositeKeyFields = ['nameKey', 'valueKey', 'secondaryValueKey', 'slicerKey'];
        compositeKeyFields.forEach(key => {
            if (typeof mapping[key] === 'string') {
                const parsedKey = parseCompositeKey(mapping[key]);
                if (parsedKey && parsedKey.field === measureName) {
                    mapping[key] = null;
                    updated = true;
                }
            }
        });
    
        if (Array.isArray(mapping.valueKeys)) {
            const originalLength = mapping.valueKeys.length;
            mapping.valueKeys = mapping.valueKeys.filter((vk: any) => {
                if (typeof vk.field === 'string') {
                    return parseCompositeKey(vk.field)?.field !== measureName;
                }
                return true;
            });
            if (mapping.valueKeys.length < originalLength) {
                updated = true;
            }
        }
      };

      cleanMapping(newOptions.dataMapping);
      
      return updated ? { ...viz, options: newOptions } : viz;
    }));

    toast.success(`Measure "${measureName}" has been deleted.`);
  };

  const handleChangeColumnType = (datasetId: string, columnName: string, newType: 'whole' | 'decimal' | 'text' | 'date') => {
    setDatasets(prev =>
      prev.map(ds => {
        if (ds.id !== datasetId) return ds;

        const newData = ds.data.map(row => {
          const originalValue = row[columnName];
          let newValue: any = null;

          if (originalValue !== null && originalValue !== undefined) {
            switch (newType) {
              case 'whole':
                const intVal = parseInt(String(originalValue).replace(/[^0-9-]/g, ''), 10);
                newValue = isNaN(intVal) ? null : intVal;
                break;
              case 'decimal':
                const floatVal = parseFloat(String(originalValue).replace(/[^0-9.-]/g, ''));
                newValue = isNaN(floatVal) ? null : floatVal;
                break;
              case 'text':
                newValue = String(originalValue);
                break;
              case 'date':
                const date = parseDate(originalValue, columnName);
                if (date) {
                  const year = date.getUTCFullYear();
                  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                  const day = date.getUTCDate().toString().padStart(2, '0');
                  newValue = `${year}-${month}-${day}`;
                }
                break;
            }
          }
          return { ...row, [columnName]: newValue };
        });
        
        toast.success(`Column "${columnName}" in "${ds.name}" converted to ${newType}.`);
        return { ...ds, data: newData };
      })
    );
  };

  const handleRenameDataset = (datasetId: string, newName: string) => {
    if (datasets.some(ds => ds.name === newName && ds.id !== datasetId)) {
      toast.error(`A table named "${newName}" already exists.`);
      return;
    }
    setDatasets(prev =>
      prev.map(ds => (ds.id === datasetId ? { ...ds, name: newName } : ds))
    );
    toast.success(`Table renamed to "${newName}".`);
  };

  const handleMergeQueries = (leftTableId: string, leftColumn: string, rightTableId: string, rightColumn: string, joinType: JoinType, mergeDestination: MergeDestination, columnsToMerge: string[], newTableName?: string) => {
    const leftTable = datasets.find(d => d.id === leftTableId);
    const rightTable = datasets.find(d => d.id === rightTableId);

    if (!leftTable || !rightTable) {
      toast.error("One or both tables not found.");
      return;
    }

    const leftTableMap = new Map<any, Record<string, any>[]>();
    leftTable.data.forEach(row => {
        const key = row[leftColumn];
        if (!leftTableMap.has(key)) leftTableMap.set(key, []);
        leftTableMap.get(key)!.push(row);
    });

    const rightTableMap = new Map<any, Record<string, any>[]>();
    rightTable.data.forEach(row => {
        const key = row[rightColumn];
        if (!rightTableMap.has(key)) rightTableMap.set(key, []);
        rightTableMap.get(key)!.push(row);
    });

    const fieldsToMerge: { original: string, new: string }[] = [];
    const leftFields = new Set(leftTable.fields);
    columnsToMerge.forEach(field => {
        let newFieldName = field;
        if (leftFields.has(field)) {
            newFieldName = `${rightTable.name}.${field}`;
        }
        fieldsToMerge.push({ original: field, new: newFieldName });
    });

    const nullsForRight = fieldsToMerge.reduce((acc, field) => ({ ...acc, [field.new]: null }), {});
    const nullsForLeft = leftTable.fields.reduce((acc, field) => ({ ...acc, [field]: null }), {});

    let mergedData: Record<string, any>[] = [];
    const allKeys = new Set([...leftTableMap.keys(), ...rightTableMap.keys()]);

    switch (joinType) {
        case 'left':
            leftTable.data.forEach(leftRow => {
                const joinKey = leftRow[leftColumn];
                const rightRows = rightTableMap.get(joinKey);
                if (rightRows) {
                    rightRows.forEach(rightRow => {
                        const newRow = { ...leftRow };
                        fieldsToMerge.forEach(f => { newRow[f.new] = rightRow[f.original]; });
                        mergedData.push(newRow);
                    });
                } else {
                    mergedData.push({ ...leftRow, ...nullsForRight });
                }
            });
            break;
        case 'right':
            rightTable.data.forEach(rightRow => {
                const joinKey = rightRow[rightColumn];
                const leftRows = leftTableMap.get(joinKey);
                if (leftRows) {
                    leftRows.forEach(leftRow => {
                        const newRow = { ...leftRow };
                        fieldsToMerge.forEach(f => { newRow[f.new] = rightRow[f.original]; });
                        mergedData.push(newRow);
                    });
                } else {
                    const newRow = { ...nullsForLeft };
                    fieldsToMerge.forEach(f => { newRow[f.new] = rightRow[f.original]; });
                    newRow[leftColumn] = joinKey;
                    mergedData.push(newRow);
                }
            });
            break;
        case 'inner':
            leftTable.data.forEach(leftRow => {
                const joinKey = leftRow[leftColumn];
                const rightRows = rightTableMap.get(joinKey);
                if (rightRows) {
                    rightRows.forEach(rightRow => {
                        const newRow = { ...leftRow };
                        fieldsToMerge.forEach(f => { newRow[f.new] = rightRow[f.original]; });
                        mergedData.push(newRow);
                    });
                }
            });
            break;
        case 'full':
            allKeys.forEach(key => {
                const leftRows = leftTableMap.get(key);
                const rightRows = rightTableMap.get(key);
                if (leftRows && rightRows) {
                    leftRows.forEach(leftRow => {
                        rightRows.forEach(rightRow => {
                            const newRow = { ...leftRow };
                            fieldsToMerge.forEach(f => { newRow[f.new] = rightRow[f.original]; });
                            mergedData.push(newRow);
                        });
                    });
                } else if (leftRows) {
                    leftRows.forEach(leftRow => {
                        mergedData.push({ ...leftRow, ...nullsForRight });
                    });
                } else if (rightRows) {
                    rightRows.forEach(rightRow => {
                        const newRow = { ...nullsForLeft };
                        fieldsToMerge.forEach(f => { newRow[f.new] = rightRow[f.original]; });
                        newRow[leftColumn] = key;
                        mergedData.push(newRow);
                    });
                }
            });
            break;
    }

    const finalFields = Array.from(new Set(mergedData.flatMap(row => Object.keys(row))));

    if (mergeDestination === 'new') {
      const newDataset: Dataset = { id: nanoid(), name: newTableName!, data: mergedData, fields: finalFields };
      setDatasets(prev => [...prev, newDataset]);
      setLastAddedTableId(newDataset.id);
      toast.success(`Tables merged into "${newTableName}".`);
    } else {
      const targetTableId = leftTableId;
      const targetTableName = leftTable.name;
      setDatasets(prev => prev.map(ds => {
          if (ds.id === targetTableId) {
              return { ...ds, data: mergedData, fields: finalFields };
          }
          return ds;
      }));
      toast.success(`Data merged into "${targetTableName}".`);
    }
  };

  const handleRemoveDuplicates = (datasetId: string, columnName: string) => {
    setDatasets(prev =>
      prev.map(ds => {
        if (ds.id !== datasetId) return ds;

        const seen = new Set();
        const newData = ds.data.filter(row => {
          const value = row[columnName];
          if (seen.has(value)) {
            return false;
          } else {
            seen.add(value);
            return true;
          }
        });

        toast.success(`Duplicates removed from "${ds.name}" based on "${columnName}". ${ds.data.length - newData.length} rows removed.`);
        return { ...ds, data: newData };
      })
    );
  };

  const handleDuplicateTable = (datasetId: string) => {
    const sourceDataset = datasets.find(ds => ds.id === datasetId);
    if (!sourceDataset) {
      toast.error("Source table not found.");
      return;
    }

    const newDataset: Dataset = {
      id: nanoid(),
      name: `${sourceDataset.name} (Copy)`,
      data: JSON.parse(JSON.stringify(sourceDataset.data)),
      fields: [...sourceDataset.fields],
    };

    setDatasets(prev => [...prev, newDataset]);
    setLastAddedTableId(newDataset.id);
    toast.success(`Table "${sourceDataset.name}" duplicated.`);
  };

  const handleSaveParameter = (parameter: Omit<Parameter, 'id'>) => {
    const newParameter: Parameter = {
      ...parameter,
      id: nanoid(),
    };
    setParameters(prev => [...prev, newParameter]);
    setParameterValues(prev => ({ ...prev, [newParameter.id]: newParameter.config.defaultValue }));

    const baseOptions = {
      general: { backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 8, boxShadow: 'none' as const, backgroundOpacity: 1, borderWidth: 1 },
      title: { text: parameter.name, fontSize: 16, color: 'hsl(var(--foreground))', alignment: 'left' as const },
      dataLabels: { show: false, color: 'hsl(var(--foreground))', fontSize: 12 },
      legend: { show: false, position: 'top' as const },
      xAxis: { show: false, color: 'hsl(var(--muted-foreground))', showGrid: false },
      yAxis: { show: false, color: 'hsl(var(--muted-foreground))', showGrid: false },
      colors: { primary: '#8884d8', secondary: '#82ca9d' },
      dataMapping: { 
        nameKey: null, valueKey: null, valueKeys: [], secondaryValueKey: null, 
        valueKeyAggregation: 'NONE' as const, nameKeyAggregation: 'NONE' as const, slicerKey: null,
      },
    };

    const newViz: Visualization = {
      id: nanoid(),
      type: 'Parameter',
      x: 20,
      y: 20,
      width: 250,
      height: 80,
      options: baseOptions as VisualizationOptions,
      parameterId: newParameter.id,
    };
    setVisualizations(prev => [...prev, newViz]);
    setSelectedVizId(newViz.id);

    toast.success(`Parameter "${parameter.name}" created.`);
  };

  const handleParameterValueChange = (parameterId: string, value: any) => {
    setParameterValues(prev => ({ ...prev, [parameterId]: value }));
  };

  const value = {
    datasets, setDatasets, visualizations, setVisualizations, selectedVizId, setSelectedVizId,
    canvasBackground, setCanvasBackground, activeFilters, setActiveFilters, dashboardInfo, setDashboardInfo,
    calculatedFieldDefinitions, setCalculatedFieldDefinitions, transformedFieldDefinitions, setTransformedFieldDefinitions,
    isLocked, setIsLocked, hiddenVizIds, setHiddenVizIds, relationships, staticMeasures, parameters, parameterValues, finalDatasets, filteredDatasets, allMeasureFields, fieldsForDialogs,
    lastAddedTableId,
    handleDataParsed, handleFilterChange, loadDashboard, clearDashboard, handleSaveCalculatedField,
    handleSaveTransformedField, handleToggleVisibility, handleSaveDateColumns, handleSaveDateTable,
    handleSaveNewTable, handleSaveRelationship, handleDeleteRelationship, handlePivot, handleUnpivot,
    handleDeleteColumns, handleDeleteOtherColumns, handleDeleteDataset, handleDeleteMeasure, handleChangeColumnType,
    handleRenameDataset, handleMergeQueries, handleRemoveDuplicates, handleDuplicateTable,
    handleSaveParameter, handleParameterValueChange,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
};