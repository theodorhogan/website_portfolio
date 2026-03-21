import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DAY_MS,
  computePercentChange,
  getAlignedPoint,
  getIndustrySeries,
  type RegionKey,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { PanelShell } from "./PanelShell";
import "./SectorPerformance.css";

type SectorBarRow = {
  id: number;
  label: string;
  change: number;
};

const INDUSTRIES = [
  { id: 1, label: "Info Tech" },
  { id: 2, label: "Financials" },
  { id: 3, label: "Healthcare" },
  { id: 4, label: "Cons. Disc." },
  { id: 5, label: "Communication" },
  { id: 6, label: "Industrials" },
  { id: 7, label: "Cons. Staples" },
  { id: 8, label: "Energy" },
  { id: 9, label: "Materials" },
  { id: 10, label: "Utilities" },
  { id: 11, label: "Real Estate" },
] as const;

const INDUSTRY_SERIES = getIndustrySeries();

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function buildRegionRows(activeTime: number | null, region: RegionKey) {
  if (activeTime === null) return [] as SectorBarRow[];

  return INDUSTRIES.map((industry) => {
    const series = INDUSTRY_SERIES.get(industry.id)?.[region] ?? [];
    const current = getAlignedPoint(series, activeTime);
    const prior = getAlignedPoint(series, activeTime - 7 * DAY_MS);
    const change = computePercentChange(current?.value ?? null, prior?.value ?? null);
    return {
      id: industry.id,
      label: industry.label,
      change: change === null ? 0 : change * 100,
    };
  }).sort((a, b) => b.change - a.change);
}

type SectorTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number; payload: SectorBarRow }>;
};

function SectorTooltip({ active, payload }: SectorTooltipProps) {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;

  return (
    <div className="sector-performance__tooltip">
      <div className="sector-performance__tooltipLabel">{point.label}</div>
      <div className={point.change >= 0 ? "sector-performance__tooltipValue is-positive" : "sector-performance__tooltipValue is-negative"}>
        {formatPercent(point.change)}
      </div>
    </div>
  );
}

type RegionChartProps = {
  title: string;
  rows: SectorBarRow[];
};

function RegionChart({ title, rows }: RegionChartProps) {
  return (
    <div className="sector-performance__region">
      <div className="sector-performance__regionTitle">{title}</div>
      <div className="sector-performance__chartFrame">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              tick={{ fontSize: 9, fill: "#6c8099", fontFamily: "var(--terminal-font)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={88}
              interval={0}
              tick={{ fontSize: 9, fill: "#9fb0c6", fontFamily: "var(--terminal-font)" }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke="rgba(76, 200, 243, 0.25)" />
            <Tooltip cursor={false} content={<SectorTooltip />} />
            <Bar dataKey="change" radius={[0, 2, 2, 0]}>
              {rows.map((row) => (
                <Cell key={row.id} fill={row.change >= 0 ? "#45d975" : "#f43f5e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SectorPerformance() {
  const { selected } = useNewsletterContext();

  const usRows = useMemo(() => buildRegionRows(selected?.sortDate ?? null, "us"), [selected]);
  const euRows = useMemo(() => buildRegionRows(selected?.sortDate ?? null, "eu"), [selected]);

  return (
    <PanelShell
      className="sector-performance h-full min-h-0"
      variant="split"
      bodyMode="stretch"
      badge="SECTOR ROTATION"
      title="Week on Week"
      bodyClassName="sector-performance__body"
    >
      <RegionChart title="US Sectors" rows={usRows} />
      <RegionChart title="EU Sectors" rows={euRows} />
    </PanelShell>
  );
}
