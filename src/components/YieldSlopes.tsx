import { useMemo } from "react";
import {
  DAY_MS,
  getAlignedPoint,
  getTreasurySeries,
  type TreasuryInstrumentKey,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./YieldSlopes.css";

type SlopeRow = {
  ticker: string;
  thisWeek: number | null;
  lastWeek: number | null;
  delta: number | null;
  yearStart: number | null;
  ytd: number | null;
};

const SLOPE_DEFS: Array<{ ticker: string; left: TreasuryInstrumentKey; right: TreasuryInstrumentKey }> = [
  { ticker: "2Y-10Y", left: "US2Y", right: "US10Y" },
  { ticker: "3M-10Y", left: "US3M", right: "US10Y" },
];

const TREASURY_SERIES = getTreasurySeries();

function getYearAnchorValue(series: Array<{ time: number; value: number }>, year: number) {
  const yearStartTime = Date.UTC(year, 0, 1);
  let lastBeforeOrOnStart: number | null = null;

  for (const point of series) {
    if (point.time <= yearStartTime) {
      lastBeforeOrOnStart = point.value;
      continue;
    }
    break;
  }

  if (lastBeforeOrOnStart !== null) return lastBeforeOrOnStart;

  for (const point of series) {
    if (new Date(point.time).getUTCFullYear() === year) {
      return point.value;
    }
  }

  return null;
}

function getSlopeValue(leftTicker: TreasuryInstrumentKey, rightTicker: TreasuryInstrumentKey, targetTime: number) {
  const leftSeries = TREASURY_SERIES.get(leftTicker) ?? [];
  const rightSeries = TREASURY_SERIES.get(rightTicker) ?? [];
  const left = getAlignedPoint(leftSeries, targetTime);
  const right = getAlignedPoint(rightSeries, targetTime);
  if (!left || !right) return null;
  return right.value - left.value;
}

function getSlopeYearAnchor(leftTicker: TreasuryInstrumentKey, rightTicker: TreasuryInstrumentKey, year: number) {
  const leftSeries = TREASURY_SERIES.get(leftTicker) ?? [];
  const rightSeries = TREASURY_SERIES.get(rightTicker) ?? [];
  const left = getYearAnchorValue(leftSeries, year);
  const right = getYearAnchorValue(rightSeries, year);
  if (left === null || right === null) return null;
  return right - left;
}

function formatBps(value: number | null, bracket = false, showPositiveSign = false) {
  if (value === null) return "--";
  const bps = Math.round(value * 100);
  const sign = showPositiveSign && bps > 0 ? "+" : "";
  const text = `${sign}${bps}bp`;
  return bracket ? `[${text}]` : text;
}

function toneClass(value: number | null) {
  if (value === null || Math.abs(value) < 0.00005) return "yield-slopes__value--neutral";
  return value > 0 ? "yield-slopes__value--positive" : "yield-slopes__value--negative";
}

export function YieldSlopes() {
  const { selected } = useNewsletterContext();

  const table = useMemo(() => {
    const activeTime = selected?.sortDate ?? null;
    const activeYear = activeTime !== null ? new Date(activeTime).getUTCFullYear() : null;

    const rows: SlopeRow[] = SLOPE_DEFS.map((def) => {
      if (activeTime === null || activeYear === null) {
        return {
          ticker: def.ticker,
          thisWeek: null,
          lastWeek: null,
          delta: null,
          yearStart: null,
          ytd: null,
        };
      }

      const thisWeek = getSlopeValue(def.left, def.right, activeTime);
      const lastWeek = getSlopeValue(def.left, def.right, activeTime - 7 * DAY_MS);
      const yearStart = getSlopeYearAnchor(def.left, def.right, activeYear);
      const delta = thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null;
      const ytd = thisWeek !== null && yearStart !== null ? thisWeek - yearStart : null;

      return { ticker: def.ticker, thisWeek, lastWeek, delta, yearStart, ytd };
    });

    return {
      yearLabel: activeYear ? `1/1/${activeYear}` : "1/1/----",
      rows,
    };
  }, [selected]);

  return (
    <section className="yield-slopes">
      <div className="yield-slopes__header">
        <span className="yield-slopes__titleBadge">SLOPES</span>
      </div>
      <div className="yield-slopes__body">
        <table className="yield-slopes__table" aria-label="Yield curve slopes">
          <thead>
            <tr>
              <th scope="col" className="yield-slopes__head yield-slopes__head--name">TICKER</th>
              <th scope="col" className="yield-slopes__head">THIS WK</th>
              <th scope="col" className="yield-slopes__head">LAST WK</th>
              <th scope="col" className="yield-slopes__head">Δ</th>
              <th scope="col" className="yield-slopes__head">{table.yearLabel}</th>
              <th scope="col" className="yield-slopes__head">YTD Δ</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.ticker}>
                <th scope="row" className="yield-slopes__name">{row.ticker}</th>
                <td className="yield-slopes__value yield-slopes__value--neutral">{formatBps(row.thisWeek)}</td>
                <td className="yield-slopes__value yield-slopes__value--neutral">{formatBps(row.lastWeek, true)}</td>
                <td className={`yield-slopes__value ${toneClass(row.delta)}`}>{formatBps(row.delta, false, true)}</td>
                <td className="yield-slopes__value yield-slopes__value--neutral">{formatBps(row.yearStart)}</td>
                <td className={`yield-slopes__value ${toneClass(row.ytd)}`}>{formatBps(row.ytd, false, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
