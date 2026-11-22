import { parseCsvRows, parseNumberCell } from "../utils/csv";
import { formatDayMonthYear, formatWeekRange, getWeekFridayUtc } from "../utils/dates";

export type EconomicEvent = {
  id: string;
  /** ISO date (`YYYY-MM-DD`) of the release. */
  date: string;
  sortDate: number;
  country: string;
  event: string;
  actual: number | null;
  street: number | null;
  surprise: number | null;
};

export type EconomicWeekEntry = {
  id: string;
  /** UTC-midnight timestamp of the week's Friday. */
  sortDate: number;
  dateLabel: string;
  rangeLabel: string;
  events: EconomicEvent[];
};

/** `economic-calendar.csv` has a header row: date,country,event,actual,street,surprise. */
function parseEconomicEvents(rawCsv: string): EconomicEvent[] {
  const [header, ...rows] = parseCsvRows(rawCsv);
  if (!header) return [];

  const column = (name: string) => header.indexOf(name);
  const columns = {
    date: column("date"),
    country: column("country"),
    event: column("event"),
    actual: column("actual"),
    street: column("street"),
    surprise: column("surprise"),
  };

  const events: EconomicEvent[] = [];

  rows.forEach((cells, rowIndex) => {
    const date = cells[columns.date] ?? "";
    const event = cells[columns.event] ?? "";
    const sortDate = Date.parse(`${date}T00:00:00Z`);
    if (Number.isNaN(sortDate) || !event) return;

    events.push({
      id: `${date}-${rowIndex}`,
      date,
      sortDate,
      country: cells[columns.country] || "US",
      event,
      actual: parseNumberCell(cells[columns.actual]),
      street: parseNumberCell(cells[columns.street]),
      surprise: parseNumberCell(cells[columns.surprise]),
    });
  });

  return events.sort((a, b) => a.sortDate - b.sortDate || a.event.localeCompare(b.event));
}

function groupByWeek(events: EconomicEvent[]) {
  const weeks = new Map<number, EconomicWeekEntry>();

  // Events arrive sorted, so each week's list is already in release order.
  for (const event of events) {
    const weekFriday = getWeekFridayUtc(event.sortDate);
    let week = weeks.get(weekFriday);
    if (!week) {
      const dateLabel = formatDayMonthYear(weekFriday);
      week = {
        id: dateLabel,
        sortDate: weekFriday,
        dateLabel,
        rangeLabel: formatWeekRange(weekFriday),
        events: [],
      };
      weeks.set(weekFriday, week);
    }
    week.events.push(event);
  }

  return weeks;
}

const economicCalendarCsv = import.meta.glob("../content/econcalendar/economic-calendar.csv", {
  eager: true,
  import: "default",
  query: "?raw",
});

const ECONOMIC_EVENTS = parseEconomicEvents(Object.values(economicCalendarCsv).join("\n"));

/** Calendar weeks keyed by the UTC timestamp of their Friday. */
export const ECONOMIC_WEEKS_BY_FRIDAY = groupByWeek(ECONOMIC_EVENTS);

/** First and last release dates on file, for telling visitors what the calendar covers. */
export const ECONOMIC_COVERAGE =
  ECONOMIC_EVENTS.length > 0
    ? { from: ECONOMIC_EVENTS[0].sortDate, to: ECONOMIC_EVENTS[ECONOMIC_EVENTS.length - 1].sortDate }
    : null;
