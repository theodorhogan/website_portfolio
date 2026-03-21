import { useMemo } from "react";
import {
  DAY_MS,
  CREDIT_SPREAD_ORDER,
  getAlignedPoint,
  getCreditSpreadSeries,
  type CreditSpreadKey,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { getYearAnchorValue } from "../utils/timeSeries";
import {
  CompactMetricsTable,
  type CompactMetricsRow,
  type CompactMetricsTone,
} from "./CompactMetricsTable";
import { PanelShell } from "./PanelShell";

type SpreadRow = {
  ticker: CreditSpreadKey;
  thisWeek: number | null;
  lastWeek: number | null;
  delta: number | null;
  yearStart: number | null;
  ytd: number | null;
};

const SERIES = getCreditSpreadSeries();

function formatSpread(value: number | null, bracket = false, showPositiveSign = false) {
  if (value === null) return "--";
  const rounded = Math.round(value);
  const sign = showPositiveSign && rounded > 0 ? "+" : "";
  const txt = `${sign}${rounded}bp`;
  return bracket ? `[${txt}]` : txt;
}

function getTone(value: number | null): CompactMetricsTone {
  if (value === null || Math.abs(value) < 0.00005) return "neutral";
  return value < 0 ? "positive" : "negative";
}

export function CreditSpreads() {
  const { selected } = useNewsletterContext();

  const data = useMemo(() => {
    const activeTime = selected?.sortDate ?? null;
    const activeYear = activeTime !== null ? new Date(activeTime).getUTCFullYear() : null;

    const rawRows: SpreadRow[] = CREDIT_SPREAD_ORDER.map((ticker) => {
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

    const rows: CompactMetricsRow[] = rawRows.map((row) => ({
      key: row.ticker,
      label: row.ticker,
      cells: [
        { content: formatSpread(row.thisWeek), tone: "neutral" },
        { content: formatSpread(row.lastWeek, true), tone: "neutral" },
        { content: formatSpread(row.delta, false, true), tone: getTone(row.delta) },
        { content: formatSpread(row.yearStart), tone: "neutral" },
        { content: formatSpread(row.ytd, false, true), tone: getTone(row.ytd) },
      ],
    }));

    return {
      yearLabel: activeYear ? `1/1/${activeYear}` : "1/1/----",
      rows,
    };
  }, [selected]);

  return (
    <PanelShell className="credit-spreads" variant="standard" bodyMode="fit" badge="OAS">
      <CompactMetricsTable
        ariaLabel="Credit spreads OAS"
        rowHeaderLabel="TICKER"
        columns={[
          { key: "this-week", label: "THIS WK", align: "right" },
          { key: "last-week", label: "LAST WK", align: "right" },
          { key: "delta", label: "\u0394", align: "right" },
          { key: "year-start", label: data.yearLabel, align: "right" },
          { key: "ytd", label: "YTD \u0394", align: "right" },
        ]}
        rows={data.rows}
      />
    </PanelShell>
  );
}
