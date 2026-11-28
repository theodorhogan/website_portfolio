import closesDailyCsv from "../content/data/closes-daily.csv?raw";
import instrumentsCsv from "../content/data/instruments.csv?raw";
import { parseCsvRows } from "../utils/csv";
import { parseIsoDateToUtcTime } from "../utils/dates";
import type { TimedValuePoint } from "../utils/timeSeries";
import { lazy, parseWideSeries } from "./csvStore";

/**
 * Daily closes for everything quoted on the site: indexes, sector ETFs, the
 * stock watchlist, commodities and crypto. `instruments.csv` is the dictionary
 * for the columns of `closes-daily.csv`.
 */
export type PricePoint = TimedValuePoint;

export type RegionKey = "us" | "eu";

export type InstrumentGroup = "index" | "sector" | "stock" | "commodity" | "crypto" | "etf";

export type Instrument = {
  ticker: string;
  name: string;
  group: InstrumentGroup;
  /** Industry number for sector ETFs; `metals`, `energy`, `agriculture` or `other` for commodities. */
  section: string;
  region: RegionKey | null;
  order: number;
  /** First day on the list. */
  added: number;
  /** First day off the list, or null while still listed. */
  removed: number | null;
};

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

/** GICS sectors in display order; `id` is the `section` of a sector ETF in `instruments.csv`. */
export const INDUSTRIES = [
  { id: 1, label: "Information Tech", shortLabel: "Info Tech" },
  { id: 2, label: "Financials", shortLabel: "Financials" },
  { id: 3, label: "Healthcare", shortLabel: "Healthcare" },
  { id: 4, label: "Consumer Disc.", shortLabel: "Cons. Disc." },
  { id: 5, label: "Communication", shortLabel: "Communication" },
  { id: 6, label: "Industrials", shortLabel: "Industrials" },
  { id: 7, label: "Consumer Staples", shortLabel: "Cons. Staples" },
  { id: 8, label: "Energy", shortLabel: "Energy" },
  { id: 9, label: "Materials", shortLabel: "Materials" },
  { id: 10, label: "Utilities", shortLabel: "Utilities" },
  { id: 11, label: "Real Estate", shortLabel: "Real Estate" },
] as const;

/** `instruments.csv` has a header row: ticker,name,group,section,region,order,added,removed. */
function parseInstruments(rawCsv: string): Instrument[] {
  const [header, ...rows] = parseCsvRows(rawCsv);
  if (!header) return [];

  const column = (name: string) => header.indexOf(name);
  const columns = {
    ticker: column("ticker"),
    name: column("name"),
    group: column("group"),
    section: column("section"),
    region: column("region"),
    order: column("order"),
    added: column("added"),
    removed: column("removed"),
  };

  const instruments: Instrument[] = [];
  for (const cells of rows) {
    const ticker = cells[columns.ticker] ?? "";
    if (!ticker) continue;

    const region = cells[columns.region];
    instruments.push({
      ticker,
      name: cells[columns.name] ?? ticker,
      group: (cells[columns.group] ?? "stock") as InstrumentGroup,
      section: cells[columns.section] ?? "",
      region: region === "us" || region === "eu" ? region : null,
      order: Number(cells[columns.order]) || 0,
      added: parseIsoDateToUtcTime(cells[columns.added] ?? "") ?? Number.NEGATIVE_INFINITY,
      removed: parseIsoDateToUtcTime(cells[columns.removed] ?? ""),
    });
  }

  return instruments;
}

export const getInstruments = lazy(() => parseInstruments(instrumentsCsv));

const getClosesByTicker = lazy(() => parseWideSeries(closesDailyCsv));

/** Daily closes of one instrument, ascending. Empty when the ticker is unknown. */
export function getCloseSeries(ticker: string): PricePoint[] {
  return getClosesByTicker().get(ticker) ?? [];
}

/** Instruments of one group in display order. */
export function getInstrumentsByGroup(group: InstrumentGroup): Instrument[] {
  return getInstruments()
    .filter((instrument) => instrument.group === group)
    .sort((a, b) => a.order - b.order);
}

export const getMajorIndexSeries = lazy(
  () => new Map<MajorIndexKey, PricePoint[]>(MAJOR_INDEX_ORDER.map((key) => [key, getCloseSeries(key)])),
);

export const getWatchlistSeries = lazy(() => {
  const stocks = getInstrumentsByGroup("stock");

  return {
    seriesByTicker: new Map<string, PricePoint[]>(stocks.map((stock) => [stock.ticker, getCloseSeries(stock.ticker)])),
    /** The stocks that were on the watchlist on `time`, in list order. */
    tickersAt(time: number) {
      return stocks
        .filter((stock) => stock.added <= time && (stock.removed === null || time < stock.removed))
        .map((stock) => stock.ticker);
    },
  };
});

export const getIndustrySeries = lazy(() => {
  const sectors = getInstrumentsByGroup("sector");

  return new Map<number, Record<RegionKey, PricePoint[]>>(
    INDUSTRIES.map(({ id }) => {
      const seriesFor = (region: RegionKey) => {
        const etf = sectors.find((sector) => sector.region === region && Number(sector.section) === id);
        return etf ? getCloseSeries(etf.ticker) : [];
      };
      return [id, { us: seriesFor("us"), eu: seriesFor("eu") }];
    }),
  );
});
