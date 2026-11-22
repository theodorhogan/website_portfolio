import { DAY_MS, WEEK_MS } from "../utils/dates";
import { formatPercentChange, formatPrice, getChangeTone, type ChangeTone } from "../utils/format";
import {
  computePercentChange,
  computeRollingHigh,
  getAlignedPoint,
  type TimedValuePoint,
} from "../utils/timeSeries";

export type QuoteRow = {
  ticker: string;
  price: string;
  weekChange: string;
  weekTone: ChangeTone;
  lastWeekChange: string;
  lastWeekTone: ChangeTone;
  high52Week: string;
};

const TRAILING_52_WEEK_MS = 364 * DAY_MS;

/** Price, week-on-week change, prior week's change and trailing high for one ticker as of `time`. */
export function buildQuoteRow(ticker: string, series: readonly TimedValuePoint[], time: number | null): QuoteRow {
  const current = time === null ? null : getAlignedPoint(series, time);

  if (time === null || !current) {
    return {
      ticker,
      price: "--",
      weekChange: "--",
      weekTone: "neutral",
      lastWeekChange: "--",
      lastWeekTone: "neutral",
      high52Week: "--",
    };
  }

  const lastWeek = getAlignedPoint(series, time - WEEK_MS)?.value ?? null;
  const twoWeeks = getAlignedPoint(series, time - 2 * WEEK_MS)?.value ?? null;
  const weekChange = computePercentChange(current.value, lastWeek);
  const lastWeekChange = computePercentChange(lastWeek, twoWeeks);

  return {
    ticker,
    price: formatPrice(current.value),
    weekChange: formatPercentChange(weekChange),
    weekTone: getChangeTone(weekChange),
    lastWeekChange: formatPercentChange(lastWeekChange, true),
    lastWeekTone: getChangeTone(lastWeekChange),
    high52Week: formatPrice(computeRollingHigh(series, current.time, TRAILING_52_WEEK_MS)),
  };
}
