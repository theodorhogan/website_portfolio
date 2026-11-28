import { useMemo } from "react";
import type { NullablePoint } from "../data/csvStore";
import {
  formatForwardPe,
  getEarningsWeeks,
  getForwardPe,
  getForwardPeSeries,
  type ForwardPeKey,
  type ForwardPeReading,
} from "../data/earningsData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS } from "../utils/dates";
import { getAlignedPoint } from "../utils/timeSeries";
import { CompactMetricsTable, type CompactMetricsRow } from "./CompactMetricsTable";
import { PanelShell } from "./PanelShell";
import "./IndexEarnings.css";

/** SPX and STOXX600 are left out on purpose: their P/E is on the Beta page's charts. */
const INDEX_ORDER: readonly ForwardPeKey[] = ["NDX", "IJR", "DAX", "AEX", "NIKKEI"];

/**
 * The year's first row as of `time`. NA rows count, so a year that opens on an
 * NA row reads NA rather than borrowing a later week's value.
 */
function getYearStartReading(series: readonly NullablePoint[], time: number): ForwardPeReading {
  const yearStart = Date.UTC(new Date(time).getUTCFullYear(), 0, 1);
  const first = series.find((point) => point.time >= yearStart);
  return first && first.time <= time ? first : null;
}

/** Prior-week values are bracketed like the other tables; `NA` and `--` stay bare. */
function formatBracketedPe(reading: ForwardPeReading) {
  const text = formatForwardPe(reading);
  return reading && reading.value !== null ? `[${text}]` : text;
}

/** The week's earnings comment and the forward P/E of the indexes not charted on the Beta page. */
export function IndexEarnings() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const { comment, rows } = useMemo(() => {
    const week = activeTime === null ? null : getAlignedPoint(getEarningsWeeks(), activeTime);

    const tableRows: CompactMetricsRow[] = INDEX_ORDER.map((ticker) => {
      const thisWeek = activeTime === null ? null : getForwardPe(ticker, activeTime);
      const lastWeek = activeTime === null ? null : getForwardPe(ticker, activeTime - WEEK_MS);
      const yearStart = activeTime === null ? null : getYearStartReading(getForwardPeSeries(ticker), activeTime);

      return {
        key: ticker,
        label: ticker,
        cells: [
          { content: formatForwardPe(thisWeek) },
          { content: formatBracketedPe(lastWeek) },
          { content: formatForwardPe(yearStart) },
        ],
      };
    });

    return { comment: week?.comment ?? null, rows: tableRows };
  }, [activeTime]);

  return (
    <PanelShell className="index-earnings" variant="standard" bodyMode="fit" badge="INDEX EARNINGS">
      {comment ? <p className="index-earnings__comment">{comment}</p> : null}
      <CompactMetricsTable
        ariaLabel="Index forward P/E"
        rowHeaderLabel="INDEX"
        columns={[
          { key: "this-week", label: "FWD P/E", align: "right" },
          { key: "last-week", label: "LAST WK", align: "right" },
          { key: "year-start", label: "START OF YR", align: "right" },
        ]}
        rows={rows}
        tableClassName="index-earnings__table"
      />
    </PanelShell>
  );
}
