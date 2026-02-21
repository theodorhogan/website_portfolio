import type { ReactNode } from "react";

type CurvePlotPoint = {
  x: number;
  y: number;
  r?: number;
  className: string;
  key?: string;
};

type CurvePlotSeries = {
  key: string;
  path?: string;
  pathClassName: string;
  points?: CurvePlotPoint[];
};

type CurvePlotYTick = {
  key: string;
  y: number;
  leftLabel?: string;
  rightLabel?: string;
};

type CurvePlotXTick = {
  key: string;
  x: number;
  label: string;
};

type CurvePlotProps = {
  ariaLabel: string;
  className: string;
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotBottom: number;
  yTicks: CurvePlotYTick[];
  xTicks: CurvePlotXTick[];
  series: CurvePlotSeries[];
  gridLineClassName: string;
  axisLineClassName: string;
  leftTickClassName: string;
  rightTickClassName?: string;
  xTickClassName: string;
  overlay?: ReactNode;
};

export function CurvePlot({
  ariaLabel,
  className,
  width,
  height,
  plotLeft,
  plotRight,
  plotBottom,
  yTicks,
  xTicks,
  series,
  gridLineClassName,
  axisLineClassName,
  leftTickClassName,
  rightTickClassName,
  xTickClassName,
  overlay,
}: CurvePlotProps) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
    >
      {yTicks.map((tick) => (
        <g key={tick.key}>
          <line x1={plotLeft} x2={plotRight} y1={tick.y} y2={tick.y} className={gridLineClassName} />
          {tick.leftLabel ? (
            <text x={plotLeft - 8} y={tick.y + 4} textAnchor="end" className={leftTickClassName}>
              {tick.leftLabel}
            </text>
          ) : null}
          {tick.rightLabel ? (
            <text x={plotRight + 8} y={tick.y + 4} className={rightTickClassName ?? leftTickClassName}>
              {tick.rightLabel}
            </text>
          ) : null}
        </g>
      ))}

      <line
        x1={plotLeft}
        x2={plotRight}
        y1={plotBottom}
        y2={plotBottom}
        className={axisLineClassName}
      />

      {series.map((item) => (
        <g key={item.key}>
          {item.path ? <path d={item.path} className={item.pathClassName} /> : null}
          {item.points?.map((point) => (
            <circle
              key={point.key ?? `${item.key}-${point.x}-${point.y}`}
              cx={point.x}
              cy={point.y}
              r={point.r ?? 3.2}
              className={point.className}
            />
          ))}
        </g>
      ))}

      {overlay}

      {xTicks.map((tick) => (
        <text key={tick.key} x={tick.x} y={height - 12} textAnchor="middle" className={xTickClassName}>
          {tick.label}
        </text>
      ))}
    </svg>
  );
}
