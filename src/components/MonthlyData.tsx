import { Fragment, useMemo, useState } from "react";
import {
  formatEconValue,
  getEconIndicators,
  getEconReadings,
  type EconGroup,
  type EconIndicator,
  type EconReading,
} from "../data/econData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { MONTH_LABELS } from "../utils/dates";
import { EconBarTile } from "./EconBarTile";
import { PanelShell } from "./PanelShell";
import "./MonthlyData.css";

type MonthlyView = "headlines" | "all";

const VIEWS: Array<{ key: MonthlyView; label: string }> = [
  { key: "headlines", label: "Headlines" },
  { key: "all", label: "All indicators" },
];

const GROUPS: Array<{ key: EconGroup; heading: string }> = [
  { key: "consumption", heading: "CONSUMPTION & INCOME" },
  { key: "employment", heading: "EMPLOYMENT" },
  { key: "inflation", heading: "INFLATION" },
  { key: "housing", heading: "HOUSING" },
  { key: "output", heading: "OUTPUT & ORDERS" },
  { key: "surveys", heading: "SURVEYS" },
  { key: "trade_money", heading: "TRADE & MONEY" },
];

const HEADLINE_BARS = 12;
const TABLE_MONTHS = 5;

function getMonthlyIndicators() {
  return getEconIndicators().filter((indicator) => indicator.frequency === "M");
}

/**
 * Every monthly indicator over the same five months: those ending at the latest month
 * any of them has a value for in the active week. A month an indicator has no value for is null.
 */
function buildTable(activeTime: number | null) {
  if (activeTime === null) return null;

  const rows = getMonthlyIndicators().map((indicator) => ({
    indicator,
    readings: getEconReadings(indicator, activeTime, TABLE_MONTHS),
  }));
  const periodTimes = rows.flatMap((row) => row.readings.map((reading) => reading.periodTime));
  if (periodTimes.length === 0) return null;

  const latest = new Date(Math.max(...periodTimes));
  const months = Array.from({ length: TABLE_MONTHS }, (_, index) =>
    Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - (TABLE_MONTHS - 1 - index), 1),
  );

  return {
    months,
    groups: GROUPS.map((group) => ({
      ...group,
      rows: rows
        .filter((row) => row.indicator.group === group.key)
        .map((row) => {
          const byMonth = new Map(row.readings.map((reading) => [reading.periodTime, reading]));
          return { indicator: row.indicator, cells: months.map((month) => byMonth.get(month) ?? null) };
        }),
    })).filter((group) => group.rows.length > 0),
  };
}

function getCellClassName(indicator: EconIndicator, reading: EconReading | null) {
  if (!reading) return "monthly-data__cell monthly-data__cell--missing";

  return [
    "monthly-data__cell",
    formatEconValue(indicator, reading.value).startsWith("-") && "monthly-data__cell--negative",
    reading.isNew && "monthly-data__cell--new",
    reading.isRevised && "monthly-data__cell--revised",
  ]
    .filter(Boolean)
    .join(" ");
}

function IndicatorTable({ activeTime }: { activeTime: number | null }) {
  const table = useMemo(() => buildTable(activeTime), [activeTime]);
  if (!table) return <p className="monthly-data__empty">No monthly data for the selected week.</p>;

  return (
    <div className="monthly-data__scroller">
      <table className="monthly-data__table" aria-label="Monthly indicators, latest five months">
        <thead>
          <tr>
            <th scope="col" className="monthly-data__head monthly-data__head--indicator">Indicator</th>
            <th scope="col" className="monthly-data__head monthly-data__head--unit">Unit</th>
            {table.months.map((month) => (
              <th key={month} scope="col" className="monthly-data__head">
                {MONTH_LABELS[new Date(month).getUTCMonth()]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.groups.map((group) => (
            <Fragment key={group.key}>
              <tr>
                <th colSpan={2 + TABLE_MONTHS} scope="colgroup" className="monthly-data__groupLabel">
                  {group.heading}
                </th>
              </tr>
              {group.rows.map(({ indicator, cells }) => (
                <tr key={indicator.key}>
                  <th scope="row" className="monthly-data__indicator">{indicator.label}</th>
                  <td className="monthly-data__unit">{indicator.unit}</td>
                  {cells.map((reading, index) => (
                    <td key={table.months[index]} className={getCellClassName(indicator, reading)}>
                      {formatEconValue(indicator, reading?.value ?? null)}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MonthlyData() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;
  const [view, setView] = useState<MonthlyView>("headlines");

  return (
    <PanelShell
      className="monthly-data"
      variant="standard"
      bodyMode="fit"
      badge="MONTHLY DATA"
      actions={
        <div className="monthly-data__controls">
          <div className="monthly-data__legend">
            <span className="monthly-data__legendItem">
              <span className="monthly-data__swatch monthly-data__swatch--new" />
              New this week
            </span>
            <span className="monthly-data__legendItem">
              <span className="monthly-data__swatch monthly-data__swatch--revised" />
              Revised this week
            </span>
          </div>
          <div className="monthly-data__switch" role="group" aria-label="Monthly data view">
            {VIEWS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`monthly-data__switchButton${view === option.key ? " is-active" : ""}`}
                aria-pressed={view === option.key}
                onClick={() => setView(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {view === "headlines" ? (
        <div className="econ-bar-grid">
          {getMonthlyIndicators()
            .filter((indicator) => indicator.headline)
            .map((indicator) => (
              <EconBarTile key={indicator.key} indicator={indicator} activeTime={activeTime} count={HEADLINE_BARS} />
            ))}
        </div>
      ) : (
        <IndicatorTable activeTime={activeTime} />
      )}
    </PanelShell>
  );
}
