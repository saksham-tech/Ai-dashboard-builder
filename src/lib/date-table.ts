import { eachDayOfInterval, format, getQuarter, startOfDay, getWeek, getYear, getMonth, getDate, getDayOfYear } from 'date-fns';

type DateFormat = 'yyyy-MM-dd' | 'MMMM' | 'MMMM-yyyy' | 'dd-MM-yyyy';

const createCalendarData = (startDate: Date, endDate: Date, dateFormat: DateFormat, selectedColumns: Set<string>, fiscalYearEndMonth?: number) => {
  const interval = eachDayOfInterval({
    start: startOfDay(startDate),
    end: startOfDay(endDate),
  });

  const data = interval.map(date => {
    const year = getYear(date);
    const month = getMonth(date) + 1;
    const result: Record<string, any> = {};

    if (selectedColumns.has('Date')) result['Date'] = format(date, dateFormat);
    if (selectedColumns.has('Year')) result['Year'] = year;
    if (selectedColumns.has('Quarter')) result['Quarter'] = `Q${getQuarter(date)}`;
    if (selectedColumns.has('MonthNumber')) result['MonthNumber'] = month;
    if (selectedColumns.has('MonthName')) result['MonthName'] = format(date, 'MMMM');
    if (selectedColumns.has('DayOfWeek')) result['DayOfWeek'] = format(date, 'eeee');
    if (selectedColumns.has('DayOfMonth')) result['DayOfMonth'] = getDate(date);
    if (selectedColumns.has('DayOfYear')) result['DayOfYear'] = getDayOfYear(date);
    if (selectedColumns.has('WeekOfYear')) result['WeekOfYear'] = getWeek(date);

    if (fiscalYearEndMonth) {
      let fiscalYear = year;
      if (month > fiscalYearEndMonth) {
        fiscalYear = year + 1;
      }
      const adjustedMonth = (month - fiscalYearEndMonth - 1 + 12) % 12;
      const fiscalQuarter = Math.floor(adjustedMonth / 3) + 1;
      if (selectedColumns.has('FiscalYear')) result['FiscalYear'] = fiscalYear;
      if (selectedColumns.has('FiscalQuarter')) result['FiscalQuarter'] = `Q${fiscalQuarter}`;
    }

    return result;
  });

  const fields = data.length > 0 ? Object.keys(data[0]) : [];
  return { data, fields };
};

export const generateDateTableFromRange = (startDate: Date, endDate: Date, dateFormat: DateFormat, selectedColumns: Set<string>, fiscalYearEndMonth?: number) => {
  return createCalendarData(startDate, endDate, dateFormat, selectedColumns, fiscalYearEndMonth);
};