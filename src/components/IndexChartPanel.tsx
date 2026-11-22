import { useEffect, useMemo, useRef } from "react";
import { CrosshairMode, createChart, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { MONTH_LABELS, formatDayMonthYear } from "../utils/dates";
import { formatPrice } from "../utils/format";
import { formatChartSubtitleDate, formatPe, getIndexChartDataset, type IndexKey } from "./indexChartData";
import { PanelShell } from "./PanelShell";
import "./IndexChart.css";

type IndexChartPanelProps = {
  index: IndexKey;
  badge: string;
  title: string;
};

/** `NOV-26` axis labels. Candles are keyed by business day, the only shape handled here. */
function formatMonthTick(time: Time) {
  if (typeof time !== "object") return "";
  return `${MONTH_LABELS[time.month - 1]}-${String(time.year).slice(-2)}`;
}

export function IndexChartPanel({ index, badge, title }: IndexChartPanelProps) {
  const { selected } = useNewsletterContext();
  const activeTime = selected?.sortDate ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const chartData = useMemo(() => getIndexChartDataset(index, activeTime ?? Date.now()), [index, activeTime]);

  const { windowHigh, latestClose } = chartData;
  const highDeltaPct =
    windowHigh && latestClose !== null && windowHigh.value > 0 ? (latestClose / windowHigh.value - 1) * 100 : null;

  // Build the chart once; week changes only swap the data in the effect below.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#cbd5f5",
        fontFamily: getComputedStyle(container).fontFamily,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.1)" },
        horzLines: { color: "rgba(148, 163, 184, 0.1)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      leftPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        rightOffset: 2,
        lockVisibleTimeRangeOnResize: true,
        tickMarkFormatter: formatMonthTick,
      },
      localization: { locale: "en-US" },
    });

    chartRef.current = chart;
    seriesRef.current = chart.addCandlestickSeries({
      upColor: "#45d975",
      borderUpColor: "#45d975",
      wickUpColor: "#45d975",
      downColor: "#f43f5e",
      borderDownColor: "#f43f5e",
      wickDownColor: "#f43f5e",
      priceLineVisible: false,
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    seriesRef.current?.setData(chartData.candles);
    chartRef.current?.timeScale().fitContent();
  }, [chartData]);

  return (
    <PanelShell
      className="index-chart h-full"
      variant="chart"
      bodyMode="stretch"
      badge={badge}
      title={<span className="index-chart__title">{title}</span>}
      actions={
        <div className="index-chart__metaGroup">
          <span className="index-chart__meta">
            FWD P/E: {formatPe(chartData.currentPe)} [LAST WK FWD P/E: {formatPe(chartData.lastWeekPe)}]
          </span>
          <span className="index-chart__subtitle">
            ATH({windowHigh ? formatDayMonthYear(windowHigh.time) : "-- --- --"}): {formatPrice(windowHigh?.value ?? null)}{" "}
            <span
              className={
                highDeltaPct !== null && highDeltaPct < 0 ? "index-chart__athDelta--down" : "index-chart__athDelta--flat"
              }
            >
              ({highDeltaPct === null ? "--" : `${highDeltaPct >= 0 ? "+" : ""}${highDeltaPct.toFixed(2)}%`})
            </span>{" "}
            | Close {formatPrice(latestClose)} | {formatChartSubtitleDate(chartData.latestTimeMs)}
          </span>
        </div>
      }
      bodyClassName="index-chart__body"
    >
      <div ref={containerRef} className="index-chart__canvas" />
      {chartData.candles.length === 0 ? <p className="index-chart__empty">No index data for the selected week.</p> : null}
    </PanelShell>
  );
}
