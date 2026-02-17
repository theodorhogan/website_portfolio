import type { BusinessDay, CandlestickData } from "lightweight-charts";
import indexDataCsv from "../content/pricedatabase/indexdata.csv?raw";
import peDataCsv from "../content/pricedatabase/pricetoearnings.csv?raw";

export type IndexKey = "SPX" | "STOXX600";

type ClosePoint = {
  timeMs: number;
  close: number;
};

type ForwardPePoint = {
  timeMs: number;
  value: number;
};

type IndexChartDataset = {
  candles: CandlestickData<BusinessDay>[];
  latestClose: number | null;
  latestTimeMs: number | null;
  currentPe: number | null;
  lastWeekPe: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_WINDOW_MS = 365 * DAY_MS;

function normalizeToUtcDay(timeMs: number) {
  const date = new Date(timeMs);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function parseUsDateToUtcMs(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);

  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}

function toBusinessDay(timeMs: number): BusinessDay {
  const date = new Date(timeMs);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function parseIndexData(rawCsv: string) {
  const spx: ClosePoint[] = [];
  const stoxx: ClosePoint[] = [];

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const [spxDateRaw, spxPriceRaw, stoxxDateRaw, stoxxPriceRaw] = line.split(",");

    const spxTime = spxDateRaw ? parseUsDateToUtcMs(spxDateRaw) : null;
    const spxClose = spxPriceRaw ? Number(spxPriceRaw) : NaN;
    if (spxTime !== null && Number.isFinite(spxClose)) {
      spx.push({ timeMs: spxTime, close: spxClose });
    }

    const stoxxTime = stoxxDateRaw ? parseUsDateToUtcMs(stoxxDateRaw) : null;
    const stoxxClose = stoxxPriceRaw ? Number(stoxxPriceRaw) : NaN;
    if (stoxxTime !== null && Number.isFinite(stoxxClose)) {
      stoxx.push({ timeMs: stoxxTime, close: stoxxClose });
    }
  }

  const dedupeAndSort = (points: ClosePoint[]) =>
    [...new Map(points.map((point) => [point.timeMs, point])).values()].sort(
      (a, b) => a.timeMs - b.timeMs,
    );

  return {
    SPX: dedupeAndSort(spx),
    STOXX600: dedupeAndSort(stoxx),
  } as const;
}

function parseForwardPeData(rawCsv: string) {
  const peMap = new Map<IndexKey, ForwardPePoint[]>();
  peMap.set("SPX", []);
  peMap.set("STOXX600", []);

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const [dateRaw, tickerRaw, valueRaw] = line.split(",");
    const ticker = tickerRaw?.trim().toUpperCase();
    const timeMs = dateRaw ? parseUsDateToUtcMs(dateRaw) : null;
    const value = valueRaw ? Number(valueRaw) : NaN;

    if (!ticker || timeMs === null || !Number.isFinite(value)) {
      continue;
    }

    const key = ticker === "SPX" ? "SPX" : ticker === "STOXX600" ? "STOXX600" : null;
    if (!key) continue;

    peMap.get(key)?.push({ timeMs, value });
  }

  return {
    SPX: [...(peMap.get("SPX") ?? [])].sort((a, b) => a.timeMs - b.timeMs),
    STOXX600: [...(peMap.get("STOXX600") ?? [])].sort((a, b) => a.timeMs - b.timeMs),
  } as const;
}

function buildForwardPeLookup(data: Record<IndexKey, ForwardPePoint[]>) {
  return {
    SPX: new Map(data.SPX.map((point) => [point.timeMs, point.value])),
    STOXX600: new Map(data.STOXX600.map((point) => [point.timeMs, point.value])),
  } as const;
}

function resolveEndpointIndex(points: ClosePoint[], activeTimeMs: number) {
  for (let i = points.length - 1; i >= 0; i -= 1) {
    if (points[i].timeMs <= activeTimeMs) {
      return i;
    }
  }

  return points.length > 0 ? 0 : -1;
}

function getExactForwardPe(
  peLookup: ReadonlyMap<number, number>,
  targetTimeMs: number,
) {
  const normalizedTarget = normalizeToUtcDay(targetTimeMs);
  return peLookup.get(normalizedTarget) ?? null;
}

const INDEX_CLOSES = parseIndexData(indexDataCsv);
const INDEX_FORWARD_PE = parseForwardPeData(peDataCsv);
const INDEX_FORWARD_PE_LOOKUP = buildForwardPeLookup(INDEX_FORWARD_PE);

export function getIndexChartDataset(index: IndexKey, activeTimeMs: number): IndexChartDataset {
  const points = INDEX_CLOSES[index];
  if (!points || points.length === 0) {
    return {
      candles: [],
      latestClose: null,
      latestTimeMs: null,
      currentPe: null,
      lastWeekPe: null,
    };
  }

  const endpointIndex = resolveEndpointIndex(points, activeTimeMs);
  if (endpointIndex < 0) {
    return {
      candles: [],
      latestClose: null,
      latestTimeMs: null,
      currentPe: null,
      lastWeekPe: null,
    };
  }

  const endpoint = points[endpointIndex];
  const windowStart = endpoint.timeMs - YEAR_WINDOW_MS;
  let startIndex = 0;
  while (startIndex < endpointIndex && points[startIndex].timeMs < windowStart) {
    startIndex += 1;
  }

  const candles: CandlestickData<BusinessDay>[] = [];
  for (let i = startIndex; i <= endpointIndex; i += 1) {
    const current = points[i];
    const previous = i > 0 ? points[i - 1] : current;
    const open = previous.close;
    const close = current.close;

    candles.push({
      time: toBusinessDay(current.timeMs),
      open,
      high: Math.max(open, close),
      low: Math.min(open, close),
      close,
    });
  }

  const peLookup = INDEX_FORWARD_PE_LOOKUP[index];
  const currentPe = getExactForwardPe(peLookup, activeTimeMs);
  const lastWeekPe = getExactForwardPe(peLookup, activeTimeMs - 7 * DAY_MS);

  return {
    candles,
    latestClose: endpoint.close,
    latestTimeMs: endpoint.timeMs,
    currentPe,
    lastWeekPe,
  };
}

export function formatPe(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

export function formatChartSubtitleDate(timeMs: number | null) {
  if (timeMs === null) return "--";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
  return formatter.format(new Date(timeMs));
}

export function formatChartPrice(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
