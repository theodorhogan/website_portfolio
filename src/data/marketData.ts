import durationDataCsv from "../content/pricedatabase/durationdata.csv?raw";
import treasuryRates2024Csv from "../content/pricedatabase/daily-treasury-rates-2024.csv?raw";
import treasuryRates2025Csv from "../content/pricedatabase/daily-treasury-rates-2025.csv?raw";
import treasuryRates2026Csv from "../content/pricedatabase/daily-treasury-rates-2026.csv?raw";
import equityDataCsv from "../content/pricedatabase/equitydata.csv?raw";

/**
 * Shared market data registry.
 *
 * Why this exists:
 * - Parse each CSV only once at app startup.
 * - Keep all week/date alignment rules in one place.
 * - Give components stable getters instead of ad-hoc parsing logic.
 *
 * Adding another datasource later:
 * 1) add a `parse...` function in this file,
 * 2) initialize one cached constant near the bottom,
 * 3) expose a small getter so components stay thin.
 */
export type PricePoint = {
  time: number;
  value: number;
};

export type RegionKey = "us" | "eu";

export type TreasuryInstrumentKey =
  | "US1M"
  | "US2M"
  | "US3M"
  | "US4M"
  | "US6M"
  | "US1Y"
  | "US2Y"
  | "US3Y"
  | "US5Y"
  | "US7Y"
  | "US10Y"
  | "US20Y"
  | "US30Y";

export type FedFutureContract = {
  sequence: number;
  ticker: string;
  price: number;
};

export type FedFutureSnapshot = {
  time: number;
  contracts: FedFutureContract[];
};

export type CreditSpreadKey = "IG" | "AA" | "BBB" | "HY" | "BB" | "CCC";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

const MAX_ALIGNMENT_GAP_DAYS_DEFAULT = 21;

export const TREASURY_INSTRUMENT_ORDER: TreasuryInstrumentKey[] = [
  "US1M",
  "US2M",
  "US3M",
  "US4M",
  "US6M",
  "US1Y",
  "US2Y",
  "US3Y",
  "US5Y",
  "US7Y",
  "US10Y",
  "US20Y",
  "US30Y",
];

export const CREDIT_SPREAD_ORDER: CreditSpreadKey[] = ["IG", "AA", "BBB", "HY", "BB", "CCC"];

export const MAJOR_INDEX_ORDER = [
  "MSCI",
  "SPX",
  "NDX",
  "R2000",
  "IJR",
  "DAX",
  "STOXX600",
  "FTSE",
  "AEX",
  "NIKKEI",
] as const;

export type MajorIndexKey = (typeof MAJOR_INDEX_ORDER)[number];

const MAJOR_INDEX_ALIASES: Record<MajorIndexKey, string[]> = {
  MSCI: ["MSCI"],
  SPX: ["SPX", "SXP"],
  NDX: ["NDX"],
  R2000: ["R2000"],
  IJR: ["IJR"],
  DAX: ["DAX"],
  STOXX600: ["STOXX600"],
  FTSE: ["FTSE"],
  AEX: ["AEX"],
  NIKKEI: ["NIKKEI"],
};

const MAJOR_ALIAS_TO_DISPLAY = new Map<string, MajorIndexKey>(
  Object.entries(MAJOR_INDEX_ALIASES).flatMap(([displayTicker, aliases]) =>
    aliases.map((alias) => [alias, displayTicker as MajorIndexKey]),
  ),
);

const TREASURY_COLUMN_TO_TICKER: Record<string, TreasuryInstrumentKey> = {
  "1 MO": "US1M",
  "2 MO": "US2M",
  "3 MO": "US3M",
  "4 MO": "US4M",
  "6 MO": "US6M",
  "1 YR": "US1Y",
  "2 YR": "US2Y",
  "3 YR": "US3Y",
  "5 YR": "US5Y",
  "7 YR": "US7Y",
  "10 YR": "US10Y",
  "20 YR": "US20Y",
  "30 YR": "US30Y",
};

const TREASURY_TICKER_SET = new Set<TreasuryInstrumentKey>(TREASURY_INSTRUMENT_ORDER);

function dedupeSortSeries(seriesMap: Map<number, number>) {
  return [...seriesMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, value]) => ({ time, value }));
}

export function parseCsvLine(line: string) {
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((part) => part.trim());
}

export function toExcelUtcTime(serial: number) {
  return EXCEL_EPOCH_UTC + Math.round(serial) * DAY_MS;
}

export function parseUsDateToUtcTime(raw: string) {
  const value = raw.trim().replace(/^"|"$/g, "");
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}

export function getIsoWeekKeyFromTime(time: number) {
  const date = new Date(time);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-${weekNumber}`;
}

/**
 * Shared week-aware alignment:
 * 1) prefer most recent point in same ISO week but never after target
 * 2) otherwise use most recent prior point within max gap (default 21 days)
 */
export function resolveAlignedPointIndex(
  points: Array<{ time: number }>,
  targetTime: number,
  maxGapDays = MAX_ALIGNMENT_GAP_DAYS_DEFAULT,
) {
  const targetWeek = getIsoWeekKeyFromTime(targetTime);
  const maxGapMs = maxGapDays * DAY_MS;

  for (let i = points.length - 1; i >= 0; i -= 1) {
    const point = points[i];
    if (point.time <= targetTime && getIsoWeekKeyFromTime(point.time) === targetWeek) {
      return i;
    }
  }

  for (let i = points.length - 1; i >= 0; i -= 1) {
    const point = points[i];
    if (point.time <= targetTime) {
      return targetTime - point.time <= maxGapMs ? i : -1;
    }
  }

  return -1;
}

export function resolveAlignedTime(
  sortedTimes: number[],
  targetTime: number,
  maxGapDays = MAX_ALIGNMENT_GAP_DAYS_DEFAULT,
) {
  const points = sortedTimes.map((time) => ({ time }));
  const index = resolveAlignedPointIndex(points, targetTime, maxGapDays);
  return index >= 0 ? sortedTimes[index] : null;
}

export function getAlignedPoint<T extends { time: number }>(
  points: T[],
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

export function computeRollingHigh(points: PricePoint[], endTime: number, windowMs: number) {
  const windowStart = endTime - windowMs;
  const inWindow = points.filter((point) => point.time <= endTime && point.time >= windowStart);
  const candidates = inWindow.length > 0 ? inWindow : points.filter((point) => point.time <= endTime);
  if (candidates.length === 0) return null;
  return Math.max(...candidates.map((point) => point.value));
}

function classifyIndustryRegion(ticker: string): RegionKey | null {
  const upper = ticker.trim().toUpperCase();
  if (upper.startsWith("XL")) return "us";
  if (upper.startsWith("EX")) return "eu";
  return null;
}

function parseTreasurySeries(rawCsvFiles: string[]) {
  const seriesByTicker = new Map<TreasuryInstrumentKey, Map<number, number>>();
  for (const ticker of TREASURY_INSTRUMENT_ORDER) {
    seriesByTicker.set(ticker, new Map<number, number>());
  }

  for (const rawCsv of rawCsvFiles) {
    const lines = rawCsv.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) continue;

    const header = parseCsvLine(lines[0]).map((part) => part.replace(/^"|"$/g, "").trim().toUpperCase());
    const columns: Array<{ index: number; ticker: TreasuryInstrumentKey }> = [];

    header.forEach((name, index) => {
      const ticker = TREASURY_COLUMN_TO_TICKER[name];
      if (ticker && TREASURY_TICKER_SET.has(ticker)) {
        columns.push({ index, ticker });
      }
    });

    for (let i = 1; i < lines.length; i += 1) {
      const parts = parseCsvLine(lines[i]);
      const time = parseUsDateToUtcTime(parts[0] ?? "");
      if (time === null) continue;

      for (const { index, ticker } of columns) {
        const value = Number((parts[index] ?? "").replace(/^"|"$/g, "").trim());
        if (!Number.isFinite(value)) continue;
        seriesByTicker.get(ticker)?.set(time, value);
      }
    }
  }

  const output = new Map<TreasuryInstrumentKey, PricePoint[]>();
  for (const ticker of TREASURY_INSTRUMENT_ORDER) {
    output.set(ticker, dedupeSortSeries(seriesByTicker.get(ticker) ?? new Map<number, number>()));
  }
  return output;
}

function parseFedFutures(rawCsv: string) {
  const snapshotsMap = new Map<number, Map<number, FedFutureContract>>();

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = parseCsvLine(line);
    if (parts.length < 6) continue;

    const excelDate = Number(parts[0]);
    const ticker = (parts[2] ?? "").trim();
    const category = (parts[3] ?? "").trim().toLowerCase();
    const price = Number(parts[4]);
    const sequence = Number(parts[5]);

    if (category !== "future") continue;
    if (!Number.isFinite(excelDate) || !Number.isFinite(price) || !Number.isFinite(sequence)) continue;
    if (sequence < 1 || sequence > 12) continue;

    const time = toExcelUtcTime(excelDate);
    const rowMap = snapshotsMap.get(time) ?? new Map<number, FedFutureContract>();
    rowMap.set(sequence, { sequence, ticker, price });
    snapshotsMap.set(time, rowMap);
  }

  return [...snapshotsMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, contractsMap]) => ({
      time,
      contracts: [...contractsMap.values()].sort((a, b) => a.sequence - b.sequence),
    }));
}

function parseMajorIndexSeries(rawCsv: string) {
  const bucketMaps = new Map<MajorIndexKey, Map<number, number>>();
  for (const ticker of MAJOR_INDEX_ORDER) {
    bucketMaps.set(ticker, new Map<number, number>());
  }

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = parseCsvLine(line);
    if (parts.length < 5) continue;

    const excelDate = Number(parts[0]);
    const tickerRaw = (parts[2] ?? "").trim().toUpperCase();
    const value = Number(parts[4]);
    const ticker = MAJOR_ALIAS_TO_DISPLAY.get(tickerRaw);

    if (!ticker || !Number.isFinite(excelDate) || !Number.isFinite(value)) {
      continue;
    }

    bucketMaps.get(ticker)?.set(toExcelUtcTime(excelDate), value);
  }

  const output = new Map<MajorIndexKey, PricePoint[]>();
  for (const ticker of MAJOR_INDEX_ORDER) {
    output.set(ticker, dedupeSortSeries(bucketMaps.get(ticker) ?? new Map<number, number>()));
  }
  return output;
}

function parseWatchlistStoxSeries(rawCsv: string) {
  const seriesMaps = new Map<string, Map<number, number>>();
  const tickersByTime = new Map<number, string[]>();

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = parseCsvLine(line);
    if (parts.length < 5) continue;

    const excelDate = Number(parts[0]);
    const ticker = (parts[2] ?? "").trim().toUpperCase();
    const tag = (parts[3] ?? "").trim().toLowerCase();
    const value = Number(parts[4]);
    if (tag !== "stox" || !ticker || !Number.isFinite(excelDate) || !Number.isFinite(value)) {
      continue;
    }

    const time = toExcelUtcTime(excelDate);
    const tickerMap = seriesMaps.get(ticker) ?? new Map<number, number>();
    tickerMap.set(time, value);
    seriesMaps.set(ticker, tickerMap);

    const activeTickers = tickersByTime.get(time) ?? [];
    if (!activeTickers.includes(ticker)) {
      activeTickers.push(ticker);
      tickersByTime.set(time, activeTickers);
    }
  }

  const seriesByTicker = new Map<string, PricePoint[]>();
  for (const [ticker, map] of seriesMaps.entries()) {
    seriesByTicker.set(ticker, dedupeSortSeries(map));
  }

  const sortedTimes = [...tickersByTime.keys()].sort((a, b) => a - b);
  return { seriesByTicker, tickersByTime, sortedTimes };
}

function parseIndustrySeries(rawCsv: string) {
  const buckets = new Map<number, Map<RegionKey, Map<number, number>>>();

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = parseCsvLine(line);
    if (parts.length < 6) continue;

    const excelDate = Number(parts[0]);
    const ticker = (parts[2] ?? "").trim();
    const category = (parts[3] ?? "").trim().toLowerCase();
    const price = Number(parts[4]);
    const industryTag = Number(parts[5]);
    const region = classifyIndustryRegion(ticker);

    if (
      category !== "einx" ||
      !region ||
      !Number.isFinite(excelDate) ||
      !Number.isFinite(price) ||
      !Number.isInteger(industryTag) ||
      industryTag < 1 ||
      industryTag > 11
    ) {
      continue;
    }

    const time = toExcelUtcTime(excelDate);
    const byRegion = buckets.get(industryTag) ?? new Map<RegionKey, Map<number, number>>();
    const regionMap = byRegion.get(region) ?? new Map<number, number>();
    regionMap.set(time, price);
    byRegion.set(region, regionMap);
    buckets.set(industryTag, byRegion);
  }

  const output = new Map<number, Record<RegionKey, PricePoint[]>>();
  for (let industryId = 1; industryId <= 11; industryId += 1) {
    const byRegion = buckets.get(industryId);
    output.set(industryId, {
      us: dedupeSortSeries(byRegion?.get("us") ?? new Map<number, number>()),
      eu: dedupeSortSeries(byRegion?.get("eu") ?? new Map<number, number>()),
    });
  }

  return output;
}

function parseCreditSpreadSeries(rawCsv: string) {
  const seriesMaps = new Map<CreditSpreadKey, Map<number, number>>();
  for (const ticker of CREDIT_SPREAD_ORDER) {
    seriesMaps.set(ticker, new Map<number, number>());
  }

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = parseCsvLine(line);
    if (parts.length < 5) continue;

    const excelDate = Number(parts[0]);
    const ticker = (parts[2] ?? "").trim().toUpperCase() as CreditSpreadKey;
    const category = (parts[3] ?? "").trim().toLowerCase();
    const value = Number(parts[4]);

    if (category !== "spread" || !seriesMaps.has(ticker) || !Number.isFinite(excelDate) || !Number.isFinite(value)) {
      continue;
    }

    seriesMaps.get(ticker)?.set(toExcelUtcTime(excelDate), value);
  }

  const output = new Map<CreditSpreadKey, PricePoint[]>();
  for (const ticker of CREDIT_SPREAD_ORDER) {
    output.set(ticker, dedupeSortSeries(seriesMaps.get(ticker) ?? new Map<number, number>()));
  }
  return output;
}

function parseEffrSeries(rawCsv: string) {
  const seriesMap = new Map<number, number>();

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = parseCsvLine(line);
    if (parts.length < 5) continue;

    const excelDate = Number(parts[0]);
    const ticker = (parts[2] ?? "").trim().toUpperCase();
    const value = Number(parts[4]);

    if (ticker !== "EFFR" || !Number.isFinite(excelDate) || !Number.isFinite(value)) {
      continue;
    }

    seriesMap.set(toExcelUtcTime(excelDate), value);
  }

  return dedupeSortSeries(seriesMap);
}

// Single initialization point so all components share parsed data in-memory.
const TREASURY_SERIES = parseTreasurySeries([
  treasuryRates2024Csv,
  treasuryRates2025Csv,
  treasuryRates2026Csv,
]);
const FED_FUTURES_SNAPSHOTS = parseFedFutures(durationDataCsv);
const CREDIT_SPREAD_SERIES = parseCreditSpreadSeries(durationDataCsv);
const EFFR_SERIES = parseEffrSeries(durationDataCsv);
const MAJOR_INDEX_SERIES = parseMajorIndexSeries(equityDataCsv);
const WATCHLIST_STOX_SERIES = parseWatchlistStoxSeries(equityDataCsv);
const INDUSTRY_SERIES = parseIndustrySeries(equityDataCsv);

export function getTreasurySeries() {
  return TREASURY_SERIES;
}

export function getFedFuturesSnapshots() {
  return FED_FUTURES_SNAPSHOTS;
}

export function getCreditSpreadSeries() {
  return CREDIT_SPREAD_SERIES;
}

export function getEffrSeries() {
  return EFFR_SERIES;
}

export function getMajorIndexSeries() {
  return MAJOR_INDEX_SERIES;
}

export function getWatchlistStoxSeries() {
  return WATCHLIST_STOX_SERIES;
}

export function getIndustrySeries() {
  return INDUSTRY_SERIES;
}
