import { useMemo } from "react";
import { MAJOR_INDEX_ORDER, getMajorIndexSeries } from "../data/equityData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { PanelShell } from "./PanelShell";
import { QuoteTable } from "./QuoteTable";
import { buildQuoteRow } from "./quoteRows";

export function MajorIndexes() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const rows = useMemo(() => {
    const seriesByTicker = getMajorIndexSeries();
    return MAJOR_INDEX_ORDER.map((ticker) => buildQuoteRow(ticker, seriesByTicker.get(ticker) ?? [], activeTime));
  }, [activeTime]);

  return (
    <PanelShell
      className="major-indexes"
      variant="standard"
      bodyMode="scroll"
      badge="MAJOR INDEXES"
      bodyClassName="major-indexes__body"
    >
      <QuoteTable ariaLabel="Major indexes snapshot" rows={rows} />
    </PanelShell>
  );
}
