import { parseCsvRows, parseNumberCell } from "../utils/csv";
import { toExcelUtcTime } from "../utils/dates";
import type { TimedValuePoint } from "../utils/timeSeries";

/**
 * One row of the "long" price files (`durationdata.csv`, `equitydata.csv`):
 *
 *   excelDate, name, ticker, category, value, tag
 *
 * `tag` is the contract sequence for futures and the sector id for sector ETFs.
 */
export type LongRow = {
  time: number;
  ticker: string;
  tickerKey: string;
  category: string;
  value: number;
  tag: number | null;
};

/** Parses a long-format file once; rows without a usable date or value are dropped. */
export function parseLongRows(rawCsv: string): LongRow[] {
  const rows: LongRow[] = [];

  for (const cells of parseCsvRows(rawCsv)) {
    const excelDate = parseNumberCell(cells[0]);
    const value = parseNumberCell(cells[4]);
    const ticker = cells[2] ?? "";
    if (excelDate === null || value === null || ticker === "") continue;

    rows.push({
      time: toExcelUtcTime(excelDate),
      ticker,
      tickerKey: ticker.toUpperCase(),
      category: (cells[3] ?? "").toLowerCase(),
      value,
      tag: parseNumberCell(cells[5]),
    });
  }

  return rows;
}

/** Collapses a time -> value map (last write wins per day) into a sorted series. */
export function toSortedSeries(valuesByTime: Map<number, number>): TimedValuePoint[] {
  return [...valuesByTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, value]) => ({ time, value }));
}

/** Runs `compute` on first call only, so a page parses just the datasets it renders. */
export function lazy<T>(compute: () => T) {
  let cached: { value: T } | null = null;
  return () => {
    cached ??= { value: compute() };
    return cached.value;
  };
}
