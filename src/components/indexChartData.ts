import type { BusinessDay, CandlestickData } from "lightweight-charts";
import indexDataCsv from "../content/pricedatabase/indexdata.csv?raw";
import peDataCsv from "../content/pricedatabase/pricetoearnings.csv?raw";
import { parseCsvRows, parseNumberCell } from "../utils/csv";
import { DAY_MS, WEEK_MS, parseUsDateToUtcTime } from "../utils/dates";
import { findLastIndexAtOrBefore, type TimedValuePoint } from "../utils/timeSeries";

export type IndexKey = "SPX" | "STOXX600";

type IndexChartDataset = {
  candles: CandlestickData<BusinessDay>[];
  latestClose: number | null;
  latestTimeMs: number | null;
  /** Highest close inside the charted window, and the day it printed. */
  windowHigh: TimedValuePoint | null;
  currentPe: number | null;
  lastWeekPe: number | null;
};

const YEAR_WINDOW_MS = 365 * DAY_MS;
const INDEX_KEYS: IndexKey[] = ["SPX", "STOXX600"];
const EMPTY_DATASET: IndexChartDataset = {
  candles: [],
  latestClose: null,
  latestTimeMs: null,
  windowHigh: null,
  currentPe: null,
  lastWeekPe: null,
};

function toBusinessDay(timeMs: number): BusinessDay {
  const date = new Date(timeMs);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function toSortedSeries(valuesByTime: Map<number, number>): TimedValuePoint[] {
  return [...valuesByTime.entries()].sort((a, b) => a[0] - b[0]).map(([time, value]) => ({ time, value }));
}

/** `indexdata.csv` holds two side-by-side date/close column pairs: SPX then STOXX 600. */
function parseIndexCloses(rawCsv: string): Record<IndexKey, TimedValuePoint[]> {
  const maps = INDEX_KEYS.map(() => new Map<number, number>());

  for (const cells of parseCsvRows(rawCsv)) {
    maps.forEach((map, pairIndex) => {
      const time = parseUsDateToUtcTime(cells[pairIndex * 2] ?? "");
      const close = parseNumberCell(cells[pairIndex * 2 + 1]);
      if (time !== null && close !== null) map.set(time, close);
    });
  }

  return { SPX: toSortedSeries(maps[0]), STOXX600: toSortedSeries(maps[1]) };
}

/** `pricetoearnings.csv` rows are `date, ticker, forward P/E`. */
function parseForwardPe(rawCsv: string): Record<IndexKey, Map<number, number>> {
  const lookup: Record<IndexKey, Map<number, number>> = { SPX: new Map(), STOXX600: new Map() };

  for (const [dateRaw, tickerRaw, valueRaw] of parseCsvRows(rawCsv)) {
    const time = parseUsDateToUtcTime(dateRaw ?? "");
    const value = parseNumberCell(valueRaw);
    const key = INDEX_KEYS.find((candidate) => candidate === tickerRaw?.toUpperCase());
    if (key && time !== null && value !== null) lookup[key].set(time, value);
  }

  return lookup;
}

const INDEX_CLOSES = parseIndexCloses(indexDataCsv);
const INDEX_FORWARD_PE = parseForwardPe(peDataCsv);

/** One year of close-to-close candles ending at the last print on or before `activeTimeMs`. */
export function getIndexChartDataset(index: IndexKey, activeTimeMs: number): IndexChartDataset {
  const points = INDEX_CLOSES[index];
  if (points.length === 0) return EMPTY_DATASET;

  // Before the first print there is nothing to end on, so fall back to the first point.
  const endpointIndex = Math.max(findLastIndexAtOrBefore(points, activeTimeMs), 0);
  const endpoint = points[endpointIndex];
  const windowStart = endpoint.time - YEAR_WINDOW_MS;

  const candles: CandlestickData<BusinessDay>[] = [];
  let windowHigh: TimedValuePoint | null = null;

  for (let i = endpointIndex; i >= 0 && points[i].time >= windowStart; i -= 1) {
    const close = points[i].value;
    const open = i > 0 ? points[i - 1].value : close;
    const high = Math.max(open, close);

    candles.push({ time: toBusinessDay(points[i].time), open, high, low: Math.min(open, close), close });
    // `>=` while walking backwards keeps the earliest day on ties.
    if (!windowHigh || high >= windowHigh.value) windowHigh = { time: points[i].time, value: high };
  }
  candles.reverse();

  const activeDay = Math.floor(activeTimeMs / DAY_MS) * DAY_MS;
  const peLookup = INDEX_FORWARD_PE[index];

  return {
    candles,
    latestClose: endpoint.value,
    latestTimeMs: endpoint.time,
    windowHigh,
    currentPe: peLookup.get(activeDay) ?? null,
    lastWeekPe: peLookup.get(activeDay - WEEK_MS) ?? null,
  };
}

export function formatPe(value: number | null) {
  return value === null ? "--" : value.toFixed(2);
}

const subtitleDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatChartSubtitleDate(timeMs: number | null) {
  return timeMs === null ? "--" : subtitleDateFormatter.format(new Date(timeMs));
}
