import { useMemo } from "react";
import {
  getAlignedPoint,
  getEffrSeries,
  getFedFuturesSnapshots,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./QuartlyCuts.css";

type QuarterRow = {
  label: string;
  cutsBps: number | null;
};

const MONTH_TO_NUMBER: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const MONTH_AFTER_QUARTER_CLOSE: Record<number, number> = {
  1: 4,
  2: 7,
  3: 10,
  4: 1,
};

const EFFR_SERIES = getEffrSeries();
const FED_SNAPSHOTS = getFedFuturesSnapshots();

function formatQuarterLabel(quarter: number, year: number) {
  return `Q${quarter}' ${String(year).slice(-2)}`;
}

function parseZqTickerMonthYear(ticker: string) {
  const match = ticker.trim().toUpperCase().match(/^([A-Z]{3})\s+ZQ(\d{2})$/);
  if (!match) return null;
  const month = MONTH_TO_NUMBER[match[1]];
  const year = 2000 + Number(match[2]);
  if (!month || !Number.isFinite(year)) return null;
  return { month, year };
}

function formatRate(value: number | null) {
  if (value === null) return "--";
  return value.toFixed(2);
}

function formatBps(value: number | null) {
  if (value === null) return "--";
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}bp`;
}

function toneClass(value: number | null) {
  if (value === null || Math.abs(value) < 0.00005) return "quartly-cuts__value--neutral";
  // For this table, negative values represent implied cuts and should read as favorable.
  return value < 0 ? "quartly-cuts__value--positive" : "quartly-cuts__value--negative";
}

function getQuarterSequence(activeTime: number) {
  const activeDate = new Date(activeTime);
  const startQuarter = Math.floor(activeDate.getUTCMonth() / 3) + 1;
  const startYear = activeDate.getUTCFullYear();

  return Array.from({ length: 4 }, (_, index) => {
    const zeroBasedQuarter = startQuarter - 1 + index;
    const quarter = (zeroBasedQuarter % 4) + 1;
    const year = startYear + Math.floor(zeroBasedQuarter / 4);
    return { quarter, year };
  });
}

export function QuartlyCuts() {
  const { selected } = useNewsletterContext();

  const data = useMemo(() => {
    const activeTime = selected?.sortDate ?? null;
    if (activeTime === null) {
      return {
        effr: null as number | null,
        quarterRows: [] as QuarterRow[],
        total: null as number | null,
      };
    }

    const alignedEffr = getAlignedPoint(EFFR_SERIES, activeTime)?.value ?? null;
    const snapshot = getAlignedPoint(FED_SNAPSHOTS, activeTime);
    const quarterSequence = getQuarterSequence(activeTime);

    const futuresRateByMonthYear = new Map<string, number>();
    if (snapshot) {
      for (const contract of snapshot.contracts) {
        const parsed = parseZqTickerMonthYear(contract.ticker);
        if (!parsed) continue;
        futuresRateByMonthYear.set(`${parsed.month}-${parsed.year}`, 100 - contract.price);
      }
    }

    let previousRate: number | null = alignedEffr;
    let hasMissing = alignedEffr === null;

    const quarterRows: QuarterRow[] = quarterSequence.map(({ quarter, year }) => {
      const impliedMonth = MONTH_AFTER_QUARTER_CLOSE[quarter];
      const impliedYear = quarter === 4 ? year + 1 : year;
      const impliedRate = futuresRateByMonthYear.get(`${impliedMonth}-${impliedYear}`) ?? null;

      if (previousRate === null || impliedRate === null) {
        previousRate = impliedRate;
        hasMissing = true;
        return {
          label: formatQuarterLabel(quarter, year),
          cutsBps: null,
        };
      }

      // Signed change in policy rate path: cuts are negative, hikes are positive.
      const cutsBps = (impliedRate - previousRate) * 100;
      previousRate = impliedRate;
      return {
        label: formatQuarterLabel(quarter, year),
        cutsBps,
      };
    });

    const total =
      !hasMissing && quarterRows.every((row) => row.cutsBps !== null)
        ? quarterRows.reduce((sum, row) => sum + (row.cutsBps ?? 0), 0)
        : null;

    return { effr: alignedEffr, quarterRows, total };
  }, [selected]);

  return (
    <section className="quartly-cuts">
      <div className="quartly-cuts__header">
        <span className="quartly-cuts__titleBadge">CUTS</span>
      </div>
      <div className="quartly-cuts__body">
        <table className="quartly-cuts__table" aria-label="Quarterly implied cuts from EFFR and ZQ">
          <thead>
            <tr>
              <th scope="col" className="quartly-cuts__head quartly-cuts__head--label">PERIOD</th>
              <th scope="col" className="quartly-cuts__head">VALUE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="quartly-cuts__label">EFFR</th>
              <td className="quartly-cuts__value quartly-cuts__value--neutral">{formatRate(data.effr)}</td>
            </tr>
            {data.quarterRows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="quartly-cuts__label">{row.label}</th>
                <td className={`quartly-cuts__value ${toneClass(row.cutsBps)}`}>{formatBps(row.cutsBps)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="quartly-cuts__label quartly-cuts__label--total">TOTAL</th>
              <td className={`quartly-cuts__value quartly-cuts__value--total ${toneClass(data.total)}`}>
                {formatBps(data.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
