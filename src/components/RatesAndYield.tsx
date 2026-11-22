import { Fragment, useMemo, useState } from "react";
import { TREASURY_INSTRUMENT_ORDER, getTreasurySeries, type PricePoint } from "../data/ratesData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS, formatDayMonthYear } from "../utils/dates";
import { getInverseChangeTone, type ChangeTone } from "../utils/format";
import {
  computeNominalChange,
  getAlignedPoint,
  getYearAnchorPoint,
  resolveAlignedPointIndex,
} from "../utils/timeSeries";
import { PanelShell } from "./PanelShell";
import "./RatesAndYield.css";

type CycleMode = "high" | "low";

type TableCell = {
  text: string;
  tone?: ChangeTone;
};

type TableRow = {
  label: string;
  cells: TableCell[];
  isDate?: boolean;
};

const MIN_CYCLE_MONTHS = 1;
const MAX_CYCLE_MONTHS = 36;
const DEFAULT_CYCLE_MONTHS = 6;

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
  return Date.UTC(endpointDate.getUTCFullYear(), endpointDate.getUTCMonth(), endpointDate.getUTCDate());
}

/** Highest or lowest print in the look-back window ending at the active point; ties resolve to the latest date. */
function getCyclePoint(
  series: PricePoint[],
  activeIndex: number,
  mode: CycleMode,
  cycleMonths: number,
  activeTime: number,
) {
  const windowStart = getWindowStartTime(activeTime, cycleMonths);
  let bestPoint: PricePoint | null = null;

  for (let i = activeIndex; i >= 0; i -= 1) {
    const point = series[i];
    if (point.time < windowStart) break;

    if (!bestPoint || (mode === "high" ? point.value > bestPoint.value : point.value < bestPoint.value)) {
      bestPoint = point;
    }
  }

  return bestPoint;
}

function formatRate(value: number | null) {
  return value === null ? "" : value.toFixed(2);
}

function formatNominalChange(value: number | null) {
  if (value === null) return "";
  if (Math.abs(value) < 0.00005) return "0.00";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function RatesAndYield() {
  const [cycleMode, setCycleMode] = useState<CycleMode>("low");
  const [cycleMonthsInput, setCycleMonthsInput] = useState(String(DEFAULT_CYCLE_MONTHS));
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const rows = useMemo<TableRow[]>(() => {
    const seriesByTicker = getTreasurySeries();
    const cycleMonths = clampCycleMonths(Number(cycleMonthsInput));
    const activeYear = activeTime !== null ? new Date(activeTime).getUTCFullYear() : null;

    const cycleDateCells: TableCell[] = [];
    const cycleRateCells: TableCell[] = [];
    const currentCells: TableCell[] = [];
    const lastWeekCells: TableCell[] = [];
    const weekChangeCells: TableCell[] = [];
    const yearStartCells: TableCell[] = [];
    const ytdChangeCells: TableCell[] = [];
    const columns = [
      cycleDateCells,
      cycleRateCells,
      currentCells,
      lastWeekCells,
      weekChangeCells,
      yearStartCells,
      ytdChangeCells,
    ];

    for (const ticker of TREASURY_INSTRUMENT_ORDER) {
      const series = seriesByTicker.get(ticker) ?? [];
      const activeIndex = activeTime !== null ? resolveAlignedPointIndex(series, activeTime) : -1;

      if (activeTime === null || activeYear === null || activeIndex < 0) {
        for (const cells of columns) cells.push({ text: "" });
        continue;
      }

      const lastWeekPoint = getAlignedPoint(series, activeTime - WEEK_MS);
      const yearStartPoint = getYearAnchorPoint(series, activeYear);
      const cyclePoint = getCyclePoint(series, activeIndex, cycleMode, cycleMonths, activeTime);

      // Changes are computed from the rounded values so they always match the figures shown above them.
      const current = roundTo2(series[activeIndex].value);
      const lastWeek = lastWeekPoint ? roundTo2(lastWeekPoint.value) : null;
      const yearStart = yearStartPoint ? roundTo2(yearStartPoint.value) : null;
      const weekChangeRaw = computeNominalChange(current, lastWeek);
      const ytdChangeRaw = computeNominalChange(current, yearStart);
      const weekChange = weekChangeRaw !== null ? roundTo2(weekChangeRaw) : null;
      const ytdChange = ytdChangeRaw !== null ? roundTo2(ytdChangeRaw) : null;

      cycleDateCells.push({ text: cyclePoint ? formatDayMonthYear(cyclePoint.time) : "" });
      cycleRateCells.push({ text: formatRate(cyclePoint?.value ?? null) });
      currentCells.push({ text: formatRate(current) });
      lastWeekCells.push({ text: formatRate(lastWeek) });
      weekChangeCells.push({ text: formatNominalChange(weekChange), tone: getInverseChangeTone(weekChange) });
      yearStartCells.push({ text: formatRate(yearStart) });
      ytdChangeCells.push({ text: formatNominalChange(ytdChange), tone: getInverseChangeTone(ytdChange) });
    }

    const activeWeekLabel = activeTime !== null ? formatDayMonthYear(activeTime) : "--";
    const lastWeekLabel = activeTime !== null ? formatDayMonthYear(activeTime - WEEK_MS) : "--";

    return [
      { label: cycleMode === "high" ? "Cycle High Date" : "Cycle Low Date", cells: cycleDateCells, isDate: true },
      { label: cycleMode === "high" ? "Cycle High Rate" : "Cycle Low Rate", cells: cycleRateCells },
      { label: `This Week Yield (${activeWeekLabel})`, cells: currentCells },
      { label: `Last Week Yield (${lastWeekLabel})`, cells: lastWeekCells },
      { label: "Change Nominal", cells: weekChangeCells },
      { label: `Yield @ 1/1/${activeYear ?? "--"}`, cells: yearStartCells },
      { label: "YTD", cells: ytdChangeCells },
    ];
  }, [cycleMode, cycleMonthsInput, activeTime]);

  return (
    <PanelShell
      className="rates-yield"
      variant="standard"
      bodyMode="scroll"
      badge="Money to Capital Markets"
      actions={
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
      }
      bodyClassName="rates-yield__body"
    >
      <table className="rates-yield__table" aria-label="US Treasury rates and yields">
        <colgroup>
          <col className="rates-yield__colLabel" />
          {TREASURY_INSTRUMENT_ORDER.map((ticker) => (
            <col key={ticker} />
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
                    <th key={ticker} scope="col" className="rates-yield__categoryCell">
                      {ticker}
                    </th>
                  ))}
                </tr>
              )}
              <tr>
                <th scope="row" className="rates-yield__rowLabel">
                  {row.label}
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={TREASURY_INSTRUMENT_ORDER[index]}
                    className={`rates-yield__cell${cell.tone ? ` rates-yield__cell--${cell.tone}` : ""}${row.isDate ? " rates-yield__cell--date" : ""}`}
                  >
                    {cell.text}
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </PanelShell>
  );
}
