import type { BusinessDay, CandlestickData, LineData } from "lightweight-charts";
import indexOhlcCsv from "../content/data/index-ohlc.csv?raw";
import { lazy } from "../data/csvStore";
import { getEarningsWeeks, getForwardPe, type ForwardPeKey, type ForwardPeReading } from "../data/earningsData";
import { parseCsvRows, parseNumberCell } from "../utils/csv";
import { DAY_MS, WEEK_MS, parseIsoDateToUtcTime } from "../utils/dates";
import { findLastIndexAtOrBefore, getAlignedPoint, type TimedValuePoint } from "../utils/timeSeries";

export type IndexKey = "SPX" | "NDX" | "STOXX600";

type IndexBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type IndexChartDataset = {
  candles: CandlestickData<BusinessDay>[];
  /** 50- and 200-day simple moving averages of the close, for the charted window. */
  movingAverage50: LineData<BusinessDay>[];
  movingAverage200: LineData<BusinessDay>[];
  latestClose: number | null;
  latestTimeMs: number | null;
  latestMovingAverage50: number | null;
  latestMovingAverage200: number | null;
  /** Highest close on record up to the active date, and the day it printed. */
  allTimeHigh: TimedValuePoint | null;
  currentPe: ForwardPeReading;
  lastWeekPe: ForwardPeReading;
  /** S&P 500 only: the forward four-quarter EPS behind the P/E. */
  forwardEps: number | null;
};

const YEAR_WINDOW_MS = 365 * DAY_MS;
const EMPTY_DATASET: IndexChartDataset = {
  candles: [],
  movingAverage50: [],
  movingAverage200: [],
  latestClose: null,
  latestTimeMs: null,
  latestMovingAverage50: null,
  latestMovingAverage200: null,
  allTimeHigh: null,
  currentPe: null,
  lastWeekPe: null,
  forwardEps: null,
};

function toBusinessDay(timeMs: number): BusinessDay {
  const date = new Date(timeMs);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/** `index-ohlc.csv` rows are `date,ticker,open,high,low,close`; a few old bars have only a close. */
function parseIndexBars(rawCsv: string) {
  const [, ...rows] = parseCsvRows(rawCsv);
  const barsByIndex = new Map<string, IndexBar[]>();

  for (const cells of rows) {
    const time = parseIsoDateToUtcTime(cells[0] ?? "");
    const ticker = cells[1] ?? "";
    const close = parseNumberCell(cells[5]);
    if (time === null || close === null || !ticker) continue;

    const open = parseNumberCell(cells[2]) ?? close;
    let bars = barsByIndex.get(ticker);
    if (!bars) {
      bars = [];
      barsByIndex.set(ticker, bars);
    }
    bars.push({
      time,
      open,
      high: parseNumberCell(cells[3]) ?? Math.max(open, close),
      low: parseNumberCell(cells[4]) ?? Math.min(open, close),
      close,
    });
  }

  for (const bars of barsByIndex.values()) bars.sort((a, b) => a.time - b.time);
  return barsByIndex;
}

/** Simple moving average of the close over `length` bars; null until enough bars exist. */
function computeMovingAverage(bars: readonly IndexBar[], length: number) {
  const averages: Array<number | null> = [];
  let sum = 0;

  for (let i = 0; i < bars.length; i += 1) {
    sum += bars[i].close;
    if (i >= length) sum -= bars[i - length].close;
    averages.push(i >= length - 1 ? sum / length : null);
  }

  return averages;
}

const getIndexBars = lazy(() => {
  const barsByIndex = parseIndexBars(indexOhlcCsv);
  return new Map(
    [...barsByIndex.entries()].map(([ticker, bars]) => [
      ticker,
      { bars, average50: computeMovingAverage(bars, 50), average200: computeMovingAverage(bars, 200) },
    ]),
  );
});

/** One year of daily candles ending at the last bar on or before `activeTimeMs`, with its averages and context. */
export function getIndexChartDataset(index: IndexKey, activeTimeMs: number): IndexChartDataset {
  const dataset = getIndexBars().get(index);
  if (!dataset || dataset.bars.length === 0) return EMPTY_DATASET;

  const { bars, average50, average200 } = dataset;
  // Before the first bar there is nothing to end on, so fall back to the first one.
  const endpointIndex = Math.max(findLastIndexAtOrBefore(bars, activeTimeMs), 0);
  const endpoint = bars[endpointIndex];
  const windowStart = endpoint.time - YEAR_WINDOW_MS;

  const candles: CandlestickData<BusinessDay>[] = [];
  const movingAverage50: LineData<BusinessDay>[] = [];
  const movingAverage200: LineData<BusinessDay>[] = [];

  for (let i = endpointIndex; i >= 0 && bars[i].time >= windowStart; i -= 1) {
    const bar = bars[i];
    const time = toBusinessDay(bar.time);
    candles.push({ time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });

    const fifty = average50[i];
    const twoHundred = average200[i];
    if (fifty !== null) movingAverage50.push({ time, value: fifty });
    if (twoHundred !== null) movingAverage200.push({ time, value: twoHundred });
  }
  candles.reverse();
  movingAverage50.reverse();
  movingAverage200.reverse();

  // Strict `>` while walking forwards keeps the earliest day on ties.
  let allTimeHigh: TimedValuePoint | null = null;
  for (let i = 0; i <= endpointIndex; i += 1) {
    if (!allTimeHigh || bars[i].close > allTimeHigh.value) allTimeHigh = { time: bars[i].time, value: bars[i].close };
  }

  const activeDay = Math.floor(activeTimeMs / DAY_MS) * DAY_MS;

  return {
    candles,
    movingAverage50,
    movingAverage200,
    latestClose: endpoint.close,
    latestTimeMs: endpoint.time,
    latestMovingAverage50: average50[endpointIndex],
    latestMovingAverage200: average200[endpointIndex],
    allTimeHigh,
    currentPe: getForwardPe(index as ForwardPeKey, activeDay),
    lastWeekPe: getForwardPe(index as ForwardPeKey, activeDay - WEEK_MS),
    forwardEps: index === "SPX" ? (getAlignedPoint(getEarningsWeeks(), activeDay)?.fwd4qEps ?? null) : null,
  };
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
