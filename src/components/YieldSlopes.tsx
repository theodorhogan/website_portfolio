import { useMemo } from "react";
import {
  DAY_MS,
  getAlignedPoint,
  getTreasurySeries,
  type TreasuryInstrumentKey,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { getYearAnchorValue } from "../utils/timeSeries";
import {
  CompactMetricsTable,
  type CompactMetricsRow,
  type CompactMetricsTone,
} from "./CompactMetricsTable";
import { PanelShell } from "./PanelShell";

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

function getTone(value: number | null): CompactMetricsTone {
  if (value === null || Math.abs(value) < 0.00005) return "neutral";
  return value > 0 ? "positive" : "negative";
}

export function YieldSlopes() {
  const { selected } = useNewsletterContext();

  const table = useMemo(() => {
    const activeTime = selected?.sortDate ?? null;
    const activeYear = activeTime !== null ? new Date(activeTime).getUTCFullYear() : null;

    const rawRows: SlopeRow[] = SLOPE_DEFS.map((def) => {
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

    const rows: CompactMetricsRow[] = rawRows.map((row) => ({
      key: row.ticker,
      label: row.ticker,
      cells: [
        { content: formatBps(row.thisWeek), tone: "neutral" },
        { content: formatBps(row.lastWeek, true), tone: "neutral" },
        { content: formatBps(row.delta, false, true), tone: getTone(row.delta) },
        { content: formatBps(row.yearStart), tone: "neutral" },
        { content: formatBps(row.ytd, false, true), tone: getTone(row.ytd) },
      ],
    }));

    return {
      yearLabel: activeYear ? `1/1/${activeYear}` : "1/1/----",
      rows,
    };
  }, [selected]);

  return (
    <PanelShell className="yield-slopes" variant="standard" bodyMode="fit" badge="SLOPES">
      <CompactMetricsTable
        ariaLabel="Yield curve slopes"
        rowHeaderLabel="TICKER"
        columns={[
          { key: "this-week", label: "THIS WK", align: "right" },
          { key: "last-week", label: "LAST WK", align: "right" },
          { key: "delta", label: "\u0394", align: "right" },
          { key: "year-start", label: table.yearLabel, align: "right" },
          { key: "ytd", label: "YTD \u0394", align: "right" },
        ]}
        rows={table.rows}
      />
    </PanelShell>
  );
}
