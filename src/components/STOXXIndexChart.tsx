import { useEffect, useMemo, useRef } from "react";
import { CrosshairMode, createChart, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { useNewsletterContext } from "../state/useNewsletterContext";
import {
  formatChartPrice,
  formatChartSubtitleDate,
  formatPe,
  getIndexChartDataset,
} from "./indexChartData";
import "./IndexChart.css";

function formatMonthTick(time: Time) {
  if (typeof time === "string") {
    const date = new Date(`${time}T00:00:00Z`);
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${month}-${year}`;
  }

  if (typeof time === "object" && "year" in time) {
    const month = new Date(Date.UTC(time.year, time.month - 1, time.day)).toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    }).toUpperCase();
    const year = String(time.year).slice(-2);
    return `${month}-${year}`;
  }

  return "";
}

function candleTimeToUtcMs(time: Time) {
  if (typeof time === "string") {
    const date = new Date(`${time}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  if (typeof time === "object" && "year" in time) {
    return Date.UTC(time.year, time.month - 1, time.day);
  }

  return null;
}

function formatAthDate(timeMs: number | null) {
  if (timeMs === null) return "-- --- --";
  const date = new Date(timeMs);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export function STOXXIndexChart() {
  const { selected } = useNewsletterContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const activeTimeMs = selected?.sortDate ?? Date.now();
    return getIndexChartDataset("STOXX600", activeTimeMs);
  }, [selected]);

  const athInfo = useMemo(() => {
    if (chartData.candles.length === 0 || chartData.latestClose === null || chartData.latestClose <= 0) {
      return { athPrice: null as number | null, athTimeMs: null as number | null, deltaPct: null as number | null };
    }

    let athPrice = -Infinity;
    let athTimeMs: number | null = null;
    for (const candle of chartData.candles) {
      if (candle.high > athPrice) {
        athPrice = candle.high;
        athTimeMs = candleTimeToUtcMs(candle.time);
      }
    }

    if (!Number.isFinite(athPrice) || athPrice <= 0) {
      return { athPrice: null as number | null, athTimeMs: null as number | null, deltaPct: null as number | null };
    }

    const deltaPct = (chartData.latestClose / athPrice - 1) * 100;
    return { athPrice, athTimeMs, deltaPct };
  }, [chartData.candles, chartData.latestClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || chartData.candles.length === 0) {
      return;
    }

    let chart: IChartApi | null = createChart(container, {
      layout: {
        background: { color: "#181d25" },
        textColor: "#cbd5f5",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.1)" },
        horzLines: { color: "rgba(148, 163, 184, 0.1)" },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 2,
        tickMarkFormatter: (time: Time) => formatMonthTick(time),
      },
      localization: {
        locale: "en-US",
      },
    });

    const series: ISeriesApi<"Candlestick"> = chart.addCandlestickSeries({
      upColor: "#45d975",
      borderUpColor: "#45d975",
      wickUpColor: "#45d975",
      downColor: "#f43f5e",
      borderDownColor: "#f43f5e",
      wickDownColor: "#f43f5e",
      priceLineVisible: false,
    });

    series.setData(chartData.candles);
    chart.timeScale().fitContent();

    const applyChartSize = (width: number, height: number) => {
      if (!chart) return;
      chart.applyOptions({ width: Math.max(1, width), height: Math.max(1, height) });
      chart.timeScale().fitContent();
    };

    let resizeObserver: ResizeObserver | null = null;
    const onWindowResize = () => applyChartSize(container.clientWidth, container.clientHeight);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        if (entries.length === 0) return;
        const { width, height } = entries[0].contentRect;
        applyChartSize(width, height);
      });
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", onWindowResize);
    }

    applyChartSize(container.clientWidth, container.clientHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onWindowResize);
      chart?.remove();
      chart = null;
    };
  }, [chartData]);

  return (
    <section className="index-chart">
      <div className="index-chart__header">
        <div className="index-chart__titleGroup">
          <span className="index-chart__titleBadge">STOXX</span>
          <span className="index-chart__title">STOXX 600 Index</span>
        </div>
        <div className="index-chart__metaGroup">
          <span className="index-chart__meta">
            FWD P/E: {formatPe(chartData.currentPe)} [LAST WK FWD P/E: {formatPe(chartData.lastWeekPe)}]
          </span>
          <span className="index-chart__subtitle">
            ATH({formatAthDate(athInfo.athTimeMs)}) {formatChartPrice(athInfo.athPrice)}{" "}
            <span className={athInfo.deltaPct !== null && athInfo.deltaPct < 0 ? "index-chart__athDelta--down" : "index-chart__athDelta--flat"}>
              ({athInfo.deltaPct === null ? "--" : `${athInfo.deltaPct >= 0 ? "+" : ""}${athInfo.deltaPct.toFixed(2)}%`})
            </span>{" "}
            |{" "}
            Close {formatChartPrice(chartData.latestClose)} | {formatChartSubtitleDate(chartData.latestTimeMs)}
          </span>
        </div>
      </div>
      <div className="index-chart__body">
        <div ref={containerRef} className="index-chart__canvas" />
      </div>
    </section>
  );
}
