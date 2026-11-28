import { useMemo } from "react";
import { getSeries, type SeriesKey } from "../data/ratesData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS } from "../utils/dates";
import { getChangeTone, getInverseChangeTone } from "../utils/format";
import { computeNominalChange, computePercentChange, getAlignedPoint, getYearAnchorValue } from "../utils/timeSeries";
import { CompactMetricsTable, type CompactMetricsRow } from "./CompactMetricsTable";
import { PanelShell } from "./PanelShell";
import "./FedLiquidity.css";

type LiquidityRowDef = {
  label: string;
  series: SeriesKey;
  /** Balances are in $bn; SOFR is a rate, shown in percent with its changes in basis points. */
  kind: "balance" | "rate";
};

const ROW_DEFS: LiquidityRowDef[] = [
  { label: "ON RRP", series: "RRP", kind: "balance" },
  { label: "REPO", series: "REPO", kind: "balance" },
  { label: "RESERVES", series: "RESERVES", kind: "balance" },
  { label: "TGA", series: "TGA", kind: "balance" },
  { label: "SOMA", series: "SOMA", kind: "balance" },
  { label: "FED ASSETS", series: "FED_ASSETS", kind: "balance" },
  { label: "SOFR", series: "SOFR", kind: "rate" },
];

const balanceFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatLevel(value: number | null, kind: LiquidityRowDef["kind"], bracket = false) {
  if (value === null) return "--";
  const text = kind === "rate" ? value.toFixed(2) : balanceFormatter.format(value);
  return bracket ? `[${text}]` : text;
}

function formatChange(value: number | null, kind: LiquidityRowDef["kind"]) {
  if (value === null) return "--";
  if (kind === "rate") {
    const bps = Math.round(value * 100);
    return `${bps > 0 ? "+" : ""}${bps}bp`;
  }
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${balanceFormatter.format(rounded)}`;
}

function formatYtdPercent(change: number | null) {
  if (change === null) return "--";
  const percent = Math.round(change * 1000) / 10;
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export function FedLiquidity() {
  const { selected } = useNewsletterContext();

  const rows = useMemo<CompactMetricsRow[]>(() => {
    const activeTime = selected?.sortDate ?? null;
    const activeYear = activeTime !== null ? new Date(activeTime).getUTCFullYear() : null;

    return ROW_DEFS.map(({ label, series: key, kind }) => {
      const series = getSeries(key);
      const thisWeek = activeTime === null ? null : (getAlignedPoint(series, activeTime)?.value ?? null);
      const lastWeek = activeTime === null ? null : (getAlignedPoint(series, activeTime - WEEK_MS)?.value ?? null);
      const yearStart = activeYear === null ? null : getYearAnchorValue(series, activeYear);
      const delta = computeNominalChange(thisWeek, lastWeek);
      const ytd = computeNominalChange(thisWeek, yearStart);
      // A rise in the funding rate reads as tighter, like the yields on this page.
      const tone = kind === "rate" ? getInverseChangeTone : getChangeTone;

      return {
        key,
        label,
        cells: [
          { content: formatLevel(thisWeek, kind), tone: "neutral" },
          { content: formatLevel(lastWeek, kind, true), tone: "neutral" },
          { content: formatChange(delta, kind), tone: tone(delta) },
          { content: formatChange(ytd, kind), tone: tone(ytd) },
          {
            content: kind === "rate" ? "" : formatYtdPercent(computePercentChange(thisWeek, yearStart)),
            tone: tone(ytd),
          },
        ],
      };
    });
  }, [selected]);

  return (
    <PanelShell className="fed-liquidity" variant="standard" bodyMode="fit" badge="FED LIQUIDITY" meta="$BN">
      <CompactMetricsTable
        ariaLabel="Fed liquidity: balances in billions of dollars, SOFR in percent"
        rowHeaderLabel="ITEM"
        tableClassName="fed-liquidity__table"
        columns={[
          { key: "this-week", label: "THIS WK", align: "right" },
          { key: "last-week", label: "LAST WK", align: "right" },
          { key: "delta", label: "Δ", align: "right" },
          { key: "ytd", label: "YTD Δ", align: "right" },
          { key: "ytd-percent", label: "YTD %", align: "right" },
        ]}
        rows={rows}
      />
    </PanelShell>
  );
}
