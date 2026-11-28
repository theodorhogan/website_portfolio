import { REAL_TENOR_ORDER, getFiveYearForward, type RealTenorKey } from "../data/ratesData";
import { WEEK_MS } from "../utils/dates";
import {
  computeNominalChange,
  getAlignedPoint,
  getYearAnchorPoint,
  resolveAlignedPointIndex,
  type TimedValuePoint,
} from "../utils/timeSeries";

/**
 * The figures behind the rate tables (Money to Capital Markets, Real Yields,
 * Breakevens, OAS, mortgage rates): one series as it stands in an active week,
 * and the extreme print of the look-back window ending there.
 */
export type CycleMode = "high" | "low";

/** One row of a cycle table: a tenor or rating and its series. */
export type CycleSeriesRow = {
  label: string;
  series: readonly TimedValuePoint[];
};

export type WeekFigures = {
  /** Index in the series of the active week's point. */
  activeIndex: number;
  current: number;
  lastWeek: number | null;
  yearStart: number | null;
  weekChange: number | null;
  ytdChange: number | null;
};

export const MIN_CYCLE_MONTHS = 1;
export const MAX_CYCLE_MONTHS = 36;
export const DEFAULT_CYCLE_MONTHS = 6;

export function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clampCycleMonths(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_CYCLE_MONTHS;
  return Math.min(MAX_CYCLE_MONTHS, Math.max(MIN_CYCLE_MONTHS, Math.floor(value)));
}

export function getWindowStartTime(endpointTime: number, cycleMonths: number) {
  const endpointDate = new Date(endpointTime);
  endpointDate.setUTCMonth(endpointDate.getUTCMonth() - cycleMonths);
  return Date.UTC(endpointDate.getUTCFullYear(), endpointDate.getUTCMonth(), endpointDate.getUTCDate());
}

/** Highest or lowest print in the look-back window ending at the active point; ties resolve to the latest date. */
export function getCyclePoint(
  series: readonly TimedValuePoint[],
  activeIndex: number,
  mode: CycleMode,
  cycleMonths: number,
  activeTime: number,
) {
  const windowStart = getWindowStartTime(activeTime, cycleMonths);
  let bestPoint: TimedValuePoint | null = null;

  for (let i = activeIndex; i >= 0; i -= 1) {
    const point = series[i];
    if (point.time < windowStart) break;

    if (!bestPoint || (mode === "high" ? point.value > bestPoint.value : point.value < bestPoint.value)) {
      bestPoint = point;
    }
  }

  return bestPoint;
}

/**
 * This week, last week and the year's start for one series, or null when it has no point for the active week.
 * The changes are computed from the rounded values so they always match the figures shown beside them.
 */
export function getWeekFigures(
  series: readonly TimedValuePoint[],
  activeTime: number,
  decimals: number,
): WeekFigures | null {
  const activeIndex = resolveAlignedPointIndex(series, activeTime);
  if (activeIndex < 0) return null;

  const lastWeekPoint = getAlignedPoint(series, activeTime - WEEK_MS);
  const yearStartPoint = getYearAnchorPoint(series, new Date(activeTime).getUTCFullYear());

  const current = roundTo(series[activeIndex].value, decimals);
  const lastWeek = lastWeekPoint ? roundTo(lastWeekPoint.value, decimals) : null;
  const yearStart = yearStartPoint ? roundTo(yearStartPoint.value, decimals) : null;
  const weekChange = computeNominalChange(current, lastWeek);
  const ytdChange = computeNominalChange(current, yearStart);

  return {
    activeIndex,
    current,
    lastWeek,
    yearStart,
    weekChange: weekChange !== null ? roundTo(weekChange, decimals) : null,
    ytdChange: ytdChange !== null ? roundTo(ytdChange, decimals) : null,
  };
}

/** The rows of a real-curve table: its five tenors, then the 5-year rate five years forward. */
export function getCurveRows(curve: ReadonlyMap<RealTenorKey, TimedValuePoint[]>): CycleSeriesRow[] {
  return [
    ...REAL_TENOR_ORDER.map((tenor) => ({ label: tenor, series: curve.get(tenor) ?? [] })),
    { label: "5Y5Y FWD", series: getFiveYearForward(curve) },
  ];
}

/** `4.25`, `98bp`, or `[4.25]` for a previous-week figure; `--` when missing. */
export function formatFigure(value: number | null, decimals: number, suffix = "", bracketed = false) {
  if (value === null) return "--";
  const text = `${value.toFixed(decimals)}${suffix}`;
  return bracketed ? `[${text}]` : text;
}

/** `+0.05`, `-9bp`; a flat change carries no sign. */
export function formatFigureChange(value: number | null, decimals: number, suffix = "") {
  if (value === null) return "--";
  if (Math.abs(value) < 0.00005) return formatFigure(0, decimals, suffix);
  return `${value > 0 ? "+" : ""}${formatFigure(value, decimals, suffix)}`;
}
