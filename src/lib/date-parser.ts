// This function attempts to parse various date formats into a valid Date object.
export function parseDate(value: any, fieldName?: string): Date | null {
  if (value === null || value === undefined || typeof value === 'boolean' || value === '') {
    return null;
  }

  const name = fieldName?.toLowerCase() || '';
  const isDateHint = name.includes('date') || name.includes('day') || name.includes('time') || name.includes('dt');

  // Handle numbers (Excel serials, timestamps)
  if (typeof value === 'number') {
    // Excel serial date check (1900-01-01 to 9999-12-31)
    if (value > 0 && value < 2958466) {
      // For integers, which are ambiguous, we only convert if there's a hint in the column name.
      if (value % 1 === 0) { // It's an integer
        if (isDateHint) {
          const excelEpochDiff = 25569;
          const date = new Date((value - excelEpochDiff) * 86400 * 1000);
          if (!isNaN(date.getTime())) return date;
        } else {
          // Not a date-like column name, so we assume it's not a date.
          return null;
        }
      } else { // Numbers with decimals are very likely to be dates with time.
        const excelEpochDiff = 25569;
        const date = new Date((value - excelEpochDiff) * 86400 * 1000);
        if (!isNaN(date.getTime())) return date;
      }
    }
    // Unix timestamp check (milliseconds or seconds)
    const numStr = String(Math.floor(value));
    if (numStr.length >= 10 && numStr.length <= 13) {
      const date = new Date(numStr.length === 10 ? value * 1000 : value);
      if (!isNaN(date.getTime())) return date;
    }
    // Avoid treating other numbers (like years, IDs) as dates
    return null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (trimmedValue === '') return null;
    
    // If it's a string that is just a number (like a year "2023"), don't parse it as a date
    // unless the column name suggests it's a date. This prevents treating IDs or years as dates.
    if (!isNaN(Number(trimmedValue))) {
      // It's a number-like string. Let's be conservative.
      // We allow it if the column name has a date hint, or if it looks like a unix timestamp.
      const isTimestampLike = trimmedValue.length >= 10 && trimmedValue.length <= 13;
      if (!isDateHint && !isTimestampLike) {
        return null;
      }
    }

    // Check for common date formats that `new Date()` might misinterpret.
    const ymdMatch = trimmedValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10);
      const day = parseInt(ymdMatch[3], 10);
      if (month > 0 && month <= 12 && day > 0 && day <= 31) {
        // Use UTC to avoid timezone issues
        return new Date(Date.UTC(year, month - 1, day));
      }
    }

    // Handle time-only strings like "3:45 PM" or "15:45" optionally with seconds
    // We only do this if the field name hints it's a date/time to avoid mis-parsing text.
    if (isDateHint) {
      // h:mm[:ss] AM/PM
      const ampmMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i);
      if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = parseInt(ampmMatch[2], 10);
        const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
        const meridiem = ampmMatch[4].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours, minutes, seconds, 0);
        return d;
      }
      // HH:mm[:ss]
      const hhmmMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (hhmmMatch) {
        const hours = parseInt(hhmmMatch[1], 10);
        const minutes = parseInt(hhmmMatch[2], 10);
        const seconds = hhmmMatch[3] ? parseInt(hhmmMatch[3], 10) : 0;
        const d = new Date();
        d.setHours(hours, minutes, seconds, 0);
        return d;
      }
    }

    // Final attempt with the native parser, which is good for ISO 8601 and other standard formats.
    const date = new Date(trimmedValue);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

// This function checks if a value is likely to be a date.
export const isDate = (value: any, fieldName?: string): boolean => {
  return parseDate(value, fieldName) !== null;
};