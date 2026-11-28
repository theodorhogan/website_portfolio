import "./EconLineChart.css";

type EconLineChartProps = {
  ariaLabel: string;
  /** Sets the chart's height. */
  className: string;
  /** In data units, ascending by `x`. */
  points: Array<{ x: number; y: number }>;
  /** The x range drawn. A step line runs on to its end. */
  xDomain: [number, number];
  xTicks: Array<{ x: number; label: string }>;
  /** Hold each value until the next point instead of joining the points. */
  step?: boolean;
};

const MAX_GRID_LINES = 5;

/**
 * The value range drawn, a little wider than the data, and the round-number grid lines inside it:
 * the smallest 1-2-5 step that needs at most `MAX_GRID_LINES` lines.
 */
function buildYAxis(values: number[]) {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  // A flat series still gets a band to sit in.
  const pad = dataMax > dataMin ? (dataMax - dataMin) * 0.08 : Math.max(Math.abs(dataMin) * 0.05, 0.05);
  const min = dataMin - pad;
  const max = dataMax + pad;
  const magnitude = 10 ** Math.floor(Math.log10((max - min) / MAX_GRID_LINES));

  for (const multiple of [1, 2, 5, 10, 20, 50]) {
    const step = multiple * magnitude;
    const first = Math.ceil(min / step);
    const last = Math.floor(max / step);
    if (last - first < MAX_GRID_LINES) {
      const ticks = Array.from({ length: last - first + 1 }, (_, index) => (first + index) * step);
      return { min, max, ticks, decimals: Math.max(0, -Math.floor(Math.log10(step))) };
    }
  }

  return { min, max, ticks: [], decimals: 0 };
}

/**
 * A small line chart that stretches to any box: the line is drawn in a 100 x 100
 * space with strokes that do not scale, and the axis labels are plain text around it.
 */
export function EconLineChart({ ariaLabel, className, points, xDomain, xTicks, step = false }: EconLineChartProps) {
  if (points.length === 0) return null;

  const yAxis = buildYAxis(points.map((point) => point.y));
  const [xMin, xMax] = xDomain;
  const toX = (x: number) => (((x - xMin) / Math.max(xMax - xMin, 1)) * 100).toFixed(2);
  const toY = (y: number) => (((yAxis.max - y) / (yAxis.max - yAxis.min)) * 100).toFixed(2);

  const segments = points.map((point, index) => {
    if (index === 0) return `M ${toX(point.x)} ${toY(point.y)}`;
    return step ? `H ${toX(point.x)} V ${toY(point.y)}` : `L ${toX(point.x)} ${toY(point.y)}`;
  });
  if (step) segments.push(`H ${toX(xMax)}`);

  return (
    <div className={`econ-line-chart ${className}`}>
      <div className="econ-line-chart__yAxis" aria-hidden="true">
        {yAxis.ticks.map((value) => (
          <span key={value} className="econ-line-chart__yTick" style={{ top: `${toY(value)}%` }}>
            {value.toFixed(yAxis.decimals)}
          </span>
        ))}
      </div>
      <div className="econ-line-chart__plot">
        <svg
          className="econ-line-chart__svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={ariaLabel}
        >
          {yAxis.ticks.map((value) => (
            <line key={value} x1={0} x2={100} y1={toY(value)} y2={toY(value)} className="econ-line-chart__gridLine" />
          ))}
          <line x1={0} x2={100} y1={100} y2={100} className="econ-line-chart__axisLine" />
          <path d={segments.join(" ")} className="econ-line-chart__path" />
        </svg>
      </div>
      <div className="econ-line-chart__xAxis" aria-hidden="true">
        {xTicks.map((tick) => (
          <span key={tick.x} className="econ-line-chart__xTick" style={{ left: `${toX(tick.x)}%` }}>
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}
