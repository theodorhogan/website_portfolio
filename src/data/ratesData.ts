import treasuryRates2024Csv from "../content/pricedatabase/daily-treasury-rates-2024.csv?raw";
import treasuryRates2025Csv from "../content/pricedatabase/daily-treasury-rates-2025.csv?raw";
import treasuryRates2026Csv from "../content/pricedatabase/daily-treasury-rates-2026.csv?raw";
import durationDataCsv from "../content/pricedatabase/durationdata.csv?raw";
import { parseCsvRows, parseNumberCell } from "../utils/csv";
import { parseUsDateToUtcTime } from "../utils/dates";
import type { TimedValuePoint } from "../utils/timeSeries";
import { lazy, parseLongRows, toSortedSeries } from "./longCsv";

/**
 * Rates datasets for the Duration page: Treasury curve, Fed funds futures,
 * credit spreads and EFFR.
 *
 * Each source file is parsed once, on first use, and the result is shared by
 * every panel. Kept separate from `equityData.ts` so each page only downloads
 * the CSVs it renders.
 *
 * Adding a new year of Treasury data: drop the file next to the others and add
 * it to `TREASURY_FILES`.
 */
export type PricePoint = TimedValuePoint;

export const TREASURY_INSTRUMENT_ORDER = [
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
] as const;

export type TreasuryInstrumentKey = (typeof TREASURY_INSTRUMENT_ORDER)[number];

export const CREDIT_SPREAD_ORDER = ["IG", "AA", "BBB", "HY", "BB", "CCC"] as const;

export type CreditSpreadKey = (typeof CREDIT_SPREAD_ORDER)[number];

export type FedFutureContract = {
  sequence: number;
  ticker: string;
  price: number;
};

export type FedFutureSnapshot = {
  time: number;
  contracts: FedFutureContract[];
};

const TREASURY_FILES = [treasuryRates2024Csv, treasuryRates2025Csv, treasuryRates2026Csv];

/** treasury.gov column header (upper-cased) -> instrument. */
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

function emptySeriesMaps<K extends string>(keys: readonly K[]) {
  return new Map<K, Map<number, number>>(keys.map((key) => [key, new Map<number, number>()]));
}

function finalizeSeries<K extends string>(keys: readonly K[], maps: Map<K, Map<number, number>>) {
  return new Map<K, PricePoint[]>(keys.map((key) => [key, toSortedSeries(maps.get(key) ?? new Map())]));
}

function parseTreasurySeries(rawCsvFiles: string[]) {
  const maps = emptySeriesMaps(TREASURY_INSTRUMENT_ORDER);

  for (const rawCsv of rawCsvFiles) {
    const [header, ...rows] = parseCsvRows(rawCsv);
    if (!header) continue;

    const columns = header.flatMap((name, index) => {
      const ticker = TREASURY_COLUMN_TO_TICKER[name.toUpperCase()];
      return ticker ? [{ index, ticker }] : [];
    });

    for (const cells of rows) {
      const time = parseUsDateToUtcTime(cells[0] ?? "");
      if (time === null) continue;

      for (const { index, ticker } of columns) {
        const value = parseNumberCell(cells[index]);
        if (value !== null) maps.get(ticker)?.set(time, value);
      }
    }
  }

  return finalizeSeries(TREASURY_INSTRUMENT_ORDER, maps);
}

function parseDurationData(rawCsv: string) {
  const futuresByTime = new Map<number, Map<number, FedFutureContract>>();
  const spreadMaps = emptySeriesMaps(CREDIT_SPREAD_ORDER);
  const effrMap = new Map<number, number>();

  for (const row of parseLongRows(rawCsv)) {
    if (row.category === "future") {
      const sequence = row.tag;
      if (sequence === null || sequence < 1) continue;

      const contracts = futuresByTime.get(row.time) ?? new Map<number, FedFutureContract>();
      contracts.set(sequence, { sequence, ticker: row.ticker, price: row.value });
      futuresByTime.set(row.time, contracts);
      continue;
    }

    if (row.category === "spread") {
      spreadMaps.get(row.tickerKey as CreditSpreadKey)?.set(row.time, row.value);
      continue;
    }

    if (row.tickerKey === "EFFR") {
      effrMap.set(row.time, row.value);
    }
  }

  const fedFutures: FedFutureSnapshot[] = [...futuresByTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, contracts]) => ({
      time,
      contracts: [...contracts.values()].sort((a, b) => a.sequence - b.sequence),
    }));

  return {
    fedFutures,
    creditSpreads: finalizeSeries(CREDIT_SPREAD_ORDER, spreadMaps),
    effr: toSortedSeries(effrMap),
  };
}

const getDurationData = lazy(() => parseDurationData(durationDataCsv));

export const getTreasurySeries = lazy(() => parseTreasurySeries(TREASURY_FILES));

export function getFedFuturesSnapshots() {
  return getDurationData().fedFutures;
}

export function getCreditSpreadSeries() {
  return getDurationData().creditSpreads;
}

export function getEffrSeries() {
  return getDurationData().effr;
}
