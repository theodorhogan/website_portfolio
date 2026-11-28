import { Fragment, useMemo, useState } from "react";
import { TREASURY_INSTRUMENT_ORDER, getTreasurySeries } from "../data/ratesData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS, formatDayMonthYear } from "../utils/dates";
import { getInverseChangeTone, type ChangeTone } from "../utils/format";
import {
  DEFAULT_CYCLE_MONTHS,
  MAX_CYCLE_MONTHS,
  MIN_CYCLE_MONTHS,
  clampCycleMonths,
  getCyclePoint,
  getWeekFigures,
  type CycleMode,
} from "./cycleWindow";
import { PanelShell } from "./PanelShell";
import "./RatesAndYield.css";

type TableCell = {
  text: string;
  tone?: ChangeTone;
};

type TableRow = {
  label: string;
  cells: TableCell[];
  isDate?: boolean;
};

/** Yields are shown to two decimals. */
const RATE_DECIMALS = 2;

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
      const figures = activeTime !== null ? getWeekFigures(series, activeTime, RATE_DECIMALS) : null;

      if (activeTime === null || figures === null) {
        for (const cells of columns) cells.push({ text: "" });
        continue;
      }

      const { current, lastWeek, yearStart, weekChange, ytdChange } = figures;
      const cyclePoint = getCyclePoint(series, figures.activeIndex, cycleMode, cycleMonths, activeTime);

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
