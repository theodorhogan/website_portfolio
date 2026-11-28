import { useMemo, useState } from "react";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { formatDayMonthYear } from "../utils/dates";
import { getInverseChangeTone } from "../utils/format";
import { CompactMetricsTable, type CompactMetricsColumn, type CompactMetricsRow } from "./CompactMetricsTable";
import {
  DEFAULT_CYCLE_MONTHS,
  MAX_CYCLE_MONTHS,
  MIN_CYCLE_MONTHS,
  clampCycleMonths,
  formatFigure,
  formatFigureChange,
  getCyclePoint,
  getWeekFigures,
  roundTo,
  type CycleMode,
  type CycleSeriesRow,
} from "./cycleWindow";
import { PanelShell } from "./PanelShell";
import "./RatesAndYield.css";
import "./CycleTable.css";

type CycleTableProps = {
  badge: string;
  ariaLabel: string;
  /** Header of the first column: what the rows are. */
  rowHeaderLabel: string;
  /** Must keep its identity between renders; the series are rounded once per list. */
  rows: readonly CycleSeriesRow[];
  /** Display precision of every figure in the table. */
  decimals: number;
  /** Unit written after every figure, e.g. `bp`. */
  suffix?: string;
};

/**
 * The Money to Capital Markets figures with the tenors in rows: the cycle extreme and its date,
 * this week, last week, the year's start and the two changes. A rise is the bad outcome.
 */
export function CycleTable({ badge, ariaLabel, rowHeaderLabel, rows, decimals, suffix = "" }: CycleTableProps) {
  const [cycleMode, setCycleMode] = useState<CycleMode>("low");
  const [cycleMonthsInput, setCycleMonthsInput] = useState(String(DEFAULT_CYCLE_MONTHS));
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  // Rounded before anything is compared: a computed series (nominal minus real) carries float noise
  // that would otherwise decide which of two equal prints is the cycle extreme.
  const roundedRows = useMemo(
    () =>
      rows.map(({ label, series }) => ({
        label,
        series: series.map((point) => ({ time: point.time, value: roundTo(point.value, decimals) })),
      })),
    [rows, decimals],
  );

  const tableRows = useMemo<CompactMetricsRow[]>(() => {
    const cycleMonths = clampCycleMonths(Number(cycleMonthsInput));

    return roundedRows.map(({ label, series }) => {
      const figures = activeTime !== null ? getWeekFigures(series, activeTime, decimals) : null;
      const cyclePoint =
        activeTime !== null && figures
          ? getCyclePoint(series, figures.activeIndex, cycleMode, cycleMonths, activeTime)
          : null;
      const weekChange = figures?.weekChange ?? null;
      const ytdChange = figures?.ytdChange ?? null;

      return {
        key: label,
        label,
        cells: [
          { content: cyclePoint ? formatDayMonthYear(cyclePoint.time) : "--", className: "cycle-table__date" },
          { content: formatFigure(cyclePoint?.value ?? null, decimals, suffix) },
          { content: formatFigure(figures?.current ?? null, decimals, suffix) },
          { content: formatFigure(figures?.lastWeek ?? null, decimals, suffix, true) },
          { content: formatFigureChange(weekChange, decimals, suffix), tone: getInverseChangeTone(weekChange) },
          { content: formatFigure(figures?.yearStart ?? null, decimals, suffix) },
          { content: formatFigureChange(ytdChange, decimals, suffix), tone: getInverseChangeTone(ytdChange) },
        ],
      };
    });
  }, [roundedRows, decimals, suffix, cycleMode, cycleMonthsInput, activeTime]);

  const cycleLabel = cycleMode === "high" ? "Cycle High" : "Cycle Low";
  const yearLabel = activeTime !== null ? `1/1/${new Date(activeTime).getUTCFullYear()}` : "1/1/----";
  const columns: CompactMetricsColumn[] = [
    { key: "cycle-date", label: `${cycleLabel} Date`, align: "right" },
    { key: "cycle-rate", label: `${cycleLabel} Rate`, align: "right" },
    { key: "this-week", label: "This Wk", align: "right" },
    { key: "last-week", label: "Last Wk", align: "right" },
    { key: "change", label: "Change", align: "right" },
    { key: "year-start", label: yearLabel, align: "right" },
    { key: "ytd", label: "YTD", align: "right" },
  ];

  return (
    <PanelShell
      className="cycle-table"
      variant="standard"
      bodyMode="scroll"
      badge={badge}
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
    >
      <CompactMetricsTable
        ariaLabel={ariaLabel}
        rowHeaderLabel={rowHeaderLabel}
        columns={columns}
        rows={tableRows}
        tableClassName="cycle-table__table"
      />
    </PanelShell>
  );
}
