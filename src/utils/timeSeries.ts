import { DAY_MS, getWeekIndex } from "./dates";

/**
 * Pure time-series helpers shared by every data panel.
 *
 * All functions assume their input is sorted by ascending `time`, which the
 * parsers in `src/data` guarantee.
 */
export type TimedPoint = {
  time: number;
};

export type TimedValuePoint = {
  time: number;
  value: number;
};

const MAX_ALIGNMENT_GAP_DAYS_DEFAULT = 21;

/** Index of the last point at or before `targetTime` (binary search), or -1. */
export function findLastIndexAtOrBefore(points: readonly TimedPoint[], targetTime: number) {
  let low = 0;
  let high = points.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (points[mid].time <= targetTime) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

/**
 * Week-aware alignment of a series to a target date.
 *
 * Picks the most recent point that is not after the target, and accepts it
 * when it falls in the target's ISO week or within `maxGapDays` of the target.
 */
export function resolveAlignedPointIndex(
  points: readonly TimedPoint[],
  targetTime: number,
  maxGapDays = MAX_ALIGNMENT_GAP_DAYS_DEFAULT,
) {
  const index = findLastIndexAtOrBefore(points, targetTime);
  if (index < 0) return -1;

  const pointTime = points[index].time;
  if (targetTime - pointTime <= maxGapDays * DAY_MS) return index;
  return getWeekIndex(pointTime) === getWeekIndex(targetTime) ? index : -1;
}

export function getAlignedPoint<T extends TimedPoint>(
  points: readonly T[],
  targetTime: number,
  maxGapDays = MAX_ALIGNMENT_GAP_DAYS_DEFAULT,
) {
  const index = resolveAlignedPointIndex(points, targetTime, maxGapDays);
  return index >= 0 ? points[index] : null;
}

export function computePercentChange(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) return null;
  return current / previous - 1;
}

export function computeNominalChange(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  return current - previous;
}

/**
 * Highest value in the `windowMs` ending at `endTime`. Falls back to the
 * highest value of everything up to `endTime` when the window is empty.
 */
export function computeRollingHigh(points: readonly TimedValuePoint[], endTime: number, windowMs: number) {
  const endIndex = findLastIndexAtOrBefore(points, endTime);
  if (endIndex < 0) return null;

  const windowStart = endTime - windowMs;
  const firstInWindow = points[endIndex].time >= windowStart;
  let high = -Infinity;

  for (let i = endIndex; i >= 0; i -= 1) {
    if (firstInWindow && points[i].time < windowStart) break;
    if (points[i].value > high) high = points[i].value;
  }

  return high;
}

/** The point a year-to-date comparison starts from: last print on or before Jan 1, else the year's first print. */
export function getYearAnchorPoint<T extends TimedPoint>(series: readonly T[], year: number) {
  const index = findLastIndexAtOrBefore(series, Date.UTC(year, 0, 1));
  if (index >= 0) return series[index];

  const first = series[0];
  return first && new Date(first.time).getUTCFullYear() === year ? first : null;
}

export function getYearAnchorValue(series: readonly TimedValuePoint[], year: number) {
  return getYearAnchorPoint(series, year)?.value ?? null;
}
