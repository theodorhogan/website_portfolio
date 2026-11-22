import { useMemo } from "react";
import { getWatchlistSeries } from "../data/equityData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { getAlignedPoint } from "../utils/timeSeries";
import { PanelShell } from "./PanelShell";
import { QuoteTable } from "./QuoteTable";
import { buildQuoteRow } from "./quoteRows";

export function FullWatchlist() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const rows = useMemo(() => {
    if (activeTime === null) return [];

    // The watchlist changes over time, so list the tickers held in the snapshot aligned to the active week.
    const watchlist = getWatchlistSeries();
    const snapshot = getAlignedPoint(watchlist.snapshots, activeTime);
    if (!snapshot) return [];

    return (watchlist.tickersByTime.get(snapshot.time) ?? []).map((ticker) =>
      buildQuoteRow(ticker, watchlist.seriesByTicker.get(ticker) ?? [], snapshot.time),
    );
  }, [activeTime]);

  return (
    <PanelShell
      className="major-indexes"
      variant="standard"
      bodyMode="scroll"
      badge="FULL WATCHLIST"
      bodyClassName="major-indexes__body"
    >
      <QuoteTable
        ariaLabel="Full watchlist snapshot"
        rows={rows}
        emptyMessage="No watchlist data for the selected week."
      />
    </PanelShell>
  );
}
