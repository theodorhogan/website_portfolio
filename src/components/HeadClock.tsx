import { useEffect, useState } from "react";
import { MONTH_LABELS, getIsoWeekNumber, localDateToUtcTime } from "../utils/dates";

type IndicatorState = "red" | "blue" | "green";

type MarketConfig = {
  timeZone: string;
  openMinutes: number;
  closeMinutes: number;
};

/** Regular cash-session hours in exchange-local time. Holidays are not modelled. */
const MARKETS = {
  eu: { timeZone: "Europe/Paris", openMinutes: 9 * 60, closeMinutes: 17 * 60 + 30 },
  us: { timeZone: "America/New_York", openMinutes: 9 * 60 + 30, closeMinutes: 16 * 60 },
} satisfies Record<string, MarketConfig>;

const zonedFormatters = new Map<string, Intl.DateTimeFormat>();

function getZonedFormatter(timeZone: string) {
  let formatter = zonedFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    zonedFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function isMarketOpen(now: Date, market: MarketConfig) {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of getZonedFormatter(market.timeZone).formatToParts(now)) {
    parts[part.type] = part.value;
  }

  if (parts.weekday === "Sat" || parts.weekday === "Sun") return false;
  const minutes = Number(parts.hour ?? 0) * 60 + Number(parts.minute ?? 0);
  return minutes >= market.openMinutes && minutes < market.closeMinutes;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** `21-NOV-26 (wk 47)` in the visitor's own time zone. */
function formatDateWithWeek(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const week = String(getIsoWeekNumber(localDateToUtcTime(date))).padStart(2, "0");
  return `${day}-${MONTH_LABELS[date.getMonth()]}-${year} (wk ${week})`;
}

/**
 * Live clock and market-hours indicator. Ticks every second in its own
 * component so the rest of the header does not re-render with it.
 */
export function HeadClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const euOpen = isMarketOpen(now, MARKETS.eu);
  const usOpen = isMarketOpen(now, MARKETS.us);
  const indicatorState: IndicatorState = usOpen ? "green" : euOpen ? "blue" : "red";
  const euStatus = euOpen ? "open" : "closed";
  const usStatus = usOpen ? "open" : "closed";

  return (
    <div className="head-clock" tabIndex={0} aria-label={`Market status: EU ${euStatus}, US ${usStatus}`}>
      <span className="head-date">{formatDateWithWeek(now)}</span>
      <span className="head-separator" aria-hidden="true">
        |
      </span>
      <time className="head-timer" dateTime={now.toISOString()}>
        {formatTime(now)}
      </time>
      <span className={`head-indicator head-indicator--${indicatorState}`} aria-hidden="true" />
      <div className="head-tooltip" aria-hidden="true">
        <div className="head-tooltipRow">
          <span className="head-tooltipMarket">EU MKT</span>
          <span className={`head-tooltipStatus head-tooltipStatus--eu-${euStatus}`}>{euStatus}</span>
        </div>
        <div className="head-tooltipRow">
          <span className="head-tooltipMarket">US MKT</span>
          <span className={`head-tooltipStatus head-tooltipStatus--us-${usStatus}`}>{usStatus}</span>
        </div>
      </div>
    </div>
  );
}
