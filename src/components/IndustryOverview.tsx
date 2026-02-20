import { useMemo } from "react";
import {
  DAY_MS,
  computePercentChange,
  getAlignedPoint,
  getIndustrySeries,
  type PricePoint,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import "./IndustryOverview.css";

type IndustryRow = {
  id: number;
  label: string;
  usPriceText: string;
  usWeekChangeText: string;
  usWeekChangeClassName: string;
  usLastWeekChangeText: string;
  usLastWeekChangeClassName: string;
  euPriceText: string;
  euWeekChangeText: string;
  euWeekChangeClassName: string;
  euLastWeekChangeText: string;
  euLastWeekChangeClassName: string;
};

type RegionMetrics = {
  priceText: string;
  weekChangeText: string;
  weekChangeClassName: string;
  lastWeekChangeText: string;
  lastWeekChangeClassName: string;
};

const INDUSTRIES = [
  { id: 1, label: "Information Tech" },
  { id: 2, label: "Financials" },
  { id: 3, label: "Healthcare" },
  { id: 4, label: "Consumer Disc." },
  { id: 5, label: "Communication" },
  { id: 6, label: "Industrials" },
  { id: 7, label: "Consumer Staples" },
  { id: 8, label: "Energy" },
  { id: 9, label: "Materials" },
  { id: 10, label: "Utilities" },
  { id: 11, label: "Real Estate" },
] as const;

const INDUSTRY_SERIES = getIndustrySeries();

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getChangeClassName(change: number | null) {
  if (change === null || Math.abs(change) < 0.00005) {
    return "industry-overview__change industry-overview__change--neutral";
  }
  if (change > 0) {
    return "industry-overview__change industry-overview__change--positive";
  }
  return "industry-overview__change industry-overview__change--negative";
}

function formatPercent(change: number | null, bracketed: boolean) {
  if (change === null || Math.abs(change) < 0.00005) {
    return bracketed ? "[0.00%]" : "0.00%";
  }

  const sign = change > 0 ? "+" : "";
  const base = `${sign}${(change * 100).toFixed(2)}%`;
  return bracketed ? `[${base}]` : base;
}

function formatPrice(price: number | null) {
  if (price === null) return "--";
  return priceFormatter.format(price);
}

function computeRegionMetrics(series: PricePoint[], activeTime: number): RegionMetrics {
  const current = getAlignedPoint(series, activeTime);
  const lastWeek = getAlignedPoint(series, activeTime - 7 * DAY_MS);
  const twoWeeks = getAlignedPoint(series, activeTime - 14 * DAY_MS);

  if (!current) {
    return {
      priceText: "--",
      weekChangeText: "--",
      weekChangeClassName: "industry-overview__change industry-overview__change--neutral",
      lastWeekChangeText: "--",
      lastWeekChangeClassName: "industry-overview__change industry-overview__change--neutral",
    };
  }

  const weekChange = computePercentChange(current.value, lastWeek?.value ?? null);
  const lastWeekChange = computePercentChange(lastWeek?.value ?? null, twoWeeks?.value ?? null);

  return {
    priceText: formatPrice(current.value),
    weekChangeText: formatPercent(weekChange, false),
    weekChangeClassName: getChangeClassName(weekChange),
    lastWeekChangeText: formatPercent(lastWeekChange, true),
    lastWeekChangeClassName: getChangeClassName(lastWeekChange),
  };
}

export function IndustryOverview() {
  const { selected } = useNewsletterContext();

  const rows = useMemo<IndustryRow[]>(() => {
    const activeTime = selected?.sortDate ?? null;

    return INDUSTRIES.map((industry) => {
      const series = INDUSTRY_SERIES.get(industry.id) ?? { us: [], eu: [] };

      if (activeTime === null) {
        return {
          id: industry.id,
          label: industry.label,
          usPriceText: "--",
          usWeekChangeText: "--",
          usWeekChangeClassName: "industry-overview__change industry-overview__change--neutral",
          usLastWeekChangeText: "--",
          usLastWeekChangeClassName: "industry-overview__change industry-overview__change--neutral",
          euPriceText: "--",
          euWeekChangeText: "--",
          euWeekChangeClassName: "industry-overview__change industry-overview__change--neutral",
          euLastWeekChangeText: "--",
          euLastWeekChangeClassName: "industry-overview__change industry-overview__change--neutral",
        };
      }

      const us = computeRegionMetrics(series.us, activeTime);
      const eu = computeRegionMetrics(series.eu, activeTime);

      return {
        id: industry.id,
        label: industry.label,
        usPriceText: us.priceText,
        usWeekChangeText: us.weekChangeText,
        usWeekChangeClassName: us.weekChangeClassName,
        usLastWeekChangeText: us.lastWeekChangeText,
        usLastWeekChangeClassName: us.lastWeekChangeClassName,
        euPriceText: eu.priceText,
        euWeekChangeText: eu.weekChangeText,
        euWeekChangeClassName: eu.weekChangeClassName,
        euLastWeekChangeText: eu.lastWeekChangeText,
        euLastWeekChangeClassName: eu.lastWeekChangeClassName,
      };
    });
  }, [selected]);

  return (
    <section className="industry-overview">
      <div className="industry-overview__header">
        <span className="industry-overview__titleBadge">INDUSTRY</span>
      </div>
      <div className="industry-overview__body">
        <table className="industry-overview__table" aria-label="Industry overview US versus EU">
          <colgroup>
            <col className="industry-overview__colIndustry" />
            <col className="industry-overview__colPrice" />
            <col className="industry-overview__colChange" />
            <col className="industry-overview__colLastWeek" />
            <col className="industry-overview__colPrice" />
            <col className="industry-overview__colChange" />
            <col className="industry-overview__colLastWeek" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="industry-overview__headSpacer" aria-label="Industry" />
              <th scope="colgroup" colSpan={3} className="industry-overview__headRegion industry-overview__headRegionUs">US</th>
              <th scope="colgroup" colSpan={3} className="industry-overview__headRegion industry-overview__headRegionDivider">
                EU
              </th>
            </tr>
            <tr>
              <th scope="col" className="industry-overview__headSpacer" aria-label="Industry name" />
              <th scope="col" className="industry-overview__headNumber">Price</th>
              <th scope="col" className="industry-overview__headNumber">% CHANGE</th>
              <th scope="col" className="industry-overview__headNumber industry-overview__cellBeforeDivider">[% last wk]</th>
              <th scope="col" className="industry-overview__headNumber industry-overview__cellDivider">Price</th>
              <th scope="col" className="industry-overview__headNumber">% CHANGE</th>
              <th scope="col" className="industry-overview__headNumber">[% last wk]</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="industry-overview__industry">{row.label}</td>
                <td className="industry-overview__number">{row.usPriceText}</td>
                <td className={row.usWeekChangeClassName}>{row.usWeekChangeText}</td>
                <td className={`${row.usLastWeekChangeClassName} industry-overview__cellBeforeDivider`}>{row.usLastWeekChangeText}</td>
                <td className="industry-overview__number industry-overview__cellDivider">{row.euPriceText}</td>
                <td className={row.euWeekChangeClassName}>{row.euWeekChangeText}</td>
                <td className={row.euLastWeekChangeClassName}>{row.euLastWeekChangeText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
