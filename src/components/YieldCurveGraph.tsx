import { useMemo } from "react";
import treasuryRates2024Csv from "../content/pricedatabase/daily-treasury-rates-2024.csv?raw";
import treasuryRates2025Csv from "../content/pricedatabase/daily-treasury-rates-2025.csv?raw";
import treasuryRates2026Csv from "../content/pricedatabase/daily-treasury-rates-2026.csv?raw";
import { useNewsletterContext } from "../state/NewsletterContext";
import "./YieldCurveGraph.css";

type InstrumentKey =
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

type RatePoint = {
  time: number;
  value: number;
};

type YieldCurveChartData =
  | {
      hasData: false;
      activeLabel: string;
      previousLabel: string;
    }
  | {
      hasData: true;
      activeLabel: string;
      previousLabel: string;
      activePath: string;
      previousPath: string;
      yTicks: Array<{ value: number; y: number }>;
      xForIndex: (index: number) => number;
      plotLeft: number;
      plotRight: number;
      plotBottom: number;
    };

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ALIGNMENT_GAP_MS = 21 * DAY_MS;
const CHART_WIDTH = 560;
const CHART_HEIGHT = 430;
const CHART_MARGIN = { top: 14, right: 50, bottom: 56, left: 28 };

const INSTRUMENT_ORDER: InstrumentKey[] = [
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

const INSTRUMENT_LABELS: Record<InstrumentKey, string> = {
  US1M: "1M",
  US2M: "2M",
  US3M: "3M",
  US4M: "4M",
  US6M: "6M",
  US1Y: "1Y",
  US2Y: "2Y",
  US3Y: "3Y",
  US5Y: "5Y",
  US7Y: "7Y",
  US10Y: "10Y",
  US20Y: "20Y",
  US30Y: "30Y",
};

const INSTRUMENT_SET = new Set<InstrumentKey>(INSTRUMENT_ORDER);
const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const TREASURY_COLUMN_TO_TICKER: Record<string, InstrumentKey> = {
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

function parseUsDateToUtcTime(raw: string) {
  const value = raw.trim().replace(/^"|"$/g, "");
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}

function parseCsvLine(line: string) {
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((part) => part.trim());
}

function parseTreasuryInstrumentSeries(rawCsvFiles: string[]) {
  const seriesByTicker = new Map<InstrumentKey, Map<number, number>>();
  for (const ticker of INSTRUMENT_ORDER) {
    seriesByTicker.set(ticker, new Map<number, number>());
  }

  for (const rawCsv of rawCsvFiles) {
    const lines = rawCsv.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) continue;

    const headerParts = parseCsvLine(lines[0]).map((part) => part.replace(/^"|"$/g, "").trim().toUpperCase());
    const mappedColumns: Array<{ index: number; ticker: InstrumentKey }> = [];

    headerParts.forEach((header, index) => {
      const ticker = TREASURY_COLUMN_TO_TICKER[header];
      if (ticker && INSTRUMENT_SET.has(ticker)) {
        mappedColumns.push({ index, ticker });
      }
    });

    for (let i = 1; i < lines.length; i += 1) {
      const parts = parseCsvLine(lines[i]);
      const time = parseUsDateToUtcTime(parts[0] ?? "");
      if (time === null) continue;

      for (const { index, ticker } of mappedColumns) {
        const rawValue = (parts[index] ?? "").replace(/^"|"$/g, "").trim();
        const value = Number(rawValue);
        if (!Number.isFinite(value)) continue;
        seriesByTicker.get(ticker)?.set(time, value);
      }
    }
  }

  const output = new Map<InstrumentKey, RatePoint[]>();
  for (const ticker of INSTRUMENT_ORDER) {
    const points = [...(seriesByTicker.get(ticker)?.entries() ?? [])]
      .sort((a, b) => a[0] - b[0])
      .map(([time, value]) => ({ time, value }));
    output.set(ticker, points);
  }

  return output;
}

function getIsoWeekKeyFromTime(time: number) {
  const date = new Date(time);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-${weekNumber}`;
}

function resolveWeekPoint(series: RatePoint[], targetTime: number) {
  const targetWeekKey = getIsoWeekKeyFromTime(targetTime);

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= targetTime && getIsoWeekKeyFromTime(series[i].time) === targetWeekKey) {
      return series[i];
    }
  }

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= targetTime) {
      return targetTime - series[i].time <= MAX_ALIGNMENT_GAP_MS ? series[i] : null;
    }
  }

  return null;
}

function formatDate(time: number | null) {
  if (time === null) return "--";
  const date = new Date(time);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTH_LABELS[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function buildLinePath(values: Array<number | null>, xForIndex: (index: number) => number, yForValue: (value: number) => number) {
  let path = "";
  let drawing = false;

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value === null) {
      drawing = false;
      continue;
    }

    const x = xForIndex(i);
    const y = yForValue(value);
    path += `${drawing ? " L" : " M"} ${x} ${y}`;
    drawing = true;
  }

  return path.trim();
}

const RATE_SERIES = parseTreasuryInstrumentSeries([
  treasuryRates2024Csv,
  treasuryRates2025Csv,
  treasuryRates2026Csv,
]);

export function YieldCurveGraph() {
  const { selected } = useNewsletterContext();

  const chartData = useMemo<YieldCurveChartData>(() => {
    const activeTime = selected?.sortDate ?? null;
    if (activeTime === null) {
      return {
        hasData: false,
        activeLabel: "--",
        previousLabel: "--",
      };
    }

    const previousTime = activeTime - 7 * DAY_MS;
    const activeValues = INSTRUMENT_ORDER.map((ticker) => resolveWeekPoint(RATE_SERIES.get(ticker) ?? [], activeTime)?.value ?? null);
    const previousValues = INSTRUMENT_ORDER.map((ticker) => resolveWeekPoint(RATE_SERIES.get(ticker) ?? [], previousTime)?.value ?? null);
    const valuePool = [...activeValues, ...previousValues].filter((value): value is number => value !== null);

    if (valuePool.length === 0) {
      return {
        hasData: false,
        activeLabel: formatDate(activeTime),
        previousLabel: formatDate(previousTime),
      };
    }

    const minValue = Math.min(...valuePool);
    const maxValue = Math.max(...valuePool);
    const spread = Math.max(maxValue - minValue, 0.2);
    const yMin = minValue - spread * 0.2;
    const yMax = maxValue + spread * 0.2;

    const plotLeft = CHART_MARGIN.left;
    const plotRight = CHART_WIDTH - CHART_MARGIN.right;
    const plotTop = CHART_MARGIN.top;
    const plotBottom = CHART_HEIGHT - CHART_MARGIN.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const xForIndex = (index: number) =>
      plotLeft + (index / Math.max(INSTRUMENT_ORDER.length - 1, 1)) * plotWidth;
    const yForValue = (value: number) =>
      plotBottom - ((value - yMin) / Math.max(yMax - yMin, 0.0001)) * plotHeight;

    const activePath = buildLinePath(activeValues, xForIndex, yForValue);
    const previousPath = buildLinePath(previousValues, xForIndex, yForValue);

    const yTicks = Array.from({ length: 5 }, (_, idx) => {
      const ratio = idx / 4;
      const value = yMax - ratio * (yMax - yMin);
      const y = plotTop + ratio * plotHeight;
      return { value, y };
    });

    return {
      hasData: true,
      activeLabel: formatDate(activeTime),
      previousLabel: formatDate(previousTime),
      activePath,
      previousPath,
      yTicks,
      xForIndex,
      plotLeft,
      plotRight,
      plotBottom,
    };
  }, [selected]);

  return (
    <section className="yield-curve">
      <div className="yield-curve__header">
        <span className="yield-curve__titleBadge">Yield Curve</span>
        <div className="yield-curve__legend">
          <span className="yield-curve__legendItem">
            <span className="yield-curve__legendDot yield-curve__legendDot--active" />
            Active ({chartData.activeLabel})
          </span>
          <span className="yield-curve__legendItem">
            <span className="yield-curve__legendDot yield-curve__legendDot--previous" />
            Last Week ({chartData.previousLabel})
          </span>
        </div>
      </div>
      <div className="yield-curve__body">
        {chartData.hasData ? (
          <svg className="yield-curve__svg" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Yield curve comparison">
            {chartData.yTicks.map((tick) => (
              <g key={`y-tick-${tick.y}`}>
                <line
                  x1={chartData.plotLeft}
                  x2={chartData.plotRight}
                  y1={tick.y}
                  y2={tick.y}
                  className="yield-curve__gridLine"
                />
                <text x={chartData.plotRight + 8} y={tick.y + 4} className="yield-curve__yTick">
                  {tick.value.toFixed(2)}
                </text>
              </g>
            ))}

            {chartData.previousPath && <path d={chartData.previousPath} className="yield-curve__path yield-curve__path--previous" />}
            {chartData.activePath && <path d={chartData.activePath} className="yield-curve__path yield-curve__path--active" />}

            {INSTRUMENT_ORDER.map((ticker, index) => (
              <text
                key={`x-tick-${ticker}`}
                x={chartData.xForIndex(index)}
                y={chartData.plotBottom + 18}
                textAnchor="middle"
                className="yield-curve__xTick"
              >
                {INSTRUMENT_LABELS[ticker]}
              </text>
            ))}
          </svg>
        ) : (
          <div className="yield-curve__empty">No aligned Treasury data for the selected week.</div>
        )}
      </div>
    </section>
  );
}
