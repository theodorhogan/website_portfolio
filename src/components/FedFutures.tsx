import { useMemo } from "react";
import {
  getFedFuturesSnapshots,
  resolveAlignedPointIndex,
  type FedFutureSnapshot,
} from "../data/marketData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { CurvePlot } from "./CurvePlot";
import { buildLinePath, buildYTicks, getPaddedDomain } from "./curveChartUtils";
import {
  DURATION_CHART_HEIGHT,
  DURATION_CHART_MARGIN_DUAL_AXIS,
  DURATION_CHART_WIDTH,
  MONTH_LABELS_SHORT,
} from "./durationChartConfig";
import "./FedFutures.css";

type FedFuturesChartData =
  | {
      hasData: false;
      activeLabel: string;
    }
  | {
      hasData: true;
      activeLabel: string;
      path: string;
      points: Array<{ x: number; y: number; ticker: string }>;
      yTicks: Array<{ value: number; y: number }>;
      xTicks: Array<{ key: string; x: number; label: string }>;
      plotLeft: number;
      plotRight: number;
      plotBottom: number;
    };

const FED_FUTURES_SNAPSHOTS = getFedFuturesSnapshots();

function formatTickerLabel(ticker: string) {
  const parts = ticker.trim().split(/\s+/);
  if (parts.length === 0) return ticker;

  const month = (parts[0] ?? "").slice(0, 3).toUpperCase();
  const code = parts[1] ?? "";
  const yearMatch = code.match(/(\d{2})$/);
  const year = yearMatch ? yearMatch[1] : "";
  return year ? `${month}-${year}` : month;
}

function formatDate(time: number | null) {
  if (time === null) return "--";
  const date = new Date(time);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTH_LABELS_SHORT[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function resolveSnapshot(snapshots: FedFutureSnapshot[], targetTime: number) {
  const index = resolveAlignedPointIndex(snapshots, targetTime);
  return index >= 0 ? snapshots[index] : null;
}

export function FedFutures() {
  const { selected } = useNewsletterContext();

  const chartData = useMemo<FedFuturesChartData>(() => {
    const activeTime = selected?.sortDate ?? null;
    if (activeTime === null) {
      return {
        hasData: false,
        activeLabel: "--",
      };
    }

    const snapshot = resolveSnapshot(FED_FUTURES_SNAPSHOTS, activeTime);
    if (!snapshot) {
      return {
        hasData: false,
        activeLabel: formatDate(activeTime),
      };
    }

    const contractsBySequence = new Map(snapshot.contracts.map((contract) => [contract.sequence, contract]));
    const orderedContracts = Array.from({ length: 12 }, (_, idx) => contractsBySequence.get(idx + 1) ?? null);
    const priceValues = orderedContracts
      .map((contract) => (contract ? contract.price : null))
      .filter((value): value is number => value !== null);

    if (priceValues.length === 0) {
      return {
        hasData: false,
        activeLabel: formatDate(snapshot.time),
      };
    }

    const domain = getPaddedDomain(priceValues);
    const plotLeft = DURATION_CHART_MARGIN_DUAL_AXIS.left;
    const plotRight = DURATION_CHART_WIDTH - DURATION_CHART_MARGIN_DUAL_AXIS.right;
    const plotTop = DURATION_CHART_MARGIN_DUAL_AXIS.top;
    const plotBottom = DURATION_CHART_HEIGHT - DURATION_CHART_MARGIN_DUAL_AXIS.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const xForIndex = (index: number) => plotLeft + (index / 11) * plotWidth;
    const yForValue = (value: number) =>
      plotBottom - ((value - domain.min) / Math.max(domain.max - domain.min, 0.0001)) * plotHeight;

    const valuesByIndex = orderedContracts.map((contract) => (contract ? contract.price : null));
    const path = buildLinePath(valuesByIndex, xForIndex, yForValue);
    const yTicks = buildYTicks(domain.min, domain.max, plotTop, plotHeight, 5);

    const points = orderedContracts
      .map((contract, index) =>
        contract
          ? {
              x: xForIndex(index),
              y: yForValue(contract.price),
              ticker: contract.ticker,
            }
          : null,
      )
      .filter((point): point is { x: number; y: number; ticker: string } => point !== null);

    const xTicks = orderedContracts.map((contract, index) => ({
      key: `x-${index + 1}`,
      x: xForIndex(index),
      label: formatTickerLabel(contract?.ticker ?? `ZQ${index + 1}`),
    }));

    return {
      hasData: true,
      activeLabel: formatDate(snapshot.time),
      path,
      points,
      yTicks,
      xTicks,
      plotLeft,
      plotRight,
      plotBottom,
    };
  }, [selected]);

  return (
    <section className="fed-futures">
      <div className="fed-futures__header">
        <span className="fed-futures__titleBadge">ZQ Curve</span>
        <span className="fed-futures__date">Active ({chartData.activeLabel})</span>
      </div>
      <div className="fed-futures__body">
        {chartData.hasData ? (
          <CurvePlot
            ariaLabel="Fed futures ZQ curve"
            className="fed-futures__svg"
            width={DURATION_CHART_WIDTH}
            height={DURATION_CHART_HEIGHT}
            plotLeft={chartData.plotLeft}
            plotRight={chartData.plotRight}
            plotBottom={chartData.plotBottom}
            yTicks={chartData.yTicks.map((tick, index) => ({
              key: `y-${index}`,
              y: tick.y,
              leftLabel: tick.value.toFixed(2),
              rightLabel: (100 - tick.value).toFixed(2),
            }))}
            xTicks={chartData.xTicks}
            series={[
              {
                key: "zq-line",
                path: chartData.path,
                pathClassName: "fed-futures__path",
                points: chartData.points.map((point) => ({
                  x: point.x,
                  y: point.y,
                  className: "fed-futures__point",
                  key: point.ticker,
                })),
              },
            ]}
            gridLineClassName="fed-futures__gridLine"
            axisLineClassName="fed-futures__axisLine"
            leftTickClassName="fed-futures__leftTick"
            rightTickClassName="fed-futures__rightTick"
            xTickClassName="fed-futures__xTick"
          />
        ) : (
          <div className="fed-futures__empty">No aligned ZQ data for the selected week.</div>
        )}
      </div>
    </section>
  );
}
