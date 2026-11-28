import { useMemo } from "react";
import { getEconIndicator, getGdpNowQuarters } from "../data/econData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { DAY_MS, formatDayMonth, formatDayMonthYear } from "../utils/dates";
import { getChangeTone } from "../utils/format";
import { EconLineChart } from "./EconLineChart";
import { PanelShell } from "./PanelShell";
import "./GdpNow.css";

const MAX_DATE_TICKS = 5;

/** `2026Q4` -> `Q4 2026`. */
function formatQuarter(period: string) {
  return period.replace(/^(\d{4})Q([1-4])$/, "Q$2 $1");
}

/** `2026Q1` -> `2025Q4`. */
function getPreviousQuarter(period: string) {
  const year = Number(period.slice(0, 4));
  const quarter = Number(period.slice(5));
  return quarter === 1 ? `${year - 1}Q4` : `${year}Q${quarter - 1}`;
}

function buildNowcast(activeTime: number | null) {
  if (activeTime === null) return null;

  // Every quarter as it stood in the active week; the one being nowcast is the latest with an update.
  const known = getGdpNowQuarters()
    .map((quarter) => ({
      quarter: quarter.quarter,
      updates: quarter.updates.filter((update) => update.published <= activeTime),
    }))
    .filter((quarter) => quarter.updates.length > 0)
    .sort((a, b) => a.quarter.localeCompare(b.quarter));

  const current = known.at(-1);
  if (!current) return null;

  const latest = current.updates[current.updates.length - 1];
  const before = current.updates.at(-2);
  const change = before ? Number((latest.value - before.value).toFixed(2)) : null;

  // The chart runs from the quarter's first update to the active date, at least a day wide.
  const start = current.updates[0].published;
  const days = Math.max(Math.round((activeTime - start) / DAY_MS), 1);
  const tickCount = Math.min(MAX_DATE_TICKS, days + 1);
  const xTicks = Array.from({ length: tickCount }, (_, index) => {
    const x = start + Math.round((index * days) / (tickCount - 1)) * DAY_MS;
    return { x, label: formatDayMonth(x) };
  });

  const previous = known.find((quarter) => quarter.quarter === getPreviousQuarter(current.quarter));
  const firstPrint = previous
    ? getEconIndicator("gdp_growth")?.observations.find((observation) => observation.period === previous.quarter)
        ?.prints[0]
    : undefined;

  return {
    quarter: formatQuarter(current.quarter),
    value: latest.value,
    change,
    updated: latest.published,
    points: current.updates.map((update) => ({ x: update.published, y: update.value })),
    xDomain: [start, start + days * DAY_MS] as [number, number],
    xTicks,
    comparison: previous
      ? {
          quarter: formatQuarter(previous.quarter),
          finalNowcast: previous.updates[previous.updates.length - 1].value,
          firstPrint: firstPrint && firstPrint.published <= activeTime ? firstPrint.value : null,
        }
      : null,
  };
}

function formatChange(change: number) {
  return `${change > 0 ? "+" : ""}${change.toFixed(2)}`;
}

export function GdpNow() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;
  const nowcast = useMemo(() => buildNowcast(activeTime), [activeTime]);
  const unit = getEconIndicator("gdp_growth")?.unit ?? "";

  return (
    <PanelShell className="gdp-now" variant="chart" bodyMode="fit" badge="GDPNOW" bodyClassName="gdp-now__body">
      {nowcast ? (
        <>
          <div className="gdp-now__summary">
            <div className="gdp-now__quarter">
              {nowcast.quarter}
              <span className="gdp-now__unit">{unit}</span>
            </div>
            <div className="gdp-now__figures">
              <span className="gdp-now__value">{nowcast.value.toFixed(2)}</span>
              {nowcast.change !== null ? (
                <span className={`gdp-now__change gdp-now__change--${getChangeTone(nowcast.change)}`}>
                  {formatChange(nowcast.change)}
                </span>
              ) : null}
            </div>
            <div className="gdp-now__updated">Last updated {formatDayMonthYear(nowcast.updated)}</div>
            {nowcast.comparison ? (
              <div className="gdp-now__comparison">
                {nowcast.comparison.quarter}: final nowcast {nowcast.comparison.finalNowcast.toFixed(2)}, first print{" "}
                {nowcast.comparison.firstPrint !== null ? nowcast.comparison.firstPrint.toFixed(1) : "--"}
              </div>
            ) : null}
          </div>
          <EconLineChart
            ariaLabel={`GDPNow estimates for ${nowcast.quarter}`}
            className="gdp-now__chart"
            points={nowcast.points}
            xDomain={nowcast.xDomain}
            xTicks={nowcast.xTicks}
            step
          />
        </>
      ) : (
        <p className="gdp-now__empty">No GDPNow estimate for the selected week.</p>
      )}
    </PanelShell>
  );
}
