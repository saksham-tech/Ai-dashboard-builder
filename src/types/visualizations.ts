export type ChartType = 
  | 'Bar' 
  | 'Line' 
  | 'Pie' 
  | 'Area' 
  | 'Card'
  | 'Donut'
  | 'Scatter'
  | 'Combo'
  | 'TextBox'
  | 'Image'
  | 'Slicer'
  | 'Shape'
  | 'ActionButton'
  | 'Matrix'
  | 'Table'
  | 'HorizontalBar'
  | 'StackedBar'
  | 'StackedBarHorizontal'
  | 'Parameter'
  | 'Gauge';

export type JoinType = 'left' | 'right' | 'inner' | 'full';

export interface Dataset {
  id: string;
  name: string;
  data: Record<string, any>[];
  fields: string[];
}

export type Cardinality = 'one-to-one' | 'one-to-many' | 'many-to-one';

export interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  cardinality: Cardinality;
}

export type Operand = {
  type: 'field' | 'number';
  value: string | number;
};

export interface CalculatedFieldDefinition {
  name: string;
  op1: Operand;
  operator: string;
  op2: Operand;
}

export type TransformationType = 
  | 'DAY_OF_WEEK' 
  | 'MONTH_NAME' 
  | 'YEAR' 
  | 'QUARTER'
  | 'F_TO_C'
  | 'C_TO_F'
  | 'ADD_PREFIX'
  | 'ADD_SUFFIX'
  | 'SLASH_TO_DASH_DATE'
  | 'TO_WHOLE_NUMBER'
  | 'TO_DECIMAL'
  | 'TO_TEXT'
  | 'CONDITIONAL_COLUMN'
  | 'FILTER_AND_COPY'
  | 'INCLUDE_BY_CONDITION'
  | 'AGGREGATE_BY'
  | 'COMBINE_WITH_LITERALS';

export interface TransformedFieldDefinition {
  name: string;
  sourceField: string;
  transformation: TransformationType;
  value?: string;
  excludeByCategoryField?: string;
  excludeByCategoryValues?: string[];
  // Optional: scope this transformed field to a specific dataset (table)
  // When provided, only the dataset with this id will receive the transformed column
  datasetId?: string;
  // For CONDITIONAL_COLUMN (enhanced)
  conditionalThenMode?: 'column' | 'literal';
  conditionalThenField?: string;
  conditionalThenValue?: string; // may be text, number-like, or image URL
  conditionalElseMode?: 'column' | 'literal';
  conditionalElseField?: string;
  conditionalElseValue?: string; // may be text, number-like, or image URL
  // For FILTER_AND_COPY
  filterOnField?: string;
  valuesToFilter?: string[];
  // For AGGREGATE_BY
  aggregation?: AggregationType;
  groupByFields?: string[];
  // For COMBINE_WITH_LITERALS
  combineParts?: Array<{
    mode: 'column' | 'literal';
    field?: string;
    value?: string;
    // Optional per-part formatting for date/time columns
    dateFormat?: 'default' | 'MMM D, YYYY' | 'YYYY-MM-DD' | 'DayOfWeek' | 'MonthName';
    timeFormat?: 'default' | 'h:mm A' | 'HH:mm';
    // Optional per-part styling and spacing
    color?: string; // hex or css color
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
    space?: number; // number of spaces to append after this part
  }>;
}

export type ParameterType = 'numeric-slider';

export interface Parameter {
  id: string;
  name: string;
  type: ParameterType;
  config: {
    min: number;
    max: number;
    step: number;
    defaultValue: number;
  };
}

export interface FieldFormattingOptions {
  // For numbers
  customPrefix?: string;
  customSuffix?: string;
  decimalPlaces?: number;
  displayUnits?: 'auto' | 'none';
  // For dates
  dateFormat?: 'default' | 'MMM D, YYYY' | 'YYYY-MM-DD' | 'DayOfWeek' | 'MonthName';
  timeFormat?: 'default' | 'h:mm A' | 'HH:mm';
}

export interface TextBoxOptions {
  text: string;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';
  verticalAlign: 'top' | 'middle' | 'bottom';
  horizontalAlign: 'left' | 'center' | 'right';
}

export interface CardOptions {
  // Value (the main number)
  valueFontSize: number;
  valueColor: string;
  valueFontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';
  
  // Category Label (the text below)
  showCategory: boolean;
  categoryFontSize: number;
  categoryColor: string;
  categoryFontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';

  // Layout
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  spacing?: number;
}

export interface ImageOptions {
  src: string | null;
  objectFit: 'contain' | 'cover' | 'fill' | 'none';
  dataField: string | null;
  width?: string;
  height?: string;
  verticalAlign?: 'top' | 'middle' | 'bottom';
  horizontalAlign?: 'left' | 'center' | 'right';
}

export interface SlicerTextOptions {
  id: string;
  field: string | null;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';
  formatting?: FieldFormattingOptions;
  align?: 'left' | 'center' | 'right';
}

export interface SlicerImageOptions {
  field: string | null;
  position: 'top' | 'bottom' | 'left' | 'right';
  width: number;
  height: number;
  objectFit: 'contain' | 'cover' | 'fill' | 'none';
  padding?: number;
  align?: 'left' | 'center' | 'right';
}

export interface SlicerLayoutOptions {
  gridColumns: number;
  gap: number;
  itemHeight?: number;
  itemWidth?: number;
}

export interface SlicerOptions {
  allowMultiSelect: boolean;
  showItemContainer: boolean;
  itemBackgroundColor: string;
  itemTextColor: string;
  selectedItemBackgroundColor: string;
  selectedItemTextColor: string;
  itemBorderRadius: number;
  itemBorderColor: string;
  selectedItemBorderColor: string;
  itemBorderWidth: number;
  itemPadding: number;
  itemBackgroundOpacity: number;
  selectedItemBackgroundOpacity: number;
  image?: SlicerImageOptions;
  texts: SlicerTextOptions[];
  layout: SlicerLayoutOptions;
  textAlign: 'left' | 'center' | 'right';
  textBlockPadding?: number;
  // Popover mode
  popoverModeEnabled?: boolean;
  popoverTitle?: string;
  popoverIconSrc?: string;
  showActiveFilterCount?: boolean;
}

export type AggregationType = 'SUM' | 'AVERAGE' | 'COUNT' | 'COUNT_DISTINCT' | 'NONE' | 'MAX' | 'MIN';

export interface ValueKeyConfig {
  field: string;
  aggregation: AggregationType;
  color?: string;
  borderRadius?: number;
  borderColor?: string;
  backgroundOpacity?: number;
  formatting?: FieldFormattingOptions;
  showLabel?: boolean;
}

export interface ChartSpecificOptions {
  // Bar
  barWidth: string;
  barBorderRadius: number[];

  // Pie / Donut
  pieRoseType: 'radius' | 'area' | false;
  pieBorderRadius: number;

  // Line / Area
  lineSmooth: boolean;
  symbolSize: number;
  showSymbol: boolean;
}

export interface ConditionalFormattingRule {
  id: string;
  target: 'value' | 'name';
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'between' | 'contains';
  value: any;
  value2?: any;
  color: string;
  text?: string;
}

export interface ShapeOptions {
  shapeType: 'rectangle' | 'circle' | 'line' | 'triangle';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray: string;
  cornerRadius?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
}

export interface ActionButtonOptions {
  text: string;
  action: 'toggleVisibility';
  targetVizIds: string[];
  backgroundColor: string;
  textColor: string;
  backgroundOpacity: number;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  iconSrc: string | null;
  iconWidth?: number;
  iconHeight?: number;
}

export interface MatrixConditionalFormatting {
  enabled: boolean;
  backgroundColorScale: {
    enabled: boolean;
    minColor: string;
    centerColor: string;
    maxColor: string;
  };
  fontColorScale: {
    enabled: boolean;
    minColor: string;
    centerColor: string;
    maxColor: string;
  };
}

export interface MatrixOptions {
  style: 'default' | 'none';
  grid: {
    vertical: boolean;
    horizontal: boolean;
    color: string;
    thickness: number;
  };
  rowHeaders: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    wordWrap: boolean;
    characterLimit?: number;
  };
  columnHeaders: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    wordWrap: boolean;
    characterLimit?: number;
  };
  values: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    wordWrap: boolean;
    showAlternatingRows?: boolean;
    alternatingRowColor?: string;
    rowPadding?: number;
    columnPadding?: number;
  };
  totals: {
    showRowGrandTotal: boolean;
    showColumnGrandTotal: boolean;
    fontSize: number;
    color: string;
    backgroundColor: string;
  };
  conditionalFormatting?: MatrixConditionalFormatting;
}

export interface TableOptions {
  grid: {
    vertical: boolean;
    horizontal: boolean;
    color: string;
    thickness: number;
  };
  headers: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    wordWrap: boolean;
    alignment: 'left' | 'center' | 'right';
  };
  values: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    showAlternatingRows: boolean;
    alternatingRowColor: string;
    rowPadding: number;
    columnPadding: number;
    alignment: 'left' | 'center' | 'right';
    hideRowsWithBlanks?: boolean;
  };
  totals: {
    show: boolean;
    fontSize: number;
    color: string;
    backgroundColor: string;
    label: string;
    columnsWithTotals?: string[];
  };
  allowMultiSelect?: boolean;
  filterColumn?: string;
}

export interface GaugeOptions {
  min: number;
  max: number;
  startAngle: number;
  endAngle: number;
  splitNumber: number;
  axisLineColor: [number, string][];
  showPointer: boolean;
  showProgress: boolean;
  detailFormatter: string;
  showTarget?: boolean;
  targetColor?: string;
  progressColor?: string;
  radius?: number;
  detailStyle?: {
    fontSize: number;
    color: string;
    fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter';
  };
}

export interface VisualizationOptions {
  general: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
    boxShadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    backgroundOpacity: number;
    borderWidth: number;
  };
  title: {
    text: string;
    fontSize: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
  };
  dataLabels: {
    show: boolean;
    color: string;
    fontSize: number;
  };
  legend: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
  xAxis: {
    show: boolean;
    color: string;
    showGrid: boolean;
  };
  yAxis: {
    show: boolean;
    color: string;
    showGrid: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
  };
  dataMapping: {
    nameKey: string | null; // Rows for Matrix
    nameKeyFormatting?: FieldFormattingOptions;
    categoryType?: 'field' | 'custom';
    customCategoryText?: string;
    valueKey: string | null; // Values for Matrix
    valueKeyFormatting?: FieldFormattingOptions;
    valueKeys: ValueKeyConfig[]; // Used for stacked/multi-series charts
    secondaryValueKey: string | null; // Columns for Matrix
    secondaryValueKeyFormatting?: FieldFormattingOptions;
    valueKeyAggregation: AggregationType; // Used for simple charts
    nameKeyAggregation?: AggregationType;
    slicerKey: string | null;
    // Percentage/normalization options
    normalizeToPercent?: boolean; // When true: for stacked bars, stack to 100%; for simple bars, compute value/denominator * 100
    denominatorKey?: string | null; // For simple bars (Bar/HorizontalBar) when normalizeToPercent is true
    percentDecimals?: number; // Decimal places for percentage labels/axis
    gaugeMinValueKey?: string | null;
    gaugeMaxValueKey?: string | null;
    gaugeTargetValueKey?: string | null;
    gaugeMinValueAggregation?: AggregationType;
    gaugeMaxValueAggregation?: AggregationType;
    gaugeTargetValueAggregation?: AggregationType;
    sortOrder?: 'asc' | 'desc';
    sortBySeries?: string; // for stacked charts, field name or 'total'
    topN?: {
      enabled: boolean;
      count: number;
      by: string;
      order: 'asc' | 'desc';
    };
  };
  conditionalFormatting?: {
    enabled: boolean;
    rules: ConditionalFormattingRule[];
  };
  textBox?: TextBoxOptions;
  image?: ImageOptions;
  slicer?: SlicerOptions;
  card?: CardOptions;
  shape?: ShapeOptions;
  actionButton?: ActionButtonOptions;
  matrix?: MatrixOptions;
  table?: TableOptions;
  gauge?: GaugeOptions;
  chartSpecific?: ChartSpecificOptions;
}

export interface Visualization {
  id: string;
  type: ChartType;
  x: number;
  y: number;
  width: number;
  height: number;
  options: VisualizationOptions;
  datasetId?: string;
  parameterId?: string;
}