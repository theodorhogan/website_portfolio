import { useMemo } from "react";
import { formatEconValue, getEconIndicator, getEconIndicators, getEconReadings } from "../data/econData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { formatDayMonthYear } from "../utils/dates";
import { getChangeTone } from "../utils/format";
import { PanelShell } from "./PanelShell";
import "./GdpBreakdown.css";

/** By the number of releases that have covered the quarter; later ones are plain revisions. */
const ESTIMATE_LABELS = ["FIRST ESTIMATE", "SECOND ESTIMATE", "THIRD ESTIMATE"];

/** `2026Q3` -> `Q3 2026`. */
function formatQuarter(period: string) {
  return period.replace(/^(\d{4})Q([1-4])$/, "Q$2 $1");
}

/** The latest quarter with a growth print in the active week, and what each component added to it. */
function buildBreakdown(activeTime: number | null) {
  const growth = getEconIndicator("gdp_growth");
  if (!growth || activeTime === null) return null;

  const quarters = getEconReadings(growth, activeTime, 2);
  const current = quarters.at(-1);
  if (!current) return null;
  const previousPeriod = quarters.length > 1 ? quarters[0].period : null;

  const releases = (
    growth.observations.find((observation) => observation.period === current.period)?.releases ?? []
  ).filter((release) => release <= activeTime);

  const rows = getEconIndicators()
    .filter((indicator) => indicator.group === "gdp_contribution")
    .map((indicator) => {
      const byPeriod = new Map(
        getEconReadings(indicator, activeTime, 2).map((reading) => [reading.period, reading.value]),
      );
      return {
        indicator,
        value: byPeriod.get(current.period) ?? null,
        previous: previousPeriod ? (byPeriod.get(previousPeriod) ?? null) : null,
      };
    });

  return {
    period: current.period,
    previousPeriod,
    growth: current.value,
    growthText: `${formatEconValue(growth, current.value)}%`,
    estimate: releases.length > 0 ? (ESTIMATE_LABELS[releases.length - 1] ?? "REVISED") : null,
    published: releases.at(-1) ?? current.published,
    rows,
    // Every bar is scaled to the largest contribution, either side of zero.
    scale: Math.max(0, ...rows.map((row) => Math.abs(row.value ?? 0))),
  };
}

export function GdpBreakdown() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;
  const breakdown = useMemo(() => buildBreakdown(activeTime), [activeTime]);

  return (
    <PanelShell className="gdp-breakdown" variant="standard" bodyMode="fit" badge="GDP BREAKDOWN">
      {breakdown ? (
        <>
          <div className="gdp-breakdown__summary">
            <div className="gdp-breakdown__headline">
              <span className="gdp-breakdown__quarter">{formatQuarter(breakdown.period)}</span>
              <span
                className={`gdp-breakdown__value gdp-breakdown__value--headline gdp-breakdown__value--${getChangeTone(breakdown.growth)}`}
              >
                {breakdown.growthText}
              </span>
              {breakdown.estimate ? <span className="gdp-breakdown__estimate">{breakdown.estimate}</span> : null}
            </div>
            <div className="gdp-breakdown__published">Published {formatDayMonthYear(breakdown.published)}</div>
          </div>
          <div className="gdp-breakdown__key">
            <span>Contribution, pp</span>
            <span>
              {breakdown.period.slice(4)}
              {breakdown.previousPeriod ? ` [${breakdown.previousPeriod.slice(4)}]` : ""}
            </span>
          </div>
          <ul className="gdp-breakdown__rows">
            {breakdown.rows.map(({ indicator, value, previous }) => {
              const width = value !== null && breakdown.scale > 0 ? (Math.abs(value) / breakdown.scale) * 50 : 0;
              const tone = getChangeTone(value);

              return (
                <li key={indicator.key} className="gdp-breakdown__row">
                  <div className="gdp-breakdown__rowHead">
                    <span className="gdp-breakdown__label">{indicator.label}</span>
                    <span className={`gdp-breakdown__value gdp-breakdown__value--${tone}`}>
                      {formatEconValue(indicator, value)}
                    </span>
                    {breakdown.previousPeriod ? (
                      <span className="gdp-breakdown__previous">[{formatEconValue(indicator, previous)}]</span>
                    ) : null}
                  </div>
                  <div className="gdp-breakdown__track" aria-hidden="true">
                    {width > 0 ? (
                      <span
                        className={`gdp-breakdown__bar gdp-breakdown__bar--${tone}`}
                        style={{ left: `${tone === "negative" ? 50 - width : 50}%`, width: `${width}%` }}
                      />
                    ) : null}
                    <span className="gdp-breakdown__zeroLine" />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="gdp-breakdown__empty">No GDP release for the selected week.</p>
      )}
    </PanelShell>
  );
}
