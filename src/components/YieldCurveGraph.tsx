import { useMemo } from "react";
import {
  DAY_MS,
  TREASURY_INSTRUMENT_ORDER,
  getTreasurySeries,
  resolveAlignedPointIndex,
  type TreasuryInstrumentKey,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { CurvePlot } from "./CurvePlot";
import { buildLinePath, buildYTicks, getPaddedDomain } from "./curveChartUtils";
import {
  DURATION_CHART_HEIGHT,
  DURATION_CHART_MARGIN,
  DURATION_CHART_WIDTH,
  MONTH_LABELS_SHORT,
} from "./durationChartConfig";
import "./YieldCurveGraph.css";

type YieldCurveChartData =
  | {
      hasData: false;
      activeLabel: string;
      previousLabel: string;
    }
  | {
      hasData: true;
      activeLabel: string;
      previousLabel: string;
      activePath: string;
      previousPath: string;
      activePoints: Array<{ x: number; y: number }>;
      previousPoints: Array<{ x: number; y: number }>;
      slopeGuides: Array<{
        key: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        labelX: number;
        labelY: number;
        label: string;
        tone: "positive" | "negative" | "neutral";
      }>;
      yTicks: Array<{ value: number; y: number }>;
      xTicks: Array<{ key: string; x: number; label: string }>;
      plotLeft: number;
      plotRight: number;
      plotBottom: number;
    };

const INSTRUMENT_LABELS: Record<TreasuryInstrumentKey, string> = {
  US1M: "1M",
  US2M: "2M",
  US3M: "3M",
  US4M: "4M",
  US6M: "6M",
  US1Y: "1Y",
  US2Y: "2Y",
  US3Y: "3Y",
  US5Y: "5Y",
  US7Y: "7Y",
  US10Y: "10Y",
  US20Y: "20Y",
  US30Y: "30Y",
};

const RATE_SERIES = getTreasurySeries();
const IDX_3M = TREASURY_INSTRUMENT_ORDER.indexOf("US3M");
const IDX_2Y = TREASURY_INSTRUMENT_ORDER.indexOf("US2Y");
const IDX_10Y = TREASURY_INSTRUMENT_ORDER.indexOf("US10Y");

function formatDate(time: number | null) {
  if (time === null) return "--";
  const date = new Date(time);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTH_LABELS_SHORT[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function resolveLabelTime(targetTime: number) {
  for (const ticker of TREASURY_INSTRUMENT_ORDER) {
    const series = RATE_SERIES.get(ticker) ?? [];
    const index = resolveAlignedPointIndex(series, targetTime);
    if (index >= 0) return series[index].time;
  }
  return null;
}

function getSlopeTone(value: number) {
  if (Math.abs(value) < 0.00005) return "neutral" as const;
  return value > 0 ? "positive" : "negative";
}

function formatSlopeLabel(shortLabel: string, slope: number) {
  const bps = Math.round(slope * 100);
  return `${shortLabel}/10Y ${bps}bp`;
}

export function YieldCurveGraph() {
  const { selected } = useNewsletterContext();

  const chartData = useMemo<YieldCurveChartData>(() => {
    const activeTime = selected?.sortDate ?? null;
    if (activeTime === null) {
      return {
        hasData: false,
        activeLabel: "--",
        previousLabel: "--",
      };
    }

    const previousTime = activeTime - 7 * DAY_MS;

    const activeValues = TREASURY_INSTRUMENT_ORDER.map((ticker) => {
      const series = RATE_SERIES.get(ticker) ?? [];
      const index = resolveAlignedPointIndex(series, activeTime);
      return index >= 0 ? series[index].value : null;
    });
    const previousValues = TREASURY_INSTRUMENT_ORDER.map((ticker) => {
      const series = RATE_SERIES.get(ticker) ?? [];
      const index = resolveAlignedPointIndex(series, previousTime);
      return index >= 0 ? series[index].value : null;
    });
    const valuePool = [...activeValues, ...previousValues].filter((value): value is number => value !== null);

    const activeLabelTime = resolveLabelTime(activeTime);
    const previousLabelTime = resolveLabelTime(previousTime);

    if (valuePool.length === 0) {
      return {
        hasData: false,
        activeLabel: formatDate(activeLabelTime ?? activeTime),
        previousLabel: formatDate(previousLabelTime ?? previousTime),
      };
    }

    const domain = getPaddedDomain(valuePool);
    const plotLeft = DURATION_CHART_MARGIN.left;
    const plotRight = DURATION_CHART_WIDTH - DURATION_CHART_MARGIN.right;
    const plotTop = DURATION_CHART_MARGIN.top;
    const plotBottom = DURATION_CHART_HEIGHT - DURATION_CHART_MARGIN.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const xForIndex = (index: number) =>
      plotLeft + (index / Math.max(TREASURY_INSTRUMENT_ORDER.length - 1, 1)) * plotWidth;
    const yForValue = (value: number) =>
      plotBottom - ((value - domain.min) / Math.max(domain.max - domain.min, 0.0001)) * plotHeight;

    const activePath = buildLinePath(activeValues, xForIndex, yForValue);
    const previousPath = buildLinePath(previousValues, xForIndex, yForValue);
    const activePoints = activeValues
      .map((value, index) => (value === null ? null : { x: xForIndex(index), y: yForValue(value) }))
      .filter((point): point is { x: number; y: number } => point !== null);

    const slopeGuides: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      labelX: number;
      labelY: number;
      label: string;
      tone: "positive" | "negative" | "neutral";
    }> = [];
    const tenYearValue = activeValues[IDX_10Y];
    const tenYearPoint = tenYearValue === null ? null : { x: xForIndex(IDX_10Y), y: yForValue(tenYearValue) };

    if (tenYearPoint && tenYearValue !== null) {
      const threeMonthValue = activeValues[IDX_3M];
      if (threeMonthValue !== null) {
        const slope = tenYearValue - threeMonthValue;
        const fromPoint = { x: xForIndex(IDX_3M), y: yForValue(threeMonthValue) };
        slopeGuides.push({
          key: "3m10y",
          x1: fromPoint.x,
          y1: fromPoint.y,
          x2: tenYearPoint.x,
          y2: tenYearPoint.y,
          labelX: (fromPoint.x + tenYearPoint.x) / 2,
          labelY: Math.min(fromPoint.y, tenYearPoint.y) - 10,
          label: formatSlopeLabel("3M", slope),
          tone: getSlopeTone(slope),
        });
      }

      const twoYearValue = activeValues[IDX_2Y];
      if (twoYearValue !== null) {
        const slope = tenYearValue - twoYearValue;
        const fromPoint = { x: xForIndex(IDX_2Y), y: yForValue(twoYearValue) };
        slopeGuides.push({
          key: "2y10y",
          x1: fromPoint.x,
          y1: fromPoint.y,
          x2: tenYearPoint.x,
          y2: tenYearPoint.y,
          labelX: (fromPoint.x + tenYearPoint.x) / 2,
          labelY: Math.max(fromPoint.y, tenYearPoint.y) + 14,
          label: formatSlopeLabel("2Y", slope),
          tone: getSlopeTone(slope),
        });
      }
    }
    const previousPoints = previousValues
      .map((value, index) => (value === null ? null : { x: xForIndex(index), y: yForValue(value) }))
      .filter((point): point is { x: number; y: number } => point !== null);

    const yTicks = buildYTicks(domain.min, domain.max, plotTop, plotHeight, 5);
    const xTicks = TREASURY_INSTRUMENT_ORDER.map((ticker, index) => ({
      key: ticker,
      x: xForIndex(index),
      label: INSTRUMENT_LABELS[ticker],
    }));

    return {
      hasData: true,
      activeLabel: formatDate(activeLabelTime ?? activeTime),
      previousLabel: formatDate(previousLabelTime ?? previousTime),
      activePath,
      previousPath,
      activePoints,
      previousPoints,
      slopeGuides,
      yTicks,
      xTicks,
      plotLeft,
      plotRight,
      plotBottom,
    };
  }, [selected]);

  return (
    <section className="yield-curve">
      <div className="yield-curve__header">
        <span className="yield-curve__titleBadge">Yield Curve</span>
        <div className="yield-curve__legend">
          <span className="yield-curve__legendItem">
            <span className="yield-curve__legendDot yield-curve__legendDot--active" />
            Active ({chartData.activeLabel})
          </span>
          <span className="yield-curve__legendItem">
            <span className="yield-curve__legendDot yield-curve__legendDot--previous" />
            Last Week ({chartData.previousLabel})
          </span>
        </div>
      </div>
      <div className="yield-curve__body">
        {chartData.hasData ? (
          <CurvePlot
            ariaLabel="Yield curve comparison"
            className="yield-curve__svg"
            width={DURATION_CHART_WIDTH}
            height={DURATION_CHART_HEIGHT}
            plotLeft={chartData.plotLeft}
            plotRight={chartData.plotRight}
            plotBottom={chartData.plotBottom}
            yTicks={chartData.yTicks.map((tick, index) => ({
              key: `y-${index}`,
              y: tick.y,
              rightLabel: tick.value.toFixed(2),
            }))}
            xTicks={chartData.xTicks}
            series={[
              {
                key: "previous",
                path: chartData.previousPath,
                pathClassName: "yield-curve__path yield-curve__path--previous",
                points: chartData.previousPoints.map((point, index) => ({
                  x: point.x,
                  y: point.y,
                  r: 2.2,
                  className: "yield-curve__point yield-curve__point--previous",
                  key: `previous-${index}`,
                })),
              },
              {
                key: "active",
                path: chartData.activePath,
                pathClassName: "yield-curve__path yield-curve__path--active",
                points: chartData.activePoints.map((point, index) => ({
                  x: point.x,
                  y: point.y,
                  r: 2.8,
                  className: "yield-curve__point yield-curve__point--active",
                  key: `active-${index}`,
                })),
              },
            ]}
            overlay={chartData.slopeGuides.map((guide) => (
              <g key={guide.key}>
                {guide.key === "3m10y" ? (
                  <>
                    <line
                      x1={guide.x1}
                      y1={guide.y2}
                      x2={guide.x2}
                      y2={guide.y2}
                      className={`yield-curve__slopeGuideLine yield-curve__slopeGuideLine--${guide.tone}`}
                    />
                    <line
                      x1={guide.x1}
                      y1={guide.y1}
                      x2={guide.x1}
                      y2={guide.y2}
                      className={`yield-curve__slopeGuideLine yield-curve__slopeGuideLine--${guide.tone}`}
                    />
                  </>
                ) : (
                  <>
                    <line
                      x1={guide.x1}
                      y1={guide.y1}
                      x2={guide.x2}
                      y2={guide.y1}
                      className={`yield-curve__slopeGuideLine yield-curve__slopeGuideLine--${guide.tone}`}
                    />
                    <line
                      x1={guide.x2}
                      y1={guide.y1}
                      x2={guide.x2}
                      y2={guide.y2}
                      className={`yield-curve__slopeGuideLine yield-curve__slopeGuideLine--${guide.tone}`}
                    />
                  </>
                )}
                <text
                  x={guide.labelX}
                  y={guide.labelY}
                  textAnchor="middle"
                  className={`yield-curve__slopeLabel yield-curve__slopeLabel--${guide.tone}`}
                >
                  {guide.label}
                </text>
              </g>
            ))}
            gridLineClassName="yield-curve__gridLine"
            axisLineClassName="yield-curve__axisLine"
            leftTickClassName="yield-curve__yTick"
            rightTickClassName="yield-curve__yTick"
            xTickClassName="yield-curve__xTick"
          />
        ) : (
          <div className="yield-curve__empty">No aligned Treasury data for the selected week.</div>
        )}
      </div>
    </section>
  );
}
