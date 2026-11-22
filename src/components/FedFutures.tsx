import { useMemo } from "react";
import { getFedFuturesSnapshots } from "../data/ratesData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { WEEK_MS, formatDayMonthYear } from "../utils/dates";
import { getAlignedPoint } from "../utils/timeSeries";
import { CurvePlot } from "./CurvePlot";
import { buildLinePath, buildYTicks } from "./curveChartUtils";
import {
  DURATION_CHART_HEIGHT,
  DURATION_CHART_MARGIN_DUAL_AXIS,
  DURATION_CHART_WIDTH,
} from "./durationChartConfig";
import { PanelShell } from "./PanelShell";
import "./FedFutures.css";

type FedFuturesChartData =
  | {
      hasData: false;
      activeLabel: string;
    }
  | {
      hasData: true;
      activeLabel: string;
      /** Date of the week-ago snapshot, or null when there is none to compare against. */
      previousLabel: string | null;
      path: string;
      previousPath: string;
      points: Array<{ x: number; y: number; ticker: string; impliedRate: number }>;
      connectors: Array<{ key: string; x1: number; x2: number; y: number; label: string }>;
      yTicks: Array<{ value: number; y: number }>;
      xTicks: Array<{ key: string; x: number; label: string }>;
      plotLeft: number;
      plotRight: number;
      plotBottom: number;
    };

function formatTickerLabel(ticker: string) {
  const parts = ticker.trim().split(/\s+/);
  if (parts.length === 0) return ticker;

  const month = (parts[0] ?? "").slice(0, 3).toUpperCase();
  const code = parts[1] ?? "";
  const yearMatch = code.match(/(\d{2})$/);
  const year = yearMatch ? yearMatch[1] : "";
  return year ? `${month}-${year}` : month;
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

    const snapshot = getAlignedPoint(getFedFuturesSnapshots(), activeTime);
    if (!snapshot) {
      return {
        hasData: false,
        activeLabel: formatDayMonthYear(activeTime),
      };
    }

    const maxSequence = Math.max(0, ...snapshot.contracts.map((contract) => contract.sequence));
    const contractsBySequence = new Map(snapshot.contracts.map((contract) => [contract.sequence, contract]));
    const orderedContracts = Array.from({ length: maxSequence }, (_, idx) => contractsBySequence.get(idx + 1) ?? null);
    const priceValues = orderedContracts
      .map((contract) => (contract ? contract.price : null))
      .filter((value): value is number => value !== null);

    // Week-ago prices are matched by contract month, not by position: when the front contract
    // expires every sequence number shifts, so position 1 would compare two different months.
    const weekAgo = getAlignedPoint(getFedFuturesSnapshots(), activeTime - WEEK_MS);
    const previousSnapshot = weekAgo && weekAgo.time < snapshot.time ? weekAgo : null;
    const previousPriceByTicker = new Map(
      (previousSnapshot?.contracts ?? []).map((contract) => [contract.ticker.toUpperCase(), contract.price]),
    );
    const previousValues = orderedContracts.map((contract) =>
      contract ? (previousPriceByTicker.get(contract.ticker.toUpperCase()) ?? null) : null,
    );
    const previousPriceValues = previousValues.filter((value): value is number => value !== null);

    if (priceValues.length === 0) {
      return {
        hasData: false,
        activeLabel: formatDayMonthYear(snapshot.time),
      };
    }

    const domain = {
      min: Math.min(...priceValues, ...previousPriceValues),
      max: Math.max(...priceValues, ...previousPriceValues),
    };
    const plotLeft = DURATION_CHART_MARGIN_DUAL_AXIS.left;
    const plotRight = DURATION_CHART_WIDTH - DURATION_CHART_MARGIN_DUAL_AXIS.right;
    const plotTop = DURATION_CHART_MARGIN_DUAL_AXIS.top;
    const plotBottom = DURATION_CHART_HEIGHT - DURATION_CHART_MARGIN_DUAL_AXIS.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const xForIndex = (index: number) =>
      plotLeft + (index / Math.max(orderedContracts.length - 1, 1)) * plotWidth;
    const yForValue = (value: number) =>
      plotBottom - ((value - domain.min) / Math.max(domain.max - domain.min, 0.0001)) * plotHeight;

    const valuesByIndex = orderedContracts.map((contract) => (contract ? contract.price : null));
    const path = buildLinePath(valuesByIndex, xForIndex, yForValue);
    const previousPath = buildLinePath(previousValues, xForIndex, yForValue);
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
        if (index === 0 || index >= points.length - 1) return null;
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
      activeLabel: formatDayMonthYear(snapshot.time),
      previousLabel:
        previousSnapshot && previousPriceValues.length > 0 ? formatDayMonthYear(previousSnapshot.time) : null,
      path,
      previousPath,
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
    <PanelShell
      className="fed-futures h-full min-h-0"
      variant="chart"
      bodyMode="stretch"
      badge="ZQ Curve"
      actions={
        <div className="fed-futures__legend">
          <span className="fed-futures__legendItem">
            <span className="fed-futures__legendDot fed-futures__legendDot--active" />
            Active ({chartData.activeLabel})
          </span>
          {chartData.hasData && chartData.previousLabel ? (
            <span className="fed-futures__legendItem">
              <span className="fed-futures__legendDot fed-futures__legendDot--previous" />
              Last Week ({chartData.previousLabel})
            </span>
          ) : null}
        </div>
      }
      bodyClassName="fed-futures__body"
    >
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
              // Drawn first so the active curve and its points sit on top.
              {
                key: "zq-previous",
                path: chartData.previousPath,
                pathClassName: "fed-futures__path fed-futures__path--previous",
              },
              {
                key: "zq-line",
                path: chartData.path,
                pathClassName: "fed-futures__path fed-futures__path--active",
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
    </PanelShell>
  );
}
