import earningsCalendarJson from "../content/data/earnings-calendar.json?raw";
import earningsJson from "../content/data/earnings.json?raw";
import indexPeCsv from "../content/data/index-pe.csv?raw";
import { parseIsoDateToUtcTime } from "../utils/dates";
import { getAlignedPoint } from "../utils/timeSeries";
import { lazy, parseLongSeries, type NullablePoint } from "./csvStore";

/**
 * Earnings datasets: weekly forward P/E per index, the season figures and
 * comment taken from the LSEG reports, and next week's reporting calendar.
 *
 * Weekly rows are keyed by the bulletin date they were built for.
 */
export type EarningsSource = {
  title: string | null;
  url: string | null;
  published: string | null;
};

export type EarningsWeek = {
  time: number;
  week: string;
  /** `2026Q3`. Null in the weeks backfilled from the old site, which only carry `fwd4qEps`. */
  season: string | null;
  reported: number | null;
  total: number | null;
  beatPct: number | null;
  beatPctLongRun: number | null;
  surprisePct: number | null;
  epsGrowthPct: number | null;
  epsGrowthExEnergyPct: number | null;
  /** S&P 500 forward four-quarter EPS. */
  fwd4qEps: number | null;
  reportingNextWeek: number | null;
  comment: string | null;
  source: EarningsSource;
  stoxx: {
    reported: number | null;
    beatPct: number | null;
    epsGrowthPct: number | null;
    forwardPe: number | null;
    source: EarningsSource;
  } | null;
};

export type EarningsCalendarRow = {
  /** ISO date of the report. */
  date: string;
  time: number;
  ticker: string;
  name: string;
  /** `pre-market`, `after-close`, or null when not known. */
  when: string | null;
  epsEstimate: number | null;
  estimates: number | null;
  epsYearAgo: number | null;
  marketCapBn: number | null;
};

export type EarningsCalendarWeek = {
  time: number;
  week: string;
  rows: EarningsCalendarRow[];
};

/** The index tickers of `index-pe.csv`, in display order. */
export const FORWARD_PE_ORDER = ["SPX", "NDX", "IJR", "STOXX600", "DAX", "AEX", "NIKKEI"] as const;

export type ForwardPeKey = (typeof FORWARD_PE_ORDER)[number];

/** A P/E lookup result: `null` when the week has no row at all, `{ value: null }` when the row says NA. */
export type ForwardPeReading = NullablePoint | null;

function withTime<T extends { week: string }>(weeks: T[]) {
  return weeks
    .map((week) => ({ ...week, time: parseIsoDateToUtcTime(week.week) }))
    .filter((week): week is T & { time: number } => week.time !== null)
    .sort((a, b) => a.time - b.time);
}

export const getEarningsWeeks = lazy((): EarningsWeek[] => {
  const parsed = JSON.parse(earningsJson) as { weeks: Array<Omit<EarningsWeek, "time">> };
  return withTime(parsed.weeks ?? []);
});

export const getEarningsCalendarWeeks = lazy((): EarningsCalendarWeek[] => {
  const parsed = JSON.parse(earningsCalendarJson) as {
    weeks: Array<{ week: string; rows: Array<Omit<EarningsCalendarRow, "time">> }>;
  };

  return withTime(parsed.weeks ?? []).map((week) => ({
    ...week,
    rows: week.rows
      .map((row) => ({ ...row, time: parseIsoDateToUtcTime(row.date) ?? week.time }))
      .sort((a, b) => a.time - b.time),
  }));
});

const getForwardPeByTicker = lazy(() => parseLongSeries(indexPeCsv));

/** Weekly forward P/E of one index, NA rows included. */
export function getForwardPeSeries(ticker: ForwardPeKey): NullablePoint[] {
  return getForwardPeByTicker().get(ticker) ?? [];
}

/** The forward P/E of `ticker` for the week of `time`. */
export function getForwardPe(ticker: ForwardPeKey, time: number): ForwardPeReading {
  return getAlignedPoint(getForwardPeSeries(ticker), time);
}

/** `16.98`, `NA` for a week whose row is blank, `--` when there is no row. */
export function formatForwardPe(reading: ForwardPeReading) {
  if (!reading) return "--";
  return reading.value === null ? "NA" : reading.value.toFixed(2);
}
