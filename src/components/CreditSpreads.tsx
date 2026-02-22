import { useMemo } from "react";
import {
  DAY_MS,
  CREDIT_SPREAD_ORDER,
  getAlignedPoint,
  getCreditSpreadSeries,
  type CreditSpreadKey,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./CreditSpreads.css";

type SpreadRow = {
  ticker: CreditSpreadKey;
  thisWeek: number | null;
  lastWeek: number | null;
  delta: number | null;
  yearStart: number | null;
  ytd: number | null;
};

const SERIES = getCreditSpreadSeries();

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

function formatSpread(value: number | null, bracket = false, showPositiveSign = false) {
  if (value === null) return "--";
  const rounded = Math.round(value);
  const sign = showPositiveSign && rounded > 0 ? "+" : "";
  const txt = `${sign}${rounded}bp`;
  return bracket ? `[${txt}]` : txt;
}

function getValueTone(value: number | null) {
  if (value === null || Math.abs(value) < 0.00005) return "credit-spreads__value--neutral";
  // For credit spreads, tighter (negative delta) is favorable.
  return value < 0 ? "credit-spreads__value--positive" : "credit-spreads__value--negative";
}

export function CreditSpreads() {
  const { selected } = useNewsletterContext();

  const data = useMemo(() => {
    const activeTime = selected?.sortDate ?? null;
    const activeYear = activeTime !== null ? new Date(activeTime).getUTCFullYear() : null;

    const rows: SpreadRow[] = CREDIT_SPREAD_ORDER.map((ticker) => {
      if (activeTime === null || activeYear === null) {
        return { ticker, thisWeek: null, lastWeek: null, delta: null, yearStart: null, ytd: null };
      }

      const series = SERIES.get(ticker) ?? [];
      const thisWeek = getAlignedPoint(series, activeTime)?.value ?? null;
      const lastWeek = getAlignedPoint(series, activeTime - 7 * DAY_MS)?.value ?? null;
      const yearStart = getYearAnchorValue(series, activeYear);
      const delta = thisWeek !== null && lastWeek !== null ? thisWeek - lastWeek : null;
      const ytd = thisWeek !== null && yearStart !== null ? thisWeek - yearStart : null;

      return { ticker, thisWeek, lastWeek, delta, yearStart, ytd };
    });

    return {
      yearLabel: activeYear ? `1/1/${activeYear}` : "1/1/----",
      rows,
    };
  }, [selected]);

  return (
    <section className="credit-spreads">
      <div className="credit-spreads__header">
        <span className="credit-spreads__titleBadge">OAS</span>
      </div>
      <div className="credit-spreads__body">
        <table className="credit-spreads__table" aria-label="Credit spreads OAS">
          <thead>
            <tr>
              <th scope="col" className="credit-spreads__head credit-spreads__head--name">TICKER</th>
              <th scope="col" className="credit-spreads__head">THIS WK</th>
              <th scope="col" className="credit-spreads__head">LAST WK</th>
              <th scope="col" className="credit-spreads__head">Δ</th>
              <th scope="col" className="credit-spreads__head">{data.yearLabel}</th>
              <th scope="col" className="credit-spreads__head">YTD Δ</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.ticker}>
                <th scope="row" className="credit-spreads__name">{row.ticker}</th>
                <td className="credit-spreads__value credit-spreads__value--neutral">{formatSpread(row.thisWeek)}</td>
                <td className="credit-spreads__value credit-spreads__value--neutral">{formatSpread(row.lastWeek, true)}</td>
                <td className={`credit-spreads__value ${getValueTone(row.delta)}`}>{formatSpread(row.delta, false, true)}</td>
                <td className="credit-spreads__value credit-spreads__value--neutral">{formatSpread(row.yearStart)}</td>
                <td className={`credit-spreads__value ${getValueTone(row.ytd)}`}>{formatSpread(row.ytd, false, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
