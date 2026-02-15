import { useMemo } from "react";
import equityDataCsv from "../content/pricedatabase/equitydata.csv?raw";
import { useNewsletterContext } from "../state/NewsletterContext";
import "./MajorIndexes.css";

type PricePoint = {
  time: number;
  price: number;
};

type FullWatchlistRow = {
  ticker: string;
  priceText: string;
  weekChangeText: string;
  weekChangeClassName: string;
  lastWeekChangeText: string;
  lastWeekChangeClassName: string;
  high52WeekText: string;
};

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;
const TRAILING_52_WEEK_MS = 364 * DAY_MS;

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toExcelUtcTime(serial: number) {
  return EXCEL_EPOCH_UTC + Math.round(serial) * DAY_MS;
}

function getIsoWeekKeyFromTime(time: number) {
  const date = new Date(time);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-${weekNumber}`;
}

function getActiveIndex(series: PricePoint[], activeTime: number) {
  const activeWeekKey = getIsoWeekKeyFromTime(activeTime);

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (getIsoWeekKeyFromTime(series[i].time) === activeWeekKey) {
      return i;
    }
  }

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= activeTime) {
      return i;
    }
  }

  return -1;
}

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
  if (price === null) {
    return "--";
  }
  return priceFormatter.format(price);
}

function parseStoxSeries(rawCsv: string) {
  const seriesMaps = new Map<string, Map<number, number>>();
  const tickersByTime = new Map<number, string[]>();

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = line.split(",");
    if (parts.length < 5) continue;

    const excelDate = Number(parts[0]);
    const ticker = (parts[2] ?? "").trim().toUpperCase();
    const tag = (parts[3] ?? "").trim().toLowerCase();
    const price = Number(parts[4]);

    if (tag !== "stox" || !ticker || !Number.isFinite(excelDate) || !Number.isFinite(price)) {
      continue;
    }

    const time = toExcelUtcTime(excelDate);

    const tickerMap = seriesMaps.get(ticker) ?? new Map<number, number>();
    tickerMap.set(time, price);
    seriesMaps.set(ticker, tickerMap);

    const tickersAtTime = tickersByTime.get(time) ?? [];
    if (!tickersAtTime.includes(ticker)) {
      tickersAtTime.push(ticker);
    }
    tickersByTime.set(time, tickersAtTime);
  }

  const seriesByTicker = new Map<string, PricePoint[]>();
  for (const [ticker, tickerMap] of seriesMaps.entries()) {
    const sorted = [...tickerMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([time, price]) => ({ time, price }));
    seriesByTicker.set(ticker, sorted);
  }

  const sortedTimes = [...tickersByTime.keys()].sort((a, b) => a - b);

  return { seriesByTicker, tickersByTime, sortedTimes };
}

function resolveSnapshotTime(sortedTimes: number[], activeTime: number) {
  const activeWeekKey = getIsoWeekKeyFromTime(activeTime);
  let sameWeekTime: number | null = null;

  for (const time of sortedTimes) {
    if (getIsoWeekKeyFromTime(time) === activeWeekKey) {
      sameWeekTime = time;
    }
  }

  if (sameWeekTime !== null) {
    return sameWeekTime;
  }

  let lastBeforeOrOn: number | null = null;
  for (const time of sortedTimes) {
    if (time <= activeTime) {
      lastBeforeOrOn = time;
    } else {
      break;
    }
  }

  return lastBeforeOrOn;
}

const STOX_DATA = parseStoxSeries(equityDataCsv);

export function FullWatchlist() {
  const { selected } = useNewsletterContext();

  const rows = useMemo<FullWatchlistRow[]>(() => {
    const activeTime = selected?.sortDate ?? null;
    if (activeTime === null) {
      return [];
    }

    const snapshotTime = resolveSnapshotTime(STOX_DATA.sortedTimes, activeTime);
    if (snapshotTime === null) {
      return [];
    }

    const activeTickers = STOX_DATA.tickersByTime.get(snapshotTime) ?? [];

    return activeTickers.map((ticker) => {
      const series = STOX_DATA.seriesByTicker.get(ticker) ?? [];
      const activeIndex = getActiveIndex(series, snapshotTime);

      if (activeIndex < 0) {
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

      const current = series[activeIndex];
      const previous = series[activeIndex - 1] ?? null;
      const twoBack = series[activeIndex - 2] ?? null;

      const weekChange =
        previous && previous.price !== 0 ? current.price / previous.price - 1 : null;
      const lastWeekChange =
        previous && twoBack && twoBack.price !== 0 ? previous.price / twoBack.price - 1 : null;

      const windowStart = current.time - TRAILING_52_WEEK_MS;
      const trailingWindow = series.filter(
        (point, index) => index <= activeIndex && point.time >= windowStart,
      );
      const highWindow = trailingWindow.length > 0 ? trailingWindow : series.slice(0, activeIndex + 1);
      const high52Week = Math.max(...highWindow.map((point) => point.price));

      return {
        ticker,
        priceText: formatPrice(current.price),
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
        <span className="major-indexes__titleBadge">FULL WATCHLIST</span>
      </div>
      <div className="major-indexes__body">
        <table className="major-indexes__table" aria-label="Full watchlist snapshot">
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
