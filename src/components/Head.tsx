import { useEffect, useMemo, useState } from "react";
import "./Head.css";

type IndicatorState = "red" | "blue" | "green";

type MarketConfig = {
  timeZone: string;
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
};

type ZonedTimeParts = {
  weekday: string;
  hour: number;
  minute: number;
};

const MARKET_CONFIGS = {
  eu: {
    timeZone: "Europe/Paris",
    openHour: 9,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 30,
  },
  us: {
    timeZone: "America/New_York",
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
  },
} satisfies Record<string, MarketConfig>;

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  if (!zonedFormatterCache.has(timeZone)) {
    zonedFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
        hourCycle: "h23",
      })
    );
  }

  return zonedFormatterCache.get(timeZone)!;
}

function getZonedTimeParts(date: Date, config: MarketConfig): ZonedTimeParts {
  const formatter = getFormatter(config.timeZone);
  const parts = formatter.formatToParts(date);

  const lookup: Partial<Record<string, string>> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  return {
    weekday: lookup.weekday ?? "Sun",
    hour: Number(lookup.hour ?? 0),
    minute: Number(lookup.minute ?? 0),
  };
}

function isWeekday(weekday: string) {
  return weekday !== "Sat" && weekday !== "Sun";
}

function isWithinMarketHours(parts: ZonedTimeParts, config: MarketConfig) {
  const currentMinutes = parts.hour * 60 + parts.minute;
  const openMinutes = config.openHour * 60 + config.openMinute;
  const closeMinutes = config.closeHour * 60 + config.closeMinute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function computeMarketStatus(now: Date) {
  const euParts = getZonedTimeParts(now, MARKET_CONFIGS.eu);
  const usParts = getZonedTimeParts(now, MARKET_CONFIGS.us);

  const euOpen =
    isWeekday(euParts.weekday) &&
    isWithinMarketHours(euParts, MARKET_CONFIGS.eu);
  const usOpen =
    isWeekday(usParts.weekday) &&
    isWithinMarketHours(usParts, MARKET_CONFIGS.us);

  let indicatorState: IndicatorState = "red";
  if (usOpen) {
    indicatorState = "green";
  } else if (euOpen) {
    indicatorState = "blue";
  }

  return {
    euStatus: euOpen ? "OPEN" : "CLOSED",
    usStatus: usOpen ? "OPEN" : "CLOSED",
    indicatorState,
  };
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getISOWeek(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7; // Monday=1 ... Sunday=7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNumber;
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

function formatDateWithWeek(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = monthFormatter.format(date).toUpperCase();
  const year = String(date.getFullYear()).slice(-2);
  const week = String(getISOWeek(date)).padStart(2, "0");

  return `${day}-${month}-${year} (wk ${week})`;
}

export function Head() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const { euStatus, usStatus, indicatorState } = useMemo(
    () => computeMarketStatus(now),
    [now]
  );

  const indicatorTitle = useMemo(() => {
    if (indicatorState === "green") {
      return "US markets OPEN";
    }
    if (indicatorState === "blue") {
      return "EU markets OPEN";
    }

    return "Markets CLOSED";
  }, [indicatorState]);

  const tooltipTitle = useMemo(
    () => `EU: ${euStatus} | US: ${usStatus}`,
    [euStatus, usStatus]
  );

  return (
    <header className="head-container">
      <div className="head-search">
        <span className="head-searchPrompt" aria-hidden="true">
          &gt;
        </span>
        <input
          id="global-search"
          type="search"
          placeholder="Search"
          className="head-searchInput"
          aria-label="Search"
        />
      </div>
      <div className="head-clock" title={tooltipTitle}>
        <span className="head-date" aria-label={`Date ${formatDateWithWeek(now)}`}>
          {formatDateWithWeek(now)}
        </span>
        <span className="head-separator" aria-hidden="true">
          |
        </span>
        <time
          className="head-timer"
          dateTime={now.toISOString()}
          aria-live="polite"
          aria-label={`Current time ${formatTime(now)}. ${indicatorTitle}.`}
        >
          {formatTime(now)}
        </time>
        <span
          className={`head-indicator head-indicator--${indicatorState}`}
          role="presentation"
        />
        <span className="sr-only">{`EU market ${euStatus}. US market ${usStatus}.`}</span>
        <div className="head-tooltip" role="status" aria-hidden="true">
          <div className="head-tooltipRow">
            <span className="head-tooltipMarket">EU MKT</span>
            <span
              className={`head-tooltipStatus head-tooltipStatus--eu-${euStatus.toLowerCase()}`}
            >
              {euStatus}
            </span>
          </div>
          <div className="head-tooltipRow">
            <span className="head-tooltipMarket">US MKT</span>
            <span
              className={`head-tooltipStatus head-tooltipStatus--us-${usStatus.toLowerCase()}`}
            >
              {usStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
