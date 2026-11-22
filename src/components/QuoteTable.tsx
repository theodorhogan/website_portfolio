import type { QuoteRow } from "./quoteRows";
import "./MajorIndexes.css";

type QuoteTableProps = {
  ariaLabel: string;
  rows: QuoteRow[];
  emptyMessage?: string;
};

/** Ticker / price / week change / prior-week change / 52-week high table shared by the index and watchlist panels. */
export function QuoteTable({ ariaLabel, rows, emptyMessage }: QuoteTableProps) {
  if (rows.length === 0 && emptyMessage) {
    return <p className="major-indexes__empty">{emptyMessage}</p>;
  }

  return (
    <table className="major-indexes__table" aria-label={ariaLabel}>
      <thead>
        <tr>
          <th scope="col" className="major-indexes__headTicker">Ticker</th>
          <th scope="col" className="major-indexes__headNumber">Price</th>
          <th scope="col" className="major-indexes__headNumber">% Chg</th>
          <th scope="col" className="major-indexes__headNumber">[% Last Wk]</th>
          <th scope="col" className="major-indexes__headNumber">52W High</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ticker}>
            <td className="major-indexes__ticker">{row.ticker}</td>
            <td className="major-indexes__number">{row.price}</td>
            <td className={`major-indexes__change major-indexes__change--${row.weekTone}`}>{row.weekChange}</td>
            <td className={`major-indexes__change major-indexes__change--${row.lastWeekTone}`}>{row.lastWeekChange}</td>
            <td className="major-indexes__number">{row.high52Week}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
