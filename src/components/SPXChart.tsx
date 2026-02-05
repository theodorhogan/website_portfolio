import { useEffect, useRef } from "react";
import { CrosshairMode, createChart } from "lightweight-charts";
import type { CandlestickData, IChartApi, ISeriesApi } from "lightweight-charts";
import "./SPXChart.css";
import spxCsv from "../data/spx/spx-daily.csv?raw";

function parseCsv(raw: string): CandlestickData[] {
  return raw
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(","))
    .filter((parts) => parts.length >= 5)
    .map(([date, open, high, low, close]) => ({
      time: date as CandlestickData["time"],
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.open) &&
        Number.isFinite(entry.high) &&
        Number.isFinite(entry.low) &&
        Number.isFinite(entry.close),
    )
    .sort((a, b) => {
      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    });
}

const SPX_CANDLES = parseCsv(spxCsv);
const LATEST_CANDLE = SPX_CANDLES.at(-1);

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function SPXChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || SPX_CANDLES.length === 0) {
      return;
    }

    let chart: IChartApi | null = createChart(container, {
      layout: {
        background: { color: "#181d25" },
        textColor: "#cbd5f5",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      width: container.clientWidth,
      height: container.clientHeight,
      localization: {
        priceFormatter: (price: number) => numberFormatter.format(price),
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: false,
        rightOffset: 4,
      },
    });

    const series: ISeriesApi<"Candlestick"> = chart.addCandlestickSeries({
      upColor: "#22c55e",
      borderUpColor: "#22c55e",
      wickUpColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      wickDownColor: "#ef4444",
      priceLineVisible: false,
    });

    series.setData(SPX_CANDLES);
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
  }, []);

  return (
    <div className="spx-chart">
      <div className="spx-chart__header">
        <div className="spx-chart__titleGroup">
          <span className="spx-chart__titleBadge">SPX</span>
          <span className="spx-chart__title">S&amp;P 500 Index</span>
        </div>
        {LATEST_CANDLE ? (
          <span className="spx-chart__subtitle">
            Daily close {numberFormatter.format(LATEST_CANDLE.close)} |{" "}
            {dateFormatter.format(new Date(`${LATEST_CANDLE.time}T00:00:00Z`))}
          </span>
        ) : null}
      </div>
      <div className="spx-chart__body">
        <div ref={chartContainerRef} className="spx-chart__canvas" />
      </div>
    </div>
  );
}
