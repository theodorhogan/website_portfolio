import { useMemo } from "react";
import { getWatchlistSeries } from "../data/equityData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { PanelShell } from "./PanelShell";
import { QuoteTable } from "./QuoteTable";
import { buildQuoteRow } from "./quoteRows";

export function FullWatchlist() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const rows = useMemo(() => {
    if (activeTime === null) return [];

    // The watchlist changes over time, so list the stocks that were on it in the active week.
    const watchlist = getWatchlistSeries();
    return watchlist
      .tickersAt(activeTime)
      .map((ticker) => buildQuoteRow(ticker, watchlist.seriesByTicker.get(ticker) ?? [], activeTime));
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
