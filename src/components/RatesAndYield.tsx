import { Fragment, useMemo, useState } from "react";
import treasuryRates2024Csv from "../content/pricedatabase/daily-treasury-rates-2024.csv?raw";
import treasuryRates2025Csv from "../content/pricedatabase/daily-treasury-rates-2025.csv?raw";
import treasuryRates2026Csv from "../content/pricedatabase/daily-treasury-rates-2026.csv?raw";
import { useNewsletterContext } from "../state/NewsletterContext";
import "./RatesAndYield.css";

type CycleMode = "high" | "low";
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

type RowTone = "normal" | "inverse-positive" | "inverse-negative" | "neutral";

type TableCell = {
  text: string;
  tone?: RowTone;
};

type TableRow = {
  label: string;
  cells: TableCell[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ALIGNMENT_GAP_MS = 21 * DAY_MS;
const MIN_CYCLE_MONTHS = 1;
const MAX_CYCLE_MONTHS = 36;
const DEFAULT_CYCLE_MONTHS = 12;

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

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

function clampCycleMonths(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_CYCLE_MONTHS;
  return Math.min(MAX_CYCLE_MONTHS, Math.max(MIN_CYCLE_MONTHS, Math.floor(value)));
}

function getWindowStartTime(endpointTime: number, cycleMonths: number) {
  const endpointDate = new Date(endpointTime);
  endpointDate.setUTCMonth(endpointDate.getUTCMonth() - cycleMonths);
  return Date.UTC(
    endpointDate.getUTCFullYear(),
    endpointDate.getUTCMonth(),
    endpointDate.getUTCDate(),
  );
}

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

function getIsoWeekKeyFromTime(time: number) {
  const date = new Date(time);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-${weekNumber}`;
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
      if (parts.length === 0) continue;

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

function resolveActiveIndex(series: RatePoint[], activeTime: number) {
  const activeWeekKey = getIsoWeekKeyFromTime(activeTime);

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= activeTime && getIsoWeekKeyFromTime(series[i].time) === activeWeekKey) {
      return i;
    }
  }

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= activeTime) {
      return activeTime - series[i].time <= MAX_ALIGNMENT_GAP_MS ? i : -1;
    }
  }

  return -1;
}

function resolveReferenceWeekIndex(series: RatePoint[], referenceTime: number) {
  const referenceWeekKey = getIsoWeekKeyFromTime(referenceTime);

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= referenceTime && getIsoWeekKeyFromTime(series[i].time) === referenceWeekKey) {
      return i;
    }
  }

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= referenceTime) {
      return referenceTime - series[i].time <= MAX_ALIGNMENT_GAP_MS ? i : -1;
    }
  }

  return -1;
}

function getCyclePoint(
  series: RatePoint[],
  activeIndex: number,
  mode: CycleMode,
  cycleMonths: number,
  activeTime: number,
) {
  if (activeIndex < 0) return null;

  const windowStart = getWindowStartTime(activeTime, cycleMonths);

  let bestPoint: RatePoint | null = null;
  for (let i = 0; i <= activeIndex; i += 1) {
    const point = series[i];
    if (point.time < windowStart) continue;

    if (!bestPoint) {
      bestPoint = point;
      continue;
    }

    if (mode === "high") {
      if (point.value > bestPoint.value || (point.value === bestPoint.value && point.time > bestPoint.time)) {
        bestPoint = point;
      }
    } else if (point.value < bestPoint.value || (point.value === bestPoint.value && point.time > bestPoint.time)) {
      bestPoint = point;
    }
  }

  return bestPoint;
}

function getYearStartPoint(series: RatePoint[], activeIndex: number, activeYear: number) {
  const yearStartTime = Date.UTC(activeYear, 0, 1);
  let lastPointBeforeYearStart: RatePoint | null = null;

  for (let i = 0; i <= activeIndex; i += 1) {
    if (series[i].time <= yearStartTime) {
      lastPointBeforeYearStart = series[i];
      continue;
    }

    break;
  }

  if (lastPointBeforeYearStart) {
    return lastPointBeforeYearStart;
  }

  for (let i = 0; i <= activeIndex; i += 1) {
    if (new Date(series[i].time).getUTCFullYear() === activeYear) {
      return series[i];
    }
  }

  return null;
}

function formatRate(value: number | null) {
  if (value === null) return "";
  return value.toFixed(2);
}

function formatNominalChange(value: number | null) {
  if (value === null) return "";
  if (Math.abs(value) < 0.00005) return "0.00";

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function formatDate(time: number | null) {
  if (time === null) return "";
  const date = new Date(time);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTH_LABELS[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function getInverseTone(value: number | null): RowTone | undefined {
  if (value === null) return undefined;
  if (Math.abs(value) < 0.00005) return "neutral";
  return value < 0 ? "inverse-positive" : "inverse-negative";
}

const TREASURY_RATE_SERIES = parseTreasuryInstrumentSeries([
  treasuryRates2024Csv,
  treasuryRates2025Csv,
  treasuryRates2026Csv,
]);
const RATE_SERIES = TREASURY_RATE_SERIES;

export function RatesAndYield() {
  const [cycleMode, setCycleMode] = useState<CycleMode>("high");
  const [cycleMonthsInput, setCycleMonthsInput] = useState(String(DEFAULT_CYCLE_MONTHS));
  const { selected } = useNewsletterContext();

  const rows = useMemo<TableRow[]>(() => {
    const cycleMonths = clampCycleMonths(Number(cycleMonthsInput));
    const activeTime = selected?.sortDate ?? null;
    const activeYear = activeTime !== null ? new Date(activeTime).getUTCFullYear() : null;
    const activeWeekLabel = activeTime !== null ? formatDate(activeTime) : "--";
    const lastWeekLabel = activeTime !== null ? formatDate(activeTime - 7 * DAY_MS) : "--";

    const cycleDateCells: TableCell[] = [];
    const cycleRateCells: TableCell[] = [];
    const currentCells: TableCell[] = [];
    const lastWeekCells: TableCell[] = [];
    const weekChangeCells: TableCell[] = [];
    const yearStartCells: TableCell[] = [];
    const ytdChangeCells: TableCell[] = [];

    for (const ticker of INSTRUMENT_ORDER) {
      const series = RATE_SERIES.get(ticker) ?? [];

      if (activeTime === null || activeYear === null || series.length === 0) {
        cycleDateCells.push({ text: "" });
        cycleRateCells.push({ text: "" });
        currentCells.push({ text: "" });
        lastWeekCells.push({ text: "" });
        weekChangeCells.push({ text: "" });
        yearStartCells.push({ text: "" });
        ytdChangeCells.push({ text: "" });
        continue;
      }

      const activeIndex = resolveActiveIndex(series, activeTime);
      if (activeIndex < 0) {
        cycleDateCells.push({ text: "" });
        cycleRateCells.push({ text: "" });
        currentCells.push({ text: "" });
        lastWeekCells.push({ text: "" });
        weekChangeCells.push({ text: "" });
        yearStartCells.push({ text: "" });
        ytdChangeCells.push({ text: "" });
        continue;
      }

      const currentPoint = series[activeIndex];
      const lastWeekIndex = resolveReferenceWeekIndex(series, activeTime - 7 * DAY_MS);
      const lastWeekPoint = lastWeekIndex >= 0 ? series[lastWeekIndex] : null;
      const yearStartPoint = getYearStartPoint(series, activeIndex, activeYear);
      const cyclePoint = getCyclePoint(series, activeIndex, cycleMode, cycleMonths, activeTime);

      const currentDisplay = roundTo2(currentPoint.value);
      const lastWeekDisplay = lastWeekPoint ? roundTo2(lastWeekPoint.value) : null;
      const yearStartDisplay = yearStartPoint ? roundTo2(yearStartPoint.value) : null;

      const weekChange =
        lastWeekDisplay !== null ? roundTo2(currentDisplay - lastWeekDisplay) : null;
      const ytdChange =
        yearStartDisplay !== null ? roundTo2(currentDisplay - yearStartDisplay) : null;

      cycleDateCells.push({ text: formatDate(cyclePoint?.time ?? null) });
      cycleRateCells.push({ text: formatRate(cyclePoint?.value ?? null) });
      currentCells.push({ text: formatRate(currentDisplay) });
      lastWeekCells.push({ text: formatRate(lastWeekDisplay) });
      weekChangeCells.push({
        text: formatNominalChange(weekChange),
        tone: getInverseTone(weekChange),
      });
      yearStartCells.push({ text: formatRate(yearStartDisplay) });
      ytdChangeCells.push({
        text: formatNominalChange(ytdChange),
        tone: getInverseTone(ytdChange),
      });
    }

    return [
      { label: cycleMode === "high" ? "Cycle High Date" : "Cycle Low Date", cells: cycleDateCells },
      { label: cycleMode === "high" ? "Cycle High Rate" : "Cycle Low Rate", cells: cycleRateCells },
      { label: `This Week Yield (${activeWeekLabel})`, cells: currentCells },
      { label: `Last Week Yield (${lastWeekLabel})`, cells: lastWeekCells },
      { label: "Change Nominal", cells: weekChangeCells },
      { label: `Yield @ 1/1/${activeYear ?? "--"}`, cells: yearStartCells },
      { label: "YTD", cells: ytdChangeCells },
    ];
  }, [cycleMode, cycleMonthsInput, selected]);

  return (
    <section className="rates-yield">
      <div className="rates-yield__header">
        <span className="rates-yield__titleBadge">Money to Capital Markets</span>
        <div className="rates-yield__controls">
          <label className="rates-yield__monthsGroup">
            <span className="rates-yield__monthsLabel">Cycle (mo)</span>
            <input
              className="rates-yield__monthsInput"
              type="number"
              min={MIN_CYCLE_MONTHS}
              max={MAX_CYCLE_MONTHS}
              step={1}
              value={cycleMonthsInput}
              onChange={(event) => setCycleMonthsInput(event.target.value)}
              onBlur={() => setCycleMonthsInput(String(clampCycleMonths(Number(cycleMonthsInput))))}
            />
          </label>
          <label className="rates-yield__selectGroup">
            <span className="sr-only">Choose cycle mode</span>
            <select
              className="rates-yield__select"
              value={cycleMode}
              onChange={(event) => setCycleMode(event.target.value as CycleMode)}
            >
              <option value="high">Cycle High</option>
              <option value="low">Cycle Low</option>
            </select>
          </label>
        </div>
      </div>
      <div className="rates-yield__body">
        <table className="rates-yield__table" aria-label="US Treasury rates and yields">
          <colgroup>
            <col className="rates-yield__colLabel" />
            {INSTRUMENT_ORDER.map((ticker) => (
              <col key={ticker} className="rates-yield__colData" />
            ))}
          </colgroup>
          <tbody>
            {rows.map((row, rowIndex) => (
              <Fragment key={row.label}>
                {rowIndex === 2 && (
                  <tr className="rates-yield__categoryRow">
                    <th scope="row" className="rates-yield__categoryLabel">
                      Category
                    </th>
                    {INSTRUMENT_ORDER.map((ticker) => (
                      <td key={`category-${ticker}`} className="rates-yield__categoryCell">
                        {ticker}
                      </td>
                    ))}
                  </tr>
                )}
                <tr>
                  <th scope="row" className="rates-yield__rowLabel">
                    {row.label}
                  </th>
                  {row.cells.map((cell, index) => (
                    <td
                      key={`${row.label}-${INSTRUMENT_ORDER[index]}`}
                      className={`rates-yield__cell${cell.tone ? ` rates-yield__cell--${cell.tone}` : ""}`}
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
