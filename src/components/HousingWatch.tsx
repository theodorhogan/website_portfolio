import { useMemo } from "react";
import { lazy } from "../data/csvStore";
import { formatEconValue, getEconIndicator, getEconReadings, type EconReading } from "../data/econData";
import { getSeries, getTreasurySeries, type PricePoint } from "../data/ratesData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { formatPercentChange, getChangeTone, getInverseChangeTone } from "../utils/format";
import { computePercentChange, getAlignedPoint } from "../utils/timeSeries";
import { CompactMetricsTable, type CompactMetricsRow } from "./CompactMetricsTable";
import { formatFigure, formatFigureChange, getWeekFigures, type CycleSeriesRow } from "./cycleWindow";
import { PanelShell } from "./PanelShell";
import "./HousingWatch.css";

const RATE_DECIMALS = 2;

/** Thirteen months reach from the latest one back to the same month a year earlier. */
const MONTHLY_READING_COUNT = 13;

const MONTHLY_INDICATORS = [
  { key: "housing_starts", label: "STARTS" },
  { key: "building_permits", label: "PERMITS" },
  { key: "new_home_sales", label: "NEW HOME SALES" },
] as const;

const getMortgageRows = lazy((): CycleSeriesRow[] => {
  const mortgage30 = getSeries("MORTGAGE_30Y");
  const treasury10 = getTreasurySeries().get("US10Y") ?? [];

  // The survey is weekly and the Treasury curve daily: each survey date takes that day's 10-year yield, or the last one before it.
  const spread: PricePoint[] = [];
  for (const point of mortgage30) {
    const treasury = getAlignedPoint(treasury10, point.time);
    if (treasury) spread.push({ time: point.time, value: point.value - treasury.value });
  }

  return [
    { label: "30Y FIXED", series: mortgage30 },
    { label: "15Y FIXED", series: getSeries("MORTGAGE_15Y") },
    { label: "30Y - UST 10Y", series: spread },
  ];
});

function buildMortgageRow({ label, series }: CycleSeriesRow, activeTime: number | null): CompactMetricsRow {
  const figures = activeTime !== null ? getWeekFigures(series, activeTime, RATE_DECIMALS) : null;
  const weekChange = figures?.weekChange ?? null;
  const ytdChange = figures?.ytdChange ?? null;

  return {
    key: label,
    label,
    cells: [
      { content: formatFigure(figures?.current ?? null, RATE_DECIMALS) },
      { content: formatFigure(figures?.lastWeek ?? null, RATE_DECIMALS, "", true) },
      { content: formatFigureChange(weekChange, RATE_DECIMALS), tone: getInverseChangeTone(weekChange) },
      { content: formatFigureChange(ytdChange, RATE_DECIMALS), tone: getInverseChangeTone(ytdChange) },
    ],
  };
}

/** The reading for the month `months` away from `reading`, so a missing month is never mistaken for its neighbour. */
function findReading(readings: readonly EconReading[], reading: EconReading, months: number) {
  const date = new Date(reading.periodTime);
  const periodTime = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
  return readings.find((candidate) => candidate.periodTime === periodTime) ?? null;
}

function buildMonthlyRow(
  { key, label }: (typeof MONTHLY_INDICATORS)[number],
  activeTime: number | null,
): CompactMetricsRow {
  const indicator = getEconIndicator(key);
  const readings =
    indicator && activeTime !== null ? getEconReadings(indicator, activeTime, MONTHLY_READING_COUNT) : [];
  const latest = readings.at(-1) ?? null;
  const prior = latest ? findReading(readings, latest, -1) : null;
  const yearAgo = latest ? findReading(readings, latest, -12) : null;
  const yearChange = computePercentChange(latest?.value ?? null, yearAgo?.value ?? null);
  const formatValue = (reading: EconReading | null) =>
    indicator && reading ? formatEconValue(indicator, reading.value) : "--";

  return {
    key,
    label,
    cells: [
      { content: latest?.label ?? "--" },
      { content: formatValue(latest) },
      { content: formatValue(prior) },
      { content: formatPercentChange(yearChange), tone: getChangeTone(yearChange) },
    ],
  };
}

export function HousingWatch() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const tables = useMemo(
    () => ({
      mortgage: getMortgageRows().map((row) => buildMortgageRow(row, activeTime)),
      monthly: MONTHLY_INDICATORS.map((indicator) => buildMonthlyRow(indicator, activeTime)),
    }),
    [activeTime],
  );

  return (
    <PanelShell className="housing-watch" variant="standard" bodyMode="scroll" badge="HOUSING WATCH">
      <CompactMetricsTable
        ariaLabel="Mortgage rates"
        rowHeaderLabel="MORTGAGE"
        columns={[
          { key: "this-week", label: "THIS WK", align: "right" },
          { key: "last-week", label: "LAST WK", align: "right" },
          { key: "change", label: "CHANGE", align: "right" },
          { key: "ytd", label: "YTD", align: "right" },
        ]}
        rows={tables.mortgage}
        tableClassName="housing-watch__table"
      />
      <CompactMetricsTable
        ariaLabel="Monthly housing starts, permits and new home sales"
        rowHeaderLabel="MONTHLY"
        columns={[
          { key: "month", label: "MONTH", align: "right" },
          { key: "latest", label: "LATEST", align: "right" },
          { key: "prior", label: "PRIOR", align: "right" },
          { key: "yoy", label: "YOY %", align: "right" },
        ]}
        rows={tables.monthly}
        tableClassName="housing-watch__table housing-watch__table--monthly"
      />
    </PanelShell>
  );
}
