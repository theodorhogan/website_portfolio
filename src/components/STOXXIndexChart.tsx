import { useEffect, useMemo, useRef } from "react";
import { CrosshairMode, createChart, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { useNewsletterContext } from "../state/NewsletterContext";
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

export function STOXXIndexChart() {
  const { selected } = useNewsletterContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const activeTimeMs = selected?.sortDate ?? Date.now();
    return getIndexChartDataset("STOXX600", activeTimeMs);
  }, [selected]);

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

    const resizeObserver = new ResizeObserver((entries) => {
      if (!chart || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
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
