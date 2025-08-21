import { type CalculatedFieldDefinition, type Operand, type Parameter } from "@/types/visualizations";

export const applyCalculations = (
  baseDataset: Record<string, any>[],
  definitions: CalculatedFieldDefinition[],
  parameters: Parameter[] = [],
  parameterValues: Record<string, any> = {}
): Record<string, any>[] => {
  if (definitions.length === 0) {
    return baseDataset;
  }
  
  return baseDataset.map(row => {
    const newRow = { ...row };
    definitions.forEach(({ name, op1, operator, op2 }) => {
      const resolveValue = (operand: Operand): number => {
        if (operand.type === 'number') return Number(operand.value);
        const fieldName = String(operand.value);
        
        const parameter = parameters.find(p => p.name === fieldName);
        if (parameter && parameterValues[parameter.id] !== undefined) {
          return Number(parameterValues[parameter.id]);
        }
        
        return parseFloat(newRow[fieldName]);
      };

      const val1 = resolveValue(op1);
      const val2 = resolveValue(op2);
      let result: number | null = null;

      if (!isNaN(val1) && !isNaN(val2)) {
        switch (operator) {
          case '+': result = val1 + val2; break;
          case '-': result = val1 - val2; break;
          case '*': result = val1 * val2; break;
          case '/': result = val2 !== 0 ? val1 / val2 : null; break;
          case 'MAX': result = Math.max(val1, val2); break;
          case 'MIN': result = Math.min(val1, val2); break;
          default: break;
        }
      }
      newRow[name] = result;
    });
    return newRow;
  });
};

export const resolveMeasureValue = (
  fieldName: string,
  definitions: CalculatedFieldDefinition[],
  parameters: Parameter[] = [],
  parameterValues: Record<string, any> = {},
  staticMeasures: Record<string, string | number> = {},
  allDatasetFields: Set<string>,
  recursionGuard: Set<string> = new Set()
): number | null => {
  if (recursionGuard.has(fieldName)) {
    // Circular dependency detected
    return null;
  }
  recursionGuard.add(fieldName);

  // Is it a static measure?
  if (staticMeasures[fieldName] !== undefined) {
    recursionGuard.delete(fieldName);
    return Number(staticMeasures[fieldName]);
  }

  // Is it a calculated field?
  const definition = definitions.find(d => d.name === fieldName);
  if (!definition) {
    recursionGuard.delete(fieldName);
    return null; // Not a measure we can resolve globally
  }

  const resolveOperand = (operand: Operand): number | null => {
    if (operand.type === 'number') return Number(operand.value);
    
    const opFieldName = String(operand.value);
    
    // Is the operand a parameter?
    const parameter = parameters.find(p => p.name === opFieldName);
    if (parameter && parameterValues[parameter.id] !== undefined) {
      return Number(parameterValues[parameter.id]);
    }

    // Is the operand another measure we can resolve?
    if (!allDatasetFields.has(opFieldName)) {
      const measureValue = resolveMeasureValue(opFieldName, definitions, parameters, parameterValues, staticMeasures, allDatasetFields, recursionGuard);
      if (measureValue !== null) return measureValue;
    }

    // It must be a row-level field, so we can't resolve it globally.
    return null;
  };

  const val1 = resolveOperand(definition.op1);
  const val2 = resolveOperand(definition.op2);

  recursionGuard.delete(fieldName);

  if (val1 === null || val2 === null) {
    return null; // Cannot be resolved globally
  }

  switch (definition.operator) {
    case '+': return val1 + val2;
    case '-': return val1 - val2;
    case '*': return val1 * val2;
    case '/': return val2 !== 0 ? val1 / val2 : null;
    case 'MAX': return Math.max(val1, val2);
    case 'MIN': return Math.min(val1, val2);
    default: return null;
  }
};