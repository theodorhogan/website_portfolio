import { useMemo } from "react";
import { getEconIndicator, getEconReadings } from "../data/econData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { EconLineChart } from "./EconLineChart";
import { PanelShell } from "./PanelShell";
import "./DebtToGdp.css";

/** Ten years. */
const QUARTERS_SHOWN = 40;

/** `2026Q2` -> `Q2 2026`. */
function formatQuarter(period: string) {
  return period.replace(/^(\d{4})Q([1-4])$/, "Q$2 $1");
}

function buildDebt(activeTime: number | null) {
  const indicator = getEconIndicator("debt_to_gdp");
  if (!indicator || activeTime === null) return null;

  const readings = getEconReadings(indicator, activeTime, QUARTERS_SHOWN);
  const latest = readings.at(-1);
  if (!latest) return null;

  return {
    value: latest.value,
    quarter: formatQuarter(latest.period),
    points: readings.map((reading) => ({ x: reading.periodTime, y: reading.value })),
    xDomain: [readings[0].periodTime, latest.periodTime] as [number, number],
    // A label at the first quarter of every second year.
    xTicks: readings.flatMap((reading) => {
      const date = new Date(reading.periodTime);
      const year = date.getUTCFullYear();
      return date.getUTCMonth() === 0 && year % 2 === 0 ? [{ x: reading.periodTime, label: String(year) }] : [];
    }),
  };
}

export function DebtToGdp() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;
  const debt = useMemo(() => buildDebt(activeTime), [activeTime]);

  return (
    <PanelShell className="debt-to-gdp" variant="chart" bodyMode="fit" badge="DEBT-TO-GDP" bodyClassName="debt-to-gdp__body">
      {debt ? (
        <>
          <div className="debt-to-gdp__summary">
            <span className="debt-to-gdp__value">{debt.value.toFixed(1)}%</span>
            <span className="debt-to-gdp__quarter">{debt.quarter}</span>
          </div>
          <EconLineChart
            ariaLabel="Federal debt as a percentage of GDP, last ten years"
            className="debt-to-gdp__chart"
            points={debt.points}
            xDomain={debt.xDomain}
            xTicks={debt.xTicks}
          />
        </>
      ) : (
        <p className="debt-to-gdp__empty">No debt-to-GDP data for the selected week.</p>
      )}
    </PanelShell>
  );
}
