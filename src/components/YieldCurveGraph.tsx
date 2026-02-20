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
              },
              {
                key: "active",
                path: chartData.activePath,
                pathClassName: "yield-curve__path yield-curve__path--active",
              },
            ]}
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
