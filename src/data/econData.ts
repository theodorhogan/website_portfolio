import econUsJson from "../content/data/econ-us.json?raw";
import { MONTH_LABELS, WEEK_MS, parseIsoDateToUtcTime } from "../utils/dates";
import { lazy } from "./csvStore";

/**
 * Economic indicators with their publication history.
 *
 * Every observation keeps each value it has been published with ("prints"), so
 * for any active week the site can show the number as it was known then and
 * say whether it was new or revised that week.
 */
export type EconGroup =
  | "consumption"
  | "employment"
  | "inflation"
  | "housing"
  | "output"
  | "surveys"
  | "trade_money"
  | "quarterly"
  | "gdp_contribution"
  | "debt";

export type EconPrint = {
  published: number;
  value: number;
};

export type EconObservation = {
  /** `2026-10` for a month, `2026Q3` for a quarter. */
  period: string;
  /** UTC timestamp of the period's first day. */
  periodTime: number;
  /** Ascending by publication date. */
  prints: EconPrint[];
  /** GDP series only: every release that covered the quarter, including ones that left the value unchanged. */
  releases: number[];
};

export type EconIndicator = {
  key: string;
  label: string;
  unit: string;
  frequency: "M" | "Q";
  group: EconGroup;
  /** Monthly indicators that also get a bar-chart tile. */
  headline: boolean;
  /** Ascending by period. */
  observations: EconObservation[];
};

/** One observation as it stood in an active week. */
export type EconReading = {
  period: string;
  periodTime: number;
  /** `OCT-26` or `Q3-26`. */
  label: string;
  value: number;
  /** First published in the week ending on the active date. */
  isNew: boolean;
  /** Published earlier, and changed in the week ending on the active date. */
  isRevised: boolean;
  /** The value before this week's revision. */
  previousValue: number | null;
  published: number;
};

export type GdpNowQuarter = {
  quarter: string;
  /** Ascending by publication date. */
  updates: EconPrint[];
};

type RawPrint = { published: string; value: number | null };
type RawObservation = { period: string; prints: RawPrint[]; releases?: string[] };
type RawIndicator = {
  key: string;
  label: string;
  unit: string;
  frequency: "M" | "Q";
  group: EconGroup;
  headline?: boolean;
  observations: RawObservation[];
};
type RawEcon = {
  indicators: RawIndicator[];
  gdpnow: Array<{ quarter: string; updates: RawPrint[] }>;
};

/** `2026-10` -> 1 Oct 2026; `2026Q3` -> 1 Jul 2026. */
function parsePeriod(period: string) {
  const quarter = period.match(/^(\d{4})Q([1-4])$/);
  if (quarter) return Date.UTC(Number(quarter[1]), (Number(quarter[2]) - 1) * 3, 1);

  const month = period.match(/^(\d{4})-(\d{2})$/);
  return month ? Date.UTC(Number(month[1]), Number(month[2]) - 1, 1) : null;
}

function parsePrints(prints: RawPrint[]): EconPrint[] {
  return prints
    .map((print) => ({ published: parseIsoDateToUtcTime(print.published), value: print.value }))
    .filter((print): print is EconPrint => print.published !== null && print.value !== null)
    .sort((a, b) => a.published - b.published);
}

const getEcon = lazy(() => {
  const raw = JSON.parse(econUsJson) as RawEcon;

  const indicators: EconIndicator[] = (raw.indicators ?? []).map((indicator) => ({
    key: indicator.key,
    label: indicator.label,
    unit: indicator.unit,
    frequency: indicator.frequency,
    group: indicator.group,
    headline: indicator.headline === true,
    observations: indicator.observations
      .map((observation) => ({
        period: observation.period,
        periodTime: parsePeriod(observation.period),
        prints: parsePrints(observation.prints),
        releases: (observation.releases ?? [])
          .map(parseIsoDateToUtcTime)
          .filter((time): time is number => time !== null)
          .sort((a, b) => a - b),
      }))
      .filter((observation): observation is EconObservation => observation.periodTime !== null)
      .sort((a, b) => a.periodTime - b.periodTime),
  }));

  const gdpNow: GdpNowQuarter[] = (raw.gdpnow ?? []).map((quarter) => ({
    quarter: quarter.quarter,
    updates: parsePrints(quarter.updates),
  }));

  return { indicators, byKey: new Map(indicators.map((indicator) => [indicator.key, indicator])), gdpNow };
});

export function getEconIndicators() {
  return getEcon().indicators;
}

export function getEconIndicator(key: string) {
  return getEcon().byKey.get(key) ?? null;
}

export function getGdpNowQuarters() {
  return getEcon().gdpNow;
}

/** Decimals an indicator is shown with. The data comes unrounded. */
export function getEconDecimals(indicator: Pick<EconIndicator, "unit">) {
  const unit = indicator.unit.toLowerCase();
  if (unit.startsWith("thousands") || unit.startsWith("change, thousands")) return 0;
  if (unit === "%" || unit.startsWith("index") || unit.startsWith("$bn") || unit === "% of gdp") return 1;
  if (unit === "% q/q saar") return 1;
  return 2;
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatPeriodLabel(period: string, periodTime: number) {
  const quarter = period.match(/^(\d{4})Q([1-4])$/);
  if (quarter) return `Q${quarter[2]}-${quarter[1].slice(-2)}`;

  const date = new Date(periodTime);
  return `${MONTH_LABELS[date.getUTCMonth()]}-${String(date.getUTCFullYear()).slice(-2)}`;
}

/**
 * The last `count` observations of `indicator` as they were known on `activeTime`, oldest first.
 * An observation not yet published by then is left out. "New" and "revised" refer to the
 * seven days ending on the active date, and a revision too small to change the shown figure is ignored.
 */
export function getEconReadings(indicator: EconIndicator, activeTime: number, count: number): EconReading[] {
  const weekStart = activeTime - WEEK_MS;
  const decimals = getEconDecimals(indicator);
  const readings: EconReading[] = [];

  for (let index = indicator.observations.length - 1; index >= 0 && readings.length < count; index -= 1) {
    const observation = indicator.observations[index];
    const known = observation.prints.filter((print) => print.published <= activeTime);
    if (known.length === 0) continue;

    const current = known[known.length - 1];
    const before = known.filter((print) => print.published <= weekStart);
    const previous = before.length > 0 ? before[before.length - 1] : null;
    const isNew = previous === null;
    const isRevised = previous !== null && roundTo(previous.value, decimals) !== roundTo(current.value, decimals);

    readings.push({
      period: observation.period,
      periodTime: observation.periodTime,
      label: formatPeriodLabel(observation.period, observation.periodTime),
      value: current.value,
      isNew,
      isRevised,
      previousValue: isRevised && previous ? previous.value : null,
      published: current.published,
    });
  }

  return readings.reverse();
}

/** `+0.21`, `4.1`, `1,309`: a reading in its indicator's precision. Changes carry a sign. */
export function formatEconValue(indicator: Pick<EconIndicator, "unit">, value: number | null) {
  if (value === null) return "--";

  const decimals = getEconDecimals(indicator);
  const text = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const rounded = roundTo(value, decimals);
  if (rounded === 0) return text;

  const unit = indicator.unit.toLowerCase();
  const signed = unit.includes("m/m") || unit.includes("y/y") || unit.includes("q/q") || unit.includes("change") || unit.startsWith("pp");
  if (rounded < 0) return `-${text}`;
  return signed ? `+${text}` : text;
}
