import { useMemo } from "react";
import { lazy, type NullablePoint } from "../data/csvStore";
import { getCloseSeries, getInstrumentsByGroup, type Instrument } from "../data/equityData";
import { getNullableSeries } from "../data/ratesData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS } from "../utils/dates";
import { formatPercentChange, formatPrice, getChangeTone, type ChangeTone } from "../utils/format";
import { computePercentChange, getAlignedPoint, getYearAnchorPoint } from "../utils/timeSeries";
import { PanelShell } from "./PanelShell";
import "./Commodities.css";

type Contract = {
  ticker: string;
  name: string;
  series: readonly NullablePoint[];
};

type ContractGroup = {
  label: string;
  contracts: Contract[];
};

type ContractRow = {
  ticker: string;
  name: string;
  last: string;
  weekChange: string;
  weekTone: ChangeTone;
  ytdChange: string;
  ytdTone: ChangeTone;
};

function toContract({ ticker, name }: Instrument): Contract {
  return { ticker, name, series: getCloseSeries(ticker) };
}

const getContractGroups = lazy((): ContractGroup[] => {
  const commodities = getInstrumentsByGroup("commodity");
  const inSection = (section: string) =>
    commodities.filter((instrument) => instrument.section === section).map(toContract);
  // Uranium is a weekly series with NA rows, kept outside the daily closes.
  const uranium: Contract = { ticker: "UX", name: "Uranium", series: getNullableSeries("UX") };

  return [
    { label: "Metals", contracts: [...inSection("metals"), uranium] },
    { label: "Energy", contracts: inSection("energy") },
    { label: "Agriculture", contracts: inSection("agriculture") },
    { label: "Other", contracts: [...getInstrumentsByGroup("etf"), ...getInstrumentsByGroup("crypto")].map(toContract) },
  ];
});

/** An NA row is the week's point: it shows `NA` and has no changes, rather than falling back to an older value. */
function buildRow({ ticker, name, series }: Contract, activeTime: number | null): ContractRow {
  const point = activeTime !== null ? getAlignedPoint(series, activeTime) : null;
  const last = point?.value ?? null;
  const lastWeek = activeTime !== null ? (getAlignedPoint(series, activeTime - WEEK_MS)?.value ?? null) : null;
  const yearStart =
    activeTime !== null ? (getYearAnchorPoint(series, new Date(activeTime).getUTCFullYear())?.value ?? null) : null;
  const weekChange = computePercentChange(last, lastWeek);
  const ytdChange = computePercentChange(last, yearStart);

  return {
    ticker,
    name,
    last: point !== null && point.value === null ? "NA" : formatPrice(last),
    weekChange: formatPercentChange(weekChange),
    weekTone: getChangeTone(weekChange),
    ytdChange: formatPercentChange(ytdChange),
    ytdTone: getChangeTone(ytdChange),
  };
}

export function Commodities() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const groups = useMemo(
    () =>
      getContractGroups().map((group) => ({
        label: group.label,
        rows: group.contracts.map((contract) => buildRow(contract, activeTime)),
      })),
    [activeTime],
  );

  return (
    <PanelShell className="commodities" variant="standard" bodyMode="scroll" badge="COMMODITIES">
      <table className="commodities__table" aria-label="Commodity, MBS ETF and crypto prices">
        <thead>
          <tr>
            <th scope="col" className="commodities__head commodities__head--name">
              Contract
            </th>
            <th scope="col" className="commodities__head">
              Last
            </th>
            <th scope="col" className="commodities__head">
              WoW %
            </th>
            <th scope="col" className="commodities__head">
              YTD %
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.label} className="commodities__group">
            <tr>
              <th scope="rowgroup" colSpan={4} className="commodities__groupLabel">
                {group.label}
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.ticker} className="commodities__row">
                <th scope="row" className="commodities__name">
                  {row.name} <span className="commodities__ticker">{row.ticker}</span>
                </th>
                <td className="commodities__number">{row.last}</td>
                <td className={`commodities__change commodities__change--${row.weekTone}`}>{row.weekChange}</td>
                <td className={`commodities__change commodities__change--${row.ytdTone}`}>{row.ytdChange}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </PanelShell>
  );
}
