import { Fragment, useMemo, useState } from "react";
import {
  ECONOMIC_COVERAGE,
  ECONOMIC_WEEKS_BY_FRIDAY,
  type EconomicEvent,
  type EconomicWeekEntry,
} from "../data/economicData";
import { useNewsletterContext } from "../state/useNewsletterContext";
import {
  WEEK_MS,
  formatDayMonth,
  formatDayMonthYear,
  formatWeekRange,
  getIsoWeekNumber,
  getWeekFridayUtc,
} from "../utils/dates";
import { getChangeTone } from "../utils/format";
import { PanelShell } from "./PanelShell";
import "./EconomicData.css";

type RailItem = {
  id: string;
  kind: "upcoming" | "past";
  weekNumber: number;
  rangeLabel: string;
  headerDate: string;
  dayMonthLabel: string;
  entry: EconomicWeekEntry | null;
};

type ValueKind = "percent" | "thousands" | "millions" | "billions" | "level";

const PAST_WEEKS_SHOWN = 5;

const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "2-digit",
  timeZone: "UTC",
});

function buildRailItem(weekFriday: number, kind: RailItem["kind"]): RailItem {
  return {
    id: `${kind}-${weekFriday}`,
    kind,
    weekNumber: getIsoWeekNumber(weekFriday),
    rangeLabel: formatWeekRange(weekFriday),
    headerDate: formatDayMonthYear(weekFriday),
    dayMonthLabel: formatDayMonth(weekFriday),
    entry: ECONOMIC_WEEKS_BY_FRIDAY.get(weekFriday) ?? null,
  };
}

/** The week after the active one, then the active week and the four before it. */
function buildRailItems(activeSortDate: number): RailItem[] {
  const activeFriday = getWeekFridayUtc(activeSortDate);
  return [
    buildRailItem(activeFriday + WEEK_MS, "upcoming"),
    ...Array.from({ length: PAST_WEEKS_SHOWN }, (_, index) => buildRailItem(activeFriday - index * WEEK_MS, "past")),
  ];
}

/** The calendar file stores raw numbers; the unit is inferred from the release name and magnitude. */
function inferValueKind(event: string, value: number | null, street: number | null): ValueKind {
  const sample = Math.max(Math.abs(value ?? 0), Math.abs(street ?? 0));

  if (
    /( y\/y| m\/m| q\/q| yoy| mom| qoq| saar|inflation|unemployment rate|pce|production|inventories|factory orders|durable goods|leading index|retail sales|employment cost)/i.test(
      event,
    )
  ) {
    return "percent";
  }

  if (/balance/i.test(event) || sample >= 1_000_000_000) return "billions";
  if (/(sales|starts|permits|jolts)/i.test(event) || sample >= 1_000_000) return "millions";
  if (/(claims|payroll|employment change|revision)/i.test(event) || sample >= 100_000) return "thousands";
  return "level";
}

function formatValue(value: number | null, kind: ValueKind) {
  if (value === null) return "--";

  if (kind === "percent") return `${value.toFixed(1)}%`;
  if (kind === "billions") return `${(value / 1_000_000_000).toFixed(Math.abs(value) < 10_000_000_000 ? 1 : 0)}B`;

  if (kind === "millions") {
    const millions = value / 1_000_000;
    return `${millions.toFixed(Math.abs(millions) < 10 ? 2 : 1)}M`;
  }

  if (kind === "thousands") return `${Math.round(value / 1_000)}K`;
  if (Math.abs(value) >= 100) return value.toFixed(1);
  return value.toFixed(2).replace(/\.00$/, "");
}

function formatSurprise(value: number | null) {
  if (value === null) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function groupEventsByDay(events: EconomicEvent[]) {
  const groups: Array<{ label: string; events: EconomicEvent[] }> = [];

  for (const event of events) {
    const label = DAY_FORMATTER.format(event.sortDate).toUpperCase();
    const last = groups[groups.length - 1];
    if (last?.label === label) {
      last.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }

  return groups;
}

export function EconomicData() {
  const { selected } = useNewsletterContext();

  // Stable for the session when no bulletin is selected.
  const [fallbackTime] = useState(() => Date.now());
  const activeSortDate = selected?.sortDate ?? fallbackTime;
  const railItems = useMemo(() => buildRailItems(activeSortDate), [activeSortDate]);

  // A manual pick only applies to the week it was made in; changing the active week snaps back to it.
  const [pick, setPick] = useState<{ anchor: number; id: string } | null>(null);
  const activeWeekItem = railItems[1];
  const selectedItem =
    (pick?.anchor === activeSortDate ? railItems.find((item) => item.id === pick.id) : null) ?? activeWeekItem;

  const dayGroups = useMemo(() => groupEventsByDay(selectedItem.entry?.events ?? []), [selectedItem.entry]);

  return (
    <PanelShell
      className="economic-data h-full min-h-0"
      variant="split"
      bodyMode="stretch"
      badge="Economic Data"
      actions={<span className="economic-data__headerDate">Week ending {selectedItem.headerDate}</span>}
      bodyClassName="economic-data__body"
    >
      <aside className="economic-data__rail" aria-label="Week selector">
        {railItems.map((item) => {
          const isSelected = item.id === selectedItem.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`economic-data__railButton economic-data__railButton--${item.kind}${isSelected ? " is-selected" : ""}`}
              onClick={() => setPick({ anchor: activeSortDate, id: item.id })}
              aria-pressed={isSelected}
            >
              <span className="economic-data__railWeek">
                {item.kind === "upcoming" ? "Upcoming" : `WK ${String(item.weekNumber).padStart(2, "0")}`}
                {item.entry ? null : <span className="economic-data__railNoData" title="No calendar data" />}
              </span>
              <span className="economic-data__railDate">{item.dayMonthLabel}</span>
              <span className="economic-data__railRange">{item.rangeLabel}</span>
            </button>
          );
        })}
      </aside>
      <section className="economic-data__detail">
        {dayGroups.length > 0 ? (
          <table className="economic-data__table" aria-label="Economic calendar">
            <thead>
              <tr>
                <th scope="col" className="economic-data__head economic-data__head--event">Event</th>
                <th scope="col" className="economic-data__head economic-data__head--value">Act</th>
                <th scope="col" className="economic-data__head economic-data__head--value">Est</th>
                <th scope="col" className="economic-data__head economic-data__head--value economic-data__head--change">Chg.</th>
              </tr>
            </thead>
            <tbody>
              {dayGroups.map((group) => (
                <Fragment key={group.label}>
                  <tr className="economic-data__dayRow">
                    <th colSpan={4} scope="colgroup" className="economic-data__dayLabel">
                      {group.label}
                    </th>
                  </tr>
                  {group.events.map((event) => {
                    const kind = inferValueKind(event.event, event.actual, event.street);

                    return (
                      <tr key={event.id}>
                        <td className="economic-data__event">
                          {event.event}
                          <span className="economic-data__eventCountry"> ({event.country})</span>
                        </td>
                        <td className="economic-data__value economic-data__value--actual">
                          {formatValue(event.actual, kind)}
                        </td>
                        <td className="economic-data__value economic-data__value--street">
                          {formatValue(event.street, kind)}
                        </td>
                        <td className="economic-data__value economic-data__value--surprise">
                          <span className={`economic-data__surprise economic-data__surprise--${getChangeTone(event.surprise)}`}>
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
          <div className="economic-data__empty">
            <p className="economic-data__emptyTitle">No releases on file for {selectedItem.rangeLabel}</p>
            {ECONOMIC_COVERAGE ? (
              <p className="economic-data__emptyHint">
                Calendar coverage runs {formatDayMonthYear(ECONOMIC_COVERAGE.from)} to{" "}
                {formatDayMonthYear(ECONOMIC_COVERAGE.to)}.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </PanelShell>
  );
}
