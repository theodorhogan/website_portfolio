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
import { INDUSTRIES, getIndustrySeries, type RegionKey } from "../data/equityData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS } from "../utils/dates";
import { computePercentChange, getAlignedPoint } from "../utils/timeSeries";
import { PanelShell } from "./PanelShell";
import "./SectorPerformance.css";

type SectorBarRow = {
  id: number;
  label: string;
  change: number;
};

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

/** Week-on-week % change per sector, best first. Sectors without both data points are left out. */
function buildRegionRows(activeTime: number | null, region: RegionKey) {
  if (activeTime === null) return [];

  const seriesById = getIndustrySeries();
  const rows: SectorBarRow[] = [];

  for (const industry of INDUSTRIES) {
    const series = seriesById.get(industry.id)?.[region] ?? [];
    const current = getAlignedPoint(series, activeTime)?.value ?? null;
    const prior = getAlignedPoint(series, activeTime - WEEK_MS)?.value ?? null;
    const change = computePercentChange(current, prior);
    if (change !== null) {
      rows.push({ id: industry.id, label: industry.shortLabel, change: change * 100 });
    }
  }

  return rows.sort((a, b) => b.change - a.change);
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

type SectorTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
};

/** Single-line axis label; the default tick wraps two-word sectors onto overlapping lines. */
function SectorTick({ x = 0, y = 0, payload }: SectorTickProps) {
  return (
    <text x={x} y={y} dy="0.32em" textAnchor="end" className="sector-performance__tick">
      {payload?.value}
    </text>
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
        {rows.length === 0 ? (
          <p className="sector-performance__empty">No sector data for the selected week.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 260, height: 236 }}>
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
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
                width={92}
                interval={0}
                tick={<SectorTick />}
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
        )}
      </div>
    </div>
  );
}

export function SectorPerformance() {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;

  const usRows = useMemo(() => buildRegionRows(activeTime, "us"), [activeTime]);
  const euRows = useMemo(() => buildRegionRows(activeTime, "eu"), [activeTime]);

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
