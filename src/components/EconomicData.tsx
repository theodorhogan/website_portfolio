import { Fragment, useEffect, useMemo, useState } from "react";
import { ECONOMIC_WEEKS, type EconomicEvent, type EconomicWeekEntry } from "../data/economicData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { PanelShell } from "./PanelShell";
import "./EconomicData.css";

type RailItem = {
  id: string;
  kind: "upcoming" | "past";
  weekNumber: number;
  year: number;
  rangeLabel: string;
  headerDate: string;
  dayMonthLabel: string | null;
  entry: EconomicWeekEntry | null;
};

type ValueKind = "percent" | "thousands" | "millions" | "billions" | "level";

const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

function startOfWeekUtc(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekdayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - weekdayOffset);
  return start;
}

function shiftDaysUtc(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function getWeekFridayUtc(date: Date) {
  return shiftDaysUtc(startOfWeekUtc(date), 4);
}

function getIsoWeek(date: Date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatHeaderDateFromDate(date: Date) {
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function formatWeekRangeFromDate(date: Date) {
  const weekStart = startOfWeekUtc(date);
  const weekEnd = shiftDaysUtc(weekStart, 4);
  const monthStart = weekStart.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const dayStart = String(weekStart.getUTCDate()).padStart(2, "0");
  const monthEnd = weekEnd.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const dayEnd = String(weekEnd.getUTCDate()).padStart(2, "0");
  return `${monthStart}-${dayStart} - ${monthEnd}-${dayEnd}`;
}

function formatDayMonthFromHeaderDate(headerDate: string) {
  const [day = "--", month = "---"] = headerDate.split("-");
  return `${day}-${month}`;
}

function buildRailItems(activeSortDate: number): RailItem[] {
  const entriesByWeekFriday = new Map(ECONOMIC_WEEKS.map((entry) => [entry.sortDate, entry]));
  const activeWeekFriday = getWeekFridayUtc(new Date(activeSortDate));
  const nextWeekDate = shiftDaysUtc(activeWeekFriday, 7);
  const upcomingEntry = entriesByWeekFriday.get(nextWeekDate.getTime()) ?? null;

  const upcomingItem: RailItem = {
    id: "upcoming",
    kind: "upcoming",
    weekNumber: getIsoWeek(nextWeekDate),
    year: nextWeekDate.getUTCFullYear(),
    rangeLabel: formatWeekRangeFromDate(nextWeekDate),
    headerDate: upcomingEntry?.dateLabel ?? formatHeaderDateFromDate(nextWeekDate),
    dayMonthLabel: null,
    entry: upcomingEntry,
  };

  const pastItems = Array.from({ length: 5 }, (_, index) => {
    const weekDate = shiftDaysUtc(activeWeekFriday, -7 * index);
    const entry = entriesByWeekFriday.get(weekDate.getTime()) ?? null;
    const headerDate = entry?.dateLabel ?? formatHeaderDateFromDate(weekDate);

    return {
      id: `past-${weekDate.getTime()}`,
      kind: "past" as const,
      weekNumber: getIsoWeek(weekDate),
      year: weekDate.getUTCFullYear(),
      rangeLabel: entry?.rangeLabel ?? formatWeekRangeFromDate(weekDate),
      headerDate,
      dayMonthLabel: formatDayMonthFromHeaderDate(headerDate),
      entry,
    };
  });

  return [upcomingItem, ...pastItems];
}

function inferValueKind(event: string, value: number | null, street: number | null): ValueKind {
  const sample = Math.max(Math.abs(value ?? 0), Math.abs(street ?? 0));
  const label = event.toLowerCase();

  if (
    /( y\/y| m\/m| q\/q| yoy| mom| qoq| saar|inflation|unemployment rate|pce|production|inventories|factory orders|durable goods|leading index|retail sales|employment cost)/i.test(
      label,
    )
  ) {
    return "percent";
  }

  if (/balance/i.test(label) || sample >= 1_000_000_000) {
    return "billions";
  }

  if (/(sales|starts|permits|jolts)/i.test(label) || sample >= 1_000_000) {
    return "millions";
  }

  if (/(claims|payroll|employment change|revision)/i.test(label) || sample >= 100_000) {
    return "thousands";
  }

  return "level";
}

function formatValue(value: number | null, kind: ValueKind) {
  if (value === null) return "--";

  if (kind === "percent") {
    return `${value.toFixed(1)}%`;
  }

  if (kind === "billions") {
    return `${(value / 1_000_000_000).toFixed(Math.abs(value) < 10_000_000_000 ? 1 : 0)}B`;
  }

  if (kind === "millions") {
    const millions = value / 1_000_000;
    return `${millions.toFixed(Math.abs(millions) < 10 ? 2 : 1)}M`;
  }

  if (kind === "thousands") {
    return `${Math.round(value / 1_000)}K`;
  }

  if (Math.abs(value) >= 100) {
    return value.toFixed(1);
  }

  return value.toFixed(2).replace(/\.00$/, "");
}

function formatSurprise(value: number | null) {
  if (value === null) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getSurpriseClassName(value: number | null) {
  if (value === null || Math.abs(value) < 0.00005) return "economic-data__surprise economic-data__surprise--neutral";
  return value > 0
    ? "economic-data__surprise economic-data__surprise--positive"
    : "economic-data__surprise economic-data__surprise--negative";
}

function groupEventsByDay(events: EconomicEvent[]) {
  const map = new Map<string, EconomicEvent[]>();

  for (const event of events) {
    const label = DAY_FORMATTER.format(new Date(`${event.date}T00:00:00Z`)).toUpperCase();
    const bucket = map.get(label);
    if (bucket) {
      bucket.push(event);
    } else {
      map.set(label, [event]);
    }
  }

  return Array.from(map.entries()).map(([label, dayEvents]) => ({ label, events: dayEvents }));
}

export function EconomicData() {
  const { selected } = useNewsletterContext();

  const activeSortDate = selected?.sortDate ?? Date.now();
  const railItems = useMemo(() => buildRailItems(activeSortDate), [activeSortDate]);
  const activeWeekItemId =
    railItems.find((item) => item.kind === "past")?.id ?? railItems[0]?.id ?? "upcoming";
  const [selectedItemId, setSelectedItemId] = useState(activeWeekItemId);

  useEffect(() => {
    setSelectedItemId(activeWeekItemId);
  }, [activeWeekItemId]);

  const selectedItem =
    railItems.find((item) => item.id === selectedItemId) ??
    railItems.find((item) => item.kind === "past") ??
    railItems[0] ??
    null;

  const dayGroups = useMemo(
    () => groupEventsByDay(selectedItem?.entry?.events ?? []),
    [selectedItem?.entry?.events],
  );

  return (
    <PanelShell
      className="economic-data h-full min-h-0"
      variant="split"
      bodyMode="stretch"
      badge="Economic Data"
      actions={<span className="economic-data__headerDate">{selectedItem?.headerDate ?? "-- --- --"}</span>}
      bodyClassName="economic-data__body"
    >
      <aside className="economic-data__rail" aria-label="Week selector">
        {railItems.map((item) => {
          const isSelected = item.id === selectedItem?.id;
          const buttonClasses = [
            "economic-data__railButton",
            item.kind === "upcoming" ? "economic-data__railButton--upcoming" : "",
            isSelected && item.kind === "upcoming" ? "is-selected-upcoming" : "",
            isSelected && item.kind === "past" ? "is-selected-past" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={item.id}
              type="button"
              className={buttonClasses}
              onClick={() => setSelectedItemId(item.id)}
              aria-pressed={isSelected}
            >
              <span
                className={`economic-data__railWeekBadge ${
                  item.kind === "upcoming"
                    ? isSelected
                      ? "economic-data__railWeekBadge--upcomingSelected"
                      : "economic-data__railWeekBadge--upcoming"
                    : isSelected
                      ? "economic-data__railWeekBadge--pastSelected"
                      : "economic-data__railWeekBadge--past"
                }`}
              >
                {item.kind === "upcoming" ? (
                  "UPCOMING"
                ) : (
                  <>
                    <span>{`WK ${String(item.weekNumber).padStart(2, "0")}`}</span>
                    <span className="economic-data__railWeekBadgeDate">{item.dayMonthLabel}</span>
                  </>
                )}
              </span>
              <span className="economic-data__railYear">{item.year}</span>
              <span className="economic-data__railRange">{item.rangeLabel}</span>
            </button>
          );
        })}
      </aside>
      <section className="economic-data__detail">
        {selectedItem?.entry && dayGroups.length > 0 ? (
          <table className="economic-data__table" aria-label="Economic calendar">
            <thead>
              <tr>
                <th className="economic-data__head economic-data__head--event">Event</th>
                <th className="economic-data__head economic-data__head--value">Actual</th>
                <th className="economic-data__head economic-data__head--value">Street</th>
                <th className="economic-data__head economic-data__head--value">Surprise</th>
              </tr>
            </thead>
            <tbody>
              {dayGroups.map((group) => (
                <Fragment key={group.label}>
                  <tr className="economic-data__dayRow">
                    <th colSpan={4} className="economic-data__dayLabel">
                      {group.label}
                    </th>
                  </tr>
                  {group.events.map((event) => {
                    const kind = inferValueKind(event.event, event.actual, event.street);

                    return (
                      <tr key={event.id}>
                        <td className="economic-data__event">{event.event}</td>
                        <td className="economic-data__value economic-data__value--actual">
                          {formatValue(event.actual, kind)}
                        </td>
                        <td className="economic-data__value economic-data__value--street">
                          {formatValue(event.street, kind)}
                        </td>
                        <td className="economic-data__value economic-data__value--surprise">
                          <span className={getSurpriseClassName(event.surprise)}>
                            {formatSurprise(event.surprise)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="economic-data__empty">
            No economic calendar data for {selectedItem?.rangeLabel ?? "the selected week"}.
          </p>
        )}
      </section>
    </PanelShell>
  );
}
