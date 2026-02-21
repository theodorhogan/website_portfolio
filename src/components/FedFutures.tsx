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
      points: Array<{ x: number; y: number; ticker: string; impliedRate: number }>;
      connectors: Array<{ key: string; x1: number; x2: number; y: number; label: string }>;
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

    const domain = getPaddedDomain(priceValues, 0.1, 0.18);
    const firstPrice = orderedContracts.find((contract) => contract !== null)?.price ?? null;
    const lastPrice = [...orderedContracts].reverse().find((contract) => contract !== null)?.price ?? null;
    if (firstPrice !== null && lastPrice !== null) {
      const rawMax = Math.max(...priceValues);
      const rawMin = Math.min(...priceValues);
      const spread = Math.max(rawMax - rawMin, 0.1);
      domain.max = Math.max(rawMax, lastPrice) + spread * 0.02;
      domain.min = Math.min(rawMin, firstPrice) - spread * 0.02;
    }
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
              impliedRate: 100 - contract.price,
            }
          : null,
      )
      .filter((point): point is { x: number; y: number; ticker: string; impliedRate: number } => point !== null);

    const connectors = points
      .map((point, index) => {
        if (index >= points.length - 1) return null;
        const calloutX = xForIndex(index + 1);
        return {
          key: `connector-${index}`,
          x1: point.x,
          x2: calloutX,
          y: point.y,
          label: `${formatTickerLabel(point.ticker)} ${point.impliedRate.toFixed(2)}`,
        };
      })
      .filter((item): item is { key: string; x1: number; x2: number; y: number; label: string } => item !== null);

    const xTicks = orderedContracts
      .map((contract, index) =>
        index % 3 === 0
          ? {
              key: `x-${index + 1}`,
              x: xForIndex(index),
              label: formatTickerLabel(contract?.ticker ?? `ZQ${index + 1}`),
            }
          : null,
      )
      .filter((tick): tick is { key: string; x: number; label: string } => tick !== null);

    return {
      hasData: true,
      activeLabel: formatDate(snapshot.time),
      path,
      points,
      connectors,
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
            overlay={chartData.connectors.map((connector) => (
              <g key={connector.key}>
                <line
                  x1={connector.x1}
                  x2={connector.x2}
                  y1={connector.y}
                  y2={connector.y}
                  className="fed-futures__connectorLine"
                />
                <text x={connector.x2 + 4} y={connector.y + 3} className="fed-futures__connectorLabel">
                  {connector.label}
                </text>
              </g>
            ))}
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
