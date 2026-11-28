import { parseCsvRows, parseNumberCell } from "../utils/csv";
import { parseIsoDateToUtcTime } from "../utils/dates";
import type { TimedValuePoint } from "../utils/timeSeries";

/**
 * Parsers for the data store in `src/content/data` (written by the local pipeline).
 *
 * Conventions shared by every file there: ISO dates, a header row, and a blank
 * cell meaning "no value", never zero.
 */

/** A point that may be an explicit "no value this week" (an NA row). */
export type NullablePoint = {
  time: number;
  value: number | null;
};

/** Runs `compute` on first call only, so a page parses just the datasets it renders. */
export function lazy<T>(compute: () => T) {
  let cached: { value: T } | null = null;
  return () => {
    cached ??= { value: compute() };
    return cached.value;
  };
}

/**
 * Wide file, `date,<COLUMN>,<COLUMN>,...`: one ascending series per column.
 * Blank cells are left out, so a column only has points on the days it printed.
 */
export function parseWideSeries(rawCsv: string): Map<string, TimedValuePoint[]> {
  const [header, ...rows] = parseCsvRows(rawCsv);
  const series = new Map<string, TimedValuePoint[]>();
  if (!header) return series;

  const columns = header.slice(1);
  for (const name of columns) series.set(name, []);

  for (const cells of rows) {
    const time = parseIsoDateToUtcTime(cells[0] ?? "");
    if (time === null) continue;

    columns.forEach((name, index) => {
      const value = parseNumberCell(cells[index + 1]);
      if (value !== null) series.get(name)?.push({ time, value });
    });
  }

  for (const points of series.values()) points.sort((a, b) => a.time - b.time);
  return series;
}

/**
 * Long file, `date,key,value,...`: one ascending series per key.
 * Rows with a blank value are kept as NA points; callers that cannot show NA use `dropNa`.
 */
export function parseLongSeries(rawCsv: string): Map<string, NullablePoint[]> {
  const [header, ...rows] = parseCsvRows(rawCsv);
  const series = new Map<string, NullablePoint[]>();
  if (!header) return series;

  for (const cells of rows) {
    const time = parseIsoDateToUtcTime(cells[0] ?? "");
    const key = cells[1] ?? "";
    if (time === null || key === "") continue;

    let points = series.get(key);
    if (!points) {
      points = [];
      series.set(key, points);
    }
    points.push({ time, value: parseNumberCell(cells[2]) });
  }

  for (const points of series.values()) points.sort((a, b) => a.time - b.time);
  return series;
}

export function dropNa(points: readonly NullablePoint[] | undefined): TimedValuePoint[] {
  return (points ?? []).filter((point): point is TimedValuePoint => point.value !== null);
}

/** Pairs two series on the dates both printed, e.g. nominal minus real yield. */
export function combineSeries(
  left: readonly TimedValuePoint[],
  right: readonly TimedValuePoint[],
  combine: (left: number, right: number) => number,
): TimedValuePoint[] {
  const rightByTime = new Map(right.map((point) => [point.time, point.value]));
  const combined: TimedValuePoint[] = [];

  for (const point of left) {
    const other = rightByTime.get(point.time);
    if (other !== undefined) combined.push({ time: point.time, value: combine(point.value, other) });
  }

  return combined;
}
