import seriesCsv from "../content/data/series.csv?raw";
import treasuryNominalCsv from "../content/data/treasury-nominal.csv?raw";
import treasuryRealCsv from "../content/data/treasury-real.csv?raw";
import zqCsv from "../content/data/zq.csv?raw";
import { parseCsvRows, parseNumberCell } from "../utils/csv";
import { parseIsoDateToUtcTime } from "../utils/dates";
import type { TimedValuePoint } from "../utils/timeSeries";
import { combineSeries, dropNa, lazy, parseLongSeries, parseWideSeries, type NullablePoint } from "./csvStore";

/**
 * Rates datasets: the Treasury nominal and real curves, fed funds futures, and
 * the one-number-per-date series (credit spreads, EFFR, Fed liquidity, mortgage
 * rates, Bund, Gilt, uranium).
 *
 * Each file is parsed once, on first use, and the result is shared by every panel.
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

/** Tenors of the real (TIPS) curve, in display order. */
export const REAL_TENOR_ORDER = ["5Y", "7Y", "10Y", "20Y", "30Y"] as const;

export type RealTenorKey = (typeof REAL_TENOR_ORDER)[number];

export const CREDIT_SPREAD_ORDER = ["IG", "AA", "BBB", "HY", "BB", "CCC"] as const;

export type CreditSpreadKey = (typeof CREDIT_SPREAD_ORDER)[number];

/** Keys of `series.csv`. Spreads are in basis points, rates in percent, Fed liquidity in $bn. */
export type SeriesKey =
  | "OAS_IG"
  | "OAS_AA"
  | "OAS_BBB"
  | "OAS_HY"
  | "OAS_BB"
  | "OAS_CCC"
  | "EFFR"
  | "SOFR"
  | "IORB"
  | "MORTGAGE_30Y"
  | "MORTGAGE_15Y"
  | "DE10Y"
  | "UK10Y"
  | "RRP"
  | "REPO"
  | "RESERVES"
  | "TGA"
  | "SOMA"
  | "SOMA_UST"
  | "SOMA_MBS"
  | "FED_ASSETS"
  | "UX";

export type FedFutureContract = {
  /** Position from the front month, starting at 1. */
  sequence: number;
  /** Contract month, `YYYY-MM`. */
  contract: string;
  /** `Nov ZQ26`, the label the futures panels read the month and year from. */
  ticker: string;
  price: number;
};

export type FedFutureSnapshot = {
  time: number;
  contracts: FedFutureContract[];
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseTreasuryNominal(rawCsv: string) {
  const byColumn = parseWideSeries(rawCsv);
  // Columns are `1M` ... `30Y`; the panels know the tenors as `US1M` ... `US30Y`.
  return new Map<TreasuryInstrumentKey, PricePoint[]>(
    TREASURY_INSTRUMENT_ORDER.map((ticker) => [ticker, byColumn.get(ticker.slice(2)) ?? []]),
  );
}

function parseTreasuryReal(rawCsv: string) {
  const byColumn = parseWideSeries(rawCsv);
  return new Map<RealTenorKey, PricePoint[]>(REAL_TENOR_ORDER.map((tenor) => [tenor, byColumn.get(tenor) ?? []]));
}

/** `2026-11` -> `Nov ZQ26`. */
function toZqTicker(contract: string) {
  const [year, month] = contract.split("-");
  return `${MONTH_NAMES[Number(month) - 1] ?? month} ZQ${year.slice(-2)}`;
}

/** `zq.csv` rows are `date,contract,price,source`; a snapshot lists its contracts from the front month out. */
function parseFedFutures(rawCsv: string): FedFutureSnapshot[] {
  const [, ...rows] = parseCsvRows(rawCsv);
  const pricesByTime = new Map<number, Map<string, number>>();

  for (const cells of rows) {
    const time = parseIsoDateToUtcTime(cells[0] ?? "");
    const contract = cells[1] ?? "";
    const price = parseNumberCell(cells[2]);
    if (time === null || price === null || !/^\d{4}-\d{2}$/.test(contract)) continue;

    let prices = pricesByTime.get(time);
    if (!prices) {
      prices = new Map();
      pricesByTime.set(time, prices);
    }
    prices.set(contract, price);
  }

  return [...pricesByTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, prices]) => ({
      time,
      contracts: [...prices.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([contract, price], index) => ({ sequence: index + 1, contract, ticker: toZqTicker(contract), price })),
    }));
}

export const getTreasurySeries = lazy(() => parseTreasuryNominal(treasuryNominalCsv));

export const getRealYieldSeries = lazy(() => parseTreasuryReal(treasuryRealCsv));

/** Breakeven inflation per tenor: nominal minus real yield, on the days both curves printed. */
export const getBreakevenSeries = lazy(() => {
  const nominal = getTreasurySeries();
  const real = getRealYieldSeries();
  return new Map<RealTenorKey, PricePoint[]>(
    REAL_TENOR_ORDER.map((tenor) => [
      tenor,
      combineSeries(
        nominal.get(`US${tenor}` as TreasuryInstrumentKey) ?? [],
        real.get(tenor) ?? [],
        (nominalYield, realYield) => nominalYield - realYield,
      ),
    ]),
  );
});

/** The 5-year rate five years forward implied by a curve: 2 x 10Y - 5Y. */
export function getFiveYearForward(curve: ReadonlyMap<RealTenorKey, PricePoint[]>): PricePoint[] {
  return combineSeries(curve.get("10Y") ?? [], curve.get("5Y") ?? [], (tenYear, fiveYear) => 2 * tenYear - fiveYear);
}

export const getFedFuturesSnapshots = lazy(() => parseFedFutures(zqCsv));

const getSeriesByKey = lazy(() => parseLongSeries(seriesCsv));

/** One series from `series.csv`, without its NA rows. */
export function getSeries(key: SeriesKey): PricePoint[] {
  return dropNa(getSeriesByKey().get(key));
}

/** One series from `series.csv` with its NA rows, for panels that show "NA" in a week without a value. */
export function getNullableSeries(key: SeriesKey): NullablePoint[] {
  return getSeriesByKey().get(key) ?? [];
}

export const getCreditSpreadSeries = lazy(
  () =>
    new Map<CreditSpreadKey, PricePoint[]>(
      CREDIT_SPREAD_ORDER.map((ticker) => [ticker, getSeries(`OAS_${ticker}` as SeriesKey)]),
    ),
);

export function getEffrSeries() {
  return getSeries("EFFR");
}
