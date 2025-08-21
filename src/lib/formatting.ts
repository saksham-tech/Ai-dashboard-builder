import { format } from 'date-fns';
import { type FieldFormattingOptions } from '@/types/visualizations';
import { parseDate } from './date-parser';

const tryParseNumber = (value: any): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value.trim() === '') return null;
  
  const cleanedValue = value.replace(/[\s$,€£¥]/g, '');
  
  if (cleanedValue === '' || isNaN(Number(cleanedValue))) {
    return null;
  }
  
  return Number(cleanedValue);
}

export const formatLargeNumber = (num: number): string => {
  if (Math.abs(num) < 1000) {
    return num.toLocaleString();
  }
  const si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "K" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "B" },
    { value: 1E12, symbol: "T" },
    { value: 1E15, symbol: "P" },
    { value: 1E18, symbol: "E" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (Math.abs(num) >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(1).replace(rx, "$1") + si[i].symbol;
};

export const formatValue = (value: any, formatting?: FieldFormattingOptions, fieldName?: string, forAxis: boolean = false): string => {
  if (value === null || value === undefined || value === '') return '';
  
  let baseFormattedValue: string;

  const hasDateFormat = formatting?.dateFormat && formatting.dateFormat !== 'default';
  const hasTimeFormat = formatting?.timeFormat && formatting.timeFormat !== 'default';

  const date = parseDate(value, fieldName);

  if (date && (hasDateFormat || hasTimeFormat)) {
    let datePart = '';
    let timePart = '';

    if (hasDateFormat) {
      switch (formatting.dateFormat) {
        case 'MMM D, YYYY': datePart = format(date, 'MMM d, yyyy'); break;
        case 'YYYY-MM-DD': datePart = format(date, 'yyyy-MM-dd'); break;
        case 'DayOfWeek': datePart = format(date, 'eeee'); break;
        case 'MonthName': datePart = format(date, 'MMMM'); break;
      }
    } else if (date) {
      // Default date format if no specific format is requested but it's a date
      datePart = format(date, 'yyyy-MM-dd');
    }

    if (hasTimeFormat) {
      switch (formatting.timeFormat) {
        case 'h:mm A': timePart = format(date, 'h:mm a'); break;
        case 'HH:mm': timePart = format(date, 'HH:mm'); break;
      }
    }
    
    if (datePart && timePart) baseFormattedValue = `${datePart} ${timePart}`;
    else if (datePart) baseFormattedValue = datePart;
    else if (timePart) baseFormattedValue = timePart;
    else baseFormattedValue = String(value);
  } else {
    const numValue = tryParseNumber(value);
    if (numValue !== null) {
      if (formatting?.displayUnits === 'auto') {
        baseFormattedValue = formatLargeNumber(numValue);
      } else if (forAxis && formatting?.decimalPlaces === undefined) {
        baseFormattedValue = formatLargeNumber(numValue);
      } else {
        baseFormattedValue = numValue.toLocaleString(undefined, {
          minimumFractionDigits: formatting?.decimalPlaces,
          maximumFractionDigits: formatting?.decimalPlaces,
        });
      }
    } else {
      baseFormattedValue = String(value);
    }
  }

  let finalValue = baseFormattedValue;
  if (formatting?.customPrefix) {
    finalValue = `${formatting.customPrefix}${finalValue}`;
  }
  if (formatting?.customSuffix) {
    finalValue = `${finalValue}${formatting.customSuffix}`;
  }

  return finalValue;
};