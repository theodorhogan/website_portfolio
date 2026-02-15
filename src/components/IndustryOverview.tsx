import { useMemo } from "react";
import equityDataCsv from "../content/pricedatabase/equitydata.csv?raw";
import { useNewsletterContext } from "../state/NewsletterContext";
import "./IndustryOverview.css";

type PricePoint = {
  time: number;
  price: number;
};

type RegionKey = "us" | "eu";

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

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

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

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toExcelUtcTime(serial: number) {
  return EXCEL_EPOCH_UTC + Math.round(serial) * DAY_MS;
}

function getIsoWeekKeyFromTime(time: number) {
  const date = new Date(time);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${target.getUTCFullYear()}-${weekNumber}`;
}

function classifyRegion(ticker: string): RegionKey | null {
  const upper = ticker.trim().toUpperCase();
  if (upper.startsWith("XL")) return "us";
  if (upper.startsWith("EX")) return "eu";
  return null;
}

function getActiveIndex(series: PricePoint[], activeTime: number) {
  const activeWeekKey = getIsoWeekKeyFromTime(activeTime);

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (getIsoWeekKeyFromTime(series[i].time) === activeWeekKey) {
      return i;
    }
  }

  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].time <= activeTime) {
      return i;
    }
  }

  return -1;
}

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

function parseIndustrySeries(rawCsv: string) {
  const buckets = new Map<number, Map<RegionKey, Map<number, number>>>();

  for (const line of rawCsv.trim().split(/\r?\n/)) {
    const parts = line.split(",");
    if (parts.length < 6) continue;

    const excelDate = Number(parts[0]);
    const ticker = (parts[2] ?? "").trim();
    const category = (parts[3] ?? "").trim().toLowerCase();
    const price = Number(parts[4]);
    const industryTag = Number(parts[5]);
    const region = classifyRegion(ticker);

    if (
      category !== "einx" ||
      !region ||
      !Number.isFinite(excelDate) ||
      !Number.isFinite(price) ||
      !Number.isInteger(industryTag) ||
      industryTag < 1 ||
      industryTag > 11
    ) {
      continue;
    }

    const time = toExcelUtcTime(excelDate);
    const byRegion = buckets.get(industryTag) ?? new Map<RegionKey, Map<number, number>>();
    const seriesMap = byRegion.get(region) ?? new Map<number, number>();
    seriesMap.set(time, price);
    byRegion.set(region, seriesMap);
    buckets.set(industryTag, byRegion);
  }

  const seriesByIndustry = new Map<number, Record<RegionKey, PricePoint[]>>();

  for (const industry of INDUSTRIES) {
    const byRegion = buckets.get(industry.id);
    const usSeries = [...(byRegion?.get("us")?.entries() ?? [])]
      .sort((a, b) => a[0] - b[0])
      .map(([time, price]) => ({ time, price }));
    const euSeries = [...(byRegion?.get("eu")?.entries() ?? [])]
      .sort((a, b) => a[0] - b[0])
      .map(([time, price]) => ({ time, price }));

    seriesByIndustry.set(industry.id, { us: usSeries, eu: euSeries });
  }

  return seriesByIndustry;
}

const INDUSTRY_SERIES = parseIndustrySeries(equityDataCsv);

function computeRegionMetrics(series: PricePoint[], activeTime: number) {
  const activeIndex = getActiveIndex(series, activeTime);
  if (activeIndex < 0) {
    return {
      priceText: "--",
      weekChangeText: "--",
      weekChangeClassName: "industry-overview__change industry-overview__change--neutral",
      lastWeekChangeText: "--",
      lastWeekChangeClassName: "industry-overview__change industry-overview__change--neutral",
    };
  }

  const current = series[activeIndex];
  const previous = series[activeIndex - 1] ?? null;
  const twoBack = series[activeIndex - 2] ?? null;

  const weekChange = previous && previous.price !== 0 ? current.price / previous.price - 1 : null;
  const lastWeekChange =
    previous && twoBack && twoBack.price !== 0 ? previous.price / twoBack.price - 1 : null;

  return {
    priceText: formatPrice(current.price),
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
