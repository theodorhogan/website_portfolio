import equityDataCsv from "../content/pricedatabase/equitydata.csv?raw";
import type { TimedValuePoint } from "../utils/timeSeries";
import { lazy, parseLongRows, toSortedSeries } from "./longCsv";

/**
 * Equity datasets for the Beta page: major indexes, the single-stock
 * watchlist and US/EU sector ETFs. All three come from `equitydata.csv`,
 * which is parsed once on first use.
 */
export type PricePoint = TimedValuePoint;

export type RegionKey = "us" | "eu";

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

/** Source tickers (upper-cased) that differ from the display ticker. */
const MAJOR_INDEX_ALIASES: Record<string, MajorIndexKey> = {
  SXP: "SPX",
};

/** GICS sectors in display order; `id` is the sector tag used in `equitydata.csv`. */
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

const MAJOR_INDEX_KEYS = new Set<string>(MAJOR_INDEX_ORDER);
const INDUSTRY_IDS = new Set<number>(INDUSTRIES.map((industry) => industry.id));

function resolveMajorIndexKey(tickerKey: string): MajorIndexKey | null {
  if (MAJOR_INDEX_KEYS.has(tickerKey)) return tickerKey as MajorIndexKey;
  return MAJOR_INDEX_ALIASES[tickerKey] ?? null;
}

/** Sector ETFs are US SPDRs (XL*) or EU iShares STOXX 600 funds (EX*). */
function classifyIndustryRegion(tickerKey: string): RegionKey | null {
  if (tickerKey.startsWith("XL")) return "us";
  if (tickerKey.startsWith("EX")) return "eu";
  return null;
}

function getOrCreate<K, V>(map: Map<K, V>, key: K, create: () => V) {
  let value = map.get(key);
  if (value === undefined) {
    value = create();
    map.set(key, value);
  }
  return value;
}

function parseEquityData(rawCsv: string) {
  const majorMaps = new Map<MajorIndexKey, Map<number, number>>();
  const watchlistMaps = new Map<string, Map<number, number>>();
  const watchlistTickersByTime = new Map<number, Set<string>>();
  const industryMaps = new Map<number, Record<RegionKey, Map<number, number>>>();

  for (const row of parseLongRows(rawCsv)) {
    const majorKey = resolveMajorIndexKey(row.tickerKey);
    if (majorKey) {
      getOrCreate(majorMaps, majorKey, () => new Map()).set(row.time, row.value);
    }

    if (row.category === "stox") {
      getOrCreate(watchlistMaps, row.tickerKey, () => new Map()).set(row.time, row.value);
      getOrCreate(watchlistTickersByTime, row.time, () => new Set()).add(row.tickerKey);
      continue;
    }

    if (row.category === "einx" && row.tag !== null && INDUSTRY_IDS.has(row.tag)) {
      const region = classifyIndustryRegion(row.tickerKey);
      if (!region) continue;

      const byRegion = getOrCreate(industryMaps, row.tag, () => ({ us: new Map(), eu: new Map() }));
      byRegion[region].set(row.time, row.value);
    }
  }

  const majorIndexes = new Map<MajorIndexKey, PricePoint[]>(
    MAJOR_INDEX_ORDER.map((key) => [key, toSortedSeries(majorMaps.get(key) ?? new Map())]),
  );

  const watchlist = {
    seriesByTicker: new Map<string, PricePoint[]>(
      [...watchlistMaps.entries()].map(([ticker, map]) => [ticker, toSortedSeries(map)]),
    ),
    /** Tickers present in each snapshot, in file order. */
    tickersByTime: new Map<number, string[]>(
      [...watchlistTickersByTime.entries()].map(([time, tickers]) => [time, [...tickers]]),
    ),
    /** Snapshot dates, ascending. */
    snapshots: [...watchlistTickersByTime.keys()].sort((a, b) => a - b).map((time) => ({ time })),
  };

  const industries = new Map<number, Record<RegionKey, PricePoint[]>>(
    INDUSTRIES.map(({ id }) => {
      const byRegion = industryMaps.get(id);
      return [
        id,
        {
          us: toSortedSeries(byRegion?.us ?? new Map()),
          eu: toSortedSeries(byRegion?.eu ?? new Map()),
        },
      ];
    }),
  );

  return { majorIndexes, watchlist, industries };
}

const getEquityData = lazy(() => parseEquityData(equityDataCsv));

export function getMajorIndexSeries() {
  return getEquityData().majorIndexes;
}

export function getWatchlistSeries() {
  return getEquityData().watchlist;
}

export function getIndustrySeries() {
  return getEquityData().industries;
}
