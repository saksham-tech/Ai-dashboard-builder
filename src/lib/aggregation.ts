import { type AggregationType, type ValueKeyConfig } from "@/types/visualizations";

export const aggregateData = (
  data: Record<string, any>[],
  groupKey: string,
  valueKey: string,
  aggregation: AggregationType,
  topN?: { enabled: boolean; count: number; order: 'asc' | 'desc' },
  sortOrder?: 'asc' | 'desc'
): Record<string, any>[] => {
  // Filter out rows where the value is null, as this indicates it's been excluded by a transformation.
  const filteredData = data.filter(row => row[valueKey] !== null && row[valueKey] !== undefined);

  if (aggregation === 'NONE') {
    const rawData = filteredData.map(row => ({
      name: typeof row[groupKey] === 'object' ? JSON.stringify(row[groupKey]) : row[groupKey],
      value: row[valueKey]
    }));

    if (topN && topN.enabled && topN.count > 0 && rawData.length > topN.count) {
      rawData.sort((a, b) => {
        const valA = typeof a.value === 'number' ? a.value : 0;
        const valB = typeof b.value === 'number' ? b.value : 0;
        return topN.order === 'desc' ? valB - valA : valA - valB;
      });
      return rawData.slice(0, topN.count);
    }
    return rawData;
  }

  const grouped = filteredData.reduce((acc, row) => {
    const rawKey = row[groupKey];
    if (rawKey === undefined || rawKey === null) return acc;

    const key = typeof rawKey === 'object' ? JSON.stringify(rawKey) : String(rawKey);

    if (!acc[key]) {
      acc[key] = { values: [], originalKey: rawKey };
    }
    acc[key].values.push(row[valueKey]);
    return acc;
  }, {} as Record<string, { values: any[], originalKey: any }>);

  let aggregatedResults = Object.entries(grouped).map(([key, group]) => {
    let result: number;
    const numericValues = group.values.filter(v => typeof v === 'number' && !isNaN(v));

    switch (aggregation) {
      case 'SUM':
        result = numericValues.reduce((sum, val) => sum + val, 0);
        break;
      case 'AVERAGE':
        result = numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
        break;
      case 'COUNT':
        result = group.values.length;
        break;
      case 'COUNT_DISTINCT':
        const distinctValues = new Set(group.values.map(v => typeof v === 'object' ? JSON.stringify(v) : v));
        result = distinctValues.size;
        break;
      case 'MAX':
        result = numericValues.length > 0 ? Math.max(...numericValues) : 0;
        break;
      case 'MIN':
        result = numericValues.length > 0 ? Math.min(...numericValues) : 0;
        break;
      default:
        result = 0;
    }
    return { name: typeof group.originalKey === 'object' ? key : group.originalKey, value: result };
  });

  if (topN && topN.enabled && topN.count > 0 && aggregatedResults.length > topN.count) {
    aggregatedResults.sort((a, b) => {
      const valA = a.value || 0;
      const valB = b.value || 0;
      return topN.order === 'desc' ? valB - valA : valA - valB;
    });

    const topItems = aggregatedResults.slice(0, topN.count);
    const otherItems = aggregatedResults.slice(topN.count);

    if (otherItems.length > 0) {
      const othersCategory = {
        name: 'Others',
        value: otherItems.reduce((sum, item) => sum + (item.value || 0), 0)
      };
      return [...topItems, othersCategory];
    }
    return topItems;
  }

  if (sortOrder) {
    aggregatedResults.sort((a, b) => {
      const valA = a.value || 0;
      const valB = b.value || 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  } else {
    aggregatedResults.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  return aggregatedResults;
};

export const aggregateStackedData = (
  data: Record<string, any>[],
  groupKey: string,
  valueConfigs: ValueKeyConfig[],
  topN?: { enabled: boolean; count: number; by: string; order: 'asc' | 'desc' },
  sortOrder?: 'asc' | 'desc',
  sortBySeries?: string
): Record<string, any>[] => {
  const grouped = data.reduce((acc, row) => {
    const rawKey = row[groupKey];
    if (rawKey === undefined || rawKey === null) return acc;
    const key = typeof rawKey === 'object' ? JSON.stringify(rawKey) : String(rawKey);

    if (!acc[key]) {
      acc[key] = { originalKey: rawKey };
      valueConfigs.forEach(config => {
        acc[key][config.field] = [];
      });
    }
    valueConfigs.forEach(config => {
      acc[key][config.field].push(row[config.field]);
    });
    return acc;
  }, {} as Record<string, any>);

  let aggregatedResults = Object.values(grouped).map(group => {
    const result: Record<string, any> = { name: group.originalKey };
    valueConfigs.forEach(config => {
      const values = group[config.field];
      const numericValues = values.filter((v: any) => typeof v === 'number' && !isNaN(v));
      let aggregatedValue: number;

      switch (config.aggregation) {
        case 'SUM':
          aggregatedValue = numericValues.reduce((sum: number, val: number) => sum + val, 0);
          break;
        case 'AVERAGE':
          aggregatedValue = numericValues.length > 0 ? numericValues.reduce((sum: number, val: number) => sum + val, 0) / numericValues.length : 0;
          break;
        case 'COUNT':
          aggregatedValue = values.length;
          break;
        case 'COUNT_DISTINCT':
          aggregatedValue = new Set(values.map((v: any) => typeof v === 'object' ? JSON.stringify(v) : v)).size;
          break;
        case 'MAX':
          aggregatedValue = numericValues.length > 0 ? Math.max(...numericValues) : 0;
          break;
        case 'MIN':
          aggregatedValue = numericValues.length > 0 ? Math.min(...numericValues) : 0;
          break;
        case 'NONE':
          aggregatedValue = numericValues.length > 0 ? numericValues[0] : 0;
          break;
        default:
          aggregatedValue = 0;
      }
      result[config.field] = aggregatedValue;
    });
    return result;
  });

  if (topN && topN.enabled && topN.count > 0 && topN.by && aggregatedResults.length > topN.count) {
    aggregatedResults.sort((a, b) => {
      const valA = a[topN.by] || 0;
      const valB = b[topN.by] || 0;
      return topN.order === 'desc' ? valB - valA : valA - valB;
    });

    const topItems = aggregatedResults.slice(0, topN.count);
    const otherItems = aggregatedResults.slice(topN.count);

    if (otherItems.length > 0) {
      const othersCategory: Record<string, any> = { name: 'Others' };
      valueConfigs.forEach(config => {
        othersCategory[config.field] = otherItems.reduce((sum, item) => sum + (item[config.field] || 0), 0);
      });
      return [...topItems, othersCategory];
    } else {
      return topItems;
    }
  }

  if (sortOrder) {
    const sortByKey = sortBySeries === 'total' || !sortBySeries
      ? 'total'
      : sortBySeries;
    
    const resultsWithTotal = aggregatedResults.map(res => ({
      ...res,
      total: valueConfigs.reduce((sum, config) => sum + (res[config.field] || 0), 0)
    }));

    resultsWithTotal.sort((a, b) => {
      const valA = a[sortByKey] || 0;
      const valB = b[sortByKey] || 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
    return resultsWithTotal;
  } else {
    aggregatedResults.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  return aggregatedResults;
};