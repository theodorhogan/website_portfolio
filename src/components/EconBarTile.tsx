import { useMemo } from "react";
import { formatEconValue, getEconReadings, type EconIndicator, type EconReading } from "../data/econData";
import { MONTH_LABELS } from "../utils/dates";
import "./EconBarTile.css";

type EconBarTileProps = {
  indicator: EconIndicator;
  activeTime: number | null;
  /** Bars shown: the latest readings as known in the active week. */
  count: number;
};

/** Units of series that are changes, so their bars grow from zero. */
const CHANGE_UNIT = /m\/m|y\/y|q\/q|change/i;

/** Bars need a visible sliver even at the baseline. */
const MIN_BAR_PERCENT = 2;

/** `J` for a month, `Q3` for a quarter. */
function formatTick(indicator: EconIndicator, reading: EconReading) {
  const month = new Date(reading.periodTime).getUTCMonth();
  return indicator.frequency === "Q" ? `Q${month / 3 + 1}` : MONTH_LABELS[month][0];
}

/**
 * Bar positions in percent of the chart height.
 * Changes, and levels that go negative (balances), are drawn from a zero line.
 * Other levels (rates, indexes, counts) start just below their lowest value so the bars show the variation.
 */
function buildBars(indicator: EconIndicator, readings: EconReading[]) {
  if (readings.length === 0) return { zeroLine: null, bars: [] };

  const values = readings.map((reading) => reading.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const fromZero = CHANGE_UNIT.test(indicator.unit) || min < 0;

  const base = fromZero ? 0 : min - ((max - min) * 0.35 || 1);
  const low = Math.min(base, min);
  const high = Math.max(base, max);
  const span = high - low || 1;

  return {
    zeroLine: fromZero ? (high / span) * 100 : null,
    bars: readings.map((reading) => ({
      reading,
      top: ((high - Math.max(reading.value, base)) / span) * 100,
      height: Math.max((Math.abs(reading.value - base) / span) * 100, MIN_BAR_PERCENT),
    })),
  };
}

/** One indicator: its latest value over a bar per reading, with this week's new and revised readings marked. */
export function EconBarTile({ indicator, activeTime, count }: EconBarTileProps) {
  const readings = useMemo(
    () => (activeTime === null ? [] : getEconReadings(indicator, activeTime, count)),
    [indicator, activeTime, count],
  );
  const chart = useMemo(() => buildBars(indicator, readings), [indicator, readings]);

  const latest = readings.at(-1);
  const latestText = formatEconValue(indicator, latest?.value ?? null);
  // A short history keeps its bars at the right, at their usual width.
  const emptySlots = Array.from({ length: count - readings.length }, (_, index) => index);

  return (
    <div className="econ-bar-tile">
      <div className="econ-bar-tile__head">
        <span className="econ-bar-tile__label">{indicator.label}</span>
        <span
          className={`econ-bar-tile__value${latest && latestText.startsWith("-") ? " econ-bar-tile__value--negative" : ""}`}
        >
          {latestText}
        </span>
      </div>
      <div className="econ-bar-tile__unit">{indicator.unit}</div>
      <div className="econ-bar-tile__bars" role="img" aria-label={`${indicator.label}, last ${readings.length} readings`}>
        {chart.zeroLine !== null ? (
          <span className="econ-bar-tile__zeroLine" style={{ top: `${chart.zeroLine}%` }} />
        ) : null}
        {emptySlots.map((slot) => (
          <span key={slot} className="econ-bar-tile__slot" />
        ))}
        {chart.bars.map(({ reading, top, height }) => (
          <span
            key={reading.period}
            className="econ-bar-tile__slot"
            title={`${reading.label} ${formatEconValue(indicator, reading.value)}`}
          >
            <span
              className={`econ-bar-tile__bar${reading.isNew ? " econ-bar-tile__bar--new" : ""}${reading.isRevised ? " econ-bar-tile__bar--revised" : ""}`}
              style={{ top: `${top}%`, height: `${height}%` }}
            />
          </span>
        ))}
      </div>
      <div className="econ-bar-tile__ticks" aria-hidden="true">
        {emptySlots.map((slot) => (
          <span key={slot} className="econ-bar-tile__tick" />
        ))}
        {readings.map((reading) => (
          <span key={reading.period} className="econ-bar-tile__tick">
            {formatTick(indicator, reading)}
          </span>
        ))}
      </div>
    </div>
  );
}
