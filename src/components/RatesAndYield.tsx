import { Fragment, useMemo, useState } from "react";
import {
  DAY_MS,
  TREASURY_INSTRUMENT_ORDER,
  computeNominalChange,
  getAlignedPoint,
  getTreasurySeries,
  resolveAlignedPointIndex,
  type PricePoint,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./RatesAndYield.css";

type CycleMode = "high" | "low";
type RowTone = "normal" | "inverse-positive" | "inverse-negative" | "neutral";

type TableCell = {
  text: string;
  tone?: RowTone;
};

type TableRow = {
  label: string;
  cells: TableCell[];
};

const MIN_CYCLE_MONTHS = 1;
const MAX_CYCLE_MONTHS = 36;
const DEFAULT_CYCLE_MONTHS = 12;
const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const RATE_SERIES = getTreasurySeries();

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

function getCyclePoint(
  series: PricePoint[],
  activeIndex: number,
  mode: CycleMode,
  cycleMonths: number,
  activeTime: number,
) {
  if (activeIndex < 0) return null;

  const windowStart = getWindowStartTime(activeTime, cycleMonths);
  let bestPoint: PricePoint | null = null;

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

function getYearStartPoint(series: PricePoint[], activeIndex: number, activeYear: number) {
  const yearStartTime = Date.UTC(activeYear, 0, 1);
  let lastPointBeforeYearStart: PricePoint | null = null;

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

    for (const ticker of TREASURY_INSTRUMENT_ORDER) {
      const series = RATE_SERIES.get(ticker) ?? [];
      const activeIndex = activeTime !== null ? resolveAlignedPointIndex(series, activeTime) : -1;

      if (activeTime === null || activeYear === null || activeIndex < 0) {
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
      const lastWeekPoint = getAlignedPoint(series, activeTime - 7 * DAY_MS);
      const yearStartPoint = getYearStartPoint(series, activeIndex, activeYear);
      const cyclePoint = getCyclePoint(series, activeIndex, cycleMode, cycleMonths, activeTime);

      const currentDisplay = roundTo2(currentPoint.value);
      const lastWeekDisplay = lastWeekPoint ? roundTo2(lastWeekPoint.value) : null;
      const yearStartDisplay = yearStartPoint ? roundTo2(yearStartPoint.value) : null;

      const weekChangeRaw = computeNominalChange(currentDisplay, lastWeekDisplay);
      const ytdChangeRaw = computeNominalChange(currentDisplay, yearStartDisplay);
      const weekChange = weekChangeRaw !== null ? roundTo2(weekChangeRaw) : null;
      const ytdChange = ytdChangeRaw !== null ? roundTo2(ytdChangeRaw) : null;

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
            {TREASURY_INSTRUMENT_ORDER.map((ticker) => (
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
                    {TREASURY_INSTRUMENT_ORDER.map((ticker) => (
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
                      key={`${row.label}-${TREASURY_INSTRUMENT_ORDER[index]}`}
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
