import { useMemo } from "react";
import {
  DAY_MS,
  MAJOR_INDEX_ORDER,
  computePercentChange,
  computeRollingHigh,
  getAlignedPoint,
  getMajorIndexSeries,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./MajorIndexes.css";

type MajorIndexRow = {
  ticker: string;
  priceText: string;
  weekChangeText: string;
  weekChangeClassName: string;
  lastWeekChangeText: string;
  lastWeekChangeClassName: string;
  high52WeekText: string;
};

const TRAILING_52_WEEK_MS = 364 * DAY_MS;
const INDEX_SERIES = getMajorIndexSeries();

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getChangeClassName(change: number | null) {
  if (change === null || Math.abs(change) < 0.00005) {
    return "major-indexes__change major-indexes__change--neutral";
  }
  if (change > 0) {
    return "major-indexes__change major-indexes__change--positive";
  }
  return "major-indexes__change major-indexes__change--negative";
}

function formatPercent(change: number | null, bracketed: boolean) {
  if (change === null || Math.abs(change) < 0.00005) {
    return bracketed ? "[0.00%]" : "0.00%";
  }

  const sign = change > 0 ? "+" : "";
  const base = `${sign}${(change * 100).toFixed(2)}%`;
  return bracketed ? `[${base}]` : base;
}

function formatPrice(price: number | null) {
  if (price === null) return "--";
  return priceFormatter.format(price);
}

export function MajorIndexes() {
  const { selected } = useNewsletterContext();

  const rows = useMemo<MajorIndexRow[]>(() => {
    const activeTime = selected?.sortDate ?? null;

    return MAJOR_INDEX_ORDER.map((ticker) => {
      const series = INDEX_SERIES.get(ticker) ?? [];
      if (activeTime === null || series.length === 0) {
        return {
          ticker,
          priceText: "--",
          weekChangeText: "--",
          weekChangeClassName: "major-indexes__change major-indexes__change--neutral",
          lastWeekChangeText: "--",
          lastWeekChangeClassName: "major-indexes__change major-indexes__change--neutral",
          high52WeekText: "--",
        };
      }

      const current = getAlignedPoint(series, activeTime);
      const lastWeek = getAlignedPoint(series, activeTime - 7 * DAY_MS);
      const twoWeeks = getAlignedPoint(series, activeTime - 14 * DAY_MS);

      if (!current) {
        return {
          ticker,
          priceText: "--",
          weekChangeText: "--",
          weekChangeClassName: "major-indexes__change major-indexes__change--neutral",
          lastWeekChangeText: "--",
          lastWeekChangeClassName: "major-indexes__change major-indexes__change--neutral",
          high52WeekText: "--",
        };
      }

      const weekChange = computePercentChange(current.value, lastWeek?.value ?? null);
      const lastWeekChange = computePercentChange(lastWeek?.value ?? null, twoWeeks?.value ?? null);
      const high52Week = computeRollingHigh(series, current.time, TRAILING_52_WEEK_MS);

      return {
        ticker,
        priceText: formatPrice(current.value),
        weekChangeText: formatPercent(weekChange, false),
        weekChangeClassName: getChangeClassName(weekChange),
        lastWeekChangeText: formatPercent(lastWeekChange, true),
        lastWeekChangeClassName: getChangeClassName(lastWeekChange),
        high52WeekText: formatPrice(high52Week),
      };
    });
  }, [selected]);

  return (
    <section className="major-indexes">
      <div className="major-indexes__header">
        <span className="major-indexes__titleBadge">MAJOR INDEXES</span>
      </div>
      <div className="major-indexes__body">
        <table className="major-indexes__table" aria-label="Major indexes snapshot">
          <colgroup>
            <col className="major-indexes__colTicker" />
            <col className="major-indexes__colPrice" />
            <col className="major-indexes__colChange" />
            <col className="major-indexes__colLastWeek" />
            <col className="major-indexes__colHigh" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="major-indexes__headTicker">Ticker</th>
              <th scope="col" className="major-indexes__headNumber">Price</th>
              <th scope="col" className="major-indexes__headNumber">% Change</th>
              <th scope="col" className="major-indexes__headNumber">[% last wk]</th>
              <th scope="col" className="major-indexes__headNumber">52W High</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker}>
                <td className="major-indexes__ticker">{row.ticker}</td>
                <td className="major-indexes__number">{row.priceText}</td>
                <td className={row.weekChangeClassName}>{row.weekChangeText}</td>
                <td className={row.lastWeekChangeClassName}>{row.lastWeekChangeText}</td>
                <td className="major-indexes__number">{row.high52WeekText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
